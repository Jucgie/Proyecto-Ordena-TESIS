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
    <Container>
      <div className="cerr">
        <span onClick={setState} className="vol"> 🠔 Volver a Inicio Sesión</span>
      </div>
      <h1 className="titulo">Crea una Cuenta</h1>
      <section className="subcontainer">
        <form className="formulario" id="registro-form" onSubmit={e => e.preventDefault()}>
          <section>
            <article>
              <input
                className="form_field"
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </article>
            <article>
              <input
                className="form_field"
                type="text"
                placeholder="RUT (ejemplo: 12.345.678-9)"
                value={rut}
                onChange={e => setRut(e.target.value)}
              />
            </article>
            <article>
              <input
                className="form_field"
                type="text"
                placeholder="Correo electrónico"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
              />
            </article>
            <article>
              <input
                className="form_field"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </article>
            <article>
              <input
                className="form_field"
                type="password"
                placeholder="Confirma contraseña"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
              />
            </article>
            <hr />
            <section className="t">
              <h3>Perfil</h3>
              <p>¿Qué tipo de perfil administrarás?</p>
            </section>
            <div className="radio_button">
              <label className="radio_perfil" transition-style="in:circle:bottom-right">
                <input
                  type="radio"
                  name="t_perfil"
                  checked={perfil === "sucursal"}
                  onChange={() => { setPerfil("sucursal"); setSucursalId(""); }}
                />
                <li>
                  <img src={ferr} alt="" />
                  <p>Sucursal</p>
                </li>
              </label>
              <label className="radio_perfil">
                <input
                  type="radio"
                  name="t_perfil"
                  checked={perfil === "bodega-central"}
                  onChange={() => { setPerfil("bodega-central"); setSucursalId(""); }}
                />
                <li>
                  <img src={invt} alt="" />
                  <p>Bodega Central</p>
                </li>
              </label>
            </div>
            {/* Select de sucursales solo si elige "sucursal" */}
            {perfil === "sucursal" && (
              <div style={{ marginTop: 16 }}>
                <label style={{ color: "#FFD700", fontWeight: 500 }}>
                  Selecciona tu sucursal:
                  <select
                    className="form_field"
                    style={{ marginLeft: 8, color: "#232323" }}
                    value={sucursalId}
                    onChange={e => setSucursalId(e.target.value)}
                  >
                    <option value="">-- Selecciona --</option>
                    {SUCURSALES.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {/* Select de rol */}
            <div style={{ marginTop: 16 }}>
              <label style={{ color: "#FFD700", fontWeight: 500 }}>
                Selecciona tu rol:
                <select
                  className="form_field"
                  style={{ marginLeft: 8, color: "#232323" }}
                  value={rol}
                  onChange={e => setRol(e.target.value as "bodeguero" | "transportista" | "supervisor" | "")}
                >
                  <option value="">-- Selecciona --</option>
                  <option value="bodeguero">Bodeguero</option>
                  <option value="transportista">Transportista</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </label>
            </div>
          </section>
        </form>
        <div className="btn_reg">
          <Btn titulo="Registrarse" background="#FFD700" funcion={manejarRegistro} />
        </div>
      </section>
    </Container>
  );
}


const Container = styled.div`
  position: absolute;
  height: 100vh;
  width: 100%;
  left: 50%;
  top:50%;
  transform: translate(-50%, -50%);
  border-radius: 20px;
  background: #1E1E1E;
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
  padding: 13px 26px 20px 26px;
  z-index: 100;
  display:flex;
  align-items:center;
  flex-direction:column;
  justify-content:center;

  .cerr{
  position:absolute;
  top:0;
  left:0;
  font-size:18px;
  font-weight:bold;
  margin:30px;
  cursor: pointer;
  color:#FFD700;  
  }

  .vol{
    display: inline-block;
    transition: 0.5s ease-in;
    &:hover{
    transform: translateX(-20px);
  }
  }

      @keyframes mover {
      0% {
        transform: translateX(0);
      }
      50% {
        transform: translateX(200px);
      }
      100% {
        transform: translateX(0);
      }
    }

  
  .titulo{
    font-size:28px;
    margin-top:60px;
    margin-bottom:10px;
  }


  .subContainer{
      width:100%;

  }
  .formulario{
      section {
      gap: 20px;
      display: flex;
      flex-direction: column;
  }

  .form_field{
      border: 1px solid white;
      background:transparent;
      border-radius:4px;
      margin:5px;
    }

  .btn_reg{
    display-flex;
    align-items:center;
    justify-content:center;
  }

  .radio_button{
    display:flex;
    flex-directions:column;
    justify-content:center;
    gap:20px;
    margin-bottom:10px;


  }
  .radio_perfil{
    justify-content:center;
    border: 1px solid white;
    border-radius:10px;
  transition-duration: 0.5s;

    img{
      width:90px;
      height:90px;
      padding: 10px
    }
    p{
      font-size:14px;
    }
    [type=radio] { 
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    li{
      list-style:none;
      width:100px;
      height:140px;
      cursor:pointer;
      border-radius:10px;

    }
  }
  
  .radio_perfil:hover{
    background: rgba(218,214,213,0.1)
  }


  .radio_perfil > input:checked + li{
      border-radius:10px;
      outline: 4px solid #FFD700;
      
  }

  .t{
    display:flex;
    margin:0px;
    padding:0px;
  }
`
