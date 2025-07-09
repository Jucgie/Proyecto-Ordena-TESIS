import styled from "styled-components";

import ordena from "../../assets/ordena.svg";

import React, { useEffect, useMemo, useState } from "react";

import Layout from "../../components/layout/layout";

import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, TextField, Select, MenuItem,
    Menu,
    Container, Snackbar, Alert
} from "@mui/material";

import { SUCURSALES } from "../../constants/ubicaciones";

import { useAuthStore } from "../../store/useAuthStore";
import { useUsuariosStore } from "../../store/useUsuarioStore";
import type { Usuario, CreateUsuarioData } from "../../store/useUsuarioStore";
import { useBodegaStore } from "../../store/useBodegaStore";
import { Message } from "@mui/icons-material";

export default function EmpleadosBodega() {

    const [busqueda, setBusqueda] = useState("");


    const usuario = useAuthStore(state => state.usuario);

    const { usuarios, fetchUsuarios, updateUsuario, addUsuario, removeUsuario, loading, error: storeError } = useUsuariosStore();

    const { bodegas, fetchBodegas } = useBodegaStore();

    const [modalOpen, setModalOpen] = useState(false);

    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Partial<Usuario & CreateUsuarioData> | null>(null);

    const [isNew, setIsNew] = useState(false);

    const [errores, setErrores] = useState<Partial<Record<keyof CreateUsuarioData, string>>>({});

    //Confirmación para deshabilitar
    const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
    const [employeeToDisable, setEmployeeToDisable] = useState<string | null>(null);

    //Ajustes Snackbar
    const [notificacion, setNotificacion] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error'
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {

        // Llama a la función para traer los usuarios de la API 
        fetchUsuarios();
        fetchBodegas();
    }, [fetchUsuarios, fetchBodegas]);

    //se obtiene el total de empleados
    const totalEmpleadosActivos = useMemo(() => {
        if (!usuario) return 0;
        return (Array.isArray(usuarios) ? usuarios : []).filter(
            (emp: Usuario) => emp.bodeg_fk == usuario.bodega && emp.is_active
        ).length;
    }, [usuarios, usuario?.bodega]);

    //obtiene los empleados y la busqueda
    const empleadosFiltrados = useMemo(() => {
        const empleadosActivosBodega = (Array.isArray(usuarios) ? usuarios : []).filter(
            (emp: Usuario) => emp.bodeg_fk == usuario.bodega && emp.is_active
        );
        if (!busqueda) {
            return empleadosActivosBodega;
        }

        const lowercaseBusqueda = busqueda.toLowerCase();
        return empleadosActivosBodega.filter(emp =>
            emp.nombre.toLowerCase().includes(lowercaseBusqueda) ||
            emp.correo.toLowerCase().includes(lowercaseBusqueda) ||
            emp.rut.toLowerCase().includes(lowercaseBusqueda) ||
            emp.rol_nombre.toLowerCase().includes(lowercaseBusqueda)

        );
    }, [usuarios, usuario, busqueda]);

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
        return <Layout>
            <div style={{ color: "#FF4D4F", padding: 32, textAlign: "center" }}>
                Error1: {storeError}
            </div></Layout>;
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

    // Solo empleados de la bodega del supervisor
    /*const empleadosBodega = (Array.isArray(usuarios) ? usuarios : []).filter(
        (emp: Usuario) => emp.bodeg_fk == usuario.bodega
    );*/

    /*
    const empleadosActivosBodega = empleadosBodega.filter(
        (emp: Usuario) => emp.is_active
    );*/


    // --- INICIO DEPURACIÓN ---
    // Para ayudarte a encontrar el problema, hemos añadido estos logs.
    // Abre la consola de tu navegador (F12) para verlos.
    console.log("--- DEPURANDO VISTA DE EMPLEADOS ---");
    console.log("Usuario Supervisor:", usuario);
    console.log("Todos los usuarios recibidos de la API:", usuarios);
    console.log(`Empleados encontrados en la bodega (${usuario.sucursal}):`, empleadosFiltrados);
    console.log(`Empleados encontrados en la bodega (${usuario.bodega}):`, empleadosFiltrados);
    console.log("Empleados activos (los que se deberían mostrar en la tabla):", empleadosFiltrados);
    console.log("--- FIN DEPURACIÓN ---")

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
                    bodeg_fk: usuario.bodega,
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

    //Agregar un empleado
    const handleSave = async () => {
        if (!validar()) return;
        if (!empleadoSeleccionado) return;
        try {

            if (isNew) {
                await addUsuario(empleadoSeleccionado as CreateUsuarioData);
                setNotificacion({
                    open: true,
                    message: 'Empleado agregado exitosamente',
                    severity: 'success'
                });
            } else {
                await updateUsuario(empleadoSeleccionado.id_us!, empleadoSeleccionado);
                setNotificacion({
                    open: true,
                    message: 'Empleado actualizado exitosamente',
                    severity: 'success'
                })
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error al guardar el empleado:", error);
            setNotificacion({
                open: true,
                message: 'Error al guardar el empleado',
                severity: 'error'
            })
        }
    };

    /*     const handleDelete = (id: string) => {
            if (window.confirm("¿Seguro que deseas eliminar este empleado?")) {
                removeUsuario(id);
            }
        }; */

    //Deshabilitar Empleado
    const ModalDeshabilitar = (id: string) => {
        setEmployeeToDisable(id);
        setConfirmDisableOpen(true);
    };
    const OpCerraModalDeshabilitar = () => {
        setConfirmDisableOpen(false);
        setEmployeeToDisable(null);
    };


    const ModalConfirmDeshabilitar = async () => {
        if (!employeeToDisable) return;
        try {
            // 1. Llamamos a updateUsuario y esperamos a que termine la actualización en el backend.
            await updateUsuario(employeeToDisable, { is_active: false });

            // 2. Una vez confirmado el cambio, volvemos a pedir la lista de usuarios.
            // Esto refresca el estado local y hace que el usuario desaparezca de la tabla de activos.
            //await fetchUsuarios();
            setNotificacion({
                open: true,
                message: 'Empleado deshabilitado exitosamente',
                severity: 'success'
            });
        } catch (error) {
            console.error("Error al deshabilitar el usuario:", error);
            //Notificación
            setNotificacion({
                open: true,
                message: 'Error al deshabilitar el usuario',
                severity: 'error'
            });

        } finally {
            OpCerraModalDeshabilitar();
        }
    };
    const handeCloseNotificacion = () => {
        setNotificacion({
            ...notificacion,
            open: false
        });
    }
    return (
        <Layout>

            <ContainerE>

                <h2 style={{ color: "#FFD700", margin: "10px 0" }}>Gestión de Empleados</h2>

                <Button
                    variant="contained"
                    style={{ background: "#FFD700", color: "#181818", marginBottom: 16, fontWeight: 700 }}
                    onClick={() => handleOpenModal()}
                >
                    Agregar empleado
                </Button>
                <TextField
                    label="Buscar Empleado..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    sx={{
                        marginBottom: '10px',
                        width: '100%',
                        height: '10%',
                        maxWidth: '500px',
                        maxHeight: '49px',
                        '& .MuiInputBase-root': {
                            color: 'white',
                        },
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: '#FFD700',
                            },
                            '&:hover fieldset': {
                                borderColor: 'white',
                            },
                        },
                        '& .MuiInputLabel-root': { color: '#FFD700' },
                    }}
                />
                <p style={{ display: 'flex', justifyContent: "flex-start", width: '90%', color: 'grey' }}> Mostrando {empleadosFiltrados.length} de {totalEmpleadosActivos} Empleados Activos</p>
                <div className="tablaPrincipal">
                    <TableContainer component={Paper}
                        sx={{
                            background: "#1b1a1a",
                            border: "1px solid rgb(36, 34, 34)",
                            maxHeight: "25vw",
                            minWidth: '75vw',
                            maxWidth: '75vw',
                        }}>
                        <Table stickyHeader sx={{ minWidth: 150 }} aria-label="simple table">
                            <TableHead sx={{
                                '& th': {
                                    backgroundColor: '#232323',
                                    color: 'white'
                                }
                            }}>
                                <TableRow>
                                    <TableCell style={{ color: "#FFD700" }}>Nombre</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Correo</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Rut</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Rol</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Bodega</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {empleadosFiltrados.length > 0 ? (

                                    empleadosFiltrados.map((emp: Usuario) => (
                                        <TableRow key={emp.id_us}>
                                            <TableCell style={{ color: "#fff" }}>{emp.nombre}</TableCell>
                                            <TableCell style={{ color: "#fff" }}>{emp.correo}</TableCell>
                                            <TableCell style={{ color: "#fff" }}>{emp.rut}</TableCell>
                                            <TableCell style={{ color: "#fff" }}>
                                                {emp.rol_nombre ? emp.rol_nombre.charAt(0).toUpperCase() + emp.rol_nombre.slice(1) : "-"}
                                            </TableCell>
                                            <TableCell style={{ color: "#fff" }}>
                                                {bodegas.find(b => b.id == emp.bodeg_fk)?.bodega_nombre || "-"}
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
                                                    onClick={() => ModalDeshabilitar(emp.id_us)}
                                                >
                                                    Deshabilitar
                                                </Button>

                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
                                            No se encontraron empleados activos para esta Bodega.

                                        </TableCell>
                                    </TableRow>
                                )}
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
                                    onChange={e => setEmpleadoSeleccionado({ ...empleadoSeleccionado, rol_fk: Number(e.target.value) })}
                                    variant="filled"
                                    style={{ color: "#fff", background: "#181818" }}
                                    error={!!errores.rol_fk}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Seleccione un rol</MenuItem>
                                    <MenuItem value={1}>
                                        Supervisor
                                    </MenuItem>
                                    <MenuItem value={2}>
                                        Bodeguero
                                    </MenuItem>
                                    <MenuItem value={3}>
                                        Transportista
                                    </MenuItem>
                                </Select>
                                {errores.rol_fk && <span style={{ color: "#FF4D4F", fontSize: 13 }}>{errores.rol_fk}</span>}
                                <Select
                                    value={empleadoSeleccionado.bodeg_fk || ""}
                                    variant="filled"
                                    style={{ color: "white", background: "#b9b4b4" }}
                                    disabled
                                >

                                    <MenuItem value="" disabled>
                                        Bodega
                                    </MenuItem>
                                    {(bodegas || []).map(b => (
                                        <MenuItem key={b.id} value={b.id}>
                                            {b.bodega_nombre}
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
                {/*Alerta/Notificacion */}
                <Snackbar
                    open={notificacion.open}
                    autoHideDuration={6000}
                    onClose={handeCloseNotificacion}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert onClose={handeCloseNotificacion} severity={notificacion.severity} sx={{ width: '100%' }}>
                        {notificacion.message}
                    </Alert>
                </Snackbar>

                {/*Mensaje de Eliminacion */}
                <Dialog
                    open={confirmDisableOpen}
                    onClose={OpCerraModalDeshabilitar}
                    PaperProps={{ style: { background: '#232323', color: 'white' } }}
                >
                    <DialogTitle style={{ color: "#FFD700" }}>
                        Confirmar Deshabilitación
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText style={{ color: 'white' }}>
                            ¿Estás seguro de deshabilitar a este empleado?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={OpCerraModalDeshabilitar} style={{ color: "#fff" }}>Cancelar</Button>
                        <Button onClick={ModalConfirmDeshabilitar} style={{ color: "#FF4D4F" }} autoFocus>
                            Deshabilitar
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