(() => {
  const form = document.querySelector('#booking-form');
  if (!form) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'booking-dialog';
  dialog.setAttribute('aria-labelledby','booking-title');
  const en = document.documentElement.lang === 'en';
  dialog.innerHTML = '<button type="button" class="booking-close" data-es="Cerrar" data-en="Close">'+(en?'Close':'Cerrar')+'</button><h2 id="booking-title" data-es="Reserva tu mesa" data-en="Book your table">'+(en?'Book your table':'Reserva tu mesa')+'</h2>';
  const launch = document.createElement('button');
  launch.type='button';launch.className='button';launch.dataset.es='Solicitar reserva';launch.dataset.en='Request a booking';launch.textContent=en?launch.dataset.en:launch.dataset.es;
  form.replaceWith(launch);dialog.append(form);document.body.append(dialog);
  let opener;
  function openBooking(trigger){
    if(dialog.open)return;
    opener=trigger;
    document.querySelector('.header')?.classList.remove('open');
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
    dialog.showModal();document.documentElement.classList.add('booking-open');
  }
  launch.addEventListener('click',()=>openBooking(launch));
  document.querySelectorAll('a[href$="#reservar"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();openBooking(link)}));
  dialog.querySelector('.booking-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
  dialog.addEventListener('close',()=>{document.documentElement.classList.remove('booking-open');opener?.focus({preventScroll:true})});
  if(location.hash==='#reservar'){history.replaceState(null,'',location.pathname+location.search);openBooking(launch)}
  const dateParts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  form.elements.date.min = dateParts;
  const max = new Date(Date.now()+365*86400000);
  form.elements.date.max = max.toISOString().slice(0,10);
  let requestId = crypto.randomUUID(), submitted = false, busy = false;
  form.addEventListener('input', () => { if (submitted) { requestId=crypto.randomUUID(); submitted=false; } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const en = document.documentElement.lang === 'en';
    const status = form.querySelector('.booking-status'), button = form.querySelector('[type="submit"]');
    const label = button.querySelector('[data-es]');
    const data = Object.fromEntries(new FormData(form));
    data.guests = Number(data.guests); data.requestId=requestId; data.language=en?'en':'es';
    busy = true; submitted=true; button.disabled=true; form.setAttribute('aria-busy','true');
    status.hidden=false; status.dataset.error='false';
    status.textContent=en?'Sending your request…':'Enviando tu solicitud…';
    try {
      const response = await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(25000)});
      const result = await response.json();
      if (!response.ok || !result.ok) {
        if(response.status===429) throw Error(en?'Too many requests. Please try again later.':'Has enviado varias solicitudes. Vuelve a intentarlo más tarde.');
        throw Error(en?'We could not send your request. Your booking is not confirmed. Please try again.':'No hemos podido enviar la solicitud. Tu reserva no está confirmada. Vuelve a intentarlo.');
      }
      status.textContent=en?'Request sent. Your booking is pending confirmation. We will email you when our team confirms it.':'Solicitud enviada. Tu reserva está pendiente de confirmación. Te avisaremos por correo cuando el equipo la confirme.';
      form.reset(); requestId=crypto.randomUUID(); submitted=false;
    } catch (error) {
      status.dataset.error='true';
      status.textContent=error.name==='TimeoutError' || error instanceof TypeError ? (en?'We could not check the delivery. Please retry; your request will not be duplicated.':'No hemos podido comprobar el envío. Vuelve a intentarlo; tu solicitud no se duplicará.') : error.message;
    } finally { busy=false; button.disabled=false; form.removeAttribute('aria-busy'); status.focus(); }
  });
})();
