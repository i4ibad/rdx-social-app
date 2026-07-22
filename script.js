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

// ==================== TIMEFRAME = FIRST COLUMN FILTER 

(function rdxInitTimeframeColumnFilter() {
  const menu = document.getElementById("timeframeMenu");
  const btn = document.getElementById("timeframeBtn");
  const label = document.getElementById("timeframeLabel");
  if (!menu || !btn) return;

  const tables = Array.from(document.querySelectorAll(".content-card table"));
  if (!tables.length) return; 

  const DEFAULT_LABEL = "Time Frame";
  const ALL_VALUE = "__rdx_all__";

  function getFirstColumnValue(row) {
    return (row.children[0] ? row.children[0].textContent : "").replace(/\s+/g, " ").trim();
  }

  function collectColumnValues() {
    const seen = new Set();
    const values = [];
    tables.forEach((table) => {
      table.querySelectorAll("tbody tr").forEach((row) => {
        const value = getFirstColumnValue(row);
        if (value && !seen.has(value)) {
          seen.add(value);
          values.push(value);
        }
      });
    });
    return values;
  }

  function buildMenu() {
    const values = collectColumnValues();
    menu.innerHTML = "";

    const allItem = document.createElement("div");
    allItem.className = "dropdown-item";
    allItem.dataset.value = ALL_VALUE;
    allItem.textContent = "All";
    menu.appendChild(allItem);

    values.forEach((value) => {
      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.dataset.value = value;
      item.textContent = value;
      menu.appendChild(item);
    });

    menu.querySelectorAll(":scope > .dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        selectValue(item.dataset.value);
        menu.classList.remove("open");
      });
    });
  }

  function applyFilterToTable(table, value) {
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    let visibleCount = 0;
    rows.forEach((row) => {
      const match = value === ALL_VALUE || !value || getFirstColumnValue(row) === value;
      row.style.display = match ? "" : "none";
      if (match) visibleCount++;
    });

    const card = table.closest(".content-card");
    const pageInfo = card ? card.querySelector(".page-info") : null;
    if (pageInfo) {
      const total = rows.length;
      pageInfo.textContent = visibleCount ? `1–${visibleCount} of ${visibleCount}` : `0–0 of ${total}`;
    }
  }

  function selectValue(value) {
    if (label) label.textContent = value === ALL_VALUE ? DEFAULT_LABEL : value;
    tables.forEach((table) => applyFilterToTable(table, value));
  }

  buildMenu();

  // Re-run whenever a table's rows get re-rendered
  window.rdxTableHelpers = window.rdxTableHelpers || {};
  window.rdxTableHelpers.refreshTimeframeFilter = function () {
    const current = label && label.textContent !== DEFAULT_LABEL ? label.textContent : ALL_VALUE;
    buildMenu();
    selectValue(current);
  };
})();

setupDropdown("densityDropdown", "densityBtn", "densityMenu", (value) => {
  state.density = value;
  applyDensity(value);
}, null);
setupDropdown("rowsDropdown", "rowsBtn", "rowsMenu", (value) => {
  state.rowsPerPage = parseInt(value, 10);
  state.page = 0;
  renderTable();
}, "rowsLabel");

//  DENSITY HANDLER
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

// PAGINATION 
document.getElementById("prevPage")?.addEventListener("click", () => {
  if (state.page > 0) { state.page--; renderTable(); }
});

document.getElementById("nextPage")?.addEventListener("click", () => {
  const filtered = typeof getFilteredData === "function" ? getFilteredData() : [];
  const maxPage = Math.ceil(filtered.length / state.rowsPerPage) - 1;
  if (state.page < maxPage) { state.page++; renderTable(); }
});

//  DARK MODE + LOGO 
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

// REFRESH / LOAD / UPLOAD REPORT

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
  window.rdxTableHelpers?.refreshTimeframeFilter?.();
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

// REFRESH REPORT
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
    rdxShowToast('Refresh Report initiated');
  }, 400);
}

// LOAD REPORT
function rdxLoadReport(btn) {
  const table = rdxGetActiveReportTable(btn);
  const key = rdxGetReportStorageKey();
  const saved = localStorage.getItem(key);

  if (!saved) {
    rdxShowToast('Load Report initiated');
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

// UPLOAD FILE
function rdxTriggerUpload(btn) {
  if (window.rdxOpenUploadModal) {
    window.rdxOpenUploadModal(btn);
    return;
  }
  // Fallback in case the modal script hasn't loaded
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
// UPLOAD FILE MODAL
(function () {
  const MAX_BYTES = 10 * 1024 * 1024;
  const ACCEPTED = ['.csv', '.xlsx', '.xls'];
  let modalEls = null;
  let selectedFile = null;
  let triggerEl = null;
  let sheetJsLoadPromise = null;

  function fileExt(name) {
    const m = /\.[^.]+$/.exec(name || '');
    return m ? m[0].toLowerCase() : '';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function buildModal() {
    if (modalEls) return modalEls;

    const overlay = document.createElement('div');
    overlay.className = 'rdx-modal-overlay';
    overlay.id = 'rdxUploadModalOverlay';
    overlay.innerHTML = `
      <div class="rdx-modal" role="dialog" aria-modal="true" aria-labelledby="rdxUploadModalTitle">
        <div class="rdx-modal-topline">
          <div class="rdx-modal-topline-left">
            <span class="rdx-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <span>
              <h3 class="rdx-modal-title" id="rdxUploadModalTitle">Upload File</h3>
              <p class="rdx-modal-subtitle">Max 10.00 MB &middot; .csv, .xlsx, .xls</p>
            </span>
          </div>
          <button type="button" class="rdx-modal-close" id="rdxUploadModalClose" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="rdx-modal-body">
          <p class="rdx-modal-hint">Drag and drop your file here, or browse from your computer.</p>

          <div class="rdx-dropzone" id="rdxDropzone" tabindex="0" role="button" aria-label="Browse or drop a file to upload">
            <div class="rdx-dropzone-icon" id="rdxDropzoneIcon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div class="rdx-dropzone-title" id="rdxDropzoneTitle">Click to browse or drag &amp; drop</div>
            <div class="rdx-dropzone-sub" id="rdxDropzoneSub">Supported formats: .csv, .xlsx, .xls</div>
          </div>

          <input type="file" id="rdxModalFileInput" accept=".csv,.xlsx,.xls" hidden />
        </div>

        <div class="rdx-modal-footer">
          <button type="button" class="rdx-btn rdx-btn-outline" id="rdxModalCancelBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            CANCEL
          </button>
          <button type="button" class="rdx-btn rdx-btn-primary" id="rdxModalUploadBtn" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            UPLOAD
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    modalEls = {
      overlay,
      dropzone: overlay.querySelector('#rdxDropzone'),
      dzIcon: overlay.querySelector('#rdxDropzoneIcon'),
      dzTitle: overlay.querySelector('#rdxDropzoneTitle'),
      dzSub: overlay.querySelector('#rdxDropzoneSub'),
      fileInput: overlay.querySelector('#rdxModalFileInput'),
      cancelBtn: overlay.querySelector('#rdxModalCancelBtn'),
      uploadBtn: overlay.querySelector('#rdxModalUploadBtn'),
      closeBtn: overlay.querySelector('#rdxUploadModalClose'),
    };

    wireModalEvents();
    return modalEls;
  }

  function wireModalEvents() {
    const { overlay, dropzone, fileInput, cancelBtn, uploadBtn, closeBtn } = modalEls;

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });

    ['dragenter', 'dragover'].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'dragend'].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) setSelectedFile(file);
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) setSelectedFile(file);
      fileInput.value = '';
    });

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    uploadBtn.addEventListener('click', () => {
      if (!selectedFile || uploadBtn.disabled) return;
      processSelectedFile(selectedFile);
    });
  }

  function resetDropzone() {
    const { dropzone, dzIcon, dzTitle, dzSub, uploadBtn } = modalEls;
    dropzone.classList.remove('has-error');
    dzIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>`;
    dzTitle.textContent = 'Click to browse or drag & drop';
    dzSub.textContent = 'Supported formats: .csv, .xlsx, .xls';
    uploadBtn.disabled = true;
    uploadBtn.classList.remove('is-ready');
    selectedFile = null;
  }

  function setSelectedFile(file) {
    const { dropzone, dzIcon, dzTitle, dzSub, uploadBtn } = modalEls;
    const ext = fileExt(file.name);

    if (!ACCEPTED.includes(ext)) {
      dropzone.classList.add('has-error');
      dzIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>`;
      dzTitle.textContent = 'Unsupported file type';
      dzSub.textContent = 'Please choose a .csv, .xlsx, or .xls file.';
      uploadBtn.disabled = true;
      uploadBtn.classList.remove('is-ready');
      selectedFile = null;
      return;
    }

    if (file.size > MAX_BYTES) {
      dropzone.classList.add('has-error');
      dzIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>`;
      dzTitle.textContent = 'File is too large';
      dzSub.textContent = 'Max file size is 10.00 MB.';
      uploadBtn.disabled = true;
      uploadBtn.classList.remove('is-ready');
      selectedFile = null;
      return;
    }

    selectedFile = file;
    dropzone.classList.remove('has-error');
    dzIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      </svg>`;
    dzTitle.textContent = file.name;
    dzSub.textContent = formatBytes(file.size) + ' &middot; click or drop to replace'.replace('&middot;', '·');
    uploadBtn.disabled = false;
    uploadBtn.classList.add('is-ready');
  }

  function openModal(btn) {
    buildModal();
    triggerEl = btn || triggerEl;
    resetDropzone();
    modalEls.overlay.classList.add('open');
    document.body.classList.add('rdx-modal-locked');
  }

  function closeModal() {
    if (!modalEls) return;
    modalEls.overlay.classList.remove('open');
    document.body.classList.remove('rdx-modal-locked');
    resetDropzone();
  }

  function loadSheetJs() {
    if (window.XLSX) return Promise.resolve();
    if (sheetJsLoadPromise) return sheetJsLoadPromise;
    sheetJsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load spreadsheet engine.'));
      document.head.appendChild(script);
    });
    return sheetJsLoadPromise;
  }

  function finishUpload(text, fileName) {
    const parsed = rdxParseCSV(text);
    if (!parsed.length) {
      rdxShowToast('The selected file appears to be empty.', 'error');
      return;
    }
    const table = rdxGetActiveReportTable(triggerEl);
    rdxRenderReportRows(table, parsed.slice(1));
    localStorage.setItem(rdxGetReportStorageKey(), text);
    rdxShowToast('"' + fileName + '" uploaded and report updated.');
    closeModal();
  }

  function processSelectedFile(file) {
    const { uploadBtn } = modalEls;
    const ext = fileExt(file.name);
    uploadBtn.classList.add('is-loading');
    uploadBtn.disabled = true;

    if (ext === '.csv') {
      const reader = new FileReader();
      reader.onload = () => {
        uploadBtn.classList.remove('is-loading');
        finishUpload(String(reader.result || ''), file.name);
      };
      reader.onerror = () => {
        uploadBtn.classList.remove('is-loading');
        uploadBtn.disabled = false;
        rdxShowToast('Could not read the selected file.', 'error');
      };
      reader.readAsText(file);
      return;
    }

    // .xlsx / .xls
    loadSheetJs()
      .then(() => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = new Uint8Array(reader.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const csv = window.XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
            uploadBtn.classList.remove('is-loading');
            finishUpload(csv, file.name);
          } catch (err) {
            uploadBtn.classList.remove('is-loading');
            uploadBtn.disabled = false;
            rdxShowToast('Could not parse the selected file.', 'error');
          }
        };
        reader.onerror = () => {
          uploadBtn.classList.remove('is-loading');
          uploadBtn.disabled = false;
          rdxShowToast('Could not read the selected file.', 'error');
        };
        reader.readAsArrayBuffer(file);
      })
      .catch(() => {
        uploadBtn.classList.remove('is-loading');
        uploadBtn.disabled = false;
        rdxShowToast('Could not load the spreadsheet engine. Please try a .csv file.', 'error');
      });
  }

  window.rdxOpenUploadModal = openModal;
})();