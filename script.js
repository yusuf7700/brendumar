// ======================================
// UMAR BREND — MAHSULOT KARTOCHKASI
// ======================================

function createProductCard(product) {

    const oldPriceHtml = product.oldPrice
        ? `<div class="old-price">${product.oldPrice.toLocaleString()} so'm</div>`
        : "";

    return `

<div class="product-card fade" data-id="${product.id}">

    <div class="product-image">

        <a href="mahsulot.html?id=${product.id}">
            <img src="${product.image}" alt="${product.name}">
        </a>

        <span class="product-badge">${product.badge}</span>

        <button class="like-btn" aria-label="Sevimlilarga qo'shish">
            <i class="fa-regular fa-heart"></i>
        </button>

    </div>

    <div class="product-info">

        <a href="mahsulot.html?id=${product.id}" class="product-title-link">
            <h3 class="product-title">${product.name}</h3>
        </a>

        <div class="product-price">${product.price.toLocaleString()} so'm</div>

        ${oldPriceHtml}

        <div class="product-stats">
            <span>👁 ${product.views}</span>
            <span>❤️ ${product.likes}</span>
        </div>

        <div class="stock">🟢 Qolgan: ${product.stock} ta</div>

        <a href="mahsulot.html?id=${product.id}" class="product-btn">Batafsil</a>

    </div>

</div>

`;

}
// ======================================
// UMAR BREND — SEVIMLILAR
// ======================================

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function isFavorite(id) {
    return favorites.includes(Number(id));
}

function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateFavCount();
}

function updateFavCount() {
    const badge = document.getElementById("favCount");
    if (!badge) return;
    badge.textContent = favorites.length;
    badge.style.display = favorites.length ? "flex" : "none";
}

// Sahifadagi barcha like tugmalarining holatini favorites bilan sinxronlash
function syncLikeButtons(scope) {

    const root = scope || document;

    root.querySelectorAll("[data-id]").forEach(card => {

        const id = Number(card.dataset.id);
        const button = card.querySelector(".like-btn");
        if (!button) return;

        const icon = button.querySelector("i");

        if (isFavorite(id)) {
            icon.classList.remove("fa-regular");
            icon.classList.add("fa-solid");
            button.classList.add("liked");
        } else {
            icon.classList.remove("fa-solid");
            icon.classList.add("fa-regular");
            button.classList.remove("liked");
        }

    });

}

// Bosh sahifa / boshqa sahifalar chaqiradigan hook
function initFavorites(scope) {
    syncLikeButtons(scope);
    updateFavCount();
}

// Har qanday like tugmasini bosishni bitta joyda ushlaymiz (delegatsiya)
document.addEventListener("click", (e) => {

    const button = e.target.closest(".like-btn");
    if (!button) return;

    const card = button.closest("[data-id]");
    if (!card) return;

    const id = Number(card.dataset.id);
    const icon = button.querySelector("i");

    if (isFavorite(id)) {

        favorites = favorites.filter(favId => favId !== id);
        button.classList.remove("liked");
        icon.classList.remove("fa-solid");
        icon.classList.add("fa-regular");

    } else {

        favorites.push(id);
        button.classList.add("liked");
        icon.classList.remove("fa-regular");
        icon.classList.add("fa-solid");

    }

    saveFavorites();

    // Agar Sevimlilar sahifasidamiz va mahsulot olib tashlangan bo'lsa — kartani yo'qotamiz
    if (document.body.dataset.page === "sevimlilar" && !isFavorite(id)) {
        card.remove();
        if (typeof renderEmptyFavState === "function") renderEmptyFavState();
    }

});

window.addEventListener("load", () => initFavorites());
// ======================================
// UMAR BREND — SAVATCHA
// ======================================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

const CONTACT = {
    telegram: "https://t.me/umarbrend",
    instagram: "https://instagram.com/umarbrend",
    phone: "+998901234567"
};

// --------------------------------------
// DOM'GA SAVATCHA VA ALOQA OYNASINI QO'SHISH
// --------------------------------------

function injectCartMarkup() {

    if (document.getElementById("cartDrawer")) return;

    const drawer = document.createElement("div");
    drawer.id = "cartDrawer";
    drawer.className = "cart-drawer";

    drawer.innerHTML = `
        <div class="cart-overlay" id="cartOverlay"></div>
        <div class="cart-panel">
            <div class="cart-head">
                <h3>Savatcha</h3>
                <button id="closeCart" aria-label="Yopish"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="cart-items" id="cartItems"></div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Jami</span>
                    <strong id="cartTotal">0 so'm</strong>
                </div>
                <button class="btn btn-gold cart-order-btn" id="cartOrderBtn">Buyurtma berish</button>
            </div>
        </div>
    `;

    document.body.appendChild(drawer);

    const modal = document.createElement("div");
    modal.id = "contactModal";
    modal.className = "contact-modal";

    modal.innerHTML = `
        <div class="contact-overlay" id="contactOverlay"></div>
        <div class="contact-box">
            <button id="closeContact" aria-label="Yopish"><i class="fa-solid fa-xmark"></i></button>
            <h3>Buyurtma berish uchun bog'laning</h3>
            <p>Quyidagi usullardan birini tanlang</p>
            <div class="contact-links">
                <a href="${CONTACT.telegram}" target="_blank" class="contact-link telegram">
                    <i class="fa-brands fa-telegram"></i> Telegram
                </a>
                <a href="${CONTACT.instagram}" target="_blank" class="contact-link instagram">
                    <i class="fa-brands fa-instagram"></i> Instagram
                </a>
                <a href="tel:${CONTACT.phone}" class="contact-link phone">
                    <i class="fa-solid fa-phone"></i> ${CONTACT.phone}
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeCart").addEventListener("click", closeCart);
    document.getElementById("cartOverlay").addEventListener("click", closeCart);
    document.getElementById("closeContact").addEventListener("click", closeContactModal);
    document.getElementById("contactOverlay").addEventListener("click", closeContactModal);
    document.getElementById("cartOrderBtn").addEventListener("click", () => {
        if (!cart.length) return;
        openContactModal();
    });

}


// --------------------------------------
// OCHISH / YOPISH
// --------------------------------------

function openCart() {
    injectCartMarkup();
    renderCart();
    document.getElementById("cartDrawer").classList.add("active");
}

function closeCart() {
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.remove("active");
}

function openContactModal() {
    injectCartMarkup();
    document.getElementById("contactModal").classList.add("active");
}

function closeContactModal() {
    const modal = document.getElementById("contactModal");
    if (modal) modal.classList.remove("active");
}


// --------------------------------------
// SAVATCHA MANTIG'I
// --------------------------------------

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const badge = document.getElementById("cartCount");
    if (!badge) return;
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = total;
    badge.style.display = total ? "flex" : "none";
}

function addToCart(id, size, qty) {

    id = Number(id);
    qty = Number(qty) || 1;

    const existing = cart.find(item => item.id === id && item.size === size);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id, size, qty });
    }

    saveCart();
    openCart();

}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function changeQty(index, delta) {

    const item = cart[index];
    if (!item) return;

    item.qty += delta;

    if (item.qty < 1) {
        removeFromCart(index);
        return;
    }

    saveCart();
    renderCart();

}

function renderCart() {

    const container = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");
    if (!container || !totalEl) return;

    if (!cart.length) {
        container.innerHTML = `<p class="cart-empty">Savatcha bo'sh. Yoqqan mahsulotni tanlang 🛍</p>`;
        totalEl.textContent = "0 so'm";
        return;
    }

    let total = 0;

    container.innerHTML = cart.map((item, index) => {

        const product = getProductById(item.id);
        if (!product) return "";

        const lineTotal = product.price * item.qty;
        total += lineTotal;

        return `
            <div class="cart-item">
                <img src="${product.image}" alt="${product.name}">
                <div class="cart-item-info">
                    <h4>${product.name}</h4>
                    <span class="cart-item-size">${item.size} razmer</span>
                    <div class="cart-item-price">${lineTotal.toLocaleString()} so'm</div>
                    <div class="qty-control">
                        <button onclick="changeQty(${index},-1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${index},1)">+</button>
                    </div>
                </div>
                <button class="cart-remove" onclick="removeFromCart(${index})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;

    }).join("");

    totalEl.textContent = total.toLocaleString() + " so'm";

}


// --------------------------------------
// ISHGA TUSHIRISH
// --------------------------------------

window.addEventListener("load", () => {

    injectCartMarkup();
    updateCartCount();

    const cartBtn = document.getElementById("cartBtn");
    if (cartBtn) cartBtn.addEventListener("click", openCart);

});
// ======================================
// UMAR BREND — MAHSULOTLAR MA'LUMOTLAR BAZASI
// (localStorage orqali admin panel bilan bog'langan)
// ======================================

const DEFAULT_PRODUCTS = [

    {
        id: 1,
        name: "Nike Air Max",
        price: 850000,
        oldPrice: 950000,
        stock: 6,
        views: 284,
        likes: 74,
        sold: 18,
        badge: "Yangi",
        category: "erkak",
        sizes: [39, 40, 41, 42, 43, 44],
        image: "assets/products/shoe1.jpg",
        images: [
            "assets/products/shoe1.jpg",
            "assets/products/shoe1.jpg",
            "assets/products/shoe1.jpg"
        ],
        description: "Nike Air Max — kundalik kiyish uchun qulay va yengil krossovka. Yumshoq taglik, nafas oluvchi mato va zamonaviy dizayn premium darajadagi qulaylikni ta'minlaydi."
    },

    {
        id: 2,
        name: "Adidas Campus",
        price: 790000,
        oldPrice: 890000,
        stock: 12,
        views: 198,
        likes: 51,
        sold: 9,
        badge: "Chegirma",
        category: "erkak",
        sizes: [40, 41, 42, 43, 44, 45],
        image: "assets/products/shoe2.jpg",
        images: [
            "assets/products/shoe2.jpg",
            "assets/products/shoe2.jpg",
            "assets/products/shoe2.jpg"
        ],
        description: "Adidas Campus — klassik uslub va zamonaviy qulaylikni birlashtirgan model. Har kungi look uchun ideal tanlov."
    },

    {
        id: 3,
        name: "New Balance 530",
        price: 930000,
        oldPrice: 0,
        stock: 4,
        views: 341,
        likes: 103,
        sold: 27,
        badge: "Top",
        category: "ayol",
        sizes: [36, 37, 38, 39, 40],
        image: "assets/products/shoe3.jpg",
        images: [
            "assets/products/shoe3.jpg",
            "assets/products/shoe3.jpg",
            "assets/products/shoe3.jpg"
        ],
        description: "New Balance 530 — retro dizayn va yuqori sifatli materiallar bilan tayyorlangan, xaridorlar orasida eng ko'p tanlanayotgan model."
    },

    {
        id: 4,
        name: "Puma Smash",
        price: 670000,
        oldPrice: 760000,
        stock: 9,
        views: 174,
        likes: 39,
        sold: 6,
        badge: "Yangi",
        category: "ayol",
        sizes: [36, 37, 38, 39, 40, 41],
        image: "assets/products/shoe4.jpg",
        images: [
            "assets/products/shoe4.jpg",
            "assets/products/shoe4.jpg",
            "assets/products/shoe4.jpg"
        ],
        description: "Puma Smash — minimalistik dizayn va qulay taglik bilan har kuni kiyish uchun mos krossovka."
    }

];


// ==============================
// MAHSULOTLARNI YUKLASH / SAQLASH
// ==============================

function loadProducts() {

    const stored = JSON.parse(localStorage.getItem("ub_products"));

    if (stored && Array.isArray(stored) && stored.length) {
        return stored;
    }

    localStorage.setItem("ub_products", JSON.stringify(DEFAULT_PRODUCTS));
    return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));

}

let products = loadProducts();

function saveProducts() {
    localStorage.setItem("ub_products", JSON.stringify(products));
}

function getProductById(id) {
    return products.find(p => p.id === Number(id));
}


// ==============================
// SOTUVLAR JURNALI (Admin "Sotildi" uchun)
// ==============================

function getSales() {
    return JSON.parse(localStorage.getItem("ub_sales")) || [];
}

function saveSales(sales) {
    localStorage.setItem("ub_sales", JSON.stringify(sales));
}

function addSale(productId, qty, soldPrice) {

    const sales = getSales();

    sales.push({
        productId: Number(productId),
        qty: Number(qty),
        soldPrice: Number(soldPrice),
        date: new Date().toISOString()
    });

    saveSales(sales);

}


// ==============================
// KARTOCHKALARNI CHIQARISH
// ==============================

function renderProducts(containerId, list) {

    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = "";

    list.forEach(product => {
        container.innerHTML += createProductCard(product);
    });

    if (window.initFavorites) initFavorites(container);
}


// ==============================
// BO'LIMLARNI CHIQARISH (faqat mijoz sahifalarida mavjud bo'lsa)
// ==============================

if (document.getElementById("popularProducts") ||
    document.getElementById("newProducts") ||
    document.getElementById("favoriteProducts")) {

    const popularList = [...products]
        .sort((a, b) => b.views - a.views)
        .slice(0, 4);

    const newList = [...products]
        .sort((a, b) => b.id - a.id)
        .slice(0, 4);

    const favoriteList = [...products]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 4);

    renderProducts("popularProducts", popularList);
    renderProducts("newProducts", newList);
    renderProducts("favoriteProducts", favoriteList);

}
// =====================================
// SEARCH MODAL
// =====================================

const searchBtn = document.getElementById("searchBtn");
const searchModal = document.getElementById("searchModal");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");

if (searchBtn) {

    searchBtn.addEventListener("click", () => {
        searchModal.classList.add("active");
        setTimeout(() => searchInput && searchInput.focus(), 100);
    });

}

if (closeSearch) {

    closeSearch.addEventListener("click", () => {
        searchModal.classList.remove("active");
    });

}

window.addEventListener("click", (e) => {

    if (e.target === searchModal) {
        searchModal.classList.remove("active");
    }

});

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
        if (searchModal) searchModal.classList.remove("active");
        const cartDrawer = document.getElementById("cartDrawer");
        if (cartDrawer) cartDrawer.classList.remove("active");
        const contactModal = document.getElementById("contactModal");
        if (contactModal) contactModal.classList.remove("active");
    }

});

// Qidiruv — mahsulot nomi bo'yicha filtrlash (bosh sahifada mavjud bo'lsa)
if (searchInput) {

    searchInput.addEventListener("input", () => {

        const term = searchInput.value.trim().toLowerCase();
        if (!term || typeof products === "undefined") return;

        const found = products.filter(p => p.name.toLowerCase().includes(term));

        if (found.length && typeof renderProducts === "function") {
            renderProducts("popularProducts", found);
        }

    });

}


// =====================================
// HEADER — SCROLLDA KICHRAYISH
// =====================================

const header = document.querySelector(".header");

if (header) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }

    });

}
// ======================================
// UMAR BREND — THEME (Light / Dark)
// ======================================

const themeButton = document.getElementById("themeBtn");
const body = document.body;

if (themeButton) {

    // Oldingi tanlovni yuklash
    if (localStorage.getItem("theme") === "dark") {

        body.classList.add("dark");

        themeButton.innerHTML = '<i class="fa-solid fa-sun"></i>';

    }

    // Theme almashtirish
    themeButton.addEventListener("click", () => {

        body.classList.toggle("dark");

        if (body.classList.contains("dark")) {

            localStorage.setItem("theme", "dark");

            themeButton.innerHTML = '<i class="fa-solid fa-sun"></i>';

        } else {

            localStorage.setItem("theme", "light");

            themeButton.innerHTML = '<i class="fa-solid fa-moon"></i>';

        }

    });

}