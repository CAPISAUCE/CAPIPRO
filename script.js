<script>
/* ================== CONFIG ================== */
const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxab8-ziPP2u5oAhQJKBzxzhrc54-Qz_s4xAzbLg_on1Wl5Z9zthTNPxwVSWUylBCoz/exec";
const PHONE_KG = "996503971822";
const EXCHANGE_KGS_PER_USD = 89;

/* Idioma por defecto: KY (respeta localStorage si ya existe) */
let lang = localStorage.getItem("capi_lang") || "ky";

/* ================== DATA ================== */
const PRODUCTS = [
  { 
    id:"honey", 
    img:"honey_logo.png", 
    name:{
      ky:"Таза бал Issyk Kul", 
      ru:"Чистый мёд Issyk Kul", 
      es:"Miel Pura Issyk Kul", 
      en:"Pure Honey Issyk Kul"
    }, 
    sizes:[
      {ml:350,usd:4.0},
      {ml:500,usd:6.3},
      {ml:1000,usd:10.0}
    ] 
  },
  { 
    id:"mango", 
    img:"mango_logo.png", 
    name:{
      ky:"Жашыл манго ачуу соусу (Premium)",
      ru:"Острый соус из зелёного манго (Premium)",
      es:"Salsa Picante de Mango Verde (Premium)",
      en:"Green Mango Hot Sauce (Premium)"
    }, 
    sizes:[
      {ml:350,usd:4.0},
      {ml:500,usd:9.0},
      {ml:1000,usd:20.0}
    ] 
  },
  { 
    id:"pepper_red", 
    img:"redpepper_logo.png", 
    name:{
      ky:"Кызыл калемпир соусу",
      ru:"Соус из красного перца",
      es:"Salsa de Pimientos Rojos",
      en:"Red Pepper Sauce"
    }, 
    sizes:[
      {ml:350,usd:2.8},
      {ml:500,usd:6.0},
      {ml:1000,usd:12.0}
    ] 
  },
  { 
    id:"pepper_green", 
    img:"greenpepper_logo.png", 
    name:{
      ky:"Жашыл калемпир соусу",
      ru:"Соус из зелёного перца",
      es:"Salsa de Pimientos Verdes",
      en:"Green Pepper Sauce"
    }, 
    sizes:[
      {ml:350,usd:2.8},
      {ml:500,usd:6.0},
      {ml:1000,usd:12.0}
    ] 
  }
];

const T = {
  title:{ ky:"Продукциялар 100% табигый", ru:"Продукция 100% натуральная", es:"Productos 100% Natural", en:"100% Natural Products" },
  prices_note:{ ky:"Баалар USD жана KGS менен. Өлчөмдү өзгөртүп бааны көрүңүз.", ru:"Цены в USD и сомах. Меняйте объём, чтобы увидеть цену.", es:"Precios en USD y KGS. Cambia el tamaño para ver el precio.", en:"Prices in USD and KGS. Change size to see price." },
  cart:{ ky:"Себет", ru:"Корзина", es:"Tu carrito", en:"Your cart" },
  add:{ ky:"Себетке кошуу", ru:"В корзину", es:"Agregar al carrito", en:"Add to cart" },
  remove:{ ky:"Өчүрүү", ru:"Удалить", es:"Eliminar", en:"Remove" },
  empty_cart:{ ky:"Себет бош", ru:"Корзина пуста", es:"El carrito está vacío", en:"Cart is empty" },
  confirm:{ ky:"Буйрутманы тастыктоо", ru:"Подтвердить заказ", es:"Confirmar pedido", en:"Confirm order" },
  price_lbl:{ ky:"Баасы:", ru:"Цена:", es:"Precio:", en:"Price:" },
  /* ✅ ACTUALIZADO: frase larga con emojis en 4 idiomas */
  fill_required:{ 
    ky:"👇🏼🐝Тапшырманы ырастоо үчүн бардык милдеттүү талааларды толтуруңуз🐝👇🏼", 
    ru:"👇🏼🐝Пожалуйста, заполните все обязательные поля для подтверждения заказа🐝👇🏼", 
    es:"👇🏼🐝Por favor, complete los campos obligatorios para confirmar el pedido🐝👇🏼", 
    en:"👇🏼🐝Please fill in the required fields to confirm the order🐝👇🏼" 
  },
  name_ph:{ ky:"Атыңыз", ru:"Ваше имя", es:"Tu nombre", en:"Your name" },
  phone_ph:{ ky:"Телефонуңуз", ru:"Ваш телефон", es:"Tu teléfono", en:"Your phone" },
  email_ph:{ ky:"Электрон почта", ru:"Электронная почта", es:"Tu email", en:"Your email" }
};
/* ================== HELPERS ================== */
function kgs(usd){ return Math.round(usd*EXCHANGE_KGS_PER_USD); }
function money(n){ return (Math.round(n*100)/100).toFixed(2); }
function genOrderId(){ return "CAPI-" + Math.random().toString(16).slice(2,10).toUpperCase(); }
function sendToSheets(order){
  try{
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(order)], { type: "text/plain;charset=utf-8" });
      navigator.sendBeacon(SHEETS_WEBAPP_URL, blob);
      return;
    }
  }catch(_){}
  try{
    fetch(SHEETS_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(order)
    });
  }catch(_){}
}

/* ======== NUEVO: limpiar datos del cliente ======== */
function clearCheckoutForm(){
  const ids = ["custName","custPhone","custEmail"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const err = document.getElementById("formError");
  if (err) err.style.display = "none";
  const btn = document.getElementById("confirm");
  if (btn) btn.disabled = true;
  if (typeof validateForm === "function") validateForm();
}

/* ================== STATE ================== */
let cart = [];
let iti = null; // 📞 instancia global para intl-tel-input

/* ================== UI ================== */
function i18n(){
  document.getElementById("slogan").textContent = T.title[lang];
  document.getElementById("pricesNote").textContent = T.prices_note[lang];
  document.getElementById("cartTxt").textContent = T.cart[lang];
  document.getElementById("cartTitle").textContent = T.cart[lang];
  document.getElementById("confirm").textContent = "✅ " + T.confirm[lang];

  // placeholders
  document.getElementById("custName").placeholder  = T.name_ph[lang];
  document.getElementById("custPhone").placeholder = T.phone_ph[lang];
  document.getElementById("custEmail").placeholder = T.email_ph[lang];

  /* ✅ NUEVO: aviso fijo traducido */
  const notice = document.getElementById("formNotice");
  if (notice) notice.textContent = T.fill_required[lang];

  // error dinámico
  const err = document.getElementById("formError");
  if (err) err.textContent = "🐝 " + T.fill_required[lang];
}
function renderProducts(){
  const root = document.getElementById("products");
  root.innerHTML = "";
  PRODUCTS.forEach(p=>{
    const card = document.createElement("div"); card.className="card";
    if (p.img) {
      const img = document.createElement("img");
      img.src = p.img; img.alt = p.name[lang];
      img.onerror = ()=>{ img.remove(); };
      img.className = "product-image";
      card.appendChild(img);
    }
    const h3 = document.createElement("h3"); h3.textContent = p.name[lang]; card.appendChild(h3);
    const sel = document.createElement("select");
    p.sizes.forEach((s,i)=>{ const o=document.createElement("option"); o.value=s.ml; o.textContent=`${s.ml} ml`; sel.appendChild(o); if(i===0) sel.value=s.ml; });
    card.appendChild(sel);
    const price = document.createElement("div");
    const s0 = p.sizes[0]; price.innerHTML = `${T.price_lbl[lang]} ${kgs(s0.usd)} сом / $${money(s0.usd)}`;
    card.appendChild(price);
    sel.onchange = ()=> {
      const s = p.sizes.find(x=>x.ml==sel.value);
      price.innerHTML = `${T.price_lbl[lang]} ${kgs(s.usd)} сом / $${money(s.usd)}`;
    };
    const controls = document.createElement("div"); controls.className="qty";
    const dec = document.createElement("button"); dec.textContent="−";
    const q = document.createElement("span"); q.className="q"; q.textContent="1";
    const inc = document.createElement("button"); inc.textContent="+";

    // ✅ Limitar cantidades (mín 1, máx 20)
    const MAX_QTY = 20;
    dec.onclick = ()=>{ q.textContent = Math.max(1, parseInt(q.textContent)-1); };
    inc.onclick = ()=>{
      const current = parseInt(q.textContent);
      if (current < MAX_QTY) {
        q.textContent = current + 1;
      }
    };

    controls.append(dec,q,inc); card.appendChild(controls);
    const add = document.createElement("button"); add.className="btn mango"; add.textContent = T.add[lang];
    add.onclick = ()=>{
      const size = parseInt(sel.value,10);
      const unit = p.sizes.find(x=>x.ml===size).usd;
      addToCart(p.id, p.name[lang], size, parseInt(q.textContent,10), {usd:unit,kgs:kgs(unit)});
    };
    card.appendChild(add);
    root.appendChild(card);
  });
}

function addToCart(id, name, size, qty, price){
  const key = id + "-" + size + "-" + Date.now() + "-" + Math.random().toString(16).slice(2,6);
  cart.push({ key, id, name, size, qty, price });
  updateCart();
}

function updateCart(){
  const items = document.getElementById("cartItems");
  const count = document.getElementById("cartCount");
  items.innerHTML = "";
  let totUSD=0, totKGS=0;

  cart.forEach((it,idx)=>{
    const row = document.createElement("div");
    row.className = "row";

     const icon = it.id === "honey" ? "🍯" 
            : it.id === "mango" ? "🥭🌶️" 
            : it.id === "pepper_red" ? "🍅"     
            : it.id === "pepper_green" ? "🫑"   
            : "•";

    row.innerHTML = `<span>${icon} ${it.name} ${it.size} ml x${it.qty} (${it.price.kgs} сом / $${money(it.price.usd)})</span>`;

    const rm = document.createElement("button");
    rm.className = "btn-remove";
    rm.textContent = "🗑";
    rm.onclick = ()=>{ cart.splice(idx,1); updateCart(); };

    row.appendChild(rm);
    items.appendChild(row);

    totUSD += it.price.usd * it.qty;
    totKGS += it.price.kgs * it.qty;
  });

  document.getElementById("totals").textContent = `TOTAL: ${totKGS} сом / $${money(totUSD)}`;

  if(cart.length > 0){
    count.style.display = "inline-block";
    count.textContent = cart.reduce((a,c)=>a+c.qty,0);
  } else {
    count.style.display = "none";
  }
}

function openCart(){
  document.getElementById("cart").classList.add("open");
  document.body.classList.add("no-scroll");
}
function closeCart(){
  document.getElementById("cart").classList.remove("open");
  document.body.classList.remove("no-scroll");
}
function toggleCart(){
  const el = document.getElementById("cart");
  const willOpen = !el.classList.contains("open");
  el.classList.toggle("open");
  document.body.classList.toggle("no-scroll", willOpen);
}

function confirmOrder(){
  if(cart.length===0){ 
    alert(T.empty_cart[lang] + " — TOTAL: $0 / 0 сом"); 
    return; 
  }

  const name  = document.getElementById("custName").value.trim();
  const email = document.getElementById("custEmail").value.trim();
  const phoneInput = document.getElementById("custPhone");
  const err   = document.getElementById("formError");

  let phone = "";
  if (iti && iti.isValidNumber()) {
    phone = iti.getNumber(); 
    const type = iti.getNumberType();
    if (type !== intlTelInputUtils.numberType.MOBILE) {
      phoneInput.classList.add("input-error");
      return;
    } else {
      phoneInput.classList.remove("input-error");
    }
  } else {
    phoneInput.classList.add("input-error");
    return; 
  }

  if (!name || !email) {
    if (err) {
      err.textContent = "🐝 " + T.fill_required[lang];
      err.style.display = "block";
    }
    return;
  } else {
    if (err) err.style.display = "none";
  }

  let msg = "🧾 " + T.cart[lang] + ":\n";
  let totUSD=0, totKGS=0;
  cart.forEach(it=>{ 
    const subU=it.price.usd*it.qty, subK=it.price.kgs*it.qty;
    msg += `• ${it.name} (${it.size} ml) x${it.qty} = ${subK} сом / $${money(subU)}\n`;
    totUSD += subU; totKGS += subK; 
  });
  msg += `\nTOTAL: ${totKGS} сом / $${money(totUSD)}`;
  const orderId = genOrderId(); 
  msg += `\n\nID: ${orderId}`;

  const payload = { 
    orderId, 
    alive:true, 
    version:"orders-v4-clean+invoices", 
    to: PHONE_KG + "," + PHONE_US,
    totalUSD:Number(money(totUSD)), 
    totalKGS:Number(totKGS), 
    currency:"USD/KGS", 
    lang,
    items: cart.map(it=>({id:it.id,name:it.name,ml:Number(it.size),qty:Number(it.qty),usd:Number(it.price.usd),kgs:Number(it.price.kgs)})),
    created_at:new Date().toISOString(),
    customer:name,
    phone:phone,   
    email:email,
    autoInvoice:true
  };

  sendToSheets(payload);

  clearCheckoutForm();

  const enc = encodeURIComponent(msg);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const urlKG = isMobile ? `whatsapp://send?phone=${PHONE_KG}&text=${enc}` : `https://wa.me/${PHONE_KG}?text=${enc}`; 
  window.open(urlKG,"_blank");
  const urlUS = isMobile ? `whatsapp://send?phone=${PHONE_US}&text=${enc}` : `https://wa.me/${PHONE_US}?text=${enc}`; 
  setTimeout(()=>window.open(urlUS,"_blank"),500);

  cart = []; 
  updateCart(); 
  closeCart();
}

/* ================== INIT ================== */
if ('serviceWorker' in navigator) { 
  navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())); 
}

window.addEventListener("load", () => {
  try {
    const sel = document.getElementById("lang");
    sel.value = lang;
    sel.onchange = (e)=>{ 
      lang = e.target.value; 
      localStorage.setItem("capi_lang",lang); 
      i18n(); renderProducts(); updateCart(); 
    };

    document.getElementById("btnCart").onclick = openCart;
    document.getElementById("closeCart").onclick = closeCart;
    document.getElementById("backdrop").onclick = closeCart;
    document.addEventListener("keydown", (e)=>{ if(e.key==="Escape") closeCart(); });
    document.getElementById("confirm").onclick = confirmOrder;

    i18n(); renderProducts(); updateCart();
    fetch(SHEETS_WEBAPP_URL).catch(()=>{});

    // === intl-tel-input inicialización ===
const phoneInput = document.querySelector("#custPhone");
if (phoneInput) {
  iti = window.intlTelInput(phoneInput, {
    initialCountry: "kg",
    preferredCountries: ["kg","us","es","kz","ru"],
    dropdownContainer: document.body,
    separateDialCode: true,
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js"
  });

  // 🚀 Arranca en rojo
  phoneInput.classList.add("input-error");

  // 🚫 Bloquear letras y limitar a 15 dígitos + validar recuadro
  phoneInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9+]/g, "");
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 15) {
      e.target.value = "+" + raw.slice(0, 15);
    }

    // 🔄 Recuadro rojo ON/OFF
    if (phoneInput.value.trim() && iti.isValidNumber()) {
      phoneInput.classList.remove("input-error"); // ✅ se apaga
    } else {
      phoneInput.classList.add("input-error");    // 🔴 sigue rojo
    }
  });
}

    // === Validación de campos obligatorios ===
const inputs = ["custName","custPhone","custEmail"].map(id => document.getElementById(id));
const phoneEl = document.getElementById("custPhone");

// ✅ Función de validación general
function validateForm(){
  const nameEl  = document.getElementById("custName");
  const emailEl = document.getElementById("custEmail");

  const name  = nameEl.value.trim();
  const email = emailEl.value.trim();

  const nameValid  = (name.length > 1); // mínimo 2 caracteres
  const phoneValid = (iti && iti.isValidNumber());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const filled = (nameValid && emailValid && phoneValid);
  document.getElementById("confirm").disabled = !filled;

  // ✔ verde (SVG incrustado)
  const checkSvg = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23008000' d='M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.29 7.71l-1.41-1.41z'/></svg>\")";

  // aplicar ✔ o nada según validación
  nameEl.style.backgroundImage  = nameValid  ? checkSvg : "none";
  emailEl.style.backgroundImage = emailValid ? checkSvg : "none";
  phoneEl.style.backgroundImage = phoneValid ? checkSvg : "none";

  [nameEl, phoneEl, emailEl].forEach(el => {
    el.style.backgroundRepeat   = "no-repeat";
    el.style.backgroundPosition = "right 10px center";
    el.style.backgroundSize     = "18px 18px";
  });
}

// ✅ Teléfono (limita a 15 dígitos y aplica ✔ verde)
function checkPhoneValidity(){
  if (!phoneEl || !iti) return;

  let raw = iti.getNumber().replace(/\D/g, "");
  if (raw.length > 15) {
    raw = raw.slice(0, 15);
    iti.setNumber("+" + raw);
  }

  const valid = iti.isValidNumber();
  const checkSvg = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23008000' d='M9 16.17l-3.88-3.88-1.41 1.41L9 19 20.29 7.71l-1.41-1.41z'/></svg>\")";
  phoneEl.style.backgroundImage = valid ? checkSvg : "none";
  phoneEl.style.backgroundRepeat   = "no-repeat";
  phoneEl.style.backgroundPosition = "right 10px center";
  phoneEl.style.backgroundSize     = "18px 18px";
}

// === Eventos ===
inputs.forEach(i => {
  i.addEventListener("input", validateForm);
  i.addEventListener("change", validateForm); // cubre autofill básico
});

if (phoneEl) {
  phoneEl.addEventListener("input", () => { 
    checkPhoneValidity(); 
    validateForm(); 
  });
  phoneEl.addEventListener("countrychange", () => { 
    checkPhoneValidity(); 
    validateForm(); 
  });
}

// Validación inicial
validateForm();
setTimeout(validateForm, 500); // re-chequeo por si hay autofill tardío

// 👇 Extra: Safari/iOS autofill (dispara validateForm cuando Safari rellena)
inputs.forEach(i => {
  i.addEventListener("animationstart", (e) => {
    if (e.animationName === "onAutoFillStart") {
      validateForm(); // fuerza la actualización de los ✔
    }
  });
});

  } catch(e) {
    console.error("Init error:", e);
    document.getElementById("products").innerHTML = 
      "<div class='card'>Перезагрузите страницу / Vuelva a cargar la página.</div>";
  }
});

</script>
