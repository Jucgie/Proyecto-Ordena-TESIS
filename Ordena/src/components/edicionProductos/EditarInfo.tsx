import React, { useState } from "react";
import styled from "styled-components";

export function EditableProductDetails() {
  const [product, setProduct] = useState({
    name: "nombre_producto",
    brand: "nombre_marca",
    category: "nombre_categoria",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Veniam, officiis...",
  });

  const handleBlur = (e, field) => {
    // Actualiza el estado con el nuevo valor cuando se sale del elemento editable
    setProduct({ ...product, [field]: e.target.innerText });
  };

  return (
    <Container>
      <ImagePlaceholder>Producto sin Imagen</ImagePlaceholder>

      <InfoSection>
        <Label>Nombre del Producto:</Label>
        <EditableField
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleBlur(e, "name")}
        >
          {product.name}
        </EditableField>

        <Label>Marca:</Label>
        <EditableField
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleBlur(e, "brand")}
        >
          {product.brand}
        </EditableField>

        <Label>Categoría:</Label>
        <EditableField
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleBlur(e, "category")}
        >
          {product.category}
        </EditableField>

        <Label>Descripción:</Label>
        <Description
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => handleBlur(e, "description")}
        >
          {product.description}
        </Description>
      </InfoSection>
    </Container>
  );
}

// Estilizados con styled-components

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const ImagePlaceholder = styled.div`
  width: 300px;
  height: 300px;
  background-color: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const InfoSection = styled.div`
  width: 80%;
`;

const Label = styled.p`
  font-weight: bold;
  margin: 5px 0;
`;

const EditableField = styled.div`
  font-size: 24px;
  margin-bottom: 20px;
  padding: 5px;
  border: 1px solid transparent;
  &:focus {
    outline: none;
    border: 1px solid #ffd700;
    background-color: rgba(255, 215, 0, 0.2);
  }
`;

const Description = styled(EditableField)`
  font-size: 16px;
  line-height: 1.5;
  padding: 10px;
  min-height: 80px;
`;