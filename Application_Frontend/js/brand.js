/**
 * brand.js — Brand Management: CRUD operations
 *
 * Real backend API: http://localhost:8080/api/brand
 *
 * BrandDTO structure:
 * {
 *   brandID: string, (e.g. "B001")
 *   brandName: string,
 *   countryOfOrigin: string
 * }
 */

// -------------------------------------------------------
// Module state
// -------------------------------------------------------
let allBrands = [];         // Full list from backend
let filteredBrands = [];    // After search filter
let brandToDelete = null;   // ID pending delete confirmation
let editingBrandID = null;  // ID being edited (null = adding new)

/* =====================================================
   PAGE INITIALISATION
   ===================================================== */
function initBrandPage() {
    // Attach static event listeners (modal, search, buttons)
    document.getElementById('btn-add-brand')?.addEventListener('click', openAddBrandModal);
    document.getElementById('brand-search-input')?.addEventListener('input', onBrandSearchInput);
    document.getElementById('brand-form')?.addEventListener('submit', onBrandFormSubmit);
    document.getElementById('brand-modal-cancel-btn')?.addEventListener('click', closeBrandModal);
    document.getElementById('brand-modal-close-btn')?.addEventListener('click', closeBrandModal);
    document.getElementById('brand-confirm-cancel-btn')?.addEventListener('click', closeBrandConfirm);
    document.getElementById('brand-confirm-delete-btn')?.addEventListener('click', confirmDeleteBrand);

    // Close modal/confirm on overlay click
    document.getElementById('brand-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'brand-modal') closeBrandModal();
    });
    document.getElementById('brand-delete-confirm')?.addEventListener('click', (e) => {
        if (e.target.id === 'brand-delete-confirm') closeBrandConfirm();
    });

    // Load data
    loadBrandsData();
}

/* =====================================================
   LOAD ALL BRANDS
   ===================================================== */
async function loadBrandsData() {
    showBrandSkeleton();

    try {
        allBrands = await api.get('/brand');
        filteredBrands = [...allBrands];
        renderBrandTableData(filteredBrands);
        updateBrandCount(filteredBrands.length);
    } catch (err) {
        showBrandTableError(err.message);
    }
}

/* =====================================================
   SEARCH / FILTER (client-side)
   ===================================================== */
function onBrandSearchInput(e) {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
        filteredBrands = [...allBrands];
    } else {
        filteredBrands = allBrands.filter(b => {
            const id = (b.brandID || '').toLowerCase();
            const nm = (b.brandName || '').toLowerCase();
            const co = (b.countryOfOrigin || '').toLowerCase();
            return id.includes(q) || nm.includes(q) || co.includes(q);
        });
    }
    renderBrandTableData(filteredBrands);
    updateBrandCount(filteredBrands.length);
}

function updateBrandCount(count) {
    const el = document.getElementById('brand-count');
    if (el) el.textContent = `${count} brand${count !== 1 ? 's' : ''}`;
}

/* =====================================================
   RENDER TABLE
   ===================================================== */
function renderBrandTableData(brands) {
    const tbody = document.getElementById('brands-tbody');
    if (!tbody) return;

    if (!brands || brands.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-table-cell">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">${allBrands.length === 0 ? 'No brands yet' : 'No matching brands'}</div>
                        <div class="empty-state-msg">${allBrands.length === 0 ? 'Click "Add Brand" to register your first brand.' : 'Try adjusting your search criteria.'}</div>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = brands.map(b => {
        const id = b.brandID || '—';
        const name = b.brandName || 'Unnamed Brand';
        const country = b.countryOfOrigin || '—';
        const initials = name.substring(0, 2).toUpperCase() || 'BR';
        const color = avatarColor(id);

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
                <td class="hide-mobile">
                    <span style="font-weight:600;color:#E2E8F0">${escapeHtml(name)}</span>
                </td>
                <td class="hide-mobile">
                    <span class="badge-orange">
                        📍 ${escapeHtml(country)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-edit" title="Edit Brand" onclick="openEditBrandModal('${escapeHtml(id)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                            </svg>
                        </button>
                        <button class="action-btn action-delete" title="Delete Brand" onclick="openBrandDeleteConfirm('${escapeHtml(id)}', '${escapeHtml(name)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function showBrandSkeleton() {
    const tbody = document.getElementById('brands-tbody');
    if (!tbody) return;
    tbody.innerHTML = Array(4).fill(0).map(() => `
        <tr>
            <td><div class="skeleton" style="height:36px;width:180px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:14px;width:140px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:14px;width:100px"></div></td>
            <td><div class="skeleton" style="height:30px;width:66px"></div></td>
        </tr>`).join('');
}

function showBrandTableError(msg) {
    const tbody = document.getElementById('brands-tbody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="empty-table-cell">
                <div class="empty-state">
                    <div class="empty-state-title" style="color:var(--color-danger)">Failed to load brands</div>
                    <div class="empty-state-msg">${escapeHtml(msg)}</div>
                    <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="loadBrandsData()">Try Again</button>
                </div>
            </td>
        </tr>`;
}

/* =====================================================
   AUTO ID GENERATION (B001 style)
   ===================================================== */
function generateBrandID() {
    let maxNum = 0;
    (allBrands || []).forEach(b => {
        const id = b ? (b.brandID || '') : '';
        if (id) {
            const match = id.match(/\d+/);
            if (match) {
                const num = parseInt(match[0], 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        }
    });
    return 'B' + String(maxNum + 1).padStart(3, '0');
}

/* =====================================================
   MODALS: OPEN / CLOSE
   ===================================================== */
function openAddBrandModal() {
    editingBrandID = null;
    clearBrandForm();

    const id = generateBrandID();
    const idField   = document.getElementById('field-brandID');
    const idBadge   = document.getElementById('brandID-badge');
    const idDisplay = document.getElementById('brandID-display');
    if (idField)   idField.value           = id;
    if (idBadge)   idBadge.textContent     = id;
    if (idDisplay) idDisplay.style.display = 'block';

    const titleEl    = document.getElementById('brand-modal-title');
    const subtitleEl = document.getElementById('brand-modal-subtitle');
    const btnText    = document.getElementById('brand-submit-btn-text');
    if (titleEl)    titleEl.textContent    = 'Add New Brand';
    if (subtitleEl) subtitleEl.textContent = 'Fill in manufacturer and brand details';
    if (btnText)    btnText.textContent    = 'Add Brand';

    const modal = document.getElementById('brand-modal');
    if (modal) {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.add('open');
        modal.classList.add('show');
        modal.style.display      = 'flex';
        modal.style.opacity      = '1';
        modal.style.pointerEvents = 'all';
        modal.style.zIndex       = '99999';
    }
    setTimeout(() => document.getElementById('field-brand-name')?.focus(), 60);
}

function openEditBrandModal(id) {
    const b = allBrands.find(x => x.brandID === id);
    if (!b) { showToast('Brand not found', '', 'error'); return; }

    editingBrandID = id;
    clearBrandForm();

    const idField   = document.getElementById('field-brandID');
    const idDisplay = document.getElementById('brandID-display');
    if (idField)   idField.value           = id;
    if (idDisplay) idDisplay.style.display = 'none';

    const nameField    = document.getElementById('field-brand-name');
    const countryField = document.getElementById('field-brand-country');
    if (nameField)    nameField.value    = b.brandName || '';
    if (countryField) countryField.value = b.countryOfOrigin || '';

    const titleEl    = document.getElementById('brand-modal-title');
    const subtitleEl = document.getElementById('brand-modal-subtitle');
    const btnText    = document.getElementById('brand-submit-btn-text');
    if (titleEl)    titleEl.textContent    = 'Edit Brand';
    if (subtitleEl) subtitleEl.textContent = `Editing ${b.brandName || ''}`;
    if (btnText)    btnText.textContent    = 'Save Changes';

    const modal = document.getElementById('brand-modal');
    if (modal) {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.add('open');
        modal.classList.add('show');
        modal.style.display      = 'flex';
        modal.style.opacity      = '1';
        modal.style.pointerEvents = 'all';
        modal.style.zIndex       = '99999';
    }
    setTimeout(() => document.getElementById('field-brand-name')?.focus(), 60);
}

function closeBrandModal() {
    const modal = document.getElementById('brand-modal');
    if (modal) {
        modal.classList.remove('open');
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    }
    clearBrandForm();
    editingBrandID = null;
}

function clearBrandForm() {
    ['field-brand-name', 'field-brand-country'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const dispEl = document.getElementById('brandID-display');
    if (dispEl) dispEl.style.display = 'none';
    document.querySelectorAll('#brand-form .form-control').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#brand-form .form-error').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
}

/* =====================================================
   DELETE CONFIRMATION
   ===================================================== */
function openBrandDeleteConfirm(id, name) {
    brandToDelete = id;
    const nameEl = document.getElementById('brand-delete-name');
    if (nameEl) nameEl.textContent = name;
    const modal = document.getElementById('brand-delete-confirm');
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

function closeBrandConfirm() {
    const modal = document.getElementById('brand-delete-confirm');
    if (modal) {
        modal.classList.remove('open');
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
    brandToDelete = null;
}

async function confirmDeleteBrand() {
    if (!brandToDelete) return;
    const btn = document.getElementById('brand-confirm-delete-btn');
    setButtonLoading(btn, true, 'Deleting...');

    try {
        await api.delete('/brand/' + brandToDelete);
        allBrands = allBrands.filter(b => b.brandID !== brandToDelete);
        filteredBrands = filteredBrands.filter(b => b.brandID !== brandToDelete);
        renderBrandTableData(filteredBrands);
        updateBrandCount(filteredBrands.length);
        closeBrandConfirm();
        showToast('Brand deleted', 'The brand has been removed successfully.', 'success');
    } catch (err) {
        showToast('Delete failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* =====================================================
   FORM SUBMIT (ADD / EDIT)
   ===================================================== */
async function onBrandFormSubmit(e) {
    e.preventDefault();
    if (!validateBrandForm()) return;

    const btn = document.getElementById('brand-save-btn');
    setButtonLoading(btn, true);

    const payload = buildBrandDTO();

    try {
        if (editingBrandID) {
            const updated = await api.put('/brand', payload);
            const idx = allBrands.findIndex(b => b.brandID === editingBrandID);
            if (idx !== -1) allBrands[idx] = updated;
        } else {
            const created = await api.post('/brand', payload);
            allBrands.unshift(created);
        }

        filteredBrands = [...allBrands];
        renderBrandTableData(filteredBrands);
        updateBrandCount(filteredBrands.length);
        closeBrandModal();
        showToast(
            editingBrandID ? 'Brand updated' : 'Brand added',
            `${payload.brandName} was ${editingBrandID ? 'updated' : 'added'} successfully.`,
            'success'
        );
    } catch (err) {
        showToast('Operation failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

function buildBrandDTO() {
    return {
        brandID: document.getElementById('field-brandID').value,
        brandName: document.getElementById('field-brand-name').value.trim(),
        countryOfOrigin: document.getElementById('field-brand-country').value.trim()
    };
}

function validateBrandForm() {
    let valid = true;
    const rules = [
        { id: 'field-brand-name', err: 'err-brand-name', msg: 'Brand name is required' },
        { id: 'field-brand-country', err: 'err-brand-country', msg: 'Country of origin is required' }
    ];

    rules.forEach(r => {
        const input = document.getElementById(r.id);
        const errEl = document.getElementById(r.err);
        if (!input) return;

        const val = input.value.trim();
        let errorMsg = '';

        if (!val) errorMsg = r.msg;

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
window.initBrandPage = initBrandPage;
window.openAddBrandModal = openAddBrandModal;
window.openEditBrandModal = openEditBrandModal;
window.closeBrandModal = closeBrandModal;
window.openBrandDeleteConfirm = openBrandDeleteConfirm;
window.closeBrandConfirm = closeBrandConfirm;
window.confirmDeleteBrand = confirmDeleteBrand;
window.loadBrandsData = loadBrandsData;
