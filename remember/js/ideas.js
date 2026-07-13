const STORAGE_KEYS = {
  user: "rememberUser",
  ideas: "rememberIdeas",
  recent: "rememberRecentItems"
};

const ROUTES = {
  login: "index.html"
};

const elements = {
  menuUserName: document.querySelector("#menuUserName"),
  logoutButton: document.querySelector("#logoutButton"),
  addIdeaButton: document.querySelector("#addIdeaButton"),
  savedIdeasCount: document.querySelector("#savedIdeasCount"),
  totalIdeas: document.querySelector("#totalIdeas"),
  todaysIdeas: document.querySelector("#todaysIdeas"),
  lastUpdated: document.querySelector("#lastUpdated"),
  ideaSearch: document.querySelector("#ideaSearch"),
  sortIdeas: document.querySelector("#sortIdeas"),
  ideasGrid: document.querySelector("#ideasGrid"),
  emptyState: document.querySelector("#emptyState"),
  ideaModal: document.querySelector("#ideaModal"),
  viewModal: document.querySelector("#viewModal"),
  deleteModal: document.querySelector("#deleteModal"),
  ideaForm: document.querySelector("#ideaForm"),
  ideaModalTitle: document.querySelector("#ideaModalTitle"),
  ideaId: document.querySelector("#ideaId"),
  ideaTitle: document.querySelector("#ideaTitle"),
  ideaDescription: document.querySelector("#ideaDescription"),
  ideaDate: document.querySelector("#ideaDate"),
  titleMessage: document.querySelector("#titleMessage"),
  descriptionMessage: document.querySelector("#descriptionMessage"),
  dateMessage: document.querySelector("#dateMessage"),
  viewModalTitle: document.querySelector("#viewModalTitle"),
  viewMeta: document.querySelector("#viewMeta"),
  viewDescription: document.querySelector("#viewDescription"),
  confirmDeleteButton: document.querySelector("#confirmDeleteButton")
};

let ideas = [];
let activeModal = null;
let lastFocusedElement = null;
let ideaPendingDelete = "";

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

  return `idea-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function truncateDescription(description) {
  return description.length > 180 ? `${description.slice(0, 180).trim()}...` : description;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
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

function getFilteredIdeas() {
  const searchTerm = elements.ideaSearch.value.trim().toLowerCase();
  const sortedIdeas = [...ideas];

  if (searchTerm) {
    sortedIdeas.splice(0, sortedIdeas.length, ...sortedIdeas.filter((idea) => {
      return idea.title.toLowerCase().includes(searchTerm) || idea.description.toLowerCase().includes(searchTerm);
    }));
  }

  const sortMode = elements.sortIdeas.value;

  sortedIdeas.sort((first, second) => {
    if (sortMode === "oldest") {
      return new Date(first.createdAt) - new Date(second.createdAt);
    }

    if (sortMode === "az") {
      return first.title.localeCompare(second.title);
    }

    if (sortMode === "za") {
      return second.title.localeCompare(first.title);
    }

    return new Date(second.createdAt) - new Date(first.createdAt);
  });

  return sortedIdeas;
}

function updateRecentItems(action, idea) {
  const recentItems = readJsonList(STORAGE_KEYS.recent);
  const nextItems = [
    {
      id: `${action}-${idea.id}-${Date.now()}`,
      type: "idea",
      action,
      title: idea.title,
      createdAt: new Date().toISOString()
    },
    ...recentItems
  ].slice(0, 20);

  writeJsonList(STORAGE_KEYS.recent, nextItems);
}

function updateStats() {
  const today = getTodayDateString();
  const todaysIdeas = ideas.filter((idea) => idea.createdAt.slice(0, 10) === today).length;
  const lastUpdatedIdea = [...ideas].sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt))[0];

  elements.savedIdeasCount.textContent = String(ideas.length);
  elements.totalIdeas.textContent = String(ideas.length);
  elements.todaysIdeas.textContent = String(todaysIdeas);
  elements.lastUpdated.textContent = lastUpdatedIdea ? formatDateTime(lastUpdatedIdea.updatedAt) : "None";
}

function renderIdeas() {
  const visibleIdeas = getFilteredIdeas();

  elements.emptyState.hidden = visibleIdeas.length > 0;
  elements.ideasGrid.hidden = visibleIdeas.length === 0;

  elements.ideasGrid.innerHTML = visibleIdeas.map((idea) => `
    <article class="idea-card">
      <div>
        <h3>${escapeHtml(idea.title)}</h3>
        <p class="idea-description">${escapeHtml(truncateDescription(idea.description))}</p>
        <div class="idea-meta">
          <span>Date: ${escapeHtml(formatDate(idea.date))}</span>
          <span>Created: ${escapeHtml(formatDateTime(idea.createdAt))}</span>
          <span>Last Updated: ${escapeHtml(formatDateTime(idea.updatedAt))}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action" type="button" data-action="view" data-id="${idea.id}">View</button>
        <button class="card-action" type="button" data-action="edit" data-id="${idea.id}">Edit</button>
        <button class="card-action" type="button" data-action="delete" data-id="${idea.id}">Delete</button>
      </div>
    </article>
  `).join("");
}

function refreshPage() {
  ideas = readJsonList(STORAGE_KEYS.ideas);
  updateStats();
  renderIdeas();
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
  ideaPendingDelete = "";
  document.body.classList.remove("is-modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function clearMessages() {
  elements.titleMessage.textContent = "";
  elements.descriptionMessage.textContent = "";
  elements.dateMessage.textContent = "";
}

function resetIdeaForm() {
  elements.ideaForm.reset();
  elements.ideaId.value = "";
  clearMessages();
}

function openAddModal() {
  resetIdeaForm();
  elements.ideaModalTitle.textContent = "Add New Idea";
  elements.ideaDate.value = getTodayDateString();
  openModal(elements.ideaModal, elements.ideaTitle);
}

function openEditModal(idea) {
  resetIdeaForm();
  elements.ideaModalTitle.textContent = "Edit Idea";
  elements.ideaId.value = idea.id;
  elements.ideaTitle.value = idea.title;
  elements.ideaDescription.value = idea.description;
  elements.ideaDate.value = idea.date;
  openModal(elements.ideaModal, elements.ideaTitle);
}

function openViewModal(idea) {
  elements.viewModalTitle.textContent = idea.title;
  elements.viewMeta.textContent = `Date: ${formatDate(idea.date)} | Created: ${formatDateTime(idea.createdAt)} | Last Updated: ${formatDateTime(idea.updatedAt)}`;
  elements.viewDescription.textContent = idea.description;
  openModal(elements.viewModal, elements.viewModal.querySelector("[data-close-view]"));
}

function openDeleteModal(ideaId) {
  ideaPendingDelete = ideaId;
  openModal(elements.deleteModal, elements.confirmDeleteButton);
}

function validateIdeaForm() {
  clearMessages();

  const title = elements.ideaTitle.value.trim();
  const description = elements.ideaDescription.value.trim();
  const date = elements.ideaDate.value;
  const currentIdeaId = elements.ideaId.value;
  let isValid = true;

  if (!title) {
    elements.titleMessage.textContent = "Please enter an idea title.";
    isValid = false;
  } else if (title.length < 3) {
    elements.titleMessage.textContent = "Title must be at least 3 characters.";
    isValid = false;
  } else if (title.length > 100) {
    elements.titleMessage.textContent = "Title must be under 100 characters.";
    isValid = false;
  } else if (ideas.some((idea) => idea.id !== currentIdeaId && idea.title.trim().toLowerCase() === title.toLowerCase())) {
    elements.titleMessage.textContent = "An idea with this title already exists.";
    isValid = false;
  }

  if (!description) {
    elements.descriptionMessage.textContent = "Please describe your idea.";
    isValid = false;
  } else if (description.length < 10) {
    elements.descriptionMessage.textContent = "Description must be at least 10 characters.";
    isValid = false;
  } else if (description.length > 5000) {
    elements.descriptionMessage.textContent = "Description must be under 5000 characters.";
    isValid = false;
  }

  if (!date) {
    elements.dateMessage.textContent = "Please choose a date.";
    isValid = false;
  }

  return isValid;
}

function saveIdea(event) {
  event.preventDefault();

  if (!validateIdeaForm()) {
    return;
  }

  const now = new Date().toISOString();
  const ideaId = elements.ideaId.value;
  const title = elements.ideaTitle.value.trim();
  const description = elements.ideaDescription.value.trim();
  const date = elements.ideaDate.value;

  if (ideaId) {
    const ideaIndex = ideas.findIndex((idea) => idea.id === ideaId);

    if (ideaIndex >= 0) {
      ideas[ideaIndex] = {
        ...ideas[ideaIndex],
        title,
        description,
        date,
        updatedAt: now
      };
      updateRecentItems("Idea Edited", ideas[ideaIndex]);
      window.RememberApp?.showToast("Idea updated.");
    }
  } else {
    const newIdea = {
      id: createId(),
      title,
      description,
      date,
      createdAt: now,
      updatedAt: now
    };

    ideas = [newIdea, ...ideas];
    updateRecentItems("Idea Added", newIdea);
    window.RememberApp?.showToast("Idea added.");
  }

  writeJsonList(STORAGE_KEYS.ideas, ideas);
  closeActiveModal();
  refreshPage();
}

function deleteIdea() {
  const ideaToDelete = ideas.find((idea) => idea.id === ideaPendingDelete);

  if (!ideaToDelete) {
    closeActiveModal();
    return;
  }

  ideas = ideas.filter((idea) => idea.id !== ideaPendingDelete);
  writeJsonList(STORAGE_KEYS.ideas, ideas);
  updateRecentItems("Idea Deleted", ideaToDelete);
  window.RememberApp?.showToast("Idea deleted.");
  closeActiveModal();
  refreshPage();
}

function handleIdeaCardClick(event) {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) {
    return;
  }

  const idea = ideas.find((currentIdea) => currentIdea.id === actionButton.dataset.id);

  if (!idea) {
    return;
  }

  if (actionButton.dataset.action === "view") {
    openViewModal(idea);
  } else if (actionButton.dataset.action === "edit") {
    openEditModal(idea);
  } else if (actionButton.dataset.action === "delete") {
    openDeleteModal(idea.id);
  }
}

function bindEvents() {
  elements.addIdeaButton.addEventListener("click", openAddModal);
  elements.ideaForm.addEventListener("submit", saveIdea);
  elements.ideasGrid.addEventListener("click", handleIdeaCardClick);
  elements.ideaSearch.addEventListener("input", renderIdeas);
  elements.sortIdeas.addEventListener("change", renderIdeas);
  elements.confirmDeleteButton.addEventListener("click", deleteIdea);
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

function initializeIdeasPage() {
  const userName = getCurrentUserName();

  if (!userName) {
    redirectToLogin();
    return;
  }

  elements.menuUserName.textContent = userName;
  refreshPage();
  bindEvents();
}

initializeIdeasPage();
