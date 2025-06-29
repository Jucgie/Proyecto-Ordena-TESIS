import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Card, CardContent, TextField, Alert, CircularProgress, IconButton } from '@mui/material';
import { QrCodeScanner, Close, Add, Remove, Save } from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { obtenerProductoPorCodigo, actualizarStockPorCodigo } from '../services/api';
import Swal from 'sweetalert2';

interface Producto {
  id: number;
  nombre: string;
  codigo_interno: string;
  descripcion: string;
  marca: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  estado_stock: string;
}

const QRScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState<number>(0);
  const [tipoMovimiento, setTipoMovimiento] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('AJUSTE');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const iniciarEscaneo = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    setIsScanning(true);
    setProducto(null);

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);
  };

  const detenerEscaneo = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      // Extraer código del QR (formato: PROD:codigo_interno)
      let codigoInterno = decodedText;
      
      // Si el QR tiene el formato PROD:codigo, extraer solo el código
      if (decodedText.startsWith('PROD:')) {
        codigoInterno = decodedText.substring(5);
      } else if (decodedText.includes('|')) {
        // Mantener compatibilidad con formato anterior
        const partes = decodedText.split('|');
        codigoInterno = partes.length > 1 ? partes[1] : decodedText;
      }
      
      setLoading(true);
      const response = await obtenerProductoPorCodigo(codigoInterno);
      setProducto(response.producto);
      setCantidad(response.producto.stock_actual);
      detenerEscaneo();
    } catch (error: any) {
      console.error('Error al escanear:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Producto no encontrado o error en el escaneo',
      });
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error: any) => {
    // Error silencioso para no interrumpir el escaneo
    console.warn('Error de escaneo:', error);
  };

  const actualizarStock = async () => {
    if (!producto || cantidad < 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cantidad inválida',
      });
      return;
    }

    try {
      setLoading(true);
      await actualizarStockPorCodigo({
        codigo_interno: producto.codigo_interno,
        cantidad: cantidad,
        tipo_movimiento: tipoMovimiento
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Stock actualizado correctamente',
      });

      setProducto(null);
      setCantidad(0);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar el stock',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoStockColor = (estado: string) => {
    switch (estado) {
      case 'CRÍTICO': return 'error';
      case 'BAJO': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
        📱 Escáner de Inventario
      </Typography>

      {!isScanning && !producto && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Instrucciones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              1. Presiona "Iniciar Escaneo" para activar la cámara
              2. Apunta al código QR del producto
              3. El producto se cargará automáticamente
              4. Ajusta la cantidad y actualiza el stock
            </Typography>
            <Button
              variant="contained"
              startIcon={<QrCodeScanner />}
              onClick={iniciarEscaneo}
              fullWidth
              size="large"
            >
              Iniciar Escaneo
            </Button>
          </CardContent>
        </Card>
      )}

      {isScanning && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Escaneando...
              </Typography>
              <IconButton onClick={detenerEscaneo} color="error">
                <Close />
              </IconButton>
            </Box>
            <div id="qr-reader" style={{ width: '100%' }}></div>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {producto && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Producto Escaneado
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {producto.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Código: {producto.codigo_interno}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {producto.marca} • {producto.categoria}
              </Typography>
            </Box>

            <Alert 
              severity={getEstadoStockColor(producto.estado_stock) as any}
              sx={{ mb: 2 }}
            >
              Stock Actual: {producto.stock_actual} | Mínimo: {producto.stock_minimo}
              <br />
              Estado: {producto.estado_stock}
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tipo de Movimiento
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {(['ENTRADA', 'SALIDA', 'AJUSTE'] as const).map((tipo) => (
                  <Button
                    key={tipo}
                    variant={tipoMovimiento === tipo ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setTipoMovimiento(tipo)}
                  >
                    {tipo}
                  </Button>
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Nueva Cantidad
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => setCantidad(Math.max(0, cantidad - 1))}
                  disabled={loading}
                >
                  <Remove />
                </IconButton>
                <TextField
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(0, Number(e.target.value)))}
                  sx={{ flex: 1 }}
                  size="small"
                  disabled={loading}
                />
                <IconButton 
                  onClick={() => setCantidad(cantidad + 1)}
                  disabled={loading}
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={actualizarStock}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : 'Actualizar Stock'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setProducto(null);
                  setCantidad(0);
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default QRScanner; 