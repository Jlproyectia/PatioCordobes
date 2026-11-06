export const defaultSchedule = {
  version: 1,
  days: [
    {day:0,closed:false,slots:[{start:'12:00',end:'18:00',service:'comida'}]},
    {day:1,closed:true,slots:[]},{day:2,closed:true,slots:[]},{day:3,closed:true,slots:[]},
    {day:4,closed:false,slots:[{start:'20:00',end:'00:00',service:'cena'}]},
    {day:5,closed:false,slots:[{start:'10:30',end:'17:00',service:'comida'},{start:'19:00',end:'02:00',service:'cena'}]},
    {day:6,closed:false,slots:[{start:'12:00',end:'17:00',service:'comida'}]}
  ],closedDates:[]
};
export const scheduleOf = state => state.schedule || defaultSchedule;
export function validateSchedule(value) {
  const invalid=()=>{const error=new Error('Revisa los días, servicios y horas del horario.');error.status=400;throw error;};
  if(!value||!Array.isArray(value.days)||value.days.length!==7||!Array.isArray(value.closedDates)||value.closedDates.length>366)invalid();
  const days=Array.from({length:7},(_,day)=>{
    const rows=value.days.filter(d=>d.day===day);if(rows.length!==1)invalid();const row=rows[0];
    if(typeof row.closed!=='boolean'||!Array.isArray(row.slots)||row.slots.length>3||(!row.closed&&!row.slots.length))invalid();
    const slots=row.slots.map(slot=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.end)||slot.start===slot.end||!['comida','cena'].includes(slot.service))invalid();return {start:slot.start,end:slot.end,service:slot.service};});
    return {day,closed:row.closed,slots};
  });
  const closedDates=[...new Set(value.closedDates)];for(const date of closedDates){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(+new Date(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)invalid();}
  return {days,closedDates};
}
