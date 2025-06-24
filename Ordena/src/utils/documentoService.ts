// Servicio para generar automáticamente números de documentos
export class DocumentoService {
    private static remCounter = 1;
    private static facturaCounter = 1;
    private static ordenCounter = 1;

    // Generar número de REM automático
    static generarNumeroREM(): string {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const numero = String(this.remCounter).padStart(4, '0');
        this.remCounter++;
        return `REM-${año}${mes}-${numero}`;
    }

    // Generar número de Factura automático
    static generarNumeroFactura(): string {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const numero = String(this.facturaCounter).padStart(4, '0');
        this.facturaCounter++;
        return `FAC-${año}${mes}-${numero}`;
    }

    // Generar número de Orden de Compra automático
    static generarNumeroOrden(): string {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const numero = String(this.ordenCounter).padStart(4, '0');
        this.ordenCounter++;
        return `OC-${año}${mes}-${numero}`;
    }

    // Generar todos los documentos automáticamente
    static generarDocumentosAutomaticos() {
        return {
            numRem: this.generarNumeroREM(),
            numFactura: this.generarNumeroFactura(),
            numOrden: this.generarNumeroOrden()
        };
    }

    // Validar formato de documento
    static validarFormatoDocumento(tipo: 'REM' | 'FACTURA' | 'ORDEN', numero: string): boolean {
        const patrones = {
            REM: /^REM-\d{6}-\d{4}$/,
            FACTURA: /^FAC-\d{6}-\d{4}$/,
            ORDEN: /^OC-\d{6}-\d{4}$/
        };
        return patrones[tipo].test(numero);
    }

    // Formatear documento existente
    static formatearDocumento(tipo: 'REM' | 'FACTURA' | 'ORDEN', numero: string): string {
        if (!numero) return '';
        
        // Si ya tiene formato correcto, devolverlo
        if (this.validarFormatoDocumento(tipo, numero)) {
            return numero;
        }

        // Limpiar y formatear
        const numeroLimpio = numero.replace(/[^0-9]/g, '');
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        
        if (numeroLimpio.length >= 4) {
            const numeroFormateado = numeroLimpio.slice(-4).padStart(4, '0');
            const prefijos = { REM: 'REM', FACTURA: 'FAC', ORDEN: 'OC' };
            return `${prefijos[tipo]}-${año}${mes}-${numeroFormateado}`;
        }

        // Si no tiene suficientes dígitos, generar uno nuevo
        return tipo === 'REM' ? this.generarNumeroREM() :
               tipo === 'FACTURA' ? this.generarNumeroFactura() :
               this.generarNumeroOrden();
    }
}

// Tipos para los documentos
export interface Documentos {
    numRem: string;
    numFactura: string;
    numOrden: string;
}

// Configuración de documentos
export interface ConfiguracionDocumentos {
    prefijoREM: string;
    prefijoFactura: string;
    prefijoOrden: string;
    formatoFecha: string;
    secuencial: boolean;
} 