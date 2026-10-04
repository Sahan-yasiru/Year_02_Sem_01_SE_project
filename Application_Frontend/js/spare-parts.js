/**
 * spare-parts.js — Spare Parts Management: full CRUD
 *
 * API endpoint: /api/spare-part
 *
 * SparePartDTO:
 * {
 *   partID:      string       (e.g. "SP001")
 *   partName:    string
 *   suppliers:   SupplierDTO[]
 *   brand:       BrandDTO     { brandID, brandName, countryOfOrigin }
 *   category:    CategoryDTO  { categoryId, categoryName, categoryDescription }
 *   costPrice:   number
 *   sellPrice:   number
 * }
 */

/* ─── Module State ─────────────────────────────────── */
let spSpareParts   = [];
let filteredSP      = [];
let spSuppliers     = [];   // For the multi-select supplier list
let spBrands        = [];   // For brand dropdown
let spCategories    = [];   // For category dropdown
let selectedSupplierIDs = new Set(); // Multi-select state
let spToDelete      = null;
let editingPartID   = null;

/* =====================================================
   PAGE INITIALISATION
   ===================================================== */
function initSparePartsPage() {
    document.getElementById('btn-add-sp')?.addEventListener('click', openAddSparePartModal);
    document.getElementById('sp-search-input')?.addEventListener('input', onSPSearch);
    document.getElementById('sp-form')?.addEventListener('submit', onSPFormSubmit);
    document.getElementById('sp-cancel-btn')?.addEventListener('click', closeSPModal);
    document.getElementById('sp-modal-close-btn')?.addEventListener('click', closeSPModal);
    document.getElementById('sp-confirm-cancel-btn')?.addEventListener('click', closeSPDeleteConfirm);
    document.getElementById('sp-confirm-delete-btn')?.addEventListener('click', confirmDeleteSP);
    document.getElementById('sp-multiselect-trigger')?.addEventListener('click', toggleSpSupplierDropdown);
    document.getElementById('sp-supplier-search')?.addEventListener('input', (e) => filterSpSuppliers(e.target.value));

    // Close modal on overlay click
    document.getElementById('sp-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'sp-modal') closeSPModal();
    });
    document.getElementById('sp-delete-confirm')?.addEventListener('click', (e) => {
        if (e.target.id === 'sp-delete-confirm') closeSPDeleteConfirm();
    });

    // Close supplier dropdown on outside click
    document.addEventListener('click', onDocClickCloseSPDropdown);

    // Load all required data in parallel
    loadSPPageData();
}

async function loadSPPageData() {
    showSPSkeleton();
    try {
        [allSpareParts, spSuppliers, spBrands, spCategories] = await Promise.all([
            api.get('/spare-part'),
            api.get('/supplier'),
            api.get('/brand'),
            api.get('/category'),
        ]);
        filteredSP = [...allSpareParts];
        renderSPTable(filteredSP);
        updateSPCount(filteredSP.length);
    } catch (err) {
        showSPTableError(err.message);
    }
}

/* =====================================================
   SEARCH / FILTER
   ===================================================== */
function onSPSearch(e) {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
        filteredSP = [...allSpareParts];
    } else {
        filteredSP = allSpareParts.filter(p => {
            const id   = (p.partID   || '').toLowerCase();
            const name = (p.partName || '').toLowerCase();
            const brand = (p.brand?.brandName || '').toLowerCase();
            const cat  = (p.category?.categoryName || '').toLowerCase();
            const sups = (p.suppliers || []).map(s => (s.name || '').toLowerCase()).join(' ');
            return id.includes(q) || name.includes(q) || brand.includes(q) || cat.includes(q) || sups.includes(q);
        });
    }
    renderSPTable(filteredSP);
    updateSPCount(filteredSP.length);
}

function updateSPCount(n) {
    const el = document.getElementById('sp-count');
    if (el) el.textContent = `${n} part${n !== 1 ? 's' : ''}`;
}

/* =====================================================
   RENDER TABLE
   ===================================================== */
function renderSPTable(parts) {
    const tbody = document.getElementById('sp-tbody');
    if (!tbody) return;

    if (!parts || parts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table-cell">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">${allSpareParts.length === 0 ? 'No spare parts yet' : 'No matching parts'}</div>
                        <div class="empty-state-msg">${allSpareParts.length === 0 ? 'Click "Add Spare Part" to create your first catalog entry.' : 'Try adjusting your search.'}</div>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = parts.map(p => {
        const id        = p.partID   || '—';
        const name      = p.partName || 'Unnamed Part';
        const brandName = p.brand?.brandName || '—';
        const catName   = p.category?.categoryName || '—';
        const costPrice = typeof p.costPrice === 'number' ? p.costPrice.toFixed(2) : '0.00';
        const sellPrice = typeof p.sellPrice === 'number' ? p.sellPrice.toFixed(2) : '0.00';
        const suppliers = p.suppliers || [];
        const initials  = name.substring(0, 2).toUpperCase();
        const color     = avatarColor(id);

        // Build supplier badges (up to 3 shown, then +N)
        const maxShow = 3;
        let supplierBadges = '';
        if (suppliers.length === 0) {
            supplierBadges = `<span style="color:var(--color-text-muted);font-size:12px;">—</span>`;
        } else {
            const visible = suppliers.slice(0, maxShow);
            const extra   = suppliers.length - maxShow;
            supplierBadges = visible.map(s => `
                <span class="sp-supplier-chip" title="${escapeHtml(s.supplierID)}">
                    ${escapeHtml(s.name || s.supplierID)}
                </span>`).join('');
            if (extra > 0) {
                supplierBadges += `<span class="sp-supplier-chip sp-chip-more">+${extra}</span>`;
            }
        }

        return `
            <tr>
                <td>
                    <div class="avatar-cell">
                        <div class="avatar" style="background:${color};font-size:11px;">${escapeHtml(initials)}</div>
                        <div class="avatar-info">
                            <span class="user-name">${escapeHtml(name)}</span>
                            <span class="user-id">${escapeHtml(id)}</span>
                        </div>
                    </div>
                </td>
                <td class="hide-mobile">
                    <span class="badge" style="background:rgba(124,58,237,0.15);color:#A78BFA;border:1px solid rgba(124,58,237,0.3);padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:600;">
                        ${escapeHtml(catName)}
                    </span>
                </td>
                <td class="hide-mobile">
                    <span style="font-weight:600;color:#E2E8F0;">${escapeHtml(brandName)}</span>
                </td>
                <td class="hide-mobile">
                    <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                        ${supplierBadges}
                    </div>
                </td>
                <td class="hide-mobile">
                    <span style="color:var(--color-text-muted);font-size:13px;">Rs. ${escapeHtml(costPrice)}</span>
                </td>
                <td>
                    <span style="font-weight:700;color:#34D399;font-size:13.5px;">Rs. ${escapeHtml(sellPrice)}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-edit" title="Edit Part" onclick="openEditSPModal('${escapeHtml(id)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                            </svg>
                        </button>
                        <button class="action-btn action-delete" title="Delete Part" onclick="openSPDeleteConfirm('${escapeHtml(id)}', '${escapeHtml(name)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function showSPSkeleton() {
    const tbody = document.getElementById('sp-tbody');
    if (!tbody) return;
    tbody.innerHTML = Array(5).fill(0).map(() => `
        <tr>
            <td><div class="skeleton" style="height:36px;width:200px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:20px;width:100px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:14px;width:100px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:20px;width:140px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:14px;width:70px"></div></td>
            <td><div class="skeleton" style="height:14px;width:70px"></div></td>
            <td><div class="skeleton" style="height:30px;width:66px"></div></td>
        </tr>`).join('');
}

function showSPTableError(msg) {
    const tbody = document.getElementById('sp-tbody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-table-cell">
                <div class="empty-state">
                    <div class="empty-state-title" style="color:var(--color-danger)">Failed to load spare parts</div>
                    <div class="empty-state-msg">${escapeHtml(msg)}</div>
                    <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="loadSPPageData()">Try Again</button>
                </div>
            </td>
        </tr>`;
}

/* =====================================================
   AUTO ID GENERATION
   ===================================================== */
function generatePartID() {
    let maxNum = 0;
    (allSpareParts || []).forEach(p => {
        const id = p?.partID || '';
        const match = id.match(/\d+/);
        if (match) {
            const n = parseInt(match[0], 10);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        }
    });
    return 'PART' + String(maxNum + 1).padStart(3, '0');
}

/* =====================================================
   POPULATE DROPDOWNS (Brand & Category)
   ===================================================== */
function populateBrandDropdown(selectedID = '') {
    const sel = document.getElementById('field-sp-brand');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select Brand —</option>';
    (spBrands || []).forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.brandID;
        opt.textContent = `${b.brandName} (${b.brandID})`;
        if (b.brandID === selectedID) opt.selected = true;
        sel.appendChild(opt);
    });
}

function populateCategoryDropdown(selectedID = '') {
    const sel = document.getElementById('field-sp-category');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select Category —</option>';
    (spCategories || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.categoryId;
        opt.textContent = `${c.categoryName} (${c.categoryId})`;
        if (String(c.categoryId) === String(selectedID)) opt.selected = true;
        sel.appendChild(opt);
    });
}

/* =====================================================
   MULTI-SELECT SUPPLIER DROPDOWN
   ===================================================== */
function buildSupplierList(filterText = '') {
    const listEl = document.getElementById('sp-supplier-list');
    if (!listEl) return;

    const q = filterText.toLowerCase();
    const filtered = (spSuppliers || []).filter(s => {
        const name = (s.name || '').toLowerCase();
        const id   = (s.supplierID || '').toLowerCase();
        return !q || name.includes(q) || id.includes(q);
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="sp-menu-empty">No suppliers found</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(s => {
        const checked = selectedSupplierIDs.has(s.supplierID);
        return `
            <label class="sp-menu-item ${checked ? 'checked' : ''}" data-sid="${escapeHtml(s.supplierID)}">
                <span class="sp-checkbox ${checked ? 'checked' : ''}">
                    ${checked ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>` : ''}
                </span>
                <span class="sp-menu-item-text">
                    <span class="sp-menu-item-name">${escapeHtml(s.name || s.supplierID)}</span>
                    <span class="sp-menu-item-id">${escapeHtml(s.supplierID)}</span>
                </span>
            </label>`;
    }).join('');

    // Attach click listeners
    listEl.querySelectorAll('.sp-menu-item').forEach(item => {
        item.addEventListener('click', () => toggleSupplier(item.dataset.sid));
    });
}

function toggleSupplier(supplierID) {
    if (selectedSupplierIDs.has(supplierID)) {
        selectedSupplierIDs.delete(supplierID);
    } else {
        selectedSupplierIDs.add(supplierID);
    }
    buildSupplierList(document.getElementById('sp-supplier-search')?.value || '');
    updateSelectedTags();

    // Clear error if at least one selected
    if (selectedSupplierIDs.size > 0) {
        const err = document.getElementById('err-sp-suppliers');
        if (err) err.classList.remove('show');
    }
}

function updateSelectedTags() {
    const tagsEl = document.getElementById('sp-selected-tags');
    if (!tagsEl) return;

    if (selectedSupplierIDs.size === 0) {
        tagsEl.innerHTML = `<span class="sp-placeholder">— Click to select suppliers —</span>`;
        return;
    }

    const tags = [...selectedSupplierIDs].map(id => {
        const sup = spSuppliers.find(s => s.supplierID === id);
        const label = sup ? sup.name : id;
        return `
            <span class="sp-tag">
                ${escapeHtml(label)}
                <button type="button" class="sp-tag-remove" onclick="event.stopPropagation();toggleSupplier('${escapeHtml(id)}')">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </span>`;
    }).join('');
    tagsEl.innerHTML = tags;
}

function toggleSpSupplierDropdown() {
    const menu = document.getElementById('sp-multiselect-menu');
    const arrow = document.getElementById('sp-dropdown-arrow');
    if (!menu) return;
    const isOpen = menu.classList.contains('open');
    if (isOpen) {
        menu.classList.remove('open');
        arrow?.classList.remove('rotated');
    } else {
        buildSupplierList();
        menu.classList.add('open');
        arrow?.classList.add('rotated');
        setTimeout(() => document.getElementById('sp-supplier-search')?.focus(), 50);
    }
}

function filterSpSuppliers(value) {
    buildSupplierList(value);
}

function onDocClickCloseSPDropdown(e) {
    const dropdown = document.getElementById('sp-supplier-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        const menu  = document.getElementById('sp-multiselect-menu');
        const arrow = document.getElementById('sp-dropdown-arrow');
        menu?.classList.remove('open');
        arrow?.classList.remove('rotated');
    }
}

/* =====================================================
   OPEN / CLOSE MODAL
   ===================================================== */
function openAddSparePartModal() {
    editingPartID = null;
    clearSPForm();

    const id = generatePartID();
    const idField   = document.getElementById('field-sp-id');
    const idBadge   = document.getElementById('sp-id-badge');
    const idDisplay = document.getElementById('sp-id-display');
    if (idField)   idField.value            = id;
    if (idBadge)   idBadge.textContent      = id;
    if (idDisplay) idDisplay.style.display  = 'block';

    document.getElementById('sp-modal-title').textContent    = 'Add New Spare Part';
    document.getElementById('sp-modal-subtitle').textContent = 'Fill in part details and link suppliers';
    document.getElementById('sp-submit-text').textContent    = 'Add Spare Part';

    const toggleGroup = document.getElementById('sp-inventory-toggle-group');
    const toggleInput = document.getElementById('field-sp-create-inventory');
    if (toggleGroup) toggleGroup.style.display = 'block';
    if (toggleInput) toggleInput.checked = true;

    populateBrandDropdown();
    populateCategoryDropdown();
    buildSupplierList();
    openSPModal();
    setTimeout(() => document.getElementById('field-sp-name')?.focus(), 60);
}

function openEditSPModal(id) {
    const p = allSpareParts.find(x => x.partID === id);
    if (!p) { showToast('Part not found', '', 'error'); return; }

    editingPartID = id;
    clearSPForm();

    document.getElementById('field-sp-id').value       = id;
    document.getElementById('sp-id-display').style.display = 'none';
    document.getElementById('field-sp-name').value     = p.partName || '';
    document.getElementById('field-sp-cost').value     = p.costPrice ?? '';
    document.getElementById('field-sp-sell').value     = p.sellPrice ?? '';

    populateBrandDropdown(p.brand?.brandID || '');
    populateCategoryDropdown(p.category?.categoryId || '');

    // Pre-select suppliers
    selectedSupplierIDs = new Set((p.suppliers || []).map(s => s.supplierID));
    updateSelectedTags();
    buildSupplierList();

    const toggleGroup = document.getElementById('sp-inventory-toggle-group');
    if (toggleGroup) toggleGroup.style.display = 'none';

    document.getElementById('sp-modal-title').textContent    = 'Edit Spare Part';
    document.getElementById('sp-modal-subtitle').textContent = `Editing ${p.partName || id}`;
    document.getElementById('sp-submit-text').textContent    = 'Save Changes';

    openSPModal();
}

function openSPModal() {
    const modal = document.getElementById('sp-modal');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.classList.add('open', 'show');
    modal.style.display       = 'flex';
    modal.style.opacity       = '1';
    modal.style.pointerEvents = 'all';
    modal.style.zIndex        = '99999';
}

function closeSPModal() {
    const modal = document.getElementById('sp-modal');
    if (modal) {
        modal.classList.remove('open', 'show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    }
    // Close dropdown if open
    document.getElementById('sp-multiselect-menu')?.classList.remove('open');
    document.getElementById('sp-dropdown-arrow')?.classList.remove('rotated');
    clearSPForm();
    editingPartID = null;
}

function clearSPForm() {
    ['field-sp-name', 'field-sp-cost', 'field-sp-sell'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const brandSel = document.getElementById('field-sp-brand');
    const catSel   = document.getElementById('field-sp-category');
    if (brandSel) brandSel.selectedIndex = 0;
    if (catSel)   catSel.selectedIndex   = 0;

    selectedSupplierIDs = new Set();
    updateSelectedTags();

    // Clear errors
    document.querySelectorAll('#sp-form .form-control').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#sp-form .form-error').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
}

/* =====================================================
   DELETE CONFIRMATION
   ===================================================== */
function openSPDeleteConfirm(id, name) {
    spToDelete = id;
    const nameEl = document.getElementById('sp-delete-name');
    if (nameEl) nameEl.textContent = name;
    const modal = document.getElementById('sp-delete-confirm');
    if (modal) {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.add('open', 'show');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'all';
        modal.style.zIndex = '99999';
    }
}

function closeSPDeleteConfirm() {
    const modal = document.getElementById('sp-delete-confirm');
    if (modal) {
        modal.classList.remove('open', 'show');
        modal.style.display = 'none';
    }
    spToDelete = null;
}

async function confirmDeleteSP() {
    if (!spToDelete) return;
    const btn = document.getElementById('sp-confirm-delete-btn');
    setButtonLoading(btn, true, 'Deleting...');
    try {
        await api.delete('/spare-part/' + spToDelete);
        allSpareParts = allSpareParts.filter(p => p.partID !== spToDelete);
        filteredSP    = filteredSP.filter(p => p.partID !== spToDelete);
        renderSPTable(filteredSP);
        updateSPCount(filteredSP.length);
        closeSPDeleteConfirm();
        showToast('Part deleted', 'The spare part has been removed.', 'success');
    } catch (err) {
        showToast('Delete failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* =====================================================
   FORM VALIDATION
   ===================================================== */
function validateSPForm() {
    let valid = true;

    const textRules = [
        { id: 'field-sp-name',     errId: 'err-sp-name',     msg: 'Part name is required' },
        { id: 'field-sp-brand',    errId: 'err-sp-brand',    msg: 'Please select a brand' },
        { id: 'field-sp-category', errId: 'err-sp-category', msg: 'Please select a category' },
        { id: 'field-sp-cost',     errId: 'err-sp-cost',     msg: 'Cost price is required' },
        { id: 'field-sp-sell',     errId: 'err-sp-sell',     msg: 'Sell price is required' },
    ];

    textRules.forEach(r => {
        const input = document.getElementById(r.id);
        const errEl = document.getElementById(r.errId);
        if (!input) return;
        const val = input.value.trim();
        if (!val) {
            input.classList.add('error');
            if (errEl) { errEl.textContent = r.msg; errEl.classList.add('show'); }
            valid = false;
        } else {
            input.classList.remove('error');
            if (errEl) errEl.classList.remove('show');
        }
    });

    // Validate numeric prices
    const costVal = parseFloat(document.getElementById('field-sp-cost')?.value);
    const sellVal = parseFloat(document.getElementById('field-sp-sell')?.value);
    if (!isNaN(costVal) && costVal < 0) {
        const el = document.getElementById('err-sp-cost');
        if (el) { el.textContent = 'Cost price cannot be negative'; el.classList.add('show'); }
        valid = false;
    }
    if (!isNaN(sellVal) && sellVal < 0) {
        const el = document.getElementById('err-sp-sell');
        if (el) { el.textContent = 'Sell price cannot be negative'; el.classList.add('show'); }
        valid = false;
    }

    // Validate suppliers
    const suppErr = document.getElementById('err-sp-suppliers');
    if (selectedSupplierIDs.size === 0) {
        if (suppErr) { suppErr.textContent = 'Please select at least one supplier'; suppErr.classList.add('show'); }
        valid = false;
    } else {
        if (suppErr) suppErr.classList.remove('show');
    }

    return valid;
}

/* =====================================================
   BUILD PAYLOAD
   ===================================================== */
function buildSPPayload() {
    const brandID  = document.getElementById('field-sp-brand').value;
    const catID    = document.getElementById('field-sp-category').value;

    const brand    = spBrands.find(b => b.brandID === brandID) || null;
    const category = spCategories.find(c => String(c.categoryId) === String(catID)) || null;
    const suppliers = [...selectedSupplierIDs].map(id => {
        const s = spSuppliers.find(x => x.supplierID === id);
        return s ? { supplierID: s.supplierID, name: s.name, phone: s.phone, email: s.email } : { supplierID: id };
    });

    return {
        partID:    document.getElementById('field-sp-id').value,
        partName:  document.getElementById('field-sp-name').value.trim(),
        brand,
        category,
        suppliers,
        costPrice: parseFloat(document.getElementById('field-sp-cost').value) || 0,
        sellPrice: parseFloat(document.getElementById('field-sp-sell').value) || 0,
    };
}

/* =====================================================
   FORM SUBMIT (ADD / EDIT)
   ===================================================== */
async function onSPFormSubmit(e) {
    e.preventDefault();
    if (!validateSPForm()) return;

    const btn = document.getElementById('sp-save-btn');
    setButtonLoading(btn, true, editingPartID ? 'Saving...' : 'Adding...');

    const payload = buildSPPayload();

    try {
        if (editingPartID) {
            const updated = await api.put('/spare-part', payload);
            const idx = allSpareParts.findIndex(p => p.partID === editingPartID);
            if (idx !== -1) allSpareParts[idx] = updated;
        } else {
            const createWithInventory = document.getElementById('field-sp-create-inventory')?.checked ?? true;
            const endpoint = createWithInventory ? '/spare-part' : '/spare-part/without-inventory';
            const created = await api.post(endpoint, payload);
            allSpareParts.unshift(created);
        }
        filteredSP = [...allSpareParts];
        renderSPTable(filteredSP);
        updateSPCount(filteredSP.length);
        closeSPModal();
        showToast(
            editingPartID ? 'Part updated' : 'Part added',
            `${payload.partName} was ${editingPartID ? 'updated' : 'added'} successfully.`,
            'success'
        );
    } catch (err) {
        showToast('Operation failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* ─── Global Exports ─────────────────────────────── */
window.initSparePartsPage      = initSparePartsPage;
window.openAddSparePartModal   = openAddSparePartModal;
window.openEditSPModal         = openEditSPModal;
window.closeSPModal            = closeSPModal;
window.openSPDeleteConfirm     = openSPDeleteConfirm;
window.closeSPDeleteConfirm    = closeSPDeleteConfirm;
window.confirmDeleteSP         = confirmDeleteSP;
window.toggleSpSupplierDropdown = toggleSpSupplierDropdown;
window.filterSpSuppliers       = filterSpSuppliers;
window.toggleSupplier          = toggleSupplier;
window.loadSPPageData          = loadSPPageData;
