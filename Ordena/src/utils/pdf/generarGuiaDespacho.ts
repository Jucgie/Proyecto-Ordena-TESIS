import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generarGuiaDespacho(pedido: any) {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text("Guía de Despacho Interna", 14, 18);

    // Datos principales
    doc.setFontSize(11);
    doc.text(`N° Guía de Despacho: ${pedido.id}`, 14, 30);
    doc.text(`Fecha de emisión: ${pedido.fecha}`, 14, 38);

    doc.text(`Sucursal de destino: ${pedido.sucursalDestino || "-"}`, 14, 46);
    doc.text(`Dirección sucursal: ${pedido.direccionSucursal || "-"}`, 14, 54);

    doc.text(`Bodega de origen: ${pedido.bodegaOrigen || "-"}`, 14, 62);
    doc.text(`Dirección bodega: ${pedido.direccionBodega || "-"}`, 14, 70);

    doc.text(`Responsable del despacho: ${pedido.responsable || "-"}`, 14, 78);
    doc.text(`Patente vehículo: ${pedido.patenteVehiculo || "-"}`, 14, 86);
    doc.text(`Tipo de traslado: Interno`, 14, 94);

    // Tabla de productos
    autoTable(doc, {
        startY: 102,
        head: [["Código", "Descripción", "Cantidad despachada"]],
        body: Array.isArray(pedido.productos)
            ? pedido.productos.map((prod: any, idx: number) => [
                prod.codigo || (idx + 1),
                prod.nombre,
                prod.cantidad
            ])
            : [],
    });

    // OCI asociada y observaciones
    let obsY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 120;
    doc.text(`N° OCI asociada: ${pedido.ociAsociada || "-"}`, 14, obsY);
    doc.text(`Observaciones: ${pedido.observaciones || "Ninguna"}`, 14, obsY + 8);

    // Firma digital o confirmación
    doc.text(`Confirmación de salida: ____________________________`, 14, obsY + 20);

    // Guardar PDF
    doc.save(`GuiaDespacho_${pedido.id}.pdf`);
}