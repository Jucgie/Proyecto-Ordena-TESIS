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
          proveedores.map((proveedor: any) => (
            <Accordion key={proveedor.rut} sx={{ bgcolor: "#232323", color: "#fff" }}>
              <AccordionSummary>
                <TableRow>
                  <TableCell style={{ color: "#fff" }}>{proveedor.nombre}</TableCell>
                  <TableCell style={{ color: "#fff" }}>{proveedor.rut}</TableCell>
                  <TableCell style={{ color: "#fff" }}>{proveedor.contacto}</TableCell>
                  <TableCell style={{ color: "#fff" }}>{proveedor.ingresos?.[0]?.documentos?.numGuiaDespacho || "-"}</TableCell>
                  <TableCell style={{ color: "#fff" }}>{proveedor.ingresos?.[0]?.documentos?.numRem || "-"}</TableCell>
                  <TableCell style={{ color: "#fff" }}>{proveedor.ingresos?.[0]?.fecha || "-"}</TableCell>
                  <TableCell style={{ color: "#fff" }}>{proveedor.ingresos?.[0]?.productos?.length || 0} productos</TableCell>
                </TableRow>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ color: "#FFD700" }}>Fecha</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>N° Guía Despacho</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>N° REM</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>Archivo</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>Observaciones</TableCell>
                        <TableCell style={{ color: "#FFD700" }}>Productos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proveedor.ingresos?.map((ing: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell style={{ color: "#fff" }}>{ing.fecha}</TableCell>
                          <TableCell style={{ color: "#fff" }}>{ing.documentos?.numGuiaDespacho || "-"}</TableCell>
                          <TableCell style={{ color: "#fff" }}>{ing.documentos?.numRem || "-"}</TableCell>
                          <TableCell style={{ color: "#fff" }}>{ing.documentos?.archivoGuia || "-"}</TableCell>
                          <TableCell style={{ color: "#fff" }}>{ing.observaciones || "-"}</TableCell>
                          <TableCell style={{ color: "#fff" }}>{ing.productos?.length || 0} productos</TableCell>
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