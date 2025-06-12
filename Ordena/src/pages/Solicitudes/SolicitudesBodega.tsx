import React, { useState, useMemo } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox
} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useBodegaStore } from "../../store/useBodegaStore";

import { generarOCI } from "../../utils/pdf/generarOCI";
import { useAuthStore } from "../../store/useAuthStore";

export default function SolicitudesBodega() {
    const {
        solicitudes,
        setSolicitudes,
        addPedido,
        setTransferencias,
        addSolicitudesTransferidas,
    } = useBodegaStore();
    const usuario = useAuthStore(state => state.usuario);
    const [modalOpen, setModalOpen] = useState(false);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);

    

    // Estado para checks
    const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
    // Estado local para cambios antes de confirmar
    const [cambios, setCambios] = useState<Record<number, "aprobada" | "denegada" | undefined>>({});

    const solicitudesFiltradas = useMemo(
    () => Array.isArray(solicitudes) ? solicitudes : [],
    [solicitudes]
    );


    // Selección de solicitudes (siempre pueden seleccionarse)
    const handleCheck = (id: number) => {
        setSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleCheckAll = (checked: boolean) => {
        if (checked) {
            setSeleccionadas(solicitudesFiltradas.map(s => s.id));
        } else {
            setSeleccionadas([]);
        }
    };

    // Marcar acción localmente (sin cambiar el estado real hasta confirmar)
    const handleAccion = (tipo: "aprobada" | "denegada") => {
        const nuevosCambios = { ...cambios };
        seleccionadas.forEach(id => {
            nuevosCambios[id] = tipo;
        });
        setCambios(nuevosCambios);
    };

    const handleConfirmar = () => {
        setSolicitudes(prev =>
            prev.map(s =>
                cambios[s.id]
                    ? { ...s, estado: cambios[s.id] }
                    : s
            )
        );

        let transferidasArr: any[] = [];
        seleccionadas.forEach(id => {
            if (cambios[id] === "aprobada") {
                const solicitud = solicitudes.find(s => s.id === id);
                if (solicitud) {
                    addPedido({
                        id: Date.now(),
                        fecha: solicitud.fecha,
                        responsable: usuario?.nombre || "Responsable Bodega",
                        productos: solicitud.productos,
                        estado: "En proceso",
                        sucursalDestino: solicitud.sucursal.id,
                        cantidad: solicitud.productos.reduce((acc, p) => acc + p.cantidad, 0),
                        bodega: usuario?.bodega?.nombre || "Bodega Central",
                        tipo: "salida"
                    });
                    transferidasArr.push(solicitud);
                }
            }
        });

        if (transferidasArr.length > 0) {
            addSolicitudesTransferidas(transferidasArr);
            setTransferencias(transferidasArr.length);
        }

        setCambios({});
        setSeleccionadas([]);
    };

    const handleOpenModal = (solicitud: any) => {
        setSolicitudSeleccionada(solicitud);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSolicitudSeleccionada(null);
    };

    // El botón de confirmar solo se habilita si hay al menos una solicitud seleccionada con cambio pendiente
    const hayCambios = seleccionadas.some(id => cambios[id]);

    return (
        <Layout>
            <div style={{ padding: "24px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        borderBottom: "1.5px solid #232323",
                        paddingBottom: "8px"
                    }}
                >
                    <h2 style={{ color: "#FFD700", margin: 0 }}>Solicitudes de sucursales</h2>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <Button
                            variant="contained"
                            startIcon={<CheckIcon />}
                            style={{
                                background: "#4CAF50",
                                color: "#fff",
                                fontWeight: 600
                            }}
                            disabled={seleccionadas.length === 0}
                            onClick={() => handleAccion("aprobada")}
                        >
                            Aceptar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<CloseIcon />}
                            style={{
                                background: "#FF4D4F",
                                color: "#fff",
                                fontWeight: 600
                            }}
                            disabled={seleccionadas.length === 0}
                            onClick={() => handleAccion("denegada")}
                        >
                            Denegar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DoneAllIcon />}
                            style={{
                                background: "#FFD700",
                                color: "#121212",
                                fontWeight: 600,
                                opacity: hayCambios ? 1 : 0.5
                            }}
                            disabled={!hayCambios}
                            onClick={handleConfirmar}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
                <TableContainer component={Paper} style={{ background: "#181818" }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={
                                            seleccionadas.length > 0 &&
                                            solicitudesFiltradas.every(s => seleccionadas.includes(s.id))
                                        }
                                        indeterminate={
                                            seleccionadas.length > 0 &&
                                            !solicitudesFiltradas.every(s => seleccionadas.includes(s.id))
                                        }
                                        onChange={e => handleCheckAll(e.target.checked)}
                                        sx={{ color: "#FFD700" }}
                                    />
                                </TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>ID</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Fecha</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Sucursal</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Responsable</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>N° de productos</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Estado</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {solicitudesFiltradas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" style={{ color: "#8A8A8A" }}>
                                        No hay solicitudes para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                solicitudesFiltradas.map((row: any) => (
                                    <TableRow key={row.id}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={seleccionadas.includes(row.id)}
                                                onChange={() => handleCheck(row.id)}
                                                sx={{ color: "#FFD700" }}
                                            />
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.id}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.fecha}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.sucursal}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.responsable}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc, prod) => acc + Number(prod.cantidad), 0)
                                                : 0}
                                        </TableCell>
                                        <TableCell style={{
                                            color:
                                                cambios[row.id] === "aprobada"
                                                    ? "#4CAF50"
                                                    : cambios[row.id] === "denegada"
                                                        ? "#FF4D4F"
                                                        : row.estado === "aprobada"
                                                            ? "#4CAF50"
                                                            : row.estado === "denegada"
                                                                ? "#FF4D4F"
                                                                : "#FFD700"
                                        }}>
                                            {cambios[row.id]
                                                ? cambios[row.id].charAt(0).toUpperCase() + cambios[row.id].slice(1) + " (sin confirmar)"
                                                : row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                style={{ borderColor: "#FFD700", color: "#FFD700", marginRight: 8 }}
                                                onClick={() => handleOpenModal(row)}
                                            >
                                                Ver detalles
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
                                                onClick={() => generarOCI(row)}
                                            >
                                                Ver OCI PDF
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Modal de detalles */}
                <Dialog open={modalOpen} onClose={handleCloseModal}>
                    <DialogTitle>Detalles de la solicitud</DialogTitle>
                    <DialogContent>
                        {solicitudSeleccionada ? (
                            <div>
                                <div><b>ID:</b> {solicitudSeleccionada.id}</div>
                                <div><b>Fecha:</b> {solicitudSeleccionada.fecha}</div>
                                <div><b>Sucursal:</b> {solicitudSeleccionada.sucursal}</div>
                                <div><b>Responsable:</b> {solicitudSeleccionada.responsable}</div>
                                <div><b>Observaciones:</b> {solicitudSeleccionada.observaciones || "Sin observaciones"}</div>
                                <div><b>Estado:</b> {solicitudSeleccionada.estado.charAt(0).toUpperCase() + solicitudSeleccionada.estado.slice(1)}</div>
                                <div style={{ marginTop: "12px" }}>
                                    <b>Productos solicitados:</b>
                                    <ul>
                                        {solicitudSeleccionada.productos.map((prod: any, idx: number) => (
                                            <li key={idx}>{prod.nombre} — {prod.cantidad}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : null}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal} style={{ color: "#FFD700" }}>Cerrar</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
}