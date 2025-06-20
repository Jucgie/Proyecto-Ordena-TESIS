import styled from "styled-components";
import { Btn } from "../button/ButtonSave";
import { RegUsuario } from "./RegistrarUs";
import { useState } from "react";
import ordena from "../../assets/ordena.svg";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { authService } from '../../services/authService';
import { useBodegaStore } from "../../store/useBodegaStore";

export function InicioFormulario() {
    const navigate = useNavigate();
    const setUsuario = useAuthStore(state => state.setUsuario);
    const [state, setState] = useState(false);
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const setVista = useBodegaStore(state => state.setVista);


    const manejarLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validar correo electrónico antes de enviar
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                Swal.fire("Error", "Por favor, introduce un correo electrónico válido", "error");
                return;
            }
    
            const response = await authService.login(correo, password);
            
            console.log('Respuesta del login:', response); // Para depuración
            
            const usuarioTransformado = {
                ...response.usuario,
                bodega: response.usuario.bodega?.toString(),
                sucursalId: response.usuario.sucursal?.toString() || response.usuario.sucursalId?.toString()
            };
            
            console.log('Usuario transformado:', usuarioTransformado); // Para depuración
            
            if (!response.token) {
                throw new Error('No se recibió token del servidor');
            }
            
            setUsuario(usuarioTransformado, response.token);
            
            // Establecer la vista según el tipo de usuario
            if (response.usuario.bodega) {
                setVista("bodega");
            } else if (response.usuario.sucursal) {
                setVista("sucursal");
            }
            
            Swal.fire("Bienvenido", "Inicio de sesión exitoso.", "success").then(() => {
                navigate("/pedidos");
            });
        } catch (error: any) {
            console.error('Error en login:', error);
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.correo?.[0] || 
                               "Correo o contraseña incorrectos.";
            Swal.fire("Error", errorMessage, "error");
        }
    };
    
    return (
        <Container>
            <div className="contentCard">
                <div className="card">
                    {state && <RegUsuario setState={() => setState(false)} />}
                    {!state && (
                        <>
                            <div className="content_logo">
                                <img src={ordena} alt="Logo" className="img" />
                                <span className="nombre_logo">Ordena</span>
                                <p className="frase">Gestiona Con Facilidad</p>
                            </div>
                            <div className="d">
                                <h1>Iniciar Sesión</h1> <br />
                                <form onSubmit={manejarLogin}>
                                    <div className="fd">
                                        <input
                                            className="form_field"
                                            type="text"
                                            placeholder="Correo electrónico"
                                            value={correo}
                                            onChange={e => setCorreo(e.target.value)}
                                        />
                                    </div> <br />
                                    <div>
                                        <input
                                            className="form_field"
                                            type="password"
                                            placeholder="Contraseña"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="btn_s">
                                        <Btn titulo="Ingresar" background="#FFD700" />
                                    </div>
                                </form>
                                <div className="reg_f">
                                    <label className="m">
                                        <span>¿ No tienes una cuenta?</span>
                                        <Btn funcion={() => setState(true)} titulo="Crear Cuenta" />
                                    </label>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Container>
    );
}

const Container = styled.div`
    background-size:cover;
    height: 100vh;
    width:100%;
    display:flex;
    justify-content:center;
    text-align:center;


    .contentCard{  
        background-size:cover;
        grid-column:1;
        position:relative;
        display:flex;
        flex-direction:column;
        justify-content:center;

    }

    .img{
        width:50px;
        height:50px;
    }

    .content_logo{
        background-color: transparent;
    }

    .nombre_logo{
        font-size:39px;
        font-weight: bold;
    }
    
    .frase{
        margin-top:15px;
        opacity:50%    
    }

    .card{
        width:100%;
        padding-top:10px
    }

    .d{
        border-radius:20px;
        background-color: #1E1E1E;
        padding:60px;
        width:60vh;

    }

    .form_field{
        border: 1px solid white;
        width:100%;
        padding:10px;
        background:transparent;
        border-radius:4px
    }
  
    .btn_s{
        margin-top: 15px;
        display: flex;
        justify-content: center;
    }


    .reg_f{
        padding-top:10px;
        display:flex;
        justify-content:center;
        .Btn{
            display:flex;
            justify-content:center;
            padding:0;
            color:white;

    }


    
    @media(max-width:600px){
        *{
            padding:0;
        }
        .d{
            Display:flex;
            align-items:center;
            padding-right:0px;
            justify-content:center;
        }
    }
`