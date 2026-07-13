const app = window.RememberApp;
const elements = {
  userNameElements: document.querySelectorAll("[data-user-name]"),
  topbarUserName: document.querySelector("#topbarUserName"),
  menuUserName: document.querySelector("#menuUserName"),
  logoutButton: document.querySelector("#logoutButton"),
  dashboardSearch: document.querySelector("#dashboardSearch"),
  globalSearchSection: document.querySelector("#globalSearchSection"),
  globalSearchResults: document.querySelector("#globalSearchResults"),
  globalSearchEmpty: document.querySelector("#globalSearchEmpty"),
  ideasCount: document.querySelector("#ideasCount"),
  productsCount: document.querySelector("#productsCount"),
  recentCount: document.querySelector("#recentCount"),
  lastUpdated: document.querySelector("#lastUpdated"),
  latestIdeasList: document.querySelector("#latestIdeasList"),
  latestProductsList: document.querySelector("#latestProductsList"),
  recentActivityList: document.querySelector("#recentActivityList")
};

function setUserName(userName) {
  elements.userNameElements.forEach((element) => { element.textContent = userName; });
  elements.topbarUserName.textContent = userName;
  elements.menuUserName.textContent = userName;
}

function sortByUpdatedAt(items) {
  return [...items].sort((first, second) => new Date(second.updatedAt || second.createdAt) - new Date(first.updatedAt || first.createdAt));
}

function highlightMatch(value, term) {
  const safeValue = app.escapeHtml(value || "");
  if (!term) return safeValue;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeValue.replace(new RegExp(escapedTerm, "ig"), (match) => `<mark>${match}</mark>`);
}

function renderInlineList(listElement, items, emptyMessage, renderItem) {
  if (!items.length) {
    listElement.innerHTML = `<li><p>${app.escapeHtml(emptyMessage)}</p></li>`;
    return;
  }
  listElement.innerHTML = items.map(renderItem).join("");
}

function loadDashboard() {
  const ideas = app.readJsonList(app.keys.ideas);
  const products = app.readJsonList(app.keys.products);
  const recent = sortByUpdatedAt(app.readJsonList(app.keys.recent));
  const lastUpdated = app.getLastUpdated(ideas, products);

  elements.ideasCount.textContent = String(ideas.length);
  elements.productsCount.textContent = String(products.length);
  elements.recentCount.textContent = String(recent.length);
  elements.lastUpdated.textContent = lastUpdated ? app.formatDateTime(lastUpdated) : "None";

  renderInlineList(elements.latestIdeasList, sortByUpdatedAt(ideas).slice(0, 5), "No ideas saved yet.", (idea) => `
    <li><a href="ideas.html">${app.escapeHtml(idea.title)}</a><p>${app.escapeHtml((idea.description || "").slice(0, 120))}</p></li>
  `);

  renderInlineList(elements.latestProductsList, sortByUpdatedAt(products).slice(0, 5), "No products saved yet.", (product) => `
    <li><a href="products.html">${app.escapeHtml(product.productName)}</a><p>${app.escapeHtml(product.website || "Unknown Website")} - ${app.escapeHtml(product.notes || "No notes added.")}</p></li>
  `);

  renderInlineList(elements.recentActivityList, recent.slice(0, 10), "No recent activity.", (item) => `
    <li><strong>${app.escapeHtml(item.action || "Activity")}</strong><p>${app.escapeHtml(item.title || "Untitled")} - ${app.formatDateTime(item.createdAt)}</p></li>
  `);
}

function renderGlobalSearch() {
  const term = elements.dashboardSearch.value.trim().toLowerCase();
  elements.globalSearchSection.hidden = !term;

  if (!term) {
    elements.globalSearchResults.innerHTML = "";
    elements.globalSearchEmpty.hidden = true;
    return;
  }

  const ideas = app.readJsonList(app.keys.ideas).map((idea) => ({
    type: "Idea",
    title: idea.title,
    body: idea.description,
    href: "ideas.html",
    updatedAt: idea.updatedAt || idea.createdAt
  }));
  const products = app.readJsonList(app.keys.products).map((product) => ({
    type: "Product",
    title: product.productName,
    body: `${product.website || "Unknown Website"} ${product.notes || ""}`,
    href: "products.html",
    updatedAt: product.updatedAt || product.createdAt
  }));
  const results = [...ideas, ...products]
    .filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(term))
    .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));

  elements.globalSearchEmpty.hidden = results.length > 0;
  elements.globalSearchResults.innerHTML = results.map((item) => `
    <article class="result-card">
      <p class="eyebrow">${app.escapeHtml(item.type)}</p>
      <a href="${item.href}">${highlightMatch(item.title, term)}</a>
      <p>${highlightMatch((item.body || "").slice(0, 180), term)}</p>
    </article>
  `).join("");
}

function initializeDashboard() {
  const userName = app.requireUser();
  if (!userName) return;
  setUserName(userName);
  loadDashboard();
  renderGlobalSearch();
  elements.dashboardSearch.addEventListener("input", renderGlobalSearch);
  window.addEventListener("storage", loadDashboard);
  elements.logoutButton.addEventListener("click", () => {
    localStorage.removeItem(app.keys.user);
    window.location.href = "index.html";
  });
}

initializeDashboard();
