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

const iconByType = {
  info: <InfoIcon color="info" />,
  warning: <WarningIcon color="warning" />,
  error: <ErrorIcon color="error" />,
  success: <CheckCircleIcon color="success" />,
};

export default function NotificationCenter() {
  const { notificaciones, fetchNotificaciones, marcarComoLeida } = useNotificationStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotificaciones();
    // Opcional: polling cada 60s
    // const interval = setInterval(fetchNotificaciones, 60000);
    // return () => clearInterval(interval);
  }, [fetchNotificaciones]);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

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
          <List>
            {notificaciones.length === 0 && (
              <Typography sx={{ color: "#888", textAlign: "center", mt: 4 }}>
                No hay notificaciones.
              </Typography>
            )}
            {notificaciones.map(n => (
              <ListItem
                key={n.id_ntf}
                sx={{
                  bgcolor: n.leida ? "#232323" : "#FFD70022",
                  borderRadius: 2,
                  mb: 1,
                  alignItems: "flex-start",
                  boxShadow: n.leida ? "none" : "0 2px 8px #FFD70033",
                }}
              >
                <ListItemIcon sx={{ mt: 0.5 }}>
                  {iconByType[n.tipo] || <InfoIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ color: n.leida ? "#fff" : "#FFD700", fontWeight: n.leida ? 400 : 700 }}>
                      {n.nombre_ntf}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="span" sx={{ color: "#ccc", fontSize: 14 }}>{n.descripcion}</Typography>
                      <Typography component="span" sx={{ color: "#888", fontSize: 12, mt: 0.5 }}>
                        {n.fecha_hora_ntd &&
                          formatFechaChile(n.fecha_hora_ntd)}
                      </Typography>
                      {n.link && (
                        <Button
                          size="small"
                          sx={{ mt: 1, color: "#2196F3" }}
                          href={n.link}
                          target="_blank"
                        >
                          Ir a acción
                        </Button>
                      )}
                      {!n.leida && (
                        <React.Fragment>
                          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                            <Button
                              size="small"
                              variant="text"
                              sx={{ color: "#FFD700", minWidth: 0, fontSize: 12, px: 1, py: 0.5 }}
                              onClick={() => marcarComoLeida(n.id_ntf)}
                            >
                              Marcar como leída
                            </Button>
                          </Box>
                        </React.Fragment>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}