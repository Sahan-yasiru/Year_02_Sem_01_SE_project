/**
 * orders.js — Orders page: list, create, view, update status, delete
 * API: GET/POST/PUT/DELETE /api/orders
 * Customers: GET /api/customer
 * Spare Parts: GET /api/spare-part
 */

/* ─── State ─────────────────────────────────────────── */
let _allOrders   = [];
let _customers   = [];
let _spareParts  = [];
let _pendingDeleteId = null;
let _editMode = false;

/* ─── Helpers ───────────────────────────────────────── */
const BASE = 'http://localhost:8080';

async function apiFetch(path, opts = {}) {
    const res = await fetch(BASE + path, {
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
        ...opts,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json.data;
}

/** Generate Order ID: ORD-YYYYMMDD-XXXX */
function generateOrderId() {
    const now  = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${date}-${rand}`;
}

function statusBadge(status) {
    const labels = {
        CONFIRMED:  'Confirmed',
        PROCESSING: 'Processing',
        DELIVERED:  'Delivered',
        CANCELLED:  'Cancelled',
        RETURNED:   'Returned',
    };
    return `<span class="badge-status badge-${status}">${labels[status] || status}</span>`;
}

function formatCurrency(v) {
    return `Rs ${Number(v || 0).toFixed(2)}`;
}

function customerLabel(c) {
    if (!c) return '—';
    const n = c.name || {};
    const name = [n.fistName, n.lastName].filter(Boolean).join(' ') || c.customerID;
    return `${name} (${c.customerID})`;
}

/* ─── Load Data ─────────────────────────────────────── */
async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" class="table-loading"><div class="spinner-sm"></div> Loading…</td></tr>`;

    try {
        _allOrders = await apiFetch('/api/orders');
        updateStats(_allOrders);
        renderOrders(_allOrders);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" class="table-loading" style="color:#f87171;">Failed to load orders: ${escapeHtml(e.message)}</td></tr>`;
        showToast('Error', e.message, 'error');
    }
}

async function loadOrderCustomers() {
    try {
        _customers = await apiFetch('/api/customer');
        populateCustomerSelect();
    } catch (e) {
        showToast('Warning', 'Could not load customers: ' + e.message, 'warning');
    }
}

async function loadSpareParts() {
    try {
        _spareParts = await apiFetch('/api/spare-part');
    } catch (e) {
        showToast('Warning', 'Could not load spare parts: ' + e.message, 'warning');
    }
}

/* ─── Render Table ──────────────────────────────────── */
function renderOrders(orders) {
    const tbody  = document.getElementById('orders-tbody');
    const empty  = document.getElementById('orders-empty');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = orders.map(o => {
        const cust = o.customer;
        const n    = cust?.name || {};
        const custName = [n.fistName, n.lastName].filter(Boolean).join(' ') || cust?.customerID || '—';

        // Build parts chips (show max 2, then "+N more" badge)
        const partsList = o.spareParts || [];
        const MAX_CHIPS = 2;
        let partsHtml;
        if (partsList.length === 0) {
            partsHtml = '<span style="color:var(--color-text-muted);font-size:12px;">—</span>';
        } else {
            const visible = partsList.slice(0, MAX_CHIPS);
            const extra   = partsList.length - MAX_CHIPS;
            const chips   = visible.map(p =>
                `<span class="order-part-chip" title="${escapeHtml(p.partName || p.partID)}">${escapeHtml(p.partName || p.partID)}</span>`
            ).join('');
            const moreBadge = extra > 0
                ? `<span class="order-part-chip order-part-chip-more">+${extra}</span>`
                : '';
            partsHtml = `<div class="order-parts-chips">${chips}${moreBadge}</div>`;
        }

        const date  = o.date ? new Date(o.date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';

        return `
        <tr class="table-row-hover">
            <td style="font-family:monospace;font-size:0.83rem;font-weight:600;color:var(--accent);">
                ${escapeHtml(o.orderId)}
            </td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div class="user-avatar-sm" style="background:${avatarColor(custName)};color:#1e293b;font-size:0.8rem;width:32px;height:32px;min-width:32px;">
                        ${custName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight:500;">${escapeHtml(custName)}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(cust?.customerID || '')}</div>
                    </div>
                </div>
            </td>
            <td>${partsHtml}</td>
            <td style="font-weight:600;text-align:center;">${o.quantity ?? 0}</td>
            <td style="font-weight:700;color:var(--accent);">${formatCurrency(o.totalPrice)}</td>
            <td style="font-size:0.82rem;color:var(--text-secondary);">${date}</td>
            <td>${statusBadge(o.orderStatus)}</td>
            <td>
                <div style="display:flex;justify-content:flex-end;gap:6px;">
                    <button class="btn-icon" title="View" onclick="viewOrder('${escapeHtml(o.orderId)}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </button>
                    <button class="btn-icon" title="Edit Status" onclick="openOrderEditModal('${escapeHtml(o.orderId)}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-icon-danger" title="Delete" onclick="openOrderDeleteConfirm('${escapeHtml(o.orderId)}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function updateStats(orders) {
    const el = (id) => document.getElementById(id);
    if (!el('stat-total')) return;
    el('stat-total').textContent       = orders.length;
    el('stat-confirmed').textContent   = orders.filter(o => o.orderStatus === 'CONFIRMED').length;
    el('stat-processing').textContent  = orders.filter(o => o.orderStatus === 'PROCESSING').length;
    el('stat-delivered').textContent   = orders.filter(o => o.orderStatus === 'DELIVERED').length;
}

/* ─── Filter ────────────────────────────────────────── */
function filterOrders() {
    const q      = (document.getElementById('order-search')?.value || '').toLowerCase();
    const status = document.getElementById('order-status-filter')?.value || '';

    const filtered = _allOrders.filter(o => {
        const cust = o.customer;
        const n    = cust?.name || {};
        const name = [n.fistName, n.lastName].filter(Boolean).join(' ').toLowerCase();
        const id   = (o.orderId || '').toLowerCase();
        const matchesQ = !q || id.includes(q) || name.includes(q);
        const matchesS = !status || o.orderStatus === status;
        return matchesQ && matchesS;
    });

    renderOrders(filtered);
}

/* ─── Customer Select ───────────────────────────────── */
function populateCustomerSelect() {
    const sel = document.getElementById('o-customer');
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">— Select customer —</option>';
    _customers.forEach(c => {
        const n = c.name || {};
        const label = [n.fistName, n.lastName].filter(Boolean).join(' ') || c.customerID;
        const opt = document.createElement('option');
        opt.value = c.customerID;
        opt.textContent = `${label} (${c.customerID})`;
        sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
}

/* ─── Parts Rows ────────────────────────────────────── */
function addPartRow(selectedPartId = '') {
    const list  = document.getElementById('parts-list');
    const hint  = document.getElementById('parts-empty-hint');
    if (!list) return;

    hint.style.display = 'none';
    const rowId = `part-row-${Date.now()}`;
    const div   = document.createElement('div');
    div.className = 'part-row';
    div.id = rowId;

    const options = _spareParts.map(p =>
        `<option value="${escapeHtml(p.partID)}" data-price="${p.sellPrice}" ${p.partID === selectedPartId ? 'selected' : ''}>
            ${escapeHtml(p.partName || p.partID)} — Rs ${Number(p.sellPrice || 0).toFixed(2)}
        </option>`
    ).join('');

    div.innerHTML = `
        <select onchange="updateSummary()" aria-label="Select spare part">
            <option value="">— Select part —</option>
            ${options}
        </select>
        <span class="part-price" id="price-${rowId}">Rs 0.00</span>
        <button type="button" class="btn-remove-part" onclick="removePartRow('${rowId}')" title="Remove part">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;

    div.querySelector('select').addEventListener('change', function() {
        const opt = this.selectedOptions[0];
        const price = parseFloat(opt?.dataset?.price || '0');
        document.getElementById(`price-${rowId}`).textContent = `Rs ${price.toFixed(2)}`;
        updateSummary();
    });

    // Trigger price display if pre-selected
    if (selectedPartId) {
        const sel = div.querySelector('select');
        const opt = sel.querySelector(`option[value="${selectedPartId}"]`);
        if (opt) {
            const price = parseFloat(opt.dataset.price || '0');
            div.querySelector(`#price-${rowId}`).textContent = `Rs ${price.toFixed(2)}`;
        }
    }

    list.appendChild(div);
    updateSummary();
}

function removePartRow(rowId) {
    document.getElementById(rowId)?.remove();
    const list = document.getElementById('parts-list');
    const hint = document.getElementById('parts-empty-hint');
    if (hint && list && list.children.length === 0) hint.style.display = 'block';
    updateSummary();
}

function updateSummary() {
    const rows   = document.querySelectorAll('#parts-list .part-row select');
    let total    = 0;
    let count    = 0;
    rows.forEach(sel => {
        const opt = sel.selectedOptions[0];
        if (opt && opt.value) {
            total += parseFloat(opt.dataset.price || '0');
            count++;
        }
    });
    const sumQty   = document.getElementById('sum-qty');
    const sumTotal = document.getElementById('sum-total');
    if (sumQty)   sumQty.textContent   = count;
    if (sumTotal) sumTotal.textContent = `Rs ${total.toFixed(2)}`;
}

function getSelectedParts() {
    const rows   = document.querySelectorAll('#parts-list .part-row select');
    const parts  = [];
    rows.forEach(sel => {
        if (sel.value) parts.push({ partID: sel.value });
    });
    return parts;
}

/* ─── Modal Open / Close ────────────────────────────── */
function openOrderModal() {
    _editMode = false;

    // Generate a new order ID
    const newId = generateOrderId();
    document.getElementById('o-order-id').value          = newId;
    document.getElementById('o-order-id-display').value  = newId;
    document.getElementById('o-address').value            = '';
    document.getElementById('order-modal-title').textContent    = 'New Order';
    document.getElementById('order-modal-subtitle').textContent = 'All fields marked * are required';

    // Reset parts
    const list = document.getElementById('parts-list');
    list.innerHTML = '';
    document.getElementById('parts-empty-hint').style.display = 'block';
    updateSummary();

    // Hide status (new orders always CONFIRMED)
    document.getElementById('status-group').style.display = 'none';

    // Submit button label
    document.getElementById('order-submit-btn').innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Place Order`;

    populateCustomerSelect();
    document.getElementById('o-customer').value = '';

    // Show modal
    const overlay = document.getElementById('order-modal-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function openOrderEditModal(orderId) {
    const order = _allOrders.find(o => o.orderId === orderId);
    if (!order) return;

    _editMode = true;

    document.getElementById('o-order-id').value           = order.orderId;
    document.getElementById('o-order-id-display').value   = order.orderId;
    document.getElementById('o-address').value             = order.address || '';
    document.getElementById('order-modal-title').textContent     = 'Update Order Status';
    document.getElementById('order-modal-subtitle').textContent  = `Editing ${order.orderId}`;

    // Populate parts
    const list = document.getElementById('parts-list');
    list.innerHTML = '';
    document.getElementById('parts-empty-hint').style.display = 'none';

    populateCustomerSelect();
    document.getElementById('o-customer').value = order.customer?.customerID || '';

    // Re-add existing parts
    if (order.spareParts && order.spareParts.length > 0) {
        order.spareParts.forEach(p => addPartRow(p.partID));
    } else {
        document.getElementById('parts-empty-hint').style.display = 'block';
    }

    // Show status selector
    document.getElementById('status-group').style.display = 'block';
    document.getElementById('o-status').value = order.orderStatus || 'CONFIRMED';

    updateSummary();

    document.getElementById('order-submit-btn').innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
        </svg>
        Update Order`;

    const overlay = document.getElementById('order-modal-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeOrderModal() {
    const overlay = document.getElementById('order-modal-overlay');
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 220);
}

/* ─── Submit ─────────────────────────────────────────── */
async function submitOrderForm(e) {
    e.preventDefault();

    const orderId   = document.getElementById('o-order-id').value;
    const customerId = document.getElementById('o-customer').value;
    const address   = document.getElementById('o-address').value.trim();
    const parts     = getSelectedParts();
    const status    = document.getElementById('o-status')?.value || 'CONFIRMED';

    if (!customerId) { showToast('Validation', 'Please select a customer.', 'warning'); return; }
    if (parts.length === 0) { showToast('Validation', 'Add at least one spare part.', 'warning'); return; }
    if (!address)    { showToast('Validation', 'Delivery address is required.', 'warning'); return; }

    // Calculate total from selected parts; also build full part objects
    // with numeric primitives set to 0 to satisfy Jackson (costPrice/sellPrice are primitive double)
    let totalPrice = 0;
    const spareParts = parts.map(p => {
        const sp = _spareParts.find(s => s.partID === p.partID);
        totalPrice += sp?.sellPrice || 0;
        return {
            partID:     p.partID,
            partName:   sp?.partName   || '',
            costPrice:  sp?.costPrice  ?? 0,
            sellPrice:  sp?.sellPrice  ?? 0,
        };
    });

    // CustomerDTO.phoneNumber is a primitive int — must send 0, not null/undefined
    const customerObj = { customerID: customerId, phoneNumber: 0 };

    const payload = {
        orderId,
        customer:    customerObj,
        spareParts,
        quantity:    spareParts.length,
        totalPrice,
        address,
        orderStatus: _editMode ? status : 'CONFIRMED',
    };

    const btn = document.getElementById('order-submit-btn');
    setButtonLoading(btn, true, _editMode ? 'Updating…' : 'Placing Order…');

    try {
        if (_editMode) {
            await apiFetch('/api/orders', { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Updated', `Order ${orderId} updated successfully.`, 'success');
        } else {
            await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Order Placed', `Order ${orderId} created successfully.`, 'success');
        }
        closeOrderModal();
        await loadOrders();
    } catch (err) {
        showToast('Error', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* ─── View Order ─────────────────────────────────────── */
function viewOrder(orderId) {
    const order = _allOrders.find(o => o.orderId === orderId);
    if (!order) return;

    const cust = order.customer || {};
    const n    = cust.name || {};
    const custName = [n.fistName, n.lastName].filter(Boolean).join(' ') || cust.customerID || '—';
    const date = order.date ? new Date(order.date).toLocaleString('en-US', { dateStyle:'medium', timeStyle:'short' }) : '—';

    const partsHtml = (order.spareParts || []).map(p => `
        <div class="parts-view-item">
            <span style="font-weight:500;">${escapeHtml(p.partName || p.partID)}</span>
            <span style="color:var(--accent);font-weight:600;">${formatCurrency(p.sellPrice)}</span>
        </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:0.85rem;">No parts recorded</p>';

    document.getElementById('view-order-id-label').textContent = `Order #${order.orderId}`;
    document.getElementById('order-view-body').innerHTML = `
        <div class="view-section">
            <div class="view-section-title">Order Info</div>
            <div class="view-field"><span class="view-field-label">Order ID</span><span class="view-field-value" style="font-family:monospace;">${escapeHtml(order.orderId)}</span></div>
            <div class="view-field"><span class="view-field-label">Status</span><span class="view-field-value">${statusBadge(order.orderStatus)}</span></div>
            <div class="view-field"><span class="view-field-label">Date</span><span class="view-field-value">${date}</span></div>
            <div class="view-field"><span class="view-field-label">Address</span><span class="view-field-value">${escapeHtml(order.address || '—')}</span></div>
        </div>
        <div class="view-section">
            <div class="view-section-title">Customer</div>
            <div class="view-field"><span class="view-field-label">Name</span><span class="view-field-value">${escapeHtml(custName)}</span></div>
            <div class="view-field"><span class="view-field-label">Customer ID</span><span class="view-field-value" style="font-family:monospace;">${escapeHtml(cust.customerID || '—')}</span></div>
            <div class="view-field"><span class="view-field-label">Email</span><span class="view-field-value">${escapeHtml(cust.email || '—')}</span></div>
        </div>
        <div class="view-section">
            <div class="view-section-title">Spare Parts (${(order.spareParts || []).length})</div>
            <div class="parts-view-list">${partsHtml}</div>
        </div>
        <div class="view-section">
            <div class="view-section-title">Summary</div>
            <div class="view-field"><span class="view-field-label">Quantity</span><span class="view-field-value">${order.quantity ?? 0}</span></div>
            <div class="view-field"><span class="view-field-label">Total Price</span><span class="view-field-value" style="color:var(--accent);font-size:1.05rem;font-weight:700;">${formatCurrency(order.totalPrice)}</span></div>
        </div>
        <div class="modal-actions" style="padding:0;margin-top:16px;">
            <button class="btn btn-ghost" onclick="closeViewModal()">Close</button>
            <button class="btn btn-primary" onclick="closeViewModal();openOrderEditModal('${escapeHtml(order.orderId)}')">
                Edit Status
            </button>
        </div>
    `;

    const overlay = document.getElementById('order-view-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeViewModal() {
    const overlay = document.getElementById('order-view-overlay');
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 220);
}

/* ─── Delete ─────────────────────────────────────────── */
function openOrderDeleteConfirm(orderId) {
    _pendingDeleteId = orderId;
    const overlay = document.getElementById('order-confirm-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeOrderDeleteConfirm() {
    _pendingDeleteId = null;
    const overlay = document.getElementById('order-confirm-overlay');
    overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 220);
}

async function confirmDeleteOrder() {
    if (!_pendingDeleteId) return;
    const id  = _pendingDeleteId;
    const btn = document.getElementById('confirm-delete-btn');
    setButtonLoading(btn, true, 'Deleting…');

    try {
        await apiFetch(`/api/orders/${id}`, { method: 'DELETE' });
        showToast('Deleted', `Order ${id} has been deleted.`, 'success');
        closeOrderDeleteConfirm();
        await loadOrders();
    } catch (err) {
        showToast('Error', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* ─── Close modals on overlay click ─────────────────── */
document.addEventListener('click', function(e) {
    if (e.target.id === 'order-modal-overlay')  closeOrderModal();
    if (e.target.id === 'order-view-overlay')   closeViewModal();
    if (e.target.id === 'order-confirm-overlay') closeOrderDeleteConfirm();
});

/* ─── Page Init ──────────────────────────────────────── */
async function initOrdersPage() {
    // Load all data in parallel
    await Promise.all([loadOrders(), loadOrderCustomers(), loadSpareParts()]);
}

window.initOrdersPage         = initOrdersPage;
window.openOrderModal         = openOrderModal;
window.openOrderEditModal     = openOrderEditModal;
window.closeOrderModal        = closeOrderModal;
window.submitOrderForm        = submitOrderForm;
window.viewOrder              = viewOrder;
window.closeViewModal         = closeViewModal;
window.openOrderDeleteConfirm = openOrderDeleteConfirm;
window.closeOrderDeleteConfirm= closeOrderDeleteConfirm;
window.confirmDeleteOrder     = confirmDeleteOrder;
window.filterOrders           = filterOrders;
window.loadOrders             = loadOrders;
window.loadOrderCustomers     = loadOrderCustomers;
window.addPartRow        = addPartRow;
window.removePartRow     = removePartRow;
window.updateSummary     = updateSummary;
