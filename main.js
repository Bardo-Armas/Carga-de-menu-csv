// Variables globales para categorías
let categories = [];
let selectedCategoryId = null;

// Variables globales para restaurantes
let selectedRestaurant = null;
let currentRestaurants = [];

// Variables globales para productos
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
        const config = await getConfigCache();
        const response = await fetch(`${config.API_BASE_URL}/restaurants/category/${categoryId}`);
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

// Función para renderizar categorías
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    const loadingElement = document.getElementById('loadingCategories');
    
    if (categories.length === 0) {
        loadingElement.style.display = 'none';
        container.innerHTML = '<p class="no-categories">No hay categorías disponibles</p>';
        return;
    }
    
    loadingElement.style.display = 'none';
    
    const categoriesHTML = categories.map(category => {
        const randomColor = Utils.getRandomPastelColor();
        // Decodificar caracteres Unicode y escapar comillas para evitar errores en onclick
        const categoryName = category.name.replace(/'/g, "\\'");
        return `
            <div class="category-card" style="background: ${randomColor}" onclick="openRestaurantsModal(${category.id}, '${categoryName}')">
                ${category.image ? `<img src="${category.image}" alt="${category.name}" class="category-image">` : ''}
                <p class="category-name">${category.name}</p>
            </div>
        `;
    }).join('');
    
    container.innerHTML = categoriesHTML;
}

// Función para mostrar error en categorías
function showCategoriesError(message) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = `
        <div class="loading-categories">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <p>${message}</p>
        </div>
    `;
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
        
        // Cargar productos
        const response = await fetch(`${API_BASE_URL}/products/restaurant/${restaurantId}`);
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
        const config = await getConfigCache();
        const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
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
        resultElement.innerHTML = `<div class="error">✗ Error de conexión</div>`;
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
    
    Utils.downloadCSV(csvContent, 'ejemplo_variaciones.csv');
}

// Función para descargar ejemplo de productos
function downloadProductsExample() {
    const csvContent = `Establecimiento,Categoria,Subcategoria,Nombre,Descripcion,Precio,Imagen
La Barra De Pizza,Pizzas,Especialidades,Pizza Hawaiana,Deliciosa pizza con piña y jamón,180,https://example.com/pizza.jpg`;
    
    Utils.downloadCSV(csvContent, 'ejemplo_productos.csv');
}

// Función para descargar ejemplo de complementos
function downloadComplementsExample() {
    const csvContent = `Establecimiento,Nombre complemento,Precio,id Productos
La Barra De Pizza,Salsa macha,10,"6410,6411,6413,6414,6415,6412"
La Barra De Pizza,Salsa de habanero,5,"6410,6411,6413,6414,6415,6412"
La Barra De Pizza,Dips,10,"6410,6411,6413,6414,6415,6412"`;
    
    Utils.downloadCSV(csvContent, 'ejemplo_complementos.csv');
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
document.getElementById('variationsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('variationsFile').files[0];
    
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
        Utils.showResult('variationsResult', validation.message, false);
        return;
    }
    
    const btn = document.getElementById('uploadVariationsBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Procesando...';
    
    const progressInterval = Utils.showProgress('variationsProgress', 'variationsProgressBar');
    
    try {
        const formData = new FormData();
        formData.append('file', file); // Cambiar de 'csv_file' a 'file'
        
        const response = await fetch(`${API_BASE_URL}/upload-variations-csv`, {
            method: 'POST',
            body: formData
            // No headers - dejar que el navegador maneje Content-Type automáticamente
        });
        
        const result = await response.json();
        
        Utils.hideProgress('variationsProgress', 'variationsProgressBar', progressInterval);
        
        if (response.ok && result.status) {
            Utils.showResult('variationsResult', result.message || 'Variaciones procesadas exitosamente', true);
        } else {
            Utils.showResult('variationsResult', result.message || 'Error al procesar las variaciones', false);
        }
    } catch (error) {
        Utils.hideProgress('variationsProgress', 'variationsProgressBar', progressInterval);
        Utils.showResult('variationsResult', 'Error de conexión: ' + error.message, false);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Función para parsear CSV a array de objetos
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
        throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
    }
    
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Agregar el último valor
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index].replace(/"/g, '');
            });
            data.push(row);
        }
    }
    
    return data;
}

document.getElementById('productsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('productsFile');
    const file = fileInput.files[0];
    
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
        Utils.showResult('productsResult', validation.message, false);
        return;
    }
    
    const btn = document.getElementById('uploadProductsBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Procesando...';
    
    const progressInterval = Utils.showProgress('productsProgress', 'productsProgressBar');
    
    try {
        // Leer y parsear el archivo CSV
        const csvText = await file.text();
        const parsedData = parseCSV(csvText);
        
        // Validar que el CSV tenga las columnas requeridas
        const requiredColumns = ['Establecimiento', 'Categoria', 'Nombre del producto', 'Descripcion', 'Costo'];
        const firstRow = parsedData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            throw new Error(`Faltan las siguientes columnas en el CSV: ${missingColumns.join(', ')}`);
        }
        
        // Enviar datos parseados como JSON
        const response = await fetch(`${API_BASE_URL}/addProductsCsv`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                data: parsedData
            })
        });
        
        const result = await response.json();
        
        Utils.hideProgress('productsProgress', 'productsProgressBar', progressInterval);
        
        if (response.ok && result.status) {
            Utils.showResult('productsResult', result.message || 'Productos cargados exitosamente', true);
            fileInput.value = ''; // Limpiar el input
        } else {
            Utils.showResult('productsResult', result.message || 'Error al cargar productos', false);
        }
    } catch (error) {
        Utils.hideProgress('productsProgress', 'productsProgressBar', progressInterval);
        Utils.showResult('productsResult', 'Error al procesar el archivo: ' + error.message, false);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});
document.getElementById('complementsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('complementsFile').files[0];
    
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
        Utils.showResult('complementsResult', validation.message, false);
        return;
    }
    
    const btn = document.getElementById('uploadComplementsBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Procesando...';
    
    const progressInterval = Utils.showProgress('complementsProgress', 'complementsProgressBar');
    
    try {
        const formData = new FormData();
        formData.append('file', file); // Cambiar de 'csv_file' a 'file'
        
        const response = await fetch(`${API_BASE_URL}/upload-complements-csv`, {
            method: 'POST',
            body: formData
            // No headers - dejar que el navegador maneje Content-Type automáticamente
        });
        
        const result = await response.json();
        
        Utils.hideProgress('complementsProgress', 'complementsProgressBar', progressInterval);
        
        if (response.ok && result.status) {
            Utils.showResult('complementsResult', result.message || 'Complementos procesados exitosamente', true);
        } else {
            Utils.showResult('complementsResult', result.message || 'Error al procesar los complementos', false);
        }
    } catch (error) {
        Utils.hideProgress('complementsProgress', 'complementsProgressBar', progressInterval);
        Utils.showResult('complementsResult', 'Error de conexión: ' + error.message, false);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Configurar input de productos cuando se abra el modal
document.getElementById('productsModal').addEventListener('transitionend', function() {
    if (this.classList.contains('show')) {
        Utils.setupFileInput('productsFile');
    }
});

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', async function() {
    // Esperar a que se cargue la configuración
    await window.envLoaded;
    
    // Cargar categorías
    await loadCategories();
    
    // Configurar inputs de archivo
    const variationsInput = document.getElementById('variationsFile');
    const productsInput = document.getElementById('productsFile');
    const complementsInput = document.getElementById('complementsFile');
    
    if (variationsInput) {
        variationsInput.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'Ningún archivo seleccionado';
            document.getElementById('variationsFileName').textContent = fileName;
        });
    }
    
    if (productsInput) {
        productsInput.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'Ningún archivo seleccionado';
            document.getElementById('productsFileName').textContent = fileName;
        });
    }
    
    if (complementsInput) {
        complementsInput.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'Ningún archivo seleccionado';
            document.getElementById('complementsFileName').textContent = fileName;
        });
    }
});

// Función para obtener configuración (cache)
async function getConfigCache() {
    if (!CONFIG_CACHE) {
        try {
            console.log('Obteniendo configuración...');
            
            // Verificar que window.getConfig existe
            if (typeof window.getConfig !== 'function') {
                throw new Error('window.getConfig no está disponible');
            }
            
            // Asegurar que las variables de entorno estén cargadas
            if (window.envLoaded) {
                await window.envLoaded;
            }
            
            CONFIG_CACHE = await window.getConfig();
            console.log('Configuración obtenida:', CONFIG_CACHE);
            
            // Verificar que la configuración tiene los campos necesarios
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

// Función para cargar categorías
async function loadCategories() {
    try {
        console.log('=== INICIANDO CARGA DE CATEGORÍAS ===');
        
        const config = await getConfigCache();
        console.log('Configuración para categorías:', config);
        
        if (!config.API_BASE_URL) {
            throw new Error('API_BASE_URL no configurada');
        }
        
        const url = `${config.API_BASE_URL}/categories/active`;
        console.log('URL de categorías:', url);
        
        console.log('Haciendo petición fetch...');
        const response = await fetch(url);
        console.log('Respuesta recibida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Resultado parseado:', result);
        
        if (result.success) {
            categories = result.data || [];
            console.log('Categorías asignadas:', categories.length, 'elementos');
            
            // Verificar que renderCategories existe
            if (typeof renderCategories === 'function') {
                renderCategories();
                console.log('renderCategories ejecutado');
            } else {
                console.error('Función renderCategories no existe');
            }
            
            console.log('=== CATEGORÍAS CARGADAS EXITOSAMENTE ===');
        } else {
            const errorMsg = result.message || 'Error desconocido del servidor';
            console.error('Error del servidor:', errorMsg);
            showCategoriesError(errorMsg);
        }
    } catch (error) {
        console.error('=== ERROR EN CARGA DE CATEGORÍAS ===');
        console.error('Error completo:', error);
        console.error('Stack trace:', error.stack);
        
        const errorMessage = `Error de conexión: ${error.message}`;
        console.error('Mensaje de error:', errorMessage);
        
        if (typeof showCategoriesError === 'function') {
            showCategoriesError(errorMessage);
        } else {
            console.error('Función showCategoriesError no existe');
            alert(errorMessage);
        }
    }
}

// Asegurar que la función está disponible globalmente
window.loadCategories = loadCategories;

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
        const config = await getConfigCache();
        const response = await fetch(`${config.API_BASE_URL}/restaurants/category/${categoryId}`);
        const result = await response.json();
        
        if (result.success) {
            currentRestaurants = result.data;
            renderRestaurants(currentRestaurants);
        } else {
            showRestaurantsError(result.message || 'Error al cargar restaurantes');
        }
    } catch (error) {
        console.error('Error al cargar restaurantes:', error);
        showRestaurantsError('Error de conexión al cargar restaurantes');
    }
}

// Función para cargar productos
async function loadProducts(restaurantId, restaurantName) {
    try {
        selectedRestaurant = { id: restaurantId, name: restaurantName };
        
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
        
        const config = await getConfigCache();
        const response = await fetch(`${config.API_BASE_URL}/products/restaurant/${restaurantId}`);
        const result = await response.json();
        
        if (result.success) {
            currentProducts = result.data;
            groupedProducts = groupProductsByCategory(currentProducts);
            renderProducts();
        } else {
            showProductsError(result.message || 'Error al cargar productos');
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showProductsError('Error de conexión al cargar productos');
    }
}

// Función para subir archivos
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
        const config = await getConfigCache();
        const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
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
        resultElement.innerHTML = `<div class="error">✗ Error de conexión</div>`;
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
    
    Utils.downloadCSV(csvContent, 'ejemplo_variaciones.csv');
}

// Función para descargar ejemplo de productos
function downloadProductsExample() {
    const csvContent = `Establecimiento,Categoria,Subcategoria,Nombre,Descripcion,Precio,Imagen
La Barra De Pizza,Pizzas,Especialidades,Pizza Hawaiana,Deliciosa pizza con piña y jamón,180,https://example.com/pizza.jpg`;
    
    Utils.downloadCSV(csvContent, 'ejemplo_productos.csv');
}

// Función para descargar ejemplo de complementos
function downloadComplementsExample() {
    const csvContent = `Establecimiento,Nombre complemento,Precio,id Productos
La Barra De Pizza,Salsa macha,10,"6410,6411,6413,6414,6415,6412"
La Barra De Pizza,Salsa de habanero,5,"6410,6411,6413,6414,6415,6412"
La Barra De Pizza,Dips,10,"6410,6411,6413,6414,6415,6412"`;
    
    Utils.downloadCSV(csvContent, 'ejemplo_complementos.csv');
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
document.getElementById('variationsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('variationsFile').files[0];
    
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
        Utils.showResult('variationsResult', validation.message, false);
        return;
    }
    
    const btn = document.getElementById('uploadVariationsBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Procesando...';
    
    const progressInterval = Utils.showProgress('variationsProgress', 'variationsProgressBar');
    
    try {
        const formData = new FormData();
        formData.append('file', file); // Cambiar de 'csv_file' a 'file'
        
        const response = await fetch(`${API_BASE_URL}/upload-variations-csv`, {
            method: 'POST',
            body: formData
            // No headers - dejar que el navegador maneje Content-Type automáticamente
        });
        
        const result = await response.json();
        
        Utils.hideProgress('variationsProgress', 'variationsProgressBar', progressInterval);
        
        if (response.ok && result.status) {
            Utils.showResult('variationsResult', result.message || 'Variaciones procesadas exitosamente', true);
        } else {
            Utils.showResult('variationsResult', result.message || 'Error al procesar las variaciones', false);
        }
    } catch (error) {
        Utils.hideProgress('variationsProgress', 'variationsProgressBar', progressInterval);
        Utils.showResult('variationsResult', 'Error de conexión: ' + error.message, false);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Función para parsear CSV a array de objetos
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
        throw new Error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
    }
    
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Agregar el último valor
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index].replace(/"/g, '');
            });
            data.push(row);
        }
    }
    
    return data;
}

document.getElementById('productsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('productsFile');
    const file = fileInput.files[0];
    
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
        Utils.showResult('productsResult', validation.message, false);
        return;
    }
    
    const btn = document.getElementById('uploadProductsBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Procesando...';
    
    const progressInterval = Utils.showProgress('productsProgress', 'productsProgressBar');
    
    try {
        // Leer y parsear el archivo CSV
        const csvText = await file.text();
        const parsedData = parseCSV(csvText);
        
        // Validar que el CSV tenga las columnas requeridas
        const requiredColumns = ['Establecimiento', 'Categoria', 'Nombre del producto', 'Descripcion', 'Costo'];
        const firstRow = parsedData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            throw new Error(`Faltan las siguientes columnas en el CSV: ${missingColumns.join(', ')}`);
        }
        
        // Enviar datos parseados como JSON
        const response = await fetch(`${API_BASE_URL}/addProductsCsv`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                data: parsedData
            })
        });
        
        const result = await response.json();
        
        Utils.hideProgress('productsProgress', 'productsProgressBar', progressInterval);
        
        if (response.ok && result.status) {
            Utils.showResult('productsResult', result.message || 'Productos cargados exitosamente', true);
            fileInput.value = ''; // Limpiar el input
        } else {
            Utils.showResult('productsResult', result.message || 'Error al cargar productos', false);
        }
    } catch (error) {
        Utils.hideProgress('productsProgress', 'productsProgressBar', progressInterval);
        Utils.showResult('productsResult', 'Error al procesar el archivo: ' + error.message, false);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});
document.getElementById('complementsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('complementsFile').files[0];
    
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
        Utils.showResult('complementsResult', validation.message, false);
        return;
    }
    
    const btn = document.getElementById('uploadComplementsBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Procesando...';
    
    const progressInterval = Utils.showProgress('complementsProgress', 'complementsProgressBar');
    
    try {
        const formData = new FormData();
        formData.append('file', file); // Cambiar de 'csv_file' a 'file'
        
        const response = await fetch(`${API_BASE_URL}/upload-complements-csv`, {
            method: 'POST',
            body: formData
            // No headers - dejar que el navegador maneje Content-Type automáticamente
        });
        
        const result = await response.json();
        
        Utils.hideProgress('complementsProgress', 'complementsProgressBar', progressInterval);
        
        if (response.ok && result.status) {
            Utils.showResult('complementsResult', result.message || 'Complementos procesados exitosamente', true);
        } else {
            Utils.showResult('complementsResult', result.message || 'Error al procesar los complementos', false);
        }
    } catch (error) {
        Utils.hideProgress('complementsProgress', 'complementsProgressBar', progressInterval);
        Utils.showResult('complementsResult', 'Error de conexión: ' + error.message, false);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Configurar input de productos cuando se abra el modal
document.getElementById('productsModal').addEventListener('transitionend', function() {
    if (this.classList.contains('show')) {
        Utils.setupFileInput('productsFile');
    }
});

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', async function() {
    // Esperar a que se cargue la configuración
    await window.envLoaded;
    
    // Cargar categorías
    await loadCategories();
    
    // Configurar inputs de archivo
    const variationsInput = document.getElementById('variationsFile');
    const productsInput = document.getElementById('productsFile');
    const complementsInput = document.getElementById('complementsFile');
    
    if (variationsInput) {
        variationsInput.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'Ningún archivo seleccionado';
            document.getElementById('variationsFileName').textContent = fileName;
        });
    }
    
    if (productsInput) {
        productsInput.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'Ningún archivo seleccionado';
            document.getElementById('productsFileName').textContent = fileName;
        });
    }
    
    if (complementsInput) {
        complementsInput.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'Ningún archivo seleccionado';
            document.getElementById('complementsFileName').textContent = fileName;
        });
    }
});

// Función para obtener configuración (cache)
async function getConfigCache() {
    if (!CONFIG_CACHE) {
        CONFIG_CACHE = await window.getConfig();
    }
    return CONFIG_CACHE;
}

// Función para cargar restaurantes por categoría
async function loadRestaurantsByCategory(categoryId) {
    try {
        const config = await getConfigCache();
        const response = await fetch(`${config.API_BASE_URL}/restaurants/category/${categoryId}`);
        const result = await response.json();
        
        if (result.success) {
            currentRestaurants = result.data;
            renderRestaurants(currentRestaurants);
        } else {
            showRestaurantsError(result.message || 'Error al cargar restaurantes');
        }
    } catch (error) {
        console.error('Error al cargar restaurantes:', error);
        showRestaurantsError('Error de conexión al cargar restaurantes');
    }
}
