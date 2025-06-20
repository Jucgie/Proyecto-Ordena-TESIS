import React, { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, IconButton
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProveedoresStore } from "../../store/useProveedorStore";
import { Select, MenuItem, InputLabel, FormControl } from "@mui/material";

interface Producto {
    nombre: string;
    cantidad: number;
    marca: string;
    categoria: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    tipo: "ingreso" | "salida";
    onSubmit: (data: any) => void;
    marcas: string[];
    categorias: string[];
}

export default React.memo(function ModalFormularioPedido({ open, onClose, tipo, onSubmit, marcas, categorias }: Props) {
    const addIngresoProveedor = useProveedoresStore(state => state.addIngresoProveedor);

    // Inputs comunes
    const [fecha, setFecha] = useState("");
    const [numRem, setNumRem] = useState("");
    const [numFactura, setNumFactura] = useState("");
    const [numOrden, setNumOrden] = useState("");
    // Inputs específicos para proveedor
    const [proveedorNombre, setProveedorNombre] = useState("");
    const [proveedorRut, setProveedorRut] = useState("");
    const [proveedorContacto, setProveedorContacto] = useState("");
    const [asignado, setAsignado] = useState("");
    const [sucursalDestino, setSucursalDestino] = useState("");
    // Productos
    const [productos, setProductos] = useState<Producto[]>([]);
    const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", cantidad: 1, marca: "", categoria: "" });

    const handleAddProducto = () => {
        if (nuevoProducto.nombre && nuevoProducto.cantidad > 0 && nuevoProducto.marca && nuevoProducto.categoria) {
            setProductos([...productos, nuevoProducto]);
            setNuevoProducto({ nombre: "", cantidad: 1, marca: "", categoria: "" });
        }
    };

    const handleRemoveProducto = (idx: number) => {
        setProductos(productos.filter((_, i) => i !== idx));
    };

    const handleSubmit = () => {
        // Si es un ingreso y hay proveedor, guarda el ingreso en el historial del proveedor
        if (
            tipo === "ingreso" &&
            proveedorNombre &&
            proveedorRut &&
            productos.length > 0
        ) {
            addIngresoProveedor(
                {
                    nombre: proveedorNombre,
                    rut: proveedorRut,
                    contacto: proveedorContacto
                },
                {
                    fecha,
                    productos,
                    documentos: {
                        numRem,
                        numFactura,
                        numOrden
                    }
                }
            );
        }

        onSubmit({
            tipo,
            proveedor: tipo === "ingreso"
                ? {
                    nombre: proveedorNombre,
                    rut: proveedorRut,
                    contacto: proveedorContacto
                }
                : undefined,
            asignado: tipo === "salida" ? asignado : undefined,
            sucursalDestino: tipo === "salida" ? sucursalDestino : undefined,
            fecha,
            numRem,
            numFactura,
            numOrden,
            productos,
        });
        
        setProveedorNombre("");
        setProveedorRut("");
        setProveedorContacto("");
        setAsignado("");
        setSucursalDestino("");
        setFecha("");
        setNumRem("");
        setNumFactura("");
        setNumOrden("");
        setProductos([]);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: "#181818",
                    color: "#FFFFFF",
                    borderRadius: 2,
                }
            }}
        >
            <DialogTitle sx={{ color: "#FFFFFF", fontWeight: 700, background: "#181818" }}>
                {tipo === "ingreso" ? "Nuevo Ingreso" : "Nueva Salida"}
            </DialogTitle>
            <DialogContent dividers sx={{ background: "#181818" }}>
                <form>
                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                        {tipo === "ingreso" && (
                            <>
                                <TextField
                                    label="Proveedor"
                                    value={proveedorNombre}
                                    onChange={e => setProveedorNombre(e.target.value)}
                                    fullWidth
                                    required
                                    InputLabelProps={{ style: { color: "#FFFFFF" } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: "#FFFFFF",
                                            '& fieldset': { borderColor: "#949494" },
                                        },
                                        '& .MuiInputLabel-root': { color: "#FFFFFF" }
                                    }}
                                />
                                <TextField
                                    label="RUT Proveedor"
                                    value={proveedorRut}
                                    onChange={e => setProveedorRut(e.target.value)}
                                    fullWidth
                                    required
                                    InputLabelProps={{ style: { color: "#FFFFFF" } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: "#FFFFFF",
                                            '& fieldset': { borderColor: "#949494" },
                                        },
                                        '& .MuiInputLabel-root': { color: "#FFFFFF" }
                                    }}
                                />
                                <TextField
                                    label="Contacto Proveedor"
                                    value={proveedorContacto}
                                    onChange={e => setProveedorContacto(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ style: { color: "#FFFFFF" } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: "#FFFFFF",
                                            '& fieldset': { borderColor: "#949494" },
                                        },
                                        '& .MuiInputLabel-root': { color: "#FFFFFF" }
                                    }}
                                />
                            </>
                        )}
                        {tipo === "salida" && (
                            <TextField
                                label="Asignado a entrega"
                                value={asignado}
                                onChange={e => setAsignado(e.target.value)}
                                fullWidth
                                required
                                InputLabelProps={{ style: { color: "#FFFFFF" } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: "#FFFFFF",
                                        '& fieldset': { borderColor: "#949494" },
                                    },
                                    '& .MuiInputLabel-root': { color: "#FFFFFF" }
                                }}
                            />
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                        <TextField
                            label="Fecha"
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            InputLabelProps={{ shrink: true, style: { color: "#FFFFFF" } }}
                            fullWidth
                            required
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: "#FFFFFF",
                                    '& fieldset': { borderColor: "#949494" },
                                },
                                '& .MuiInputLabel-root': { color: "#FFFFFF" }
                            }}
                        />
                        <TextField
                            label="N° REM"
                            value={numRem}
                            onChange={e => setNumRem(e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ style: { color: "#FFFFFF" } }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: "#FFFFFF",
                                    '& fieldset': { borderColor: "#949494" },
                                },
                                '& .MuiInputLabel-root': { color: "#FFFFFF" }
                            }}
                        />
                        <TextField
                            label="N° Factura"
                            value={numFactura}
                            onChange={e => setNumFactura(e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ style: { color: "#FFFFFF" } }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: "#FFFFFF",
                                    '& fieldset': { borderColor: "#949494" },
                                },
                                '& .MuiInputLabel-root': { color: "#FFFFFF" }
                            }}
                        />
                        <TextField
                            label="N° Orden de compra"
                            value={numOrden}
                            onChange={e => setNumOrden(e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ style: { color: "#FFFFFF" } }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: "#FFFFFF",
                                    '& fieldset': { borderColor: "#949494" },
                                },
                                '& .MuiInputLabel-root': { color: "#FFFFFF" }
                            }}
                        />
                    </div>
                    {tipo === "salida" && (
                        <div style={{ marginBottom: 16 }}>
                            <TextField
                                label="Sucursal destino"
                                value={sucursalDestino}
                                onChange={e => setSucursalDestino(e.target.value)}
                                fullWidth
                                required
                                InputLabelProps={{ style: { color: "#FFFFFF" } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: "#FFFFFF",
                                        '& fieldset': { borderColor: "#949494" },
                                    },
                                    '& .MuiInputLabel-root': { color: "#FFFFFF" }
                                }}
                            />
                        </div>
                    )}
                    {/* Tabla de productos */}
                    <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                            <TextField
                                label="Producto"
                                value={nuevoProducto.nombre}
                                onChange={e => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                            />
                            <FormControl fullWidth>
                            <InputLabel sx={{ color: "#FFFFFF" }}>Marca</InputLabel>
                            <Select
                                value={nuevoProducto.marca}
                                label="Marca"
                                onChange={e => setNuevoProducto({ ...nuevoProducto, marca: e.target.value })}
                                sx={{
                                color: "#FFFFFF",
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: "#949494" }
                                }}
                            >
                                {marcas.map((marca, idx) => (
                                <MenuItem key={idx} value={marca}>{marca}</MenuItem>
                                ))}
                            </Select>
                            </FormControl>

                            <FormControl fullWidth>
                            <InputLabel sx={{ color: "#FFFFFF" }}>Categoría</InputLabel>
                            <Select
                                value={nuevoProducto.categoria}
                                label="Categoría"
                                onChange={e => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}
                                sx={{
                                color: "#FFFFFF",
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: "#949494" }
                                }}
                            >
                                {categorias.map((cat, idx) => (
                                <MenuItem key={idx} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                            </FormControl>
                            <TextField
                                label="Cantidad"
                                type="number"
                                value={nuevoProducto.cantidad}
                                onChange={e => setNuevoProducto({ ...nuevoProducto, cantidad: Number(e.target.value) })}
                                inputProps={{ min: 1 }}
                                style={{ width: 120 }}
                                InputLabelProps={{ style: { color: "#FFFFFF" } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: "#FFFFFF",
                                        '& fieldset': { borderColor: "#949494" },
                                    },
                                    '& .MuiInputLabel-root': { color: "#FFFFFF" }
                                }}
                            />
                            <IconButton
                                sx={{
                                    color: "#FFD700",
                                }}
                                onClick={handleAddProducto}
                            >
                                <AddIcon />
                            </IconButton>
                        </div>
                        <Table size="small" sx={{
                            background: "#232323",
                            borderRadius: 1,
                            '& th, & td': { color: "#FFFFFF", borderColor: "#949494" }
                        }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Marca</TableCell>
                                    <TableCell>Categoría</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Acción</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {productos.map((prod, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{prod.nombre}</TableCell>
                                        <TableCell>{prod.marca}</TableCell>
                                        <TableCell>{prod.categoria}</TableCell>
                                        <TableCell>{prod.cantidad}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                sx={{
                                                    color: "#FFD700",
                                                    background: "#232323",
                                                    '&:hover': { background: "#FFD70022" }
                                                }}
                                                onClick={() => handleRemoveProducto(idx)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </form>
            </DialogContent>
            <DialogActions sx={{ background: "#181818" }}>
                <Button onClick={onClose}
                    sx={{
                        color: "#FFD700",
                        borderColor: "#FFD700",
                        borderWidth: 1.5,
                        fontWeight: 600,
                        '&:hover': { background: "#FFD70022", borderColor: "#FFD700" }
                    }}
                    variant="outlined"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        background: "#FFD700",
                        color: "#181818",
                        fontWeight: 700,
                        '&:hover': { background: "#FFD700cc" }
                    }}
                >
                    Guardar
                </Button>
            </DialogActions>
        </Dialog>
    );
});