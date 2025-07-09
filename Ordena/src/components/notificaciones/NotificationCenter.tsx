import React, { useEffect, useState } from "react";
import { useNotificationStore } from "../../store/useNotificationStore";
import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  Badge, IconButton, Drawer, List, ListItem, ListItemText, ListItemIcon, Typography, Button, Box
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { formatFechaChile } from '../../utils/formatFechaChile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';

const iconByType = {
  info: <InfoIcon color="info" />,
  warning: <WarningIcon color="warning" />,
  error: <ErrorIcon color="error" />,
  success: <CheckCircleIcon color="success" />,
};

export default function NotificationCenter() {
  const { notificaciones, fetchNotificaciones, marcarComoLeida, eliminarNotificacion } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [verTodas, setVerTodas] = useState(false);

  useEffect(() => {
    fetchNotificaciones();
    // Opcional: polling cada 60s
    // const interval = setInterval(fetchNotificaciones, 60000);
    // return () => clearInterval(interval);
  }, [fetchNotificaciones]);

  const unreadCount = notificaciones.filter(n => !n.leida).length;
  const notificacionesFiltradas = verTodas ? notificaciones : notificaciones.filter(n => !n.leida);

  const marcarTodasComoLeidas = () => {
    notificacionesFiltradas.forEach(n => {
      if (!n.leida) marcarComoLeida(n.id_ntf_us);
    });
  };

  // Eliminar todas las notificaciones leídas
  const eliminarLeidas = () => {
    notificaciones.filter(n => n.leida).forEach(n => eliminarNotificacion(n.id_ntf_us));
  };

  return (
    <>
      <IconButton color="inherit" onClick={() => setOpen(true)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 350, p: 2, bgcolor: "#181818", height: "100%" }}>
          <Typography variant="h6" sx={{ color: "#FFD700", mb: 2 }}>
            Notificaciones
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={verTodas ? <VisibilityOffIcon /> : <VisibilityIcon />}
              sx={{ color: '#FFD700', borderColor: '#FFD700', fontWeight: 600 }}
              onClick={() => setVerTodas(v => !v)}
            >
              {verTodas ? 'Ocultar leídas' : 'Ver todas'}
            </Button>
            {notificacionesFiltradas.length > 0 && notificacionesFiltradas.some(n => !n.leida) && (
              <Button
                size="small"
                variant="contained"
                sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 600 }}
                onClick={marcarTodasComoLeidas}
              >
                Marcar todas como leídas
              </Button>
            )}
            {notificaciones.some(n => n.leida) && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<DeleteIcon />}
                sx={{ color: '#FF4D4F', borderColor: '#FF4D4F', fontWeight: 600 }}
                onClick={eliminarLeidas}
              >
                Eliminar leídas
              </Button>
            )}
          </Box>
          <List sx={{ maxHeight: 'calc(100vh - 120px)', height: '100%', overflowY: 'auto', pr: 1 }}>
            {notificacionesFiltradas.length === 0 && (
              <Typography sx={{ color: "#888", textAlign: "center", mt: 4 }}>
                {verTodas ? 'No hay notificaciones.' : 'No tienes notificaciones nuevas.'}
              </Typography>
            )}
            {notificacionesFiltradas.map(n => (
              <ListItem
                key={n.id_ntf_us}
                sx={{
                  bgcolor: n.leida ? "#232323" : "#FFD70022",
                  borderRadius: 2,
                  mb: 1,
                  alignItems: "flex-start",
                  boxShadow: n.leida ? "none" : "0 2px 8px #FFD70033",
                  position: 'relative',
                  '&:hover .delete-btn': { opacity: 1 },
                }}
              >
                <ListItemIcon sx={{ mt: 0.5 }}>
                  {iconByType[n.notificacion.tipo] || <InfoIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ color: n.leida ? "#fff" : "#FFD700", fontWeight: n.leida ? 400 : 700 }}>
                      {n.notificacion.nombre_ntf}
                    </Typography>
                  }
                  secondary={
                    <span>
                      <Typography component="span" sx={{ color: "#ccc", fontSize: 14, display: 'block' }}>{n.notificacion.descripcion}</Typography>
                      <Typography component="span" sx={{ color: "#888", fontSize: 12, mt: 0.5, display: 'block' }}>
                        {n.notificacion.fecha_hora_ntd ? formatFechaChile(n.notificacion.fecha_hora_ntd) : ''}
                      </Typography>
                      {n.notificacion.link && (
                        <Button
                          size="small"
                          sx={{ mt: 1, color: "#2196F3" }}
                          href={n.notificacion.link}
                          target="_blank"
                        >
                          Ir a acción
                        </Button>
                      )}
                      {!n.leida && (
                        <span style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <Button
                            size="small"
                            variant="text"
                            sx={{ color: "#FFD700", minWidth: 0, fontSize: 12, px: 1, py: 0.5 }}
                            onClick={() => marcarComoLeida(n.id_ntf_us)}
                          >
                            Marcar como leída
                          </Button>
                        </span>
                      )}
                    </span>
                  }
                />
                <IconButton
                  className="delete-btn"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: '#FF4D4F',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    zIndex: 2
                  }}
                  onClick={() => eliminarNotificacion(n.id_ntf_us)}
                  aria-label="Eliminar notificación"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}