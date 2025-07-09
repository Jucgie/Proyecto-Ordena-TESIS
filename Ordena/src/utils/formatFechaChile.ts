export function formatFechaChile(fechaIsoString: string) {
  if (!fechaIsoString) return '-';
  let fechaStr = fechaIsoString;

  // Si la fecha viene en formato 'YYYY-MM-DD HH:mm:ss(.microsegundos)', conviértela a ISO y fuerza UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(fechaIsoString)) {
    fechaStr = fechaIsoString.replace(' ', 'T') + 'Z';
  }

  // Si la fecha viene como 'YYYY-MM-DDTHH:mm:ss(.microsegundos)' SIN Z ni zona, fuerza UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(fechaStr) && !fechaStr.endsWith('Z')) {
    fechaStr += 'Z';
  }

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