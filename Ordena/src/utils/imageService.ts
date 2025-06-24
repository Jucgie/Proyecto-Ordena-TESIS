// Servicio híbrido de imágenes para productos
interface ImageCache {
    [key: string]: {
        url: string;
        timestamp: number;
        source: 'unsplash' | 'placeholder';
    };
}

// Caché local para evitar requests repetidos
const imageCache: ImageCache = {};

// Configuración de colores por categoría
const categoryColors: { [key: string]: { bg: string; text: string } } = {
    'tornillos': { bg: '#FF6B35', text: '#FFFFFF' },
    'planchas': { bg: '#4ECDC4', text: '#FFFFFF' },
    'martillo': { bg: '#45B7D1', text: '#FFFFFF' },
    'clavos': { bg: '#96CEB4', text: '#FFFFFF' },
    'taladro': { bg: '#FFEAA7', text: '#2D3436' },
    'herramientas': { bg: '#DDA0DD', text: '#FFFFFF' },
    'electricidad': { bg: '#FFD93D', text: '#2D3436' },
    'plomeria': { bg: '#6C5CE7', text: '#FFFFFF' },
    'pintura': { bg: '#A8E6CF', text: '#2D3436' },
    'jardineria': { bg: '#81C784', text: '#FFFFFF' },
    'default': { bg: '#636E72', text: '#FFFFFF' }
};

// Iconos por categoría (usando emojis como fallback)
const categoryIcons: { [key: string]: string } = {
    'tornillos': '🔩',
    'planchas': '📋',
    'martillo': '🔨',
    'clavos': '📌',
    'taladro': '🔧',
    'herramientas': '🛠️',
    'electricidad': '⚡',
    'plomeria': '🔧',
    'pintura': '🎨',
    'jardineria': '🌱',
    'default': '📦'
};

// Función para generar placeholder SVG
function generatePlaceholderSVG(category: string, productName: string): string {
    const colors = categoryColors[category.toLowerCase()] || categoryColors.default;
    const icon = categoryIcons[category.toLowerCase()] || categoryIcons.default;
    
    const svg = `
        <svg width="200" height="140" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="140" fill="${colors.bg}"/>
            <text x="100" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="${colors.text}">
                ${icon}
            </text>
            <text x="100" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${colors.text}">
                ${productName}
            </text>
            <text x="100" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${colors.text}">
                ${category}
            </text>
        </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Función para buscar imagen en Unsplash
async function fetchUnsplashImage(query: string): Promise<string> {
    try {
        const accessKey = "rz2WkwQyM7en1zvTElwVpAbqGaOroIHqoNCllxW1qlg";
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${accessKey}&per_page=1&orientation=landscape`
        );
        
        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results?.[0]?.urls?.small || "";
    } catch (error) {
        console.warn(`Error fetching Unsplash image for "${query}":`, error);
        return "";
    }
}

// Función principal para obtener imagen de producto
export async function getProductImage(productName: string, category: string): Promise<string> {
    const cacheKey = `${productName}-${category}`;
    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
    
    // Verificar caché
    if (imageCache[cacheKey] && (now - imageCache[cacheKey].timestamp) < cacheExpiry) {
        return imageCache[cacheKey].url;
    }
    
    // Intentar Unsplash primero
    const unsplashQuery = `${productName} ${category} product`;
    const unsplashUrl = await fetchUnsplashImage(unsplashQuery);
    
    if (unsplashUrl) {
        // Guardar en caché
        imageCache[cacheKey] = {
            url: unsplashUrl,
            timestamp: now,
            source: 'unsplash'
        };
        return unsplashUrl;
    }
    
    // Fallback a placeholder
    const placeholderUrl = generatePlaceholderSVG(category, productName);
    imageCache[cacheKey] = {
        url: placeholderUrl,
        timestamp: now,
        source: 'placeholder'
    };
    
    return placeholderUrl;
}

// Función para limpiar caché expirado
export function cleanupImageCache(): void {
    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
    
    Object.keys(imageCache).forEach(key => {
        if ((now - imageCache[key].timestamp) > cacheExpiry) {
            delete imageCache[key];
        }
    });
}

// Función para obtener estadísticas del caché
export function getCacheStats(): { total: number; unsplash: number; placeholder: number } {
    const total = Object.keys(imageCache).length;
    const unsplash = Object.values(imageCache).filter(item => item.source === 'unsplash').length;
    const placeholder = Object.values(imageCache).filter(item => item.source === 'placeholder').length;
    
    return { total, unsplash, placeholder };
}

// Función para precargar imágenes de productos existentes
export async function preloadProductImages(products: Array<{ name: string; category: string }>): Promise<void> {
    const promises = products.map(product => 
        getProductImage(product.name, product.category)
    );
    
    try {
        await Promise.allSettled(promises);
        console.log('Product images preloaded successfully');
    } catch (error) {
        console.warn('Error preloading product images:', error);
    }
} 