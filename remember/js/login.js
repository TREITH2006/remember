const STORAGE_KEY = "rememberUser";
const DASHBOARD_URL = "dashboard.html";

const loginForm = document.querySelector("#loginForm");
const userNameInput = document.querySelector("#userName");
const nameMessage = document.querySelector("#nameMessage");

function getSavedUserName() {
  return localStorage.getItem(STORAGE_KEY);
}

function redirectToDashboard() {
  window.location.href = DASHBOARD_URL;
}

function showMessage(message, isError = false) {
  nameMessage.textContent = message;
  nameMessage.classList.toggle("is-error", isError);
  userNameInput.classList.toggle("is-invalid", isError);
}

function validateUserName(name) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "Please enter your name to continue.";
  }

  if (trimmedName.length < 2) {
    return "Your name should be at least 2 characters.";
  }

  if (trimmedName.length > 40) {
    return "Please keep your name under 40 characters.";
  }

  return "";
}

function handleLoginSubmit(event) {
  event.preventDefault();

  const trimmedName = userNameInput.value.trim();
  const validationMessage = validateUserName(trimmedName);

  if (validationMessage) {
    showMessage(validationMessage, true);
    userNameInput.focus();
    return;
  }

  // Save the local-only profile name before entering the app.
  localStorage.setItem(STORAGE_KEY, trimmedName);
  redirectToDashboard();
}

function initializeLoginPage() {
  const savedUserName = getSavedUserName();

  if (savedUserName && savedUserName.trim()) {
    redirectToDashboard();
    return;
  }

  userNameInput.focus();
  loginForm.addEventListener("submit", handleLoginSubmit);
  userNameInput.addEventListener("input", () => showMessage(""));
}

initializeLoginPage();
