import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { QrCode, Print, Download, Search, Close } from '@mui/icons-material';
import { generarQRProducto, obtenerListaProductosQR } from '../services/api';
import Swal from 'sweetalert2';

interface ProductoQR {
  id: number;
  nombre: string;
  codigo_interno: string;
  qr_code: string;
}

const QRGenerator: React.FC = () => {
  const [productos, setProductos] = useState<ProductoQR[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState<ProductoQR[]>([]);
  const [qrSeleccionado, setQrSeleccionado] = useState<ProductoQR | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (filtro) {
      const filtrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        producto.codigo_interno.toLowerCase().includes(filtro.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    } else {
      setProductosFiltrados(productos);
    }
  }, [filtro, productos]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const response = await obtenerListaProductosQR();
      setProductos(response.productos);
      setProductosFiltrados(response.productos);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los productos',
      });
    } finally {
      setLoading(false);
    }
  };

  const generarQRIndividual = async (productoId: number) => {
    try {
      setLoading(true);
      const response = await generarQRProducto(productoId);
      // Actualizar el producto en la lista
      setProductos(prev => prev.map(p => 
        p.id === productoId 
          ? { ...p, qr_code: response.qr_code }
          : p
      ));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al generar el código QR',
      });
    } finally {
      setLoading(false);
    }
  };

  const imprimirQR = (producto: ProductoQR) => {
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>QR - ${producto.nombre}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                text-align: center;
              }
              .qr-container {
                border: 2px solid #333;
                padding: 20px;
                margin: 10px;
                display: inline-block;
                width: 200px;
              }
              .qr-code {
                width: 150px;
                height: 150px;
                margin: 0 auto;
                display: block;
              }
              .producto-info {
                margin-top: 10px;
                font-size: 12px;
              }
              @media print {
                body { margin: 0; }
                .qr-container { 
                  page-break-inside: avoid;
                  border: 1px solid #000;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="data:image/png;base64,${producto.qr_code}" class="qr-code" alt="QR Code" />
              <div class="producto-info">
                <strong>${producto.nombre}</strong><br>
                Código: ${producto.codigo_interno}
              </div>
            </div>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
      ventanaImpresion.print();
    }
  };

  const descargarQR = (producto: ProductoQR) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${producto.qr_code}`;
    link.download = `QR_${producto.codigo_interno}.png`;
    link.click();
  };

  const imprimirTodos = () => {
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      const qrHTML = productosFiltrados.map(producto => `
        <div class="qr-container">
          <img src="data:image/png;base64,${producto.qr_code}" class="qr-code" alt="QR Code" />
          <div class="producto-info">
            <strong>${producto.nombre}</strong><br>
            Código: ${producto.codigo_interno}
          </div>
        </div>
      `).join('');

      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Códigos QR - Inventario</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                text-align: center;
              }
              .qr-container {
                border: 2px solid #333;
                padding: 20px;
                margin: 10px;
                display: inline-block;
                width: 200px;
                vertical-align: top;
              }
              .qr-code {
                width: 150px;
                height: 150px;
                margin: 0 auto;
                display: block;
              }
              .producto-info {
                margin-top: 10px;
                font-size: 12px;
              }
              @media print {
                body { margin: 0; }
                .qr-container { 
                  page-break-inside: avoid;
                  border: 1px solid #000;
                }
              }
            </style>
          </head>
          <body>
            <h1>Códigos QR - Inventario</h1>
            ${qrHTML}
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
      ventanaImpresion.print();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
        🏷️ Generador de Códigos QR
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label="Buscar producto"
              variant="outlined"
              size="small"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <Button
              variant="contained"
              onClick={cargarProductos}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <QrCode />}
            >
              Recargar
            </Button>
            <Button
              variant="outlined"
              onClick={imprimirTodos}
              disabled={productosFiltrados.length === 0}
              startIcon={<Print />}
            >
              Imprimir Todos
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Genera códigos QR para todos tus productos. Escanea estos códigos con la app móvil para gestionar el inventario.
          </Alert>
        </CardContent>
      </Card>

      {loading && productos.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {productosFiltrados.map((producto) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={producto.id}>
              <Card>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    {producto.qr_code ? (
                      <img
                        src={`data:image/png;base64,${producto.qr_code}`}
                        alt="QR Code"
                        style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                        onClick={() => {
                          setQrSeleccionado(producto);
                          setDialogOpen(true);
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100px',
                          height: '100px',
                          border: '2px dashed #ccc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Sin QR
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {producto.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Código: {producto.codigo_interno}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {!producto.qr_code && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => generarQRIndividual(producto.id)}
                        disabled={loading}
                        startIcon={<QrCode />}
                        fullWidth
                      >
                        Generar QR
                      </Button>
                    )}
                    {producto.qr_code && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => imprimirQR(producto)}
                          title="Imprimir QR"
                        >
                          <Print />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => descargarQR(producto)}
                          title="Descargar QR"
                        >
                          <Download />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para ver QR en grande */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>Código QR - {qrSeleccionado?.nombre}</Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {qrSeleccionado && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <img
                src={`data:image/png;base64,${qrSeleccionado.qr_code}`}
                alt="QR Code"
                style={{ width: '300px', height: '300px' }}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                {qrSeleccionado.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Código: {qrSeleccionado.codigo_interno}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
          {qrSeleccionado && (
            <>
              <Button onClick={() => imprimirQR(qrSeleccionado)} startIcon={<Print />}>
                Imprimir
              </Button>
              <Button onClick={() => descargarQR(qrSeleccionado)} startIcon={<Download />}>
                Descargar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRGenerator; 