// Utilidad para formatear fechas a la zona horaria de Chile
export function formatFechaChile(fechaIsoString: string) {
  if (!fechaIsoString) return '-';
  const fecha = new Date(fechaIsoString);
  return fecha.toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
} 