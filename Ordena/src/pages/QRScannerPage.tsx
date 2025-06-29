import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import QRScanner from '../components/QRScanner';

const QRScannerPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
          🏪 Sistema de Inventario Móvil
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Escanea códigos QR para gestionar tu inventario de forma rápida y eficiente
        </Typography>
      </Paper>
      
      <QRScanner />
    </Container>
  );
};

export default QRScannerPage; 