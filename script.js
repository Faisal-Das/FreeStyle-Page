// API base URL (constructed after key input)
let API = '';
let cart = JSON.parse(localStorage.getItem('cart')) || [];


// Prompt for API key
function promptForApiKey() {
    document.getElementById('api-key-prompt').classList.remove('hidden');
    document.getElementById('api-key-input').value = '';
    document.getElementById('api-key-error').classList.add('hidden');
    document.getElementById('api-key-input').focus();
}

// Initialize API key
function initializeApiKey() {
    const storedKey = localStorage.getItem('mockapi_project_id');
    if (storedKey) {
        API = `https://${storedKey}.mockapi.io/ordersystem/`;
        showPage('products');
    } else {
        promptForApiKey();
    }
}

// Handle API key submission
document.getElementById('api-key-submit').addEventListener('click', () => {
    const input = document.getElementById('api-key-input').value.trim();
    API = `https://${input}.mockapi.io/ordersystem/`;
    localStorage.setItem('mockapi_project_id', input);
    document.getElementById('api-key-prompt').classList.add('hidden');
    showPage('products');

});

// Fetch products from MockAPI
const getProducts = async () => {
    if (!API) return [];
    const PRODUCT_API = `${API}Products`;
    try {
        const response = await fetch(PRODUCT_API);
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        showError();
        return [];
    }
};

// Show specific page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById('loading-message').classList.add('hidden');
    document.getElementById('error-message').classList.add('hidden');
    document.getElementById(`${pageId}-page`).classList.remove('hidden');
    if (pageId === 'products') loadProducts();
    if (pageId === 'cart') loadCart();
    if (pageId === 'orders') loadOrders();
}

// Show error message
function showError() {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById('loading-message').classList.add('hidden');
    document.getElementById('error-message').classList.remove('hidden');
}

// Fetch and display products
async function loadProducts() {
    document.getElementById('loading-message').classList.remove('hidden');
    try {
        const products = await getProducts();
        document.getElementById('loading-message').classList.add('hidden');
        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';
        if (products.length === 0) {
            productsList.innerHTML = '<p class="text-gray-600">No products found.</p>';
            return;
        }
        products.forEach(product => {
            const price = parseFloat(product.price);
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded shadow';
            card.innerHTML = `
        <img src="${product.productImage}" alt="${product.name}" class="w-full h-48 object-cover rounded">
        <h3 class="text-xl font-bold mt-2">${product.name}</h3>
        <p class="text-gray-600">${product.description}</p>
        <p class="text-lg font-semibold mt-2">$${price.toFixed(2)}</p>
        <button onclick="addToCart('${product.id}', '${product.name}', ${price})" 
                class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add to Cart
        </button>
      `;
            productsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showError();
    }
}

// Add product to cart
function addToCart(id, name, price) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${name} added to cart!`);
}

// Load and display cart
function loadCart() {
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    cartList.innerHTML = '';
    if (cart.length === 0) {
        cartList.innerHTML = '<p class="text-gray-600">Your cart is empty.</p>';
        cartTotal.innerHTML = '';
        return;
    }
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const row = document.createElement('div');
        row.className = 'flex justify-between items-center bg-white p-4 rounded shadow';
        row.innerHTML = `
      <div>
        <h3 class="text-lg font-bold">${item.name}</h3>
        <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
      </div>
      <div class="flex space-x-2">
        <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})" 
                class="bg-gray-200 px-2 py-1 rounded">+</button>
        <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})" 
                class="bg-gray-200 px-2 py-1 rounded">-</button>
        <button onclick="removeFromCart('${item.id}')" 
                class="bg-red-600 text-white px-2 py-1 rounded">Remove</button>
      </div>
    `;
        cartList.appendChild(row);
    });
    cartTotal.innerHTML = `Total: $${total.toFixed(2)}`;
}

// Update item quantity in cart
function updateQuantity(id, quantity) {
    if (quantity < 1) {
        removeFromCart(id);
        return;
    }
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }
}

// Remove item from cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
}

// Checkout (submit order to MockAPI)
document.getElementById('checkout-btn').addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
        items: cart,
        total,
        date: new Date().toISOString()
    };
    try {
        const response = await fetch(`${API}order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!response.ok) throw new Error('Failed to place order');
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Order placed successfully!');
        loadCart();
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order.');
    }
});

// Load and display order history
async function loadOrders() {
    if (!API) return;
    try {
        const response = await fetch(`${API}order`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const orders = await response.json();
        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = '';
        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="text-gray-600">No orders found.</p>';
            return;
        }
        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'bg-white p-4 rounded shadow';
            orderDiv.innerHTML = `
        <h3 class="text-lg font-bold">Order #${order.id} - ${new Date(order.date).toLocaleDateString()}</h3>
     
        <p class="text-lg font-semibold mt-2">Total: $${order.total}</p>
      `;
            ordersList.appendChild(orderDiv);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        showError();
    }
}