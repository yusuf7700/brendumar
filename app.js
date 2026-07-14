// ============================================
// UMAR BREND — asosiy ilova mantig'i (Supabase bilan)
// ============================================
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let products = [];
let categories = [];
let sales = [];
let settings = { shop_name: "Umar Brend", telegram: "", instagram: "", phone: "" };
let cart = JSON.parse(localStorage.getItem('ub_cart') || '[]');
let session = null; // supabase auth session
let view = "store";
let adminTab = "dashboard";
let activeCategory = "Hammasi";
let searchQuery = "";
let theme = localStorage.getItem('ub_theme') || 'light';
let openProduct = null;
let cartOpen = false;
let editingProduct = null;
let markingSold = null;

const SHOE_SVG = `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" width="60%" height="60%"><path d="M5 45 C10 30 25 20 40 22 L55 15 C60 13 68 14 70 20 L75 28 C85 30 95 32 95 42 C95 48 90 50 82 50 L15 50 C8 50 5 48 5 45 Z" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`;

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}
function saveCartLocal(){ localStorage.setItem('ub_cart', JSON.stringify(cart)); }

// ---------- LOAD DATA FROM SUPABASE ----------
async function loadPublicData(){
  const [{ data: cats, error: catErr }, { data: prods, error: prodErr }, { data: sett, error: setErr }] = await Promise.all([
    sb.from('categories').select('*').order('name'),
    sb.from('products').select('*').order('created_at', { ascending: false }),
    sb.from('settings').select('*').eq('id', 1).single()
  ]);
  if(catErr) console.error(catErr); else categories = cats.map(c=>c.name);
  if(prodErr) console.error(prodErr); else products = prods || [];
  if(setErr) console.error(setErr); else if(sett) settings = sett;
}
async function loadSales(){
  const { data, error } = await sb.from('sales').select('*').order('sold_at', { ascending:false });
  if(error) console.error(error); else sales = data || [];
}

document.documentElement.setAttribute('data-theme', theme);

async function init(){
  const { data: { session: s } } = await sb.auth.getSession();
  session = s;
  await loadPublicData();
  if(session) await loadSales();
  render();
}
sb.auth.onAuthStateChange((_event, s)=>{ session = s; });

function toggleTheme(){
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ub_theme', theme);
  render();
}

// ---------- HELPERS ----------
function money(n){ return Number(n||0).toLocaleString('uz-UZ') + " so'm"; }
function totalStock(prod){ return (prod.sizes||[]).reduce((a,s)=>a+Number(s.qty||0),0); }
function isLow(prod){ return totalStock(prod) > 0 && totalStock(prod) <= 3; }
function filteredProducts(){
  return products.filter(p=>{
    const catOk = activeCategory === "Hammasi" || p.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const searchOk = !q || p.name.toLowerCase().includes(q);
    return catOk && searchOk;
  });
}

// ---------- CART ----------
function addToCart(productId, size, qty){
  const existing = cart.find(c=>c.productId===productId && c.size===size);
  if(existing){ existing.qty += qty; } else { cart.push({productId, size, qty}); }
  saveCartLocal();
  toast("Savatchaga qo'shildi");
  render();
}
function removeFromCart(idx){ cart.splice(idx,1); saveCartLocal(); render(); }
function changeCartQty(idx, delta){
  cart[idx].qty += delta;
  if(cart[idx].qty <= 0) cart.splice(idx,1);
  saveCartLocal(); render();
}
function cartCount(){ return cart.reduce((a,c)=>a+c.qty,0); }
function cartTotal(){
  return cart.reduce((sum,c)=>{
    const p = products.find(x=>x.id===c.productId);
    return sum + (p ? p.price*c.qty : 0);
  },0);
}
function buildOrderText(){
  let lines = [`Buyurtma - ${settings.shop_name}`, ""];
  cart.forEach(c=>{
    const p = products.find(x=>x.id===c.productId);
    if(p) lines.push(`- ${p.name} | O'lcham: ${c.size} | Soni: ${c.qty} | ${money(p.price*c.qty)}`);
  });
  lines.push("", `Jami: ${money(cartTotal())}`);
  return lines.join("\n");
}
function copyOrderText(){
  const text = buildOrderText();
  navigator.clipboard.writeText(text).then(()=>toast("Nusxalandi. Endi messenjerga qo'shib yuboring.")).catch(()=>toast("Nusxalab bo'lmadi, matnni qo'lda yozing."));
}

// ---------- ADMIN AUTH ----------
async function tryAdminLogin(email, password){
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error){ toast("Kirishda xatolik: " + error.message); return; }
  session = data.session;
  await loadSales();
  view = "admin"; adminTab = "dashboard";
  toast("Xush kelibsiz!");
  render();
}
async function adminLogout(){
  await sb.auth.signOut();
  session = null; view = "store"; render();
}

// ---------- PRODUCT CRUD ----------
function newProductDraft(){
  return { id: null, name:"", category: categories[0]||"", price:0, image:"", description:"", sizes:[{size:"", qty:0}] };
}
async function saveProductDraft(){
  if(!editingProduct.name.trim()){ toast("Nomini kiriting"); return; }
  const payload = {
    name: editingProduct.name,
    category: editingProduct.category,
    price: Number(editingProduct.price)||0,
    image: editingProduct.image,
    description: editingProduct.description,
    sizes: editingProduct.sizes.filter(s=>String(s.size).trim()!=="").map(s=>({size:String(s.size).trim(), qty:Number(s.qty)||0}))
  };
  let error;
  if(editingProduct.id){
    ({ error } = await sb.from('products').update(payload).eq('id', editingProduct.id));
  } else {
    ({ error } = await sb.from('products').insert(payload));
  }
  if(error){ toast("Xatolik: " + error.message); return; }
  await loadPublicData();
  editingProduct = null;
  toast("Saqlandi");
  render();
}
async function deleteProduct(id){
  if(!confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) return;
  const { error } = await sb.from('products').delete().eq('id', id);
  if(error){ toast("Xatolik: " + error.message); return; }
  await loadPublicData();
  render();
}

// ---------- MARK SOLD ----------
function openMarkSold(product){
  markingSold = { product, size: (product.sizes[0]||{}).size || "", qty:1, price: product.price };
  render();
}
async function confirmMarkSold(){
  const { product, size, qty, price } = markingSold;
  const newSizes = JSON.parse(JSON.stringify(product.sizes));
  const sizeObj = newSizes.find(s=>s.size===size);
  if(!sizeObj || sizeObj.qty < qty){ toast("Omborda yetarli son yo'q"); return; }
  sizeObj.qty -= qty;
  const { error: updErr } = await sb.from('products').update({ sizes: newSizes }).eq('id', product.id);
  if(updErr){ toast("Xatolik: " + updErr.message); return; }
  const { error: insErr } = await sb.from('sales').insert({
    product_id: product.id, product_name: product.name, size, qty: Number(qty), sold_price: Number(price)
  });
  if(insErr){ toast("Xatolik: " + insErr.message); return; }
  await loadPublicData();
  await loadSales();
  markingSold = null;
  toast("Sotuv qayd etildi");
  render();
}

// ---------- CATEGORIES ----------
async function addCategory(name){
  const { error } = await sb.from('categories').insert({ name });
  if(error){ toast("Xatolik: " + error.message); return; }
  await loadPublicData(); render();
}
async function deleteCategory(name){
  const { error } = await sb.from('categories').delete().eq('name', name);
  if(error){ toast("Xatolik: " + error.message); return; }
  await loadPublicData(); render();
}

// ---------- SETTINGS ----------
async function saveSettingsForm(payload){
  const { error } = await sb.from('settings').update(payload).eq('id', 1);
  if(error){ toast("Xatolik: " + error.message); return; }
  await loadPublicData();
  toast("Sozlamalar saqlandi");
  render();
}

// ---------- STATS ----------
function computeStats(){
  const totalRevenue = sales.reduce((a,s)=>a+s.sold_price*s.qty,0);
  const totalSoldQty = sales.reduce((a,s)=>a+s.qty,0);
  const totalProducts = products.length;
  const totalStockAll = products.reduce((a,p)=>a+totalStock(p),0);
  const byProduct = {};
  sales.forEach(s=>{ byProduct[s.product_name] = (byProduct[s.product_name]||0) + s.qty; });
  const top = Object.entries(byProduct).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const lowStock = products.filter(isLow);
  return { totalRevenue, totalSoldQty, totalProducts, totalStockAll, top, lowStock };
}

// ---------- RENDER ----------
function render(){
  const app = document.getElementById('app');
  if(view === "store") app.innerHTML = renderStore();
  else if(view === "admin-login") app.innerHTML = renderAdminLogin();
  else app.innerHTML = renderAdmin();
  attachEvents();
}

function renderHeader(){
  const cats = ["Hammasi", ...categories];
  return `
  <header>
    <div class="header-inner">
      <div class="logo" data-action="go-store">
        <div class="ub">${(settings.shop_name||'Umar Brend').toUpperCase()}</div>
      </div>
      <nav class="cats">
        ${cats.map(c=>`<button class="${activeCategory===c?'active':''}" data-action="set-cat" data-cat="${c}">${c}</button>`).join('')}
      </nav>
      <input class="search" placeholder="Qidirish..." value="${searchQuery}" data-action="search"/>
      <button class="icon-btn" data-action="toggle-theme">${theme==='light'?'🌙':'☀️'}</button>
      <button class="icon-btn" data-action="open-cart">🛍
        ${cartCount()>0?`<span class="cart-badge">${cartCount()}</span>`:''}
      </button>
      <button class="admin-link" data-action="go-admin">Admin</button>
    </div>
    <div class="stitch"></div>
  </header>`;
}

function renderStore(){
  const list = filteredProducts();
  return `
    ${renderHeader()}
    <div class="hero">
      <h1 class="display">${settings.shop_name}</h1>
      <p>Sifatli va zamonaviy oyoq kiyimlar — o'zingizga mosini tanlang.</p>
    </div>
    <div class="wrap">
      ${list.length===0 ? `<div class="empty">Hozircha mahsulot topilmadi.</div>` : `
      <div class="grid">
        ${list.map(p=>`
          <div class="card" data-action="open-product" data-id="${p.id}">
            <div class="img">${p.image?`<img src="${p.image}"/>`:`<div style="color:var(--gold)">${SHOE_SVG}</div>`}</div>
            <div class="body">
              <div class="cat">${p.category}</div>
              <div class="name">${p.name}</div>
              <div class="price">${money(p.price)}</div>
              ${totalStock(p)===0?`<div class="stockflag">Tugagan</div>`:isLow(p)?`<div class="stockflag">Kam qoldi (${totalStock(p)})</div>`:''}
            </div>
          </div>
        `).join('')}
      </div>`}
    </div>
    ${openProduct ? renderProductModal() : ''}
    ${cartOpen ? renderCartDrawer() : ''}
  `;
}

function renderProductModal(){
  const p = products.find(x=>x.id===openProduct);
  if(!p) return '';
  const availableSizes = (p.sizes||[]).filter(s=>s.qty>0);
  return `
  <div class="overlay center" data-action="close-modal">
    <div class="panel modal-box" style="max-width:480px" onclick="event.stopPropagation()">
      <button class="close-x" data-action="close-modal">✕</button>
      <div class="img" style="height:220px;border-radius:10px;margin-bottom:14px;">${p.image?`<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;"/>`:`<div style="color:var(--gold);display:flex;align-items:center;justify-content:center;height:100%;">${SHOE_SVG}</div>`}</div>
      <div class="cat">${p.category}</div>
      <h2 style="margin:6px 0;">${p.name}</h2>
      <div class="price" style="font-size:20px;">${money(p.price)}</div>
      <p style="color:var(--text-soft);font-size:14px;">${p.description||''}</p>
      <label>O'lcham</label>
      <select id="modal-size">
        ${(p.sizes||[]).map(s=>`<option value="${s.size}" ${s.qty<=0?'disabled':''}>${s.size} ${s.qty<=0?'(tugagan)':`(${s.qty} dona)`}</option>`).join('') || '<option disabled>O\'lcham kiritilmagan</option>'}
      </select>
      <label>Soni</label>
      <input id="modal-qty" type="number" min="1" value="1"/>
      <button class="btn block" data-action="add-cart-modal" data-id="${p.id}" ${availableSizes.length===0?'disabled':''}>Savatchaga qo'shish</button>
    </div>
  </div>`;
}

function renderCartDrawer(){
  return `
  <div class="overlay" data-action="close-cart">
    <div class="panel" onclick="event.stopPropagation()">
      <button class="close-x" data-action="close-cart">✕</button>
      <h2>Savatcha</h2>
      ${cart.length===0?`<p style="color:var(--text-soft)">Savatcha bo'sh</p>`:`
        ${cart.map((c,i)=>{
          const p = products.find(x=>x.id===c.productId);
          if(!p) return '';
          return `
          <div class="cart-item">
            <div class="thumb">${p.image?`<img src="${p.image}"/>`:''}</div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;">${p.name}</div>
              <div style="font-size:12px;color:var(--text-soft);">O'lcham: ${c.size}</div>
              <div class="qty-ctrl" style="margin-top:6px;">
                <button data-action="cart-dec" data-idx="${i}">−</button>
                <span>${c.qty}</span>
                <button data-action="cart-inc" data-idx="${i}">+</button>
                <button data-action="cart-remove" data-idx="${i}" style="margin-left:auto;color:var(--danger);border:none;background:none;cursor:pointer;">O'chirish</button>
              </div>
            </div>
            <div style="font-weight:700;color:var(--gold);white-space:nowrap;">${money(p.price*c.qty)}</div>
          </div>`;
        }).join('')}
        <div style="display:flex;justify-content:space-between;margin-top:16px;font-weight:700;font-size:16px;">
          <span>Jami</span><span>${money(cartTotal())}</span>
        </div>
        <button class="btn block" data-action="checkout">Buyurtma berish</button>
      `}
    </div>
  </div>`;
}

function renderAdminLogin(){
  return `
  ${renderHeader()}
  <div style="min-height:70vh;display:flex;align-items:center;justify-content:center;">
    <div class="panel modal-box" style="width:320px;">
      <h2 style="text-align:center;">Admin kirish</h2>
      <label>Email</label>
      <input type="email" id="admin-email" placeholder="admin@umarbrend.uz"/>
      <label>Parol</label>
      <input type="password" id="admin-pass" placeholder="Parolni kiriting"/>
      <button class="btn block" data-action="admin-login-submit">Kirish</button>
      <button class="btn secondary block" data-action="go-store">Bekor qilish</button>
      <p style="font-size:12px;color:var(--text-soft);margin-top:12px;">Admin hisobi Supabase Dashboard orqali yaratiladi (README'ga qarang).</p>
    </div>
  </div>`;
}

function renderAdmin(){
  if(!session){ view = "admin-login"; return renderAdminLogin(); }
  const stats = computeStats();
  return `
  <div class="admin-shell">
    <div class="admin-side">
      <div class="ub" style="background:linear-gradient(135deg,var(--gold-bright),var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent;font-size:22px;font-weight:700;padding:8px 12px;">${settings.shop_name}</div>
      <button class="${adminTab==='dashboard'?'active':''}" data-action="admin-tab" data-tab="dashboard">📊 Statistika</button>
      <button class="${adminTab==='products'?'active':''}" data-action="admin-tab" data-tab="products">👟 Mahsulotlar</button>
      <button class="${adminTab==='sales'?'active':''}" data-action="admin-tab" data-tab="sales">💰 Sotuvlar tarixi</button>
      <button class="${adminTab==='categories'?'active':''}" data-action="admin-tab" data-tab="categories">🏷 Kategoriyalar</button>
      <button class="${adminTab==='settings'?'active':''}" data-action="admin-tab" data-tab="settings">⚙️ Sozlamalar</button>
      <div class="stitch" style="margin:14px 0;"></div>
      <button data-action="go-store">← Saytga qaytish</button>
      <button data-action="admin-logout">🚪 Chiqish</button>
    </div>
    <div class="admin-main">
      ${adminTab==='dashboard' ? renderDashboard(stats) : ''}
      ${adminTab==='products' ? renderAdminProducts() : ''}
      ${adminTab==='sales' ? renderAdminSales() : ''}
      ${adminTab==='categories' ? renderAdminCategories() : ''}
      ${adminTab==='settings' ? renderAdminSettings() : ''}
    </div>
  </div>
  ${editingProduct ? renderProductForm() : ''}
  ${markingSold ? renderMarkSoldModal() : ''}
  `;
}

function renderDashboard(stats){
  return `
    <h2>Statistika</h2>
    <div class="stat-grid">
      <div class="stat-card"><div class="val">${money(stats.totalRevenue)}</div><div class="lbl">Umumiy tushum</div></div>
      <div class="stat-card"><div class="val">${stats.totalSoldQty}</div><div class="lbl">Sotilgan mahsulotlar soni</div></div>
      <div class="stat-card"><div class="val">${stats.totalProducts}</div><div class="lbl">Qo'shilgan mahsulot turlari</div></div>
      <div class="stat-card"><div class="val">${stats.totalStockAll}</div><div class="lbl">Omborda qolgan (dona)</div></div>
    </div>
    <h3>Eng ko'p sotilganlar</h3>
    ${stats.top.length===0?`<p style="color:var(--text-soft)">Hali sotuv yo'q</p>`:`
    <table><tr><th>Mahsulot</th><th>Sotilgan soni</th></tr>
      ${stats.top.map(t=>`<tr><td>${t[0]}</td><td>${t[1]}</td></tr>`).join('')}
    </table>`}
    <h3 style="margin-top:22px;">Kam qolgan mahsulotlar</h3>
    ${stats.lowStock.length===0?`<p style="color:var(--text-soft)">Hammasi yetarli</p>`:`
    <table><tr><th>Mahsulot</th><th>Qolgan soni</th></tr>
      ${stats.lowStock.map(p=>`<tr><td>${p.name}</td><td class="low">${totalStock(p)}</td></tr>`).join('')}
    </table>`}
  `;
}

function renderAdminProducts(){
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2>Mahsulotlar</h2>
      <button class="btn" data-action="new-product">+ Mahsulot qo'shish</button>
    </div>
    <table>
      <tr><th>Nomi</th><th>Kategoriya</th><th>Narx</th><th>Qolgan</th><th>Amallar</th></tr>
      ${products.map(p=>`
        <tr>
          <td>${p.name}</td>
          <td><span class="pill">${p.category}</span></td>
          <td>${money(p.price)}</td>
          <td class="${isLow(p)?'low':''}">${totalStock(p)}</td>
          <td class="row-actions">
            <button class="btn secondary" data-action="mark-sold" data-id="${p.id}">Sotildi</button>
            <button class="btn secondary" data-action="edit-product" data-id="${p.id}">Tahrirlash</button>
            <button class="btn danger" data-action="delete-product" data-id="${p.id}">O'chirish</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function renderAdminSales(){
  const sorted = [...sales].sort((a,b)=> new Date(b.sold_at)-new Date(a.sold_at));
  return `
    <h2>Sotuvlar tarixi</h2>
    ${sorted.length===0?`<p style="color:var(--text-soft)">Hali sotuv qayd etilmagan</p>`:`
    <table>
      <tr><th>Sana</th><th>Mahsulot</th><th>O'lcham</th><th>Soni</th><th>Narx (dona)</th><th>Jami</th></tr>
      ${sorted.map(s=>`
        <tr>
          <td>${new Date(s.sold_at).toLocaleDateString('uz-UZ')}</td>
          <td>${s.product_name}</td>
          <td>${s.size}</td>
          <td>${s.qty}</td>
          <td>${money(s.sold_price)}</td>
          <td style="font-weight:700;color:var(--gold);">${money(s.sold_price*s.qty)}</td>
        </tr>
      `).join('')}
    </table>`}
  `;
}

function renderAdminCategories(){
  return `
    <h2>Kategoriyalar</h2>
    <div style="display:flex;gap:8px;margin-bottom:16px;max-width:400px;">
      <input id="new-cat-input" placeholder="Yangi kategoriya nomi"/>
      <button class="btn" data-action="add-category">Qo'shish</button>
    </div>
    <table>
      <tr><th>Nomi</th><th>Amallar</th></tr>
      ${categories.map(c=>`
        <tr><td>${c}</td><td><button class="btn danger" data-action="delete-category" data-cat="${c}">O'chirish</button></td></tr>
      `).join('')}
    </table>
  `;
}

function renderAdminSettings(){
  return `
    <h2>Sozlamalar</h2>
    <div style="max-width:420px;">
      <label>Do'kon nomi</label>
      <input id="set-shopname" value="${settings.shop_name||''}"/>
      <label>Telegram username (masalan @umarbrend)</label>
      <input id="set-telegram" value="${settings.telegram||''}"/>
      <label>Instagram username (masalan umarbrend)</label>
      <input id="set-instagram" value="${settings.instagram||''}"/>
      <label>Telefon raqami</label>
      <input id="set-phone" value="${settings.phone||''}"/>
      <button class="btn block" data-action="save-settings">Saqlash</button>
      <p style="font-size:12px;color:var(--text-soft);margin-top:12px;">Admin login/parolni Supabase Dashboard > Authentication bo'limidan boshqarasiz.</p>
    </div>
  `;
}

function renderProductForm(){
  const p = editingProduct;
  return `
  <div class="overlay center" data-action="close-product-form">
    <div class="panel modal-box" style="width:480px;" onclick="event.stopPropagation()">
      <button class="close-x" data-action="close-product-form">✕</button>
      <h2>${p.id?'Mahsulotni tahrirlash':'Yangi mahsulot'}</h2>
      <label>Nomi</label><input id="pf-name" value="${p.name}"/>
      <label>Kategoriya</label>
      <select id="pf-category">${categories.map(c=>`<option value="${c}" ${p.category===c?'selected':''}>${c}</option>`).join('')}</select>
      <label>Narxi (so'm)</label><input id="pf-price" type="number" value="${p.price}"/>
      <label>Rasm URL (ixtiyoriy)</label><input id="pf-image" value="${p.image}"/>
      <label>Tavsif (ixtiyoriy)</label><textarea id="pf-desc" rows="2">${p.description}</textarea>
      <label>O'lchamlar va sonlari</label>
      <div id="pf-sizes">
        ${p.sizes.map((s,i)=>`
          <div class="size-row">
            <input placeholder="O'lcham (39)" value="${s.size}" data-sizeidx="${i}" data-field="size" style="flex:1"/>
            <input placeholder="Soni" type="number" value="${s.qty}" data-sizeidx="${i}" data-field="qty" style="flex:1"/>
            <button data-action="remove-size-row" data-idx="${i}" style="background:none;border:none;color:var(--danger);cursor:pointer;">✕</button>
          </div>`).join('')}
      </div>
      <button class="btn secondary" data-action="add-size-row">+ O'lcham qo'shish</button>
      <button class="btn block" data-action="save-product">Saqlash</button>
    </div>
  </div>`;
}

function renderMarkSoldModal(){
  const { product, size, qty, price } = markingSold;
  return `
  <div class="overlay center" data-action="close-marksold">
    <div class="panel modal-box" style="width:360px;" onclick="event.stopPropagation()">
      <button class="close-x" data-action="close-marksold">✕</button>
      <h2>Sotuvni qayd etish</h2>
      <p style="color:var(--text-soft);font-size:14px;">${product.name}</p>
      <label>O'lcham</label>
      <select id="ms-size">
        ${product.sizes.map(s=>`<option value="${s.size}" ${s.size===size?'selected':''} ${s.qty<=0?'disabled':''}>${s.size} (${s.qty} dona bor)</option>`).join('')}
      </select>
      <label>Sotilgan soni</label>
      <input id="ms-qty" type="number" min="1" value="${qty}"/>
      <label>Qanchaga sotildi (dona narxi, so'm)</label>
      <input id="ms-price" type="number" value="${price}"/>
      <button class="btn block" data-action="confirm-marksold">Tasdiqlash</button>
    </div>
  </div>`;
}

// ---------- EVENTS ----------
function attachEvents(){
  document.body.onclick = async (e)=>{
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const action = el.dataset.action;
    if(action==='go-store'){ view='store'; openProduct=null; render(); }
    else if(action==='go-admin'){ view = session ? 'admin' : 'admin-login'; render(); }
    else if(action==='set-cat'){ activeCategory = el.dataset.cat; render(); }
    else if(action==='toggle-theme'){ toggleTheme(); }
    else if(action==='open-cart'){ cartOpen=true; render(); }
    else if(action==='close-cart'){ cartOpen=false; render(); }
    else if(action==='open-product'){ openProduct = el.dataset.id; render(); }
    else if(action==='close-modal'){ openProduct=null; render(); }
    else if(action==='add-cart-modal'){
      const size = document.getElementById('modal-size').value;
      const qty = Number(document.getElementById('modal-qty').value)||1;
      addToCart(el.dataset.id, size, qty);
      openProduct=null;
    }
    else if(action==='cart-inc'){ changeCartQty(Number(el.dataset.idx), 1); }
    else if(action==='cart-dec'){ changeCartQty(Number(el.dataset.idx), -1); }
    else if(action==='cart-remove'){ removeFromCart(Number(el.dataset.idx)); }
    else if(action==='checkout'){ openCheckout(); }
    else if(action==='admin-login-submit'){
      const email = document.getElementById('admin-email').value;
      const pass = document.getElementById('admin-pass').value;
      await tryAdminLogin(email, pass);
    }
    else if(action==='admin-logout'){ await adminLogout(); }
    else if(action==='admin-tab'){ adminTab = el.dataset.tab; render(); }
    else if(action==='new-product'){ editingProduct = newProductDraft(); render(); }
    else if(action==='edit-product'){ editingProduct = JSON.parse(JSON.stringify(products.find(p=>p.id===el.dataset.id))); render(); }
    else if(action==='delete-product'){ await deleteProduct(el.dataset.id); }
    else if(action==='close-product-form'){ editingProduct=null; render(); }
    else if(action==='add-size-row'){ editingProduct.sizes.push({size:"",qty:0}); render(); }
    else if(action==='remove-size-row'){ editingProduct.sizes.splice(Number(el.dataset.idx),1); render(); }
    else if(action==='save-product'){ syncProductFormFields(); await saveProductDraft(); }
    else if(action==='mark-sold'){ openMarkSold(products.find(p=>p.id===el.dataset.id)); }
    else if(action==='close-marksold'){ markingSold=null; render(); }
    else if(action==='confirm-marksold'){
      markingSold.size = document.getElementById('ms-size').value;
      markingSold.qty = Number(document.getElementById('ms-qty').value)||1;
      markingSold.price = Number(document.getElementById('ms-price').value)||0;
      await confirmMarkSold();
    }
    else if(action==='add-category'){
      const val = document.getElementById('new-cat-input').value.trim();
      if(val && !categories.includes(val)) await addCategory(val);
    }
    else if(action==='delete-category'){ await deleteCategory(el.dataset.cat); }
    else if(action==='save-settings'){
      await saveSettingsForm({
        shop_name: document.getElementById('set-shopname').value || settings.shop_name,
        telegram: document.getElementById('set-telegram').value,
        instagram: document.getElementById('set-instagram').value,
        phone: document.getElementById('set-phone').value
      });
    }
  };
  const searchInput = document.querySelector('[data-action="search"]');
  if(searchInput){
    searchInput.oninput = (e)=>{ searchQuery = e.target.value; renderKeepFocus(); };
  }
}

function renderKeepFocus(){
  render();
  const s = document.querySelector('[data-action="search"]');
  if(s){ s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
}

function syncProductFormFields(){
  editingProduct.name = document.getElementById('pf-name').value;
  editingProduct.category = document.getElementById('pf-category').value;
  editingProduct.price = document.getElementById('pf-price').value;
  editingProduct.image = document.getElementById('pf-image').value;
  editingProduct.description = document.getElementById('pf-desc').value;
  const sizeInputs = document.querySelectorAll('[data-sizeidx]');
  sizeInputs.forEach(inp=>{
    const idx = Number(inp.dataset.sizeidx);
    const field = inp.dataset.field;
    if(editingProduct.sizes[idx]) editingProduct.sizes[idx][field] = inp.value;
  });
}

function openCheckout(){
  if(cart.length===0){ toast("Savatcha bo'sh"); return; }
  const text = buildOrderText();
  let html = `
    <div class="overlay center" id="checkout-overlay">
      <div class="panel modal-box" style="width:360px;">
        <button class="close-x" id="checkout-close">✕</button>
        <h2>Buyurtmani yuborish</h2>
        <p style="font-size:13px;color:var(--text-soft);">Avval matnni nusxalang, so'ng quyidagi kanallardan biri orqali yuboring.</p>
        <button class="btn block" id="copy-order-btn">📋 Buyurtma matnini nusxalash</button>
        ${settings.telegram?`<a class="btn block secondary" style="display:block;text-align:center;text-decoration:none;margin-top:8px;" href="https://t.me/${settings.telegram.replace('@','')}" target="_blank">Telegram orqali yuborish</a>`:''}
        ${settings.instagram?`<a class="btn block secondary" style="display:block;text-align:center;text-decoration:none;margin-top:8px;" href="https://instagram.com/${settings.instagram.replace('@','')}" target="_blank">Instagram orqali yuborish</a>`:''}
        ${settings.phone?`<a class="btn block secondary" style="display:block;text-align:center;text-decoration:none;margin-top:8px;" href="tel:${settings.phone}">Qo'ng'iroq qilish</a>`:''}
        ${(!settings.telegram && !settings.instagram && !settings.phone) ? `<p style="color:var(--danger);font-size:13px;">Admin hali aloqa ma'lumotlarini kiritmagan (Sozlamalar bo'limida).</p>`:''}
      </div>
    </div>`;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper.firstElementChild);
  document.getElementById('checkout-close').onclick = ()=> document.getElementById('checkout-overlay').remove();
  document.getElementById('copy-order-btn').onclick = copyOrderText;
}

init();