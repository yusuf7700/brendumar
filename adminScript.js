// ======================================
// UMAR BREND — ADMIN PANEL (SUPABASE)
// ======================================

const loginScreen = document.getElementById("adminLogin");
const adminApp = document.getElementById("adminApp");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");


// ==============================
// LOGIN / LOGOUT (Supabase Auth)
// ==============================

async function checkAuth() {

    const { data: { session } } = await sb.auth.getSession();

    if (session) {
        loginScreen.style.display = "none";
        adminApp.style.display = "flex";
        refreshAll();
    } else {
        loginScreen.style.display = "flex";
        adminApp.style.display = "none";
    }

}

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.textContent = "Email yoki parol noto'g'ri";
        loginError.classList.add("show");
    } else {
        loginError.classList.remove("show");
        checkAuth();
    }

});

document.getElementById("logoutBtn").addEventListener("click", async () => {
    await sb.auth.signOut();
    checkAuth();
});


// ==============================
// SOZLAMALAR — LOGIN (EMAIL) VA PAROLNI O'ZGARTIRISH
// ==============================

document.getElementById("settingsForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const newEmail = document.getElementById("set_new_username").value.trim();
    const newPass = document.getElementById("set_new").value;
    const confirmPass = document.getElementById("set_confirm").value;
    const msg = document.getElementById("settingsMsg");

    msg.className = "settings-msg";

    if (!newEmail && !newPass) {
        msg.textContent = "O'zgartiradigan narsa kiritilmadi";
        msg.classList.add("error");
        return;
    }

    if (newPass && newPass !== confirmPass) {
        msg.textContent = "Yangi parollar bir-biriga mos kelmadi";
        msg.classList.add("error");
        return;
    }

    const updates = {};
    if (newEmail) updates.email = newEmail;
    if (newPass) updates.password = newPass;

    const { error } = await sb.auth.updateUser(updates);

    if (error) {
        msg.textContent = "Xatolik: " + error.message;
        msg.classList.add("error");
        return;
    }

    msg.textContent = newEmail
        ? "Saqlandi ✅ Email o'zgargan bo'lsa, tasdiqlash uchun yangi manzilingizga xat yuborildi — uni tasdiqlaguningizcha eski email bilan kirasiz."
        : "Parol muvaffaqiyatli o'zgartirildi ✅";
    msg.classList.add("success");
    document.getElementById("settingsForm").reset();

});


// ==============================
// SOZLAMALAR — BANNER RASMI
// ==============================

document.getElementById("bannerImage").addEventListener("change", async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById("bannerImagePreview");
    preview.innerHTML = `<span style="font-size:13px;color:var(--gray);">Yuklanmoqda...</span>`;

    const url = await uploadImageToStorage(file);

    if (url) {
        preview.innerHTML = `<img src="${url}">`;
        preview.dataset.url = url;
    }

});

document.getElementById("saveBannerBtn").addEventListener("click", async () => {

    const preview = document.getElementById("bannerImagePreview");
    const url = preview.dataset.url;
    const msg = document.getElementById("bannerMsg");

    msg.className = "settings-msg";

    if (!url) {
        msg.textContent = "Avval rasm tanlang";
        msg.classList.add("error");
        return;
    }

    const { error } = await sb
        .from("site_settings")
        .upsert({ id: 1, banner_image: url });

    if (error) {
        msg.textContent = "Xatolik: " + error.message;
        msg.classList.add("error");
        return;
    }

    msg.textContent = "Banner saqlandi ✅";
    msg.classList.add("success");

});


// ==============================
// SOZLAMALAR — MANZIL VA VIDEO
// ==============================

async function loadContactSettingsForm() {

    const { data } = await sb.from("site_settings").select("*").eq("id", 1).single();

    if (data) {
        document.getElementById("set_address").value = data.address || "";
        document.getElementById("set_video").value = data.location_video_url || "";
        document.getElementById("set_telegram").value = data.telegram || "";
        document.getElementById("set_instagram").value = data.instagram || "";
        document.getElementById("set_phone").value = data.phone || "";
    }

}

document.getElementById("contactSettingsForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const address = document.getElementById("set_address").value.trim();
    const video = document.getElementById("set_video").value.trim();
    const telegram = document.getElementById("set_telegram").value.trim();
    const instagram = document.getElementById("set_instagram").value.trim();
    const phone = document.getElementById("set_phone").value.trim();
    const msg = document.getElementById("contactSettingsMsg");

    msg.className = "settings-msg";

    // Avval mavjud qiymatlarni olamiz, so'ng faqat to'ldirilgan
    // maydonlarni ustiga yozamiz — bo'sh maydon eskisini o'chirmaydi
    const { data: existing } = await sb.from("site_settings").select("*").eq("id", 1).single();

    const payload = {
        id: 1,
        address: address || (existing ? existing.address : "") || "",
        location_video_url: video || (existing ? existing.location_video_url : "") || "",
        telegram: telegram || (existing ? existing.telegram : "") || "",
        instagram: instagram || (existing ? existing.instagram : "") || "",
        phone: phone || (existing ? existing.phone : "") || ""
    };

    const { error } = await sb
        .from("site_settings")
        .upsert(payload);

    if (error) {
        msg.textContent = "Xatolik: " + error.message;
        msg.classList.add("error");
        return;
    }

    msg.textContent = "Saqlandi ✅";
    msg.classList.add("success");

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
        if (btn.dataset.tab === "settings") loadContactSettingsForm();
        if (btn.dataset.tab === "reviews") renderReviewsTable();

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

let currentSales = [];

async function renderStats() {

    await refreshProducts();
    const sales = await getSales();
    currentSales = sales;

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

    renderSalesTable(sales);

}

function renderSalesTable(sales) {

    const container = document.getElementById("salesTable");

    if (!sales.length) {
        container.innerHTML = `<p class="empty-note" style="padding:20px;">Hozircha sotuvlar yo'q</p>`;
        return;
    }

    let html = `
        <div class="sales-row head">
            <span>Sana</span>
            <span>Mahsulot</span>
            <span>Soni</span>
            <span>Narxi</span>
            <span>Jami</span>
            <span></span>
        </div>
    `;

    html += sales.slice(0, 50).map(s => {

        const product = getProductById(s.productId);
        const name = product ? product.name : "(mahsulot o'chirilgan)";
        const total = s.qty * s.soldPrice;
        const dateStr = new Date(s.date).toLocaleDateString("uz-UZ");

        return `
            <div class="sales-row">
                <span>${dateStr}</span>
                <span>${name}</span>
                <span>${s.qty} ta</span>
                <span>${s.soldPrice.toLocaleString()} so'm</span>
                <span>${total.toLocaleString()} so'm</span>
                <div class="row-actions">
                    <button class="edit-btn" onclick="openEditSaleModal(${s.id})" title="Tahrirlash">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteSale(${s.id})" title="O'chirish">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

    }).join("");

    container.innerHTML = html;

}


// ==============================
// SOTUVNI TAHRIRLASH
// ==============================

const editSaleModal = document.getElementById("editSaleModal");
const editSaleForm = document.getElementById("editSaleForm");

document.getElementById("editSaleModalOverlay").addEventListener("click", closeEditSaleModal);
document.getElementById("closeEditSaleModal").addEventListener("click", closeEditSaleModal);

function openEditSaleModal(id) {

    const sale = currentSales.find(s => s.id === id);
    if (!sale) return;

    const product = getProductById(sale.productId);

    document.getElementById("es_id").value = sale.id;
    document.getElementById("editSaleProductName").textContent =
        product ? product.name : "Bu mahsulot o'chirilgan";

    document.getElementById("es_qty").value = sale.qty;
    document.getElementById("es_price").value = sale.soldPrice;

    editSaleModal.classList.add("active");

}

function closeEditSaleModal() {
    editSaleModal.classList.remove("active");
}

editSaleForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const id = Number(document.getElementById("es_id").value);
    const newQty = Number(document.getElementById("es_qty").value);
    const newPrice = Number(document.getElementById("es_price").value);

    const sale = currentSales.find(s => s.id === id);
    if (!sale) return;

    const product = getProductById(sale.productId);

    if (product) {

        // avval eski sotuvning ta'sirini bekor qilamiz
        const restoredStock = product.stock + sale.qty;
        const restoredSold = Math.max(0, (product.sold || 0) - sale.qty);

        if (newQty > restoredStock) {
            alert("Buncha ko'p mahsulot omborda yo'q edi. Maksimal: " + restoredStock);
            return;
        }

        const finalStock = restoredStock - newQty;
        const finalSold = restoredSold + newQty;

        const { error: prodError } = await sb
            .from("products")
            .update({ stock: finalStock, sold: finalSold })
            .eq("id", product.id);

        if (prodError) {
            alert("Xatolik: " + prodError.message);
            return;
        }

    }

    const { error: saleError } = await sb
        .from("sales")
        .update({ qty: newQty, sold_price: newPrice })
        .eq("id", id);

    if (saleError) {
        alert("Xatolik: " + saleError.message);
        return;
    }

    closeEditSaleModal();
    await renderStats();
    await renderProductTable();
    await renderDashboard();

});

async function deleteSale(id) {

    if (!confirm("Ushbu sotuv yozuvini o'chirmoqchimisiz? Mahsulotning ombordagi soni avtomatik tiklanadi.")) return;

    const sale = currentSales.find(s => s.id === id);
    if (!sale) return;

    const product = getProductById(sale.productId);

    if (product) {

        const restoredStock = product.stock + sale.qty;
        const restoredSold = Math.max(0, (product.sold || 0) - sale.qty);

        await sb
            .from("products")
            .update({ stock: restoredStock, sold: restoredSold })
            .eq("id", product.id);

    }

    const { error } = await sb.from("sales").delete().eq("id", id);

    if (error) {
        alert("Xatolik: " + error.message);
        return;
    }

    await renderStats();
    await renderProductTable();
    await renderDashboard();

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

// ==============================
// SHARHLAR (Reviews) — MODERATSIYA
// ==============================

async function renderReviewsTable() {

    await refreshProducts();

    const reviews = await getAllReviews();
    const container = document.getElementById("reviewsTable");

    if (!reviews.length) {
        container.innerHTML = `<p class="empty-note">Hozircha sharhlar yo'q</p>`;
        return;
    }

    container.innerHTML = reviews.map(r => {

        const product = getProductById(r.product_id);
        const productName = product ? product.name : "(mahsulot o'chirilgan)";
        const dateStr = new Date(r.created_at).toLocaleDateString("uz-UZ");

        let stars = "";
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fa-solid fa-star" style="opacity:${i <= r.rating ? 1 : 0.25}"></i>`;
        }

        return `
            <div class="review-admin-row">
                <span><strong>${productName}</strong><br><span style="color:var(--gray);font-size:12px;">${dateStr}</span></span>
                <span>${r.name}</span>
                <span class="stars-mini">${stars}</span>
                <p>${r.comment || ""}</p>
                <button class="delete-btn" onclick="removeReview(${r.id})" title="O'chirish" style="width:34px;height:34px;border-radius:9px;background:var(--white);">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

    }).join("");

}

async function removeReview(id) {

    if (!confirm("Ushbu sharhni o'chirmoqchimisiz?")) return;

    const ok = await deleteReview(id);

    if (!ok) {
        alert("O'chirishda xatolik yuz berdi");
        return;
    }

    await renderReviewsTable();

}

checkAuth();
