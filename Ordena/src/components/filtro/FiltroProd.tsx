import { useState } from "react";
import styled from "styled-components";
import { Select, MenuItem } from "@mui/material";



interface FiltroProps {
  onFiltrar: (filtros: { categoria?: string; marca?: string;}) => void;
  setFiltr:()=>void;
}

export function AddFiltro({ onFiltrar,setFiltr }: FiltroProps) {
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState<{ categoria?: string; marca?: string;}>({});

  const handleFiltro = (tipo: string, valor: string) => {
    const nuevosFiltros = { ...filtrosSeleccionados, [tipo]: valor };
    setFiltrosSeleccionados(nuevosFiltros);
    onFiltrar(nuevosFiltros);
  };


  return (
    <Container>
    
    <div className="filtro-container">
      <Select
        value={filtrosSeleccionados.categoria || ""}
        onChange={(e) => handleFiltro("categoria", e.target.value)}
        displayEmpty
        style={{ width: 200, background: "#2E2E2E", color: "white", borderRadius: "6px" }}
      >
        <MenuItem value="">Todas las categorías</MenuItem>
        <MenuItem value="categoria_1">categoria_1</MenuItem>
        <MenuItem value="categoria_2">categoria_2</MenuItem>
        <MenuItem value="categoria_3">categoria_3</MenuItem>
      </Select>

            <Select
        value={filtrosSeleccionados.marca || ""}
        onChange={(e) => handleFiltro("marca", e.target.value)}
        displayEmpty
        style={{ width: 200, background: "#2E2E2E", color: "white", borderRadius: "6px" }}
      >
        <MenuItem value="">Todas las marcas</MenuItem>
        <MenuItem value="marca_1">marca_1</MenuItem>
        <MenuItem value="marca_2">marca_2</MenuItem>
        <MenuItem value="marca_3">marca_3</MenuItem>
      </Select>



    </div>
            <div className="cerr">
                <span onClick={setFiltr} className="vol">Cerrar</span>
            </div>    
    
    </Container>
  );
}

const Container = styled.div`
    display:flex;
    position:fixed;
    z-index:60;
    margin-top:20px;
    background:#242424;
    padding:20px;
    border-radius:10px;
    gap:20px;

  .cerr{
  rigth:0;
  text-align:end;
  font-size:18px;
  font-weight:bold;
  margin:0px;
  cursor: pointer;
  color:#FFD700;  
  }

  .filtro-container{

    display:flex;
    flex-direction:row;
    gap:20px;  
    }


`