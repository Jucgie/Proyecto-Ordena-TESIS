import React, { useState } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem
} from "@mui/material";
import { useAuthStore } from "../../store/useAuthStore";
import { SUCURSALES } from "../../constants/ubicaciones";
import { useUsuariosStore } from "../../store/useUsuarioStore";

export default function Empleados() {
    const usuario = useAuthStore(state => state.usuario);
    const { usuarios, updateUsuario, addUsuario, removeUsuario } = useUsuariosStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
    const [isNew, setIsNew] = useState(false);
    const [errores, setErrores] = useState<any>({});

    if (!usuario || usuario.rol !== "supervisor") {
        return (
            <Layout>
                <div style={{ color: "#FFD700", padding: 32, textAlign: "center" }}>
                    Solo los supervisores pueden acceder a este módulo.
                </div>
            </Layout>
        );
    }

    const validar = () => {
        const err: any = {};
        if (!empleadoSeleccionado.nombre || empleadoSeleccionado.nombre.length < 3)
            err.nombre = "El nombre es requerido (mínimo 3 caracteres)";
        if (!empleadoSeleccionado.correo || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(empleadoSeleccionado.correo))
            err.correo = "Correo inválido";
        if (isNew && (!empleadoSeleccionado.password || empleadoSeleccionado.password.length < 4))
            err.password = "Contraseña requerida (mínimo 4 caracteres)";
        if (!isNew && empleadoSeleccionado.password && empleadoSeleccionado.password.length < 4)
            err.password = "Si cambias la contraseña, debe tener mínimo 4 caracteres";
        if (!empleadoSeleccionado.rol)
            err.rol = "Rol requerido";
        if (!empleadoSeleccionado.sucursal?.id)
            err.sucursal = "Sucursal requerida";
        setErrores(err);
        return Object.keys(err).length === 0;
    };

    // Solo empleados de la sucursal del supervisor
    const empleadosSucursal = usuarios.filter(
        (emp: any) => emp.sucursal?.id === usuario.sucursal?.id
    );

    const handleOpenModal = (empleado: any = null) => {
        setIsNew(!empleado);
        setEmpleadoSeleccionado(
            empleado
                ? { ...empleado }
                : {
                      id: Date.now().toString(),
                      nombre: "",
                      correo: "",
                      rol: "sucursal",
                      sucursal: usuario.sucursal,
                      password: "",
                  }
        );
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEmpleadoSeleccionado(null);
        setIsNew(false);
    };

    const handleSave = () => {
        if (!validar()) return;
        if (isNew) {
            addUsuario(empleadoSeleccionado);
        } else {
            updateUsuario(empleadoSeleccionado.id, empleadoSeleccionado);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("¿Seguro que deseas eliminar este empleado?")) {
            removeUsuario(id);
        }
    };

    return (
        <Layout>
            <h2 style={{ color: "#FFD700", margin: "24px 0" }}>Gestión de Empleados</h2>
            <Button
                variant="contained"
                style={{ background: "#FFD700", color: "#181818", marginBottom: 16, fontWeight: 700 }}
                onClick={() => handleOpenModal()}
            >
                Agregar empleado
            </Button>
            <TableContainer component={Paper} style={{ background: "#181818" }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{ color: "#FFD700" }}>Nombre</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Correo</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Rol</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Sucursal</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {empleadosSucursal.map((emp: any) => (
                            <TableRow key={emp.id}>
                                <TableCell style={{ color: "#fff" }}>{emp.nombre}</TableCell>
                                <TableCell style={{ color: "#fff" }}>{emp.correo}</TableCell>
                                <TableCell style={{ color: "#fff" }}>{emp.rol}</TableCell>
                                <TableCell style={{ color: "#fff" }}>
                                    {SUCURSALES.find(s => s.id === emp.sucursal?.id)?.nombre || "-"}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        style={{ color: "#FFD700", borderColor: "#FFD700", marginRight: 8 }}
                                        onClick={() => handleOpenModal(emp)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        style={{ color: "#FF4D4F", borderColor: "#FF4D4F" }}
                                        onClick={() => handleDelete(emp.id)}
                                    >
                                        Eliminar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle style={{ background: "#232323", color: "#FFD700" }}>
                    {isNew ? "Agregar Empleado" : "Editar Empleado"}
                </DialogTitle>
                <DialogContent style={{ background: "#232323" }}>
                    {empleadoSeleccionado && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <TextField
                                label="Nombre"
                                value={empleadoSeleccionado.nombre}
                                onChange={e => setEmpleadoSeleccionado({ ...empleadoSeleccionado, nombre: e.target.value })}
                                variant="filled"
                                error={!!errores.nombre}
                                helperText={errores.nombre}
                                InputProps={{ style: { color: "#fff", background: "#181818" } }}
                                InputLabelProps={{ style: { color: "#FFD700" } }}
                            />
                            <TextField
                                label="Correo"
                                value={empleadoSeleccionado.correo}
                                onChange={e => setEmpleadoSeleccionado({ ...empleadoSeleccionado, correo: e.target.value })}
                                variant="filled"
                                error={!!errores.correo}
                                helperText={errores.correo}
                                InputProps={{ style: { color: "#fff", background: "#181818" } }}
                                InputLabelProps={{ style: { color: "#FFD700" } }}
                            />
                            <Select
                                value={empleadoSeleccionado.rol}
                                onChange={e => setEmpleadoSeleccionado({ ...empleadoSeleccionado, rol: e.target.value })}
                                variant="filled"
                                style={{ color: "#fff", background: "#181818" }}
                                error={!!errores.rol}
                            >
                                <MenuItem value="supervisor">Supervisor</MenuItem>
                                <MenuItem value="bodeguero">Bodeguero</MenuItem>
                                <MenuItem value="sucursal">Sucursal</MenuItem>
                            </Select>
                            {errores.rol && <span style={{ color: "#FF4D4F", fontSize: 13 }}>{errores.rol}</span>}
                            <Select
                                value={empleadoSeleccionado.sucursal?.id || ""}
                                onChange={e => setEmpleadoSeleccionado({
                                    ...empleadoSeleccionado,
                                    sucursal: SUCURSALES.find(s => s.id === e.target.value)
                                })}
                                variant="filled"
                                style={{ color: "#fff", background: "#181818" }}
                                disabled
                                error={!!errores.sucursal}
                            >
                                {SUCURSALES.map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                                ))}
                            </Select>
                            {errores.sucursal && <span style={{ color: "#FF4D4F", fontSize: 13 }}>{errores.sucursal}</span>}
                            <TextField
                                label="Contraseña"
                                type="password"
                                value={empleadoSeleccionado.password}
                                onChange={e => setEmpleadoSeleccionado({ ...empleadoSeleccionado, password: e.target.value })}
                                variant="filled"
                                error={!!errores.password}
                                helperText={errores.password || "Puedes cambiar la contraseña del usuario aquí"}
                                InputProps={{ style: { color: "#fff", background: "#181818" } }}
                                InputLabelProps={{ style: { color: "#FFD700" } }}
                            />
                        </div>
                    )}
                </DialogContent>
                <DialogActions style={{ background: "#232323" }}>
                    <Button onClick={handleCloseModal} style={{ color: "#fff" }}>Cancelar</Button>
                    <Button onClick={handleSave} style={{ color: "#FFD700" }}>
                        {isNew ? "Agregar" : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}