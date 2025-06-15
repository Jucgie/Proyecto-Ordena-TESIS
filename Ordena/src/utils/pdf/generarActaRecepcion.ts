import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProductoRecibido {
    codigo: string;
    descripcion: string;
    cantidad: number;
}

interface Proveedor {
    nombre: string;
    rut: string;
    contacto: string;
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
    proveedor?: Proveedor; // Información del proveedor (opcional)
}

export function generarActaRecepcion(data: ActaRecepcionData) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Acta de Entrega / Recepción", 105, 18, { align: "center" });

    doc.setFontSize(11);
    doc.text(`N° de Acta: ${data.numeroActa}`, 14, 30);
    doc.text(`Fecha de recepción: ${data.fechaRecepcion}`, 14, 38);

    // Información del proveedor si existe
    if (data.proveedor) {
        doc.text(`Proveedor: ${data.proveedor.nombre}`, 14, 46);
        doc.text(`RUT Proveedor: ${data.proveedor.rut}`, 14, 54);
        doc.text(`Contacto: ${data.proveedor.contacto}`, 14, 62);
    }

    doc.text(`Sucursal receptora: ${data.sucursal.nombre}`, 14, data.proveedor ? 70 : 46);
    doc.text(`Dirección: ${data.sucursal.direccion}`, 14, data.proveedor ? 78 : 54);

    doc.text(`Persona que recibe: ${data.personaRecibe.nombre}`, 14, data.proveedor ? 86 : 62);
    doc.text(`Cargo: ${data.personaRecibe.cargo}`, 14, data.proveedor ? 94 : 70);

    autoTable(doc, {
        startY: data.proveedor ? 102 : 78,
        head: [["Código", "Descripción", "Cantidad recibida"]],
        body: data.productos.map(p => [p.codigo, p.descripcion, p.cantidad.toString()]),
        styles: { fontSize: 10 },
    });

    let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : (data.proveedor ? 110 : 86);
    doc.text("Observaciones:", 14, y);
    doc.text(data.observaciones || "-", 40, y);

    y += 12;
    doc.text(`Conformidad de recepción: ${data.conformidad}`, 14, y);

    y += 20;
    doc.text("Firma / Responsable de recepción:", 14, y);
    doc.text(data.responsable, 80, y);

    doc.save(`ActaRecepcion_${data.numeroActa}.pdf`);
}