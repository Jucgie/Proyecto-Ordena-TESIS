import React, { useMemo, useState } from 'react';

import styled from 'styled-components';

import Inventario from '../../pages/inventario/inventario';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, TextField, } from '@mui/material';

import { Line } from 'react-chartjs-2';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';

import InfoOutlineIcon from '@mui/icons-material/InfoOutline';

import noEncontrado from '../../assets/noEncontrado.png'
import { formatFechaChile } from '../../utils/formatFechaChile';

//Definición de interfaces
interface DetallePedido {
    producto_nombre: string;
    cantidad: string;
}

interface Pedido {
    fecha_entrega?: string;
    detalles_pedido?: DetallePedido[];
}
interface ProductoInventario {
    id_prodc: number;
    nombre_prodc: string;
    // se pueden añadir más propiedades si son necesarias
}

interface ProductoMasPedidoCardProps {
    pedidos: Pedido[];
    inventario: ProductoInventario[];
    setProd: () => void;

}

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ChartTitle,
    Tooltip,
    Legend
)

export function ProductoMasPedido({ pedidos, inventario, setProd }: ProductoMasPedidoCardProps) {

    const [busqueda, setBusqueda] = useState("");

    const [selectProduct, setSelectProduct] = useState<string | null>(null);

    //busqueda de productos
    const productoMasPedido = useMemo(() => {
        if (!pedidos || pedidos.length === 0 || !inventario || inventario.length === 0) {
            return [];
        }

        const contadorProductos = new Map<string, number>();

        pedidos.forEach(pedido => {
            (pedido.detalles_pedido || []).forEach(detalle => {
                const cantidad = parseInt(detalle.cantidad, 10);
                if (detalle.producto_nombre && !isNaN(cantidad)) {
                    const totalActual = contadorProductos.get(detalle.producto_nombre) || 0;
                    contadorProductos.set(detalle.producto_nombre, totalActual + cantidad);
                }
            });
        });

        const productosConDemanda = inventario.map(producto => ({
            nombre: producto.nombre_prodc,
            cantidadPedida: contadorProductos.get(producto.nombre_prodc) || 0
        }));

        const sorted = productosConDemanda.sort((a, b) => b.cantidadPedida - a.cantidadPedida);
        if (!busqueda) {
            return sorted;
        }

        //definción de filtro de busqueda
        const lowercaseBusqueda = busqueda.toLowerCase();
        return sorted.filter(producto =>
            producto.nombre.toLowerCase().includes(lowercaseBusqueda) || String(producto.cantidadPedida).includes(busqueda)
        )

    }, [pedidos, inventario, busqueda]);

    //obtencion de datos para el gráfico de lineas
    const lineChartData = useMemo(() => {
        if (!selectProduct || !pedidos || pedidos.length === 0) {
            return { labels: [], datasets: [] };
        }

        const demandByDate = new Map<string, number>();

        pedidos.forEach(pedido => {
            if (pedido.fecha_entrega) {
                const date = pedido.fecha_entrega.split('T')[0];
                let quantityOnDate = 0;

                (pedido.detalles_pedido || []).forEach(detalle => {
                    if (detalle.producto_nombre === selectProduct) {
                        quantityOnDate += parseInt(detalle.cantidad, 10) || 0;
                    }
                });
                if (quantityOnDate > 0) {
                    demandByDate.set(date, (demandByDate.get(date) || 0) + quantityOnDate);
                }
            }
        });
        if (demandByDate.size === 0) {
            return { labels: [], datasets: [] };
        }
        //oredenar por fecha
        const sortedEntries = [...demandByDate.entries()].sort((a, b) => new Date(a[0] +'T00:00:00').getTime() - new Date(b[0]+ 'T00:00:00').getTime());

        //formato de hora localizado
      const labels = sortedEntries.map(entry => {
            // entry[0] es una fecha en formato "YYYY-MM-DD".
            // new Date("YYYY-MM-DD") la interpreta como medianoche UTC.
            // Para evitar el desfase de día en zonas horarias como la de Chile (UTC-4),
            // creamos la fecha usando los componentes para que se interprete en la zona local.
            const parts = entry[0].split('-').map(p => parseInt(p, 10));
            // new Date(año, mes - 1, día) usa la zona horaria local.
            return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('es-CL');
        });

        //definición de la data        
        const data = sortedEntries.map(entry => entry[1]
        );

        //configuración del gráfico de lineas
        return {
            labels,
            datasets: [{
                label: `Total de ${selectProduct} pedidas`,
                data,
                fill: true,
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                borderColor: '#FFD700',
                tension: 0.3,
                pointBackgroundColor: '#FFD700',
                pointBorderColor: '#fff',
                pointHoverRadius: 7,
            }]
        };
    }, [selectProduct, pedidos]);

    const lineChartOptions = {
        responsive: true, maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true, ticks: { color: '#ccc' },
                title: {
                    display: true,
                    text: 'U n i d a d e s',
                    color: '#FFD700',

                    font: {
                        size: 14,
                        weight: 'bold',

                    }
                }
            },
            x: {
                ticks: { color: '#ccc' },
                title: {
                    display: true,
                    text: 'Fechas',
                    color: '#FFD700',

                    font: {
                        size: 14,
                        weight: 'bold',

                    }

                }
            }
        },
        plugins: { legend: { display: false } }
    };

    return (
        <CardContainer>
            <div className='buttonClose'>
                <button onClick={setProd}>Cerrar</button>
            </div>
            <div>
                <h2 style={{ color: "#FFD700", marginBottom: "10px" }}>Demanda de Productos</h2>
            </div>
            <Header>

                <div className='busqueda'>

                    <input type="text"
                        placeholder='Buscar producto o cantidad...'
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)} />


                </div>
            </Header>
            <div>
                <Grid container spacing={2} sx={{ height: '100%' }}>

                    <Grid item xs={12} md={selectProduct ? 5 : 12} sx={{ transition: 'all 0.5s ease' }}>
                        <div className='tableContainer'>
                            <div style={{ display: "flex", textAlign: 'center' }}>

                                <InfoOutlineIcon />
                                <p style={{ color: 'grey', fontSize: "14px" }}>
                                    Selecciona un producto para ver su historial</p>
                            </div>
                            <TableContainer component={Paper} sx={{
                                background: '#232323',
                                height: '100%',
                                maxHeight: 320,
                                minHeight: 320,
                                maxWidth: 400,
                                minWidth: 400

                            }}>

                                <Table stickyHeader aria-label="tabla de demanda de productos">

                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: '#FFD700', fontWeight: 700, background: '#232323' }}>Producto</TableCell>
                                            <TableCell sx={{ color: '#FFD700', fontWeight: 700, background: '#232323' }} align="right">Unidades Totales Pedidas</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>

                                        {productoMasPedido.length > 0 ? (
                                        productoMasPedido.map((producto) => (
                                            <TableRow
                                                key={producto.nombre}
                                                onClick={() => setSelectProduct(producto.nombre)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': { backgroundColor: '#3E3E3E' },
                                                    backgroundColor: selectProduct === producto.nombre ? '#444' : 'transparent'
                                                }}
                                            >
                                                <TableCell component="th" scope="row" sx={{ color: 'white' }}>
                                                    {producto.nombre}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                                                    {producto.cantidadPedida}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ):(
                                        <TableRow>
                                            <TableCell colSpan={2} align="center" sx={{ border: 0, py: 5 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'grey' }}>
                                                    <img src={noEncontrado} alt="No encontrado" style={{ width: '80px', opacity: 0.5 }} />
                                                    <span>No se encontraron productos para "{busqueda}"</span>
                                                </div>
                                            </TableCell>                               

                                        </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    </Grid>
                    {selectProduct && (
                        <Grid item xs={12} md={7}>
                            <div>
                                <h4 style={{ color: '#FFD700' }}> Historial de Demanda </h4>
                                <div style={{ position: 'relative', height: '100%', width: '100%', background: "#3E3E3E", padding: "20px", borderRadius: "10px" }}>
                                    {lineChartData.datasets.length > 0 && lineChartData.datasets[0].data.length > 0 ? (
                                        <Line options={lineChartOptions as any} data={lineChartData} />
                                    ) : (
                                        <p style={{ color: 'white', textAlign: 'center', margin: 'auto' }}>No hay historial de pedidos para este producto.</p>
                                    )}
                                </div>
                            </div>
                        </Grid>
                    )}
                </Grid>
            </div>
        </CardContainer>
    );
}


const CardContainer = styled.section`
position: fixed;
  height: 90vh;
  width: 70vw;
  left: 55%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  background: #1E1E1E;
  border: 1px solid #363636;
  box-shadow: 0px 0px 4px rgba(36, 36, 36, 0.7);
  padding: 32px;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .tituloProductoPedido {
        color: #FFD700; // Usando el color amarillo consistente
        margin-top: 0;
        margin-bottom: 1rem;
    }

    h4 {
        font-size: 1.25rem; // Usando rem para mejor accesibilidad
        margin: 0 0 0.5rem 0;
    }

    p {
        margin: 0;
        color: #ccc; // Un color más suave para el detalle
    }

    .tableContainer{
        padding:10px;
        background:#3E3E3E;
        border-radius:10px;

    }

    .busqueda{
        input{
            height:3vw;
            margin-bottom:10px;
            text-align:start;
            width:20vw;
            border-radius:10px;
            outline:none;
            padding:5px;
            border: 1px solid grey;
            color:white;
            
        }
    }
    .buttonClose{
        display:flex;
        justify-content: flex-end;
        width:100%;

        button{
            border: 2px solid ;
            color:yellow;
            transition:0.5s ease-in-out;

            &:hover{
            border:2px solid rgb(197, 19, 19);
            color:white;
            }   
        }


    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    

`;