// ======================================
// UMAR BREND — ADMIN PANEL
// ======================================

const ADMIN_PASSWORD = "umar2026"; // <-- shu yerda parolni o'zgartiring

const loginScreen = document.getElementById("adminLogin");
const adminApp = document.getElementById("adminApp");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");


// ==============================
// LOGIN / LOGOUT
// ==============================

function checkAuth() {

    if (sessionStorage.getItem("ub_admin_auth") === "true") {
        loginScreen.style.display = "none";
        adminApp.style.display = "flex";
        refreshAll();
    } else {
        loginScreen.style.display = "flex";
        adminApp.style.display = "none";
    }

}

loginForm.addEventListener("submit", (e) => {

    e.preventDefault();

    const value = document.getElementById("loginPassword").value;

    if (value === ADMIN_PASSWORD) {
        sessionStorage.setItem("ub_admin_auth", "true");
        loginError.classList.remove("show");
        checkAuth();
    } else {
        loginError.classList.add("show");
    }

});

document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("ub_admin_auth");
    checkAuth();
});


// ==============================
// TABLAR
// ==============================

document.querySelectorAll(".admin-nav-btn[data-tab]").forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".admin-nav-btn[data-tab]").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById("tab-" + btn.dataset.tab).classList.add("active");

        if (btn.dataset.tab === "stats") renderStats();
        if (btn.dataset.tab === "products") renderProductTable();
        if (btn.dataset.tab === "dashboard") renderDashboard();

    });

});


// ==============================
// YORDAMCHI: SANA FILTRLARI
// ==============================

function isSameDay(dateStr, ref) {
    const d = new Date(dateStr);
    return d.toDateString() === ref.toDateString();
}

function isSameWeek(dateStr, ref) {
    const d = new Date(dateStr);
    const start = new Date(ref);
    start.setDate(ref.getDate() - ref.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start && d <= ref;
}

function isSameMonth(dateStr, ref) {
    const d = new Date(dateStr);
    return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}


// ==============================
// DASHBOARD
// ==============================

function renderDashboard() {

    products = loadProducts();

    const sales = getSales();
    const today = new Date();

    const todaySales = sales.filter(s => isSameDay(s.date, today));

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.qty * s.soldPrice, 0);
    const todaySoldCount = todaySales.reduce((sum, s) => sum + s.qty, 0);

    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalViews = products.reduce((sum, p) => sum + p.views, 0);

    const topLiked = [...products].sort((a, b) => b.likes - a.likes)[0];

    const lowStock = products.filter(p => p.stock <= 5);

    document.getElementById("statTodayRevenue").textContent = todayRevenue.toLocaleString() + " so'm";
    document.getElementById("statTodaySold").textContent = todaySoldCount + " ta";
    document.getElementById("statStock").textContent = totalStock + " ta";
    document.getElementById("statViews").textContent = totalViews;
    document.getElementById("statTopLiked").textContent = topLiked ? topLiked.name : "—";
    document.getElementById("statLowStock").textContent = lowStock.length + " ta";

    const lowStockList = document.getElementById("lowStockList");

    lowStockList.innerHTML = lowStock.length
        ? lowStock.map(p => `
            <div class="low-stock-item">
                <span>${p.name}</span>
                <span class="stock-low">${p.stock} ta qoldi</span>
            </div>
        `).join("")
        : `<p class="empty-note">Hozircha kam qolgan mahsulot yo'q 👍</p>`;

}


// ==============================
// MAHSULOTLAR JADVALI
// ==============================

function renderProductTable() {

    products = loadProducts();

    const table = document.getElementById("productTable");

    let html = `
        <div class="product-row head">
            <span></span>
            <span>Nomi</span>
            <span>Narxi</span>
            <span class="col-category">Kategoriya</span>
            <span>Qolgan</span>
            <span></span>
        </div>
    `;

    html += products.map(p => `
        <div class="product-row">
            <img src="${p.image}" alt="${p.name}">
            <span>${p.name}</span>
            <span>${p.price.toLocaleString()} so'm</span>
            <span class="col-category">${p.category === "erkak" ? "Erkaklar" : "Ayollar"}</span>
            <span class="${p.stock <= 5 ? "stock-low" : ""}">${p.stock} ta</span>
            <div class="row-actions">
                <button class="edit-btn" onclick="openProductForm(${p.id})" title="Tahrirlash">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="sell-btn" onclick="openSellModal(${p.id})" title="Sotildi">
                    <i class="fa-solid fa-money-bill-wave"></i>
                </button>
                <button class="delete-btn" onclick="deleteProduct(${p.id})" title="O'chirish">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join("");

    table.innerHTML = html;

}

function deleteProduct(id) {

    if (!confirm("Ushbu mahsulotni o'chirmoqchimisiz?")) return;

    products = products.filter(p => p.id !== id);
    saveProducts();

    renderProductTable();
    renderDashboard();

}


// ==============================
// MAHSULOT FORMASI (Qo'shish / Tahrirlash)
// ==============================

const productModal = document.getElementById("productModal");
const productForm = document.getElementById("productForm");

let currentMainImage = "";
let currentExtraImages = [];

document.getElementById("addProductBtn").addEventListener("click", () => openProductForm());
document.getElementById("productModalOverlay").addEventListener("click", closeProductForm);
document.getElementById("closeProductModal").addEventListener("click", closeProductForm);

function openProductForm(id) {

    const product = id ? getProductById(id) : null;

    document.getElementById("productModalTitle").textContent =
        product ? "Mahsulotni tahrirlash" : "Mahsulot qo'shish";

    document.getElementById("pf_id").value = product ? product.id : "";
    document.getElementById("pf_name").value = product ? product.name : "";
    document.getElementById("pf_price").value = product ? product.price : "";
    document.getElementById("pf_oldPrice").value = product ? (product.oldPrice || "") : "";
    document.getElementById("pf_category").value = product ? product.category : "erkak";
    document.getElementById("pf_badge").value = product ? product.badge : "Yangi";
    document.getElementById("pf_sizes").value = product ? product.sizes.join(",") : "";
    document.getElementById("pf_stock").value = product ? product.stock : "";
    document.getElementById("pf_description").value = product ? product.description : "";

    currentMainImage = product ? product.image : "";
    currentExtraImages = product ? [...product.images] : [];

    renderImagePreviews();

    productModal.classList.add("active");

}

function closeProductForm() {
    productModal.classList.remove("active");
}

function renderImagePreviews() {

    const mainPrev = document.getElementById("pf_mainImagePreview");
    const extraPrev = document.getElementById("pf_extraImagesPreview");

    mainPrev.innerHTML = currentMainImage ? `<img src="${currentMainImage}">` : "";
    extraPrev.innerHTML = currentExtraImages.map(img => `<img src="${img}">`).join("");

}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

document.getElementById("pf_mainImage").addEventListener("change", async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    currentMainImage = await fileToBase64(file);
    renderImagePreviews();

});

document.getElementById("pf_extraImages").addEventListener("change", async (e) => {

    const files = Array.from(e.target.files);
    if (!files.length) return;

    currentExtraImages = await Promise.all(files.map(fileToBase64));
    renderImagePreviews();

});

productForm.addEventListener("submit", (e) => {

    e.preventDefault();

    const id = document.getElementById("pf_id").value;

    const sizes = document.getElementById("pf_sizes").value
        .split(",")
        .map(s => Number(s.trim()))
        .filter(Boolean);

    const mainImage = currentMainImage || "assets/products/placeholder.jpg";
    const images = currentExtraImages.length ? currentExtraImages : [mainImage, mainImage, mainImage];

    const data = {
        name: document.getElementById("pf_name").value.trim(),
        price: Number(document.getElementById("pf_price").value),
        oldPrice: Number(document.getElementById("pf_oldPrice").value) || 0,
        category: document.getElementById("pf_category").value,
        badge: document.getElementById("pf_badge").value,
        sizes,
        stock: Number(document.getElementById("pf_stock").value),
        description: document.getElementById("pf_description").value.trim(),
        image: mainImage,
        images
    };

    if (id) {

        const product = getProductById(id);
        Object.assign(product, data);

    } else {

        const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;

        products.push({
            id: newId,
            views: 0,
            likes: 0,
            sold: 0,
            ...data
        });

    }

    saveProducts();
    closeProductForm();
    renderProductTable();
    renderDashboard();

});


// ==============================
// SOTILDI MODAL
// ==============================

const sellModal = document.getElementById("sellModal");
const sellForm = document.getElementById("sellForm");

document.getElementById("sellModalOverlay").addEventListener("click", closeSellModal);
document.getElementById("closeSellModal").addEventListener("click", closeSellModal);

function openSellModal(id) {

    const product = getProductById(id);
    if (!product) return;

    document.getElementById("sell_id").value = product.id;
    document.getElementById("sellProductName").textContent =
        `${product.name} — omborda ${product.stock} ta bor`;

    document.getElementById("sell_qty").value = 1;
    document.getElementById("sell_qty").max = product.stock;
    document.getElementById("sell_price").value = product.price;

    sellModal.classList.add("active");

}

function closeSellModal() {
    sellModal.classList.remove("active");
}

sellForm.addEventListener("submit", (e) => {

    e.preventDefault();

    const id = Number(document.getElementById("sell_id").value);
    const qty = Number(document.getElementById("sell_qty").value);
    const soldPrice = Number(document.getElementById("sell_price").value);

    const product = getProductById(id);
    if (!product) return;

    if (qty < 1 || qty > product.stock) {
        alert("Noto'g'ri miqdor kiritildi.");
        return;
    }

    product.stock -= qty;
    product.sold = (product.sold || 0) + qty;

    saveProducts();
    addSale(id, qty, soldPrice);

    closeSellModal();
    renderProductTable();
    renderDashboard();

});


// ==============================
// STATISTIKA
// ==============================

function renderStats() {

    products = loadProducts();

    const sales = getSales();
    const today = new Date();

    const revToday = sales.filter(s => isSameDay(s.date, today))
        .reduce((sum, s) => sum + s.qty * s.soldPrice, 0);

    const revWeek = sales.filter(s => isSameWeek(s.date, today))
        .reduce((sum, s) => sum + s.qty * s.soldPrice, 0);

    const revMonth = sales.filter(s => isSameMonth(s.date, today))
        .reduce((sum, s) => sum + s.qty * s.soldPrice, 0);

    document.getElementById("revToday").textContent = revToday.toLocaleString() + " so'm";
    document.getElementById("revWeek").textContent = revWeek.toLocaleString() + " so'm";
    document.getElementById("revMonth").textContent = revMonth.toLocaleString() + " so'm";

    renderRankList("topSold", [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)), "sold", "ta sotildi");
    renderRankList("topViewed", [...products].sort((a, b) => b.views - a.views), "views", "marta ko'rilgan");
    renderRankList("topLiked", [...products].sort((a, b) => b.likes - a.likes), "likes", "ta like");

}

function renderRankList(containerId, list, field, suffix) {

    const container = document.getElementById(containerId);

    container.innerHTML = list.slice(0, 5).map(p => `
        <div class="rank-item">
            <span>${p.name}</span>
            <span>${p[field] || 0} ${suffix}</span>
        </div>
    `).join("");

}


// ==============================
// ISHGA TUSHIRISH
// ==============================

function refreshAll() {
    renderDashboard();
    renderProductTable();
    renderStats();
}

checkAuth();