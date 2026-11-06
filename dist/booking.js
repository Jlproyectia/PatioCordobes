(() => {
  const form = document.querySelector('#booking-form');
  if (!form) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'booking-dialog';
  dialog.setAttribute('aria-labelledby','booking-title');
  const en = document.documentElement.lang === 'en';
  dialog.innerHTML = '<button type="button" class="booking-close" data-es="Cerrar" data-en="Close">'+(en?'Close':'Cerrar')+'</button><h2 data-content-text="booking-title" id="booking-title" data-es="Reserva tu mesa" data-en="Book your table">'+(en?'Book your table':'Reserva tu mesa')+'</h2>';
  const launch = document.createElement('button');
  launch.dataset.contentText='booking-launch';launch.type='button';launch.className='button';launch.dataset.es='Solicitar reserva';launch.dataset.en='Request a booking';launch.textContent=en?launch.dataset.en:launch.dataset.es;
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
  document.querySelectorAll('a[href$="#reservar"]').forEach(link=>link.addEventListener('click',event=>{if(link.getAttribute('href').endsWith('#reservar')){event.preventDefault();openBooking(link)}}));
  dialog.querySelector('.booking-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
  dialog.addEventListener('close',()=>{document.documentElement.classList.remove('booking-open');opener?.focus({preventScroll:true})});
  if(location.hash==='#reservar'){history.replaceState(null,'',location.pathname+location.search);openBooking(launch)}
  const dateParts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  form.elements.date.min = dateParts;
  const max = new Date(Date.now()+365*86400000);
  form.elements.date.max = max.toISOString().slice(0,10);
  const dateInput=form.elements.date;
  let schedule=null;
  const dayOf=value=>new Date(value+'T12:00:00Z').getUTCDay();
  const isAvailable=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&value>=dateInput.min&&value<=dateInput.max&&(schedule?!schedule.days.find(d=>d.day===dayOf(value))?.closed&&!schedule.closedDates.includes(value):[0,4,5,6].includes(dayOf(value)));
  const language=()=>document.documentElement.lang==='en'?'en':'es';
  dateInput.type='hidden';
  const dateLabel=dateInput.parentElement.querySelector('span');dateLabel.id='booking-date-label';
  const dateButton=document.createElement('button');dateButton.type='button';dateButton.className='booking-date-button';dateButton.id='booking-date-button';dateButton.setAttribute('aria-labelledby','booking-date-label booking-date-button');dateButton.setAttribute('aria-expanded','false');dateButton.setAttribute('aria-controls','booking-calendar');dateInput.after(dateButton);
  const calendar=document.createElement('div');calendar.id='booking-calendar';calendar.className='booking-calendar';calendar.hidden=true;calendar.setAttribute('role','group');calendar.setAttribute('aria-labelledby','calendar-month');
  form.querySelector('.service').before(calendar);
  const hint=document.createElement('p');hint.className='calendar-hint';hint.id='booking-date-hint';hint.dataset.es='Lunes, martes y miércoles: cerrado.';hint.dataset.en='Closed Monday, Tuesday and Wednesday.';hint.textContent=hint.dataset[language()];calendar.after(hint);dateButton.setAttribute('aria-describedby',hint.id);
  let month=new Date(dateInput.min+'T12:00:00Z');month.setUTCDate(1);
  const iso=d=>d.toISOString().slice(0,10);
  const updateDateLabel=()=>{dateButton.textContent=dateInput.value?new Intl.DateTimeFormat(language(),{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(dateInput.value+'T12:00:00Z')):(language()==='en'?'Choose date':'Elegir fecha')};
  function closeCalendar(){calendar.hidden=true;dateButton.setAttribute('aria-expanded','false')}
  function renderCalendar(){
    const en=language()==='en',year=month.getUTCFullYear(),m=month.getUTCMonth();
    calendar.replaceChildren();
    const head=document.createElement('div');head.className='calendar-head';
    const title=document.createElement('strong');title.id='calendar-month';title.setAttribute('aria-live','polite');title.textContent=new Intl.DateTimeFormat(language(),{month:'long',year:'numeric',timeZone:'UTC'}).format(month);
    function nav(offset,label){const b=document.createElement('button');b.type='button';b.textContent=label;const target=new Date(Date.UTC(year,m+offset,1,12));b.disabled=offset<0?iso(new Date(Date.UTC(year,m,0,12)))<dateInput.min:iso(target)>dateInput.max;b.addEventListener('click',()=>{month=target;renderCalendar();calendar.querySelector(offset<0?'.calendar-head button:first-child':'.calendar-head button:last-child').focus()});return b}
    head.append(nav(-1,en?'Previous':'Anterior'),title,nav(1,en?'Next':'Siguiente'));calendar.append(head);
    const grid=document.createElement('div');grid.className='calendar-days';
    (en?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['L','M','X','J','V','S','D']).forEach(day=>{const cell=document.createElement('span');cell.textContent=day;cell.className='calendar-weekday';grid.append(cell)});
    const offset=(month.getUTCDay()+6)%7;
    for(let i=0;i<offset;i++){const empty=document.createElement('span');empty.setAttribute('aria-hidden','true');grid.append(empty)}
    const total=new Date(Date.UTC(year,m+1,0)).getUTCDate();
    for(let day=1;day<=total;day++){
      const d=new Date(Date.UTC(year,m,day,12)),value=iso(d),button=document.createElement('button');button.type='button';button.textContent=String(day);button.dataset.date=value;button.disabled=!isAvailable(value);button.setAttribute('aria-pressed',String(dateInput.value===value));
      const label=new Intl.DateTimeFormat(language(),{dateStyle:'full',timeZone:'UTC'}).format(d);button.setAttribute('aria-label',label+(!isAvailable(value)?(en?' — closed':' — cerrado'):''));
      if(value===dateParts)button.setAttribute('aria-current','date');
      button.addEventListener('click',()=>{if(!isAvailable(value))return;dateInput.value=value;dateInput.dispatchEvent(new Event('input',{bubbles:true}));updateDateLabel();closeCalendar();dateButton.focus()});grid.append(button);
    }
    calendar.append(grid);
  }
  dateButton.addEventListener('click',()=>{if(!calendar.hidden){closeCalendar();return}if(dateInput.value)month=new Date(dateInput.value.slice(0,7)+'-01T12:00:00Z');renderCalendar();calendar.hidden=false;dateButton.setAttribute('aria-expanded','true');calendar.querySelector('.calendar-days button:not(:disabled)')?.focus()});
  calendar.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeCalendar();dateButton.focus()}});
  form.addEventListener('reset',()=>{setTimeout(updateDateLabel,0);closeCalendar()});dialog.addEventListener('close',closeCalendar);
  new MutationObserver(()=>{updateDateLabel();if(!calendar.hidden)renderCalendar()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});updateDateLabel();

  let requestId = crypto.randomUUID(), submitted = false, busy = false;
  form.addEventListener('input', () => { if (submitted) { requestId=crypto.randomUUID(); submitted=false; } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (!isAvailable(dateInput.value)) {
      const status=form.querySelector('.booking-status');status.hidden=false;status.dataset.error='true';status.textContent=language()==='en'?'Choose an available date, Thursday to Sunday.':'Elige una fecha disponible, de jueves a domingo.';dateButton.focus();if(calendar.hidden)dateButton.click();return;
    }
    if (!form.reportValidity()) return;
    const en = document.documentElement.lang === 'en';
    const status = form.querySelector('.booking-status'), button = form.querySelector('[type="submit"]');
    const label = button.querySelector('[data-es]');
    const data = Object.fromEntries(new FormData(form));
    data.guests = Number(data.guests); data.requestId=requestId; data.language=en?'en':'es';
    busy = true; submitted=true; button.disabled=true; form.setAttribute('aria-busy','true');
    status.hidden=false; status.dataset.error='false';
    status.textContent=en?'Sending your request…':'Enviando tu solicitud…';
    try {
      const response = await fetch('/api/app?action=bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(25000)});
      const result = await response.json();
      if (!response.ok || !result.ok) {
        if(response.status===429) throw Error(en?'Too many requests. Please try again later.':'Has enviado varias solicitudes. Vuelve a intentarlo más tarde.');
        throw Error(en?'We could not send your request. Your booking is not confirmed. Please try again.':'No hemos podido enviar la solicitud. Tu reserva no está confirmada. Vuelve a intentarlo.');
      }
      status.textContent=en?'Request saved. Your booking is pending confirmation by our team.':'Solicitud guardada. Tu reserva está pendiente de confirmación del equipo.';
      form.reset(); requestId=crypto.randomUUID(); submitted=false;
    } catch (error) {
      status.dataset.error='true';
      status.textContent=error.name==='TimeoutError' || error instanceof TypeError ? (en?'We could not check the delivery. Please retry; your request will not be duplicated.':'No hemos podido comprobar el envío. Vuelve a intentarlo; tu solicitud no se duplicará.') : error.message;
    } finally { busy=false; button.disabled=false; form.removeAttribute('aria-busy'); status.focus(); }
  });

  function updateSchedule(site){if(!site?.schedule)return;schedule=site.schedule;hint.dataset.es='Selecciona uno de los días disponibles en el calendario.';hint.dataset.en='Choose an available day in the calendar.';hint.textContent=hint.dataset[language()];if(dateInput.value&&!isAvailable(dateInput.value))dateInput.value='';updateDateLabel();renderCalendar();updateServices();}
  function updateServices(){const slots=dateInput.value&&schedule?schedule.days.find(d=>d.day===dayOf(dateInput.value)).slots:null;for(const option of form.elements.service.options)option.disabled=slots?!slots.some(s=>s.service===option.value):false;if(form.elements.service.selectedOptions[0]?.disabled)form.elements.service.value=[...form.elements.service.options].find(o=>!o.disabled)?.value||'';}
  dateInput.addEventListener('input',updateServices);window.addEventListener('sitecontent',e=>updateSchedule(e.detail));window.patioSiteReady?.then(updateSchedule);
})();
