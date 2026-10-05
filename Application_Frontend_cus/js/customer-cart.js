const CART_KEY = "customerCart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();

  const totalQty = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const countElement =
    document.querySelector(".store-cart-count");

  if (countElement) {
    countElement.textContent = totalQty;
  }
}

function addToCart(product, stockQuantity) {
  const cart = getCart();

  const partId = getPartId(product);
  const partName = getPartName(product);
  const price = getSellingPrice(product);

  const existingItem = cart.find(
    item => item.partId === partId
  );

  if (existingItem) {

    if (existingItem.quantity >= stockQuantity) {
      alert("Cannot add more than available stock.");
      return;
    }

    existingItem.quantity += 1;

  } else {

    cart.push({
      partId: partId,
      partName: partName,
      price: price,
      quantity: 1,
      stockQuantity: stockQuantity
    });
  }

  saveCart(cart);

  alert(`${partName} added to cart.`);
}

function removeFromCart(partId) {
  const cart = getCart().filter(
    item => item.partId !== partId
  );

  saveCart(cart);
  renderCartPage();
}

function increaseCartQuantity(partId) {
  const cart = getCart();

  const item = cart.find(
    item => item.partId === partId
  );

  if (!item) return;

  if (item.quantity >= item.stockQuantity) {
    alert("Maximum available stock reached.");
    return;
  }

  item.quantity += 1;

  saveCart(cart);
  renderCartPage();
}

function decreaseCartQuantity(partId) {
  const cart = getCart();

  const item = cart.find(
    item => item.partId === partId
  );

  if (!item) return;

  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    return removeFromCart(partId);
  }

  saveCart(cart);
  renderCartPage();
}

function getCartTotal() {
  return getCart().reduce(
    (sum, item) =>
      sum + (item.price * item.quantity),
    0
  );
}

function renderCartPage() {
  const cartItems =
    document.getElementById("cartItems");

  const cartTotal =
    document.getElementById("cartTotal");

  if (!cartItems) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <i class="fa-solid fa-cart-shopping"></i>
        <h3>Your cart is empty</h3>
        <a href="index.html#products">
          Continue Shopping
        </a>
      </div>
    `;

    if (cartTotal) {
      cartTotal.textContent = "Rs. 0.00";
    }

    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">

      <div class="cart-item-info">
        <h3>${item.partName}</h3>
        <p>Part ID: ${item.partId}</p>
        <strong>
          Rs. ${Number(item.price).toLocaleString("en-LK")}
        </strong>
      </div>

      <div class="cart-quantity">

        <button
          onclick="decreaseCartQuantity('${item.partId}')"
        >
          -
        </button>

        <span>${item.quantity}</span>

        <button
          onclick="increaseCartQuantity('${item.partId}')"
        >
          +
        </button>

      </div>

      <div class="cart-line-total">
        Rs. ${
    Number(item.price * item.quantity)
      .toLocaleString("en-LK")
  }
      </div>

      <button
        class="remove-cart-btn"
        onclick="removeFromCart('${item.partId}')"
      >
        <i class="fa-solid fa-trash"></i>
      </button>

    </div>
  `).join("");

  if (cartTotal) {
    cartTotal.textContent =
      `Rs. ${getCartTotal().toLocaleString("en-LK")}`;
  }
}

document.addEventListener(
  "DOMContentLoaded",
  updateCartCount
);
