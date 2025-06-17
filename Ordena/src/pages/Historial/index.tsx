import Layout from "../../components/layout/layout";
import { HistorialTemplate } from "../../components/historial/HistorialTemplate";

export default function Historial() {
    return (
        <Layout>
            <h1 style={{ color: "#FFFFFF", fontSize: "32px", marginBottom: "16px" }}>Historial</h1>
            <p style={{ color: "#8A8A8A", fontSize: "16px" }}>
                Aquí podrás ver el historial de tu sucursal
            </p>
            {/* Aquí puedes agregar más contenido relacionado con el historial */}
            <HistorialTemplate />
        </Layout>
    );
}