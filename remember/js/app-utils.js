window.RememberApp = (() => {
  const keys = {
    user: "rememberUser",
    ideas: "rememberIdeas",
    products: "rememberProducts",
    recent: "rememberRecentItems"
  };

  function readJsonList(key) {
    const value = localStorage.getItem(key);

    if (!value) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(value);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch (error) {
      localStorage.setItem(key, "[]");
      return [];
    }
  }

  function writeJsonList(key, list) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
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

  function formatDateTime(value) {
    if (!value) {
      return "None";
    }

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function formatDate(value) {
    if (!value) {
      return "None";
    }

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(new Date(`${value}T00:00:00`));
  }

  function getCurrentUserName() {
    const savedName = localStorage.getItem(keys.user);
    return savedName ? savedName.trim() : "";
  }

  function requireUser() {
    const userName = getCurrentUserName();

    if (!userName) {
      window.location.href = "index.html";
      return "";
    }

    return userName;
  }

  function showToast(message) {
    let toast = document.querySelector("#appToast");

    if (!toast) {
      toast = document.createElement("p");
      toast.id = "appToast";
      toast.className = "app-toast";
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function getAllData() {
    return {
      rememberVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      rememberUser: localStorage.getItem(keys.user) || "",
      rememberIdeas: readJsonList(keys.ideas),
      rememberProducts: readJsonList(keys.products),
      rememberRecentItems: readJsonList(keys.recent)
    };
  }

  function isString(value) {
    return typeof value === "string";
  }

  function isIdea(value) {
    return value
      && isString(value.id)
      && isString(value.title)
      && isString(value.description)
      && isString(value.date)
      && isString(value.createdAt)
      && isString(value.updatedAt);
  }

  function isProduct(value) {
    return value
      && isString(value.id)
      && isString(value.productName)
      && isString(value.productLink)
      && isString(value.website)
      && isString(value.date)
      && isString(value.notes)
      && isString(value.createdAt)
      && isString(value.updatedAt);
  }

  function isActivity(value) {
    return value
      && isString(value.id)
      && isString(value.type)
      && isString(value.action)
      && isString(value.title)
      && isString(value.createdAt);
  }

  function validateBackup(data) {
    if (!data || typeof data !== "object") {
      return false;
    }

    return typeof data.rememberUser === "string"
      && Array.isArray(data.rememberIdeas)
      && Array.isArray(data.rememberProducts)
      && Array.isArray(data.rememberRecentItems)
      && data.rememberIdeas.every(isIdea)
      && data.rememberProducts.every(isProduct)
      && data.rememberRecentItems.every(isActivity);
  }

  function restoreBackup(data) {
    if (!validateBackup(data)) {
      return false;
    }

    localStorage.setItem(keys.user, data.rememberUser.trim() || "Remember User");
    writeJsonList(keys.ideas, data.rememberIdeas);
    writeJsonList(keys.products, data.rememberProducts);
    writeJsonList(keys.recent, data.rememberRecentItems);
    return true;
  }

  function addActivity(type, action, title) {
    const recentItems = readJsonList(keys.recent);
    const nextItems = [
      {
        id: `${type}-${action}-${Date.now()}`,
        type,
        action,
        title,
        createdAt: new Date().toISOString()
      },
      ...recentItems
    ].slice(0, 50);

    writeJsonList(keys.recent, nextItems);
  }

  function getLastUpdated(ideas, products) {
    const timestamps = [...ideas, ...products]
      .map((item) => item.updatedAt || item.createdAt)
      .filter(Boolean)
      .sort((first, second) => new Date(second) - new Date(first));

    return timestamps[0] || "";
  }

  return {
    keys,
    readJsonList,
    writeJsonList,
    escapeHtml,
    formatDate,
    formatDateTime,
    getCurrentUserName,
    requireUser,
    showToast,
    getAllData,
    validateBackup,
    restoreBackup,
    addActivity,
    getLastUpdated
  };
})();
