// ==================== STATE ====================
let state = {
  search: "",
  sortKey: null,
  sortDir: 1,
  rowsPerPage: 100,
  page: 0,
  density: "Standard",
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
setupDropdown("densityDropdown", "densityBtn", "densityMenu", (value) => {
  state.density = value;
  applyDensity(value);
}, null);
setupDropdown("rowsDropdown", "rowsBtn", "rowsMenu", (value) => {
  state.rowsPerPage = parseInt(value, 10);
  state.page = 0;
  renderTable();
}, "rowsLabel");

// ==================== DENSITY HANDLER ====================
function applyDensity(density) {
  const tables = document.querySelectorAll("table");
  const contentCards = document.querySelectorAll(".content-card");
  
  // Remove all density classes
  tables.forEach(table => {
    table.classList.remove("density-compact", "density-standard", "density-comfortable");
  });
  contentCards.forEach(card => {
    card.classList.remove("density-compact", "density-standard", "density-comfortable");
  });
  
  // Add the new density class
  const densityClass = `density-${density.toLowerCase()}`;
  tables.forEach(table => table.classList.add(densityClass));
  contentCards.forEach(card => card.classList.add(densityClass));
}

// Initialize default density when page loads
document.addEventListener("DOMContentLoaded", () => {
  applyDensity(state.density);
});

// Also apply density on window load to catch dynamically added elements
window.addEventListener("load", () => {
  applyDensity(state.density);
});

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

  // (report upload / load / refresh)
  
  window.rdxTableHelpers = window.rdxTableHelpers || {};
  window.rdxTableHelpers.applyVisibility = applyVisibility;
})();

// ==================== REFRESH / LOAD / UPLOAD REPORT ====================

function rdxGetReportStorageKey() {
  const page = (location.pathname.split('/').pop() || 'report').replace(/\.html?$/i, '') || 'report';
  return 'rdxReportData_' + page;
}

// Minimal CSV parser: handles quoted fields, escaped quotes ("") and commas inside quotes.
function rdxParseCSV(text) {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== '');
  return lines.map((line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  });
}

// Toast feedback for refresh / load / upload actions.
function rdxShowToast(message, tone) {
  const toast = document.createElement('div');
  toast.className = 'rdx-toast' + (tone === 'error' ? ' rdx-toast-error' : ' rdx-toast-success');
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Rebuilds the visible table body from parsed CSV data rows (header row excluded),
// padding/truncating each row to match the number of table header columns.
function rdxRenderReportRows(table, dataRows) {
  if (!table) return;
  const tbody = table.querySelector('tbody');
  const headerCount = table.querySelectorAll('thead th').length || 1;
  if (!tbody) return;

  tbody.innerHTML = '';
  dataRows.forEach((cols) => {
    const tr = document.createElement('tr');
    for (let i = 0; i < headerCount; i++) {
      const td = document.createElement('td');
      td.textContent = cols[i] !== undefined ? cols[i] : '';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });

  const card = table.closest('.content-card');
  if (card) {
    const searchInput = card.querySelector('.search-row input');
    filterTableInCard(card, (searchInput?.value || '').trim().toLowerCase());
  }

  window.rdxTableHelpers?.applyVisibility?.();
  applyDensity(state.density);
}

function rdxGetActiveReportTable(fromEl) {
  const card = fromEl?.closest('.content-card') || document.querySelector('.content-card');
  return card?.querySelector('#dataTable') || document.getElementById('dataTable');
}

function rdxSetButtonLoading(btn, isLoading) {
  if (!btn) return;
  btn.classList.toggle('is-loading', isLoading);
  btn.disabled = isLoading;
}

// ---- REFRESH REPORT: re-syncs the table with the last saved report (if any),
// clears any active search filter, and resets to the first page. ----
function rdxRefreshReport(btn) {
  const table = rdxGetActiveReportTable(btn);
  const card = table?.closest('.content-card');
  rdxSetButtonLoading(btn, true);

  setTimeout(() => {
    const saved = localStorage.getItem(rdxGetReportStorageKey());
    if (saved && table) {
      const parsed = rdxParseCSV(saved);
      rdxRenderReportRows(table, parsed.slice(1));
    }

    const searchInput = card?.querySelector('.search-row input');
    if (searchInput) searchInput.value = '';
    if (card) filterTableInCard(card, '');

    state.page = 0;
    rdxSetButtonLoading(btn, false);
    rdxShowToast('Report refreshed.');
  }, 400);
}

// ---- LOAD REPORT: loads the most recently uploaded/saved report from storage. ----
function rdxLoadReport(btn) {
  const table = rdxGetActiveReportTable(btn);
  const key = rdxGetReportStorageKey();
  const saved = localStorage.getItem(key);

  if (!saved) {
    rdxShowToast('No saved report found for this page yet. Please upload a file first.', 'error');
    return;
  }

  rdxSetButtonLoading(btn, true);
  setTimeout(() => {
    const parsed = rdxParseCSV(saved);
    rdxRenderReportRows(table, parsed.slice(1));
    rdxSetButtonLoading(btn, false);
    rdxShowToast('Report loaded successfully.');
  }, 300);
}

// ---- UPLOAD FILE: opens a file picker, reads the CSV, renders it into the table,
// and stores it so LOAD REPORT / REFRESH REPORT can bring it back later. ----
function rdxTriggerUpload(btn) {
  const bar = btn.closest('.timeframe-bar');
  const input = bar?.querySelector('#uploadFileInput') || document.getElementById('uploadFileInput');
  input?.click();
}

function rdxHandleUploadedFile(inputEl) {
  const file = inputEl.files?.[0];
  if (!file) return;

  if (!/\.csv$/i.test(file.name)) {
    rdxShowToast('Please upload a .csv file.', 'error');
    inputEl.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '');
    const parsed = rdxParseCSV(text);
    if (!parsed.length) {
      rdxShowToast('The selected file appears to be empty.', 'error');
      return;
    }
    const table = rdxGetActiveReportTable(inputEl);
    rdxRenderReportRows(table, parsed.slice(1));
    localStorage.setItem(rdxGetReportStorageKey(), text);
    rdxShowToast('"' + file.name + '" uploaded and report updated.');
  };
  reader.onerror = () => rdxShowToast('Could not read the selected file.', 'error');
  reader.readAsText(file);
  inputEl.value = '';
}

document.addEventListener('click', (e) => {
  const refreshBtn = e.target.closest('#refreshReportBtn');
  if (refreshBtn) { e.preventDefault(); rdxRefreshReport(refreshBtn); return; }

  const loadBtn = e.target.closest('#loadReportBtn');
  if (loadBtn) { e.preventDefault(); rdxLoadReport(loadBtn); return; }

  const uploadBtn = e.target.closest('#uploadFileBtn');
  if (uploadBtn) { e.preventDefault(); rdxTriggerUpload(uploadBtn); return; }
});

document.addEventListener('change', (e) => {
  if (!e.target.matches('#uploadFileInput')) return;
  rdxHandleUploadedFile(e.target);
});