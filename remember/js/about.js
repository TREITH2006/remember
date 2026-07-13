const app = window.RememberApp;
const userName = app.requireUser();
if (userName) {
  document.querySelector("#menuUserName").textContent = userName;
}
document.querySelector("#logoutButton").addEventListener("click", () => {
  localStorage.removeItem(app.keys.user);
  window.location.href = "index.html";
});
