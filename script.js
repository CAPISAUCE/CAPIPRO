
let cart = {};
const languageSelector = document.getElementById("language-selector");
let currentLanguage = "es";

const translations = {
  es: {
    whatsappIntro: "Hola, quiero hacer el siguiente pedido:\n\n",
    thanks: "\nGracias.",
    honey: "🍯 Miel",
    spicy: "🔥 Picante de Mango Verde",
    bottle: "frasco(s)",
    total: "Total"
  },
  ru: {
    whatsappIntro: "Здравствуйте! Я хочу сделать следующий заказ:\n\n",
    thanks: "\nСпасибо.",
    honey: "🍯 Мед",
    spicy: "🔥 Острый соус из зелёного манго",
    bottle: "бутылка(и)",
    total: "Итого"
  },
  kg: {
    whatsappIntro: "Салам, мен төмөнкү буйрутманы берейин дедим:\n\n",
    thanks: "\nРахмат.",
    honey: "🍯 Балды",
    spicy: "🔥 Жашыл мангодон ачуу соус",
    bottle: "бөтөлкө(лөр)",
    total: "Жалпы сумма"
  }
};

languageSelector.addEventListener("change", function () {
  currentLanguage = this.value;
});

function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";
  let total = 0;

  for (const productId in cart) {
    const item = cart[productId];
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.quantity} x $${item.price.toFixed(2)}`;
    cartItems.appendChild(li);
    total += item.price * item.quantity;
  }

  document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
}

function addToCart(productId, name, price) {
  if (!cart[productId]) {
    cart[productId] = { name, price, quantity: 0 };
  }
  cart[productId].quantity++;
  updateCartDisplay();
}

function removeFromCart(productId) {
  if (cart[productId]) {
    cart[productId].quantity--;
    if (cart[productId].quantity <= 0) {
      delete cart[productId];
    }
    updateCartDisplay();
  }
}

function toggleCart() {
  const cartPopup = document.getElementById("cart-popup");
  cartPopup.style.display = cartPopup.style.display === "none" ? "block" : "none";
}

function confirmOrder() {
  const lang = translations[currentLanguage];
  let message = lang.whatsappIntro;
  let total = 0;

  for (const productId in cart) {
    const item = cart[productId];
    const line = `${item.name} – ${item.quantity} ${lang.bottle}`;
    message += line + "\n";
    total += item.price * item.quantity;
  }

  message += `\n💰 ${lang.total}: $${total.toFixed(2)}`;
  message += lang.thanks;

  const encodedMessage = encodeURIComponent(message);
  const whatsappNumber = "996559500551";
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  // Vaciar carrito
  cart = {};
  updateCartDisplay();
  toggleCart();

  // Redirigir a WhatsApp
  window.open(whatsappURL, "_blank");
}
