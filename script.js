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

  // ⚠️ Campos obligatorios
  required_fields: {
    ky: "⚠️ Талап кылынган талааларды толтуруңуз (аты, телефон, email).",
    ru: "⚠️ Пожалуйста, заполните обязательные поля (имя, телефон, email).",
    es: "⚠️ Debe completar los campos obligatorios (nombre, teléfono, email).",
    en: "⚠️ Please fill in the required fields (name, phone, email)."
  },

  // ✅ Placeholders
  ph_name:   { ky:"Атыңыз", ru:"Имя", es:"Nombre", en:"Name" },
  ph_phone:  { ky:"Телефон", ru:"Телефон", es:"Teléfono", en:"Phone" },
  ph_email:  { ky:"Электрондук почта", ru:"Эл. почта", es:"Email", en:"Email" }
};

// === Solo añadimos actualización de placeholders ===
function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] && translations[key][lang]) el.textContent = translations[key][lang];
  });

  // 👉 placeholders
  const nameInput  = document.getElementById("customerName");
  const phoneInput = document.getElementById("customerPhone");
  const emailInput = document.getElementById("customerEmail");
  if(nameInput)  nameInput.placeholder  = translations.ph_name[currentLang];
  if(phoneInput) phoneInput.placeholder = translations.ph_phone[currentLang];
  if(emailInput) emailInput.placeholder = translations.ph_email[currentLang];

  renderProducts();
  renderCart();
}

// ===================== confirmOrder =====================
let sending = false;
function confirmOrder() {
  if (sending) return;
  if (cart.length === 0) {
    alert("🛒 CAPIFAN " + translations["cart_empty"][currentLang]);
    return;
  }

  // ✅ Validación de campos
  const customerName  = document.getElementById("customerName")?.value.trim();
  const customerPhone = document.getElementById("customerPhone")?.value.trim();
  const customerEmail = document.getElementById("customerEmail")?.value.trim();

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

  const payload = buildOrderPayload(cart, currentLang, {
    customer: customerName,
    phone: customerPhone,
    email: customerEmail
  });

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
  updateCartCount();
  sending = false;
}

// ===================== buildOrderPayload =====================
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
    customer: client.customer || "",
    phone: client.phone || "",
    email: client.email || "",
    autoInvoice: true
  };
}
</script>
