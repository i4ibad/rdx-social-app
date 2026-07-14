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

document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.search-toggle');
  if (!toggle) return;
  e.stopPropagation();
  const card = toggle.closest('.content-card');
  const row = card?.querySelector('.search-row');
  const input = row?.querySelector('input');
  row?.classList.toggle('open');
  if (row?.classList.contains('open')) input?.focus();
});

document.addEventListener('input', (e) => {
  if (!e.target.matches('.search-row input')) return;
  const input = e.target;
  const card = input.closest('.content-card');
  const term = input.value.trim().toLowerCase();
  filterTableInCard(card, term);
});

function filterTableInCard(card, term) {
  if (!card) return;
  const tbody = card.querySelector('tbody');
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  let visibleCount = 0;
  rows.forEach((tr) => {
    const text = tr.textContent.replace(/\s+/g, ' ').toLowerCase();
    const match = !term || text.includes(term);
    tr.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });
  const pageInfo = card.querySelector('.page-info');
  if (pageInfo) {
    const total = rows.length;
    pageInfo.textContent = visibleCount ? `1–${visibleCount} of ${visibleCount}` : `0–0 of ${total}`;
  }
}

// ==================== EXPORT HANDLER ====================
function exportCardTable(card) {
  if (!card) return;
  const table = card.querySelector('table');
  if (!table) return alert('No table found to export');
  const headers = Array.from(table.querySelectorAll('thead th')).map(h => h.textContent.trim());
  const rows = Array.from(table.querySelectorAll('tbody tr')).filter(tr => tr.style.display !== 'none');
  const csv = [headers.map(h=>`"${h.replace(/"/g,'""')}"`).join(',')];
  rows.forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('td'));
    const row = cells.map(td => `"${(td.textContent||'').trim().replace(/"/g,'""')}"`).join(',');
    csv.push(row);
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (card.querySelector('.table-title')?.textContent || 'table') + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

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

// Export button delegation
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#exportBtn');
  if (!btn) return;
  e.stopPropagation();
  const card = btn.closest('.content-card');
  exportCardTable(card);
});


(function () {
  const table = document.getElementById('dataTable');
  const headerCells = Array.from(table.querySelectorAll('thead th'));
  const optionsList = document.getElementById('columnOptionsList');
  const columnsBtn = document.getElementById('columnsBtn');
  const columnsMenu = document.getElementById('columnsMenu');
  const resetBtn = document.getElementById('resetColumnsBtn');

  const columns = headerCells.map((th, index) => ({
    key: th.dataset.key,
    label: th.textContent.trim(),
    index: index
  }));

  const visible = {};
  columns.forEach(col => { visible[col.key] = true; });

  function buildOptionsList() {
    optionsList.innerHTML = '';
    columns.forEach(col => {
      const row = document.createElement('label');
      row.className = 'column-option';
      row.dataset.key = col.key;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = visible[col.key];
      checkbox.addEventListener('change', () => toggleColumn(col.key, checkbox.checked, checkbox));

      const text = document.createElement('span');
      text.textContent = col.label;

      row.appendChild(checkbox);
      row.appendChild(text);
      optionsList.appendChild(row);
    });
  }

  function applyVisibility() {
    const visibleCount = Object.values(visible).filter(Boolean).length;

    columns.forEach(col => {
      const isVisible = visible[col.key];
      headerCells[col.index].classList.toggle('col-hidden', !isVisible);

      table.querySelectorAll('#tableBody tr').forEach(row => {
        const cell = row.children[col.index];
        if (cell) cell.classList.toggle('col-hidden', !isVisible);
      });

      const optionRow = optionsList.querySelector('.column-option[data-key="' + col.key + '"]');
      if (optionRow) {
        const cb = optionRow.querySelector('input');
        const disable = isVisible && visibleCount === 1;
        optionRow.classList.toggle('disabled', disable);
        cb.disabled = disable;
      }
    });

    const btnActive = Object.values(visible).some(v => !v);
    columnsBtn.classList.toggle('active', btnActive);
  }

  function toggleColumn(key, isChecked, checkboxEl) {
    const currentlyVisible = Object.values(visible).filter(Boolean).length;
    if (!isChecked && currentlyVisible <= 1) {
      checkboxEl.checked = true;
      return;
    }
    visible[key] = isChecked;
    applyVisibility();
  }

  function resetColumns() {
    columns.forEach(col => { visible[col.key] = true; });
    buildOptionsList();
    applyVisibility();
  }

  columnsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    columnsMenu.classList.toggle('open');
  });

  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetColumns();
  });

  document.addEventListener('click', (e) => {
    if (!columnsMenu.contains(e.target) && e.target !== columnsBtn) {
      columnsMenu.classList.remove('open');
    }
  });

  columnsMenu.addEventListener('click', (e) => e.stopPropagation());

  buildOptionsList();
  applyVisibility();
})();