import React, { useEffect, useState } from "react";
import { useProveedoresStore } from "../../store/useProveedorStore";
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
    Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert, Box, Button 
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import Layout from "../../components/layout/layout";
import RefreshIcon from '@mui/icons-material/Refresh';
import { generarActaRecepcion } from "../../utils/pdf/generarActaRecepcion";
import { informesService } from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

interface Proveedor {
    id_provd?: number;
    nombres_provd: string;
    direccion_provd: string;
    correo: string;
    razon_social: string;
    rut_empresa: string;
    ingresos?: any[];
}

export default function Proveedores() {
    const { 
        proveedores, 
        loading, 
        error, 
        fetchProveedores, 
        clearError 
    } = useProveedoresStore();

    const usuario = useAuthStore(state => state.usuario);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [generandoActa, setGenerandoActa] = useState<number | null>(null);

    // Cargar proveedores al montar el componente
    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores]);

    // Debug: verificar datos
    useEffect(() => {
        console.log('🔍 DEBUG - Proveedores cargados:', proveedores);
        console.log('🔍 DEBUG - Loading:', loading);
        console.log('🔍 DEBUG - Error:', error);
    }, [proveedores, loading, error]);

    // Limpiar error cuando se desmonte
    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    // Mostrar mensaje informativo si hay error específico de proveedor con pedidos
    useEffect(() => {
        if (error && error.includes('ya tiene pedidos asociados')) {
            setInfoMessage('Nota: Los proveedores con pedidos existentes no pueden ser modificados para preservar el historial. Para cambios, cree un nuevo proveedor con un RUT diferente.');
        } else {
            setInfoMessage(null);
        }
    }, [error]);

    // Función para generar y descargar acta de recepción
    const generarYDescargarActa = async (ingreso: any, proveedor: Proveedor) => {
        try {
            setGenerandoActa(ingreso.id);
            
            // Generar el PDF
            generarActaRecepcion({
                numeroActa: String(ingreso.id),
                fechaRecepcion: ingreso.fecha,
                sucursal: {
                    nombre: "Bodega Central",
                    direccion: "Camino a Penco 2500, Concepción"
                },
                personaRecibe: {
                    nombre: usuario?.nombre || "Responsable de Bodega",
                    cargo: "Responsable de Bodega"
                },
                productos: ingreso.productos.map((prod: any) => ({
                    codigo: `${prod.nombre}-${prod.marca}-${prod.categoria}`.replace(/\s+/g, "-").toLowerCase(),
                    descripcion: `${prod.nombre} - ${prod.marca} - ${prod.categoria}`,
                    cantidad: prod.cantidad
                })),
                observaciones: `${ingreso.observaciones}\nGuía: ${ingreso.num_guia_despacho || 'No especificada'}`,
                conformidad: "Recibido conforme",
                responsable: usuario?.nombre || "Responsable de Bodega",
                proveedor: {
                    nombre: proveedor.nombres_provd,
                    rut: proveedor.rut_empresa,
                    contacto: proveedor.direccion_provd
                }
            });

            // Crear registro en la base de datos
            console.log('🔍 DEBUG - Creando informe con usuario:', usuario);
            console.log('🔍 DEBUG - ID del usuario:', usuario?.id);
            
            const contenidoInforme = {
                ingreso_id: ingreso.id,
                proveedor: {
                    nombre: proveedor.nombres_provd,
                    rut: proveedor.rut_empresa,
                    contacto: proveedor.direccion_provd
                },
                fecha: ingreso.fecha,
                productos: ingreso.productos.map((prod: any) => ({
                    nombre: prod.nombre,
                    marca: prod.marca,
                    categoria: prod.categoria,
                    cantidad: prod.cantidad
                })),
                observaciones: ingreso.observaciones,
                num_guia_despacho: ingreso.num_guia_despacho,
                responsable: usuario?.nombre || "Responsable de Bodega"
            };
            
            const informeData = {
                titulo: `Acta de Recepción - ${proveedor.nombres_provd}`,
                descripcion: `Acta de recepción generada para el ingreso ${ingreso.id} del proveedor ${proveedor.nombres_provd}`,
                modulo_origen: 'proveedores',
                contenido: JSON.stringify(contenidoInforme),
                archivo_url: `ActaRecepcion_${ingreso.id}.pdf`,
                fecha_generado: new Date().toISOString(),
                pedidos_fk: ingreso.pedido_id,
                bodega_fk: usuario?.bodega || null,
                sucursal_fk: usuario?.sucursal || null
            };
            
            console.log('🔍 DEBUG - Datos del informe a enviar:', informeData);
            
            // Función para validar si ya existe un informe con el mismo título y módulo
            const existeInformeDuplicado = (titulo: string, modulo_origen: string) => {
                if (!Array.isArray(window.informesGlobal)) return false;
                return window.informesGlobal.some(
                    (inf: any) => inf.titulo === titulo && inf.modulo_origen === modulo_origen
                );
            };

            if (existeInformeDuplicado(informeData.titulo, informeData.modulo_origen)) {
                alert("Ya existe un informe con este título y módulo.");
                return;
            }

            await informesService.createInforme(informeData);
            if (typeof window.fetchInformes === 'function') window.fetchInformes();

        } catch (error) {
            console.error('Error al generar acta:', error);
        } finally {
            setGenerandoActa(null);
        }
    };

    if (loading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress style={{ color: "#FFD700" }} />
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ color: "#FFD700" }}>Proveedores registrados</h2>
                    <Button 
                        variant="outlined" 
                        onClick={fetchProveedores}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                        style={{ color: "#FFD700", borderColor: "#FFD700" }}
                    >
                        {loading ? 'Cargando...' : 'Recargar'}
                    </Button>
                </div>
                
                {error && (
                    <Alert severity="error" onClose={clearError} style={{ marginBottom: 16 }}>
                        {error}
                    </Alert>
                )}

                {infoMessage && (
                    <Alert severity="info" onClose={() => setInfoMessage(null)} style={{ marginBottom: 16 }}>
                        {infoMessage}
                    </Alert>
                )}

                {proveedores.length === 0 ? (
                    <div style={{ color: "#8A8A8A" }}>No hay proveedores registrados.</div>
                ) : (
                    <TableContainer component={Paper} style={{ background: "#232323" }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Proveedor</TableCell>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>RUT</TableCell>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Correo</TableCell>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Dirección</TableCell>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Último Ingreso</TableCell>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Total Ingresos</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {proveedores.map((proveedor: Proveedor) => (
                                    <TableRow key={proveedor.id_provd || proveedor.rut_empresa}>
                                        <TableCell style={{ color: "#fff" }}>{proveedor.nombres_provd}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{proveedor.rut_empresa}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{proveedor.correo}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{proveedor.direccion_provd}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {proveedor.ingresos?.[0]?.fecha || "Sin ingresos"}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {proveedor.ingresos?.length || 0} ingresos
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Sección de historial detallado */}
                {proveedores.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                        <h3 style={{ color: "#FFD700" }}>Historial de Ingresos por Proveedor</h3>
                        {proveedores.map((proveedor: Proveedor) => (
                            <Accordion key={proveedor.id_provd || proveedor.rut_empresa} sx={{ bgcolor: "#232323", color: "#fff", mb: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon style={{ color: "#FFD700" }} />}>
                                    <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                                        <span style={{ fontWeight: 600 }}>{proveedor.nombres_provd}</span>
                                        <span style={{ color: "#FFD700" }}>
                                            {proveedor.ingresos?.length || 0} ingresos
                                        </span>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {proveedor.ingresos && proveedor.ingresos.length > 0 ? (
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell style={{ color: "#FFD700" }}>Fecha</TableCell>
                                                        <TableCell style={{ color: "#FFD700" }}>N° Guía Despacho</TableCell>
                                                        <TableCell style={{ color: "#FFD700" }}>Acta de Recepción</TableCell>
                                                        <TableCell style={{ color: "#FFD700" }}>Observaciones</TableCell>
                                                        <TableCell style={{ color: "#FFD700" }}>Productos</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {proveedor.ingresos.map((ing: any, index: number) => (
                                                        <TableRow key={index}>
                                                            <TableCell style={{ color: "#fff" }}>{ing.fecha}</TableCell>
                                                            <TableCell style={{ color: "#fff" }}>{ing.num_guia_despacho || "-"}</TableCell>
                                                            <TableCell style={{ color: "#fff" }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={generandoActa === ing.id ? <CircularProgress size={16} /> : <DownloadIcon />}
                                                                    onClick={() => generarYDescargarActa(ing, proveedor)}
                                                                    disabled={generandoActa === ing.id}
                                                                    sx={{
                                                                        borderColor: "#FFD700",
                                                                        color: "#FFD700",
                                                                        fontSize: "0.75rem",
                                                                        minWidth: "auto",
                                                                        padding: "4px 8px",
                                                                        "&:hover": {
                                                                            borderColor: "#FFC700",
                                                                            color: "#FFC700",
                                                                        },
                                                                        "&:disabled": {
                                                                            borderColor: "#666",
                                                                            color: "#666"
                                                                        }
                                                                    }}
                                                                >
                                                                    {generandoActa === ing.id ? "Generando..." : "Descargar"}
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell style={{ color: "#fff" }}>{ing.observaciones || "-"}</TableCell>
                                                            <TableCell style={{ color: "#fff" }}>
                                                                {ing.productos?.length || 0} productos
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <div style={{ color: "#8A8A8A", textAlign: "center", padding: 16 }}>
                                            No hay ingresos registrados para este proveedor
                                        </div>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}