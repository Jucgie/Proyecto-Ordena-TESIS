import React, { useState, useEffect } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, MenuItem,
    IconButton, InputAdornment, Pagination, Typography
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { informesService } from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { formatFechaChile } from '../../utils/formatFechaChile';

interface Informe {
    id_informe: number;
    titulo: string;
    descripcion: string;
    modulo_origen: string;
    contenido: string;
    archivo_url: string;
    fecha_generado: string;
    usuario_fk: number;
    usuario_nombre: string;
    pedidos_fk?: number;
    productos_fk?: number;
}

export default function Informes() {
    const [informes, setInformes] = useState<Informe[]>([]);
    // Siempre trabajar con un array seguro
    const informesArray = Array.isArray(informes) ? informes : (informes?.results || []);
    const [informesFiltrados, setInformesFiltrados] = useState<Informe[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLimpiezaOpen, setModalLimpiezaOpen] = useState(false);
    const [informeSeleccionado, setInformeSeleccionado] = useState<Informe | null>(null);
    const [loading, setLoading] = useState(true);
    const usuario = useAuthStore(state => state.usuario);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroModulo, setFiltroModulo] = useState("");
    const [filtroFecha, setFiltroFecha] = useState("");

    // Estados para paginación
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Cargar informes al montar el componente
    useEffect(() => {
        fetchInformes();
    }, []);

    // Aplicar filtros cuando cambien los valores
    useEffect(() => {
        aplicarFiltros();
        setPage(1); // Resetear a la primera página cuando cambien los filtros
    }, [informes, searchTerm, filtroModulo, filtroFecha]);

    const fetchInformes = async () => {
        try {
            setLoading(true);
            console.log('🔍 DEBUG - Obteniendo informes para usuario:', usuario?.id);
            
            const response = await informesService.getInformes({
                bodega_fk: usuario?.bodega?.toString() || undefined,
                sucursal_fk: usuario?.sucursal?.toString() || undefined
            });
            
            console.log('🔍 DEBUG - Informes obtenidos:', response);
            console.log('🔍 DEBUG - Cantidad de informes:', response.length);
            
            setInformes(response);
        } catch (error) {
            console.error("Error al obtener informes:", error);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let filtrados = [...informesArray];

        // Filtro por búsqueda de texto
        if (searchTerm) {
            filtrados = filtrados.filter(informe =>
                informe.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                informe.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                informe.archivo_url.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro por módulo
        if (filtroModulo) {
            filtrados = filtrados.filter(informe => informe.modulo_origen === filtroModulo);
        }

        // Filtro por fecha
        if (filtroFecha) {
            const fechaFiltro = new Date(filtroFecha);
            filtrados = filtrados.filter(informe => {
                const fechaInforme = new Date(informe.fecha_generado);
                return fechaInforme.toDateString() === fechaFiltro.toDateString();
            });
        }

        setInformesFiltrados(filtrados);
    };

    // Calcular informes para la página actual
    const informesPaginados = informesFiltrados.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const totalPages = Math.ceil(informesFiltrados.length / rowsPerPage);

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleOpenModal = (informe: Informe) => {
        setInformeSeleccionado(informe);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setInformeSeleccionado(null);
    };

    const handleDownload = async (informe: Informe) => {
        try {
            console.log('🔍 DEBUG - Descargando informe:', informe);
            
            // Manejar diferentes tipos de informes según el módulo de origen
            switch (informe.modulo_origen) {
                case 'solicitudes':
                    // Si es un OCI, regenerar el PDF
                    const { regenerarOCIDesdeInforme } = await import('../../utils/pdf/generarOCI');
                    const fileName = await regenerarOCIDesdeInforme(informe);
                    console.log('✅ OCI regenerado:', fileName);
                    break;
                    
                case 'proveedores':
                    // Si es un acta de recepción de proveedor, regenerar el PDF
                    try {
                        const { generarActaRecepcion } = await import('../../utils/pdf/generarActaRecepcion');
                        
                        // Extraer datos del contenido del informe
                        const contenido = JSON.parse(informe.contenido || '{}');
                        console.log('🔍 DEBUG - Contenido del informe de proveedor:', contenido);
                        
                        // Generar el acta de recepción
                        generarActaRecepcion({
                            numeroActa: String(informe.id_informe),
                            fechaRecepcion: contenido.fecha || formatFechaChile(informe.fecha_generado),
                            sucursal: {
                                nombre: "Bodega Central",
                                direccion: "Camino a Penco 2500, Concepción"
                            },
                            personaRecibe: {
                                nombre: contenido.responsable || "Responsable de Bodega",
                                cargo: "Responsable de Bodega"
                            },
                            productos: contenido.productos || [],
                            observaciones: contenido.observaciones || informe.descripcion,
                            conformidad: "Recibido conforme",
                            responsable: contenido.responsable || "Responsable de Bodega",
                            proveedor: contenido.proveedor
                        });
                        
                        console.log('✅ Acta de recepción regenerada');
                    } catch (error) {
                        console.error('Error al regenerar acta de recepción:', error);
                        alert('Error al regenerar el documento. Por favor, intente de nuevo.');
                    }
                    break;
                    
                case 'pedidos':
                    // Si es un pedido, generar guía de despacho
                    try {
                        const { generarGuiaDespacho } = await import('../../utils/pdf/generarGuiaDespacho');
                        
                        // Extraer datos del contenido del informe
                        const contenido = JSON.parse(informe.contenido || '{}');
                        console.log('🔍 DEBUG - Contenido del informe de pedido:', contenido);
                        
                        // Generar la guía de despacho con la estructura correcta
                        generarGuiaDespacho({
                            id: String(informe.id_informe),
                            fecha: contenido.fecha || formatFechaChile(informe.fecha_generado),
                            sucursalDestino: contenido.sucursal?.id || 1,
                            responsable: contenido.responsable || "Responsable de Bodega",
                            productos: contenido.productos || [],
                            ociAsociada: contenido.oci_asociada || informe.pedidos_fk,
                            observaciones: contenido.observaciones || informe.descripcion
                        });
                        
                        console.log('✅ Guía de despacho regenerada');
                    } catch (error) {
                        console.error('Error al regenerar guía de despacho:', error);
                        alert('Error al regenerar el documento. Por favor, intente de nuevo.');
                    }
                    break;
                    
                default:
                    // Para otros tipos de informes, mostrar mensaje
                    alert(`Descargando: ${informe.archivo_url}\n\nNota: Este tipo de documento se regenerará automáticamente.`);
                    break;
            }
        } catch (error) {
            console.error('Error al descargar:', error);
            alert('Error al descargar el documento. Por favor, intente de nuevo.');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getModuloDisplayName = (modulo: string) => {
        const modulos: { [key: string]: string } = {
            'solicitudes': 'Solicitudes',
            'pedidos': 'Pedidos',
            'proveedores': 'Proveedores'
        };
        return modulos[modulo] || modulo;
    };

    const limpiarFiltros = () => {
        setSearchTerm("");
        setFiltroModulo("");
        setFiltroFecha("");
    };

    return (
        <Layout>
            <div style={{
                padding: "24px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box"
            }}>
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
                    <h2 style={{ color: "#FFD700", margin: 0 }}>Informes Generados</h2>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Typography variant="body2" style={{ color: "#8A8A8A" }}>
                            {informesFiltrados.length} informes encontrados
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<FilterListIcon />}
                            onClick={limpiarFiltros}
                            style={{ borderColor: "#FFD700", color: "#FFD700" }}
                        >
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <Box sx={{ 
                    display: "flex", 
                    gap: 2, 
                    mb: 3, 
                    flexWrap: "wrap",
                    background: "#232323",
                    padding: "16px",
                    borderRadius: "8px"
                }}>
                    <TextField
                        placeholder="Buscar por título, descripción o archivo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        sx={{ 
                            minWidth: 250,
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#FFD700' },
                                '&:hover fieldset': { borderColor: '#FFD700' },
                                '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                            },
                            '& .MuiInputBase-input': { color: '#fff' },
                            '& .MuiInputLabel-root': { color: '#FFD700' }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#FFD700' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        select
                        label="Módulo"
                        value={filtroModulo}
                        onChange={(e) => setFiltroModulo(e.target.value)}
                        size="small"
                        sx={{ 
                            minWidth: 150,
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#FFD700' },
                                '&:hover fieldset': { borderColor: '#FFD700' },
                                '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                            },
                            '& .MuiInputBase-input': { color: '#fff' },
                            '& .MuiInputLabel-root': { color: '#FFD700' }
                        }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="solicitudes">Solicitudes</MenuItem>
                        <MenuItem value="pedidos">Pedidos</MenuItem>
                        <MenuItem value="proveedores">Proveedores</MenuItem>
                    </TextField>
                    <TextField
                        type="date"
                        label="Fecha"
                        value={filtroFecha}
                        onChange={(e) => setFiltroFecha(e.target.value)}
                        size="small"
                        sx={{ 
                            minWidth: 150,
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#FFD700' },
                                '&:hover fieldset': { borderColor: '#FFD700' },
                                '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                            },
                            '& .MuiInputBase-input': { color: '#fff' },
                            '& .MuiInputLabel-root': { color: '#FFD700' }
                        }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Box>

                <TableContainer component={Paper} style={{ background: "#181818" }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>ID</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Título</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Módulo</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Fecha</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Archivo</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" style={{ color: "#FFD700", fontWeight: 600, fontSize: 18 }}>
                                        Cargando informes...
                                    </TableCell>
                                </TableRow>
                            ) : informesFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" style={{ color: "#8A8A8A" }}>
                                        {informes.length === 0 ? "No hay informes para mostrar." : "No se encontraron informes con los filtros aplicados."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                informesPaginados.map((informe) => (
                                    <TableRow key={informe.id_informe}>
                                        <TableCell style={{ color: "#fff" }}>{informe.id_informe}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{informe.titulo}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {getModuloDisplayName(informe.modulo_origen)}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {formatFechaChile(informe.fecha_generado)}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>{informe.archivo_url}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                style={{ borderColor: "#FFD700", color: "#FFD700", marginRight: 8 }}
                                                onClick={() => handleOpenModal(informe)}
                                            >
                                                Ver detalles
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<DownloadIcon />}
                                                style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
                                                onClick={() => handleDownload(informe)}
                                            >
                                                Descargar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Paginación */}
                {totalPages > 1 && (
                    <Box sx={{ 
                        display: "flex", 
                        justifyContent: "center", 
                        mt: 3,
                        background: "#232323",
                        padding: "16px",
                        borderRadius: "8px"
                    }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    color: '#fff',
                                    '&.Mui-selected': {
                                        backgroundColor: '#FFD700',
                                        color: '#000',
                                        '&:hover': {
                                            backgroundColor: '#FFD700',
                                        }
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                    }
                                }
                            }}
                        />
                    </Box>
                )}

                {/* Modal de detalles */}
                <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                    <DialogTitle style={{ color: "#FFD700", background: "#232323" }}>
                        Detalles del Informe
                    </DialogTitle>
                    <DialogContent style={{ background: "#181818", color: "#fff" }}>
                        {informeSeleccionado && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                                <TextField
                                    label="ID del Informe"
                                    value={informeSeleccionado.id_informe}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#444' },
                                            '& input': { color: '#fff' }
                                        },
                                        '& .MuiInputLabel-root': { color: '#bbb' }
                                    }}
                                />
                                <TextField
                                    label="Título"
                                    value={informeSeleccionado.titulo}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#444' },
                                            '& input': { color: '#fff' }
                                        },
                                        '& .MuiInputLabel-root': { color: '#bbb' }
                                    }}
                                />
                                <TextField
                                    label="Descripción"
                                    value={informeSeleccionado.descripcion}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    multiline
                                    minRows={2}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#444' },
                                            '& textarea': { color: '#fff' }
                                        },
                                        '& .MuiInputLabel-root': { color: '#bbb' }
                                    }}
                                />
                                <TextField
                                    label="Módulo de Origen"
                                    value={getModuloDisplayName(informeSeleccionado.modulo_origen)}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#444' },
                                            '& input': { color: '#fff' }
                                        },
                                        '& .MuiInputLabel-root': { color: '#bbb' }
                                    }}
                                />
                                <TextField
                                    label="Fecha de Generación"
                                    value={formatFechaChile(informeSeleccionado.fecha_generado)}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#444' },
                                            '& input': { color: '#fff' }
                                        },
                                        '& .MuiInputLabel-root': { color: '#bbb' }
                                    }}
                                />
                                <TextField
                                    label="Archivo"
                                    value={informeSeleccionado.archivo_url}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#444' },
                                            '& input': { color: '#fff' }
                                        },
                                        '& .MuiInputLabel-root': { color: '#bbb' }
                                    }}
                                />
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions style={{ background: "#232323" }}>
                        <Button onClick={handleCloseModal} style={{ color: "#FFD700" }}>Cerrar</Button>
                        {informeSeleccionado && (
                            <Button
                                onClick={() => handleDownload(informeSeleccionado)}
                                style={{ color: "#121212", background: "#4CAF50", fontWeight: 600 }}
                                startIcon={<DownloadIcon />}
                            >
                                Descargar
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
} 