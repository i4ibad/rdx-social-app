// ==================== STATE ====================
let state = {
  search: "",
  sortKey: null,
  sortDir: 1,
  rowsPerPage: 100,
  page: 0,
};

function renderTable() {
  console.warn("renderTable() not implemented on this page");
}

// ==================== SEARCH ====================
const searchToggle = document.getElementById("searchToggle");
const searchRow = document.getElementById("searchRow");
const searchInput = document.getElementById("searchInput");

searchToggle?.addEventListener("click", () => {
  searchRow?.classList.toggle("open");
  if (searchRow?.classList.contains("open")) searchInput?.focus();
});

searchInput?.addEventListener("input", (e) => {
  state.search = e.target.value;
  state.page = 0;
  renderTable();
});

// ==================== GENERIC DROPDOWN HANDLING ====================
function setupDropdown(dropdownId, btnId, menuId, onSelect, labelId) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu) return; 

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.contains("open");
    document.querySelectorAll(".dropdown-menu.open").forEach(m => {
      if (m !== menu) m.classList.remove("open");
    });
    menu.classList.toggle("open", !isOpen);
  });

  menu.querySelectorAll(":scope > .dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const value = item.dataset.value;
      if (labelId) {
        const labelEl = document.getElementById(labelId);
        if (labelEl) labelEl.textContent = value;
      }
      menu.classList.remove("open");
      onSelect?.(value);
    });
  });
}

document.addEventListener("click", (e) => {
  document.querySelectorAll(".dropdown-menu.open").forEach(m => {
    const parent = m.closest(".dropdown");
    if (parent && !parent.contains(e.target)) m.classList.remove("open");
  });
});

setupDropdown("timeframeDropdown", "timeframeBtn", "timeframeMenu", null, "timeframeLabel");
setupDropdown("rowsDropdown", "rowsBtn", "rowsMenu", (value) => {
  state.rowsPerPage = parseInt(value, 10);
  state.page = 0;
  renderTable();
}, "rowsLabel");

// ==================== PAGINATION ====================
document.getElementById("prevPage")?.addEventListener("click", () => {
  if (state.page > 0) { state.page--; renderTable(); }
});

document.getElementById("nextPage")?.addEventListener("click", () => {
  const filtered = typeof getFilteredData === "function" ? getFilteredData() : [];
  const maxPage = Math.ceil(filtered.length / state.rowsPerPage) - 1;
  if (state.page < maxPage) { state.page++; renderTable(); }
});

// ==================== DARK MODE + LOGO ====================
const lightLogoSrc = "images/logo.svg";
const darkLogoSrc = "images/darklogo.svg";

function updateLogos() {
  const isDark = document.body.classList.contains("dark");
  document.querySelectorAll(".logo-icon").forEach((img) => {
    img.src = isDark ? darkLogoSrc : lightLogoSrc;
  });
}

document.getElementById("darkModeBtn")?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  updateLogos();
});

// ==================== SIDEBAR / HAMBURGER ====================
document.getElementById("hamburgerBtn")?.addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  if (window.innerWidth <= 900) sidebar.classList.toggle("mobile-open");
  else sidebar.classList.toggle("collapsed");
});

// ==================== EXPANDABLE NAV ITEMS ====================
document.querySelectorAll(".nav-item.expandable, .nav-subitem.expandable").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const targetId = item.dataset.target;
    if (!targetId) return;
    const submenu = document.getElementById(targetId);
    const chevron = item.querySelector(".chevron");
    submenu?.classList.toggle("open");
    if (chevron) {
      chevron.style.transform = chevron.style.transform === "rotate(180deg)" ? "" : "rotate(180deg)";
    }
  });
});

document.querySelectorAll(".submenu, .submenu-nested").forEach(menu => {
  menu.addEventListener("click", (e) => e.stopPropagation());
});