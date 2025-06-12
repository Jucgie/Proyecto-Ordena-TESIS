import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generarOCI(solicitud: any) {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text("Orden de Compra Interna (OCI)", 14, 18);

    // Datos principales
    doc.setFontSize(11);
    doc.text(`N° OCI: ${solicitud.id}`, 14, 30);
    doc.text(`Fecha de emisión: ${solicitud.fecha}`, 14, 38);
    doc.text(`Sucursal solicitante: ${solicitud.sucursal?.nombre || "-"}`, 14, 46);
    doc.text(`Dirección: ${solicitud.sucursal?.direccion || "-"}`, 14, 54);
    doc.text(`RUT: ${solicitud.sucursal?.rut || "No especificado"}`, 14, 62);
    doc.text(`Persona solicitante: ${solicitud.responsable}`, 14, 70);
    doc.text(`Cargo: ${solicitud.cargo || "No especificado"}`, 14, 78);

    // Tabla de productos
    autoTable(doc, {
        startY: 86,
        head: [["Código", "Descripción", "Cantidad solicitada"]],
        body: solicitud.productos.map((prod: any, idx: number) => [
            prod.codigo || (idx + 1),
            prod.descripcion || prod.nombre || "-",
            prod.cantidad
        ]),
    });

    // Observaciones
    let obsY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 100;
    doc.text(`Observaciones: ${solicitud.observaciones || "Ninguna"}`, 14, obsY);

    // Estado y firma
    doc.text(`Estado de la OCI: ${solicitud.estado}`, 14, obsY + 10);
    doc.text(`Aprobador: ${solicitud.aprobador || "Sistema OCI Digital"}`, 14, obsY + 20);

    // Guardar PDF
    doc.save(`OCI_${solicitud.id}.pdf`);
}