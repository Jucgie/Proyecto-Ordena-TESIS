import React from 'react';
import {
    Box,
    Typography,
    Chip,
    LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { ValidationError } from '../../utils/productoValidations';

interface ValidationSummaryProps {
    errors: ValidationError[];
    showErrors: boolean;
}

export default function ValidationSummary({
    errors,
    showErrors
}: ValidationSummaryProps) {
    const errorCount = errors.length;
    const totalFields = 8; // nombre, código, marca, categoría, descripción, stock, stock_minimo, stock_maximo
    const validFields = totalFields - errorCount;
    const progressPercentage = (validFields / totalFields) * 100;

    const getProgressColor = () => {
        if (errorCount > 0) return '#f44336';
        return '#4caf50';
    };

    const getStatusText = () => {
        if (errorCount > 0) return 'Hay errores que deben corregirse';
        return 'Formulario válido';
    };

    const getStatusIcon = () => {
        if (errorCount > 0) return <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />;
        return <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />;
    };

    // Solo mostrar si hay errores y se deben mostrar
    if (errors.length === 0 || !showErrors) {
        return null;
    }

    return (
        <Box sx={{ mb: 3 }}>
            {/* Barra de progreso - solo mostrar si hay errores */}
            {showErrors && errorCount > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#E0E0E0', fontWeight: 500 }}>
                            Progreso del formulario
                        </Typography>
                        <Typography variant="body2" sx={{ color: getProgressColor(), fontWeight: 600 }}>
                            {validFields}/{totalFields} campos válidos
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progressPercentage}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: getProgressColor(),
                                borderRadius: 3,
                            }
                        }}
                    />
                </Box>
            )}

            {/* Resumen de estado - solo mostrar si hay errores */}
            {showErrors && errors.length > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        border: `1px solid ${getProgressColor()}40`,
                        mb: 2
                    }}
                >
                    {getStatusIcon()}
                    <Typography variant="body1" sx={{ color: '#E0E0E0', fontWeight: 500 }}>
                        {getStatusText()}
                    </Typography>
                </Box>
            )}

            {/* Chips de errores - solo mostrar si se deben mostrar errores */}
            {showErrors && errorCount > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {errors.map((error, index) => (
                        <Chip
                            key={index}
                            label={error.message}
                            size="small"
                            icon={<ErrorIcon />}
                            sx={{
                                backgroundColor: '#f44336',
                                color: '#fff',
                                '& .MuiChip-icon': { color: '#fff' }
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
} 