let cart = [
  { name: "Miel", size: "500ml", qty: 2, priceKGS: 300, priceUSD: 3.5 },
  { name: "Salsa Picante", size: "230ml", qty: 1, priceKGS: 280, priceUSD: 3.5 }
];

function toggleCart() {
  const popup = document.getElementById("cart-popup");
  popup.classList.toggle("hidden");
}

function confirmOrder() {
  if (cart.length === 0) {
    alert("🛒 El carrito está vacío.");
    return;
  }

  let message = "🧾 Pedido:\n";
  let totalKGS = 0;
  let totalUSD = 0;

  cart.forEach(item => {
    message += `• ${item.name} (${item.size}) x${item.qty} = ${item.priceKGS * item.qty} сом / $${(item.priceUSD * item.qty).toFixed(2)}\n`;
    totalKGS += item.priceKGS * item.qty;
    totalUSD += item.priceUSD * item.qty;
  });

  message += `\nTOTAL: ${totalKGS} сом / $${totalUSD.toFixed(2)}`;

  const encodedMsg = encodeURIComponent(message);
  const whatsappKG = "https://wa.me/996559500551?text=" + encodedMsg;
  const whatsappUS = "https://wa.me/17866514487?text=" + encodedMsg;

  const popup = window.open("", "WhatsApp", "width=300,height=200");
  popup.document.write(`
    <html><head><title>Confirmar Pedido</title></head>
    <body style='font-family:sans-serif;padding:20px;'>
      <h3>Enviar pedido por WhatsApp:</h3>
      <p><a href='${whatsappKG}' target='_blank'>🇰🇬 Kirguistán</a></p>
      <p><a href='${whatsappUS}' target='_blank'>🇺🇸 Estados Unidos</a></p>
    </body></html>
  `);
}