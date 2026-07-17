// ======================================
// UMAR BREND — MAHSULOT KARTOCHKASI
// ======================================

function createProductCard(product) {

    const oldPriceHtml = product.oldPrice
        ? `<div class="old-price">${product.oldPrice.toLocaleString()} so'm</div>`
        : "";

    const colorsHtml = (product.colors && product.colors.length)
        ? `<div class="card-color-dots">${product.colors.map(c => `<span style="background:${c.hex || "#ccc"}" title="${c.name}"></span>`).join("")}</div>`
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

        ${colorsHtml}

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

let CONTACT = {
    telegram: "https://t.me/umarbrend",
    instagram: "https://instagram.com/umarbrend",
    phone: "+998901234567"
};

// Supabase'dan site_settings yuklangach (products.js) shu funksiya chaqiriladi
function setSiteContact(data) {

    if (data.telegram) CONTACT.telegram = data.telegram;
    if (data.instagram) CONTACT.instagram = data.instagram;
    if (data.phone) CONTACT.phone = data.phone;

    applyContactLinks();

    // Footer havolalarini ham yangilaymiz
    const fTg = document.getElementById("footerTelegramLink");
    const fIg = document.getElementById("footerInstagramLink");
    const fPh = document.getElementById("footerPhoneLink");
    const fPhText = document.getElementById("footerPhoneText");

    if (fTg && data.telegram) fTg.href = data.telegram;
    if (fIg && data.instagram) fIg.href = data.instagram;
    if (fPh && data.phone) fPh.href = "tel:" + data.phone;
    if (fPhText && data.phone) fPhText.textContent = data.phone;

}

function applyContactLinks() {

    const tg = document.getElementById("contactTelegramLink");
    const ig = document.getElementById("contactInstagramLink");
    const ph = document.getElementById("contactPhoneLink");

    if (tg) tg.href = CONTACT.telegram;
    if (ig) ig.href = CONTACT.instagram;

    if (ph) {
        ph.href = "tel:" + CONTACT.phone;
        ph.querySelector("span").textContent = CONTACT.phone;
    }

}

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
                <a href="${CONTACT.telegram}" target="_blank" class="contact-link telegram" id="contactTelegramLink">
                    <i class="fa-brands fa-telegram"></i> Telegram
                </a>
                <a href="${CONTACT.instagram}" target="_blank" class="contact-link instagram" id="contactInstagramLink">
                    <i class="fa-brands fa-instagram"></i> Instagram
                </a>
                <a href="tel:${CONTACT.phone}" class="contact-link phone" id="contactPhoneLink">
                    <i class="fa-solid fa-phone"></i> <span>${CONTACT.phone}</span>
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

function addToCart(id, size, qty, color) {

    id = Number(id);
    qty = Number(qty) || 1;
    color = color || "";

    const existing = cart.find(item => item.id === id && item.size === size && (item.color || "") === color);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id, size, qty, color });
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
                    <span class="cart-item-size">${item.size} razmer${item.color ? " · " + item.color : ""}</span>
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
// UMAR BREND — MAHSULOTLAR (SUPABASE)
// ======================================

let products = [];


// ==============================
// QATORNI (row) JS OBYEKTIGA O'GIRISH
// ==============================

function normalizeProduct(row) {

    return {
        id: row.id,
        name: row.name,
        price: Number(row.price),
        oldPrice: Number(row.old_price) || 0,
        stock: Number(row.stock),
        views: Number(row.views) || 0,
        likes: Number(row.likes) || 0,
        sold: Number(row.sold) || 0,
        badge: row.badge,
        category: row.category,
        sizes: row.sizes || [],
        image: row.image,
        images: row.images || [],
        description: row.description || "",
        colors: row.colors || []
    };

}


// ==============================
// MAHSULOTLARNI YUKLASH
// ==============================

async function loadProducts() {

    const { data, error } = await sb
        .from("products")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("Mahsulotlarni yuklashda xatolik:", error);
        return [];
    }

    return data.map(normalizeProduct);

}

async function refreshProducts() {
    products = await loadProducts();
    return products;
}

function getProductById(id) {
    return products.find(p => p.id === Number(id));
}


// ==============================
// MIJOZ SHARHLARI (Reviews)
// ==============================

async function getReviews(productId) {

    const { data, error } = await sb
        .from("reviews")
        .select("*")
        .eq("product_id", Number(productId))
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Sharhlarni yuklashda xatolik:", error);
        return [];
    }

    return data;

}

async function addReview(productId, name, rating, comment) {

    const { error } = await sb.from("reviews").insert({
        product_id: Number(productId),
        name,
        rating: Number(rating),
        comment
    });

    if (error) {
        console.error("Sharh qo'shishda xatolik:", error);
        return false;
    }

    return true;

}

async function getAllReviews() {

    const { data, error } = await sb
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Sharhlarni yuklashda xatolik:", error);
        return [];
    }

    return data;

}

async function deleteReview(id) {
    const { error } = await sb.from("reviews").delete().eq("id", id);
    return !error;
}


// ==============================
// SOTUVLAR JURNALI (Admin "Sotildi" uchun)
// ==============================

async function getSales() {

    const { data, error } = await sb
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Sotuvlarni yuklashda xatolik:", error);
        return [];
    }

    return data.map(s => ({
        id: s.id,
        productId: s.product_id,
        qty: s.qty,
        soldPrice: Number(s.sold_price),
        color: s.color || "",
        date: s.created_at
    }));

}

async function addSale(productId, qty, soldPrice, color) {

    const { error } = await sb.from("sales").insert({
        product_id: Number(productId),
        qty: Number(qty),
        sold_price: Number(soldPrice),
        color: color || null
    });

    if (error) console.error("Sotuvni saqlashda xatolik:", error);

}


// ==============================
// KO'RISHLAR SONINI OSHIRISH
// ==============================

async function incrementProductViews(product) {

    product.views = (product.views || 0) + 1;

    const { error } = await sb.rpc("increment_view", { p_id: product.id });

    if (error) console.error("Ko'rishlar sonini yangilashda xatolik:", error);

}


// ==============================
// KARTOCHKALARNI CHIQARISH
// ==============================

function renderProducts(containerId, list) {

    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = "";

    if (!list.length) {
        container.innerHTML = `<p style="color:var(--gray);grid-column:1/-1;text-align:center;">Hozircha mahsulot yo'q</p>`;
        return;
    }

    list.forEach(product => {
        container.innerHTML += createProductCard(product);
    });

    if (window.initFavorites) initFavorites(container);

}


// ==============================
// MA'LUMOTLARNI YUKLASH VA TAYYORLASH
// ==============================

async function initProductsData() {

    await refreshProducts();

    if (document.getElementById("allProducts") || document.getElementById("favoriteProducts")) {

        const allList = [...products].sort((a, b) => b.id - a.id).slice(0, 8);
        const favoriteList = [...products].sort((a, b) => b.likes - a.likes).slice(0, 4);

        renderProducts("allProducts", allList);
        renderProducts("favoriteProducts", favoriteList);

    }

    document.dispatchEvent(new CustomEvent("productsReady"));

}

initProductsData();


// ==============================
// SAYT SOZLAMALARI (banner, manzil, video)
// ==============================

async function loadSiteSettings() {

    const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).single();

    if (error || !data) return;

    const heroImg = document.getElementById("heroBannerImg");
    const heroPlaceholder = document.getElementById("heroPlaceholder");

    if (heroImg && data.banner_image) {
        heroImg.src = data.banner_image;
        heroImg.style.display = "block";
        if (heroPlaceholder) heroPlaceholder.style.display = "none";
    }

    const addrBox = document.getElementById("footerAddress");
    const addrText = document.getElementById("footerAddressText");

    if (addrBox && addrText && data.address) {
        addrText.textContent = data.address;
        addrBox.style.display = "flex";
    }

    const videoLink = document.getElementById("footerVideoLink");

    if (videoLink && data.location_video_url) {
        videoLink.href = data.location_video_url;
        videoLink.style.display = "inline-flex";
    }

    if (window.setSiteContact) {
        setSiteContact({
            telegram: data.telegram,
            instagram: data.instagram,
            phone: data.phone
        });
    }

}

loadSiteSettings();
// =====================================
// SEARCH MODAL
// =====================================

const searchBtn = document.getElementById("searchBtn");
const searchModal = document.getElementById("searchModal");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

if (searchBtn) {

    searchBtn.addEventListener("click", () => {
        searchModal.classList.add("active");
        setTimeout(() => searchInput && searchInput.focus(), 100);
    });

}

function closeSearchModal() {
    if (!searchModal) return;
    searchModal.classList.remove("active");
    if (searchInput) searchInput.value = "";
    if (searchResults) searchResults.innerHTML = "";
}

if (closeSearch) {
    closeSearch.addEventListener("click", closeSearchModal);
}

window.addEventListener("click", (e) => {

    if (e.target === searchModal) {
        closeSearchModal();
    }

});

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
        closeSearchModal();
        const cartDrawer = document.getElementById("cartDrawer");
        if (cartDrawer) cartDrawer.classList.remove("active");
        const contactModal = document.getElementById("contactModal");
        if (contactModal) contactModal.classList.remove("active");
        const navbar = document.querySelector(".navbar");
        if (navbar) navbar.classList.remove("mobile-active");
    }

});

// Qidiruv — natijalarni modal ichida ro'yxat qilib ko'rsatadi
if (searchInput && searchResults) {

    searchInput.addEventListener("input", () => {

        const term = searchInput.value.trim().toLowerCase();

        if (!term) {
            searchResults.innerHTML = "";
            return;
        }

        if (typeof products === "undefined" || !products.length) {
            searchResults.innerHTML = `<p class="search-empty">Mahsulotlar hali yuklanmoqda...</p>`;
            return;
        }

        const found = products.filter(p => p.name.toLowerCase().includes(term)).slice(0, 6);

        searchResults.innerHTML = found.length
            ? found.map(p => `
                <a href="mahsulot.html?id=${p.id}" class="search-result-item">
                    <img src="${p.image}" alt="${p.name}">
                    <div>
                        <h4>${p.name}</h4>
                        <span>${p.price.toLocaleString()} so'm</span>
                    </div>
                </a>
            `).join("")
            : `<p class="search-empty">Hech narsa topilmadi</p>`;

    });

}


// =====================================
// MOBIL MENYU (HAMBURGER)
// =====================================

const menuBtn = document.getElementById("menuBtn");
const navbar = document.querySelector(".navbar");

if (menuBtn && navbar) {

    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navbar.classList.toggle("mobile-active");
    });

    navbar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => navbar.classList.remove("mobile-active"));
    });

    document.addEventListener("click", (e) => {
        if (!navbar.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
            navbar.classList.remove("mobile-active");
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
