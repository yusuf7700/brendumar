// ======================================
// UMAR BREND — ADMIN PANEL (SUPABASE)
// ======================================

let ADMIN_PASSWORD = "umar2026"; // <-- boshlang'ich parol (keyinchalik Sozlamalar orqali o'zgartiriladi)

const loginScreen = document.getElementById("adminLogin");
const adminApp = document.getElementById("adminApp");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");


// ==============================
// PAROLNI SUPABASE'DAN YUKLASH
// ==============================

async function loadAdminPassword() {

    const { data, error } = await sb
        .from("admin_settings")
        .select("password")
        .eq("id", 1)
        .single();

    if (!error && data && data.password) {
        ADMIN_PASSWORD = data.password;
    } else {
        // Birinchi marta ishga tushganda qatorni yaratib qo'yamiz
        await sb.from("admin_settings").upsert({ id: 1, password: ADMIN_PASSWORD });
    }

}


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
// SOZLAMALAR — PAROLNI O'ZGARTIRISH
// ==============================

document.getElementById("settingsForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const current = document.getElementById("set_current").value;
    const newPass = document.getElementById("set_new").value;
    const confirmPass = document.getElementById("set_confirm").value;
    const msg = document.getElementById("settingsMsg");

    msg.className = "settings-msg";

    if (current !== ADMIN_PASSWORD) {
        msg.textContent = "Joriy parol noto'g'ri";
        msg.classList.add("error");
        return;
    }

    if (newPass !== confirmPass) {
        msg.textContent = "Yangi parollar bir-biriga mos kelmadi";
        msg.classList.add("error");
        return;
    }

    const { error } = await sb
        .from("admin_settings")
        .update({ password: newPass })
        .eq("id", 1);

    if (error) {
        msg.textContent = "Xatolik: " + error.message;
        msg.classList.add("error");
        return;
    }

    ADMIN_PASSWORD = newPass;
    msg.textContent = "Parol muvaffaqiyatli o'zgartirildi ✅";
    msg.classList.add("success");
    document.getElementById("settingsForm").reset();

});


// ==============================
// MOBIL SIDEBAR
// ==============================

const adminSidebar = document.getElementById("adminSidebar");
const adminMenuBtn = document.getElementById("adminMenuBtn");

if (adminMenuBtn) {

    adminMenuBtn.addEventListener("click", () => {
        adminSidebar.classList.toggle("active");
    });

}


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

        if (adminSidebar) adminSidebar.classList.remove("active");

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

async function renderDashboard() {

    await refreshProducts();
    const sales = await getSales();

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

async function renderProductTable() {

    await refreshProducts();

    const table = document.getElementById("productTable");

    if (!products.length) {

        table.innerHTML = `
            <div style="padding:40px;text-align:center;color:var(--gray);">
                Hozircha mahsulot yo'q. "Mahsulot qo'shish" tugmasi orqali birinchisini qo'shing.
            </div>
        `;

        return;

    }

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

async function deleteProduct(id) {

    if (!confirm("Ushbu mahsulotni o'chirmoqchimisiz?")) return;

    const { error } = await sb.from("products").delete().eq("id", id);

    if (error) {
        alert("O'chirishda xatolik: " + error.message);
        return;
    }

    await renderProductTable();
    await renderDashboard();

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


// ==============================
// RASM YUKLASH (Supabase Storage)
// ==============================

async function uploadImageToStorage(file) {

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${Date.now()}-${safeName}`;

    const { error } = await sb.storage.from("product-images").upload(path, file);

    if (error) {
        alert("Rasm yuklashda xatolik: " + error.message);
        return null;
    }

    const { data } = sb.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;

}

document.getElementById("pf_mainImage").addEventListener("change", async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const label = e.target.nextElementSibling;
    document.getElementById("pf_mainImagePreview").innerHTML = `<span style="font-size:13px;color:var(--gray);">Yuklanmoqda...</span>`;

    const url = await uploadImageToStorage(file);
    if (url) currentMainImage = url;

    renderImagePreviews();

});

document.getElementById("pf_extraImages").addEventListener("change", async (e) => {

    const files = Array.from(e.target.files);
    if (!files.length) return;

    document.getElementById("pf_extraImagesPreview").innerHTML = `<span style="font-size:13px;color:var(--gray);">Yuklanmoqda...</span>`;

    const urls = [];

    for (const file of files) {
        const url = await uploadImageToStorage(file);
        if (url) urls.push(url);
    }

    if (urls.length) currentExtraImages = urls;

    renderImagePreviews();

});

productForm.addEventListener("submit", async (e) => {

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
        old_price: Number(document.getElementById("pf_oldPrice").value) || 0,
        category: document.getElementById("pf_category").value,
        badge: document.getElementById("pf_badge").value,
        sizes,
        stock: Number(document.getElementById("pf_stock").value),
        description: document.getElementById("pf_description").value.trim(),
        image: mainImage,
        images
    };

    let error;

    if (id) {

        ({ error } = await sb.from("products").update(data).eq("id", id));

    } else {

        ({ error } = await sb.from("products").insert({
            ...data,
            views: 0,
            likes: 0,
            sold: 0
        }));

    }

    if (error) {
        alert("Saqlashda xatolik: " + error.message);
        return;
    }

    closeProductForm();
    await renderProductTable();
    await renderDashboard();

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

sellForm.addEventListener("submit", async (e) => {

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

    const newStock = product.stock - qty;
    const newSold = (product.sold || 0) + qty;

    const { error } = await sb
        .from("products")
        .update({ stock: newStock, sold: newSold })
        .eq("id", id);

    if (error) {
        alert("Saqlashda xatolik: " + error.message);
        return;
    }

    await addSale(id, qty, soldPrice);

    closeSellModal();
    await renderProductTable();
    await renderDashboard();

});


// ==============================
// STATISTIKA
// ==============================

async function renderStats() {

    await refreshProducts();
    const sales = await getSales();

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

    if (!list.length) {
        container.innerHTML = `<p class="empty-note">Hozircha ma'lumot yo'q</p>`;
        return;
    }

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

async function refreshAll() {
    await renderDashboard();
    await renderProductTable();
    await renderStats();
}

(async function initAdmin() {
    await loadAdminPassword();
    checkAuth();
})();
