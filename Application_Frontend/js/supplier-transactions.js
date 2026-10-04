/**
 * supplier-transactions.js — Supplier Transaction Management
 * Backend API: http://localhost:8080/api/supplier-transaction
 */

let allSupplierTxns = [];
let filteredSupplierTxns = [];
let allSuppliersForStxn = [];
let allPartsForStxn = [];
let stxnToDeleteId = null;
let editingStxnId = null;  // numeric id when editing, null for new

/** Initialise Supplier Transactions page */
function initSupplierTransactionsPage() {
    loadSupplierTransactions();
    loadSuppliersForStxn();
    loadPartsForStxn();

    document.getElementById('stxn-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'stxn-modal-overlay') closeSupplierTxnModal();
    });
    document.getElementById('stxn-view-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'stxn-view-overlay') closeViewSupplierTxnModal();
    });
    document.getElementById('stxn-confirm-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'stxn-confirm-overlay') closeDeleteSupplierTxnConfirm();
    });
}

/* ── Data Loading ─────────────────────────────────────────────── */

async function loadSupplierTransactions() {
    const tbody = document.getElementById('stxn-tbody');
    const emptyState = document.getElementById('stxn-empty');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">
                <div class="spinner-sm" style="display:inline-block;margin-right:8px;"></div> Loading transactions...
            </td>
        </tr>`;
    if (emptyState) emptyState.style.display = 'none';

    try {
        const data = await api.get('/supplier-transaction');
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        allSupplierTxns = list;
        filteredSupplierTxns = [...allSupplierTxns];
        renderSupplierTxnsTable(filteredSupplierTxns);
        updateSupplierTxnStats(filteredSupplierTxns);
    } catch (err) {
        console.error('[SupplierTransactions] Load error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:30px;color:var(--color-danger);">
                    Failed to load transactions: ${escapeHtml(err.message || 'Server connection error')}
                </td>
            </tr>`;
        showToast('Error', err.message || 'Failed to fetch supplier transactions', 'error');
    }
}

async function loadSuppliersForStxn() {
    try {
        const data = await api.get('/supplier');
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        allSuppliersForStxn = list;
        const sel = document.getElementById('stxn-supplier-id');
        if (!sel) return;
        let html = '<option value="">--- Select Supplier ---</option>';
        list.forEach(s => {
            const id = s.supplierID || s.id || '';
            const name = s.name || id;
            html += `<option value="${escapeHtml(id)}">${escapeHtml(name)} (${escapeHtml(id)})</option>`;
        });
        sel.innerHTML = html;
    } catch (err) {
        console.warn('[SupplierTransactions] Load suppliers error:', err);
    }
}

async function loadPartsForStxn() {
    try {
        const data = await api.get('/spare-part');
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        allPartsForStxn = list;
        // Parts dropdown is populated dynamically when a supplier is selected
    } catch (err) {
        console.warn('[SupplierTransactions] Load parts error:', err);
    }
}

/** Called whenever the supplier dropdown changes — repopulates the spare parts dropdown */
async function onSupplierChangeStxn() {
    const supplierSel = document.getElementById('stxn-supplier-id');
    const partSel     = document.getElementById('stxn-part-id');
    if (!supplierSel || !partSel) return;

    const supplierId = supplierSel.value;
    if (!supplierId) {
        partSel.innerHTML = '<option value="">--- Select Spare Part ---</option>';
        return;
    }

    partSel.innerHTML = '<option value="">Loading parts...</option>';
    partSel.disabled  = true;

    try {
        const data = await api.get('/spare-part/by-supplier/' + encodeURIComponent(supplierId));
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        let html = '<option value="">--- Select Spare Part ---</option>';
        if (list.length === 0) {
            html = '<option value="">No parts linked to this supplier</option>';
        } else {
            list.forEach(p => {
                const id   = p.partID || p.id || '';
                const name = p.partName || id;
                html += `<option value="${escapeHtml(id)}">${escapeHtml(name)} (${escapeHtml(id)})</option>`;
            });
        }
        partSel.innerHTML = html;
    } catch (err) {
        console.warn('[SupplierTransactions] Load parts by supplier error:', err);
        partSel.innerHTML = '<option value="">Failed to load parts</option>';
    } finally {
        partSel.disabled = false;
    }
}

/* ── Render ───────────────────────────────────────────────────── */

function renderSupplierTxnsTable(list) {
    const tbody = document.getElementById('stxn-tbody');
    const emptyState = document.getElementById('stxn-empty');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    let html = '';
    list.forEach(txn => {
        const id         = txn.id ?? '—';
        const dateStr    = txn.date ? formatDate(txn.date) : '—';
        const supplier   = txn.supplier ? (txn.supplier.name || txn.supplier.supplierID || '—') : '—';
        const part       = txn.sparePart ? (txn.sparePart.partName || txn.sparePart.partID || '—') : '—';
        const price      = txn.price != null
            ? `Rs ${Number(txn.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            : '—';

        html += `
            <tr>
                <td style="font-weight:700;font-family:monospace;color:var(--color-accent);">#${escapeHtml(String(id))}</td>
                <td style="color:var(--color-text-muted);font-size:0.85rem;">${escapeHtml(dateStr)}</td>
                <td><span class="stxn-supplier-badge">🏭 ${escapeHtml(supplier)}</span></td>
                <td><span class="stxn-part-badge">🔧 ${escapeHtml(part)}</span></td>
                <td style="text-align:right;font-weight:700;color:var(--color-text-main);">${escapeHtml(price)}</td>
                <td style="text-align:right;">
                    <div style="display:inline-flex;gap:6px;">
                        <button class="btn btn-ghost btn-sm" onclick="openViewSupplierTxnModal(${id})" title="View Details">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="openSupplierTxnModal(${id})" title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm" style="color:var(--color-danger);" onclick="openDeleteSupplierTxnConfirm(${id})" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`;
    });
    tbody.innerHTML = html;
}

function updateSupplierTxnStats(list) {
    const totalEl     = document.getElementById('stxn-stat-total');
    const spentEl     = document.getElementById('stxn-stat-spent');
    const suppliersEl = document.getElementById('stxn-stat-suppliers');
    const partsEl     = document.getElementById('stxn-stat-parts');
    if (!totalEl) return;

    let totalSpent = 0;
    const supplierSet = new Set();
    const partSet     = new Set();

    list.forEach(t => {
        totalSpent += (t.price || 0);
        if (t.supplier) supplierSet.add(t.supplier.supplierID || t.supplier.id || '');
        if (t.sparePart) partSet.add(t.sparePart.partID || t.sparePart.id || '');
    });

    totalEl.textContent     = list.length;
    spentEl.textContent     = `Rs ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    suppliersEl.textContent = supplierSet.size;
    partsEl.textContent     = partSet.size;
}

/* ── Search / Filter ──────────────────────────────────────────── */

function filterSupplierTxns() {
    const q = (document.getElementById('stxn-search')?.value || '').trim().toLowerCase();
    filteredSupplierTxns = allSupplierTxns.filter(t => {
        const id       = String(t.id ?? '').toLowerCase();
        const supplier = (t.supplier?.name || t.supplier?.supplierID || '').toLowerCase();
        const part     = (t.sparePart?.partName || t.sparePart?.partID || '').toLowerCase();
        return !q || id.includes(q) || supplier.includes(q) || part.includes(q);
    });
    renderSupplierTxnsTable(filteredSupplierTxns);
}

/* ── Add / Edit Modal ─────────────────────────────────────────── */

function openSupplierTxnModal(editId = null) {
    editingStxnId = editId;
    const overlay    = document.getElementById('stxn-modal-overlay');
    const titleEl    = document.getElementById('stxn-modal-title');
    const subtitleEl = document.getElementById('stxn-modal-subtitle');
    const submitBtn  = document.getElementById('stxn-submit-btn');
    const editIdEl   = document.getElementById('stxn-edit-id');

    const supplierSel = document.getElementById('stxn-supplier-id');
    const partSel     = document.getElementById('stxn-part-id');
    const dateInput   = document.getElementById('stxn-date');
    const priceInput  = document.getElementById('stxn-price');

    if (editId != null) {
        const txn = allSupplierTxns.find(t => t.id === editId);
        if (!txn) return;
        titleEl.textContent    = 'Edit Supplier Transaction';
        subtitleEl.textContent = `Updating Transaction #${editId}`;
        editIdEl.value         = String(editId);
        submitBtn.innerHTML    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg> Update Transaction`;

        if (supplierSel && txn.supplier) supplierSel.value = txn.supplier.supplierID || '';
        if (partSel && txn.sparePart)    partSel.value     = txn.sparePart.partID || '';
        if (dateInput && txn.date)       dateInput.value   = new Date(txn.date).toISOString().split('T')[0];
        if (priceInput)                  priceInput.value  = txn.price ?? '';
    } else {
        titleEl.textContent    = 'New Supplier Transaction';
        subtitleEl.textContent = 'Record a supplier purchase';
        editIdEl.value         = '';
        submitBtn.innerHTML    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Save Transaction`;

        if (supplierSel) supplierSel.value = '';
        if (partSel)     partSel.value     = '';
        if (dateInput)   dateInput.value   = new Date().toISOString().split('T')[0];
        if (priceInput)  priceInput.value  = '';
    }

    if (overlay) { overlay.style.display = 'flex'; overlay.classList.add('show', 'open'); }

    // Wire up supplier change -> reload parts (attach fresh each open to avoid duplicates)
    if (supplierSel) {
        supplierSel.onchange = () => onSupplierChangeStxn();
        // If editing, pre-load parts for the already-selected supplier then restore selected part
        if (editId != null) {
            onSupplierChangeStxn().then(() => {
                const txn = allSupplierTxns.find(t => t.id === editId);
                if (partSel && txn && txn.sparePart) partSel.value = txn.sparePart.partID || '';
            });
        } else {
            // Reset parts dropdown for new transaction
            if (partSel) partSel.innerHTML = '<option value="">--- Select Spare Part ---</option>';
        }
    }
}

function closeSupplierTxnModal() {
    const overlay = document.getElementById('stxn-modal-overlay');
    if (overlay) { overlay.classList.remove('show', 'open'); overlay.style.display = 'none'; }
    editingStxnId = null;
}

async function submitSupplierTxnForm(e) {
    e.preventDefault();
    const submitBtn    = document.getElementById('stxn-submit-btn');
    const supplierID   = document.getElementById('stxn-supplier-id').value;
    const partID       = document.getElementById('stxn-part-id').value;
    const dateStr      = document.getElementById('stxn-date').value;
    const price        = parseFloat(document.getElementById('stxn-price').value);
    const editId       = document.getElementById('stxn-edit-id').value;

    if (!supplierID) { showToast('Validation Error', 'Please select a supplier', 'warning'); return; }
    if (!partID)     { showToast('Validation Error', 'Please select a spare part', 'warning'); return; }
    if (!dateStr)    { showToast('Validation Error', 'Please select a transaction date', 'warning'); return; }
    if (isNaN(price) || price < 0) { showToast('Validation Error', 'Please enter a valid price', 'warning'); return; }

    const payload = {
        supplier:  { supplierID, phone: 0, name: '', email: '' },
        sparePart: { partID, costPrice: 0, sellPrice: 0 },
        date:      new Date(dateStr).toISOString(),
        price
    };
    if (editId) payload.id = Number(editId);

    setButtonLoading(submitBtn, true, editId ? 'Updating...' : 'Saving...');
    try {
        if (editId) {
            await api.put('/supplier-transaction', payload);
            showToast('Success', `Transaction #${editId} updated successfully`, 'success');
        } else {
            await api.post('/supplier-transaction', payload);
            showToast('Success', 'Supplier transaction created successfully', 'success');
        }
        closeSupplierTxnModal();
        loadSupplierTransactions();
    } catch (err) {
        console.error('[SupplierTransactions] Save error:', err);
        showToast('Error', err.message || 'Failed to save transaction', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/* ── View Modal ───────────────────────────────────────────────── */

function openViewSupplierTxnModal(id) {
    const txn = allSupplierTxns.find(t => t.id === id);
    if (!txn) return;

    const overlay    = document.getElementById('stxn-view-overlay');
    const subtitleEl = document.getElementById('stxn-view-subtitle');
    const bodyEl     = document.getElementById('stxn-view-body');

    if (subtitleEl) subtitleEl.textContent = `Transaction #${id}`;

    const dateStr  = txn.date ? formatDate(txn.date) : '—';
    const supplier = txn.supplier ? (txn.supplier.name || txn.supplier.supplierID || '—') : '—';
    const suppID   = txn.supplier?.supplierID || '—';
    const part     = txn.sparePart ? (txn.sparePart.partName || txn.sparePart.partID || '—') : '—';
    const partID   = txn.sparePart?.partID || '—';
    const price    = txn.price != null
        ? `Rs ${Number(txn.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : '—';

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="txn-view-section">
                <div class="txn-view-section-title">Transaction Summary</div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Transaction ID</span>
                    <span class="txn-view-field-value" style="font-family:monospace;color:var(--color-accent);">#${escapeHtml(String(id))}</span>
                </div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Date</span>
                    <span class="txn-view-field-value">${escapeHtml(dateStr)}</span>
                </div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Price</span>
                    <span class="txn-view-field-value" style="color:var(--color-accent);font-weight:700;">${escapeHtml(price)}</span>
                </div>
            </div>
            <div class="txn-view-section">
                <div class="txn-view-section-title">Supplier</div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Supplier ID</span>
                    <span class="txn-view-field-value" style="font-family:monospace;">${escapeHtml(suppID)}</span>
                </div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Name</span>
                    <span class="txn-view-field-value">${escapeHtml(supplier)}</span>
                </div>
            </div>
            <div class="txn-view-section">
                <div class="txn-view-section-title">Spare Part</div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Part ID</span>
                    <span class="txn-view-field-value" style="font-family:monospace;">${escapeHtml(partID)}</span>
                </div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Part Name</span>
                    <span class="txn-view-field-value">${escapeHtml(part)}</span>
                </div>
            </div>`;
    }

    if (overlay) { overlay.style.display = 'flex'; overlay.classList.add('show', 'open'); }
}

function closeViewSupplierTxnModal() {
    const overlay = document.getElementById('stxn-view-overlay');
    if (overlay) { overlay.classList.remove('show', 'open'); overlay.style.display = 'none'; }
}

/* ── Delete ───────────────────────────────────────────────────── */

function openDeleteSupplierTxnConfirm(id) {
    stxnToDeleteId = id;
    const overlay = document.getElementById('stxn-confirm-overlay');
    const textEl  = document.getElementById('stxn-delete-id-text');
    if (textEl) textEl.textContent = `#${id}`;
    if (overlay) { overlay.style.display = 'flex'; overlay.classList.add('show', 'open'); }
}

function closeDeleteSupplierTxnConfirm() {
    const overlay = document.getElementById('stxn-confirm-overlay');
    if (overlay) { overlay.classList.remove('show', 'open'); overlay.style.display = 'none'; }
    stxnToDeleteId = null;
}

async function confirmDeleteSupplierTxn() {
    if (stxnToDeleteId == null) return;
    const btn = document.getElementById('stxn-confirm-delete-btn');
    setButtonLoading(btn, true, 'Deleting...');
    try {
        await api.delete(`/supplier-transaction/${stxnToDeleteId}`);
        showToast('Deleted', `Transaction #${stxnToDeleteId} deleted successfully`, 'success');
        closeDeleteSupplierTxnConfirm();
        loadSupplierTransactions();
    } catch (err) {
        console.error('[SupplierTransactions] Delete error:', err);
        showToast('Error', err.message || 'Failed to delete transaction', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* ── Global exposure ──────────────────────────────────────────── */
window.initSupplierTransactionsPage     = initSupplierTransactionsPage;
window.loadSupplierTransactions         = loadSupplierTransactions;
window.filterSupplierTxns               = filterSupplierTxns;
window.openSupplierTxnModal             = openSupplierTxnModal;
window.closeSupplierTxnModal            = closeSupplierTxnModal;
window.submitSupplierTxnForm            = submitSupplierTxnForm;
window.onSupplierChangeStxn             = onSupplierChangeStxn;
window.openViewSupplierTxnModal         = openViewSupplierTxnModal;
window.closeViewSupplierTxnModal        = closeViewSupplierTxnModal;
window.openDeleteSupplierTxnConfirm     = openDeleteSupplierTxnConfirm;
window.closeDeleteSupplierTxnConfirm    = closeDeleteSupplierTxnConfirm;
window.confirmDeleteSupplierTxn         = confirmDeleteSupplierTxn;
