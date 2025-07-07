import React from 'react';
import {
    Alert,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Chip,
    Button,
    Collapse,
    IconButton
} from '@mui/material';
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { ProductInt } from '../../utils/productoValidations';

interface ProductSimilarityAlertProps {
    similarProducts: ProductInt[];
    onUseExisting: (product: ProductInt) => void;
    onContinueAnyway: () => void;
    onDismiss: () => void;
}

export default function ProductSimilarityAlert({
    similarProducts,
    onUseExisting,
    onContinueAnyway,
    onDismiss
}: ProductSimilarityAlertProps) {
    const [expanded, setExpanded] = React.useState(false);

    if (similarProducts.length === 0) {
        return null;
    }

    return (
        <Alert
            severity="warning"
            icon={<WarningTwoToneIcon />}
            sx={{
                mb: 2,
                '& .MuiAlert-message': {
                    width: '100%'
                }
            }}
            action={
                <IconButton
                    color="inherit"
                    size="small"
                    onClick={onDismiss}
                    sx={{ color: '#d32f2f' }}
                >
                    ×
                </IconButton>
            }
        >
            <Box sx={{ width: '100%' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    Se encontraron {similarProducts.length} producto{similarProducts.length > 1 ? 's' : ''} similar{similarProducts.length > 1 ? 'es' : ''} en el inventario
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                    Revisa si alguno de estos productos es el mismo que intentas crear. 
                    Si es así, considera usar el existente para evitar duplicados.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setExpanded(!expanded)}
                        startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ 
                            borderColor: '#ff9800', 
                            color: '#ff9800',
                            '&:hover': { borderColor: '#f57c00', color: '#f57c00' }
                        }}
                    >
                        {expanded ? 'Ocultar' : 'Ver'} productos similares
                    </Button>
                    
                    <Button
                        size="small"
                        variant="contained"
                        onClick={onContinueAnyway}
                        sx={{ 
                            bgcolor: '#ff9800', 
                            color: '#fff',
                            '&:hover': { bgcolor: '#f57c00' }
                        }}
                    >
                        Continuar de todas formas
                    </Button>
                </Box>

                <Collapse in={expanded}>
                    <List sx={{ 
                        bgcolor: '#fff3e0', 
                        borderRadius: 1, 
                        border: '1px solid #ffcc02',
                        maxHeight: 300,
                        overflow: 'auto'
                    }}>
                        {similarProducts.map((product, index) => (
                            <ListItem
                                key={product.id_prodc || index}
                                sx={{
                                    borderBottom: index < similarProducts.length - 1 ? '1px solid #ffcc02' : 'none',
                                    '&:last-child': { borderBottom: 'none' }
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {product.name}
                                            </Typography>
                                            <Chip 
                                                label={product.code} 
                                                size="small" 
                                                sx={{ bgcolor: '#ff9800', color: '#fff', fontSize: '0.75rem' }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                                                <strong>Marca:</strong> {product.brand} | <strong>Categoría:</strong> {product.category}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                                                <strong>Stock actual:</strong> {product.stock} unidades
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#888' }}>
                                                {product.description}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => onUseExisting(product)}
                                    sx={{ 
                                        borderColor: '#4caf50', 
                                        color: '#4caf50',
                                        '&:hover': { borderColor: '#388e3c', color: '#388e3c' }
                                    }}
                                >
                                    Usar este
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                </Collapse>
            </Box>
        </Alert>
    );
} 