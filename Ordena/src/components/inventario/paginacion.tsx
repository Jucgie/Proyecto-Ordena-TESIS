import React from "react";
import { Box, Button, Typography, IconButton } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";

export function InventarioPagination({ page, totalPages, setPage }: {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
}) {
  // Calcula los botones de página a mostrar (máximo 5)
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  const pages = [];
  for (let i = start; i <= end; ++i) {
    pages.push(i);
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1, alignItems: "center" }}>
      {/* Primera página */}
      <IconButton onClick={() => setPage(1)} disabled={page === 1}>
        <FirstPageIcon />
      </IconButton>
      {/* Página anterior */}
      <IconButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
        <ArrowBackIosIcon />
      </IconButton>
      {/* Números de página */}
      {pages.map(p => (
        <Button
          key={p}
          onClick={() => setPage(p)}
          variant={page === p ? "contained" : "outlined"}
          sx={{
            bgcolor: page === p ? "#FFD700" : "#232323",
            color: page === p ? "#232323" : "#FFD700",
            minWidth: 36,
            px: 1.2,
            fontWeight: 700,
            borderColor: "#FFD700",
            mx: 0.2,
            "&:hover": { bgcolor: "#FFD700cc", color: "#232323" }
          }}
        >
          {p}
        </Button>
      ))}
      {/* Página siguiente */}
      <IconButton onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
        <ArrowForwardIosIcon />
      </IconButton>
      {/* Última página */}
      <IconButton onClick={() => setPage(totalPages)} disabled={page === totalPages}>
        <LastPageIcon />
      </IconButton>
      {/* Info */}
      <Typography sx={{ color: "#FFD700", fontWeight: 600, ml: 1, fontSize: "1rem" }}>
        Página {page} de {totalPages}
      </Typography>
    </Box>
  );
}