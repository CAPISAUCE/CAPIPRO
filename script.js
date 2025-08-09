let cart = [];
let currentLang = 'ky';

// === CONFIGURACIÓN WHATSAPP + GOOGLE SHEETS ===
const PHONE_KG = "996559500551";   // Kyrgyzstan
const PHONE_US = "17866514487";    // Estados Unidos
const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/TU_SCRIPT_ID/exec"; // ← REEMPLAZA

const translations = {
  honey: {
    ky: "Бал",
    ru: "Мёд",
    es: "Miel",
    en: "Honey"
  },
  mango_sauce: {
    ky: "Ачытуу манго соусу",
    ru: "Острый соус из манго",
    es: "Salsa Picante de Mango Verde",
    en: "Green Mango Hot Sauce"
  },
  slogan: {
    ky: "100% табигый продуктылар",
    ru: "100% натуральные продукты",
    es: "Productos 100% Naturales",
    en: "100% Natural Products"
  },
  price: {
    ky: "Баасы:",
    ru: "Цена:",
    es: "Precio:",
    en: "Price:"
  },
  confirm_order: {
    ky: "Буйрутманы ырастоо",
    ru: "Подтвердить заказ",
    es: "Confirmar pedido",
    en: "Confirm order"
  },
  your_cart: {
    ky: "Себетиңиз",
    ru: "Ваша корзина",
    es: "Tu carrito",
    en: "Your cart"
  },
  add_to_cart: {
    ky: "Себетке кошуу",
    ru: "Добавить в корзину",
    es: "Agregar al carrito",
    en: "Add to cart"
  },
  remove: {
    ky: "Өчүрүү",
    ru: "Удалить",
    es: "Eliminar",
    en: "Remove"
  },
  cart_empty: {
    ky: "Себетиңиз бош",
    ru: "Ваша корзина пустая",
    es: "Tu carrito está vacío",
    en: "Your cart is empty"
  },
};

const products = [
  {
    id: "honey",
    sizes: {
      "230": { kgs: 307, usd: 3.5 },
      "500": { kgs: 550, usd: 6.3 },
      "1000": { kgs: 874, usd: 10.0 }
    }
  },
  {
    id: "mango_sauce",
    sizes: {
      "230": { kgs: 307, usd: 3.5 },
      "500": { kgs: 699, usd: 8.0 },
      "1000": { kgs: 1750, usd: 20.0 }
    }
  }
];

function setLanguage(lang) {
  currentLang = lang;
  // (Opcional) actualizar el atributo lang del <html>
  document.documentElement.lang = lang;

  // Actualiza textos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] && translations[key][lang]) {
      el.textContent = translations[key][lang];
    }
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

    // Imagen
    const img = document.createElement("img");
    img.src = product.id === "honey" ? "honey_logo.png" : "mango_logo.png";
    img.alt = name;
    img.className = "product-image";
    div.appendChild(img);

    // Título
    const title = document.createElement("h2");
    title.textContent = name;
    div.appendChild(title);

    // Selector de tamaño
    const selector = document.createElement("select");
    selector.className = "size-selector";
    for (let size in product.sizes) {
      const opt = document.createElement("option");
      opt.value = size;
      opt.textContent = size + " ml";
      selector.appendChild(opt);
    }
    div.appendChild(selector);

    // Etiqueta de precio
    const priceLabel = document.createElement("p");
    priceLabel.className = "price-label";
    const firstSize = Object.keys(product.sizes)[0];
    priceLabel.textContent =
      translations["price"][currentLang] + " " +
      product.sizes[firstSize].kgs + " сом / $" + product.sizes[firstSize].usd;
    div.appendChild(priceLabel);

    // Recalcular precio al cambiar tamaño
    selector.onchange = () => {
      const size = selector.value;
      const price = product.sizes[size];
      priceLabel.textContent =
        translations["price"][currentLang] + " " +
        price.kgs + " сом / $" + price.usd;
    };

    // Controles de cantidad
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

    // Botón agregar al carrito
    const addBtn = document.createElement("button");
    addBtn.textContent = translations["add_to_cart"][currentLang];
    addBtn.onclick = () => {
      const size = selector.value;
      const quantity = parseInt(controls.querySelector(".quantity").textContent);
      const name = translations[product.id][currentLang];
      const price = product.sizes[size];
      addToCart(name, size, quantity, price);
    };
    div.appendChild(addBtn);

    list.appendChild(div);
  });
}

function addToCart(name, size, quantity, price) {
  const index = cart.findIndex(item => item.name === name && item.size === size);
  if (index > -1) {
    cart[index].quantity += quantity;
  } else {
    cart.push({ name, size, quantity, price });
  }
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
  let totalKGS = 0;
  let totalUSD = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} ${item.size} ml x${item.quantity} (${item.price.kgs} сом / $${item.price.usd}) `;
    const btn = document.createElement("button");
    btn.textContent = translations["remove"][currentLang];
    btn.onclick = () => removeItem(index);
    li.appendChild(btn);
    list.appendChild(li);

    totalKGS += item.quantity * item.price.kgs;
    totalUSD += item.quantity * item.price.usd;
  });

  document.getElementById("cart-total").innerHTML =
    `<strong>TOTAL: ${totalKGS} сом / $${totalUSD.toFixed(2)}</strong>`;
  updateCartCount();
}

function toggleCart() {
  document.getElementById("cart-popup").classList.toggle("hidden");
}

function confirmOrder() {
  if (cart.length === 0) {
    alert("🛒 " + translations["cart_empty"][currentLang]);
    return;
  }

  // Mensaje y totales
  let message = "🧾 " + translations["your_cart"][currentLang] + ":\n";
  let totalKGS = 0;
  let totalUSD = 0;

  cart.forEach(item => {
    message += `• ${item.name} (${item.size} ml) x${item.quantity} = ${item.price.kgs * item.quantity} сом / $${(item.price.usd * item.quantity).toFixed(2)}\n`;
    totalKGS += item.price.kgs * item.quantity;
    totalUSD += item.price.usd * item.quantity;
  });

  message += `\nTOTAL: ${totalKGS} сом / $${totalUSD.toFixed(2)}`;

  // ---- Registro en Google Sheets ----
  const order = {
    order_id: "CAPI-" + Date.now(),
    language: currentLang,
    items: cart.map(i => ({
      name: i.name,
      size_ml: i.size,
      quantity: i.quantity,
      unit_kgs: i.price.kgs,
      unit_usd: i.price.usd,
      subtotal_kgs: i.price.kgs * i.quantity,
      subtotal_usd: +(i.price.usd * i.quantity).toFixed(2)
    })),
    total_kgs: totalKGS,
    total_usd: +totalUSD.toFixed(2),
    wa_phone: `${PHONE_KG},${PHONE_US}`,
    source: "CAPIPro"
  };

  if (SHEETS_WEBAPP_URL && SHEETS_WEBAPP_URL.includes("/exec")) {
    fetch(SHEETS_WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify(order),
      headers: { "Content-Type": "application/json" }
    }).catch(() => {});
  }

  // ---- Enviar a ambos WhatsApp ----
  const encodedMsg = encodeURIComponent(message);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const urlKG = isMobile
    ? `whatsapp://send?phone=${PHONE_KG}&text=${encodedMsg}`
    : `https://wa.me/${PHONE_KG}?text=${encodedMsg}`;
  window.open(urlKG, "_blank");

  const urlUS = isMobile
    ? `whatsapp://send?phone=${PHONE_US}&text=${encodedMsg}`
    : `https://wa.me/${PHONE_US}?text=${encodedMsg}`;
  window.open(urlUS, "_blank");

  // Limpiar carrito y UI
  cart = [];
  renderCart();
  updateCartCount();
  const popup = document.getElementById("cart-popup");
  if (popup && !popup.classList.contains("hidden")) {
    popup.classList.add("hidden");
  }
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
