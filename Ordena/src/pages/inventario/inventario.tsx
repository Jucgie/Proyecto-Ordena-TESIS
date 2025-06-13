import Layout from "../../components/layout/layout";
import { InvnTemplate} from "../../components/inventario/InvnTemplate"
import { useEffect, useState } from "react";
// import useProductosStore from "../../components/store/useProductosStore";

export interface ProductInt {
    name: string;
    code: string;
    brand: string;
    category: string;
    description: string;
    im: File | null;
}

export function Inventario() {
    // const {mostrarProducto,dataproductos,buscarProducto} = useProductosStore();
    // const {} = useQuery({querykey:["mostrar producto"],queryFn:()=>mostrarProducto({id_prodc})})
    const [products, setProducts] = useState<ProductInt[]>([]);

  const handleAddProduct = (p: ProductInt) => {
    console.log("InventoryPage → handleAddProduct:", typeof handleAddProduct);
    const updated = [...products, p];      // crea el array nuevo
    setProducts(updated);                  // actualiza el estado
    localStorage.setItem("productos", JSON.stringify(updated)); // guarda el array nuevo
  };

  const handleUpdateProduct = (updatedProduct: ProductInt) => {
  const updatedProducts = products.map(p =>
    p.code === updatedProduct.code ? updatedProduct : p
  );
  setProducts(updatedProducts);
  localStorage.setItem("productos", JSON.stringify(updatedProducts));
};

const handleDeleteProducts = (codes: string[]) => {
    setProducts(prev => prev.filter(p => !codes.includes(p.code)));
};

  useEffect(() => {
    const stored = localStorage.getItem("productos");
    if (stored) setProducts(JSON.parse(stored));
  }, []);


    return(
        <Layout>
            <InvnTemplate             
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProducts}
            />
        </Layout>
    );
}