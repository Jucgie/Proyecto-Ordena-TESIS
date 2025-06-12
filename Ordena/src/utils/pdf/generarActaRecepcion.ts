import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProductoRecibido {
    codigo: string;
    descripcion: string;
    cantidad: number;
}

interface ActaRecepcionData {
    numeroActa: string;
    fechaRecepcion: string;
    sucursal: { nombre: string; direccion: string };
    personaRecibe: { nombre: string; cargo: string };
    productos: ProductoRecibido[];
    observaciones?: string;
    conformidad: "Recibido conforme" | "No conforme";
    responsable: string; // Firma o nombre
}

export function generarActaRecepcion(data: ActaRecepcionData) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Acta de Entrega / Recepción", 105, 18, { align: "center" });

    doc.setFontSize(11);
    doc.text(`N° de Acta: ${data.numeroActa}`, 14, 30);
    doc.text(`Fecha de recepción: ${data.fechaRecepcion}`, 14, 38);

    doc.text(`Sucursal receptora: ${data.sucursal.nombre}`, 14, 46);
    doc.text(`Dirección: ${data.sucursal.direccion}`, 14, 54);

    doc.text(`Persona que recibe: ${data.personaRecibe.nombre}`, 14, 62);
    doc.text(`Cargo: ${data.personaRecibe.cargo}`, 14, 70);

    autoTable(doc, {
        startY: 78,
        head: [["Código", "Descripción", "Cantidad recibida"]],
        body: data.productos.map(p => [p.codigo, p.descripcion, p.cantidad.toString()]),
        styles: { fontSize: 10 },
    });

    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 90;
    doc.text("Observaciones:", 14, y);
    doc.text(data.observaciones || "-", 40, y);

    y += 12;
    doc.text(`Conformidad de recepción: ${data.conformidad}`, 14, y);

    y += 20;
    doc.text("Firma / Responsable de recepción:", 14, y);
    doc.text(data.responsable, 80, y);

    doc.save(`ActaRecepcion_${data.numeroActa}.pdf`);
}