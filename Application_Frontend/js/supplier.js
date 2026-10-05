/**
 * supplier.js — Supplier Management: CRUD operations
 *
 * Real backend API: http://localhost:8080/api/supplier
 *
 * SupplierDTO structure:
 * {
 *   supplierID: string, (e.g. "S001")
 *   name: string,
 *   email: string,
 *   phone: int (e.g. 771234567)
 * }
 */

// -------------------------------------------------------
// Module state
// -------------------------------------------------------
let allSuppliers = [];       // Full list from backend
let filteredSuppliers = [];  // After search filter
let supplierToDelete = null; // ID pending delete confirmation
let editingSupplierID = null; // ID being edited (null = adding new)
let allSparePartsCatalog = []; // Catalog of all spare parts
let selectedSuppliedPartIDs = new Set(); // Multi-select state for supplied parts

/* =====================================================
   PAGE INITIALISATION
   ===================================================== */
function initSupplierPage() {
    // Attach static event listeners (modal, search, buttons)
    document.getElementById('btn-add-supplier')?.addEventListener('click', openAddSupplierModal);
    document.getElementById('supp-search-input')?.addEventListener('input', onSupplierSearchInput);
    document.getElementById('supplier-form')?.addEventListener('submit', onSupplierFormSubmit);
    document.getElementById('supp-modal-cancel-btn')?.addEventListener('click', closeSupplierModal);
    document.getElementById('supp-modal-close-btn')?.addEventListener('click', closeSupplierModal);
    document.getElementById('supp-confirm-cancel-btn')?.addEventListener('click', closeSupplierConfirm);
    document.getElementById('supp-confirm-delete-btn')?.addEventListener('click', confirmDeleteSupplier);
    document.getElementById('supp-part-search-input')?.addEventListener('input', (e) => filterSupplierSpareParts(e.target.value));
    document.getElementById('btn-select-all-parts')?.addEventListener('click', selectAllSupplierParts);
    document.getElementById('btn-clear-all-parts')?.addEventListener('click', clearAllSupplierParts);

    // Close modal/confirm on overlay click
    document.getElementById('supplier-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'supplier-modal') closeSupplierModal();
    });
    document.getElementById('supp-delete-confirm')?.addEventListener('click', (e) => {
        if (e.target.id === 'supp-delete-confirm') closeSupplierConfirm();
    });

    // Load data
    loadSuppliersData();
    loadSparePartsCatalog();
}

/* =====================================================
   LOAD ALL SUPPLIERS
   ===================================================== */
async function loadSuppliersData() {
    showSupplierSkeleton();

    try {
        allSuppliers = await api.get('/supplier');
        filteredSuppliers = [...allSuppliers];
        renderSupplierTableData(filteredSuppliers);
        updateSupplierCount(filteredSuppliers.length);
    } catch (err) {
        showSupplierTableError(err.message);
    }
}

/* =====================================================
   SEARCH / FILTER (client-side)
   ===================================================== */
function onSupplierSearchInput(e) {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
        filteredSuppliers = [...allSuppliers];
    } else {
        filteredSuppliers = allSuppliers.filter(s => {
            const suppId = (s.supplierID || s.SupplierID || '').toLowerCase();
            const nm     = (s.name || '').toLowerCase();
            const em     = (s.email || '').toLowerCase();
            const ph     = (s.phone != null ? String(s.phone) : '').toLowerCase();
            return suppId.includes(q) || nm.includes(q) || em.includes(q) || ph.includes(q);
        });
    }
    renderSupplierTableData(filteredSuppliers);
    updateSupplierCount(filteredSuppliers.length);
}

function updateSupplierCount(count) {
    const el = document.getElementById('supplier-count');
    if (el) el.textContent = `${count} supplier${count !== 1 ? 's' : ''}`;
}

/* =====================================================
   RENDER TABLE
   ===================================================== */
function renderSupplierTableData(suppliers) {
    const tbody = document.getElementById('suppliers-tbody');
    if (!tbody) return;

    if (!suppliers || suppliers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table-cell">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v11.177"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">${allSuppliers.length === 0 ? 'No suppliers yet' : 'No matching suppliers'}</div>
                        <div class="empty-state-msg">${allSuppliers.length === 0 ? 'Click "Add Supplier" to register your first supplier.' : 'Try adjusting your search criteria.'}</div>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = suppliers.map(s => {
        const id = s.supplierID || s.SupplierID || '—';
        const name = s.name || 'Unnamed Supplier';
        const initials = name.substring(0, 2).toUpperCase() || 'SP';
        const color = avatarColor(id);
        const phone = s.phone != null ? String(s.phone) : '—';

        return `
            <tr>
                <td>
                    <div class="avatar-cell">
                        <div class="avatar" style="background:${color}">${escapeHtml(initials)}</div>
                        <div class="avatar-info">
                            <span class="user-name">${escapeHtml(name)}</span>
                            <span class="user-id">${escapeHtml(id)}</span>
                        </div>
                    </div>
                </td>
                <td class="hide-mobile">${escapeHtml(s.email || '—')}</td>
                <td class="hide-mobile">${escapeHtml(phone)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-edit" title="Edit Supplier" onclick="openEditSupplierModal('${escapeHtml(id)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                            </svg>
                        </button>
                        <button class="action-btn action-delete" title="Delete Supplier" onclick="openSupplierDeleteConfirm('${escapeHtml(id)}', '${escapeHtml(name)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function showSupplierSkeleton() {
    const tbody = document.getElementById('suppliers-tbody');
    if (!tbody) return;
    tbody.innerHTML = Array(4).fill(0).map(() => `
        <tr>
            <td><div class="skeleton" style="height:36px;width:180px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:14px;width:140px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:14px;width:100px"></div></td>
            <td><div class="skeleton" style="height:30px;width:66px"></div></td>
        </tr>`).join('');
}

function showSupplierTableError(msg) {
    const tbody = document.getElementById('suppliers-tbody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="empty-table-cell">
                <div class="empty-state">
                    <div class="empty-state-title" style="color:var(--color-danger)">Failed to load suppliers</div>
                    <div class="empty-state-msg">${escapeHtml(msg)}</div>
                    <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="loadSuppliersData()">Try Again</button>
                </div>
            </td>
        </tr>`;
}

/* =====================================================
   AUTO ID GENERATION (S001 style)
   ===================================================== */
function generateSupplierID() {
    let maxNum = 0;
    (allSuppliers || []).forEach(s => {
        const id = s ? (s.supplierID || s.SupplierID || '') : '';
        if (id) {
            const match = id.match(/\d+/);
            if (match) {
                const num = parseInt(match[0], 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        }
    });
    return 'S' + String(maxNum + 1).padStart(3, '0');
}

/* =====================================================
   SUPPLIED SPARE PARTS HELPERS
   ===================================================== */
async function loadSparePartsCatalog() {
    try {
        const parts = await api.get('/spare-part');
        allSparePartsCatalog = Array.isArray(parts) ? parts : [];
    } catch (err) {
        console.warn('Failed to load spare parts catalog:', err);
        allSparePartsCatalog = [];
    }
}

function updateSuppliedPartsCountBadge() {
    const badge = document.getElementById('supp-part-count-badge');
    if (badge) {
        badge.textContent = `${selectedSuppliedPartIDs.size} selected`;
    }
}

function renderSupplierSparePartsList(filterText = '') {
    const listEl = document.getElementById('supp-spare-parts-list');
    if (!listEl) return;

    const q = (filterText || '').toLowerCase();
    const filtered = (allSparePartsCatalog || []).filter(p => {
        const id   = (p.partID || '').toLowerCase();
        const name = (p.partName || '').toLowerCase();
        const brand = (p.brand?.brandName || '').toLowerCase();
        const cat  = (p.category?.categoryName || '').toLowerCase();
        return !q || id.includes(q) || name.includes(q) || brand.includes(q) || cat.includes(q);
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center;padding:16px;color:var(--color-text-muted);font-size:12px;">${allSparePartsCatalog.length === 0 ? 'No spare parts in catalog' : 'No matching spare parts'}</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(p => {
        const isChecked = selectedSuppliedPartIDs.has(p.partID);
        const brandName = p.brand?.brandName ? ` • ${escapeHtml(p.brand.brandName)}` : '';
        const catName   = p.category?.categoryName ? ` • ${escapeHtml(p.category.categoryName)}` : '';
        return `
            <div class="supp-part-item ${isChecked ? 'checked' : ''}" data-pid="${escapeHtml(p.partID)}" style="
                display:flex;align-items:center;justify-content:space-between;padding:8px 10px;
                border-radius:6px;cursor:pointer;margin-bottom:4px;
                background:${isChecked ? 'rgba(0,117,255,0.14)' : 'rgba(255,255,255,0.02)'};
                border:1px solid ${isChecked ? 'rgba(0,117,255,0.4)' : 'rgba(255,255,255,0.06)'};
                transition:all 0.15s ease;
            ">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                    <div style="
                        width:16px;height:16px;border-radius:4px;flex-shrink:0;
                        border:1.5px solid ${isChecked ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)'};
                        background:${isChecked ? 'var(--color-accent)' : 'transparent'};
                        display:flex;align-items:center;justify-content:center;
                        color:#000;font-size:10px;font-weight:bold;
                    ">
                        ${isChecked ? '✓' : ''}
                    </div>
                    <div style="display:flex;flex-direction:column;min-width:0;">
                        <span style="font-size:13px;font-weight:600;color:#F1F5F9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${escapeHtml(p.partName || p.partID)}
                        </span>
                        <span style="font-size:11px;color:var(--color-text-muted);">
                            <span style="font-family:monospace;color:var(--color-accent);">${escapeHtml(p.partID)}</span>${brandName}${catName}
                        </span>
                    </div>
                </div>
                <div style="font-size:12px;color:#34D399;font-weight:600;margin-left:8px;flex-shrink:0;">
                    Rs. ${p.sellPrice != null ? p.sellPrice.toFixed(2) : '0.00'}
                </div>
            </div>`;
    }).join('');

    listEl.querySelectorAll('.supp-part-item').forEach(item => {
        item.addEventListener('click', () => {
            const pid = item.dataset.pid;
            if (selectedSuppliedPartIDs.has(pid)) {
                selectedSuppliedPartIDs.delete(pid);
            } else {
                selectedSuppliedPartIDs.add(pid);
            }
            updateSuppliedPartsCountBadge();
            renderSupplierSparePartsList(document.getElementById('supp-part-search-input')?.value || '');
        });
    });
}

function filterSupplierSpareParts(val) {
    renderSupplierSparePartsList(val);
}

function selectAllSupplierParts() {
    (allSparePartsCatalog || []).forEach(p => {
        if (p.partID) selectedSuppliedPartIDs.add(p.partID);
    });
    updateSuppliedPartsCountBadge();
    renderSupplierSparePartsList(document.getElementById('supp-part-search-input')?.value || '');
}

function clearAllSupplierParts() {
    selectedSuppliedPartIDs.clear();
    updateSuppliedPartsCountBadge();
    renderSupplierSparePartsList(document.getElementById('supp-part-search-input')?.value || '');
}

/* =====================================================
   MODALS: OPEN / CLOSE
   ===================================================== */
function openAddSupplierModal() {
    editingSupplierID = null;
    clearSupplierForm();

    const id = generateSupplierID();
    const idField   = document.getElementById('field-supplierID');
    const idBadge   = document.getElementById('supplierID-badge');
    const idDisplay = document.getElementById('supplierID-display');
    if (idField)   idField.value              = id;
    if (idBadge)   idBadge.textContent        = id;
    if (idDisplay) idDisplay.style.display    = 'block';

    const titleEl    = document.getElementById('supp-modal-title');
    const subtitleEl = document.getElementById('supp-modal-subtitle');
    const btnText    = document.getElementById('supp-submit-btn-text');
    if (titleEl)    titleEl.textContent    = 'Add New Supplier';
    if (subtitleEl) subtitleEl.textContent = 'Fill in supplier contact and details';
    if (btnText)    btnText.textContent    = 'Add Supplier';

    selectedSuppliedPartIDs = new Set();
    updateSuppliedPartsCountBadge();
    renderSupplierSparePartsList();
    loadSparePartsCatalog().then(() => renderSupplierSparePartsList());

    const modal = document.getElementById('supplier-modal');
    if (modal) {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.add('open');
        modal.classList.add('show');
        modal.style.display      = 'flex';
        modal.style.opacity      = '1';
        modal.style.pointerEvents = 'all';
        modal.style.zIndex       = '99999';
    }
    setTimeout(() => document.getElementById('field-supp-name')?.focus(), 60);
}

function openEditSupplierModal(id) {
    const s = allSuppliers.find(x => (x.supplierID || x.SupplierID) === id);
    if (!s) { showToast('Supplier not found', '', 'error'); return; }

    editingSupplierID = id;
    clearSupplierForm();

    const idField   = document.getElementById('field-supplierID');
    const idDisplay = document.getElementById('supplierID-display');
    if (idField)   idField.value           = id;
    if (idDisplay) idDisplay.style.display = 'none';

    const nameField  = document.getElementById('field-supp-name');
    const emailField = document.getElementById('field-supp-email');
    const phoneField = document.getElementById('field-supp-phone');
    if (nameField)  nameField.value  = s.name || '';
    if (emailField) emailField.value = s.email || '';
    if (phoneField) phoneField.value = s.phone != null ? String(s.phone) : '';

    const titleEl    = document.getElementById('supp-modal-title');
    const subtitleEl = document.getElementById('supp-modal-subtitle');
    const btnText    = document.getElementById('supp-submit-btn-text');
    if (titleEl)    titleEl.textContent    = 'Edit Supplier';
    if (subtitleEl) subtitleEl.textContent = `Editing ${s.name || ''}`;
    if (btnText)    btnText.textContent    = 'Save Changes';

    selectedSuppliedPartIDs = new Set();
    updateSuppliedPartsCountBadge();
    renderSupplierSparePartsList();

    // Load catalog and currently linked parts for this supplier
    Promise.all([
        allSparePartsCatalog.length > 0 ? Promise.resolve(allSparePartsCatalog) : loadSparePartsCatalog(),
        api.get('/supplier/' + id + '/spare-parts').catch(() => api.get('/spare-part/by-supplier/' + id))
    ]).then(([_, linkedParts]) => {
        selectedSuppliedPartIDs = new Set((linkedParts || []).map(p => p.partID));
        updateSuppliedPartsCountBadge();
        renderSupplierSparePartsList(document.getElementById('supp-part-search-input')?.value || '');
    }).catch(err => {
        console.warn('Failed loading linked spare parts:', err);
    });

    const modal = document.getElementById('supplier-modal');
    if (modal) {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.add('open');
        modal.classList.add('show');
        modal.style.display      = 'flex';
        modal.style.opacity      = '1';
        modal.style.pointerEvents = 'all';
        modal.style.zIndex       = '99999';
    }
    setTimeout(() => document.getElementById('field-supp-name')?.focus(), 60);
}

function closeSupplierModal() {
    const modal = document.getElementById('supplier-modal');
    if (modal) {
        modal.classList.remove('open');
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    }
    clearSupplierForm();
    editingSupplierID = null;
}

function clearSupplierForm() {
    ['field-supp-name', 'field-supp-email', 'field-supp-phone'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const dispEl = document.getElementById('supplierID-display');
    if (dispEl) dispEl.style.display = 'none';

    selectedSuppliedPartIDs = new Set();
    updateSuppliedPartsCountBadge();
    const searchInput = document.getElementById('supp-part-search-input');
    if (searchInput) searchInput.value = '';
    renderSupplierSparePartsList();

    document.querySelectorAll('#supplier-form .form-control').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#supplier-form .form-error').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
}

/* =====================================================
   DELETE CONFIRMATION
   ===================================================== */
function openSupplierDeleteConfirm(id, name) {
    supplierToDelete = id;
    const nameEl = document.getElementById('supp-delete-name');
    if (nameEl) nameEl.textContent = name;
    const modal = document.getElementById('supp-delete-confirm');
    if (modal) {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.add('open');
        modal.classList.add('show');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'all';
        modal.style.zIndex = '99999';
    }
}

function closeSupplierConfirm() {
    const modal = document.getElementById('supp-delete-confirm');
    if (modal) {
        modal.classList.remove('open');
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
    supplierToDelete = null;
}

async function confirmDeleteSupplier() {
    if (!supplierToDelete) return;
    const btn = document.getElementById('supp-confirm-delete-btn');
    setButtonLoading(btn, true, 'Deleting...');

    try {
        await api.delete('/supplier/' + supplierToDelete);
        allSuppliers = allSuppliers.filter(s => (s.supplierID || s.SupplierID) !== supplierToDelete);
        filteredSuppliers = filteredSuppliers.filter(s => (s.supplierID || s.SupplierID) !== supplierToDelete);
        renderSupplierTableData(filteredSuppliers);
        updateSupplierCount(filteredSuppliers.length);
        closeSupplierConfirm();
        showToast('Supplier deleted', 'The supplier has been removed successfully.', 'success');
    } catch (err) {
        showToast('Delete failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* =====================================================
   FORM SUBMIT (ADD / EDIT)
   ===================================================== */
async function onSupplierFormSubmit(e) {
    e.preventDefault();
    if (!validateSupplierForm()) return;

    const btn = document.getElementById('supp-save-btn');
    setButtonLoading(btn, true);

    const payload = buildSupplierDTO();

    try {
        let targetSupplierId = editingSupplierID;
        if (editingSupplierID) {
            const updated = await api.put('/supplier', payload);
            const idx = allSuppliers.findIndex(s => (s.supplierID || s.SupplierID) === editingSupplierID);
            if (idx !== -1) allSuppliers[idx] = updated;
        } else {
            const created = await api.post('/supplier', payload);
            allSuppliers.unshift(created);
            targetSupplierId = created?.supplierID || created?.SupplierID || payload.supplierID;
        }

        // Save supplier–spare part relationships using the existing spare_part_supplier table
        if (targetSupplierId) {
            try {
                await api.put('/supplier/' + targetSupplierId + '/spare-parts', Array.from(selectedSuppliedPartIDs));
            } catch (relErr) {
                console.warn('Could not update supplier spare parts:', relErr);
            }
        }

        filteredSuppliers = [...allSuppliers];
        renderSupplierTableData(filteredSuppliers);
        updateSupplierCount(filteredSuppliers.length);
        closeSupplierModal();
        showToast(
            editingSupplierID ? 'Supplier updated' : 'Supplier added',
            `${payload.name} was ${editingSupplierID ? 'updated' : 'added'} successfully.`,
            'success'
        );
    } catch (err) {
        showToast('Operation failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

function buildSupplierDTO() {
    const idVal = document.getElementById('field-supplierID').value;
    const phoneVal = document.getElementById('field-supp-phone').value.trim();
    return {
        supplierID: idVal,
        SupplierID: idVal,
        name: document.getElementById('field-supp-name').value.trim(),
        email: document.getElementById('field-supp-email').value.trim(),
        phone: parseInt(phoneVal.replace(/\D/g, ''), 10) || 0
    };
}

function validateSupplierForm() {
    let valid = true;
    const rules = [
        { id: 'field-supp-name', err: 'err-supp-name', msg: 'Supplier name is required' },
        { id: 'field-supp-email', err: 'err-supp-email', msg: 'Valid email is required', fn: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address' },
        { id: 'field-supp-phone', err: 'err-supp-phone', msg: 'Phone number is required', fn: v => /^[0-9]{10}$/.test(v.replace(/\D/g, '')) ? '' : 'Enter a valid 10-digit phone number' }
    ];

    rules.forEach(r => {
        const input = document.getElementById(r.id);
        const errEl = document.getElementById(r.err);
        if (!input) return;

        const val = input.value.trim();
        let errorMsg = '';

        if (!val) errorMsg = r.msg;
        else if (r.fn) errorMsg = r.fn(val);

        if (errorMsg) {
            input.classList.add('error');
            if (errEl) { errEl.textContent = errorMsg; errEl.classList.add('show'); }
            valid = false;
        } else {
            input.classList.remove('error');
            if (errEl) errEl.classList.remove('show');
        }
    });

    return valid;
}

// Expose handlers globally
window.initSupplierPage = initSupplierPage;
window.openAddSupplierModal = openAddSupplierModal;
window.openEditSupplierModal = openEditSupplierModal;
window.closeSupplierModal = closeSupplierModal;
window.openSupplierDeleteConfirm = openSupplierDeleteConfirm;
window.closeSupplierConfirm = closeSupplierConfirm;
window.confirmDeleteSupplier = confirmDeleteSupplier;
window.loadSuppliersData = loadSuppliersData;
window.filterSupplierSpareParts = filterSupplierSpareParts;
window.selectAllSupplierParts = selectAllSupplierParts;
window.clearAllSupplierParts = clearAllSupplierParts;
