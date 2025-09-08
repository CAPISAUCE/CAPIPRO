<script>
let cart = [];
let currentLang = 'ky';

// === CONFIGURACIÓN WHATSAPP + GOOGLE SHEETS ===
const PHONE_KG = "996559500551";   // Kyrgyzstan
const PHONE_US = "17866514487";    // Estados Unidos
const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzd7c-3ydfb-HD2mMvYVDxOIc6rgEbcbYktfU5z6WCSDXdGItuiU9Vx8K6onKh0_8tw/exec";
console.log("Sheets URL:", SHEETS_WEBAPP_URL);
fetch(SHEETS_WEBAPP_URL + "?route=health").then(r => r.text()).then(t => console.log("Ping /health:", t));

const translations = {
  honey: { ky:"таза Бал Issyk-Kul", ru:"Чистый мед Issyk-Kul", es:"Miel Pura Issyk-Kul", en:"Pure Honey Issyk-Kul" },
  mango_sauce: { ky:"Ачытуу манго соусу", ru:"Острый соус из манго", es:"Salsa Picante de Mango Verde", en:"Green Mango Hot Sauce" },
  slogan: { ky:"100% табигый продуктылар", ru:"100% натуральные продукты", es:"Productos 100% Naturales", en:"100% Natural Products" },
  price: { ky:"Баасы:", ru:"Цена:", es:"Precio:", en:"Price:" },
  confirm_order: { ky:"Буйрутманы ырастоо", ru:"Подтвердить заказ", es:"Confirmar pedido", en:"Confirm order" },
  your_cart: { ky:"Себетиңиз", ru:"Ваша корзина", es:"Tu carrito", en:"Your cart" },
  add_to_cart: { ky:"Себетке кошуу", ru:"Добавить в корзину", es:"Agregar al carrito", en:"Add to cart" },
  remove: { ky:"Өчүрүү", ru:"Удалить", es:"Eliminar", en:"Remove" },
  cart_empty: { ky:"Себетиңиз бош", ru:"Ваша корзина пустая", es:"Tu carrito está vacío", en:"Your cart is empty" },

  // ✅ Mensaje de campos obligatorios
  required_fields: {
    ky: "Талап кылынган талааларды толтуруңуз (аты, телефон, email).",
    ru: "Пожалуйста, заполните обязательные поля (имя, телефон, email).",
    es: "Debe completar los campos obligatorios (nombre, teléfono, email).",
    en: "Please fill in the required fields (name, phone, email)."
  }
};

const products = [
  { id:"honey", sizes: { "350":{kgs:349,usd:4.0}, "500":{kgs:550,usd:6.3}, "1000":{kgs:874,usd:10.0} } },
  { id:"mango_sauce", sizes: { "350":{kgs:349,usd:4.0}, "500":{kgs:787,usd:9.0}, "1000":{kgs:1748,usd:20.0} } }
];

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] && translations[key][lang]) el.textContent = translations[key][lang];
  });
  renderProducts();
  renderCart();
}

function renderProducts() {
  const list = document.getElementById("product-list");
  list.innerHTML = "";
  products.forEach(product => {
    const div = document.createElement("div");
    div.className = "product";

    const name = translations[product.id][currentLang];

    const img = document.createElement("img");
    img.src = product.id === "honey" ? "honey_logo.png" : "mango_logo.png";
    img.alt = name;
    img.className = "product-image";
    div.appendChild(img);

    const title = document.createElement("h2");
    title.textContent = name;
    div.appendChild(title);

    const selector = document.createElement("select");
    selector.className = "size-selector";
    for (let size in product.sizes) {
      const opt = document.createElement("option");
      opt.value = size;
      opt.textContent = size + " ml";
      selector.appendChild(opt);
    }
    div.appendChild(selector);

    const priceLabel = document.createElement("p");
    priceLabel.className = "price-label";
    const firstSize = Object.keys(product.sizes)[0];
    priceLabel.textContent =
      translations["price"][currentLang] + " " +
      product.sizes[firstSize].kgs + " сом / $" + product.sizes[firstSize].usd;
    div.appendChild(priceLabel);

    selector.onchange = () => {
      const size = selector.value;
      const price = product.sizes[size];
      priceLabel.textContent =
        translations["price"][currentLang] + " " +
        price.kgs + " сом / $" + price.usd;
    };

    const controls = document.createElement("div");
    controls.innerHTML = `
      <button class="decrease">−</button>
      <span class="quantity">1</span>
      <button class="increase">+</button>
    `;
    div.appendChild(controls);

    controls.querySelector(".decrease").onclick = () => {
      let q = controls.querySelector(".quantity");
      let val = parseInt(q.textContent);
      if (val > 1) q.textContent = val - 1;
    };
    controls.querySelector(".increase").onclick = () => {
      let q = controls.querySelector(".quantity");
      q.textContent = parseInt(q.textContent) + 1;
    };

    const addBtn = document.createElement("button");
    addBtn.textContent = translations["add_to_cart"][currentLang];
    addBtn.onclick = () => {
      const size = selector.value;
      const quantity = parseInt(controls.querySelector(".quantity").textContent);
      const name = translations[product.id][currentLang];
      const price = product.sizes[size];
      addToCart(product.id, name, size, quantity, price);
    };
    div.appendChild(addBtn);

    list.appendChild(div);
  });
}

function addToCart(id, name, size, quantity, price) {
  const index = cart.findIndex(item => item.id === id && item.name === name && item.size === size);
  if (index > -1) cart[index].quantity += quantity;
  else cart.push({ id, name, size, quantity, price });
  renderCart();
  animateCartBadge();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
  shakeCartBadge();
}

function renderCart() {
  const list = document.getElementById("cart-items");
  list.innerHTML = "";
  let totalKGS = 0, totalUSD = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");

    const icon = item.id === "honey" ? "🍯" : item.id === "mango_sauce" ? "🌶️" : "•";

    li.innerHTML = `
      <span>${icon} ${item.name} ${item.size} ml x${item.quantity}
        (${item.price.kgs} сом / $${item.price.usd})
      </span>
      <button class="btn" data-index="${index}">${translations["remove"][currentLang]}</button>
    `;
    li.querySelector("button.btn").onclick = () => removeItem(index);

    list.appendChild(li);

    totalKGS += item.quantity * item.price.kgs;
    totalUSD += item.quantity * item.price.usd;
  });

  document.getElementById("cart-total").innerHTML =
    `<strong>TOTAL: ${totalKGS} сом / $${totalUSD.toFixed(2)}</strong>`;
  updateCartCount();
}

function toggleCart(){
  const pop = document.getElementById("cart-popup");
  const isHidden = pop.classList.contains("hidden");
  if (isHidden){
    pop.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    pop.scrollTop = 0;
    window.scrollTo(0,0);
  }else{
    pop.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }
}

// ===================== helper para datos de cliente =====================
function getFieldOrPrompt(inputId, promptLabel, def="") {
  const el = document.getElementById(inputId);
  if (el && el.value && el.value.trim()) return el.value.trim();
  const v = window.prompt(promptLabel, def);
  return (v && v.trim()) ? v.trim() : def;
}

// ===================== confirmOrder() =====================
let sending = false;
function confirmOrder() {
  if (sending) return;
  if (cart.length === 0) {
    // === Leer campos de cliente ===
const customerName  = document.getElementById("customerName").value.trim();
const customerPhone = document.getElementById("customerPhone").value.trim();
const customerEmail = document.getElementById("customerEmail").value.trim();

if (!customerName || !customerPhone || !customerEmail) {
  alert("⚠️ Debe rellenar todos los campos obligatorios para confirmar el pedido.");
  return;
}

  const customerName = getFieldOrPrompt("customerName", "Nombre del cliente:", "");
  const customerEmail = getFieldOrPrompt("customerEmail", "Email del cliente:", "");
  const customerPhone = getFieldOrPrompt("customerPhone", "Teléfono del cliente:", "");

  // ✅ Validación obligatoria
  if (!customerName || !customerEmail || !customerPhone) {
    alert(translations.required_fields[currentLang]);
    return;
  }

  sending = true;

  let message = "🧾 CAPIFAN " + translations["your_cart"][currentLang] + ":\n";
  let totalKGS = 0, totalUSD = 0;

  cart.forEach(item => {
    const subKGS = item.price.kgs * item.quantity;
    const subUSD = item.price.usd * item.quantity;
    message += `• ${item.name} (${item.size} ml) x${item.quantity} = ${subKGS} сом / $${subUSD.toFixed(2)}\n`;
    totalKGS += subKGS;
    totalUSD += subUSD;
  });
  message += `\nTOTAL: ${totalKGS} сом / $${totalUSD.toFixed(2)}`;

  const payload = buildOrderPayload(cart, currentLang, {
    customer: customerName,
    email: customerEmail,
    phone: customerPhone
  });
  message += `\n\nID: ${payload.orderId}`;

  sendToSheets(payload);

  const encoded = encodeURIComponent(message);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const urlKG = isMobile
    ? `whatsapp://send?phone=${PHONE_KG}&text=${encoded}`
    : `https://wa.me/${PHONE_KG}?text=${encoded}`;
  window.open(urlKG, "_blank");

  const urlUS = isMobile
    ? `whatsapp://send?phone=${PHONE_US}&text=${encoded}`
    : `https://wa.me/${PHONE_US}?text=${encoded}`;
  setTimeout(()=>window.open(urlUS, "_blank"), 500);

  cart = [];
  renderCart();
  updateCartCount();
  const popup = document.getElementById("cart-popup");
  if (popup && !popup.classList.contains("hidden")) popup.classList.add("hidden");
  sending = false;
}

// ===================== buildOrderPayload() =====================
function genOrderId(){
  return "CAPIFAN-" + Math.random().toString(16).slice(2,10).toUpperCase();
}

function buildOrderPayload(cart, lang, client = {}) {
  let totalUSD = 0, totalKGS = 0;
  const items = cart.map(i=>{
    const lineUSD = i.price.usd * i.quantity;
    const lineKGS = i.price.kgs * i.quantity;
    totalUSD += lineUSD; totalKGS += lineKGS;
    return {
      id:   i.id,
      name: i.name,
      ml:   Number(i.size),
      qty:  Number(i.quantity),
      usd:  Number(i.price.usd),
      kgs:  Number(i.price.kgs)
    };
  });
  return {
    orderId:  genOrderId(),
    alive:    true,
    version: "orders-v4-clean+invoices",
    to:       "996559500551,17866514487",
    totalUSD: Number(totalUSD.toFixed(2)),
    totalKGS: Number(totalKGS),
    currency: "USD/KGS",
    lang,
    items,
    created_at: new Date().toISOString(),

    // ✅ Incluye datos de cliente
    customer: client.customer || "",
    email:    client.email || "",
    phone:    client.phone || "",
    autoInvoice: true
  };
}

function sendToSheets(order){
  fetch(SHEETS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  })
  .then(r => r.json())
  .then(res => {
    console.log("Sheets response:", res);
    if (!res.ok) console.warn("Apps Script error:", res.error);
    if (res.pdfUrl) console.log("Invoice PDF:", res.pdfUrl);
  })
  .catch(err => console.error("Fetch error:", err));
}

function retryPendingSales() {
  const q = JSON.parse(localStorage.getItem("sales_pending") || "[]");
  if (!q.length) { alert("No hay ventas pendientes."); return; }
  const next = q.shift();

  fetch(SHEETS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(next)
  })
  .then(r => r.json().catch(()=>({ok:true})))
  .then(resp => {
    if (resp.ok) alert("Venta reenviada a Sheets.");
    else throw new Error(resp.error || "Sheets error");
  })
  .catch(() => alert("Sigue fallando, intenta más tarde."))
  .finally(() => localStorage.setItem("sales_pending", JSON.stringify(q)));
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  if (count > 0) {
    badge.style.display = "inline-block";
    badge.textContent = count;
  } else {
    badge.style.display = "none";
  }
}
function animateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  badge.classList.remove("bounce");
  void badge.offsetWidth;
  badge.classList.add("bounce");
}
function shakeCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  badge.classList.remove("shake");
  void badge.offsetWidth;
  badge.classList.add("shake");
}

window.onload = () => {
  setLanguage(currentLang);
};
</script>
