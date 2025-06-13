import styled from "styled-components";
import InfoIcon from '@mui/icons-material/Info';
import { useState } from "react";
import type { ProductInt } from "../../pages/inventario/inventario";   





interface Props {
    setState: () => void;
    onAddProduct: (product: ProductInt) => void;
      name: string;
  code: string;
  brand: string;
  category: string;
  description: string;
  im: File | null;

}


export function AddProduct({ setState, onAddProduct }: Props) {
      console.log("onAddProduct es:", onAddProduct);

      const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const [form, setForm] = useState<ProductInt>({
        name: "",
        code: "",
        brand: "",
        category: "",
        description: "",
        im: null as File | null,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === "file") {
            setForm({ ...form, [name]: (e.target as HTMLInputElement).files?.[0] || null });
        } else {
            setForm(f => ({ ...f, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí puedes enviar el producto a tu backend o actualizar el estado global
        // Validación de campos vacíos
    const newErrors: { [key: string]: string } = {};
    if (!form.name.trim()) newErrors.name = "Campo obligatorio";
    if (!form.code.trim()) newErrors.code = "Campo obligatorio";
    if (!form.brand.trim()) newErrors.brand = "Campo obligatorio";
    if (!form.category.trim()) newErrors.category = "Campo obligatorio";
    if (!form.description.trim()) newErrors.description = "Campo obligatorio";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;
    
        console.log("Producto agregado:", form);
        // Limpia el formulario si quieres
        onAddProduct(form);
        setForm({
            name: "",
            code: "",
            brand: "",
            category: "",
            description: "",
            im: null,
        });
        // Puedes cerrar el modal o mostrar un mensaje
        setState();
    };

    return (
        <Container>


            <div className="cerr">
                <span onClick={setState} className="vol"> 🠔 Volver</span>
            </div>
            <h1 className="titulo">Añadir Producto</h1>
            <section className="subcontainer">
                <form
                    className="formulario"
                    id="registro-form"
                    onSubmit={handleSubmit}
                >
                    <section>
                        <article>
                            <input
                                className="form_field"
                                type="text"
                                name="name"
                                placeholder="Nombre Producto"
                                value={form.name}
                                onChange={handleChange}

                            />
                            {errors.name && <span style={{ color: "red", marginLeft: 8 }}>{errors.name}</span>}
                        </article>
                        <article>
                            <input
                                className="form_field"
                                type="text"
                                name="code"
                                placeholder="Codigo Interno"
                                value={form.code}
                                onChange={handleChange}
                            />
                            {errors.name && <span style={{ color: "red", marginLeft: 8 }}>{errors.name}</span>}
                        </article>
                        <article>
                            <select
                                className="form_field"
                                name="brand"
                                value={form.brand}
                                onChange={handleChange}
                            >
                                <option 
                                 
                                selected
                                >
                                    Selecciona una marca
                                </option>
                                <option value="marca_1">marca_1</option>
                                <option value="marca_2">marca_2</option>
                                <option value="marca_3">marca_3</option>

                            </select>

                            {errors.name && <span style={{ color: "red", marginLeft: 8 }}>{errors.name}</span>}
                        </article>
                        <article>
                            <select
                                className="form_field"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                            >
                                <option 
                                 
                                selected
                                >
                                    Selecciona una categoría
                                </option>
                                <option value="categoria_1">categoria_1</option>
                                <option value="categoria_2">categoria_2</option>
                                <option value="categoria_3">categoria_3</option>
                            </select>
                            {errors.category && <span style={{ color: "red", marginLeft: 8 }}>{errors.category}</span>}
                        </article>
                        <hr />
                        <article>
                            <p>Imagen del Producto 
                                (<InfoIcon sx={{
                                    fontSize:"18px"
                                    }}/> Formato requerido : 160 x 160)</p>
                            <input
                                className="form_field"
                                type="file"
                                name="im"
                                placeholder="imagen"
                                onChange={handleChange}
                            />
                        </article>
                        <hr />
                        <article>
                            <textarea
                                className="form_field_desc"
                                name="description"
                                placeholder="Descripción"
                                value={form.description}
                                onChange={handleChange}
                            />
                            {errors.name && <span style={{ color: "red", marginLeft: 8 }}>{errors.name}</span>}
                        </article>


                    </section>
                <div className="btn_reg">
                    <button 
                        type="submit" 
                        className="btn" 
                        style={{background:"#FFD700"}}
                        >Agregar</button>
                </div>
                </form>
            </section>
        </Container>
    );
}


const Container = styled.div`
  position:fixed;
  height: 100vh;
  width: auto;
  left: 56%;
  top:50%;
  transform: translate(-50%, -50%);
  border-radius: 20px;
  background: #1E1E1E;
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
  padding: 13px 26px 20px 26px;
  z-index: 200;
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
        display:flex;
        width:50%;
        max-height: 440px;
        justify-content:center;


    
  }
  .formulario{
        margin-bottom:40px;
        max-height:400px;
        overflow-y:scroll;
        scroll-behavior: smooth;
        padding:30px;
        border:1px solid #191616;
        border-radius:20px;
        width:auto;
        box-shadow:1px 1px 1px 1px rgba(0,0,0,0.25);
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
      padding:10px;

      selected{
      border-radius: 8px;}

      option{
        background: #2E2E2E;
        border-raidius: 40px;
      }
    }
  .form_field_desc{
      border: 1px solid white;
      background:transparent;
      border-radius:4px;
      margin:5px;
      padding:20px;
    }
  .btn_reg{
    display:flex;
    justify-content:center;
    align-content:center;
    margin-top:50px;

    }

    p{
      font-size:14px;
    }

    li{
      list-style:none;
      width:100px;
      height:140px;
      cursor:pointer;
      border-radius:10px;

    }
  }


`
