import styled from "styled-components";

import ordena from "../../assets/ordena.svg";

import React, { useEffect, useState } from "react";

import Layout from "../../components/layout/layout";

import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
    Menu,
    Container
} from "@mui/material";

import { SUCURSALES } from "../../constants/ubicaciones";

import { useAuthStore } from "../../store/useAuthStore";
import { useUsuariosStore } from "../../store/useUsuarioStore";
import type { Usuario,CreateUsuarioData } from "../../store/useUsuarioStore";

export default function Empleados() {

    const usuario = useAuthStore(state => state.usuario);

    const { usuarios, fetchUsuarios, updateUsuario, addUsuario, removeUsuario, loading, error: storeError  } = useUsuariosStore();
    
    const [modalOpen, setModalOpen] = useState(false);
    
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Partial<Usuario & CreateUsuarioData> | null>(null);
    
    const [isNew, setIsNew] = useState(false);
    
    const [errores, setErrores] = useState<Partial<Record<keyof CreateUsuarioData, string>>>({});

    useEffect(() => {
        // Llama a la función para traer los usuarios de la API 
        fetchUsuarios();
    }, [fetchUsuarios]);

    if (!usuario || usuario.rol !== "supervisor") {
        return (
            <Layout>
                <div style={{ color: "#FFD700", padding: 32, textAlign: "center" }}>
                    Solo los supervisores pueden acceder a este módulo.
                </div>
            </Layout>
        );
    }

    //Si la aplicación necesita cargar los datos 
    if (loading) {
        return (
            <Layout>
            <Loader>
                <>
                <img src={ordena} alt="Ordena_logo" />
                <p>Ordena</p>
                <div>Cargando Empleados...</div>
                </>
            </Loader>
            </Layout>)
        
        // <Layout><div style={{ color: "#FFD700", padding: 32, textAlign: "center" }}>Cargando empleados...</div></Layout>;
    }

        // Muestra un mensaje de error si la carga falla
    if (storeError) {
        return <Layout><div style={{ color: "#FF4D4F", padding: 32, textAlign: "center" }}>Error1: {storeError}</div></Layout>;
    }

    const validar = () => {
        if (!empleadoSeleccionado) return false;
        const err: Partial<Record<keyof CreateUsuarioData, string>> = {};
        if (!empleadoSeleccionado.nombre || empleadoSeleccionado.nombre.length < 3)
            err.nombre = "El nombre es requerido (mínimo 3 caracteres)";
        if (!empleadoSeleccionado.correo || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(empleadoSeleccionado.correo))
            err.correo = "Correo inválido";
        if (isNew && (!empleadoSeleccionado.contrasena || empleadoSeleccionado.contrasena.length < 4))
            err.contrasena = "Contraseña requerida (mínimo 4 caracteres)";
        if (!isNew && empleadoSeleccionado.contrasena && empleadoSeleccionado.contrasena.length < 4)
            err.contrasena = "Si cambias la contraseña, debe tener mínimo 4 caracteres";
        if (!empleadoSeleccionado.rol_fk)
            err.rol_fk = "Rol requerido";
        setErrores(err);
        return Object.keys(err).length === 0; 
    };

    // Solo empleados de la sucursal del supervisor
    const empleadosSucursal = usuarios.filter(
        (emp: Usuario) => emp.sucursal_fk === usuario.sucursal && emp.is_active
    );

    //

    const handleOpenModal = (empleado: Usuario | null = null) => {
        setIsNew(!empleado);
        setEmpleadoSeleccionado(
            empleado
                ? { ...empleado }
                : {
                      nombre: "",
                      correo: "",
                      rut: "",
                      rol_fk: undefined, // Para que el placeholder del Select se muestre
                      sucursal_fk: usuario.sucursal,
                      contrasena: "",
                  }
        );
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEmpleadoSeleccionado(null);
        setIsNew(false);
        setErrores({});
    };

    const handleSave = async () => {
        if (!validar()) return;
        if (!empleadoSeleccionado) return;
        if (isNew) {
            await addUsuario(empleadoSeleccionado as CreateUsuarioData);
        } else {
            await updateUsuario(empleadoSeleccionado.id_us!, empleadoSeleccionado);
        }
        handleCloseModal();
    };

/*     const handleDelete = (id: string) => {
        if (window.confirm("¿Seguro que deseas eliminar este empleado?")) {
            removeUsuario(id);
        }
    }; */
    const handleDisable = (id: string) => {
        if (window.confirm("¿Seguro que deseas deshabilitar este empleado?")) {
            // Llamamos a updateUsuario para cambiar el estado a inactivo
            // El backend ya sabe cómo manejar 'is_active'
            updateUsuario(id, { is_active: false });
        }
    };
    return (
        <Layout>

            <ContainerE>

            <h2 style={{ color: "#FFD700", margin: "24px 0" }}>Gestión de Empleados</h2>

            <Button
                variant="contained"
                style={{ background: "#FFD700", color: "#181818", marginBottom: 16, fontWeight: 700 }}
                onClick={() => handleOpenModal()}
            >
                Agregar empleado
            </Button>

            <div className="tablaPrincipal">
            <TableContainer component={Paper} 
                sx={{ background: "#1b1a1a",
                        border: "1px solid rgb(36, 34, 34)",
                        maxHeight:"25vw"
                     }}>
                <Table stickyHeader sx={{minWidth: 150 }} aria-label="simple table">
                    <TableHead sx={{
                            '& th': {
                                backgroundColor: '#232323',
                                color: 'white'}
                            }}>
                        <TableRow>
                            <TableCell style={{ color: "#FFD700" }}>Nombre</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Correo</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Rut</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Rol</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Sucursal</TableCell>
                            <TableCell style={{ color: "#FFD700" }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {empleadosSucursal.map((emp: Usuario) => (
                            <TableRow key={emp.id_us}>
                                <TableCell style={{ color: "#fff" }}>{emp.nombre}</TableCell>
                                <TableCell style={{ color: "#fff" }}>{emp.correo}</TableCell>
                                <TableCell style={{ color: "#fff" }}>{emp.rut}</TableCell>
                                <TableCell style={{ color: "#fff" }}>
                                    {emp.rol_nombre ? emp.rol_nombre.charAt(0).toUpperCase() + emp.rol_nombre.slice(1) : "-"}
                                </TableCell>
                               <TableCell style={{ color: "#fff" }}>
                                    {SUCURSALES.find(s => s.id == emp.sucursal_fk)?.nombre || "-"}
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
                                        onClick={() => handleDisable(emp.id_us)}
                                    >
                                        Deshabilitar
                                    </Button>

                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            </div>

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
                            <TextField
                                label="RUT"
                                value={empleadoSeleccionado.rut}
                                onChange={e => setEmpleadoSeleccionado({ ...empleadoSeleccionado, rut: e.target.value })}
                                variant="filled"
                                InputProps={{ style: { color: "#fff", background: "#181818" } }}
                                InputLabelProps={{ style: { color: "#FFD700" } }}
                            />
                            <Select
                                value={empleadoSeleccionado.rol_fk || ""}
                                onChange={e => setEmpleadoSeleccionado({ ...empleadoSeleccionado, rol_fk: Number (e.target.value) })}
                                variant="filled"
                                style={{ color: "#fff", background: "#181818" }}
                                error={!!errores.rol_fk}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>Seleccione un rol</MenuItem>
                                <MenuItem value={1}>
                                    Administrador
                                </MenuItem>
                                <MenuItem value={2}>
                                    Supervisor
                                </MenuItem>
                                <MenuItem value={3}>
                                    Bodeguero
                                </MenuItem>
                            </Select>
                            {errores.rol_fk && <span style={{ color: "#FF4D4F", fontSize: 13 }}>{errores.rol_fk}</span>}
                            <Select
                                value={empleadoSeleccionado.sucursal_fk || ""}
                                variant="filled"
                                style={{ color: "white", background: "#9c9494" }}
                                disabled
                            >

                                <MenuItem value="" disabled>
                                    Sucursal
                                </MenuItem>
                                {SUCURSALES.map(s=>(
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.nombre}
                                    </MenuItem>
                                ))}
                            </Select>

{/*                             <Select
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
                            {errores.sucursal && <span style={{ color: "#FF4D4F", fontSize: 13 }}>{errores.sucursal}</span>} */}
                            <TextField
                                label="Contraseña"
                                type="password"
                                value={empleadoSeleccionado.contrasena}
                                onChange={e => setEmpleadoSeleccionado({ ...empleadoSeleccionado, contrasena: e.target.value })}
                                variant="filled"
                                error={!!errores.contrasena}
                                helperText={errores.contrasena || (isNew ? "" : "Dejar en blanco para no cambiar")}
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
        </ContainerE>
        </Layout>
    );
}

const ContainerE = styled.div`
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:flex-start;;
    width:100%;
    box-sizing:border-box;
    padding:2rem;
`

const Loader = styled.div`
    display:flex;
    position:fixed;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    background: rgba(0, 0, 0, 0.52);
    z-index: 1000;
    right:0;
    top: 0;
    width: 85.5%;
    height: 100%;

    img{
        width: 150px;
        height: 150px;

        animation: animate 2s infinite ease-in-out;
    
    }
    p{
        text-align:center;
        font-size:30px;
        font-weight:bold;
        animation: animate 2s infinite ease-in-out;

    }

    @Keyframes animate{
      0% {
        transform: scale(1);
        opacity:60%;
  }
  50% {
    transform: scale(1.1); /* Aumenta el tamaño al 110% */
        opacity:100%;
  }
  100% {
    transform: scale(1);
    opacity:60%;
  }
    }
        
 `