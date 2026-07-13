const app = window.RememberApp;
const elements = {
  menuUserName: document.querySelector("#menuUserName"),
  logoutButton: document.querySelector("#logoutButton"),
  profileForm: document.querySelector("#profileForm"),
  profileName: document.querySelector("#profileName"),
  profileMessage: document.querySelector("#profileMessage"),
  exportButton: document.querySelector("#exportButton"),
  importFile: document.querySelector("#importFile"),
  importMessage: document.querySelector("#importMessage"),
  clearIdeasButton: document.querySelector("#clearIdeasButton"),
  clearProductsButton: document.querySelector("#clearProductsButton"),
  resetButton: document.querySelector("#resetButton")
};

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `remember-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function confirmAction(message, action) {
  if (window.confirm(message)) action();
}

function initializeSettings() {
  const userName = app.requireUser();
  if (!userName) return;
  elements.menuUserName.textContent = userName;
  elements.profileName.value = userName;

  elements.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nextName = elements.profileName.value.trim();
    if (nextName.length < 2 || nextName.length > 40) {
      elements.profileMessage.textContent = "Name must be 2 to 40 characters.";
      return;
    }
    localStorage.setItem(app.keys.user, nextName);
    elements.menuUserName.textContent = nextName;
    elements.profileMessage.textContent = "";
    app.showToast("Username updated.");
  });

  elements.exportButton.addEventListener("click", () => {
    downloadJson(app.getAllData());
    app.showToast("Backup exported.");
  });

  elements.importFile.addEventListener("change", async () => {
    const file = elements.importFile.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!app.validateBackup(data)) {
        elements.importMessage.textContent = "This is not a valid Remember backup.";
        return;
      }
      confirmAction("Importing this backup will replace existing Remember data. Continue?", () => {
        app.restoreBackup(data);
        app.showToast("Backup restored.");
        window.setTimeout(() => window.location.reload(), 500);
      });
    } catch (error) {
      elements.importMessage.textContent = "Could not read this backup file.";
    }
  });

  elements.clearIdeasButton.addEventListener("click", () => confirmAction("Clear all ideas?", () => {
    app.writeJsonList(app.keys.ideas, []);
    app.addActivity("idea", "Idea Deleted", "All ideas cleared");
    app.showToast("All ideas cleared.");
  }));

  elements.clearProductsButton.addEventListener("click", () => confirmAction("Clear all products?", () => {
    app.writeJsonList(app.keys.products, []);
    app.addActivity("product", "Product Deleted", "All products cleared");
    app.showToast("All products cleared.");
  }));

  elements.resetButton.addEventListener("click", () => confirmAction("Reset Remember and remove all local app data?", () => {
    localStorage.removeItem(app.keys.user);
    app.writeJsonList(app.keys.ideas, []);
    app.writeJsonList(app.keys.products, []);
    app.writeJsonList(app.keys.recent, []);
    app.showToast("Application reset.");
    window.setTimeout(() => { window.location.href = "index.html"; }, 500);
  }));

  elements.logoutButton.addEventListener("click", () => {
    localStorage.removeItem(app.keys.user);
    window.location.href = "index.html";
  });
}

initializeSettings();
