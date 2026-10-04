/**
 * inventory.js — Inventory Management: full CRUD
 *
 * API Endpoint: /api/inventory
 *
 * InventoryDTO:
 * {
 *   inventory_id:      string (e.g. "I001")
 *   part:              SparePartDTO { partID, partName, brand, category, costPrice, sellPrice, suppliers }
 *   quantity_on_hand:  number
 *   reorder_threshold: number
 * }
 */

/* ─── Module State ─────────────────────────────────── */
let invAllRecords     = [];
let invFilteredRecords = [];
let invSpareParts     = [];
let invToDelete       = null;
let invEditingID      = null;

/* =====================================================
   PAGE INITIALISATION
   ===================================================== */
function initInventoryPage() {
    document.getElementById('btn-add-inv')?.addEventListener('click', openAddInventoryModal);
    document.getElementById('inv-search-input')?.addEventListener('input', onInventorySearchFilter);
    document.getElementById('inv-status-filter')?.addEventListener('change', onInventorySearchFilter);
    document.getElementById('inv-form')?.addEventListener('submit', onInventoryFormSubmit);
    document.getElementById('inv-cancel-btn')?.addEventListener('click', closeInventoryModal);
    document.getElementById('inv-modal-close-btn')?.addEventListener('click', closeInventoryModal);
    document.getElementById('inv-confirm-cancel-btn')?.addEventListener('click', closeInventoryDeleteConfirm);
    document.getElementById('inv-confirm-delete-btn')?.addEventListener('click', confirmDeleteInventory);

    // Close modal on overlay click
    document.getElementById('inv-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'inv-modal') closeInventoryModal();
    });
    document.getElementById('inv-delete-confirm')?.addEventListener('click', (e) => {
        if (e.target.id === 'inv-delete-confirm') closeInventoryDeleteConfirm();
    });

    // Load page data
    loadInventoryPageData();
}

async function loadInventoryPageData() {
    showInventorySkeleton();
    try {
        [invAllRecords, invSpareParts] = await Promise.all([
            api.get('/inventory'),
            api.get('/spare-part')
        ]);
        invFilteredRecords = [...invAllRecords];
        renderInventoryTable(invFilteredRecords);
        updateInventoryMetrics();
    } catch (err) {
        showInventoryTableError(err.message);
    }
}

/* =====================================================
   METRICS & COUNTS
   ===================================================== */
function updateInventoryMetrics() {
    const countEl = document.getElementById('inv-count');
    if (countEl) countEl.textContent = `${invFilteredRecords.length} record${invFilteredRecords.length !== 1 ? 's' : ''}`;

    let total = invAllRecords.length;
    let healthy = 0;
    let low = 0;
    let out = 0;

    invAllRecords.forEach(item => {
        const qty = item.quantity_on_hand ?? 0;
        const threshold = item.reorder_threshold ?? 0;

        if (qty <= 0) {
            out++;
        } else if (qty <= threshold) {
            low++;
        } else {
            healthy++;
        }
    });

    const totalEl = document.getElementById('metric-total-items');
    const healthyEl = document.getElementById('metric-in-stock');
    const lowEl = document.getElementById('metric-low-stock');
    const outEl = document.getElementById('metric-out-stock');

    if (totalEl) totalEl.textContent = total;
    if (healthyEl) healthyEl.textContent = healthy;
    if (lowEl) lowEl.textContent = low;
    if (outEl) outEl.textContent = out;
}

/* =====================================================
   SEARCH / FILTER
   ===================================================== */
function onInventorySearchFilter() {
    const q = document.getElementById('inv-search-input')?.value.trim().toLowerCase() || '';
    const statusFilter = document.getElementById('inv-status-filter')?.value || '';

    invFilteredRecords = invAllRecords.filter(item => {
        const id = (item.inventory_id || '').toLowerCase();
        const partName = (item.part?.partName || '').toLowerCase();
        const partID = (item.part?.partID || '').toLowerCase();
        const brand = (item.part?.brand?.brandName || '').toLowerCase();
        const cat = (item.part?.category?.categoryName || '').toLowerCase();

        const matchesQuery = !q || id.includes(q) || partName.includes(q) || partID.includes(q) || brand.includes(q) || cat.includes(q);

        const qty = item.quantity_on_hand ?? 0;
        const threshold = item.reorder_threshold ?? 0;

        let itemStatus = 'INSTOCK';
        if (qty <= 0) itemStatus = 'OUTOFSTOCK';
        else if (qty <= threshold) itemStatus = 'LOWSTOCK';

        const matchesStatus = !statusFilter || itemStatus === statusFilter;

        return matchesQuery && matchesStatus;
    });

    renderInventoryTable(invFilteredRecords);
    updateInventoryMetrics();
}

/* =====================================================
   AUTO ID GENERATION
   ===================================================== */
function generateInventoryID() {
    let maxNum = 0;
    (invAllRecords || []).forEach(item => {
        const id = item?.inventory_id || '';
        const match = id.match(/\d+/);
        if (match) {
            const n = parseInt(match[0], 10);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        }
    });
    return 'I' + String(maxNum + 1).padStart(3, '0');
}

/* =====================================================
   POPULATE SPARE PARTS DROPDOWN
   ===================================================== */
function populatePartDropdown(selectedPartID = '') {
    const sel = document.getElementById('field-inv-part');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select Spare Part —</option>';
    (invSpareParts || []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.partID;
        opt.textContent = `${p.partName || p.partID} (${p.partID})`;
        if (p.partID === selectedPartID) opt.selected = true;
        sel.appendChild(opt);
    });
}

/* =====================================================
   RENDER TABLE
   ===================================================== */
function renderInventoryTable(items) {
    const tbody = document.getElementById('inv-tbody');
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table-cell">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">${invAllRecords.length === 0 ? 'No inventory records found' : 'No matching stock items'}</div>
                        <div class="empty-state-msg">${invAllRecords.length === 0 ? 'Click "Add Stock Item" to track part inventory.' : 'Try adjusting your search criteria or status filter.'}</div>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const invID     = item.inventory_id || '—';
        const partName  = item.part?.partName || 'Unnamed Part';
        const partID    = item.part?.partID || '—';
        const brandName = item.part?.brand?.brandName || '—';
        const catName   = item.part?.category?.categoryName || '—';
        const qty       = item.quantity_on_hand ?? 0;
        const threshold = item.reorder_threshold ?? 0;
        const initials  = partName.substring(0, 2).toUpperCase();
        const color     = avatarColor(invID);

        // Status badge calculation
        let statusBadge = '';
        if (qty <= 0) {
            statusBadge = `<span class="badge" style="background:rgba(239,68,68,0.15);color:#F87171;border:1px solid rgba(239,68,68,0.3);padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:600;">Out of Stock</span>`;
        } else if (qty <= threshold) {
            statusBadge = `<span class="badge" style="background:rgba(245,158,11,0.15);color:#FBBF24;border:1px solid rgba(245,158,11,0.3);padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:600;">Low Stock Alert</span>`;
        } else {
            statusBadge = `<span class="badge" style="background:rgba(16,185,129,0.15);color:#34D399;border:1px solid rgba(16,185,129,0.3);padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:600;">In Stock</span>`;
        }

        return `
            <tr>
                <td>
                    <div class="avatar-cell">
                        <div class="avatar" style="background:${color};font-size:11px;">${escapeHtml(initials)}</div>
                        <div class="avatar-info">
                            <span class="user-name">${escapeHtml(partName)}</span>
                            <span class="user-id">Part ID: ${escapeHtml(partID)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <code style="font-size:12px;font-weight:700;letter-spacing:0.5px;background:rgba(0,117,255,0.12);color:#93C5FD;border:1px solid rgba(0,117,255,0.25);padding:3px 8px;border-radius:6px;font-family:'Courier New',monospace;">${escapeHtml(invID)}</code>
                </td>
                <td class="hide-mobile">
                    <div style="display:flex;flex-direction:column;gap:2px;">
                        <span style="font-weight:600;color:#E2E8F0;font-size:13px;">${escapeHtml(brandName)}</span>
                        <span style="color:var(--color-text-muted);font-size:11.5px;">${escapeHtml(catName)}</span>
                    </div>
                </td>
                <td>
                    <span style="font-weight:700;font-size:14px;color:${qty <= 0 ? '#F87171' : (qty <= threshold ? '#FBBF24' : '#34D399')}">${qty}</span>
                </td>
                <td class="hide-mobile">
                    <span style="color:var(--color-text-muted);font-size:13px;">${threshold}</span>
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td style="text-align:right;">
                    <div class="action-buttons" style="justify-content:flex-end;">
                        <button class="action-btn action-edit" title="Edit Inventory" onclick="openEditInventoryModal('${escapeHtml(invID)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                            </svg>
                        </button>
                        <button class="action-btn action-delete" title="Delete Record" onclick="openInventoryDeleteConfirm('${escapeHtml(invID)}', '${escapeHtml(partName)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function showInventorySkeleton() {
    const tbody = document.getElementById('inv-tbody');
    if (!tbody) return;
    tbody.innerHTML = Array(5).fill(0).map(() => `
        <tr>
            <td><div class="skeleton" style="height:36px;width:180px"></div></td>
            <td><div class="skeleton" style="height:22px;width:60px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:24px;width:120px"></div></td>
            <td><div class="skeleton" style="height:16px;width:40px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:16px;width:40px"></div></td>
            <td><div class="skeleton" style="height:22px;width:90px"></div></td>
            <td><div class="skeleton" style="height:30px;width:66px;margin-left:auto;"></div></td>
        </tr>`).join('');
}

function showInventoryTableError(msg) {
    const tbody = document.getElementById('inv-tbody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-table-cell">
                <div class="empty-state">
                    <div class="empty-state-title" style="color:var(--color-danger)">Failed to load inventory records</div>
                    <div class="empty-state-msg">${escapeHtml(msg)}</div>
                    <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="loadInventoryPageData()">Try Again</button>
                </div>
            </td>
        </tr>`;
}

/* =====================================================
   OPEN / CLOSE MODAL
   ===================================================== */
function openAddInventoryModal() {
    invEditingID = null;
    clearInventoryForm();

    const id = generateInventoryID();
    const idField   = document.getElementById('field-inv-id');
    const idBadge   = document.getElementById('sp-id-badge') || document.getElementById('inv-id-badge');
    const idDisplay = document.getElementById('inv-id-display');

    if (idField)   idField.value           = id;
    if (idBadge)   idBadge.textContent     = id;
    if (idDisplay) idDisplay.style.display = 'block';

    document.getElementById('inv-modal-title').textContent    = 'Add Stock Item';
    document.getElementById('inv-modal-subtitle').textContent = 'Link spare part and configure stock quantities';
    document.getElementById('inv-submit-text').textContent    = 'Add Stock Item';

    populatePartDropdown();
    openInventoryModal();
    setTimeout(() => document.getElementById('field-inv-part')?.focus(), 60);
}

function openEditInventoryModal(id) {
    const item = invAllRecords.find(x => x.inventory_id === id);
    if (!item) { showToast('Record not found', '', 'error'); return; }

    invEditingID = id;
    clearInventoryForm();

    document.getElementById('field-inv-id').value       = id;
    document.getElementById('inv-id-display').style.display = 'none';
    document.getElementById('field-inv-qty').value     = item.quantity_on_hand ?? 0;
    document.getElementById('field-inv-threshold').value = item.reorder_threshold ?? 0;

    populatePartDropdown(item.part?.partID || '');

    document.getElementById('inv-modal-title').textContent    = 'Edit Inventory Record';
    document.getElementById('inv-modal-subtitle').textContent = `Editing stock for ${item.part?.partName || id}`;
    document.getElementById('inv-submit-text').textContent    = 'Save Changes';

    openInventoryModal();
}

function openInventoryModal() {
    const modal = document.getElementById('inv-modal');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.classList.add('open', 'show');
    modal.style.display       = 'flex';
    modal.style.opacity       = '1';
    modal.style.pointerEvents = 'all';
    modal.style.zIndex        = '99999';
}

function closeInventoryModal() {
    const modal = document.getElementById('inv-modal');
    if (modal) {
        modal.classList.remove('open', 'show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    }
    clearInventoryForm();
    invEditingID = null;
}

function clearInventoryForm() {
    ['field-inv-id', 'field-inv-qty', 'field-inv-threshold'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const partSel = document.getElementById('field-inv-part');
    if (partSel) partSel.selectedIndex = 0;

    document.querySelectorAll('#inv-form .form-control').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#inv-form .form-error').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
}

/* =====================================================
   DELETE CONFIRMATION
   ===================================================== */
function openInventoryDeleteConfirm(id, partName) {
    invToDelete = id;
    const nameEl = document.getElementById('inv-delete-name');
    if (nameEl) nameEl.textContent = partName || id;

    const modal = document.getElementById('inv-delete-confirm');
    if (modal) {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.add('open', 'show');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'all';
        modal.style.zIndex = '99999';
    }
}

function closeInventoryDeleteConfirm() {
    const modal = document.getElementById('inv-delete-confirm');
    if (modal) {
        modal.classList.remove('open', 'show');
        modal.style.display = 'none';
    }
    invToDelete = null;
}

async function confirmDeleteInventory() {
    if (!invToDelete) return;
    const btn = document.getElementById('inv-confirm-delete-btn');
    setButtonLoading(btn, true, 'Deleting...');
    try {
        await api.delete('/inventory/' + invToDelete);
        invAllRecords     = invAllRecords.filter(item => item.inventory_id !== invToDelete);
        invFilteredRecords = invFilteredRecords.filter(item => item.inventory_id !== invToDelete);
        renderInventoryTable(invFilteredRecords);
        updateInventoryMetrics();
        closeInventoryDeleteConfirm();
        showToast('Record deleted', 'Inventory record was deleted successfully.', 'success');
    } catch (err) {
        showToast('Delete failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* =====================================================
   FORM VALIDATION & SUBMIT
   ===================================================== */
function validateInventoryForm() {
    let valid = true;

    const rules = [
        { id: 'field-inv-part',      errId: 'err-inv-part',      msg: 'Please select a spare part' },
        { id: 'field-inv-qty',       errId: 'err-inv-qty',       msg: 'Quantity on hand is required' },
        { id: 'field-inv-threshold', errId: 'err-inv-threshold', msg: 'Reorder threshold is required' },
    ];

    rules.forEach(r => {
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

    const qtyVal = parseInt(document.getElementById('field-inv-qty')?.value, 10);
    const thresholdVal = parseInt(document.getElementById('field-inv-threshold')?.value, 10);

    if (!isNaN(qtyVal) && qtyVal < 0) {
        const errEl = document.getElementById('err-inv-qty');
        if (errEl) { errEl.textContent = 'Quantity cannot be negative'; errEl.classList.add('show'); }
        valid = false;
    }

    if (!isNaN(thresholdVal) && thresholdVal < 0) {
        const errEl = document.getElementById('err-inv-threshold');
        if (errEl) { errEl.textContent = 'Threshold cannot be negative'; errEl.classList.add('show'); }
        valid = false;
    }

    return valid;
}

function buildInventoryPayload() {
    const partID = document.getElementById('field-inv-part').value;
    const selectedPart = invSpareParts.find(p => p.partID === partID) || null;

    let partPayload = null;
    if (selectedPart) {
        partPayload = {
            partID: selectedPart.partID,
            partName: selectedPart.partName || '',
            costPrice: typeof selectedPart.costPrice === 'number' ? selectedPart.costPrice : 0,
            sellPrice: typeof selectedPart.sellPrice === 'number' ? selectedPart.sellPrice : 0,
            brand: selectedPart.brand || null,
            category: selectedPart.category || null
        };
    }

    return {
        inventory_id:      document.getElementById('field-inv-id').value,
        part:              partPayload,
        quantity_on_hand:  parseInt(document.getElementById('field-inv-qty').value, 10) || 0,
        reorder_threshold: parseInt(document.getElementById('field-inv-threshold').value, 10) || 0,
    };
}

async function onInventoryFormSubmit(e) {
    e.preventDefault();
    if (!validateInventoryForm()) return;

    const btn = document.getElementById('inv-save-btn');
    setButtonLoading(btn, true, invEditingID ? 'Saving...' : 'Adding...');

    const payload = buildInventoryPayload();

    try {
        if (invEditingID) {
            const updated = await api.put('/inventory', payload);
            const idx = invAllRecords.findIndex(x => x.inventory_id === invEditingID);
            if (idx !== -1) invAllRecords[idx] = updated;
        } else {
            const created = await api.post('/inventory', payload);
            invAllRecords.unshift(created);
        }

        onInventorySearchFilter();
        closeInventoryModal();
        showToast(
            invEditingID ? 'Stock updated' : 'Stock item added',
            `Inventory record ${payload.inventory_id} was ${invEditingID ? 'updated' : 'created'} successfully.`,
            'success'
        );
    } catch (err) {
        showToast('Operation failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* ─── Global Exports ─────────────────────────────── */
window.initInventoryPage          = initInventoryPage;
window.openAddInventoryModal       = openAddInventoryModal;
window.openEditInventoryModal      = openEditInventoryModal;
window.closeInventoryModal         = closeInventoryModal;
window.openInventoryDeleteConfirm  = openInventoryDeleteConfirm;
window.closeInventoryDeleteConfirm = closeInventoryDeleteConfirm;
window.confirmDeleteInventory      = confirmDeleteInventory;
window.loadInventoryPageData      = loadInventoryPageData;
