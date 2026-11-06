const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
const details = b => `${escape(b.name)} · ${escape(b.date.split('-').reverse().join('/'))} · ${b.guests} personas · ${b.service === 'comida' ? 'Comida' : 'Cena'}`;
const page = (title, content, status = 200) => new Response(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} · Patio El Cordobés</title><style>body{margin:0;background:#f8f6f0;color:#292d29;font:17px/1.6 system-ui}main{max-width:600px;margin:12vh auto;padding:32px}h1{font:48px/1.1 Georgia}button,a.button{background:#123f54;color:white;border:0;padding:16px 24px;font:inherit;cursor:pointer}p{overflow-wrap:anywhere}</style><main><p>PATIO EL CORDOBÉS · RESERVAS</p><h1>${title}</h1>${content}</main></html>`, { status, headers: {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"} });

export async function sendEmail(env, message, idempotencyKey) {
  const response = await (env.fetch || fetch)('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: env.RESEND_FROM, ...message }), signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return response.json();
}

export async function handleBookings(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/bookings' && url.pathname !== '/reservas/confirmar') return null;
  const confirmation = url.pathname === '/reservas/confirmar';
  if (!env.RESEND_API_KEY || !env.RESEND_FROM || !env.DB || !env.BOOKING_BASE_URL) {
    return confirmation ? page('Servicio no disponible', '<p>No se ha confirmado la reserva. Inténtalo más tarde.</p>', 503) : json({error:'email_unavailable'},503);
  }
  if (request.method === 'POST' && request.headers.get('origin') !== new URL(env.BOOKING_BASE_URL).origin) return json({error:'invalid_origin'},403);
  try {
    if (!confirmation) {
      if (request.method !== 'POST') return json({error:'method_not_allowed'},405);
      if (!request.headers.get('content-type')?.includes('application/json')) return json({error:'invalid_request'},415);
      const raw = await request.text();
      if (raw.length > 4096) return json({error:'invalid_request'},413);
      let data; try { data = JSON.parse(raw); } catch { return json({error:'invalid_request'},400); }
      if (!data || typeof data !== 'object') return json({error:'invalid_request'},400);
      const {name,email,date,service,guests,requestId,website} = data;
      if (website) return json({error:'invalid_request'},400);
      const dateValue = typeof date === 'string' ? new Date(`${date}T12:00:00Z`) : new Date(NaN);
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100 || /[\r\n]/.test(name) ||
          typeof email !== 'string' || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
          typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+dateValue) || dateValue.toISOString().slice(0,10) !== date || date < today() || +dateValue > Date.now()+366*86400000 ||
          !Number.isInteger(guests) || guests < 1 || guests > 30 || !['comida','cena'].includes(service) ||
          typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(requestId)) return json({error:'invalid_fields'},400);
      if ([1,2,3].includes(dateValue.getUTCDay())) return json({error:'closed_day'},400);
      const now = Date.now();
      let booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(requestId).first();
      if (booking && (booking.email !== email.trim().toLowerCase() || booking.name !== name.trim() || booking.date !== date || booking.guests !== guests || booking.service !== service)) return json({error:'request_conflict'},409);
      if (booking?.owner_sent) return json({ok:true,status:'pending'});
      // Derive an unguessable token from a server-only secret and the random request ID.
      const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(env.BOOKING_TOKEN_SECRET || env.RESEND_API_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
      const token = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(requestId))), b=>b.toString(16).padStart(2,'0')).join('');
      if (!booking) {
        const recent = await env.DB.prepare('SELECT COUNT(*) AS count FROM bookings WHERE email = ? AND created_at > ?').bind(email.trim().toLowerCase(),now-3600000).first();
        const total = await env.DB.prepare('SELECT COUNT(*) AS count FROM bookings WHERE created_at > ?').bind(now-3600000).first();
        if (recent.count >= 3 || total.count >= 100) return json({error:'rate_limited'},429);
        await env.DB.prepare('INSERT OR IGNORE INTO bookings (id,token_hash,name,email,date,guests,service,language,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(requestId,await hash(token),name.trim(),email.trim().toLowerCase(),date,guests,service,data.language==='en'?'en':'es',now,now+7*86400000).run();
        booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(requestId).first();
      }
      const link = `${env.BOOKING_BASE_URL.replace(/\/$/,'')}/reservas/confirmar?token=${token}`;
      await sendEmail(env, {to:[env.BOOKING_OWNER_EMAIL || 'Leviturjeman@gmail.com'],reply_to:booking.email,subject:`Nueva reserva · ${booking.date} · ${guests} personas`,html:`<h1>Nueva solicitud de reserva</h1><p>${details(booking)}</p><p>Email del cliente: ${escape(booking.email)}</p><p>La reserva está pendiente de tu aprobación.</p><p><a href="${escape(link)}">Revisar y confirmar reserva</a></p><p>Este enlace es privado y caduca en 7 días. Al confirmar se enviará un correo al cliente.</p>`,text:`Nueva solicitud: ${booking.name}, ${booking.date}, ${guests} personas, ${service}. Cliente: ${booking.email}. Revisar y confirmar: ${link}`},`owner-${requestId}`);
      await env.DB.prepare('UPDATE bookings SET owner_sent = 1 WHERE id = ?').bind(requestId).run();
      return json({ok:true,status:'pending'});
    }
    if (!['GET','POST'].includes(request.method)) return page('Método no permitido','',405);
    const token = url.searchParams.get('token');
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return page('Enlace no válido','<p>Abre el enlace original del correo.</p>',404);
    const booking = await env.DB.prepare('SELECT * FROM bookings WHERE token_hash = ?').bind(await hash(token)).first();
    if (!booking) return page('Enlace no válido','<p>Abre el enlace original del correo.</p>',404);
    if (booking.customer_sent) return page('Reserva confirmada',`<p>${details(booking)}</p><p>Ya se ha enviado el correo de confirmación al cliente.</p>`);
    if (booking.expires_at < Date.now() || booking.date < today()) return page('Enlace caducado','<p>No se ha enviado ninguna confirmación. Contacta con el cliente para gestionar su solicitud.</p>',410);
    const form = `<p>${details(booking)}</p><p>${escape(booking.email)}</p><form method="post"><button type="submit">Confirmar reserva y avisar al cliente</button></form>`;
    if (request.method === 'GET') return page('Confirmar esta reserva',form);
    const now = Date.now();
    const lock = await env.DB.prepare('UPDATE bookings SET sending_at = ? WHERE id = ? AND customer_sent = 0 AND (sending_at IS NULL OR sending_at < ?)').bind(now,booking.id,now-60000).run();
    if (!lock.meta.changes) return page('Confirmación en curso','<p>Espera unos segundos y vuelve a abrir este enlace.</p>',409);
    try {
      const english = booking.language === 'en';
      const thanks = english ? `Thank you for your booking, ${escape(booking.name)}!` : `¡Muchas gracias por tu reserva, ${escape(booking.name)}!`;
      const message = english ? `Your table at Patio El Cordobés is confirmed for ${booking.date}, for ${booking.guests} guests (${booking.service==='comida'?'lunch':'dinner'}). We look forward to welcoming you!` : `Tu reserva en Patio El Cordobés está confirmada para el ${booking.date.split('-').reverse().join('/')}, para ${booking.guests} personas, en el servicio de ${booking.service}. ¡Te esperamos en el patio!`;
      await sendEmail(env,{to:[booking.email],reply_to:env.BOOKING_OWNER_EMAIL || 'Leviturjeman@gmail.com',subject:english?'Your booking is confirmed · Patio El Cordobés':'Tu reserva está confirmada · Patio El Cordobés',html:`<h1>${thanks}</h1><p>${message}</p><p>${english?'For any changes, reply to this email.':'Si necesitas hacer algún cambio, responde a este correo.'}</p>`,text:message},`confirmed-${booking.id}`);
      await env.DB.prepare('UPDATE bookings SET confirmed_at = ?, customer_sent = 1, sending_at = NULL WHERE id = ?').bind(now,booking.id).run();
      return page('Reserva confirmada',`<p>${details(booking)}</p><p>Se ha enviado la confirmación a ${escape(booking.email)}.</p>`);
    } catch {
      await env.DB.prepare('UPDATE bookings SET sending_at = NULL WHERE id = ?').bind(booking.id).run();
      return page('No se pudo enviar el correo',`<p>El cliente todavía no ha recibido la confirmación. Puedes volver a intentarlo.</p>${form}`,502);
    }
  } catch {
    return confirmation ? page('No se pudo completar la operación','<p>Vuelve a abrir el enlace para intentarlo de nuevo.</p>',502) : json({error:'send_failed'},502);
  }
}
