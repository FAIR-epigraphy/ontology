const base = "/";
const router = new Navigo(base, { hash: false, trailingSlash: false }); // repo name as base path
const routingApp = document.getElementById("divLanding");

// // Handle redirect (GitHub Pages fallback)
// const params = new URLSearchParams(window.location.search);
// const redirect = params.get("redirect");

// if (redirect) {
//   history.replaceState(null, '', redirect);
//   setTimeout(() => router.resolve(), 0);
// } else {
//   router.resolve();
// }

// Handle client-side navigation
document.addEventListener("click", e => {
  const link = e.target.closest("a[data-navigo]");
  if (link) {
    e.preventDefault();
    router.navigate(link.getAttribute("href"));
  }
});
