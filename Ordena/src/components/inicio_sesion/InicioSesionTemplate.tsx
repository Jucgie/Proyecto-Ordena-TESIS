import styled from "styled-components";
import { Btn } from "../button/ButtonSave";
import { RegUsuario } from "./RegistrarUs";
import { useState } from "react";
import ordena from "../../assets/ordena.svg";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

export function InicioFormulario() {
    const navigate = useNavigate();
    const setUsuario = useAuthStore(state => state.setUsuario);
    const [state, setState] = useState(false);
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");


    const manejarLogin = (e: React.FormEvent) => {
        e.preventDefault(); // <-- Esto evita el reload
        const usuariosGuardados = JSON.parse(localStorage.getItem("usuarios") || "[]");
        const usuario = usuariosGuardados.find(
            (u: any) => u.correo === correo && u.password === password
        );
        if (!usuario) {
            Swal.fire("Error", "Correo o contraseña incorrectos.", "error");
            return;
        }
        setUsuario(usuario); // Guarda en Zustand
        Swal.fire("Bienvenido", "Inicio de sesión exitoso.", "success").then(() => {
            navigate("/pedidos"); // Redirección correcta en React
        });
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