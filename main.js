// Variables globales
let categories = [];
let selectedCategoryId = null;
let selectedRestaurant = null;
let currentRestaurants = [];
let currentProducts = [];
let groupedProducts = {};
let restaurants = [];
let products = [];
let CONFIG_CACHE = null;

// Función para abrir modal de productos
function openProductsModal() {
    const modal = document.getElementById('productsModal');
    modal.classList.add('show');
}

// Función para cerrar modal de productos
function closeProductsModal() {
    const modal = document.getElementById('productsModal');
    modal.classList.remove('show');
    // Limpiar formulario
    document.getElementById('productsForm').reset();
    document.getElementById('productsResult').innerHTML = '';
    document.getElementById('productsResult').style.display = 'none';
    document.getElementById('productsProgress').style.display = 'none';
}

// Función para abrir modal de restaurantes
async function openRestaurantsModal(categoryId, categoryName) {
    try {
        // Mostrar modal
        const modal = document.getElementById('restaurantsModal');
        modal.classList.add('show');
        
        // Actualizar título
        document.getElementById('modalTitle').textContent = `Restaurantes - ${categoryName}`;
        
        // Mostrar estado de carga
        document.getElementById('restaurantsGrid').innerHTML = `
            <div class="loading-restaurants">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                <p>Cargando restaurantes...</p>
            </div>
        `;
        
        // Cargar restaurantes
        let apiBaseUrl;
        try {
            const config = await getConfigCache();
            apiBaseUrl = config.API_BASE_URL;
        } catch (configError) {
            console.error('Error obteniendo configuración:', configError);
            // Fallback a una variable global si existe
            apiBaseUrl = window.API_BASE_URL || 'https://da-pw.tupide.mx/api/menu-mc';
        }
        
        const response = await fetch(`${apiBaseUrl}/restaurants/category/${categoryId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            currentRestaurants = result.data;
            renderRestaurants(result.data);
        } else {
            showRestaurantsError(result.message || 'Error al cargar restaurantes');
        }
    } catch (error) {
        console.error('Error loading restaurants:', error);
        showRestaurantsError('Error de conexión al cargar restaurantes');
    }
}

// Función para cerrar modal
function closeRestaurantsModal() {
    const modal = document.getElementById('restaurantsModal');
    modal.classList.remove('show');
    selectedRestaurant = null;
    currentRestaurants = [];
}

// Función para renderizar restaurantes
function renderRestaurants(restaurants) {
    const grid = document.getElementById('restaurantsGrid');
    
    if (!restaurants || restaurants.length === 0) {
        grid.innerHTML = `
            <div class="restaurants-error">
                <p>No se encontraron restaurantes para esta categoría</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = restaurants.map(restaurant => {
        // Construir URL completa para el logo del restaurante
        const logoUrl = restaurant.picture_logo ? 
            `https://da-pw.mx/APPRISA/${restaurant.picture_logo}` : null;
        
        return `
            <div class="restaurant-card" onclick="selectRestaurant('${restaurant.id_restaurant}', '${restaurant.name_restaurant.replace(/'/g, "\\'")}')"
                 data-restaurant-id="${restaurant.id_restaurant}">
                <div class="restaurant-logo ${!logoUrl ? 'no-image' : ''}">
                    ${logoUrl ? 
                        `<img src="${logoUrl}" alt="${restaurant.name_restaurant}" onerror="this.parentElement.innerHTML='${restaurant.name_restaurant.charAt(0).toUpperCase()}'; this.parentElement.classList.add('no-image');">` :
                        restaurant.name_restaurant.charAt(0).toUpperCase()
                    }
                </div>
                <p class="restaurant-name">${restaurant.name_restaurant}</p>
            </div>
        `;
    }).join('');
}

// Función para mostrar error
function showRestaurantsError(message) {
    document.getElementById('restaurantsGrid').innerHTML = `
        <div class="restaurants-error">
            <p>${message}</p>
        </div>
    `;
}

// Función para seleccionar restaurante
function selectRestaurant(restaurantId, restaurantName) {
    // Remover selección anterior
    document.querySelectorAll('.restaurant-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Agregar selección al card clickeado
    const selectedCard = document.querySelector(`[data-restaurant-id="${restaurantId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    selectedRestaurant = {
        id: restaurantId,
        name: restaurantName
    };
    
    console.log('Restaurante seleccionado:', selectedRestaurant);
    
    // Cerrar modal y cargar productos
    closeRestaurantsModal();
    loadProducts(restaurantId, restaurantName);
}

// Función para cargar categorías
async function loadCategories() {
    try {
        const config = await getConfigCache();
        const response = await fetch(`${config.API_BASE_URL}/categories/active`);
        const result = await response.json();
        
        if (result.success) {
            categories = result.data;
            renderCategories();
        } else {
            showCategoriesError(result.message || 'Error al cargar categorías');
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showCategoriesError('Error de conexión al cargar categorías');
    }
}

// Asegurar que las funciones estén disponibles globalmente INMEDIATAMENTE
window.loadCategories = loadCategories;
console.log('main.js: loadCategories expuesta en window =', typeof window.loadCategories);

// Función para renderizar categorías
function renderCategories() {
    const categoriesContainer = document.getElementById('categoriesContainer');
    if (!categoriesContainer) {
        console.error('Container de categorías no encontrado');
        return;
    }
    
    
    if (!categories || categories.length === 0) {
        categoriesContainer.innerHTML = '<p class="no-data">No hay categorías disponibles</p>';
        return;
    }
    
    const categoriesHTML = categories.map(category => `
        <div class="category-card" onclick="loadRestaurantsByCategory(${category.dc_id})">
            <img class="category-image" src="${category.dc_path}" alt="${category.dc_name}">
            <p>${category.dc_name}</p>
        </div>
    `).join('');
    
    categoriesContainer.innerHTML = categoriesHTML;
}

// Función para mostrar errores de categorías
function showCategoriesError(message) {
    const categoriesContainer = document.getElementById('categoriesContainer');
    if (categoriesContainer) {
        categoriesContainer.innerHTML = `
            <div class="error-message">
                <p>Error al cargar categorías: ${message}</p>
                <button onclick="loadCategories()" class="retry-btn">Reintentar</button>
            </div>
        `;
    }
}

// Función para cargar productos
async function loadProducts(restaurantId, restaurantName) {
    try {
        // Mostrar sección de productos
        document.getElementById('productsSection').style.display = 'block';
        document.getElementById('productsTitle').textContent = `Productos - ${restaurantName}`;
        
        // Mostrar estado de carga
        document.getElementById('productsContainer').innerHTML = `
            <div class="loading-products">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                </svg>
                <p>Cargando productos...</p>
            </div>
        `;
        
        // Obtener la URL de la API de forma segura
        let apiBaseUrl;
        try {
            const config = await getConfigCache();
            apiBaseUrl = config.API_BASE_URL;
        } catch (configError) {
            console.error('Error obteniendo configuración:', configError);
            // Fallback a una variable global si existe
            apiBaseUrl = window.API_BASE_URL || 'https://da-pw.tupide.mx/api/menu-mc';
        }
        
        // Cargar productos
        const response = await fetch(`${apiBaseUrl}/products/restaurant/${restaurantId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            currentProducts = result.data;
            groupProductsByCategory(result.data);
            renderProducts();
        } else {
            showProductsError(result.message || 'Error al cargar productos');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showProductsError('Error de conexión al cargar productos');
    }
}

// Función para agrupar productos por categoría y subcategoría
function groupProductsByCategory(products) {
    groupedProducts = {};
    
    products.forEach(productData => {
        const product = productData.product;
        const categoryName = product.pg_name || 'Sin categoría';
        const subcategoryName = product.subcategory_name || 'General';
        
        if (!groupedProducts[categoryName]) {
            groupedProducts[categoryName] = {};
        }
        
        if (!groupedProducts[categoryName][subcategoryName]) {
            groupedProducts[categoryName][subcategoryName] = [];
        }
        
        groupedProducts[categoryName][subcategoryName].push(productData);
    });
}

// Función para renderizar productos con subcategorías
function renderProducts() {
    const container = document.getElementById('productsContainer');
    
    if (Object.keys(groupedProducts).length === 0) {
        container.innerHTML = `
            <div class="products-error">
                <p>No se encontraron productos para este restaurante</p>
            </div>
        `;
        return;
    }
    
    const categoriesHTML = Object.entries(groupedProducts).map(([categoryName, subcategories], categoryIndex) => {
        const categoryId = `category-${categoryIndex}`;
        const isCollapsed = true;
        
        // Contar total de productos en la categoría
        const totalProducts = Object.values(subcategories).reduce((total, products) => total + products.length, 0);
        
        // Generar HTML para subcategorías
        const subcategoriesHTML = Object.entries(subcategories).map(([subcategoryName, products], subIndex) => {
            const subcategoryId = `subcategory-${categoryIndex}-${subIndex}`;
            
            const productsHTML = products.map(productData => {
                const product = productData.product;
                const variations = productData.variations || [];
                const complements = productData.complements || [];
                
                // Generar HTML para variaciones
                const variationsHTML = variations.length > 0 ? `
                    <div class="product-variations">
                        <h5>Variaciones:</h5>
                        ${variations.map(variation => `
                            <div class="variation-item">
                                <strong>${variation.name}</strong> ${variation.isRequired ? '(Requerido)' : '(Opcional)'}
                                <div class="variation-options">
                                    ${variation.options.map(option => `
                                        <span class="variation-option ${option.isDefault ? 'default' : ''}">
                                            ${option.name} ${option.priceAdjustment > 0 ? `(+$${option.priceAdjustment})` : ''}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '';
                
                // Generar HTML para complementos
                const complementsHTML = complements.length > 0 ? `
                    <div class="product-complements">
                        <h5>Complementos:</h5>
                        <div class="complements-list">
                            ${complements.map(complement => `
                                <span class="complement-item ${complement.isRequired ? 'required' : 'optional'}">
                                    ${complement.name} (+$${complement.price}) ${complement.isRequired ? '(Requerido)' : ''}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : '';
                
                return `
                    <div class="product-item">
                        <div class="product-header">
                            <div class="product-info">
                                <span class="product-id">${product.pd_id}</span>
                                <p class="product-name">${product.pd_name}</p>
                                ${product.pd_description ? `<p class="product-description">${product.pd_description}</p>` : ''}
                            </div>
                            <span class="product-price">$${parseFloat(product.pd_unit_price || 0).toFixed(2)}</span>
                        </div>
                        ${variationsHTML}
                        ${complementsHTML}
                    </div>
                `;
            }).join('');
            
            return `
                <div class="product-subcategory collapsed" id="${subcategoryId}">
                    <div class="subcategory-header" onclick="toggleSubcategory('${subcategoryId}')">
                        <div class="subcategory-title">
                            ${subcategoryName}
                            <span class="subcategory-count">${products.length}</span>
                        </div>
                        <div class="subcategory-toggle">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div class="subcategory-products">
                        ${productsHTML}
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="product-category ${isCollapsed ? 'collapsed' : ''}" id="${categoryId}">
                <div class="product-category-header" onclick="toggleCategory('${categoryId}')">
                    <div class="product-category-title">
                        ${categoryName}
                        <span class="category-count">${totalProducts}</span>
                    </div>
                    <div class="category-toggle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="product-list-container">
                    <div class="product-list">
                        ${subcategoriesHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = categoriesHTML;
}

// Función para alternar colapso de categoría
function toggleCategory(categoryId) {
    const category = document.getElementById(categoryId);
    if (category) {
        category.classList.toggle('collapsed');
    }
}

// Función para alternar subcategoría
function toggleSubcategory(subcategoryId) {
    const subcategory = document.getElementById(subcategoryId);
    if (subcategory) {
        subcategory.classList.toggle('collapsed');
    }
}

// Función para expandir todas las categorías
function expandAllCategories() {
    document.querySelectorAll('.product-category').forEach(category => {
        category.classList.remove('collapsed');
    });
    document.querySelectorAll('.product-subcategory').forEach(subcategory => {
        subcategory.classList.remove('collapsed');
    });
}

// Función para colapsar todas las categorías
function collapseAllCategories() {
    document.querySelectorAll('.product-category').forEach(category => {
        category.classList.add('collapsed');
    });
    document.querySelectorAll('.product-subcategory').forEach(subcategory => {
        subcategory.classList.add('collapsed');
    });
}

// Función para mostrar error en productos
function showProductsError(message) {
    document.getElementById('productsContainer').innerHTML = `
        <div class="products-error">
            <p>${message}</p>
        </div>
    `;
}

// Función para volver a mostrar categorías
function showCategories() {
    document.getElementById('productsSection').style.display = 'none';
    currentProducts = [];
    groupedProducts = {};
}

// Función para colapsar/expandir todas las categorías
function toggleAllCategories(collapse = null) {
    if (collapse === false) {
        expandAllCategories();
    } else if (collapse === true) {
        collapseAllCategories();
    }
}

// Función para seleccionar categoría
function selectCategory(categoryId, categoryName) {
    // Marcar categoría como seleccionada visualmente
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    selectedCategoryId = categoryId;
    
    // Abrir modal de restaurantes
    openRestaurantsModal(categoryId, categoryName);
}

// Función para deslizar categorías
function slideCategories(direction) {
    const container = document.getElementById('categoriesContainer');
    const scrollAmount = SCROLL_AMOUNT;
    
    if (direction === 'prev') {
        container.scrollLeft -= scrollAmount;
    } else {
        container.scrollLeft += scrollAmount;
    }
}

// Función para subir archivo
async function uploadFile(file, endpoint, progressId, progressBarId, resultId, btnId) {
    const formData = new FormData();
    formData.append('file', file);
    
    const progressElement = document.getElementById(progressId);
    const progressBar = document.getElementById(progressBarId);
    const resultElement = document.getElementById(resultId);
    const btnElement = document.getElementById(btnId);
    
    progressElement.style.display = 'block';
    resultElement.style.display = 'none';
    btnElement.disabled = true;
    
    try {
        // Obtener la URL base de la API de forma segura
        let apiBaseUrl;
        try {
            const config = await getConfigCache();
            apiBaseUrl = config.API_BASE_URL;
        } catch (configError) {
            console.error('Error obteniendo configuración:', configError);
            // Fallback a una variable global si existe
            apiBaseUrl = window.API_BASE_URL || 'https://da-pw.tupide.mx/api/menu-mc';
        }
        
        const response = await fetch(`${apiBaseUrl}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        progressElement.style.display = 'none';
        resultElement.style.display = 'block';
        
        if (result.success) {
            resultElement.innerHTML = `<div class="success">✓ ${result.message}</div>`;
        } else {
            resultElement.innerHTML = `<div class="error">✗ ${result.message}</div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        progressElement.style.display = 'none';
        resultElement.style.display = 'block';
        resultElement.innerHTML = `<div class="error">✗ Error de conexión: ${error.message}</div>`;
    } finally {
        btnElement.disabled = false;
    }
}

// Función para descargar ejemplo de variaciones
function downloadVariationsExample() {
    const csvContent = `Establecimiento,Nombre Variacion,Descripcion,EsRequerido,NombreOpcion,Precio,EsDefault,id Productos
La Barra De Pizza,Tamaño,Seleccione el tamaño,TRUE,Chica,0,TRUE,6412
La Barra De Pizza,Tamaño,Seleccione el tamaño,TRUE,Mediana,30,FALSE,6412
La Barra De Pizza,Tamaño,Seleccione el tamaño,TRUE,Grande,60,FALSE,6412
La Barra De Pizza,Tamaño,Seleccione el tamaño,TRUE,Familiar,90,FALSE,6412
La Barra De Pizza,Masa,Seleccione su masa,TRUE,Orilla rellena de queso,30,FALSE,"6410,6411,6413,6414,6415"
La Barra De Pizza,Masa,Seleccione su masa,TRUE,Sarten,30,FALSE,"6410,6411,6413,6414,6415"
La Barra De Pizza,Masa,Seleccione su masa,TRUE,Original,0,TRUE,"6410,6411,6413,6414,6415"
La Barra De Pizza,Masa,Seleccione su masa,TRUE,Delgada,0,FALSE,"6410,6411,6413,6414,6415"
La Barra De Pizza,Masa,Seleccione su masa,TRUE,Italiana,20,FALSE,"6410,6411,6413,6414,6415"`;
    
    // Crear un elemento <a> invisible
    const link = document.createElement('a');
    
    // Crear un blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crear una URL para el blob
    const url = URL.createObjectURL(blob);
    
    // Configurar el enlace
    link.setAttribute('href', url);
    link.setAttribute('download', 'ejemplo_variaciones.csv');
    link.style.visibility = 'hidden';
    
    // Añadir el enlace al DOM
    document.body.appendChild(link);
    
    // Simular clic en el enlace
    link.click();
    
    // Limpiar: eliminar el enlace del DOM
    document.body.removeChild(link);
    
    // Liberar la URL del objeto
    URL.revokeObjectURL(url);
}

// Implementa de manera similar las otras funciones de descarga
function downloadProductsExample() {
    const csvContent = `Establecimiento,Categoria,Subcategoria,Nombre,Descripcion,Precio,Imagen
La Barra De Pizza,Pizzas,Especialidades,Pizza Hawaiana,Deliciosa pizza con piña y jamón,180,https://example.com/pizza.jpg`;
    
   // Crear un elemento <a> invisible
    const link = document.createElement('a');
    
    // Crear un blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crear una URL para el blob
    const url = URL.createObjectURL(blob);
    
    // Configurar el enlace
    link.setAttribute('href', url);
    link.setAttribute('download', 'ejemplo_productos.csv');
    link.style.visibility = 'hidden';
    
    // Añadir el enlace al DOM
    document.body.appendChild(link);
    
    // Simular clic en el enlace
    link.click();
    
    // Limpiar: eliminar el enlace del DOM
    document.body.removeChild(link);
    
    // Liberar la URL del objeto
    URL.revokeObjectURL(url);
}

// Función para descargar ejemplo de complementos
function downloadComplementsExample() {
    const csvContent = `Establecimiento,Nombre complemento,Precio,id Productos
La Barra De Pizza,Salsa macha,10,"6410,6411,6413,6414,6415,6412"
La Barra De Pizza,Salsa de habanero,5,"6410,6411,6413,6414,6415,6412"
La Barra De Pizza,Dips,10,"6410,6411,6413,6414,6415,6412"`;
    
    // Crear un elemento <a> invisible
    const link = document.createElement('a');
    
    // Crear un blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crear una URL para el blob
    const url = URL.createObjectURL(blob);
    
    // Configurar el enlace
    link.setAttribute('href', url);
    link.setAttribute('download', 'ejemplo_complementos.csv');
    link.style.visibility = 'hidden';
    
    // Añadir el enlace al DOM
    document.body.appendChild(link);
    
    // Simular clic en el enlace
    link.click();
    
    // Limpiar: eliminar el enlace del DOM
    document.body.removeChild(link);
    
    // Liberar la URL del objeto
    URL.revokeObjectURL(url);
}

// Event listeners para cerrar modales
document.addEventListener('click', function(event) {
    const restaurantsModal = document.getElementById('restaurantsModal');
    const productsModal = document.getElementById('productsModal');
    
    if (event.target === restaurantsModal) {
        closeRestaurantsModal();
    } else if (event.target === productsModal) {
        closeProductsModal();
    }
});

// Cerrar modal con tecla Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const restaurantsModal = document.getElementById('restaurantsModal');
        const productsModal = document.getElementById('productsModal');
        
        if (restaurantsModal.classList.contains('show')) {
            closeRestaurantsModal();
        } else if (productsModal.classList.contains('show')) {
            closeProductsModal();
        }
    }
});

// Event listeners para los formularios
console.log('Configurando event listeners para formularios');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado');
    
    const variationsForm = document.getElementById('variationsForm');
    const complementsForm = document.getElementById('complementsForm');
    
    console.log('Formularios encontrados:', { 
        variationsForm: !!variationsForm, 
        complementsForm: !!complementsForm 
    });
    
    if (variationsForm) {
        console.log('Añadiendo event listener a variationsForm');
        variationsForm.addEventListener('submit', async (e) => {
            console.log('Evento submit de variationsForm capturado');
            e.preventDefault();
            const file = document.getElementById('variationsFile').files[0];
            console.log('Archivo seleccionado:', file ? { name: file.name, size: file.size, type: file.type } : 'No file');
            
            const validation = Utils.validateFile(file);
            console.log('Resultado de validación:', validation);
            if (!validation.valid) {
                console.log('Validación fallida, mostrando error');
                Utils.showResult('variationsResult', validation.message, false);
                return;
            }
            
            console.log('Iniciando uploadFile para variaciones');
            await Utils.uploadFile(
                file, 
                '/upload-variations-csv', 
                'variationsProgress', 
                'variationsProgressBar', 
                'variationsResult', 
                'uploadVariationsBtn'
            );
        });
    }
    
    if (complementsForm) {
        console.log('Añadiendo event listener a complementsForm');
        complementsForm.addEventListener('submit', async (e) => {
            console.log('Evento submit de complementsForm capturado');
            e.preventDefault();
            const file = document.getElementById('complementsFile').files[0];
            console.log('Archivo seleccionado:', file ? { name: file.name, size: file.size, type: file.type } : 'No file');
            
            const validation = Utils.validateFile(file);
            console.log('Resultado de validación:', validation);
            if (!validation.valid) {
                console.log('Validación fallida, mostrando error');
                Utils.showResult('complementsResult', validation.message, false);
                return;
            }
            
            console.log('Iniciando uploadFile para complementos');
            await Utils.uploadFile(
                file, 
                '/upload-complements-csv', 
                'complementsProgress', 
                'complementsProgressBar', 
                'complementsResult', 
                'uploadComplementsBtn'
            );
        });
    }
});

// Configurar input de productos cuando se abra el modal
document.getElementById('productsModal').addEventListener('transitionend', function() {
    if (this.classList.contains('show')) {
        Utils.setupFileInput('productsFile');
    }
});

// Event listener principal
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('=== INICIALIZANDO DASHBOARD ===');
        
        // Esperar a que se carguen las variables de entorno
        await window.envLoaded;
        console.log('Variables de entorno disponibles');
        
        // Cargar categorías automáticamente
        await loadCategories();
        console.log('Dashboard inicializado correctamente');
        
    } catch (error) {
        console.error('Error inicializando dashboard:', error);
        alert(`Error al inicializar dashboard: ${error.message}`);
    }
});

// Función para obtener configuración con cache
async function getConfigCache() {
    if (!CONFIG_CACHE) {
        try {
            console.log('Cargando configuración...');
            
            // Esperar a que se carguen las variables de entorno
            await window.envLoaded;
            console.log('Variables de entorno cargadas');
            
            // Verificar que window.getConfig existe
            if (typeof window.getConfig !== 'function') {
                throw new Error('window.getConfig no está disponible');
            }
            
            CONFIG_CACHE = await window.getConfig();
            console.log('Configuración obtenida:', CONFIG_CACHE);
            
            if (!CONFIG_CACHE.API_BASE_URL) {
                throw new Error('API_BASE_URL no está configurada en las variables de entorno');
            }
            
        } catch (error) {
            console.error('Error cargando configuración:', error);
            throw new Error(`Error de configuración: ${error.message}`);
        }
    }
    return CONFIG_CACHE;
}

// Función para cargar restaurantes por categoría
async function loadRestaurantsByCategory(categoryId) {
    try {
        // Obtener el nombre de la categoría
        const categoryElement = document.querySelector(`.category-card[onclick="loadRestaurantsByCategory(${categoryId})"] p`);
        const categoryName = categoryElement ? categoryElement.textContent : 'Categoría';
        
        // Abrir el modal de restaurantes con la categoría seleccionada
        openRestaurantsModal(categoryId, categoryName);
    } catch (error) {
        console.error('Error cargando restaurantes:', error);
        alert(`Error al cargar restaurantes: ${error.message}`);
    }
}

window.loadRestaurantsByCategory = loadRestaurantsByCategory;

