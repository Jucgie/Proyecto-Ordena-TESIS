import api from "./api";

export async function getNotificaciones() {
  const res = await api.get("/notificaciones/");
  return res.data;
}

export async function marcarLeida(id: number) {
  await api.patch(`/notificaciones/${id}/leer/`);
}