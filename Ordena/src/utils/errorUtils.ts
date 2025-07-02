export function parseApiError(error: any): string | string[] {
  if (!error) return 'Error desconocido';
  let errorObj = error;
  if (error && typeof error === 'object' && error.error) {
    errorObj = error.error;
  }
  if (errorObj && typeof errorObj === 'object' && errorObj !== null) {
    const mensajes = Object.values(errorObj)
      .flat()
      .filter((m: any) => typeof m === 'string');
    if (mensajes.length === 1) {
      return mensajes[0];
    } else if (mensajes.length > 1) {
      return mensajes;
    } else {
      return JSON.stringify(errorObj);
    }
  } else if (typeof errorObj === 'string') {
    return errorObj;
  } else if (errorObj?.detail) {
    return errorObj.detail;
  }
  return 'Error desconocido';
} 