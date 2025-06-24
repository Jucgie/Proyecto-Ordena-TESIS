import { 
  Box, 
  Container, 
  TextField, 
  Typography, 
  Button, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel, 
  Select, 
  MenuItem, 
  Divider,
  Paper,
  IconButton,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Btn } from "../button/ButtonSave";
import styled from "styled-components";
import ferr from "../../assets/ferreteria.png";
import invt from "../../assets/invent.png";
import Swal from "sweetalert2";
import { useState } from "react";
import { SUCURSALES } from "../../constants/ubicaciones";
import { useAuthStore } from "../../store/useAuthStore";
import { useUsuariosStore } from "../../store/useUsuarioStore";
import { authService } from '../../services/authService';
import { useBodegaStore } from "../../store/useBodegaStore";

interface Props {
  setState: () => void;
}

export function RegUsuario({ setState }: Props) {
  const [nombre, setNombre] = useState("");
  const setUsuario = useAuthStore(state => state.setUsuario);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [rut, setRut] = useState(""); // Nuevo estado para RUT
  const [perfil, setPerfil] = useState<"sucursal" | "bodega-central" | "">("");
  const [sucursalId, setSucursalId] = useState<string>("");
  const [rol, setRol] = useState<"bodeguero" | "transportista" | "supervisor" | "">("");
  const addUsuario = useUsuariosStore((state: any) => state.addUsuario); // Corregido el tipo
  const setVista = useBodegaStore(state => state.setVista);

  const manejarRegistro = async () => {
    // Validaciones existentes
    if (!nombre || !correo || !password || !confirmar || !perfil || !rol || !rut) {
        Swal.fire("Error", "Todos los campos son obligatorios", "error");
        return;
    }

    // Agregar validación de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        Swal.fire("Error", "Por favor, introduce un correo electrónico válido", "error");
        return;
    }

    if (password !== confirmar) {
        Swal.fire("Error", "Las contraseñas no coinciden", "error");
        return;
    }

    if (perfil === "sucursal" && !sucursalId) {
        Swal.fire("Error", "Debes seleccionar una sucursal", "error");
        return;
    }

    // Validación de formato RUT chileno
    const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/;
    if (!rutRegex.test(rut)) {
        Swal.fire("Error", "El formato del RUT no es válido (ejemplo: 12.345.678-9)", "error");
        return;
    }

      try {
        const usuarioNuevo = {
            nombre,
            correo,
            contrasena: password,
            rut,
            rol,
            bodega: perfil === "bodega-central" ? "2" : undefined,
            sucursal: perfil === "sucursal" ? parseInt(sucursalId) : undefined // Convertir a número
        };

        console.log('Enviando datos de registro:', usuarioNuevo);

        const response = await authService.register(usuarioNuevo);
        setUsuario(response.usuario, response.token);
        
        // Establecer la vista según el perfil
        setVista(perfil === "bodega-central" ? "bodega" : "sucursal");
        
        Swal.fire("¡Registro exitoso!", "Tu cuenta ha sido creada.", "success");
        setState();
    } catch (error: any) {
        console.error('Error en registro:', error);
        const errorMessage = error.response?.data?.error || 
                          error.response?.data?.correo?.[0] || 
                          "Hubo un error al registrar el usuario.";
        Swal.fire("Error", errorMessage, "error");
    }
};

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: '#1E1E1E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        zIndex: 1000
      }}
    >
      {/* Header con botón de volver */}
      <Box
        sx={{
          width: '100%',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          bgcolor: '#1E1E1E',
          zIndex: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <IconButton 
          onClick={setState}
          sx={{
            color: '#FFD700', 
          }}
        >
          <ArrowBackIcon />
          <Typography sx={{ ml: 1, color: '#FFD700' }}>
            Volver a Inicio Sesión
          </Typography>
        </IconButton>
      </Box>

      {/* Contenido principal */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          py: 4,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#FFD700',
            fontWeight: 'bold',
            mb: 4,
            textAlign: 'center'
          }}
        >
          Crea una Cuenta
        </Typography>

        <Paper 
          elevation={3} 
          sx={{ 
            width: '100%',
            p: 4, 
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 2
          }}
        >
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Nombre"
              variant="outlined"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              InputProps={{
                sx: { 
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FFD700',
                  },
                }
              }}
              InputLabelProps={{
                sx: { color: 'white' }
              }}
            />

            <TextField
              fullWidth
              label="RUT (ejemplo: 12.345.678-9)"
              variant="outlined"
              value={rut}
              onChange={e => setRut(e.target.value)}
              InputProps={{
                sx: { 
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FFD700',
                  },
                }
              }}
              InputLabelProps={{
                sx: { color: 'white' }
              }}
            />

            <TextField
              fullWidth
              label="Correo electrónico"
              variant="outlined"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              InputProps={{
                sx: { 
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FFD700',
                  },
                }
              }}
              InputLabelProps={{
                sx: { color: 'white' }
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              variant="outlined"
              value={password}
              onChange={e => setPassword(e.target.value)}
              InputProps={{
                sx: { 
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FFD700',
                  },
                }
              }}
              InputLabelProps={{
                sx: { color: 'white' }
              }}
            />

            <TextField
              fullWidth
              label="Confirma contraseña"
              type="password"
              variant="outlined"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              InputProps={{
                sx: { 
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FFD700',
                  },
                }
              }}
              InputLabelProps={{
                sx: { color: 'white' }
              }}
            />

            <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

            <Typography variant="h6" sx={{ color: '#FFD700' }}>
              Perfil
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
              ¿Qué tipo de perfil administrarás?
            </Typography>

            <RadioGroup
              row
              value={perfil}
              onChange={(e) => {
                setPerfil(e.target.value as "sucursal" | "bodega-central" | "");
                setSucursalId("");
              }}
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 4,
                mb: 2
              }}
            >
              <FormControlLabel
                value="sucursal"
                control={
                  <Radio 
                    sx={{
                      color: 'white',
                      '&.Mui-checked': {
                        color: '#FFD700',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 2,
                    p: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: '#FFD700'
                    }
                  }}>
                    <img src={ferr} alt="Sucursal" style={{ width: 80, height: 80 }} />
                    <Typography sx={{ color: 'white', mt: 1 }}>Sucursal</Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
              <FormControlLabel
                value="bodega-central"
                control={
                  <Radio 
                    sx={{
                      color: 'white',
                      '&.Mui-checked': {
                        color: '#FFD700',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 2,
                    p: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: '#FFD700'
                    }
                  }}>
                    <img src={invt} alt="Bodega Central" style={{ width: 80, height: 80 }} />
                    <Typography sx={{ color: 'white', mt: 1 }}>Bodega Central</Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </RadioGroup>

            {perfil === "sucursal" && (
              <FormControl fullWidth>
                <FormLabel sx={{ color: '#FFD700', mb: 1 }}>
                  Selecciona tu sucursal:
                </FormLabel>
                <Select
                  value={sucursalId}
                  onChange={e => setSucursalId(e.target.value)}
                  sx={{ 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFD700',
                    },
                  }}
                >
                  <MenuItem value="">-- Selecciona --</MenuItem>
                  {SUCURSALES.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth>
              <FormLabel sx={{ color: '#FFD700', mb: 1 }}>
                Selecciona tu rol:
              </FormLabel>
              <Select
                value={rol}
                onChange={e => setRol(e.target.value as "bodeguero" | "transportista" | "supervisor" | "")}
                sx={{ 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FFD700',
                  },
                }}
              >
                <MenuItem value="">-- Selecciona --</MenuItem>
                <MenuItem value="bodeguero">Bodeguero</MenuItem>
                <MenuItem value="transportista">Transportista</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              onClick={manejarRegistro}
              sx={{
                bgcolor: '#FFD700',
                color: 'black',
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: '#FFE44D',
                },
                mt: 2
              }}
            >
              Registrarse
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

