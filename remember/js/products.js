const STORAGE_KEYS = {
  user: "rememberUser",
  products: "rememberProducts",
  recent: "rememberRecentItems"
};

const ROUTES = {
  login: "index.html"
};

const WEBSITE_NAMES = {
  "amazon.in": "Amazon",
  "amazon.com": "Amazon",
  "flipkart.com": "Flipkart",
  "myntra.com": "Myntra",
  "ajio.com": "AJIO",
  "apple.com": "Apple",
  "samsung.com": "Samsung",
  "croma.com": "Croma",
  "reliancedigital.in": "Reliance Digital",
  "youtube.com": "YouTube",
  "github.com": "GitHub",
  "chatgpt.com": "ChatGPT"
};

const BASE_FILTERS = ["All", "Amazon", "Flipkart", "Apple", "Samsung", "GitHub", "YouTube", "Other"];

const elements = {
  menuUserName: document.querySelector("#menuUserName"),
  logoutButton: document.querySelector("#logoutButton"),
  addProductButton: document.querySelector("#addProductButton"),
  savedProductsCount: document.querySelector("#savedProductsCount"),
  totalProducts: document.querySelector("#totalProducts"),
  todaysProducts: document.querySelector("#todaysProducts"),
  upcomingReminder: document.querySelector("#upcomingReminder"),
  mostUsedWebsite: document.querySelector("#mostUsedWebsite"),
  productSearch: document.querySelector("#productSearch"),
  filterProducts: document.querySelector("#filterProducts"),
  sortProducts: document.querySelector("#sortProducts"),
  productsGrid: document.querySelector("#productsGrid"),
  emptyState: document.querySelector("#emptyState"),
  productModal: document.querySelector("#productModal"),
  viewModal: document.querySelector("#viewModal"),
  deleteModal: document.querySelector("#deleteModal"),
  productForm: document.querySelector("#productForm"),
  productModalTitle: document.querySelector("#productModalTitle"),
  productId: document.querySelector("#productId"),
  productName: document.querySelector("#productName"),
  productLink: document.querySelector("#productLink"),
  productWebsite: document.querySelector("#productWebsite"),
  productDate: document.querySelector("#productDate"),
  productNotes: document.querySelector("#productNotes"),
  nameMessage: document.querySelector("#nameMessage"),
  linkMessage: document.querySelector("#linkMessage"),
  dateMessage: document.querySelector("#dateMessage"),
  notesMessage: document.querySelector("#notesMessage"),
  viewModalTitle: document.querySelector("#viewModalTitle"),
  viewDetails: document.querySelector("#viewDetails"),
  viewOpenLinkButton: document.querySelector("#viewOpenLinkButton"),
  confirmDeleteButton: document.querySelector("#confirmDeleteButton")
};

let products = [];
let activeModal = null;
let lastFocusedElement = null;
let productPendingDelete = "";
let selectedViewLink = "";

function readJsonList(key) {
  const value = localStorage.getItem(key);

  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
}

function writeJsonList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function getCurrentUserName() {
  const savedName = localStorage.getItem(STORAGE_KEYS.user);
  return savedName ? savedName.trim() : "";
}

function redirectToLogin() {
  window.location.href = ROUTES.login;
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `product-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeUrl(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
}

function isValidUrl(value) {
  try {
    const url = new URL(normalizeUrl(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function detectWebsite(value) {
  if (!isValidUrl(value)) {
    return "Unknown Website";
  }

  const hostname = new URL(normalizeUrl(value)).hostname.toLowerCase().replace(/^www\./, "");
  const matchedDomain = Object.keys(WEBSITE_NAMES).find((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

  return matchedDomain ? WEBSITE_NAMES[matchedDomain] : "Unknown Website";
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

function truncateText(value, maxLength = 140) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function updateRecentItems(action, product) {
  const recentItems = readJsonList(STORAGE_KEYS.recent);
  const nextItems = [
    {
      id: `${action}-${product.id}-${Date.now()}`,
      type: "product",
      action,
      title: product.productName,
      createdAt: new Date().toISOString()
    },
    ...recentItems
  ].slice(0, 20);

  writeJsonList(STORAGE_KEYS.recent, nextItems);
}

function getMostUsedWebsite() {
  if (!products.length) {
    return "None";
  }

  const counts = products.reduce((result, product) => {
    result[product.website] = (result[product.website] || 0) + 1;
    return result;
  }, {});

  return Object.entries(counts).sort((first, second) => second[1] - first[1])[0][0];
}

function getUpcomingReminder() {
  const today = getTodayDateString();
  const upcomingProduct = products
    .filter((product) => product.date >= today)
    .sort((first, second) => new Date(`${first.date}T00:00:00`) - new Date(`${second.date}T00:00:00`))[0];

  return upcomingProduct ? formatDate(upcomingProduct.date) : "None";
}

function updateStats() {
  const today = getTodayDateString();
  const todaysProducts = products.filter((product) => product.createdAt.slice(0, 10) === today).length;

  elements.savedProductsCount.textContent = String(products.length);
  elements.totalProducts.textContent = String(products.length);
  elements.todaysProducts.textContent = String(todaysProducts);
  elements.upcomingReminder.textContent = getUpcomingReminder();
  elements.mostUsedWebsite.textContent = getMostUsedWebsite();
}

function updateFilters() {
  const currentValue = elements.filterProducts.value || "all";
  const generatedFilters = [...new Set(products.map((product) => product.website).filter(Boolean))]
    .filter((website) => !BASE_FILTERS.includes(website) && website !== "Unknown Website")
    .sort((first, second) => first.localeCompare(second));
  const filterValues = [...BASE_FILTERS, ...generatedFilters];

  elements.filterProducts.innerHTML = filterValues.map((filter) => {
    const value = filter.toLowerCase();
    return `<option value="${escapeHtml(value)}">${escapeHtml(filter)}</option>`;
  }).join("");

  elements.filterProducts.value = filterValues.map((filter) => filter.toLowerCase()).includes(currentValue) ? currentValue : "all";
}

function matchesFilter(product, filterValue) {
  if (filterValue === "all") {
    return true;
  }

  if (filterValue === "other") {
    return !["Amazon", "Flipkart", "Apple", "Samsung", "GitHub", "YouTube"].includes(product.website);
  }

  return product.website.toLowerCase() === filterValue;
}

function getFilteredProducts() {
  const searchTerm = elements.productSearch.value.trim().toLowerCase();
  const filterValue = elements.filterProducts.value;
  const sortedProducts = products.filter((product) => {
    const searchableText = `${product.productName} ${product.website} ${product.notes}`.toLowerCase();
    return searchableText.includes(searchTerm) && matchesFilter(product, filterValue);
  });

  sortedProducts.sort((first, second) => {
    const sortMode = elements.sortProducts.value;

    if (sortMode === "oldest") {
      return new Date(first.createdAt) - new Date(second.createdAt);
    }

    if (sortMode === "az") {
      return first.productName.localeCompare(second.productName);
    }

    if (sortMode === "za") {
      return second.productName.localeCompare(first.productName);
    }

    if (sortMode === "website") {
      return first.website.localeCompare(second.website);
    }

    if (sortMode === "reminder") {
      return new Date(`${first.date}T00:00:00`) - new Date(`${second.date}T00:00:00`);
    }

    return new Date(second.createdAt) - new Date(first.createdAt);
  });

  return sortedProducts;
}

function renderProducts() {
  const visibleProducts = getFilteredProducts();

  elements.emptyState.hidden = visibleProducts.length > 0;
  elements.productsGrid.hidden = visibleProducts.length === 0;

  elements.productsGrid.innerHTML = visibleProducts.map((product) => `
    <article class="idea-card">
      <div>
        <span class="product-website">${escapeHtml(product.website)}</span>
        <h3>${escapeHtml(product.productName)}</h3>
        <p class="idea-description">${escapeHtml(truncateText(product.notes || "No notes added yet."))}</p>
        <div class="idea-meta">
          <span>Reminder Date: ${escapeHtml(formatDate(product.date))}</span>
          <span>Created: ${escapeHtml(formatDateTime(product.createdAt))}</span>
          <span>Last Updated: ${escapeHtml(formatDateTime(product.updatedAt))}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action" type="button" data-action="open" data-id="${product.id}">Open Link</button>
        <button class="card-action" type="button" data-action="view" data-id="${product.id}">View</button>
        <button class="card-action" type="button" data-action="edit" data-id="${product.id}">Edit</button>
        <button class="card-action" type="button" data-action="delete" data-id="${product.id}">Delete</button>
      </div>
    </article>
  `).join("");
}

function refreshPage() {
  products = readJsonList(STORAGE_KEYS.products);
  updateStats();
  updateFilters();
  renderProducts();
}

function getFocusableElements(container) {
  return [...container.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
}

function trapFocus(event) {
  if (event.key !== "Tab" || !activeModal) {
    return;
  }

  const focusableElements = getFocusableElements(activeModal);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!firstElement || !lastElement) {
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function openModal(modal, focusTarget) {
  lastFocusedElement = document.activeElement;
  activeModal = modal;
  modal.hidden = false;
  document.body.classList.add("is-modal-open");
  window.setTimeout(() => focusTarget.focus(), 0);
}

function closeActiveModal() {
  if (!activeModal) {
    return;
  }

  activeModal.hidden = true;
  activeModal = null;
  productPendingDelete = "";
  selectedViewLink = "";
  document.body.classList.remove("is-modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function clearMessages() {
  elements.nameMessage.textContent = "";
  elements.linkMessage.textContent = "";
  elements.dateMessage.textContent = "";
  elements.notesMessage.textContent = "";
}

function resetProductForm() {
  elements.productForm.reset();
  elements.productId.value = "";
  elements.productWebsite.value = "Unknown Website";
  clearMessages();
}

function openAddModal() {
  resetProductForm();
  elements.productModalTitle.textContent = "Add Product";
  elements.productDate.value = getTodayDateString();
  openModal(elements.productModal, elements.productName);
}

function openEditModal(product) {
  resetProductForm();
  elements.productModalTitle.textContent = "Edit Product";
  elements.productId.value = product.id;
  elements.productName.value = product.productName;
  elements.productLink.value = product.productLink;
  elements.productWebsite.value = product.website;
  elements.productDate.value = product.date;
  elements.productNotes.value = product.notes;
  openModal(elements.productModal, elements.productName);
}

function renderViewDetails(product) {
  selectedViewLink = product.productLink;
  elements.viewModalTitle.textContent = product.productName;
  elements.viewDetails.innerHTML = `
    <div class="product-detail-item"><span>Website</span><p>${escapeHtml(product.website)}</p></div>
    <div class="product-detail-item"><span>Product Link</span><a href="${escapeHtml(product.productLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(product.productLink)}</a></div>
    <div class="product-detail-item"><span>Reminder Date</span><p>${escapeHtml(formatDate(product.date))}</p></div>
    <div class="product-detail-item"><span>Notes</span><p>${escapeHtml(product.notes || "No notes added.")}</p></div>
    <div class="product-detail-item"><span>Created</span><p>${escapeHtml(formatDateTime(product.createdAt))}</p></div>
    <div class="product-detail-item"><span>Last Updated</span><p>${escapeHtml(formatDateTime(product.updatedAt))}</p></div>
  `;
}

function openViewModal(product) {
  renderViewDetails(product);
  openModal(elements.viewModal, elements.viewOpenLinkButton);
}

function openDeleteModal(productId) {
  productPendingDelete = productId;
  openModal(elements.deleteModal, elements.confirmDeleteButton);
}

function validateProductForm() {
  clearMessages();

  const productName = elements.productName.value.trim();
  const productLink = elements.productLink.value.trim();
  const productDate = elements.productDate.value;
  const productNotes = elements.productNotes.value.trim();
  const productId = elements.productId.value;
  const normalizedProductLink = normalizeUrl(productLink);
  let isValid = true;

  if (!productName) {
    elements.nameMessage.textContent = "Please enter a product name.";
    isValid = false;
  } else if (productName.length < 2) {
    elements.nameMessage.textContent = "Product name must be at least 2 characters.";
    isValid = false;
  } else if (productName.length > 100) {
    elements.nameMessage.textContent = "Product name must be under 100 characters.";
    isValid = false;
  } else if (products.some((product) => product.id !== productId && product.productName.trim().toLowerCase() === productName.toLowerCase())) {
    elements.nameMessage.textContent = "A product with this name already exists.";
    isValid = false;
  }

  if (!productLink) {
    elements.linkMessage.textContent = "Please enter a product link.";
    isValid = false;
  } else if (!isValidUrl(productLink)) {
    elements.linkMessage.textContent = "Please enter a valid URL.";
    isValid = false;
  } else if (products.some((product) => product.id !== productId && product.productLink === normalizedProductLink)) {
    elements.linkMessage.textContent = "This product link is already saved.";
    isValid = false;
  }

  if (!productDate) {
    elements.dateMessage.textContent = "Please choose a reminder date.";
    isValid = false;
  }

  if (productNotes.length > 1000) {
    elements.notesMessage.textContent = "Notes must be under 1000 characters.";
    isValid = false;
  }

  return isValid;
}

function saveProduct(event) {
  event.preventDefault();

  if (!validateProductForm()) {
    return;
  }

  const now = new Date().toISOString();
  const productId = elements.productId.value;
  const productName = elements.productName.value.trim();
  const productLink = normalizeUrl(elements.productLink.value);
  const website = detectWebsite(productLink);
  const date = elements.productDate.value;
  const notes = elements.productNotes.value.trim();

  if (productId) {
    const productIndex = products.findIndex((product) => product.id === productId);

    if (productIndex >= 0) {
      products[productIndex] = {
        ...products[productIndex],
        productName,
        productLink,
        website,
        date,
        notes,
        updatedAt: now
      };
      updateRecentItems("Product Edited", products[productIndex]);
      window.RememberApp?.showToast("Product updated.");
    }
  } else {
    const newProduct = {
      id: createId(),
      productName,
      productLink,
      website,
      date,
      notes,
      createdAt: now,
      updatedAt: now
    };

    products = [newProduct, ...products];
    updateRecentItems("Product Added", newProduct);
    window.RememberApp?.showToast("Product added.");
  }

  writeJsonList(STORAGE_KEYS.products, products);
  closeActiveModal();
  refreshPage();
}

function deleteProduct() {
  const productToDelete = products.find((product) => product.id === productPendingDelete);

  if (!productToDelete) {
    closeActiveModal();
    return;
  }

  products = products.filter((product) => product.id !== productPendingDelete);
  writeJsonList(STORAGE_KEYS.products, products);
  updateRecentItems("Product Deleted", productToDelete);
  window.RememberApp?.showToast("Product deleted.");
  closeActiveModal();
  refreshPage();
}

function openProductLink(productLink) {
  window.open(productLink, "_blank", "noopener");
}

function handleProductCardClick(event) {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) {
    return;
  }

  const product = products.find((currentProduct) => currentProduct.id === actionButton.dataset.id);

  if (!product) {
    return;
  }

  if (actionButton.dataset.action === "open") {
    openProductLink(product.productLink);
  } else if (actionButton.dataset.action === "view") {
    openViewModal(product);
  } else if (actionButton.dataset.action === "edit") {
    openEditModal(product);
  } else if (actionButton.dataset.action === "delete") {
    openDeleteModal(product.id);
  }
}

function bindEvents() {
  elements.addProductButton.addEventListener("click", openAddModal);
  elements.productForm.addEventListener("submit", saveProduct);
  elements.productsGrid.addEventListener("click", handleProductCardClick);
  elements.productSearch.addEventListener("input", renderProducts);
  elements.filterProducts.addEventListener("change", renderProducts);
  elements.sortProducts.addEventListener("change", renderProducts);
  elements.confirmDeleteButton.addEventListener("click", deleteProduct);
  elements.productLink.addEventListener("input", () => {
    elements.productWebsite.value = detectWebsite(elements.productLink.value);
  });
  elements.viewOpenLinkButton.addEventListener("click", () => {
    if (selectedViewLink) {
      openProductLink(selectedViewLink);
    }
  });
  elements.logoutButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.user);
    redirectToLogin();
  });

  document.querySelectorAll("[data-close-modal], [data-close-view], [data-cancel-delete]").forEach((button) => {
    button.addEventListener("click", closeActiveModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeModal) {
      closeActiveModal();
    }

    trapFocus(event);
  });
}

function initializeProductsPage() {
  const userName = getCurrentUserName();

  if (!userName) {
    redirectToLogin();
    return;
  }

  elements.menuUserName.textContent = userName;
  refreshPage();
  bindEvents();
}

initializeProductsPage();
