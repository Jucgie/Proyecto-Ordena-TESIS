import api from "./api";

export async function getNotificacionesUsuario() {
  const res = await api.get("/usuario-notificaciones/");
  return res.data;
}

export async function marcarLeida(id_ntf_us: number) {
  await api.patch(`/usuario-notificaciones/${id_ntf_us}/`, { leida: true });
}

export async function eliminarNotificacion(id_ntf_us: number) {
  await api.delete(`/usuario-notificaciones/${id_ntf_us}/`);
}