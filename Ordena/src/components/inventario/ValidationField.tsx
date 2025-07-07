import React from 'react';
import {
    TextField,
    Box,
    Typography,
    Tooltip,
    IconButton,
    Collapse,
    Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import type { ValidationError } from '../../utils/productoValidations';

interface ValidationFieldProps {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: () => void;
    errors: ValidationError[];
    touched?: boolean;
    showErrors?: boolean;
    fieldType?: 'text' | 'number' | 'select' | 'textarea';
    required?: boolean;
    disabled?: boolean;
    multiline?: boolean;
    rows?: number;
    inputProps?: any;
    helperText?: string;
    sx?: any;
    children?: React.ReactNode; // Para campos select
}

export default function ValidationField({
    label,
    name,
    value,
    onChange,
    onBlur,
    errors,
    touched = false,
    showErrors = false,
    fieldType = 'text',
    required = false,
    disabled = false,
    multiline = false,
    rows = 1,
    inputProps = {},
    helperText,
    sx = {},
    children
}: ValidationFieldProps) {
    const fieldErrors = errors.filter(err => err.field === name);
    const hasError = fieldErrors.some(err => !err.message.includes('recomienda')) && (touched || showErrors);
    const hasWarning = fieldErrors.some(err => err.message.includes('recomienda')) && (touched || showErrors);
    const isValid = !hasError && !hasWarning && (value !== 0 && value && value.toString().trim().length > 0);
    const hasValue = value !== 0 && value && value.toString().trim().length > 0;

    const getStatusIcon = () => {
        if (hasError) {
            return (
                <Tooltip title={fieldErrors.map(err => err.message).join(', ')}>
                    <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                </Tooltip>
            );
        }
        if (hasWarning) {
            return (
                <Tooltip title="Producto similar detectado">
                    <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                </Tooltip>
            );
        }
        if (isValid) {
            return (
                <Tooltip title="Campo válido">
                    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                </Tooltip>
            );
        }
        if (required && !hasValue && (touched || showErrors)) {
            return (
                <Tooltip title="Campo requerido">
                    <InfoIcon sx={{ color: '#2196f3', fontSize: 20 }} />
                </Tooltip>
            );
        }
        return null;
    };

    const getFieldBorderColor = () => {
        if (hasError) return '#f44336';
        if (hasWarning) return '#ff9800';
        if (isValid) return '#4caf50';
        return '#666666';
    };

    const getFieldBackgroundColor = () => {
        if (hasError) return 'rgba(244, 67, 54, 0.05)';
        if (hasWarning) return 'rgba(255, 152, 0, 0.05)';
        if (isValid) return 'rgba(76, 175, 80, 0.05)';
        return 'transparent';
    };

    const getHelperText = () => {
        if (hasError) {
            return fieldErrors.map(err => err.message).join(', ');
        }
        if (hasWarning) {
            return fieldErrors.find(err => err.message.includes('recomienda'))?.message || "Advertencia";
        }
        return helperText || "";
    };

    return (
        <Box sx={{ position: 'relative', ...sx }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: hasError ? '#f44336' : hasWarning ? '#ff9800' : '#E0E0E0',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                    }}
                >
                    {label}
                    {required && <span style={{ color: '#f44336' }}> *</span>}
                </Typography>
                {getStatusIcon()}
            </Box>

            <TextField
                name={name}
                value={fieldType === 'number' && value === 0 ? '' : value}
                onChange={onChange}
                onBlur={onBlur}
                type={fieldType === 'number' ? 'number' : 'text'}
                multiline={multiline}
                rows={rows}
                disabled={disabled}
                required={required}
                fullWidth
                select={fieldType === 'select'}
                InputLabelProps={{ style: { color: "#E0E0E0" } }}
                inputProps={{
                    ...inputProps,
                    ...(fieldType === 'number' && {
                        step: 1,
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                    })
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        color: "#FFFFFF",
                        backgroundColor: getFieldBackgroundColor(),
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '& fieldset': { 
                            borderColor: getFieldBorderColor(),
                            borderWidth: hasError || hasWarning || isValid ? 2 : 1,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '&:hover fieldset': { 
                            borderColor: hasError ? '#f44336' : hasWarning ? '#ff9800' : '#888888',
                            borderWidth: 2,
                            transform: 'scale(1.01)'
                        },
                        '&.Mui-focused fieldset': { 
                            borderColor: hasError ? '#f44336' : hasWarning ? '#ff9800' : '#4CAF50',
                            borderWidth: 2,
                            transform: 'scale(1.02)'
                        },
                        '& input': {
                            transition: 'all 0.2s ease'
                        }
                    },
                    '& .MuiFormHelperText-root': { 
                        color: hasError ? "#f44336" : hasWarning ? "#ff9800" : "#888888",
                        fontSize: '0.75rem',
                        marginTop: 0.5,
                        transition: 'all 0.2s ease'
                    },
                    '& .MuiSelect-icon': { color: "#E0E0E0" },
                    // Estilos específicos para inputs numéricos
                    '& input[type="number"]': {
                        '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                            '-webkit-appearance': 'none',
                            margin: 0
                        },
                        '&[type=number]': {
                            '-moz-appearance': 'textfield'
                        }
                    }
                }}
                SelectProps={{
                    MenuProps: {
                        PaperProps: {
                            sx: {
                                backgroundColor: '#2E2E2E',
                                color: '#FFFFFF',
                                '& .MuiMenuItem-root:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '& .Mui-selected': {
                                    backgroundColor: 'rgba(76, 175, 80, 0.2) !important',
                                },
                                '& .Mui-selected:hover': {
                                    backgroundColor: 'rgba(76, 175, 80, 0.3) !important',
                                }
                            },
                        },
                    },
                }}
                helperText={getHelperText()}
            >
                {children}
            </TextField>

            {/* Animación de validación */}
            {(hasError || hasWarning || isValid) && (
                <Box
                    sx={{
                        position: 'absolute',
                        right: -8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: '80%',
                        backgroundColor: hasError ? '#f44336' : hasWarning ? '#ff9800' : '#4caf50',
                        borderRadius: 2,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                            '100%': { opacity: 1 }
                        }
                    }}
                />
            )}
        </Box>
    );
} 