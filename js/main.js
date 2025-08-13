document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let cart = [];
    let products = [];
    let orders = [];
    let customers = [];
    let currentUser = null;
    let currentUserRole = 'customer';
    let taxRate = 10.5;
    let authMode = 'login';
    let currentCategory = 'all';
    let paymentReceiptFile = null;
    let currentTable = null;
    let chefFilter = 'all';
    let realtimeOrdersListener = null;
    
    // Referencias DOM (se asignarán después de que el DOM esté cargado)
    let mainHeader;
    let logoutBtn;
    let mainContent;
    let cartModal;
    let closeModal;
    let cartItems;
    let cartSubtotal;
    let cartTax;
    let cartTotal;
    let checkoutBtn;
    let sections;
    let adminBtns;
    let adminSections;
    let authSection;
    let googleLoginBtn;
    let appleLoginBtn;
    let taxRateValue;
    let settingsForm;
    let profileContainer;
    let authForm;
    let authEmail;
    let authPassword;
    let authConfirmPassword;
    let authSubmitBtn;
    let signUpLink;
    let forgotPasswordLink;
    let loginLink;
    let authMessage;
    let confirmPasswordField;
    let magicNavItems;
    let adminMobileNavItem;
    let mobileCartIcon;
    let menuToggle;
    let sidebar;
    let closeSidebar;
    let overlay;
    let categoriesContainer;
    let paymentMethod;
    let posDetails;
    let mobileDetails;
    let usdDetails;
    let eurDetails;
    let cashDetails;
    let mobileReference;
    let waiterSection;
    let chefSection;
    let waiterProductsContainer;
    let kitchenOrdersContainer;
    let filterButtons;
    let orderNotification;
    let notificationContent;
    let customerPaymentSection;
    let magicNav;
    let desktopCartBtn;
    
    // Observador de autenticación
    auth.onAuthStateChanged(user => {
        currentUser = user;
        
        // Verificar que los elementos DOM estén disponibles
        if (!mainHeader || !authSection || !magicNav) {
            console.log("Elementos DOM aún no disponibles, reintentando en 100ms");
            setTimeout(() => auth.onAuthStateChanged(user), 100);
            return;
        }
    
        if (user) {
            // Mostrar header animado
            setTimeout(() => {
                if (mainHeader) mainHeader.classList.add('visible');
                
                // Añadir efecto de scroll después de mostrar
                setTimeout(() => {
                    if (window) window.addEventListener('scroll', handleHeaderScroll);
                    handleHeaderScroll();
                }, 100);
            }, 300);
            
            // Ocultar sección de autenticación
            if (authSection) authSection.style.display = 'none';
            
            // Mostrar barra mágica
            if (magicNav) magicNav.classList.add('visible');
            
            // Obtener datos del cliente
            db.collection("customers").doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    currentUserRole = userData.role || 'customer';
                    updateUIForRole();
                } else {
                    saveCustomerData(user);
                    currentUserRole = 'customer';
                    updateUIForRole();
                }
                
                // Determinar vista según rol
                if (currentUserRole === 'waiter') {
                    loadComponent('waiter');
                    document.if (body) body.classList.add('role-waiter');
                    if (mobileCartIcon) mobileCartIcon.style.display = 'flex';
                } 
                else if (currentUserRole === 'empanada_chef' || currentUserRole === 'general_chef') {
                    loadComponent('chef');
                    document.if (body) body.classList.add('role-chef');
                    if (currentUserRole === 'empanada_chef') {
                        document.if (body) body.classList.add('role-empanada-chef');
                    } else {
                        document.if (body) body.classList.add('role-general-chef');
                    }
                    loadKitchenOrders();
                    listenForNewOrders();
                } 
                else {
                    document.if (body) body.classList.add('role-customer');
                    loadComponent('menu');
                    if (mobileCartIcon) mobileCartIcon.style.display = 'flex';
                }
            })
            .catch(error => {
                console.error("Error obteniendo datos de usuario: ", error);
                currentUserRole = 'customer';
                updateUIForRole();
            });
            
            // Cargar datos
            loadProducts();
            loadOrders();
            loadAdminOrders();
            loadCustomers();
            renderProfile();
        } else {
            // Ocultar header
            if (mainHeader) mainHeader.classList.remove('visible', 'scrolled');
            window.removeEventListener('scroll', handleHeaderScroll);
            
            // Usuario no autenticado
            loadComponent('auth');
            currentUserRole = 'customer';
            if (adminMobileNavItem) adminMobileNavItem.style.display = 'none';
            if (mobileCartIcon) mobileCartIcon.style.display = 'none';
            if (desktopCartBtn) desktopCartBtn.style.display = 'none';
            document.if (body) body.classList.remove('role-customer', 'role-waiter', 'role-chef');
            if (magicNav) magicNav.classList.remove('visible');
        }
    });
    
    // Manejar scroll para efecto en header
    function handleHeaderScroll() {
        if (window.scrollY > 30) {
            if (mainHeader) mainHeader.classList.add('scrolled');
        } else {
            if (mainHeader) mainHeader.classList.remove('scrolled');
        }
    }
    
    // Función para actualizar la UI según el rol
    function updateUIForRole() {
        if (adminMobileNavItem) {
            if (currentUserRole === 'admin') {
                if (adminMobileNavItem) adminMobileNavItem.style.display = 'flex';
            } else {
                if (adminMobileNavItem) adminMobileNavItem.style.display = 'none';
                if (document.getElementById('adminSection') && document.getElementById('adminSection').style.display === 'block') {
                    loadComponent('menu');
                }
            }
        }
        
        // Mostrar u ocultar botón de carrito de escritorio
        if (desktopCartBtn) {
            if (currentUserRole === 'customer' || currentUserRole === 'waiter') {
                if (desktopCartBtn) desktopCartBtn.style.display = 'flex';
            } else {
                if (desktopCartBtn) desktopCartBtn.style.display = 'none';
            }
        }
        
        // Ocultar sección de pago para meseros
        if (customerPaymentSection && currentUserRole === 'waiter') {
            if (customerPaymentSection) customerPaymentSection.style.display = 'none';
        } else if (customerPaymentSection) {
            if (customerPaymentSection) customerPaymentSection.style.display = 'block';
        }
        
        // Actualizar contador de carrito
        updateCartCount();
    }
    
    // Actualizar contador de carrito
    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(span => {
            span.textContent = count;
        });
    }
    
    // Guardar datos del cliente en Firebase
    function saveCustomerData(user) {
        const customerRef = db.collection("customers").doc(user.uid);
        customerRef.get().then(doc => {
            const currentData = doc.exists ? doc.data() : {};
            const customerData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || "Cliente",
                photoURL: user.photoURL || "",
                lastLogin: new Date().toISOString(),
                createdAt: doc.exists ? currentData.createdAt : firebase.firestore.FieldValue.serverTimestamp(),
                role: currentData.role || 'customer'
            };
            customerRef.set(customerData, { merge: true })
            .then(() => {
                console.log("Datos del cliente guardados correctamente");
            })
            .catch(error => {
                console.error("Error guardando datos del cliente: ", error);
            });
        }).catch(error => {
            console.error("Error obteniendo datos del cliente: ", error);
        });
    }
    
    // Establecer modo de autenticación
    function setAuthMode(mode) {
        authMode = mode;
        if (!authMessage || !authSubmitBtn || !confirmPasswordField || 
            !signUpLink || !forgotPasswordLink || !loginLink) return;
            
        switch(mode) {
            case 'login':
                authMessage.textContent = "Inicia sesión para continuar";
                authSubmitBtn.textContent = "Iniciar Sesión";
                if (confirmPasswordField) confirmPasswordField.style.display = 'none';
                if (signUpLink) signUpLink.style.display = 'inline';
                if (forgotPasswordLink) forgotPasswordLink.style.display = 'inline';
                if (loginLink) loginLink.style.display = 'none';
                break;
            case 'register':
                authMessage.textContent = "Crea una cuenta";
                authSubmitBtn.textContent = "Registrarse";
                if (confirmPasswordField) confirmPasswordField.style.display = 'block';
                if (signUpLink) signUpLink.style.display = 'none';
                if (forgotPasswordLink) forgotPasswordLink.style.display = 'none';
                if (loginLink) loginLink.style.display = 'inline';
                break;
            case 'forgot':
                authMessage.textContent = "Recuperar contraseña";
                authSubmitBtn.textContent = "Enviar Correo";
                if (confirmPasswordField) confirmPasswordField.style.display = 'none';
                if (signUpLink) signUpLink.style.display = 'none';
                if (forgotPasswordLink) forgotPasswordLink.style.display = 'none';
                if (loginLink) loginLink.style.display = 'inline';
                break;
        }
    }
    
    // Iniciar sesión con correo/contraseña
    function loginWithEmail(email, password) {
        auth.signInWithEmailAndPassword(email, password)
        .then(() => showNotification("Sesión iniciada correctamente"))
        .catch(error => {
            console.error("Error de autenticación: ", error);
            showNotification(`Error al iniciar sesión: ${error.message}`);
        });
    }
    
    // Registrar nuevo usuario
    function signUpWithEmail(email, password) {
        auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            db.collection("customers").doc(user.uid).set({
                email: email,
                displayName: "Cliente",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'customer'
            }, { merge: true })
            .then(() => showNotification("¡Cuenta creada correctamente!"));
        })
        .catch(error => {
            console.error("Error registrando usuario: ", error);
            showNotification(`Error al registrar: ${error.message}`);
        });
    }
    
    // Recuperar contraseña
    function resetPassword(email) {
        auth.sendPasswordResetEmail(email)
        .then(() => {
            showNotification("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
            setAuthMode('login');
        })
        .catch(error => {
            console.error("Error enviando correo de recuperación: ", error);
            showNotification(`Error: ${error.message}`);
        });
    }
    
    // Cargar componente
    function loadComponent(component) {
        fetch(`components/${component}.html`)
            .then(response => response.text())
            .then(html => {
                mainContent.innerHTML = html;
                initializeComponent(component);
            })
            .catch(error => {
                console.error('Error cargando componente:', error);
                mainContent.innerHTML = `<p>Error cargando el componente: ${component}</p>`;
            });
    }
    
    function initializeComponent(component) {
        switch(component) {
            case 'menu':
                loadProducts();
                break;
            case 'orders':
                loadOrders();
                break;
            case 'profile':
                renderProfile();
                break;
            case 'admin':
                loadAdminOrders();
                loadCustomers();
                break;
            case 'waiter':
                setupTableSelection();
                break;
            case 'chef':
                loadKitchenOrders();
                break;
            case 'auth':
                setAuthMode('login');
                break;
        }
    }
    
    // Cargar productos desde Firebase
    function loadProducts() {
        db.collection("products").get().then(querySnapshot => {
            products = [];
            querySnapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            renderProducts();
            renderWaiterProducts();
            renderCurrentProducts();
            renderCategoryFilters();
        }).catch(error => {
            console.error("Error cargando productos: ", error);
        });
    }
    
    // Renderizar los botones de categorías
    function renderCategoryFilters() {
        // Obtener categorías únicas
        const categories = [...new Set(products.map(product => product.category))];
        
        // Limpiar contenedor
        categoriesContainer.innerHTML = '';
        
        // Crear botones de categoría
        categories.forEach(category => {
            const button = document.createElement('div');
            button.className = `category-btn ${currentCategory === category ? 'active' : ''}`;
            button.dataset.category = category;
            
            // Asignar íconos según categoría
            let iconClass = 'fas fa-utensils'; // Icono por defecto
            switch(category) {
                case 'empanadas': iconClass = 'fas fa-pizza-slice'; break;
                case 'entradas': iconClass = 'fas fa-appetizer'; break;
                case 'sopas': iconClass = 'fas fa-bowl-food'; break;
                case 'desayuno criollo': iconClass = 'fas fa-egg'; break;
                case 'cachapas': iconClass = 'fas fa-bread-slice'; break;
                case 'arepas': iconClass = 'fas fa-cookie'; break;
                case 'tipico de venezuela': iconClass = 'fas fa-flag'; break;
                case 'extras': iconClass = 'fas fa-plus-circle'; break;
                case 'carne': iconClass = 'fas fa-drumstick-bite'; break;
                case 'aves': iconClass = 'fas fa-dove'; break;
                case 'ensaladas': iconClass = 'fas fa-leaf'; break;
                case 'bebidas': iconClass = 'fas fa-glass-martini-alt'; break;
                case 'postres': iconClass = 'fas fa-ice-cream'; break;
            }
            
            button.innerHTML = `
                <i class="${iconClass}"></i>
                <span>${category}</span>
            `;
            if (button) button.addEventListener('click', () => {
                currentCategory = category;
                renderProducts();
                document.querySelectorAll('.category-btn').forEach(btn => {
                    if (btn) btn.classList.remove('active');
                });
                if (button) button.classList.add('active');
                closeSidebarFunc(); // Cerrar barra lateral al seleccionar categoría
            });
            categoriesContainer.appendChild(button);
        });
        
        // Botón para mostrar todos los productos
        const allButton = document.createElement('div');
        allButton.className = `category-btn ${currentCategory === 'all' ? 'active' : ''}`;
        allButton.dataset.category = 'all';
        allButton.innerHTML = `
            <i class="fas fa-utensils"></i>
            <span>Todos los productos</span>
        `;
        if (allButton) allButton.addEventListener('click', () => {
            currentCategory = 'all';
            renderProducts();
            document.querySelectorAll('.category-btn').forEach(btn => {
                if (btn) btn.classList.remove('active');
            });
            if (allButton) allButton.classList.add('active');
            closeSidebarFunc(); // Cerrar barra lateral al seleccionar categoría
        });
        categoriesContainer.insertBefore(allButton, categoriesContainer.firstChild);
    }
    
    // Renderizar productos
    function renderProducts() {
        const productsContainer = document.getElementById('productsContainer');
        if (!productsContainer) return;
        
        productsContainer.innerHTML = '';
        
        // Filtrar productos por categoría
        let filteredProducts = products;
        if (currentCategory !== 'all') {
            filteredProducts = products.filter(product => product.category === currentCategory);
        }
        
        if (filteredProducts.length === 0) {
            productsContainer.innerHTML = '<p class="empty-message">No hay productos disponibles en esta categoría.</p>';
            return;
        }
        
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-badge">${product.category}</div>
                <div class="product-image">
                    <img src="https://via.placeholder.com/300x200?text=${product.name.replace(/\s+/g, '+')}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-title">
                        <span>${product.name}</span>
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                    </h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <button class="add-to-cart" data-id="${product.id}">
                            <i class="fas fa-plus"></i> <span>Añadir</span>
                        </button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });
        
        // Añadir event listeners
        document.querySelectorAll('.add-to-cart').forEach(button => {
            if (button) button.addEventListener('click', (e) => {
                const productId = e.target.closest('.add-to-cart').dataset.id;
                addToCart(productId);
                animateCart();
            });
        });
    }
    
    // Añadir al carrito
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        
        if (product) {
            const existingItem = cart.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1
                });
            }
            
            showNotification(`${product.name} añadida al carrito!`);
            updateCartCount();
        }
    }
    
    // Renderizar carrito
    function renderCart() {
        if (!cartItems) return;
        
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
            cartSubtotal.textContent = '$0.00';
            cartTax.textContent = '$0.00';
            cartTotal.textContent = '$0.00';
            return;
        }
        
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-drumstick-bite" style="font-size: 1.5rem;"></i>
                    <div class="item-info">
                        <div class="item-title">${item.name}</div>
                        <div class="item-price">$${item.price.toFixed(2)} c/u</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    <button class="remove-item" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;
        
        cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        cartTax.textContent = `$${tax.toFixed(2)}`;
        cartTotal.textContent = `$${total.toFixed(2)}`;
        
        // Event listeners para botones del carrito
        document.querySelectorAll('.quantity-btn.minus').forEach(button => {
            if (button) button.addEventListener('click', (e) => {
                const productId = e.target.closest('.quantity-btn').dataset.id;
                updateQuantity(productId, -1);
            });
        });
        
        document.querySelectorAll('.quantity-btn.plus').forEach(button => {
            if (button) button.addEventListener('click', (e) => {
                const productId = e.target.closest('.quantity-btn').dataset.id;
                updateQuantity(productId, 1);
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(button => {
            if (button) button.addEventListener('click', (e) => {
                const productId = e.target.closest('.remove-item').dataset.id;
                removeFromCart(productId);
            });
        });
    }
    
    // Actualizar cantidad en carrito
    function updateQuantity(productId, change) {
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            item.quantity += change;
            
            if (item.quantity <= 0) {
                cart = cart.filter(item => item.id !== productId);
            }
            
            renderCart();
            updateCartCount();
        }
    }
    
    // Eliminar del carrito
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        renderCart();
        updateCartCount();
        showNotification('Producto eliminado del carrito');
    }
    
    // Subir comprobante a Firebase Storage
    function uploadReceipt(file) {
        return new Promise((resolve, reject) => {
            if (!currentUser) {
                reject('Usuario no autenticado');
                return;
            }
            
            const storageRef = storage.ref();
            const receiptRef = storageRef.child(`receipts/${currentUser.uid}/${Date.now()}_${file.name}`);
            
            receiptRef.put(file)
            .then(snapshot => {
                snapshot.ref.getDownloadURL().then(url => {
                    resolve(url);
                });
            })
            .catch(error => {
                reject(error);
            });
        });
    }
    
    // Finalizar compra
    async function checkout() {
        if (cart.length === 0) return;
        
        const method = document.getElementById('paymentMethod').value;
        let reference = '';
        let receiptUrl = '';
        
        // Obtener referencia según el método
        switch(method) {
            case 'pos':
                reference = 'POS';
                break;
            case 'mobile':
                reference = document.getElementById('mobileReference').value || 'N/A';
                break;
            case 'usd':
                reference = document.getElementById('usdReference').value;
                const usdReceipt = document.getElementById('usdReceipt').files[0];
                if (usdReceipt) {
                    try {
                        receiptUrl = await uploadReceipt(usdReceipt);
                    } catch (error) {
                        showNotification('Error al subir el comprobante: ' + error);
                        return;
                    }
                }
                break;
            case 'eur':
                reference = document.getElementById('eurReference').value;
                const eurReceipt = document.getElementById('eurReceipt').files[0];
                if (eurReceipt) {
                    try {
                        receiptUrl = await uploadReceipt(eurReceipt);
                    } catch (error) {
                        showNotification('Error al subir el comprobante: ' + error);
                        return;
                    }
                }
                break;
            case 'cash':
                reference = 'EFECTIVO';
                break;
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;
        
        const order = {
            date: new Date().toISOString(),
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: currentUser.displayName || "Cliente",
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                category: products.find(p => p.id === item.id)?.category || 'general',
                status: 'pending'
            })),
            subtotal,
            tax,
            total,
            status: 'pending',
            paymentMethod: method,
            paymentReference: reference,
            paymentReceipt: receiptUrl
        };
        
        // Guardar en Firebase
        db.collection("orders").add(order)
        .then(() => {
            showNotification('¡Pedido realizado con éxito!');
            cart = [];
            updateCartCount();
            if (cartModal) cartModal.style.display = 'none';
            loadOrders();
            loadAdminOrders();
        })
        .catch(error => {
            console.error("Error guardando pedido: ", error);
            showNotification('Error al guardar el pedido');
        });
    }
    
    // Agregar nuevo producto
    function addProduct(name, price, description, category) {
        const newProduct = {
            name,
            price: parseFloat(price),
            description,
            category,
            createdAt: new Date().toISOString()
        };
        
        db.collection("products").add(newProduct)
        .then(() => {
            showNotification('¡Producto agregado con éxito!');
            loadProducts();
        })
        .catch(error => {
            console.error("Error agregando producto: ", error);
            showNotification('Error al agregar producto');
        });
    }
    
    // Eliminar producto
    function deleteProduct(productId) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            db.collection("products").doc(productId).delete()
            .then(() => {
                showNotification('Producto eliminado');
                loadProducts();
            })
            .catch(error => {
                console.error("Error eliminando producto: ", error);
                showNotification('Error al eliminar producto');
            });
        }
    }
    
    // Actualizar estado de pedido
    function updateOrderStatus(orderId, status) {
        db.collection("orders").doc(orderId).update({ status })
        .then(() => {
            showNotification('Estado actualizado correctamente');
            loadAdminOrders();
            loadKitchenOrders();
        })
        .catch(error => {
            console.error("Error actualizando estado: ", error);
            showNotification('Error al actualizar estado');
        });
    }
    
    // Renderizar productos actuales en panel de administración
    function renderCurrentProducts() {
        const currentProducts = document.getElementById('currentProducts');
        if (!currentProducts) return;
        
        currentProducts.innerHTML = '';
        
        if (products.length === 0) {
            currentProducts.innerHTML = '<p>No hay productos registrados.</p>';
            return;
        }
        
        const table = document.createElement('table');
        if (table) table.style.width = '100%';
        if (table) table.style.borderCollapse = 'collapse';
        if (table) table.style.marginTop = '1rem';
        
        // Cabecera
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Producto</th>
                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Categoría</th>
                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Precio</th>
                <th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd;">Acciones</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Cuerpo
        const tbody = document.createElement('tbody');
        
        products.forEach(product => {
            const tr = document.createElement('tr');
            if (tr) tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
                <td style="padding: 10px;">${product.name}</td>
                <td style="padding: 10px; text-transform: capitalize;">${product.category}</td>
                <td style="padding: 10px; text-align: right;">$${product.price.toFixed(2)}</td>
                <td style="padding: 10px; text-align: center;">
                    <button class="delete-product" data-id="${product.id}" style="background: none; border: none; cursor: pointer;">
                        <i class="fas fa-trash" style="color: var(--danger);"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        currentProducts.appendChild(table);
        
        // Event listeners para eliminar
        document.querySelectorAll('.delete-product').forEach(button => {
            if (button) button.addEventListener('click', (e) => {
                const productId = e.target.closest('.delete-product').dataset.id;
                deleteProduct(productId);
            });
        });
    }
    
    // Cargar pedidos del cliente
    function loadOrders() {
        if (!currentUser) return;
        const ordersTableBody = document.getElementById('ordersTableBody');
        if (!ordersTableBody) return;
        
        orders = [];
        ordersTableBody.innerHTML = '';
        
        db.collection("orders")
            .where("userId", "==", currentUser.uid)
            .orderBy("date", "desc")
            .get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    ordersTableBody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center;">No tienes pedidos registrados</td>
                        </tr>
                    `;
                    return;
                }
                
                querySnapshot.forEach(doc => {
                    const order = { id: doc.id, ...doc.data() };
                    orders.push(order);
                    const date = new Date(order.date);
                    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    // Contar productos
                    const productCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${order.id.substring(0, 8)}</td>
                        <td>${formattedDate}</td>
                        <td>${productCount} producto${productCount !== 1 ? 's' : ''}</td>
                        <td>$${order.total.toFixed(2)}</td>
                        <td>${getPaymentMethodName(order.paymentMethod)}</td>
                        <td>${order.paymentReference || 'N/A'}</td>
                        <td><span class="order-status status-${order.status}">${getStatusText(order.status)}</span></td>
                    `;
                    ordersTableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error("Error cargando pedidos: ", error);
                ordersTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center;">Error al cargar pedidos</td>
                    </tr>
                `;
            });
    }
    
    // Cargar todos los pedidos (admin)
    function loadAdminOrders() {
        if (currentUserRole !== 'admin') return;
        const adminOrdersTableBody = document.getElementById('adminOrdersTableBody');
        if (!adminOrdersTableBody) return;
        
        adminOrdersTableBody.innerHTML = '';
        
        db.collection("orders")
            .orderBy("date", "desc")
            .get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    adminOrdersTableBody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center;">No hay pedidos registrados</td>
                        </tr>
                    `;
                    return;
                }
                
                querySnapshot.forEach(doc => {
                    const order = { id: doc.id, ...doc.data() };
                    const date = new Date(order.date);
                    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${order.id.substring(0, 8)}</td>
                        <td>${order.userName}</td>
                        <td>${formattedDate}</td>
                        <td>$${order.total.toFixed(2)}</td>
                        <td>${getPaymentMethodName(order.paymentMethod)}</td>
                        <td>${order.paymentReference || 'N/A'}</td>
                        <td>
                            <select class="order-status" data-id="${order.id}">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>En preparación</option>
                                <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Listo</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregado</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </td>
                        <td>
                            <button class="view-order" data-id="${order.id}">Ver</button>
                        </td>
                    `;
                    adminOrdersTableBody.appendChild(row);
                });
                
                // Event listeners para cambiar estado
                document.querySelectorAll('.order-status').forEach(select => {
                    if (select) select.addEventListener('change', (e) => {
                        const orderId = e.target.dataset.id;
                        const newStatus = e.target.value;
                        updateOrderStatus(orderId, newStatus);
                    });
                });
            })
            .catch(error => {
                console.error("Error cargando pedidos de admin: ", error);
                adminOrdersTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center;">Error al cargar pedidos</td>
                    </tr>
                `;
            });
    }
    
    // Obtener nombre de método de pago
    function getPaymentMethodName(method) {
        switch(method) {
            case 'pos': return 'Punto de Venta';
            case 'mobile': return 'Pago Móvil';
            case 'usd': return 'Divisa USD';
            case 'eur': return 'Divisa EUR';
            case 'cash': return 'Efectivo';
            default: return method;
        }
    }
    
    // Obtener texto de estado
    function getStatusText(status) {
        switch(status) {
            case 'pending': return 'Pendiente';
            case 'preparing': return 'En preparación';
            case 'ready': return 'Listo para entrega';
            case 'delivered': return 'Entregado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    }
    
    // Cargar clientes (admin)
    function loadCustomers() {
        if (currentUserRole !== 'admin') return;
        const customersTableBody = document.getElementById('customersTableBody');
        if (!customersTableBody) return;
        
        customersTableBody.innerHTML = '';
        
        db.collection("customers").get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    customersTableBody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center;">No hay clientes registrados</td>
                        </tr>
                    `;
                    return;
                }
                
                querySnapshot.forEach(doc => {
                    const customer = { id: doc.id, ...doc.data() };
                    const lastLogin = customer.lastLogin ? new Date(customer.lastLogin).toLocaleString() : 'Nunca';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${customer.displayName}</td>
                        <td>${customer.email}</td>
                        <td>${customer.phone || 'N/A'}</td>
                        <td>${customer.orderCount || 0}</td>
                        <td>${lastLogin}</td>
                    `;
                    customersTableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error("Error cargando clientes: ", error);
                customersTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center;">Error al cargar clientes</td>
                    </tr>
                `;
            });
    }
    
    // Renderizar perfil
    function renderProfile() {
        if (!currentUser || !profileContainer) return;
    
        // Obtener la fecha de creación de la cuenta
        const creationDate = currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime) : null;
        const memberSince = creationDate ? creationDate.getFullYear() : 'N/A';
    
        profileContainer.innerHTML = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3>${currentUser.displayName || "Cliente"}</h3>
                    <p>${currentUser.email}</p>
                </div>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">${memberSince}</span>
                        <span class="stat-label">Miembro desde</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${orders.length}</span>
                        <span class="stat-label">Pedidos realizados</span>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="btn">Editar Perfil</button>
                    <button class="btn btn-secondary" id="viewHistoryBtn">Ver Historial</button>
                </div>
            </div>
        `;
    
        // Event listener para el botón de historial
        const historyBtn = document.getElementById('viewHistoryBtn');
        if (historyBtn) {
            if (historyBtn) historyBtn.addEventListener('click', () => {
                loadComponent('orders');
            });
        }
    }
    
    // Mostrar notificación
    function showNotification(message) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        if (notification) notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background-color: var(--success);
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            transform: translateX(200%);
            transition: transform 0.3s ease-in-out;
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            if (notification) notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            if (notification) notification.style.transform = 'translateX(200%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Animación para icono del carrito
    function animateCart() {
        const cartIcon = document.getElementById('mobileCartIcon');
        if (!cartIcon) return;
        
        if (cartIcon) cartIcon.classList.add('pulse');
        setTimeout(() => {
            if (cartIcon) cartIcon.classList.remove('pulse');
        }, 500);
    }
    
    // Función para abrir el menú lateral
    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.if (body) body.style.overflow = 'hidden';
    }
    
    // Función para cerrar el menú lateral
    function closeSidebarFunc() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.if (body) body.style.overflow = 'auto';
    }
    
    // Manejar cambio de método de pago
    function handlePaymentMethodChange() {
        if (!paymentMethod) return;
        const method = paymentMethod.value;
        
        // Ocultar todos los detalles
        if (posDetails) if (posDetails) posDetails.classList.remove('active');
        if (mobileDetails) if (mobileDetails) mobileDetails.classList.remove('active');
        if (usdDetails) if (usdDetails) usdDetails.classList.remove('active');
        if (eurDetails) if (eurDetails) eurDetails.classList.remove('active');
        if (cashDetails) if (cashDetails) cashDetails.classList.remove('active');
        
        // Mostrar detalles del método seleccionado
        switch(method) {
            case 'pos':
                if (posDetails) if (posDetails) posDetails.classList.add('active');
                break;
            case 'mobile':
                if (mobileDetails) if (mobileDetails) mobileDetails.classList.add('active');
                break;
            case 'usd':
                if (usdDetails) if (usdDetails) usdDetails.classList.add('active');
                break;
            case 'eur':
                if (eurDetails) if (eurDetails) eurDetails.classList.add('active');
                break;
            case 'cash':
                if (cashDetails) if (cashDetails) cashDetails.classList.add('active');
                break;
        }
    }
    
    // =====================================
    // Funciones para Meseros
    // =====================================
    
    // Seleccionar mesa
    function setupTableSelection() {
        document.querySelectorAll('.table-card').forEach(card => {
            if (card) card.addEventListener('click', () => {
                document.querySelectorAll('.table-card').forEach(c => {
                    if (c) c.classList.remove('active');
                });
                if (card) card.classList.add('active');
                currentTable = card.dataset.table;
                
                // Habilitar el menú
                const waiterMenu = document.getElementById('waiterMenuSection');
                if (waiterMenu) if (waiterMenu) waiterMenu.style.display = 'block';
                
                // Cargar productos
                renderWaiterProducts();
            });
        });
    }
    
    // Renderizar productos para meseros
    function renderWaiterProducts() {
        if (!waiterProductsContainer) return;
        
        waiterProductsContainer.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-badge">${product.category}</div>
                <div class="product-image">
                    <img src="https://via.placeholder.com/300x200?text=${product.name.replace(/\s+/g, '+')}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-title">
                        <span>${product.name}</span>
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                    </h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <button class="add-to-cart" data-id="${product.id}">
                            <i class="fas fa-plus"></i> <span>Añadir</span>
                        </button>
                    </div>
                </div>
            `;
            waiterProductsContainer.appendChild(productCard);
        });
        
        // Event listeners para añadir al carrito
        document.querySelectorAll('.add-to-cart').forEach(button => {
            if (button) button.addEventListener('click', (e) => {
                const productId = e.target.closest('.add-to-cart').dataset.id;
                addToCart(productId);
                animateCart();
            });
        });
    }
    
    // Procesar pedido de mesero
    async function processWaiterOrder() {
        if (cart.length === 0) {
            showNotification('El carrito está vacío');
            return;
        }
        
        if (!currentTable) {
            showNotification('Seleccione una mesa primero');
            return;
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;
        
        const order = {
            date: new Date().toISOString(),
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: `Mesa ${currentTable} (Mesero: ${currentUser.displayName || "Anónimo"})`,
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                category: products.find(p => p.id === item.id)?.category || 'general',
                status: 'pending'
            })),
            subtotal,
            tax,
            total,
            status: 'pending',
            paymentMethod: 'cash',
            paymentReference: `Mesa ${currentTable}`,
            table: currentTable,
            waiterId: currentUser.uid
        };
        
        // Guardar en Firebase
        try {
            await db.collection("orders").add(order);
            showNotification(`Pedido para Mesa ${currentTable} realizado con éxito!`);
            cart = [];
            updateCartCount();
            if (cartModal) cartModal.style.display = 'none';
            loadAdminOrders();
            loadKitchenOrders();
        } catch (error) {
            console.error("Error guardando pedido: ", error);
            showNotification('Error al guardar el pedido');
        }
    }
    
    // =====================================
    // Funciones para Cocineros
    // =====================================
    
    // Escuchar nuevos pedidos en tiempo real
    function listenForNewOrders() {
        // Detener listener anterior si existe
        if (realtimeOrdersListener) {
            realtimeOrdersListener();
        }
        
        realtimeOrdersListener = db.collection("orders")
            .where("status", "in", ["pending", "preparing"])
            .orderBy("date", "desc")
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === "added") {
                        // Mostrar notificación de nuevo pedido
                        const order = change.doc.data();
                        if (notificationContent) notificationContent.textContent = `Mesa ${order.table || 'Llevar'} ha realizado un nuevo pedido`;
                        if (orderNotification) if (orderNotification) orderNotification.classList.add('show');
                        
                        setTimeout(() => {
                            if (orderNotification) if (orderNotification) orderNotification.classList.remove('show');
                        }, 5000);
                    }
                });
                
                // Actualizar la lista de pedidos
                loadKitchenOrders();
            });
    }
    
    // Cargar pedidos para cocina
    function loadKitchenOrders() {
        if (currentUserRole !== 'empanada_chef' && currentUserRole !== 'general_chef') return;
        if (!kitchenOrdersContainer) return;
        
        let query = db.collection("orders")
            .where("status", "in", ["pending", "preparing"])
            .orderBy("date", "asc");
        
        // Aplicar filtros adicionales
        if (chefFilter === 'pending') {
            query = query.where("status", "==", "pending");
        } else if (chefFilter === 'preparing') {
            query = query.where("status", "==", "preparing");
        } else if (chefFilter === 'ready') {
            query = query.where("status", "==", "ready");
        }
        
        query.get()
            .then(querySnapshot => {
                kitchenOrdersContainer.innerHTML = '';
                
                if (querySnapshot.empty) {
                    kitchenOrdersContainer.innerHTML = `
                        <div class="empty-message">
                            <i class="fas fa-utensils"></i>
                            <p>No hay pedidos pendientes</p>
                        </div>
                    `;
                    return;
                }
                
                querySnapshot.forEach(doc => {
                    const order = { id: doc.id, ...doc.data() };
                    const date = new Date(order.date);
                    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    const orderElement = document.createElement('div');
                    orderElement.className = 'kitchen-order-card';
                    orderElement.innerHTML = `
                        <div class="order-header">
                            <div class="order-id">Pedido #${order.id.substring(0, 8)}</div>
                            <div class="order-time">${formattedDate}</div>
                            <div class="order-table">${order.table || 'Llevar'}</div>
                        </div>
                        
                        <div class="order-items">
                            ${order.items.map(item => `
                                <div class="order-item ${item.category === 'empanadas' ? 'empanada' : ''}">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-quantity">${item.quantity}x</div>
                                    <div class="item-status status-${item.status}">
                                        ${getStatusText(item.status)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="order-actions">
                            <div>
                                <button class="mark-ready-btn" data-order="${doc.id}">
                                    <i class="fas fa-check"></i> Marcar como Listo
                                </button>
                            </div>
                        </div>
                    `;
                    kitchenOrdersContainer.appendChild(orderElement);
                });
                
                // Agregar event listeners para los botones
                document.querySelectorAll('.mark-ready-btn').forEach(button => {
                    if (button) button.addEventListener('click', (e) => {
                        const orderId = e.target.closest('.mark-ready-btn').dataset.order;
                        markOrderAsReady(orderId);
                    });
                });
            })
            .catch(error => {
                console.error("Error cargando pedidos de cocina: ", error);
                kitchenOrdersContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error al cargar pedidos</p>
                    </div>
                `;
            });
    }
    
    // Marcar pedido como listo
    function markOrderAsReady(orderId) {
        db.collection("orders").doc(orderId).update({ 
            status: "ready",
            readyTime: new Date().toISOString()
        })
        .then(() => {
            showNotification('Pedido marcado como listo');
            loadKitchenOrders();
            loadAdminOrders();
        })
        .catch(error => {
            console.error("Error actualizando pedido: ", error);
            showNotification('Error al actualizar el pedido');
        });
    }
    
    // Aplicar filtros
    function setupChefFilters() {
        if (!filterButtons) return;
        
        filterButtons.forEach(button => {
            if (button) button.addEventListener('click', () => {
                filterButtons.forEach(btn => if (btn) btn.classList.remove('active'));
                if (button) button.classList.add('active');
                chefFilter = button.id.replace('filter', '').toLowerCase();
                loadKitchenOrders();
            });
        });
    }
    
    // =====================================
    // Configuración de Event Listeners
    // =====================================
    
    function setupEventListeners() {
        // Asignar referencias DOM
        mainHeader = document.getElementById('mainHeader');
        logoutBtn = document.getElementById('logoutBtn');
        mainContent = document.getElementById('mainContent');
        cartModal = document.getElementById('cartModal');
        closeModal = document.querySelector('.close-modal');
        cartItems = document.getElementById('cartItems');
        cartSubtotal = document.getElementById('cartSubtotal');
        cartTax = document.getElementById('cartTax');
        cartTotal = document.getElementById('cartTotal');
        checkoutBtn = document.getElementById('checkoutBtn');
        sections = document.querySelectorAll('main > section');
        adminBtns = document.querySelectorAll('.admin-btn');
        adminSections = document.querySelectorAll('.admin-section');
        authSection = document.getElementById('authSection');
        googleLoginBtn = document.getElementById('googleLogin');
        appleLoginBtn = document.getElementById('appleLogin');
        taxRateValue = document.getElementById('taxRateValue');
        settingsForm = document.getElementById('settingsForm');
        profileContainer = document.getElementById('profileContainer');
        authForm = document.getElementById('authForm');
        authEmail = document.getElementById('authEmail');
        authPassword = document.getElementById('authPassword');
        authConfirmPassword = document.getElementById('authConfirmPassword');
        authSubmitBtn = document.getElementById('authSubmitBtn');
        signUpLink = document.getElementById('signUpLink');
        forgotPasswordLink = document.getElementById('forgotPasswordLink');
        loginLink = document.getElementById('loginLink');
        authMessage = document.getElementById('authMessage');
        confirmPasswordField = document.getElementById('confirmPasswordField');
        magicNavItems = document.querySelectorAll('.magic-nav-item');
        adminMobileNavItem = document.getElementById('adminMobileNavItem');
        mobileCartIcon = document.getElementById('mobileCartIcon');
        menuToggle = document.getElementById('menuToggle');
        sidebar = document.getElementById('sidebar');
        closeSidebar = document.getElementById('closeSidebar');
        overlay = document.getElementById('overlay');
        categoriesContainer = document.getElementById('categoriesContainer');
        paymentMethod = document.getElementById('paymentMethod');
        posDetails = document.getElementById('posDetails');
        mobileDetails = document.getElementById('mobileDetails');
        usdDetails = document.getElementById('usdDetails');
        eurDetails = document.getElementById('eurDetails');
        cashDetails = document.getElementById('cashDetails');
        mobileReference = document.getElementById('mobileReference');
        waiterSection = document.getElementById('waiterSection');
        chefSection = document.getElementById('chefSection');
        waiterProductsContainer = document.getElementById('waiterProductsContainer');
        kitchenOrdersContainer = document.getElementById('kitchenOrdersContainer');
        filterButtons = document.querySelectorAll('.filter-btn');
        orderNotification = document.getElementById('orderNotification');
        notificationContent = document.getElementById('notificationContent');
        customerPaymentSection = document.getElementById('customerPaymentSection');
        magicNav = document.getElementById('magicNav');
        desktopCartBtn = document.getElementById('desktopCartBtn');
    
        // Toggle del menú lateral
        if (menuToggle) if (menuToggle) menuToggle.addEventListener('click', openSidebar);
        if (closeSidebar) if (closeSidebar) closeSidebar.addEventListener('click', closeSidebarFunc);
        if (overlay) if (overlay) overlay.addEventListener('click', closeSidebarFunc);
        
        // Navegación mágica
        if (magicNavItems) {
            magicNavItems.forEach(item => {
                if (item) item.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (item.id !== 'mobileCartIcon') {
                        loadComponent(item.dataset.section);
                    } else {
                        renderCart();
                        if (cartModal) cartModal.style.display = 'flex';
                    }
                });
            });
        }
        
        // Carrito
        if (mobileCartIcon) {
            if (mobileCartIcon) mobileCartIcon.addEventListener('click', () => {
                renderCart();
                if (cartModal) cartModal.style.display = 'flex';
            });
        }
        
        if (desktopCartBtn) {
            if (desktopCartBtn) desktopCartBtn.addEventListener('click', () => {
                renderCart();
                if (cartModal) cartModal.style.display = 'flex';
            });
        }
        
        if (closeModal) {
            if (closeModal) closeModal.addEventListener('click', () => {
                if (cartModal) cartModal.style.display = 'none';
            });
        }
        
        // Cerrar modal al hacer clic fuera
        if (window) window.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                if (cartModal) cartModal.style.display = 'none';
            }
        });
        
        // Checkout
        if (checkoutBtn) {
            if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
                if (currentUserRole === 'waiter') {
                    processWaiterOrder();
                } else {
                    checkout();
                }
            });
        }
        
        // Panel de administración
        if (adminBtns) {
            adminBtns.forEach(btn => {
                if (btn) btn.addEventListener('click', () => {
                    const tab = btn.dataset.tab;
                    
                    // Actualizar clase activa
                    adminBtns.forEach(b => if (b) b.classList.remove('active'));
                    if (btn) btn.classList.add('active');
                    
                    // Mostrar sección correspondiente
                    adminSections.forEach(sec => {
                        if (sec) sec.classList.remove('active');
                    });
                    
                    document.getElementById(`${tab}Admin`).classList.add('active');
                });
            });
        }
        
        // Formulario de producto
        const productForm = document.getElementById('productForm');
        if (productForm) {
            if (productForm) productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const name = document.getElementById('productName').value;
                const price = parseFloat(document.getElementById('productPrice').value);
                const description = document.getElementById('productDescription').value;
                const category = document.getElementById('productCategory').value;
                
                addProduct(name, price, description, category);
                productForm.reset();
            });
        }
        
        // Formulario de configuración
        if (settingsForm) {
            if (settingsForm) settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                taxRate = parseFloat(document.getElementById('taxRate').value);
                taxRateValue.textContent = taxRate;
                showNotification('Configuración guardada correctamente');
            });
        }
        
        // Enlaces de autenticación
        if (signUpLink) if (signUpLink) signUpLink.addEventListener('click', (e) => {
            e.preventDefault();
            setAuthMode('register');
        });
        
        if (forgotPasswordLink) if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            setAuthMode('forgot');
        });
        
        if (loginLink) if (loginLink) loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            setAuthMode('login');
        });
        
        // Cambio de método de pago
        if (paymentMethod) if (paymentMethod) paymentMethod.addEventListener('change', handlePaymentMethodChange);
        
        // Configurar selección de mesa
        setupTableSelection();
        
        // Configurar filtros de cocina
        setupChefFilters();
    
        // Iniciar sesión con Google
        if (googleLoginBtn) {
            if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider).catch(error => {
                    console.error("Error de autenticación: ", error);
                    showNotification(`Error al iniciar sesión: ${error.message}`);
                });
            });
        }
    
        // Iniciar sesión con Apple
        if (appleLoginBtn) {
            if (appleLoginBtn) appleLoginBtn.addEventListener('click', () => {
                const provider = new firebase.auth.OAuthProvider('apple.com');
                auth.signInWithPopup(provider).catch(error => {
                    console.error("Error de autenticación: ", error);
                    showNotification(`Error al iniciar sesión: ${error.message}`);
                });
            });
        }
    
        // Manejar formulario de autenticación
        if (authForm) {
            if (authForm) authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = authEmail.value;
                const password = authPassword.value;
                const confirmPassword = authConfirmPassword.value;
                
                switch(authMode) {
                    case 'login': loginWithEmail(email, password); break;
                    case 'register': 
                        if (password !== confirmPassword) {
                            showNotification("Las contraseñas no coinciden");
                            return;
                        }
                        signUpWithEmail(email, password); 
                        break;
                    case 'forgot': resetPassword(email); break;
                }
            });
        }
        
        // Cerrar sesión
        if (logoutBtn) {
            if (logoutBtn) logoutBtn.addEventListener('click', () => {
                if (!mainHeader) return;
                
                if (mainHeader) mainHeader.classList.remove('scrolled');
                if (mainHeader) mainHeader.style.transition = 'transform 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045)';
                if (mainHeader) mainHeader.style.transform = 'translateY(-100%)';
                
                setTimeout(() => {
                    auth.signOut().then(() => showNotification('Sesión cerrada correctamente'))
                    .catch(error => showNotification(`Error al cerrar sesión: ${error.message}`));
                    if (mainHeader) mainHeader.style.transition = '';
                }, 400);
            });
        }
    }
    
    // Inicializar la aplicación
    if (document) document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        // Establecer modo de autenticación inicial
        setAuthMode('login');
        
        // Añadir animación al carrito
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            .pulse i {
                animation: pulse 0.5s ease-in-out;
            }
            
            @keyframes float {
                0% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        // Añadir animación al logo
        const brand = document.querySelector('.brand');
        if (brand) {
            setTimeout(() => {
                if (brand) brand.style.animation = "float 3s ease-in-out infinite";
            }, 1000);
        }
    });
});