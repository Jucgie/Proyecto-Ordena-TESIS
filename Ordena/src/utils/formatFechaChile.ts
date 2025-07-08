export function formatFechaChile(fechaIsoString: string) {
  if (!fechaIsoString) return '-';
  // Si no tiene Z ni offset, agrégale Z (UTC)
  let fechaStr = fechaIsoString;
  if (!/Z$|([+-]\d{2}:?\d{2})$/.test(fechaIsoString)) {
    fechaStr += 'Z';
  }
  const fecha = new Date(fechaStr);
  return fecha.toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}