import React, { useState } from "react";
import styled from "styled-components";
import { BtnProd} from "../button/ButtonProd";
import { AddProduct } from "../formularioProductos/FormProduct";
import { ProductDetails } from "../productDetalles/ProductDetails";
import sin_imagen from "../../assets/sin_imagen.png"
import SearchIcon from '@mui/icons-material/Search';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import Checkbox from '@mui/material/Checkbox';
import { red } from '@mui/material/colors';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { AddFiltro } from "../filtro/FiltroProd";
import type { ProductInt } from "../../pages/inventario/inventario";
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import Swal from 'sweetalert2';

interface ProductProps {
    products: ProductInt[];
    onAddProduct: (product: ProductInt) => void;
    onUpdateProduct: (product: ProductInt) => void;
    onDeleteProduct: (code: string[]) => void;
}

export function InvnTemplate({ products = [], onAddProduct, onUpdateProduct, onDeleteProduct }: ProductProps) {

    const [state, setState] = useState(false);
    const [prod, setProd] = useState<ProductInt | null>(null);
    const [filtr, setFiltr] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [filtros, setFiltros] = useState<{ categoria?: string; marca?: string }>({});

    const handleFiltrar = (filtrosSeleccionados: { categoria?: string; marca?: string }) => {
  setFiltros(filtrosSeleccionados);
};

    const filteredProducts = products.filter(product =>{
        const matchProductName=product.name.toLowerCase().includes(search.toLowerCase());
        const matchCategoria = !filtros.categoria || product.category === filtros.categoria;
        const matchMarca = !filtros.marca || product.brand === filtros.marca;
        return matchProductName && matchCategoria && matchMarca;
});

    return (
        <Container >
            <section className="fix">
                <section className="botones">
                    <div className="busqueda">
                        {/*Boton de filtro */}
                        <BtnProd
                            titulo={<>
                                <FilterAltIcon /> filtro
                            </>}
                            background="#FFD700"
                            funcion={() => setFiltr(true)} />
                        {/*Barra de busqueda */}
                        <div className="search_bar">
                            <input type="text" placeholder="Buscar..." className="bar_bsq" value={search}
                                onChange={e => setSearch(e.target.value)} />

                            <button className="b_bar">
                                <SearchIcon />
                            </button>
                        </div>
                    </div>
                    <div className="boton">
                        {/*Boton para añadir nuevos productos */}
                        <label className="b">
                            <BtnProd
                                titulo={
                                    <><AddIcon
                                        sx={{ fontSize: 25, marginRight: 1 }}
                                    />Añadir</>}
                                funcion={() => setState(true)}
                                color="white"
                                background="#FFD700"
                            />
                        </label>


                        <label>
                            {/*Boton para eliminar */}
                            <BtnProd
                                titulo={<>
                                    <DeleteIcon
                                        sx={{ fontSize: 25, marginRight: 1 }}
                                    />Eliminar
                                </>}
                                background="#ff1b00"
                                funcion={() => setDeleteMode(!deleteMode)} />
                        </label>
                        {/*                <label>
                        <BtnProdProd titulo="Editar"
                            background="#0064ff" />
                    </label>  */}
                    </div>

                    {state && (
                        <>
                            <div className="overlay" onClick={() => setState(false)}></div>
                            <AddProduct 
                                open={state} 
                                onClose={() => setState(false)} 
                                onAddProduct={onAddProduct}
                                marcas={[]}
                                categorias={[]}
                            />
                        </>
                    )}
                    {
                        filtr && (
                        <AddFiltro 
                        onFiltrar={handleFiltrar}
                        setFiltr={() => setFiltr(false)} />
                    )}
                    {
                        prod && (<ProductDetails
                            setProd={() => setProd(null)}
                            product={prod}
                            onSave={onUpdateProduct}
                        />
                        )}
                </section>
                <section className="filtros">
                </section>
            </section>
            <section className="list" >
                {/*                 <Product
                    type="button"
                    className="inventario"
                    onClick={(e) => {
                        if (deleteMode) {
                            e.stopPropagation();
                            return;
                        }
                        setProd(true)
                    }}>
                    {deleteMode && (
                        <div className="selectionOverlay"
                            onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" />
                        </div>
                    )}
                    <div className="contenidoCard">
                        <div className="Card">
                            <div className="imagen">
                                <img alt="img_producto" />
                            </div>
                            <div>
                                <p className="n_prod">nombre_producto</p>
                                <p>nombre_marca | nombre categoria</p>
                            </div>
                        </div>
                    </div>


                </Product> */}
                {products.length === 0 ? (
                    <div style={{
                        width: "100%",
                        textAlign: "center",
                        color: "#aaa",
                        fontSize: "1.9rem",
                        marginTop: "120px"
                    }}>

                          <WarningTwoToneIcon sx={{fontSize:"90px"}}/>
                       <p>
                        No existen registros previos, empieza a agregarlos en "+ Añadir".
                        </p> 
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div style={{
                        width: "100%",
                        textAlign: "center",
                        color: "#aaa",
                        fontSize: "1.9rem",
                        marginTop: "120px"
                    }}>
                        <WarningTwoToneIcon sx={{fontSize:"90px"}}/>
                       <p>El producto no existe. ¿Quieres Agregarlo?
                        </p>
                    </div>
                ) : null}
                {filteredProducts.map((product, idx) => (

                    <ProductContainer
                        key={product.code + idx}
                        onClick={() => {
                            if (!deleteMode) setProd(product);
                        }}
                    >

                        <Card
                            sx={{
                                maxWidth: 165,
                                padding: 1.5,
                                background: "#1E1E1E",
                                transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",

                                "&:hover": {
                                    borderColor: "1px solid #a1a2a4",
                                    transform: "scale(1.04)",

                                }


                            }} className="card">
                            {deleteMode && (
                                <div className="selectionOverlay" onClick={e => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selected.includes(product.code)}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setSelected(prev => [...prev, product.code]);
                                            } else {
                                                setSelected(prev => prev.filter(code => code !== product.code));
                                            }
                                        }}
                                        sx={{
                                            color: red[800],
                                            '&.Mui-checked': {
                                                color: red[600],
                                            },
                                        }}
                                    />
                                </div>
                            )}
                            <CardActionArea className="card_a">
                                <CardMedia
                                    component="img"
                                    image={product.im ? URL.createObjectURL(product.im) : sin_imagen}
                                    alt={product.name}
                                    sx={
                                        {
                                            borderRadius: "6px",

                                        }
                                    }
                                />
                                <CardContent
                                    sx={{
                                        alignContent: "center",
                                        padding: "0px"
                                    }}
                                >
                                    <Typography gutterBottom variant="h5" component="div"
                                        sx={{
                                            fontSize: "18px",
                                            color: "white",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        <p>{product.name}</p>
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            justifyContent: "start",
                                            color: "#a1a2a4"
                                        }}>
                                        <p className="mc">{product.brand}</p>
                                        <p className="mc">{product.category}</p>
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#FFD700",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Stock: {product.stock}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </ProductContainer>
                ))}
                {deleteMode && selected.length > 0 && (
                    <button
                        style={{
                            position: "fixed",
                            bottom: 40,
                            right: 40,
                            background: "#ff1700",
                            color: "white",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            zIndex: 300,
                            border: "none",
                            cursor: "pointer"
                        }}
                onClick={async () => {
                        const result = await Swal.fire({
                            title: '¿Estás seguro de eliminar?',
                            text: "¡No podrás revertir esto!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Sí',
                            cancelButtonText: 'Cancelar'
                        })
                        if (result.isConfirmed) {
                            onDeleteProduct([...selected]);
                            setSelected([]);
                            setDeleteMode(false);
                            Swal.fire('¡Eliminado!', 'Los productos han sido eliminados.', 'success');
                        }
                    }}
                    >
                        Eliminar seleccionados
                    </button>
                )}
            </section>
        </Container>
    );
}

const Container = styled.div`
    position:absolute;
    align-items:center;
    margin-left:31px;
    box-sizing:border-box;
    height:100vh;
    width:100%;

    .fix{
        z-index:40;
        background:rgb(24, 24, 24);
        width:100%;
        padding:20px;
        padding-top:0px;
        margin-top:0px;
    }

    .botones{   
        display:flex;
        flex-direction:row;
        gap:50px;
    }
    .boton{
        display:flex;
        position:fixed;
        z-index:4;
        justify-content:end;
        gap:20px;
        width:80%;
        background:rgb(24, 24, 24);;
        padding:5px;
        top:60px;
        }
    .b{
        display:flex;
        border-radius:10px;
        padding:0px;
        gap:20px;

    }

    .overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Color negro con 50% de opacidad */
  z-index: 200; /* Asegúrate de que su z-index sea menor que el del modal pero mayor que el resto */
}

    .busqueda{
        z-index:10;
        position:fixed;
        display:flex;
        justify-content:start;
        flex-direction:row;
        width:50%;
        top:65px;

    }

    .search_bar{
        display:flex;
        align-items:center;
        border-radius:30px;
        background:white;
        caret-color:black;
        color:black;
        font-size:20px;
        text-align:center;
        padding:0px;
    }
    .bar_bsq{
        padding:10px;
        flex:auto;
        border:none;
        outline:none;
        background:none;
        color:black
    }
    .b_bar{
        display:flex;
        gap:5px;
        border: none;
        color:grey;
        outline: none;
        background: none;
        transition:0.6s;
    }
    .b_bar:hover{
        color:black;
        transition:0.6s;

    }
    .contenidoCard{
        display:flex;
        justify-content:center;
        
    }
    .list{
        display:flex;
        flex-wrap:wrap;
        justify-content:center;
        align-content:center;
        gap:30px;
        width:auto;
        margin-right:60px;
    }

    *{

    //para contenido de texto en card
    .n_prod{
        font-size:18px;
        font-weight:bold;
    }

    .mc{
        display:flex;
        justify-content:start
    }
    }

`

const ProductContainer = styled.button`
    margin-top:90px;
    padding:0px;
    border-radius:5px;
    border:1px solid #a1a2a4;

    .card_a{
        background:#1E1E1E;
    }

    
    .selectionOverlay{
        padding:0px;
        margin:0px;
        top: 0px;
        right: 5px;

    }
    
`
