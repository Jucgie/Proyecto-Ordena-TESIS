import React, { memo, useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, TextField } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ProductInt } from '../../store/useProductoStore';

interface MotivoAjusteModalProps {
  open: boolean;
  productoAjuste: ProductInt | null;
  onClose: () => void;
  onConfirm: (motivo: string, producto: ProductInt) => void;
}

const MotivoAjusteModal = memo(function MotivoAjusteModal({ open, productoAjuste, onClose, onConfirm }: MotivoAjusteModalProps) {
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (open) setMotivo("");
  }, [open, productoAjuste]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #232323 0%, #1a1a1a 100%)',
          borderRadius: 3,
          boxShadow: 24,
          animation: 'fadeIn 0.5s',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'scale(0.95)' },
            '100%': { opacity: 1, transform: 'scale(1)' }
          }
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        color: '#fff',
        fontWeight: 700,
        fontSize: 24,
        bgcolor: 'transparent',
        pb: 2
      }}>
        <InfoOutlinedIcon sx={{ color: '#FFD700', fontSize: 32 }} />
        Motivo del ajuste de stock
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'transparent', color: '#fff', pt: 3 }}>
        <Typography variant="body1" sx={{ color: '#fff', mb: 2, fontWeight: 500 }}>
          Por favor, ingresa el motivo del ajuste. Esto ayuda a mantener la trazabilidad y control de inventario.
        </Typography>
        <TextField
          label="Motivo del ajuste"
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          required
          autoFocus
          sx={{
            bgcolor: '#181818',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              fontWeight: 500,
              '& fieldset': { borderColor: '#888' },
              '&:hover fieldset': { borderColor: '#aaa' },
              '&.Mui-focused fieldset': { borderColor: '#FFD700' }
            },
            '& .MuiInputLabel-root': { color: '#aaa' },
            '& .MuiFormHelperText-root': { color: '#aaa' }
          }}
          helperText="Ejemplo: Merma, ajuste por inventario, error de conteo, etc."
          InputLabelProps={{ style: { color: '#aaa' } }}
          InputProps={{ style: { color: '#fff' } }}
        />
      </DialogContent>
      <DialogActions sx={{ bgcolor: 'transparent', pb: 2, pr: 3 }}>
        <Button onClick={onClose} sx={{ color: '#fff', fontWeight: 600 }}>Cancelar</Button>
        <Button onClick={() => productoAjuste && onConfirm(motivo, productoAjuste)} disabled={!motivo.trim() || !productoAjuste} sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700, borderRadius: 2, px: 4, '&:hover': { bgcolor: '#ffe066' } }}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default MotivoAjusteModal; 