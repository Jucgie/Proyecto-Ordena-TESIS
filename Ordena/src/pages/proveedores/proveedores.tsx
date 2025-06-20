import { useProveedoresStore } from "../../store/useProveedorStore";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Layout from "../../components/layout/layout";

export default function Proveedores() {
  const proveedoresRaw = useProveedoresStore(state => state.proveedores);
  const proveedores = proveedoresRaw.map(p => ({
    ...p,
    ingresos: Array.isArray(p.ingresos) ? p.ingresos : [],
  }));

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <h2 style={{ color: "#FFD700" }}>Proveedores registrados</h2>
        {proveedores.length === 0 ? (
          <div style={{ color: "#8A8A8A" }}>No hay proveedores registrados.</div>
        ) : (
          proveedores.map((p: any, idx: number) => (
            <Accordion key={idx} sx={{ background: "#232323", color: "#fff", mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#FFD700" }} />}>
                <b>{p.nombre}</b> — RUT: {p.rut} — Contacto: {p.contacto || "-"}
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} style={{ background: "#181818" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ color: "#FFD700" }}>Fecha</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>Productos entregados</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>N° Remisión</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>N° Factura</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>N° Orden</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {(Array.isArray(p.ingresos) ? p.ingresos : []).map((ing: any, i: number) => (
                        <TableRow key={i}>
                        <TableCell style={{ color: "#fff" }}>{ing.fecha}</TableCell>
                        <TableCell style={{ color: "#fff" }}>
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {ing.productos.map((prod: any, j: number) => (
                                <li key={j}>{prod.nombre} — {prod.cantidad}</li>
                            ))}
                            </ul>
                        </TableCell>
                        <TableCell style={{ color: "#fff" }}>{ing.documentos.numRem}</TableCell>
                        <TableCell style={{ color: "#fff" }}>{ing.documentos.numFactura}</TableCell>
                        <TableCell style={{ color: "#fff" }}>{ing.documentos.numOrden}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </div>
    </Layout>
  );
}