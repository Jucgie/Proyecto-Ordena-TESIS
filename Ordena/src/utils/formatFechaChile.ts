export function formatFechaChile(fechaIsoString: string) {
  if (!fechaIsoString) return '-';
  // Si la fecha viene en formato 'YYYY-MM-DD HH:mm:ss', conviértela a ISO
  let fechaStr = fechaIsoString;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(fechaIsoString)) {
    fechaStr = fechaIsoString.replace(' ', 'T');
  }
  // Ya no forzamos Z ni restamos horas, porque el backend ahora envía ISO 8601 con zona
  const fecha = new Date(fechaStr);
  const dtf = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return dtf.format(fecha);
}