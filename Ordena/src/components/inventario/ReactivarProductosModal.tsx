import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Checkbox,
    FormControlLabel,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Divider,
    Paper
} from '@mui/material';
import {
    Close as CloseIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { productoService } from '../../services/productoService';
import { useAuthStore } from '../../store/useAuthStore';

interface ProductoDesactivado {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  marca: {
    id: number;
    nombre: string;
  } | null;
  categoria: {
    id: number;
    nombre: string;
  } | null;
  bodega: {
    id: number;
    nombre: string;
  } | null;
  sucursal: {
    id: number;
    nombre: string;
  } | null;
  fecha_creacion: string;
  stock: {
    actual: number;
    minimo: number;
    maximo: number;
  };
}

interface ReactivarProductosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductosReactivados: () => void;
}

const ReactivarProductosModal: React.FC<ReactivarProductosModalProps> = ({
  isOpen,
  onClose,
  onProductosReactivados
}) => {
  const [productos, setProductos] = useState<ProductoDesactivado[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [reactivating, setReactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usuario } = useAuthStore();

  // Determinar ubicación basada en el usuario
  const getUbicacionId = () => {
    if (usuario?.bodega) return "bodega_central";
    if (usuario?.sucursal) return usuario.sucursal.toString();
    return undefined;
  };

  useEffect(() => {
    if (isOpen) {
      loadProductosDesactivados();
    }
  }, [isOpen, searchTerm]);

  const loadProductosDesactivados = async () => {
    try {
      setLoading(true);
      setError(null);
      const ubicacionId = getUbicacionId();
      const response = await productoService.getProductosDesactivados(ubicacionId, searchTerm);
      setProductos(response.productos || []);
    } catch (error) {
      console.error('Error cargando productos desactivados:', error);
      setError('Error al cargar productos desactivados');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === productos.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productos.map(p => p.id));
    }
  };

  const handleReactivar = async () => {
    if (selectedProducts.length === 0) {
      setError('Debe seleccionar al menos un producto para reactivar');
      return;
    }

    try {
      setReactivating(true);
      setError(null);
      await productoService.reactivarProductos(selectedProducts.map(id => id.toString()));
      
      alert(`Se reactivaron ${selectedProducts.length} productos exitosamente`);
      setSelectedProducts([]);
      onProductosReactivados();
      onClose();
    } catch (error) {
      console.error('Error reactivando productos:', error);
      setError('Error al reactivar productos');
    } finally {
      setReactivating(false);
    }
  };

  const handleReactivarIndividual = async (productId: number) => {
    try {
      setError(null);
      await productoService.reactivarProductoIndividual(productId.toString());
      alert('Producto reactivado exitosamente');
      onProductosReactivados();
      loadProductosDesactivados();
    } catch (error) {
      console.error('Error reactivando producto:', error);
      setError('Error al reactivar el producto');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockColor = (stock: number, stockMinimo: number) => {
    if (stock === 0) return "#F44336";
    if (stock < stockMinimo) return "#FF9800";
    return "#4CAF50";
  };

  const getStockText = (stock: number, stockMinimo: number) => {
    if (stock === 0) return "Sin stock";
    if (stock < stockMinimo) return "Stock bajo";
    return "Stock normal";
  };

      return (
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        keepMounted
        disableEscapeKeyDown={false}
        PaperProps={{
          sx: {
            backgroundColor: "#232323",
            borderRadius: 3,
            boxShadow: 24,
            minHeight: '80vh',
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: "#232323",
            borderRadius: 3,
            boxShadow: 24,
            minHeight: '80vh',
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
      <DialogTitle sx={{ 
        background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
        color: "#FFD700",
        borderBottom: "2px solid #FFD700",
        fontWeight: 700,
        fontSize: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <RestoreIcon sx={{ color: "#FFD700", fontSize: 32 }} />
          Reactivar Productos Desactivados
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: "#FFD700", "&:hover": { color: "#fff" } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        bgcolor: "#232323", 
        color: "#fff", 
        pt: 3,
        pb: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: "#1a1a1a", color: "#ff6b6b" }}>
            {error}
          </Alert>
        )}

        {/* Search and Controls */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", flexShrink: 0 }}>
          <Box sx={{ position: "relative", flex: 1 }}>
            <SearchIcon sx={{ 
              position: "absolute", 
              left: 12, 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#FFD700" 
            }} />
            <TextField
              placeholder="Buscar productos por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "#FFD700",
                  },
                  "&:hover fieldset": {
                    borderColor: "#FFD700",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#FFD700",
                  },
                },
                "& .MuiInputBase-input": {
                  paddingLeft: 40,
                }
              }}
            />
          </Box>
          
          <Button
            onClick={handleSelectAll}
            variant="outlined"
            sx={{ 
              borderColor: "#FFD700", 
              color: "#FFD700",
              "&:hover": { 
                borderColor: "#fff", 
                color: "#fff" 
              }
            }}
          >
            {selectedProducts.length === productos.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
          </Button>
          
          <Button
            onClick={loadProductosDesactivados}
            variant="outlined"
            startIcon={<RefreshIcon />}
            sx={{ 
              borderColor: "#FFD700", 
              color: "#FFD700",
              "&:hover": { 
                borderColor: "#fff", 
                color: "#fff" 
              }
            }}
          >
            Actualizar
          </Button>
        </Box>

        {/* Products List */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          minHeight: 0,
          pr: 1
        }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
              <CircularProgress sx={{ color: "#FFD700" }} />
            </Box>
          ) : productos.length === 0 ? (
            <Box sx={{ 
              textAlign: "center", 
              py: 8, 
              color: "#aaa",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 300
            }}>
              <RestoreIcon sx={{ fontSize: 80, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1, color: "#FFD700" }}>
                {searchTerm ? 'No se encontraron productos desactivados' : 'No hay productos desactivados'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, maxWidth: 400 }}>
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Todos los productos están activos'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {productos.map((producto) => (
                                  <Card
                    key={producto.id}
                    sx={{
                      bgcolor: "#1a1a1a",
                      border: selectedProducts.includes(producto.id) 
                        ? "2px solid #FFD700" 
                        : "1px solid #333",
                      borderRadius: 3,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        borderColor: "#FFD700",
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 25px rgba(255, 215, 0, 0.3)"
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        background: getStockColor(producto.stock.actual, producto.stock.minimo),
                        zIndex: 1
                      }
                    }}
                  >
                                      <CardContent sx={{ p: 3, pt: 4 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedProducts.includes(producto.id)}
                          onChange={() => handleSelectProduct(producto.id)}
                          sx={{
                            color: "#FFD700",
                            "&.Mui-checked": {
                              color: "#FFD700",
                            },
                            mt: 0.5
                          }}
                        />

                        {/* Product Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
                            {producto.nombre}
                          </Typography>
                          <Chip
                            label={producto.codigo}
                            size="small"
                            sx={{ 
                              bgcolor: "#333", 
                              color: "#FFD700",
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ 
                          display: "grid", 
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }, 
                          gap: 2, 
                          mb: 2,
                          p: 2,
                          bgcolor: "rgba(255, 215, 0, 0.05)",
                          borderRadius: 2,
                          border: "1px solid rgba(255, 215, 0, 0.1)"
                        }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 600, display: "block", mb: 0.5 }}>
                              MARCA
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#fff", fontWeight: 500 }}>
                              {producto.marca?.nombre || 'Sin marca'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 600, display: "block", mb: 0.5 }}>
                              CATEGORÍA
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#fff", fontWeight: 500 }}>
                              {producto.categoria?.nombre || 'Sin categoría'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 600, display: "block", mb: 0.5 }}>
                              UBICACIÓN
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#fff", fontWeight: 500 }}>
                              {producto.bodega?.nombre || producto.sucursal?.nombre || 'Sin ubicación'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 600, display: "block", mb: 0.5 }}>
                              STOCK
                            </Typography>
                            <Chip
                              label={`${producto.stock.actual} unidades`}
                              size="small"
                              sx={{
                                bgcolor: getStockColor(producto.stock.actual, producto.stock.minimo),
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "0.75rem"
                              }}
                            />
                          </Box>
                        </Box>
                        
                        {producto.descripcion && (
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: "rgba(255, 255, 255, 0.05)", 
                            borderRadius: 2, 
                            mb: 2,
                            border: "1px solid rgba(255, 255, 255, 0.1)"
                          }}>
                            <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 600, display: "block", mb: 0.5 }}>
                              DESCRIPCIÓN
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#ccc", fontStyle: "italic" }}>
                              {producto.descripcion}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 1,
                          p: 1,
                          bgcolor: "rgba(255, 215, 0, 0.1)",
                          borderRadius: 1,
                          width: "fit-content"
                        }}>
                          <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 600 }}>
                            Creado:
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#fff" }}>
                            {formatDate(producto.fecha_creacion)}
                          </Typography>
                        </Box>
                      </Box>

                                              {/* Individual Reactivate Button */}
                        <Tooltip title="Reactivar producto individual">
                          <Button
                            onClick={() => handleReactivarIndividual(producto.id)}
                            variant="contained"
                            startIcon={<RestoreIcon />}
                            sx={{
                              bgcolor: "#4CAF50",
                              color: "#fff",
                              fontWeight: 600,
                              borderRadius: 2,
                              px: 3,
                              py: 1,
                              minWidth: 120,
                              "&:hover": {
                                bgcolor: "#45a049",
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)"
                              },
                              transition: "all 0.2s ease"
                            }}
                          >
                            Reactivar
                          </Button>
                        </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        bgcolor: "#1a1a1a", 
        borderTop: "2px solid #FFD700",
        p: 3,
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" sx={{ color: "#FFD700", fontWeight: 600 }}>
            {productos.length} productos desactivados encontrados
          </Typography>
          {selectedProducts.length > 0 && (
            <Chip
              label={`${selectedProducts.length} seleccionados`}
              size="small"
              sx={{
                bgcolor: "#FFD700",
                color: "#232323",
                fontWeight: 600
              }}
            />
          )}
        </Box>
        
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ 
              borderColor: "#FFD700", 
              color: "#FFD700",
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              "&:hover": { 
                borderColor: "#fff", 
                color: "#fff",
                bgcolor: "rgba(255, 255, 255, 0.1)"
              }
            }}
          >
            Cerrar
          </Button>
          <Button
            onClick={handleReactivar}
            disabled={selectedProducts.length === 0 || reactivating}
            variant="contained"
            startIcon={reactivating ? <CircularProgress size={16} /> : <RestoreIcon />}
            sx={{
              bgcolor: "#4CAF50",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
              py: 1.5,
              minWidth: 140,
              "&:hover": {
                bgcolor: "#45a049",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)"
              },
              "&:disabled": {
                bgcolor: "#666",
                color: "#999",
                transform: "none",
                boxShadow: "none"
              },
              transition: "all 0.2s ease"
            }}
          >
            {reactivating ? 'Reactivando...' : `Reactivar (${selectedProducts.length})`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ReactivarProductosModal; 