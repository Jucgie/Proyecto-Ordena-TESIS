import styled from "styled-components";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Typography, Grid, Chip } from '@mui/material';
import { useHistorialStore } from "../../store/useHistorialStore";
import type { ProductoSolicitud } from "../../store/useHistorialStore";

//Definición de Interfaces 
interface Props {
    setDetalle: () => void;
    id: number;
}

export function PedidoDetalle({ id, setDetalle }: Props) {
    const pedidos = useHistorialStore(state => state.pedidos);
    const pedido = pedidos.find((p) => p.id_p === id);
    if (!pedido) return null;
    const productos = pedido.solicitud_fk?.productos || [];
    const fecha = pedido.fecha_entrega ? new Date(pedido.fecha_entrega) : null;
    return (
        <Container>
            <div className="cerr">
                <span onClick={setDetalle} className="vol"> X</span>
            </div>
            <Box className="contenido" sx={{ width: '100%' }}>
                <Typography variant="h5" sx={{ color: '#FFD700', fontWeight: 700, mb: 1 }}>
                    Pedido #{pedido.id_p}
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                            <b>Fecha:</b> {fecha ? fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString() : '—'}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                            <b>Sucursal:</b> {pedido.sucursal_fk?.nombre_sucursal || pedido.sucursal_nombre || '—'}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                            <b>Usuario:</b> {pedido.solicitud_fk?.usuario_nombre || pedido.usuario_nombre || '—'}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                            <b>Transportista:</b> {pedido.personal_entrega_fk?.nombre_psn || pedido.personal_entrega_nombre || '—'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                            <b>Estado:</b> <Chip label={pedido.estado_pedido_fk || '—'} sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700 }} />
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#fff' }}>
                            <b>Descripción:</b> {pedido.descripcion || '—'}
                        </Typography>
                    </Grid>
                </Grid>
                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700, mb: 1 }}>
                    Productos del pedido
                </Typography>
                <TableContainer component={Paper}
                    sx={{
                        maxHeight: 400, width: "100%", background: "#232323",
                        '& .MuiTableCell-root': { color: 'white', textAlign: 'center' },
                    }}
                >
                    <Table sx={{ minWidth: 250 }} aria-label="tabla productos" stickyHeader>
                        <TableHead sx={{ bgcolor: '#232323' }}>
                            <TableRow>
                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Producto</TableCell>
                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Código</TableCell>
                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }} align="right">Cantidad</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={{ background: "#232323" }}>
                            {productos.map((p: ProductoSolicitud) => (
                                <TableRow key={p.id_solc_prod}>
                                    <TableCell>{p.producto_nombre}</TableCell>
                                    <TableCell>{p.producto_codigo || '—'}</TableCell>
                                    <TableCell align="right">{Number(p.cantidad)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Container>
    );
}

const Container = styled.div`
  position: fixed;
  height: 90vh;
  width: 50vw;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  background: #1E1E1E;
  box-shadow: 0px 0px 40px rgba(36, 36, 36, 0.7);
  padding: 24px 32px 24px 32px;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;

  .cerr {
    margin-bottom: 10px;
    font-size: 22px;
    width: 100%;
    color: white;
    font-weight: bold;
    display: flex;
    justify-content: flex-end;
    cursor: pointer;
  }
  .contenido {
    width: 100%;
  }
  @media (max-width: 900px) {
    width: 95vw;
    padding: 10px 4px 12px 4px;
  }
`