import styled from "styled-components";
import sin_imagen from "../../assets/sin_imagen.png"
import { BtnProd} from "../button/ButtonProd";
import { useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import type { ProductInt } from "../../pages/inventario/inventario";
import { MenuItem, Select } from "@mui/material";


interface Props {
    setProd: () => void;
    product: ProductInt;
    onSave?:(product:ProductInt) => void;
}

export function ProductDetails({ setProd, product, onSave}: Props) {

    const [producto, setProducto] = useState(product);

    const [isEditing, setIsEditing] = useState(false); //edicion o no

    const handleSave = () => {
        setIsEditing(false);
        if (onSave) onSave(producto);
        console.log("Datos guardados:", producto);
    };


    return (
        <Container>

            <section>
                <div className="cerr">
                    <span onClick={setProd} className="vol"> 🠔 Volver</span>
                </div>
                <div className="edit">
                    <BtnProd 
                    titulo={<>
                        <EditIcon
                        sx={{ fontSize: 25, marginRight: 1 }}
                        />Editar
                    </>} 
                    background="#0087ff"
                    funcion={() => setIsEditing(true)} />
                    {isEditing && <button style={{background:"#ff1700"}} onClick={handleSave}>Guardar</button>}

                </div>
            </section>
            <h1 className="titulo"></h1>
            <section className="subcontainer">
                <div className="sidebar">
                    <div className="t_sidebar">
                        {isEditing ? (
                            <Input
                                type="text"
                                value={producto.name}
                                onChange={(e) =>
                                    setProducto((prev) => ({ ...prev, name: e.target.value }))
                                }
                            />
                        ) : (
                            <EditableText>{producto.name}</EditableText>
                        )}

                    </div>
                    <div className="img_content">
                        <img src={sin_imagen} alt="img_product" />
                    </div>
                    <div className="detalles">
                        <h3>stock</h3>
                        <p>12</p>
                    </div>
                    <div className="detalles">
                        <h3>Cod. Interno</h3>
                        <p>{product.code}</p>
                    </div>
                    <div className="detalles">
                        <h3>Marca</h3>
                        { isEditing?(
                            <Select type="text" 
                                value={producto.brand}
                                onChange={
                                    (e) => setProducto((prev)=>({...prev,brand:e.target.value}))
                                }
                                sx={{ color: "white",
                                    minHeight: 0,height:"35px",border:"1px solid white"}}
                            >
                        
                               <MenuItem 
                                    value="marca_1"
                                    >marca_1</MenuItem>
                               <MenuItem 
                                    value="marca_2">marca_2</MenuItem>
                                <MenuItem value="marca_3">marca_3</MenuItem> 
                            </Select>
                        ) : (
                            <EditableText>{producto.brand}</EditableText>
                        )}
                    </div>
                    <div className="detalles">
                        <h3>Categoría</h3>
                        {isEditing?(
                            <Select type="text" 
                                value={producto.category}
                                onChange={
                                    (e) => setProducto((prev)=>({
                                        ...prev,category:e.target.value
                                    }))
                                }
                                sx={{ color: "white" ,height:"35px",border:"1px solid white"}}
                            >
                                <MenuItem 
                                    value="categoria_1"
                                    >categoria_1</MenuItem>
                                <MenuItem 
                                    value="categoria_2">categoria_2</MenuItem>
                                <MenuItem value="categoria_3">categoria_3</MenuItem>

                            </Select>
                        ):(
                            <EditableText>{producto.category}</EditableText>
                        )}
                    </div>
                </div>
                <div className="contenidoPrincipal">
                    <div className="dos">
                        <div className="cont_descrp">
                            <h2>Descripción</h2>
                           {isEditing?(
                                <Textarea 
                                    value={producto.description}
                                    onChange={
                                        (e) => setProducto((prev)=>({
                                            ...prev,description:e.target.value
                                        }))
                                    }
                                />
                           ):(
                                <EditableText>{producto.description}</EditableText>
                           )}
                        </div>
                        <h2 className="titulo_info">Detalles</h2>
                        <div className="info">

                            <div className="info_dt">
                                <h3>N° Veces Repuesto</h3>
                                <p className="content-info">1</p>
                            </div>
                            <div className="info_dt">
                                <h3>Sucursal más pedida</h3>
                                <p className="content-info">nombre_sucursal</p>
                            </div>

                        </div>
                    </div>
                </div>
            </section>
        </Container>
    );
}

const Container = styled.div`
  position:fixed;
  height: 100vh;
  width: 60%;
  left: 56%;
  top:50%;
  transform: translate(-50%, -50%);
  border-radius: 20px;
  background: #1E1E1E;
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
  padding: 13px 26px 20px 26px;
  z-index: 200;
  display:flex;
  align-items:center;
  flex-direction:column;

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

  .edit{
    position:absolute;
    top:0;
    right:0;
    margin:20px;
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
    display:flex;
    font-size:28px;
    margin-top:60px;
    margin-bottom:10px;
  }


  .subcontainer{
      display:flex;
    flex-direction: row;
  }
    .sidebar{
        width:35%;
        padding:10px;
        border:1px solid #191616;
        border-radius:20px;
        background:#272626;
        box-shadow:1px 1px 1px 1px rgba(0,0,0,0.25);

    }

    .t_sidebar{
        display:flex;
        justify-content:center;
        font-weigth:bold;
    }
    .contenidoPrincipal{
        width:65%;
    }
    .dos{
        display:flex;
        flex-direction:column;
        margin-left:20px;

    }
    .cont_descrp{
        border:1px solid #191616;
        border-radius:20px;
        background:#272626;
        box-shadow:1px 1px 1px 1px rgba(0,0,0,0.25);
        padding:20px;
        width:100%;
    }
    .titulo_info{
        margin-top:100px;

    }
    .info{
        display:flex;
        align-items:center;
        justify-content:center;
        margin-top:20px;
        flex-wrap:wrap;
        width:100%;
        gap:20px;
    }

    // Propiedades para el sidebar
    .img_content{
        display:flex;
        justify-content:center;
        padding:20px;
        border-radius:20px;
    }
    .detalles{
       
        margin-left:10px;
        padding:0px 10px 10px;
        font-size:20px;
    }

    // propiedades para info en contenidoPrincipal
    .info_dt{
        border:1px solid #191616;
        padding:0px 20px 20px;
        border-radius:20px;
        background:#272626;
        box-shadow:1px 1px 1px 1px rgba(0,0,0,0.25);
    }
    .content-info{
        display:flex;
        justify-content:center;
        font-size:18px;
        margin-top:10px;
    }
  }

  `
const Input = styled.input`
  font-size: 18px;
  padding: auto;
  width: 100%;
  height:auto;
  border: 1px solid #ccc;
`;



const EditableText = styled.p`
    display:flex;
  font-size: 18px;
  padding: auto;
  width:auto;
  height:auto;
`;

const Textarea = styled.textarea`
    padding:auto;
    height:100px;
    width:100%;
`