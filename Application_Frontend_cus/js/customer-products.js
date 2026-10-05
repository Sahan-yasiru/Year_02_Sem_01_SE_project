let customerProducts = [];
let customerInventory = [];

document.addEventListener("DOMContentLoaded", () => {

  loadCustomerProducts();

  const searchInput = document.getElementById("productSearch");

  if (searchInput) {

    searchInput.addEventListener("input", () => {

      const keyword = searchInput.value
        .trim()
        .toLowerCase();

      const filtered = customerProducts.filter(product => {

        const name = getPartName(product).toLowerCase();
        const id = getPartId(product).toLowerCase();
        const category = getCategory(product).toLowerCase();
        const brand = getBrand(product).toLowerCase();

        return (
          name.includes(keyword) ||
          id.includes(keyword) ||
          category.includes(keyword) ||
          brand.includes(keyword)
        );
      });

      renderCustomerProducts(filtered);
    });
  }

});


async function loadCustomerProducts() {

  const productGrid = document.getElementById("productGrid");

  if (!productGrid) {
    return;
  }

  productGrid.innerHTML = `
        <div class="products-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading spare parts...
        </div>
    `;

  try {

    // Load spare parts first
    const productsResponse =
      await customerApi.get("/spare-part");

    customerProducts = Array.isArray(productsResponse)
      ? productsResponse
      : [];

    // Try to load inventory separately
    try {

      const inventoryResponse =
        await customerApi.get("/inventory");

      customerInventory = Array.isArray(inventoryResponse)
        ? inventoryResponse
        : [];

      console.log("Inventory:", customerInventory);

    } catch (inventoryError) {

      console.warn(
        "Inventory could not be loaded:",
        inventoryError
      );

      customerInventory = [];
    }

    // Products will still display even if inventory fails
    renderCustomerProducts(customerProducts);

  } catch (error) {

    console.error(
      "Unable to load spare parts:",
      error
    );

    productGrid.innerHTML = `
            <div class="products-message">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Unable to load products</h3>
                <p>Please make sure the backend is running.</p>
            </div>
        `;
  }
}


function renderCustomerProducts(products) {

  const productGrid =
    document.getElementById("productGrid");

  if (!productGrid) {
    return;
  }

  if (!products || products.length === 0) {

    productGrid.innerHTML = `
            <div class="products-message">
                <i class="fa-solid fa-box-open"></i>
                <h3>No products found</h3>
                <p>Try another search.</p>
            </div>
        `;

    return;
  }

  productGrid.innerHTML = products.map(product => {

    const partId = getPartId(product);
    const partName = getPartName(product);
    const category = getCategory(product);
    const brand = getBrand(product);
    const price = getSellingPrice(product);

    const quantity =
      getStockQuantity(product);

    const image =
      getProductImage(product);

    const inStock =
      quantity > 0;

    return `
            <div class="product-card">

                <div class="product-image">

                    <span class="stock-badge ${inStock ? "" : "out-of-stock"}">
                        ${
      inStock
        ? `In Stock (${quantity})`
        : "Out of Stock"
    }
                    </span>

                    <img
                        src="${image}"
                        alt="${escapeHtml(partName)}"
                        onerror="this.src='img/product-placeholder.png'"
                    >

                    <button
                        class="wishlist-btn"
                        type="button"
                    >
                        <i class="fa-regular fa-heart"></i>
                    </button>

                </div>


                <div class="product-content">

                    <span class="product-category">
                        ${escapeHtml(category)}
                    </span>

                    <h3>
                        ${escapeHtml(partName)}
                    </h3>

                    <div class="product-brand">
                        ${
      brand
        ? escapeHtml(brand)
        : "Auto Part"
    }
                    </div>

                    <div class="product-code">
                        Part ID: ${escapeHtml(partId)}
                    </div>

                    <div class="product-footer">

                        <div class="product-price">

                            <small>
                                Price
                            </small>

                            <strong>
                                Rs. ${formatPrice(price)}
                            </strong>

                        </div>

                        <button
                            class="add-cart-btn"
                            type="button"
                            ${!inStock ? "disabled" : ""}
                            onclick="addCustomerProductToCart('${escapeJs(partId)}')"
                            title="${inStock ? "Add to Cart" : "Out of Stock"}"
                        >

                            <i class="fa-solid fa-cart-plus"></i>

                        </button>

                    </div>

                </div>

            </div>
        `;

  }).join("");
}


/* =========================
   FIELD HELPERS
========================= */

function getPartId(product) {

  return String(
    product?.partID ??
    product?.partId ??
    product?.sparePartId ??
    product?.id ??
    ""
  );
}


function getPartName(product) {

  return String(
    product?.partName ??
    product?.name ??
    product?.sparePartName ??
    "Unnamed Spare Part"
  );
}


function getCategory(product) {

  const category =
    product?.categoryName ??
    product?.category?.categoryName ??
    product?.category?.name ??
    product?.category;

  return typeof category === "string"
    ? category
    : "Spare Parts";
}


function getBrand(product) {

  const brand =
    product?.brandName ??
    product?.brand?.brandName ??
    product?.brand?.name ??
    product?.brand;

  return typeof brand === "string"
    ? brand
    : "";
}


function getSellingPrice(product) {

  return Number(
    product?.sellPrice ??
    product?.sellingPrice ??
    product?.salePrice ??
    product?.price ??
    product?.unitPrice ??
    product?.costPrice ??
    0
  );
}


function getStockQuantity(product) {

  const partId = getPartId(product);

  const inventoryItem = customerInventory.find(item => {

    const inventoryPartId =
      item?.part?.partID ??
      item?.part?.partId ??
      "";

    return String(inventoryPartId) === String(partId);
  });

  if (!inventoryItem) {
    return 0;
  }

  return Number(
    inventoryItem?.quantity_on_hand ?? 0
  );
}


function getProductImage(product) {

  return (
    product?.imageUrl ??
    product?.image ??
    product?.imagePath ??
    "img/product-placeholder.png"
  );
}


/* =========================
   TEMP CART
========================= */

function addCustomerProductToCart(partId) {

  const product =
    customerProducts.find(
      item =>
        getPartId(item) === String(partId)
    );

  if (!product) {
    return;
  }

  const stockQuantity =
    getStockQuantity(product);

  if (stockQuantity <= 0) {
    alert("This product is out of stock.");
    return;
  }

  addToCart(
    product,
    stockQuantity
  );
}


/* =========================
   UTILITIES
========================= */

function formatPrice(value) {

  return Number(value || 0)
    .toLocaleString(
      "en-LK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeJs(value) {

  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}
