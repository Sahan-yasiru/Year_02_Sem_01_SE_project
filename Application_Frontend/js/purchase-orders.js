/**
 * purchase-orders.js — UC-04 Purchase Order Management
 * Handles PO creation with supplier-linked spare parts, goods receiving with automatic inventory increment,
 * and supplier payment status tracking.
 */

/* ─── State ─────────────────────────────────────────── */
let _allPOs = [];
let _poSuppliers = [];
let _currentSupplierParts = [];
let _activePOForReceive = null;
let _activePOForPayment = null;
let _pendingDeletePOId = null;

/* ─── Page Initialization ───────────────────────────── */
window.initPurchaseOrdersPage = function () {
    loadPurchaseOrders();
    loadPOSuppliers();

    // Default order date to today
    const orderDateEl = document.getElementById('po-order-date');
    if (orderDateEl && !orderDateEl.value) {
        orderDateEl.value = new Date().toISOString().split('T')[0];
    }
};

/* ─── Helpers ───────────────────────────────────────── */
function formatPOCurrency(val) {
    return `Rs ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPODate(d) {
    if (!d) return '—';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return d;
    }
}

function poStatusBadge(status) {
    const s = status || 'PENDING';
    const labels = {
        PENDING: 'Pending',
        PARTIALLY_RECEIVED: 'Partially Received',
        RECEIVED: 'Received',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled'
    };
    return `<span class="badge-status badge-${s}">${labels[s] || s}</span>`;
}

function poPaymentBadge(payStatus) {
    const p = payStatus || 'PENDING';
    const labels = {
        PENDING: 'Unpaid',
        PARTIALLY_PAID: 'Partially Paid',
        PAID: 'Paid'
    };
    return `<span class="badge-pay badge-pay-${p}">${labels[p] || p}</span>`;
}

function supplierAvatarColor(id) {
    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
    let hash = 0;
    const str = String(id || 'SUP');
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

/* ─── Data Loading ──────────────────────────────────── */
async function loadPurchaseOrders() {
    const tbody = document.getElementById('po-tbody');
    const empty = document.getElementById('po-empty');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--color-text-muted);"><div class="spinner-sm" style="display:inline-block;margin-right:8px;"></div> Loading purchase orders…</td></tr>`;
    if (empty) empty.style.display = 'none';

    try {
        const data = await api.get('/purchase-orders');
        _allPOs = Array.isArray(data) ? data : [];
        updatePOStats(_allPOs);
        renderPOTable(_allPOs);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--color-danger);">Failed to load purchase orders: ${escapeHtml(err.message)}</td></tr>`;
        showToast('Error', err.message, 'error');
    }
}

async function loadPOSuppliers() {
    try {
        const data = await api.get('/supplier');
        _poSuppliers = Array.isArray(data) ? data : [];
        populatePOSupplierSelect();
    } catch (err) {
        console.warn('Could not load suppliers for PO select:', err);
    }
}

function populatePOSupplierSelect() {
    const sel = document.getElementById('po-supplier-select');
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">— Select supplier —</option>';
    _poSuppliers.forEach(s => {
        const id = s.supplierID || s.SupplierID || s.id;
        const name = s.name || id;
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = `${name} (${id})`;
        sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
}

/* ─── Stats & Filter ────────────────────────────────── */
function updatePOStats(orders) {
    const total = orders.length;
    let pending = 0;
    let received = 0;
    let unpaid = 0;

    orders.forEach(o => {
        const st = o.status || 'PENDING';
        const pst = o.paymentStatus || 'PENDING';

        if (st === 'PENDING' || st === 'PARTIALLY_RECEIVED') pending++;
        if (st === 'RECEIVED' || st === 'COMPLETED') received++;
        if (pst === 'PENDING' || pst === 'PARTIALLY_PAID') unpaid++;
    });

    const elTotal = document.getElementById('po-stat-total');
    const elPending = document.getElementById('po-stat-pending');
    const elReceived = document.getElementById('po-stat-received');
    const elUnpaid = document.getElementById('po-stat-unpaid');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elReceived) elReceived.textContent = received;
    if (elUnpaid) elUnpaid.textContent = unpaid;
}

function filterPOs() {
    const q = (document.getElementById('po-search')?.value || '').toLowerCase().trim();
    const status = document.getElementById('po-status-filter')?.value || '';
    const payment = document.getElementById('po-payment-filter')?.value || '';

    const filtered = _allPOs.filter(po => {
        const poId = (po.purchaseOrderId || '').toLowerCase();
        const suppName = (po.supplier?.name || po.supplier?.supplierID || '').toLowerCase();
        const matchesQ = !q || poId.includes(q) || suppName.includes(q);
        const matchesStatus = !status || po.status === status;
        const matchesPayment = !payment || po.paymentStatus === payment;
        return matchesQ && matchesStatus && matchesPayment;
    });

    renderPOTable(filtered);
}

/* ─── Render Table ──────────────────────────────────── */
function renderPOTable(orders) {
    const tbody = document.getElementById('po-tbody');
    const empty = document.getElementById('po-empty');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        return;
    }

    if (empty) empty.style.display = 'none';

    tbody.innerHTML = orders.map(po => {
        const id = po.purchaseOrderId || '—';
        const supp = po.supplier || {};
        const suppName = supp.name || supp.supplierID || 'Unassigned';
        const initials = suppName.substring(0, 2).toUpperCase();
        const color = supplierAvatarColor(supp.supplierID);
        const itemsCount = (po.items || []).length;
        const totalAmount = po.totalAmount || 0;
        const status = po.status || 'PENDING';
        const payStatus = po.paymentStatus || 'PENDING';

        const canReceive = status !== 'RECEIVED' && status !== 'CANCELLED';

        return `
            <tr>
                <td>
                    <div style="font-weight:600;font-family:monospace;color:var(--color-text-main);font-size:0.88rem;">
                        ${escapeHtml(id)}
                    </div>
                </td>
                <td>
                    <div class="avatar-cell">
                        <div class="avatar" style="background:${color};width:32px;height:32px;font-size:0.75rem;">${escapeHtml(initials)}</div>
                        <div class="avatar-info">
                            <span class="user-name" style="font-size:0.87rem;">${escapeHtml(suppName)}</span>
                            <span class="user-id" style="font-size:0.75rem;">${escapeHtml(supp.supplierID || '')}</span>
                        </div>
                    </div>
                </td>
                <td style="font-size:0.84rem;color:var(--color-text-muted);">
                    ${formatPODate(po.orderDate)}
                </td>
                <td>
                    <span style="font-size:0.82rem;font-weight:500;background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:6px;border:1px solid var(--color-border);">
                        ${itemsCount} item${itemsCount !== 1 ? 's' : ''}
                    </span>
                </td>
                <td style="font-weight:600;color:var(--color-text-main);font-size:0.88rem;">
                    ${formatPOCurrency(totalAmount)}
                </td>
                <td>${poStatusBadge(status)}</td>
                <td>${poPaymentBadge(payStatus)}</td>
                <td>
                    <div class="action-buttons" style="justify-content:flex-end;">
                        <!-- View Details -->
                        <button class="action-btn" title="View Details" onclick="viewPurchaseOrder('${escapeHtml(id)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                        </button>

                        <!-- Receive Goods -->
                        <button class="action-btn ${canReceive ? 'action-receive' : ''}" 
                                title="${canReceive ? 'Receive Goods' : 'Goods already fully received'}" 
                                style="${!canReceive ? 'opacity:0.35;cursor:not-allowed;' : 'color:#34d399;'}"
                                onclick="${canReceive ? `openReceiveModal('${escapeHtml(id)}')` : 'return false;'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3.75h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/>
                            </svg>
                        </button>

                        <!-- Update Payment Status -->
                        <button class="action-btn" title="Update Payment Status" style="color:#60a5fa;" onclick="openPaymentStatusModal('${escapeHtml(id)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                            </svg>
                        </button>

                        <!-- Delete PO -->
                        <button class="action-btn action-delete" title="Delete PO" onclick="openDeletePOConfirm('${escapeHtml(id)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

/* ─── Create Purchase Order Modal ────────────────────── */
async function openPOModal() {
    // Generate or fetch last ID
    let nextId = 'PO001';
    try {
        const lastId = await api.get('/purchase-orders/last-id');
        if (lastId) nextId = lastId;
    } catch {
        const rand = Math.floor(100 + Math.random() * 900);
        nextId = `PO${rand}`;
    }

    document.getElementById('po-id-display').value = nextId;
    document.getElementById('po-order-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('po-expected-date').value = '';
    document.getElementById('po-notes').value = '';

    populatePOSupplierSelect();
    document.getElementById('po-supplier-select').value = '';

    // Reset items section
    _currentSupplierParts = [];
    const itemsList = document.getElementById('po-items-list');
    itemsList.innerHTML = '';
    itemsList.style.display = 'none';

    document.getElementById('po-supplier-prompt').style.display = 'flex';
    document.getElementById('po-items-empty-hint').style.display = 'none';
    document.getElementById('btn-add-po-item').disabled = true;
    document.getElementById('po-parts-source-info').textContent = 'Please select a supplier';

    updatePOSummary();

    // Show modal
    const overlay = document.getElementById('po-modal-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function closePOModal() {
    const overlay = document.getElementById('po-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
}

/**
 * Handle Supplier Selection: load only spare parts linked to that supplier
 */
async function onPOSupplierChange(supplierId) {
    const promptBox = document.getElementById('po-supplier-prompt');
    const itemsList = document.getElementById('po-items-list');
    const addBtn = document.getElementById('btn-add-po-item');
    const emptyHint = document.getElementById('po-items-empty-hint');
    const sourceInfo = document.getElementById('po-parts-source-info');

    // Clear existing item rows
    itemsList.innerHTML = '';
    updatePOSummary();

    if (!supplierId) {
        _currentSupplierParts = [];
        addBtn.disabled = true;
        itemsList.style.display = 'none';
        emptyHint.style.display = 'none';
        promptBox.style.display = 'flex';
        promptBox.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <span>Please select a supplier above to load spare parts linked to that supplier.</span>`;
        if (sourceInfo) sourceInfo.textContent = 'Please select a supplier';
        return;
    }

    if (sourceInfo) sourceInfo.textContent = 'Loading supplier parts…';

    try {
        // Load parts linked to this supplier using the existing supplier–spare part relationship
        let parts = [];
        try {
            parts = await api.get(`/spare-part/by-supplier/${supplierId}`);
        } catch {
            parts = await api.get(`/supplier/${supplierId}/spare-parts`);
        }

        _currentSupplierParts = Array.isArray(parts) ? parts : [];

        if (_currentSupplierParts.length === 0) {
            addBtn.disabled = true;
            itemsList.style.display = 'none';
            emptyHint.style.display = 'none';
            promptBox.style.display = 'flex';
            promptBox.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                <span>This supplier does not have any linked spare parts yet. You can assign parts to this supplier in the <strong>Suppliers</strong> module.</span>`;
            if (sourceInfo) sourceInfo.textContent = '0 linked parts found';
        } else {
            promptBox.style.display = 'none';
            itemsList.style.display = 'flex';
            addBtn.disabled = false;
            if (sourceInfo) sourceInfo.textContent = `${_currentSupplierParts.length} linked spare part${_currentSupplierParts.length !== 1 ? 's' : ''} available`;

            // Add an initial row for convenience
            addPOItemRow();
        }
    } catch (err) {
        showToast('Error', 'Failed to load supplier spare parts: ' + err.message, 'error');
        if (sourceInfo) sourceInfo.textContent = 'Failed to load parts';
    }
}

/**
 * Add a dynamic spare part item row
 */
function addPOItemRow(selectedPartId = '', qty = 1, unitPrice = 0) {
    const list = document.getElementById('po-items-list');
    const hint = document.getElementById('po-items-empty-hint');
    if (!list) return;

    if (hint) hint.style.display = 'none';
    list.style.display = 'flex';

    const rowId = `po-row-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const div = document.createElement('div');
    div.className = 'po-item-row';
    div.id = rowId;

    const optionsHtml = _currentSupplierParts.map(p => {
        const id = p.partID || p.id;
        const name = p.partName || id;
        const buyPrice = Number(p.buyPrice || p.sellPrice || 0);
        const isSelected = id === selectedPartId ? 'selected' : '';
        return `<option value="${escapeHtml(id)}" data-buyprice="${buyPrice}" data-name="${escapeHtml(name)}" ${isSelected}>
            ${escapeHtml(name)} (${escapeHtml(id)})
        </option>`;
    }).join('');

    div.innerHTML = `
        <div>
            <span class="row-field-label">Spare Part</span>
            <select class="form-input form-select po-part-select" onchange="onPOPartSelected(this, '${rowId}')" required>
                <option value="">— Select spare part —</option>
                ${optionsHtml}
            </select>
        </div>
        <div>
            <span class="row-field-label">Unit Cost (Rs)</span>
            <input type="number" step="0.01" min="0" class="form-input po-unit-cost" value="${unitPrice > 0 ? unitPrice.toFixed(2) : '0.00'}" oninput="calculatePOItemRow('${rowId}')" required/>
        </div>
        <div>
            <span class="row-field-label">Quantity</span>
            <input type="number" min="1" step="1" class="form-input po-ordered-qty" value="${qty}" oninput="calculatePOItemRow('${rowId}')" required/>
        </div>
        <div>
            <span class="row-field-label" style="text-align:right;">Line Total</span>
            <span class="po-line-total-val" id="total-${rowId}">Rs 0.00</span>
        </div>
        <div>
            <button type="button" class="btn-remove-item" onclick="removePOItemRow('${rowId}')" title="Remove item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;

    list.appendChild(div);

    // If pre-selected part provided, populate price
    if (selectedPartId) {
        const sel = div.querySelector('.po-part-select');
        sel.value = selectedPartId;
        onPOPartSelected(sel, rowId);
    } else {
        calculatePOItemRow(rowId);
    }
}

function onPOPartSelected(selectEl, rowId) {
    const opt = selectEl.selectedOptions[0];
    const unitCostInput = document.querySelector(`#${rowId} .po-unit-cost`);
    if (opt && opt.value) {
        const price = parseFloat(opt.dataset.buyprice || '0');
        if (unitCostInput && (!unitCostInput.value || parseFloat(unitCostInput.value) === 0)) {
            unitCostInput.value = price.toFixed(2);
        }
    }
    calculatePOItemRow(rowId);
}

function calculatePOItemRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const unitCost = parseFloat(row.querySelector('.po-unit-cost')?.value || '0');
    const qty = parseInt(row.querySelector('.po-ordered-qty')?.value || '0', 10);
    const total = Math.max(0, unitCost) * Math.max(0, qty);

    const totalEl = document.getElementById(`total-${rowId}`);
    if (totalEl) totalEl.textContent = formatPOCurrency(total);

    updatePOSummary();
}

function removePOItemRow(rowId) {
    document.getElementById(rowId)?.remove();
    const list = document.getElementById('po-items-list');
    const hint = document.getElementById('po-items-empty-hint');
    if (list && list.children.length === 0 && hint) {
        hint.style.display = 'block';
    }
    updatePOSummary();
}

function updatePOSummary() {
    const rows = document.querySelectorAll('#po-items-list .po-item-row');
    let distinctItems = 0;
    let totalQty = 0;
    let grandTotal = 0;

    rows.forEach(r => {
        const partId = r.querySelector('.po-part-select')?.value;
        const unitCost = parseFloat(r.querySelector('.po-unit-cost')?.value || '0');
        const qty = parseInt(r.querySelector('.po-ordered-qty')?.value || '0', 10);

        if (partId && qty > 0) {
            distinctItems++;
            totalQty += qty;
            grandTotal += (unitCost * qty);
        }
    });

    const sumItems = document.getElementById('po-sum-items');
    const sumQty = document.getElementById('po-sum-qty');
    const sumTotal = document.getElementById('po-sum-total');

    if (sumItems) sumItems.textContent = distinctItems;
    if (sumQty) sumQty.textContent = totalQty;
    if (sumTotal) sumTotal.textContent = formatPOCurrency(grandTotal);
}

async function submitPOForm(event) {
    event.preventDefault();

    const poId = document.getElementById('po-id-display').value.trim();
    const supplierId = document.getElementById('po-supplier-select').value;
    const orderDateVal = document.getElementById('po-order-date').value;
    const expectedDateVal = document.getElementById('po-expected-date').value;
    const notesVal = document.getElementById('po-notes').value.trim();

    if (!supplierId) {
        showToast('Validation Error', 'Please select a supplier for this purchase order', 'warning');
        return;
    }

    const rows = document.querySelectorAll('#po-items-list .po-item-row');
    const items = [];
    const seenParts = new Set();

    for (const r of rows) {
        const select = r.querySelector('.po-part-select');
        const partId = select?.value;
        const opt = select?.selectedOptions[0];
        const partName = opt?.dataset?.name || '';
        const unitCost = parseFloat(r.querySelector('.po-unit-cost')?.value || '0');
        const qty = parseInt(r.querySelector('.po-ordered-qty')?.value || '0', 10);

        if (!partId) continue;

        if (seenParts.has(partId)) {
            showToast('Duplicate Part', `Part "${partName || partId}" is added multiple times. Please combine quantities.`, 'warning');
            return;
        }
        seenParts.add(partId);

        if (qty <= 0) {
            showToast('Validation Error', `Please enter a quantity greater than 0 for "${partName || partId}"`, 'warning');
            return;
        }

        items.push({
            partId: partId,
            partName: partName,
            orderedQuantity: qty,
            receivedQuantity: 0,
            unitPrice: unitCost,
            lineTotal: unitCost * qty
        });
    }

    if (items.length === 0) {
        showToast('Validation Error', 'Please add at least one spare part to this purchase order', 'warning');
        return;
    }

    const payload = {
        purchaseOrderId: poId,
        supplier: {
            supplierID: supplierId
        },
        orderDate: orderDateVal
            ? new Date(orderDateVal).getTime()
            : Date.now(),
        expectedDate: expectedDateVal
            ? new Date(expectedDateVal).getTime()
            : null,

        totalAmount: items.reduce(
            (sum, item) => sum + (item.lineTotal || 0),
            0
        ),

        notes: notesVal,
        items: items
    };

    const submitBtn = document.getElementById('po-submit-btn');
    const origHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="spinner-sm" style="display:inline-block;margin-right:6px;"></div> Saving…`;

    try {
        await api.post('/purchase-orders', payload);
        showToast('Success', `Purchase Order ${poId} created successfully`, 'success');
        closePOModal();
        loadPurchaseOrders();
    } catch (err) {
        showToast('Error', err.message || 'Failed to save purchase order', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHtml;
    }
}

/* ─── Receive Goods Modal & Action ──────────────────── */
function openReceiveModal(poId) {
    const po = _allPOs.find(p => p.purchaseOrderId === poId);
    if (!po) {
        showToast('Error', 'Purchase Order not found', 'error');
        return;
    }

    _activePOForReceive = po;

    document.getElementById('po-receive-id-val').textContent = po.purchaseOrderId;
    document.getElementById('po-receive-supp-val').textContent = po.supplier?.name || po.supplier?.supplierID || '—';
    document.getElementById('po-receive-status-badge').innerHTML = poStatusBadge(po.status);

    const tbody = document.getElementById('po-receive-items-tbody');
    const items = po.items || [];

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--color-text-muted);">No items in this purchase order.</td></tr>`;
    } else {
        tbody.innerHTML = items.map(item => {
            const partName = item.partName || item.sparePart?.partName || item.partId || '—';
            const partId = item.partId || item.sparePart?.partID || '';
            const ordered = item.orderedQuantity || 0;
            const received = item.receivedQuantity || 0;
            const remaining = Math.max(0, ordered - received);
            const isFullyReceived = remaining === 0;

            return `
                <tr id="receive-row-${item.id}">
                    <td>
                        <div style="font-weight:600;color:var(--color-text-main);">${escapeHtml(partName)}</div>
                        <div style="font-size:0.75rem;color:var(--color-text-muted);font-family:monospace;">${escapeHtml(partId)}</div>
                    </td>
                    <td style="text-align:center;font-weight:500;">${ordered}</td>
                    <td style="text-align:center;color:${received > 0 ? '#34d399' : 'var(--color-text-muted)'};font-weight:600;">
                        ${received}
                    </td>
                    <td style="text-align:center;color:${remaining > 0 ? '#fbbf24' : '#34d399'};font-weight:600;">
                        ${remaining}
                    </td>
                    <td style="text-align:right;">
                        <input type="number" 
                               min="0" 
                               max="${remaining}" 
                               value="${remaining}" 
                               class="form-input po-receive-input" 
                               data-item-id="${item.id}"
                               data-part-id="${partId}"
                               data-remaining="${remaining}"
                               style="max-width:110px;text-align:right;display:inline-block;${isFullyReceived ? 'opacity:0.5;' : ''}"
                               ${isFullyReceived ? 'disabled' : ''}/>
                    </td>
                </tr>`;
        }).join('');
    }

    const overlay = document.getElementById('po-receive-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeReceiveModal() {
    const overlay = document.getElementById('po-receive-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
}

function setAllReceiveMax() {
    document.querySelectorAll('#po-receive-items-tbody .po-receive-input:not(:disabled)').forEach(input => {
        input.value = input.dataset.remaining || 0;
    });
}

function clearAllReceive() {
    document.querySelectorAll('#po-receive-items-tbody .po-receive-input:not(:disabled)').forEach(input => {
        input.value = 0;
    });
}

async function submitGoodsReceipt() {
    if (!_activePOForReceive) return;

    const poId = _activePOForReceive.purchaseOrderId;
    const inputs = document.querySelectorAll('#po-receive-items-tbody .po-receive-input:not(:disabled)');
    const receiveItems = [];

    let totalIncoming = 0;

    for (const input of inputs) {
        const incomingQty = parseInt(input.value || '0', 10);
        const maxRemaining = parseInt(input.dataset.remaining || '0', 10);
        const itemId = input.dataset.itemId;
        const partId = input.dataset.partId;

        if (incomingQty < 0) {
            showToast('Invalid Quantity', 'Received quantities cannot be negative', 'warning');
            return;
        }

        if (incomingQty > maxRemaining) {
            showToast('Quantity Exceeded', `Cannot receive more than remaining ordered quantity (${maxRemaining})`, 'warning');
            return;
        }

        if (incomingQty > 0) {
            receiveItems.push({
                itemId: itemId ? Number(itemId) : null,
                partId: partId,
                receivedQuantity: incomingQty
            });
            totalIncoming += incomingQty;
        }
    }

    if (totalIncoming <= 0) {
        showToast('No Goods Received', 'Please enter at least one quantity to receive', 'warning');
        return;
    }

    const btn = document.getElementById('btn-submit-receive');
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner-sm" style="display:inline-block;margin-right:6px;"></div> Updating Inventory…`;

    try {
        await api.put(`/purchase-orders/${poId}/receive`, receiveItems);
        showToast('Goods Received', `Successfully received ${totalIncoming} unit(s). Inventory stock has been updated!`, 'success');
        closeReceiveModal();
        loadPurchaseOrders();
    } catch (err) {
        showToast('Error', err.message || 'Failed to record received goods', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
    }
}

/* ─── Payment Status Modal & Action ─────────────────── */
function openPaymentStatusModal(poId) {
    const po = _allPOs.find(p => p.purchaseOrderId === poId);
    if (!po) return;

    _activePOForPayment = po;

    document.getElementById('po-pay-id-label').textContent = po.purchaseOrderId;
    document.getElementById('po-pay-total-label').textContent = formatPOCurrency(po.totalAmount);

    const currentPay = po.paymentStatus || 'PENDING';
    const radio = document.querySelector(`input[name="poPaymentStatusRadio"][value="${currentPay}"]`);
    if (radio) radio.checked = true;

    const overlay = document.getElementById('po-payment-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function closePaymentModal() {
    const overlay = document.getElementById('po-payment-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
}

async function submitPaymentStatusUpdate() {
    if (!_activePOForPayment) return;

    const poId = _activePOForPayment.purchaseOrderId;
    const selectedRadio = document.querySelector('input[name="poPaymentStatusRadio"]:checked');
    if (!selectedRadio) {
        showToast('Selection Required', 'Please select a payment status', 'warning');
        return;
    }

    const newPaymentStatus = selectedRadio.value;

    try {
        await api.put(`/purchase-orders/${poId}/payment-status`, { paymentStatus: newPaymentStatus });
        showToast('Payment Status Updated', `PO ${poId} status set to ${newPaymentStatus}`, 'success');
        closePaymentModal();
        loadPurchaseOrders();
    } catch (err) {
        showToast('Error', err.message || 'Failed to update payment status', 'error');
    }
}

/* ─── View Purchase Order Details Modal ──────────────── */
function viewPurchaseOrder(poId) {
    const po = _allPOs.find(p => p.purchaseOrderId === poId);
    if (!po) return;

    document.getElementById('po-view-id-label').textContent = `Order ${po.purchaseOrderId}`;

    const supp = po.supplier || {};
    const items = po.items || [];

    const body = document.getElementById('po-view-body');
    body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid var(--color-border);border-radius:10px;">
            <div>
                <div style="font-size:0.72rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Supplier</div>
                <div style="font-weight:600;font-size:0.92rem;color:var(--color-text-main);">${escapeHtml(supp.name || '—')}</div>
                <div style="font-size:0.78rem;color:var(--color-text-muted);">${escapeHtml(supp.email || '')} ${supp.phone ? '• ' + escapeHtml(String(supp.phone)) : ''}</div>
            </div>
            <div>
                <div style="font-size:0.72rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Dates</div>
                <div style="font-size:0.85rem;"><span style="color:var(--color-text-muted);">Ordered:</span> ${formatPODate(po.orderDate)}</div>
                <div style="font-size:0.85rem;"><span style="color:var(--color-text-muted);">Expected:</span> ${formatPODate(po.expectedDate)}</div>
            </div>
            <div>
                <div style="font-size:0.72rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Order Status</div>
                ${poStatusBadge(po.status)}
            </div>
            <div>
                <div style="font-size:0.72rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Payment Status</div>
                ${poPaymentBadge(po.paymentStatus)}
            </div>
        </div>

        <div style="margin-bottom:16px;">
            <div style="font-size:0.78rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:8px;">Order Items Breakdown</div>
            <div class="table-container">
                <table class="table" style="font-size:0.84rem;">
                    <thead>
                        <tr>
                            <th>Part</th>
                            <th style="text-align:right;">Unit Price</th>
                            <th style="text-align:center;">Ordered</th>
                            <th style="text-align:center;">Received</th>
                            <th style="text-align:right;">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(i => {
                            const name = i.partName || i.sparePart?.partName || i.partId || '—';
                            const id = i.partId || i.sparePart?.partID || '';
                            return `
                                <tr>
                                    <td>
                                        <div style="font-weight:600;color:var(--color-text-main);">${escapeHtml(name)}</div>
                                        <div style="font-size:0.75rem;color:var(--color-text-muted);font-family:monospace;">${escapeHtml(id)}</div>
                                    </td>
                                    <td style="text-align:right;">${formatPOCurrency(i.unitPrice)}</td>
                                    <td style="text-align:center;font-weight:600;">${i.orderedQuantity || 0}</td>
                                    <td style="text-align:center;color:${i.receivedQuantity >= i.orderedQuantity ? '#34d399' : '#fbbf24'};font-weight:600;">
                                        ${i.receivedQuantity || 0}
                                    </td>
                                    <td style="text-align:right;font-weight:600;color:var(--color-accent);">${formatPOCurrency(i.lineTotal)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(0,117,255,0.08);border:1px solid rgba(0,117,255,0.25);border-radius:10px;margin-bottom:16px;">
            <span style="font-size:0.9rem;font-weight:600;">Grand Total Amount</span>
            <span style="font-size:1.15rem;font-weight:700;color:var(--color-accent);">${formatPOCurrency(po.totalAmount)}</span>
        </div>

        ${po.notes ? `
            <div style="font-size:0.84rem;padding:10px 14px;background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:8px;margin-bottom:16px;">
                <span style="color:var(--color-text-muted);font-weight:600;">Notes:</span> ${escapeHtml(po.notes)}
            </div>
        ` : ''}

        <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="closeViewPOModal()">Close</button>
        </div>
    `;

    const overlay = document.getElementById('po-view-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeViewPOModal() {
    const overlay = document.getElementById('po-view-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
}

/* ─── Delete Purchase Order ─────────────────────────── */
function openDeletePOConfirm(poId) {
    _pendingDeletePOId = poId;
    const msg = document.getElementById('po-confirm-msg');
    if (msg) msg.textContent = `Are you sure you want to delete purchase order ${poId}? This action cannot be undone.`;

    const overlay = document.getElementById('po-confirm-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeDeletePOConfirm() {
    const overlay = document.getElementById('po-confirm-overlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
    _pendingDeletePOId = null;
}

async function executeDeletePO() {
    if (!_pendingDeletePOId) return;
    const id = _pendingDeletePOId;

    const btn = document.getElementById('po-confirm-delete-btn');
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner-sm" style="display:inline-block;margin-right:6px;"></div> Deleting…`;

    try {
        await api.delete(`/purchase-orders/${id}`);
        showToast('Success', `Purchase Order ${id} deleted successfully`, 'success');
        closeDeletePOConfirm();
        loadPurchaseOrders();
    } catch (err) {
        showToast('Error', err.message || 'Failed to delete purchase order', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
    }
}
