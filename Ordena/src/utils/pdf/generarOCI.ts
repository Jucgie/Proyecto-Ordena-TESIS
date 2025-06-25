import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { informesService } from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

export async function generarOCI(solicitud: any) {
    try {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(16);
        doc.text("Orden de Compra Interna (OCI)", 14, 18);

        // Datos principales
        doc.setFontSize(11);
        doc.text(`N° OCI: ${solicitud.id_solc || solicitud.id}`, 14, 30);
        doc.text(`Fecha de emisión: ${solicitud.fecha_creacion ? new Date(solicitud.fecha_creacion).toLocaleDateString() : new Date().toLocaleDateString()}`, 14, 38);
        doc.text(`Sucursal solicitante: ${solicitud.sucursal_nombre || solicitud.fk_sucursal?.nombre_sucursal || "No especificado"}`, 14, 46);
        doc.text(`Dirección: ${solicitud.sucursal_direccion || solicitud.fk_sucursal?.direccion || "No especificado"}`, 14, 54);
        doc.text(`RUT: ${solicitud.sucursal_rut || solicitud.fk_sucursal?.rut || "No especificado"}`, 14, 62);
        doc.text(`Persona solicitante: ${solicitud.usuario_nombre || solicitud.usuarios_fk?.nombre || "No especificado"}`, 14, 70);
        doc.text(`Cargo: ${solicitud.usuario_rol || solicitud.usuarios_fk?.rol_fk?.nombre_rol || "Solicitante"}`, 14, 78);

        // Tabla de productos
        if (solicitud.productos && solicitud.productos.length > 0) {
            autoTable(doc, {
                startY: 86,
                head: [["Código", "Descripción", "Cantidad solicitada"]],
                body: solicitud.productos.map((prod: any, idx: number) => [
                    prod.producto_codigo || prod.codigo_interno || prod.producto_fk?.codigo_interno || (idx + 1),
                    prod.producto_nombre || prod.nombre_prodc || prod.producto_fk?.nombre_prodc || prod.descripcion || "-",
                    prod.cantidad
                ]),
                styles: {
                    headRow: {
                        fillColor: [255, 215, 0],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    alternateRowStyle: {
                        fillColor: [245, 245, 245]
                    }
                }
            });
        } else {
            doc.text("No hay productos en esta solicitud", 14, 86);
        }

        // Observaciones
        const obsY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 100;
        doc.text(`Observaciones: ${solicitud.observacion || "Ninguna"}`, 14, obsY);

        // Estado y firma
        doc.text(`Estado de la OCI: ${solicitud.estado || "Pendiente"}`, 14, obsY + 10);
        doc.text(`Aprobador: ${solicitud.aprobador || "Sistema OCI Digital"}`, 14, obsY + 20);

        // Generar nombre del archivo
        const fileName = `OCI_${solicitud.id_solc || solicitud.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Guardar PDF
        doc.save(fileName);

        // Guardar informe en la base de datos solo si no es una regeneración
        if (!solicitud.skipSave) {
            try {
                const usuario = useAuthStore.getState().usuario;
                const contenido = {
                    numeroOCI: solicitud.id_solc,
                    fechaEmision: solicitud.fecha_creacion,
                    sucursal: {
                        nombre: solicitud.sucursal_nombre,
                        direccion: solicitud.sucursal_direccion,
                        rut: solicitud.sucursal_rut
                    },
                    personaSolicitante: {
                        nombre: solicitud.usuario_nombre,
                        cargo: solicitud.usuario_rol
                    },
                    productos: solicitud.productos.map((p: any) => ({
                        codigo: p.producto_codigo,
                        descripcion: p.producto_nombre,
                        cantidad: p.cantidad
                    })),
                    observacion: solicitud.observacion || 'Ninguna',
                    estado: solicitud.estado || 'Pendiente'
                };

                const informeData = {
                    titulo: `Orden de Compra Interna (OCI) - ${solicitud.id_solc || solicitud.id}`,
                    descripcion: `OCI generada para la solicitud ${solicitud.id_solc || solicitud.id} de ${solicitud.sucursal_nombre || solicitud.fk_sucursal?.nombre_sucursal || 'sucursal'}`,
                    modulo_origen: 'solicitudes',
                    contenido: JSON.stringify(contenido),
                    archivo_url: fileName,
                    bodega_fk: usuario?.bodega || null,
                    sucursal_fk: usuario?.sucursal || null
                };

                await informesService.createInforme(informeData);
            } catch (error) {
                console.error('Error al guardar el informe:', error);
                // No mostrar error al usuario, solo log
            }
        }

        return fileName;
    } catch (error) {
        console.error('Error al generar OCI:', error);
        throw new Error('Error al generar el documento OCI');
    }
}

// Función para regenerar OCI desde datos almacenados
export async function regenerarOCIDesdeInforme(informe: any) {
    try {
        const contenido = JSON.parse(informe.contenido);
        
        const solicitudFormateada = {
            id_solc: contenido.solicitud_id,
            fecha_creacion: new Date(informe.fecha_generado).toISOString(),
            sucursal_nombre: contenido.sucursal || 'No especificado',
            sucursal_direccion: contenido.sucursal_direccion || 'No especificado',
            sucursal_rut: contenido.sucursal_rut || 'No especificado',
            fk_sucursal: {
                nombre_sucursal: contenido.sucursal || 'No especificado',
                direccion: contenido.sucursal_direccion || 'No especificado',
                rut: contenido.sucursal_rut || 'No especificado'
            },
            usuario_nombre: contenido.responsable || 'No especificado',
            usuario_rol: contenido.usuario_rol || 'Solicitante',
            usuarios_fk: {
                nombre: contenido.responsable || 'No especificado',
                rol_fk: {
                    nombre_rol: contenido.usuario_rol || 'Solicitante'
                }
            },
            observacion: contenido.observaciones || 'Ninguna',
            productos: contenido.productos || [],
            estado: contenido.estado || 'Pendiente',
            aprobador: 'Sistema OCI Digital',
            skipSave: true // Evitar guardar duplicado
        };

        return await generarOCI(solicitudFormateada);
    } catch (error) {
        console.error('Error al regenerar OCI:', error);
        throw new Error('Error al regenerar el documento OCI');
    }
}