import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import QRGenerator from '../components/QRGenerator';

const QRGeneratorPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
          🏷️ Generador de Códigos QR
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Genera e imprime códigos QR para todos tus productos del inventario
        </Typography>
      </Paper>
      
      <QRGenerator />
    </Container>
  );
};

export default QRGeneratorPage; 