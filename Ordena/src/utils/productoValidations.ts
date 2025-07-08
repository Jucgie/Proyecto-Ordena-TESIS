export interface ProductInt {
    id_prodc?: number;
    name: string;
    code: string;
    brand: string;
    category: string;
    description: string;
    stock: number;
    stock_minimo: number;
    stock_maximo: number;
    im: File | string | null;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * Normaliza un texto para comparaciones (quita espacios, convierte a minúsculas)
 */
export const normalizeText = (text: string): string => {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Valida que el nombre del producto sea único en la lista existente
 */
export const validateUniqueName = (
    name: string, 
    existingProducts: ProductInt[], 
    currentProductId?: number
): ValidationResult => {
    const errors: ValidationError[] = [];
    const normalizedName = normalizeText(name);
    
    if (!normalizedName) {
        errors.push({
            field: 'name',
            message: 'El nombre del producto es obligatorio'
        });
        return { isValid: false, errors };
    }
    
    if (normalizedName.length < 3) {
        errors.push({
            field: 'name',
            message: 'El nombre debe tener al menos 3 caracteres'
        });
    }
    
    // Buscar productos con el mismo nombre (excluyendo el producto actual si estamos editando)
    const duplicateProduct = existingProducts.find(product => {
        if (currentProductId && product.id_prodc === currentProductId) {
            return false; // Excluir el producto actual en edición
        }
        return normalizeText(product.name) === normalizedName;
    });
    
    if (duplicateProduct) {
        errors.push({
            field: 'name',
            message: `Ya existe un producto con el nombre "${duplicateProduct.name}"`
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Valida que no exista un producto con la misma combinación de nombre, marca y categoría
 */
export const validateUniqueCombination = (
    product: ProductInt,
    existingProducts: ProductInt[],
    currentProductId?: number
): ValidationResult => {
    const errors: ValidationError[] = [];
    const normalizedName = normalizeText(product.name);
    const normalizedBrand = normalizeText(product.brand);
    const normalizedCategory = normalizeText(product.category);
    
    // Buscar productos con la misma combinación
    const duplicateProduct = existingProducts.find(existing => {
        if (currentProductId && existing.id_prodc === currentProductId) {
            return false; // Excluir el producto actual en edición
        }
        
        return normalizeText(existing.name) === normalizedName &&
               normalizeText(existing.brand) === normalizedBrand &&
               normalizeText(existing.category) === normalizedCategory;
    });
    
    if (duplicateProduct) {
        errors.push({
            field: 'combination',
            message: `Ya existe un producto con el mismo nombre, marca y categoría: "${duplicateProduct.name}" (${duplicateProduct.brand} - ${duplicateProduct.category})`
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Valida el código interno del producto
 */
export const validateCode = (
    code: string, 
    existingProducts: ProductInt[], 
    currentProductId?: number
): ValidationResult => {
    const errors: ValidationError[] = [];
    
    if (!code.trim()) {
        errors.push({
            field: 'code',
            message: 'El código interno es obligatorio'
        });
        return { isValid: false, errors };
    }
    
    if (code.trim().length < 3) {
        errors.push({
            field: 'code',
            message: 'El código debe tener al menos 3 caracteres'
        });
    }
    
    // Verificar que no contenga caracteres especiales problemáticos
    if (!/^[a-zA-Z0-9\-_]+$/.test(code.trim())) {
        errors.push({
            field: 'code',
            message: 'El código solo puede contener letras, números, guiones y guiones bajos'
        });
    }
    
    // Buscar productos con el mismo código
    const duplicateProduct = existingProducts.find(product => {
        if (currentProductId && product.id_prodc === currentProductId) {
            return false;
        }
        return product.code.toLowerCase() === code.toLowerCase();
    });
    
    if (duplicateProduct) {
        errors.push({
            field: 'code',
            message: `Ya existe un producto con el código "${duplicateProduct.code}"`
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Valida los campos de stock
 */
export const validateStock = (product: ProductInt): ValidationResult => {
    const errors: ValidationError[] = [];
    
    // Validar stock inicial
    if (product.stock < 0) {
        errors.push({
            field: 'stock',
            message: 'El stock no puede ser negativo'
        });
    }
    
    // Validar stock mínimo
    if (product.stock_minimo < 0) {
        errors.push({
            field: 'stock_minimo',
            message: 'El stock mínimo no puede ser negativo'
        });
    }
    
    // Validar stock máximo
    if (product.stock_maximo < 0) {
        errors.push({
            field: 'stock_maximo',
            message: 'El stock máximo no puede ser negativo'
        });
    }
    
    // Validar relaciones entre stocks
    if (product.stock_minimo > product.stock_maximo) {
        errors.push({
            field: 'stock_minimo',
            message: 'El stock mínimo no puede ser mayor al stock máximo'
        });
    }
    
    if (product.stock > product.stock_maximo) {
        errors.push({
            field: 'stock',
            message: 'El stock inicial no puede ser mayor al stock máximo'
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Valida campos obligatorios
 */
export const validateRequiredFields = (product: ProductInt): ValidationResult => {
    const errors: ValidationError[] = [];
    
    if (!product.name.trim()) {
        errors.push({
            field: 'name',
            message: 'El nombre del producto es obligatorio'
        });
    }
    
    if (!product.code.trim()) {
        errors.push({
            field: 'code',
            message: 'El código interno es obligatorio'
        });
    }
    
    if (!product.brand.trim()) {
        errors.push({
            field: 'brand',
            message: 'La marca es obligatoria'
        });
    }
    
    if (!product.category.trim()) {
        errors.push({
            field: 'category',
            message: 'La categoría es obligatoria'
        });
    }
    
    if (!product.description.trim()) {
        errors.push({
            field: 'description',
            message: 'La descripción es obligatoria'
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Valida la descripción
 */
export const validateDescription = (description: string): ValidationResult => {
    const errors: ValidationError[] = [];
    
    // La descripción es opcional, pero si se proporciona debe cumplir ciertos criterios
    if (description.trim()) {
        if (description.trim().length < 10) {
            errors.push({
                field: 'description',
                message: 'La descripción debe tener al menos 10 caracteres'
            });
        }
        
        if (description.trim().length > 500) {
            errors.push({
                field: 'description',
                message: 'La descripción no puede exceder 500 caracteres'
            });
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Valida todo el producto completo
 */
export const validateProduct = (
    product: ProductInt, 
    existingProducts: ProductInt[], 
    isEditing: boolean = false
): ValidationResult => {
    const allErrors: ValidationError[] = [];
    
    // Validar nombre único (incluye validación de requerido)
    const nameValidation = validateUniqueName(
        product.name, 
        existingProducts, 
        isEditing ? product.id_prodc : undefined
    );
    allErrors.push(...nameValidation.errors);
    
    // Validar código único (incluye validación de requerido)
    const codeValidation = validateCode(
        product.code, 
        existingProducts, 
        isEditing ? product.id_prodc : undefined
    );
    allErrors.push(...codeValidation.errors);
    
    // Validar marca (solo requerido)
    if (!product.brand.trim()) {
        allErrors.push({
            field: 'brand',
            message: 'La marca es obligatoria'
        });
    }
    
    // Validar categoría (solo requerido)
    if (!product.category.trim()) {
        allErrors.push({
            field: 'category',
            message: 'La categoría es obligatoria'
        });
    }
    
    // Validar stock
    const stockValidation = validateStock(product);
    allErrors.push(...stockValidation.errors);
    
    // Validar descripción (opcional)
    if (product.description.trim()) {
        const descriptionValidation = validateDescription(product.description);
        allErrors.push(...descriptionValidation.errors);
    }
    // Nota: No agregamos error si la descripción está vacía porque es opcional
    
    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
};

/**
 * Busca productos similares basándose en el nombre
 */
export const findSimilarProducts = (
    product: ProductInt, 
    existingProducts: ProductInt[], 
    currentProductId?: number
): ProductInt[] => {
    const normalizedName = normalizeText(product.name);
    const normalizedBrand = normalizeText(product.brand);
    const normalizedCategory = normalizeText(product.category);
    
    // Crear array con puntuación de similitud
    const productsWithScore = existingProducts
        .filter(existing => {
            if (currentProductId && existing.id_prodc === currentProductId) {
                return false;
            }
            return true;
        })
        .map(existing => {
            const existingNormalizedName = normalizeText(existing.name);
            const existingNormalizedBrand = normalizeText(existing.brand);
            const existingNormalizedCategory = normalizeText(existing.category);
            
            let score = 0;
            
            // Puntuación por similitud de nombre (máxima prioridad)
            if (existingNormalizedName === normalizedName) {
                score += 100; // Nombre exacto
            } else if (existingNormalizedName.includes(normalizedName) || 
                      normalizedName.includes(existingNormalizedName)) {
                score += 50; // Nombre similar
            } else {
                // Si no hay similitud en el nombre, no considerar el producto
                return { product: existing, score: 0 };
            }
            
            // Puntuación adicional por marca y categoría
            if (existingNormalizedBrand === normalizedBrand) {
                score += 10;
            }
            if (existingNormalizedCategory === normalizedCategory) {
                score += 10;
            }
            
            return { product: existing, score };
        })
        .filter(item => item.score > 0) // Solo productos con puntuación > 0
        .sort((a, b) => b.score - a.score) // Ordenar por puntuación descendente
        .slice(0, 5); // Limitar a 5 productos más relevantes
    
    return productsWithScore.map(item => item.product);
};

/**
 * Genera un código sugerido basado en el nombre y categoría
 */
export const generateSuggestedCode = (
    name: string, 
    category: string, 
    existingProducts: ProductInt[]
): string => {
    if (!name.trim() || !category.trim()) {
        return '';
    }
    
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const nameWords = name.trim().split(/\s+/);
    const namePrefix = nameWords.length > 0 ? nameWords[0].substring(0, 3).toUpperCase() : 'PROD';
    
    const baseCode = `${categoryPrefix}-${namePrefix}`;
    let counter = 1;
    let suggestedCode = `${baseCode}-${counter.toString().padStart(3, '0')}`;
    
    // Verificar que el código no exista
    while (existingProducts.some(p => p.code.toLowerCase() === suggestedCode.toLowerCase())) {
        counter++;
        suggestedCode = `${baseCode}-${counter.toString().padStart(3, '0')}`;
    }
    
    return suggestedCode;
}; 