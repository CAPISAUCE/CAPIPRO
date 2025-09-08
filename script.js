<script>
let cart = [];
let currentLang = 'ky';

// === CONFIGURACIÓN WHATSAPP + GOOGLE SHEETS ===
const PHONE_KG = "996559500551";   // Kyrgyzstan
const PHONE_US = "17866514487";    // Estados Unidos
const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzd7c-3ydfb-HD2mMvYVDxOIc6rgEbcbYktfU5z6WCSDXdGItuiU9Vx8K6onKh0_8tw/exec";

// === Traducciones ===
const translations = {
  honey: { ky:"таза Бал Issyk-Kul", ru:"Чистый мед Issyk-Kul", es:"Miel Pura Issyk-Kul", en:"Pure Honey Issyk-Kul" },
  mango_sauce: { ky:"Ачытуу манго соусу", ru:"Острый соус из манго", es:"Salsa Picante de Mango Verde", en:"Green Mango Hot Sauce" },
  price: { ky:"Баасы:", ru:"Цена:", es:"Precio:", en:"Price:" },
  confirm_order: { ky:"Буйрутманы ырастоо", ru:"Подтвердить заказ", es:"Confirmar pedido", en:"Confirm order" },
  your_cart: { ky:"Себетиңиз", ru:"Ваша корзина", es:"Tu carrito", en:"Your cart" },
  add_to_cart: { ky:"Себетке кошуу", ru:"Добавить в корзину", es:"Agregar al carrito", en:"Add to cart" },
  remove: { ky:"Өчүрүү", ru:"Удалить", es:"Eliminar", en:"Remove" },
  cart_empty: { ky:"Себетиңиз бош", ru:"Ваша корзина пустая", es:"Tu carrito está vacío", en:"Your cart is empty" },

  // Campos obligatorios
  required_fields: {
    ky: "⚠️ Талап кылынган талааларды толтуруңуз (аты, телефон, email).",
    ru: "⚠️ Пожалуйста, заполните обязательные поля (имя, телефон, email).",
    es: "⚠️ Debe completar los campos obligatorios (nombre, teléfono, email).",
    en: "⚠️ Please fill in the required fields (name, phone, email)."
  },

  // Placeholders
  ph_name:   { ky:"Атыңыз", ru:"Имя", es:"Nombre", en:"Name" },
  ph_phone:  { ky:"Телефон", ru:"Телефон", es:"Teléfono", en:"Phone" },
  ph_email:  { ky:"Электрондук почта", ru:"Эл. почта", es:"Email", en:"Email" }
};

const products = [
  { id:"honey", sizes: { "350":{kgs:349,usd:4.0}, "500":{kgs:550,usd:6.3}, "1000":{kgs:874,usd:10.0} } },
  { id:"mango_sauce", sizes: { "350":{kgs:349,usd:4.0}, "500":{kgs:787,usd:9.0}, "1000":{kgs:1748,usd:20.0} } }
];

// === Traducción dinámica ===
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  // Actualiza textos
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] && translations[key][lang]) el.textContent = translations[key][lang];
  });

  // Actualiza placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (translations[key] && translations[key][lang]) el.placeholder = translations[key][lang];
  });

  renderProducts();
  renderCart();
}

// === Render productos ===
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

// === Carrito ===
function addToCart(id, name, size, quantity, price) {
  const index = cart.findIndex(item => item.id === id && item.size === size);
  if (index > -1) cart[index].quantity += quantity;
  else cart.push({ id, name, size, quantity, price });
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const list = document.getElementById("cart-items");
  list.innerHTML = "";
  let totalKGS = 0, totalUSD = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    const icon = item.id === "honey" ? "🍯" : "🌶️";
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
}

// === Confirmar pedido ===
let sending = false;
function confirmOrder() {
  if (sending) return;
  if (cart.length === 0) {
    alert(translations.cart_empty[currentLang]);
    return;
  }

  // Datos cliente
  const customerName  = document.getElementById("customerName").value.trim();
  const customerPhone = document.getElementById("customerPhone").value.trim();
  const customerEmail = document.getElementById("customerEmail").value.trim();

  if (!customerName || !customerPhone || !customerEmail) {
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

  const orderId = genOrderId();
  message += `\n\nID: ${orderId}`;

  const payload = {
    orderId,
    alive:true,
    version:"orders-v4-clean+invoices",
    to: PHONE_KG + "," + PHONE_US,
    totalUSD:Number(totalUSD.toFixed(2)),
    totalKGS:Number(totalKGS),
    currency:"USD/KGS",
    lang: currentLang,
    items: cart,
    created_at:new Date().toISOString(),
    customer: customerName,
    phone: customerPhone,
    email: customerEmail,
    autoInvoice: true
  };

  sendToSheets(payload);

  const encoded = encodeURIComponent(message);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const urlKG = isMobile ? `whatsapp://send?phone=${PHONE_KG}&text=${encoded}`
                         : `https://wa.me/${PHONE_KG}?text=${encoded}`;
  window.open(urlKG, "_blank");

  const urlUS = isMobile ? `whatsapp://send?phone=${PHONE_US}&text=${encoded}`
                         : `https://wa.me/${PHONE_US}?text=${encoded}`;
  setTimeout(()=>window.open(urlUS, "_blank"), 500);

  cart = [];
  renderCart();
  sending = false;
}

// === Helpers ===
function genOrderId(){
  return "CAPIFAN-" + Math.random().toString(16).slice(2,10).toUpperCase();
}

function sendToSheets(order){
  fetch(SHEETS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  }).catch(err => console.error("Fetch error:", err));
}

window.onload = () => setLanguage(currentLang);
</script>
