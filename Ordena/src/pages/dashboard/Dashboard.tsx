import { CountElement } from "../../components/dashboard/DashboardTemplate";
import { CountElementSucursal } from "../../components/dashboard/DashboardTemplateSucursal";
import Layout from "../../components/layout/layout";
import { useBodegaStore } from "../../store/useBodegaStore";

export function Dashboard() {
        const { vista } = useBodegaStore();
    
    return(
    <Layout>
        {vista === "bodega" ? <CountElement /> : <CountElementSucursal />}

        
    </Layout>
);
}