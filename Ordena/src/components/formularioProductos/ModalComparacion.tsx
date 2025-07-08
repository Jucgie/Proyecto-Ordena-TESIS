import React from "react";
import "./ModalComparacion.css";

type Producto = {
  nombre: string;
  codigo_interno: string;
  marca: string;
  categoria: string;
  stock_actual: number;
  descripcion?: string;
};

type ModalComparacionProps = {
  productoNuevo: Producto;
  productosSimilares: Producto[];
  onUsarExistente: (producto: Producto) => void;
  onCrearNuevo: () => void;
  onCancelar: () => void;
  productoSeleccionado?: any;
  setProductoSeleccionado?: (producto: any) => void;
  indiceActual?: number; // Nuevo: índice del producto actual (opcional)
  totalProductos?: number; // Nuevo: total de productos a validar (opcional)
};

const ModalComparacion: React.FC<ModalComparacionProps> = ({
  productoNuevo,
  productosSimilares,
  onUsarExistente,
  onCrearNuevo,
  onCancelar,
  productoSeleccionado: productoSeleccionadoProp,
  setProductoSeleccionado: setProductoSeleccionadoProp,
  indiceActual,
  totalProductos,
}) => {
  const [productoSeleccionado, setProductoSeleccionado] = React.useState<any>(null);
  const seleccionado = productoSeleccionadoProp !== undefined ? productoSeleccionadoProp : productoSeleccionado;
  const setSeleccionado = setProductoSeleccionadoProp !== undefined ? setProductoSeleccionadoProp : setProductoSeleccionado;

  // Limpiar selección al cambiar de producto nuevo
  React.useEffect(() => {
    setProductoSeleccionado(null);
  }, [productoNuevo]);

  return (
    <div className="modal-comparacion-overlay">
      <div className="modal-comparacion modal-simple">
        {/* Mostrar número de producto actual si se reciben los props */}
        {typeof indiceActual === 'number' && typeof totalProductos === 'number' && (
          <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: 8 }}>
            Producto {indiceActual + 1} de {totalProductos}
          </div>
        )}
        <h2 style={{ color: '#FFD700', marginBottom: 8 }}>¡Atención! Producto similar encontrado</h2>
        <p style={{ color: '#fff', marginBottom: 16 }}>
          Se ha detectado uno o más productos similares al que intentas crear o ingresar.<br />Revisa la información antes de continuar.
        </p>
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          {/* Nuevo producto */}
          <div style={{ background: '#232323', borderRadius: 8, padding: 16, minWidth: 220 }}>
            <h4 style={{ color: '#FFD700', marginBottom: 8 }}>Nuevo producto</h4>
            <div><b>Nombre:</b> {productoNuevo.nombre}</div>
            <div><b>Código:</b> {productoNuevo.codigo_interno || <span style={{ color: '#aaa' }}>—</span>}</div>
            <div><b>Marca:</b> {productoNuevo.marca}</div>
            <div><b>Categoría:</b> {productoNuevo.categoria}</div>
            <div><b>Stock:</b> {productoNuevo.stock_actual ?? <span style={{ color: '#aaa' }}>—</span>}</div>
            {productoNuevo.descripcion && <div><b>Descripción:</b> {productoNuevo.descripcion}</div>}
          </div>
          {/* Productos similares */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {productosSimilares.map((prod, idx) => (
              <div
                key={idx}
                onClick={() => setSeleccionado(prod)}
                style={{
                  background: seleccionado === prod ? '#FFD70022' : '#232323',
                  border: seleccionado === prod ? '2px solid #FFD700' : '1px solid #444',
                  borderRadius: 8,
                  padding: 12,
                  minWidth: 220,
                  cursor: 'pointer',
                  color: '#fff',
                }}
              >
                <h4 style={{ color: '#FFD700', marginBottom: 6 }}>Existente #{idx + 1}</h4>
                <div><b>Nombre:</b> {prod.nombre}</div>
                <div><b>Código:</b> {prod.codigo_interno || <span style={{ color: '#aaa' }}>—</span>}</div>
                <div><b>Marca:</b> {prod.marca}</div>
                <div><b>Categoría:</b> {prod.categoria}</div>
                <div><b>Stock:</b> {prod.stock_actual ?? <span style={{ color: '#aaa' }}>—</span>}</div>
                {prod.descripcion && <div><b>Descripción:</b> {prod.descripcion}</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ color: '#FF9800', fontWeight: 600, marginBottom: 16 }}>
          Advertencia: Existe un producto con el mismo nombre, marca y categoría. Revisa antes de continuar.
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            className="modal-comparacion-btn modal-comparacion-btn-existente"
            disabled={!seleccionado}
            style={{ minWidth: 180, background: seleccionado ? '#FFD700' : '#444', color: seleccionado ? '#232323' : '#ccc', fontWeight: 700, borderRadius: 6, padding: '10px 18px', border: 'none', cursor: seleccionado ? 'pointer' : 'not-allowed' }}
            onClick={() => seleccionado && onUsarExistente(seleccionado)}
          >
            Usar existente seleccionado
          </button>
          <button
            className="modal-comparacion-btn modal-comparacion-btn-nuevo"
            style={{ minWidth: 220, background: '#232323', color: '#FFD700', fontWeight: 700, borderRadius: 6, padding: '10px 18px', border: '2px solid #FFD700', cursor: 'pointer' }}
            onClick={onCrearNuevo}
          >
            Crear nuevo de todas formas
          </button>
          <button
            className="modal-comparacion-btn modal-comparacion-btn-cancelar"
            style={{ minWidth: 120, background: '#444', color: '#fff', fontWeight: 600, borderRadius: 6, padding: '10px 18px', border: 'none', cursor: 'pointer' }}
            onClick={onCancelar}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalComparacion; 