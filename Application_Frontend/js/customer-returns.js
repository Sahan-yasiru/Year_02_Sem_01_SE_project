/**
 * customer-returns.js — Customer Returns Management
 * Backend API: http://localhost:8080/api/customerReturn
 */

let allReturns = [];
let filteredReturns = [];
let allOrdersForReturns = [];
let returnToDeleteId = null;
let editingReturnId = null;

/** Initialise Customer Returns page */
function initCustomerReturnsPage() {
    loadReturns();
    loadOrdersForReturns();

    // Attach backdrop click events
    document.getElementById('return-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'return-modal-overlay') closeReturnModal();
    });
    document.getElementById('return-view-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'return-view-overlay') closeViewReturnModal();
    });
    document.getElementById('return-confirm-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'return-confirm-overlay') closeDeleteReturnConfirm();
    });
}

/** Load all returns from backend */
async function loadReturns() {
    const tbody = document.getElementById('returns-tbody');
    const emptyState = document.getElementById('returns-empty');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;padding:40px;color:var(--color-text-muted);">
                <div class="spinner-sm" style="display:inline-block;margin-right:8px;"></div> Loading returns…
            </td>
        </tr>`;
    if (emptyState) emptyState.style.display = 'none';

    try {
        const data = await api.get('/customerReturn');
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        allReturns = list;
        filteredReturns = [...allReturns];
        renderReturnsTable(filteredReturns);
        updateReturnsStats(filteredReturns);
    } catch (err) {
        console.error('[CustomerReturns] Load error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:30px;color:var(--color-danger);">
                    Failed to load returns: ${escapeHtml(err.message || 'Server connection error')}
                </td>
            </tr>`;
        showToast('Error', err.message || 'Failed to fetch customer returns', 'error');
    }
}

/** Load orders for the return creation select dropdown */
async function loadOrdersForReturns() {
    const orderSelect = document.getElementById('r-order-id');
    if (!orderSelect) return;

    try {
        const data = await api.get('/orders');
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        allOrdersForReturns = list;

        let optionsHtml = '<option value="">— Select Order —</option>';
        list.forEach(order => {
            const orderId = order.orderId || order.orderID || '';
            const customerName = getOrderCustomerName(order);
            const total = order.totalPrice ? ` (Rs ${Number(order.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })})` : '';
            optionsHtml += `<option value="${escapeHtml(orderId)}">${escapeHtml(orderId)} — ${escapeHtml(customerName)}${total}</option>`;
        });
        orderSelect.innerHTML = optionsHtml;
    } catch (err) {
        console.warn('[CustomerReturns] Load orders error:', err);
    }
}

/** Extract customer name from OrderDTO */
function getOrderCustomerName(order) {
    if (!order || !order.customer) return 'N/A';
    const c = order.customer;
    if (typeof c === 'string') return c;
    if (c.name) {
        if (typeof c.name === 'string') return c.name;
        const first = c.name.fistName || c.name.firstName || '';
        const last = c.name.lastName || '';
        const full = `${first} ${last}`.trim();
        if (full) return full;
    }
    return c.customerID || c.id || 'Customer';
}

/** Render table rows */
function renderReturnsTable(list) {
    const tbody = document.getElementById('returns-tbody');
    const emptyState = document.getElementById('returns-empty');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    let html = '';
    list.forEach(ret => {
        const returnID = ret.returnID || ret.returnId || '—';
        const dateStr = ret.date ? formatDate(ret.date) : '—';
        const orderId = ret.order ? (ret.order.orderId || ret.order.orderID || '—') : '—';
        const customerName = ret.order ? getOrderCustomerName(ret.order) : '—';
        const qty = ret.quantity || 0;
        const reason = ret.reason || '—';

        html += `
            <tr>
                <td style="font-weight:600;font-family:monospace;color:var(--color-text-main);">${escapeHtml(returnID)}</td>
                <td style="color:var(--color-text-muted);font-size:0.85rem;">${escapeHtml(dateStr)}</td>
                <td>
                    <span class="badge-status badge-CONFIRMED" style="font-family:monospace;">${escapeHtml(orderId)}</span>
                </td>
                <td style="font-weight:500;">${escapeHtml(customerName)}</td>
                <td>
                    <span style="font-weight:700;color:var(--color-accent);">${qty}</span> item${qty !== 1 ? 's' : ''}
                </td>
                <td style="max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-text-muted);" title="${escapeHtml(reason)}">
                    ${escapeHtml(reason)}
                </td>
                <td style="text-align:right;">
                    <div style="display:inline-flex;gap:6px;">
                        <button class="btn btn-ghost btn-sm" onclick="openViewReturnModal('${escapeHtml(returnID)}')" title="View Details">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="openReturnModal('${escapeHtml(returnID)}')" title="Edit Return">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm" style="color:var(--color-danger);" onclick="openDeleteReturnConfirm('${escapeHtml(returnID)}')" title="Delete Return">
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

/** Update summary cards */
function updateReturnsStats(list) {
    const totalReturnsEl = document.getElementById('stat-total-returns');
    const totalQtyEl = document.getElementById('stat-total-qty');
    const ordersAffectedEl = document.getElementById('stat-orders-affected');
    const latestReturnEl = document.getElementById('stat-latest-return');

    if (!totalReturnsEl) return;

    const totalReturns = list.length;
    let totalQty = 0;
    const uniqueOrders = new Set();
    let latestDate = null;

    list.forEach(r => {
        totalQty += (r.quantity || 0);
        if (r.order && (r.order.orderId || r.order.orderID)) {
            uniqueOrders.add(r.order.orderId || r.order.orderID);
        }
        if (r.date) {
            const d = new Date(r.date);
            if (!latestDate || d > latestDate) {
                latestDate = d;
            }
        }
    });

    totalReturnsEl.textContent = totalReturns;
    totalQtyEl.textContent = totalQty;
    ordersAffectedEl.textContent = uniqueOrders.size;
    latestReturnEl.textContent = latestDate ? formatDate(latestDate) : '—';
}

/** Search filter function */
function filterReturns() {
    const q = (document.getElementById('return-search')?.value || '').trim().toLowerCase();
    if (!q) {
        filteredReturns = [...allReturns];
    } else {
        filteredReturns = allReturns.filter(r => {
            const retId = (r.returnID || r.returnId || '').toLowerCase();
            const ordId = (r.order?.orderId || r.order?.orderID || '').toLowerCase();
            const cust = getOrderCustomerName(r.order).toLowerCase();
            const reason = (r.reason || '').toLowerCase();
            return retId.includes(q) || ordId.includes(q) || cust.includes(q) || reason.includes(q);
        });
    }
    renderReturnsTable(filteredReturns);
}

/** Open Add/Edit Modal */
function openReturnModal(editId = null) {
    if (!allOrdersForReturns || allOrdersForReturns.length === 0) {
        loadOrdersForReturns();
    }
    editingReturnId = editId;
    const overlay = document.getElementById('return-modal-overlay');
    const titleEl = document.getElementById('return-modal-title');
    const subtitleEl = document.getElementById('return-modal-subtitle');
    const submitBtn = document.getElementById('return-submit-btn');

    const retIdInput = document.getElementById('r-return-id');
    const orderSelect = document.getElementById('r-order-id');
    const dateInput = document.getElementById('r-date');
    const reasonInput = document.getElementById('r-reason');

    if (editId) {
        const ret = allReturns.find(r => (r.returnID || r.returnId) === editId);
        if (!ret) return;

        titleEl.textContent = 'Edit Customer Return';
        subtitleEl.textContent = `Updating return ${editId}`;
        submitBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg> Update Return`;

        retIdInput.value = editId;
        retIdInput.readOnly = true;
        retIdInput.style.opacity = '0.6';

        if (orderSelect && ret.order) {
            orderSelect.value = ret.order.orderId || ret.order.orderID || '';
        }
        if (dateInput && ret.date) {
            const d = new Date(ret.date);
            dateInput.value = d.toISOString().split('T')[0];
        } else {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        reasonInput.value = ret.reason || '';

        // Populate spare parts panel for the selected order
        setTimeout(() => handleOrderSelectChange(), 0);
    } else {
        titleEl.textContent = 'Record Customer Return';
        subtitleEl.textContent = 'Specify order details and return reason';
        submitBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Save Return`;

        // Generate auto ID
        const generatedId = 'RET-' + String(Math.floor(1000 + Math.random() * 9000));
        retIdInput.value = generatedId;
        retIdInput.readOnly = false;
        retIdInput.style.opacity = '1';

        if (orderSelect) orderSelect.value = '';
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (reasonInput) reasonInput.value = '';

        // Reset spare-parts panel
        const partsGroup = document.getElementById('return-parts-group');
        const partsHint  = document.getElementById('return-parts-hint');
        const partsList  = document.getElementById('return-parts-list');
        const qtyTotal   = document.getElementById('return-qty-total');
        if (partsGroup) partsGroup.style.display = 'none';
        if (partsHint)  partsHint.style.display  = 'none';
        if (partsList)  partsList.innerHTML = '';
        if (qtyTotal)   qtyTotal.textContent = '0';
    }

    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('show', 'open');
    }
}

/** Close Return Modal */
function closeReturnModal() {
    const overlay = document.getElementById('return-modal-overlay');
    if (overlay) {
        overlay.classList.remove('show', 'open');
        overlay.style.display = 'none';
    }
    editingReturnId = null;
}

/** Form Submission for Return */
async function submitReturnForm(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('return-submit-btn');

    const returnID = document.getElementById('r-return-id').value.trim();
    const orderId  = document.getElementById('r-order-id').value;
    const dateStr  = document.getElementById('r-date').value;
    const reason   = document.getElementById('r-reason').value.trim();

    // Count checked parts — each checked part = 1 returned item
    const checkedParts = document.querySelectorAll('.rp-checkbox:checked');
    let quantity = checkedParts.length;

    // Fallback: if no parts panel shown (edit mode fallback)
    if (document.querySelectorAll('.rp-checkbox').length === 0) quantity = 1;

    if (!returnID || !orderId || !reason) {
        showToast('Validation Error', 'Please complete all required fields', 'warning');
        return;
    }
    if (quantity < 1) {
        showToast('Validation Error', 'Please enter a return quantity of at least 1 for at least one part', 'warning');
        return;
    }

    const selectedOrder = allOrdersForReturns.find(o => String(o.orderId || o.orderID).trim() === String(orderId).trim());

    const orderPayload = selectedOrder ? {
        orderId: selectedOrder.orderId || selectedOrder.orderID,
        quantity: Number(selectedOrder.quantity || 0),
        totalPrice: Number(selectedOrder.totalPrice || 0),
        orderStatus: selectedOrder.orderStatus || 'CONFIRMED'
    } : {
        orderId: String(orderId).trim(),
        quantity: 0,
        totalPrice: 0,
        orderStatus: 'CONFIRMED'
    };

    const payload = {
        returnID: returnID,
        date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
        order: orderPayload,
        quantity: quantity,
        reason: reason
    };

    setButtonLoading(submitBtn, true, editingReturnId ? 'Updating...' : 'Saving...');

    try {
        if (editingReturnId) {
            await api.put('/customerReturn', payload);
            showToast('Success', `Customer return ${returnID} updated successfully`, 'success');
        } else {
            await api.post('/customerReturn', payload);
            showToast('Success', `Customer return ${returnID} created successfully`, 'success');
        }
        closeReturnModal();
        loadReturns();
    } catch (err) {
        console.error('[CustomerReturns] Save error:', err);
        showToast('Error', err.message || 'Failed to save customer return', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/** Open View Details Modal */
function openViewReturnModal(id) {
    const ret = allReturns.find(r => (r.returnID || r.returnId) === id);
    if (!ret) return;

    const overlay = document.getElementById('return-view-overlay');
    const labelEl = document.getElementById('view-return-id-label');
    const bodyEl = document.getElementById('return-view-body');

    if (labelEl) labelEl.textContent = `Return ID: ${id}`;
    if (bodyEl) {
        const dateStr = ret.date ? formatDate(ret.date) : '—';
        const orderId = ret.order ? (ret.order.orderId || ret.order.orderID || '—') : '—';
        const customerName = ret.order ? getOrderCustomerName(ret.order) : '—';
        const qty = ret.quantity || 0;
        const reason = ret.reason || '—';

        bodyEl.innerHTML = `
            <div class="view-section">
                <div class="view-section-title">Return Summary</div>
                <div class="view-field">
                    <span class="view-field-label">Return ID</span>
                    <span class="view-field-value" style="font-family:monospace;">${escapeHtml(id)}</span>
                </div>
                <div class="view-field">
                    <span class="view-field-label">Return Date</span>
                    <span class="view-field-value">${escapeHtml(dateStr)}</span>
                </div>
                <div class="view-field">
                    <span class="view-field-label">Returned Quantity</span>
                    <span class="view-field-value" style="color:var(--color-accent);font-weight:700;">${qty} item${qty !== 1 ? 's' : ''}</span>
                </div>
            </div>

            <div class="view-section">
                <div class="view-section-title">Associated Order</div>
                <div class="view-field">
                    <span class="view-field-label">Order ID</span>
                    <span class="view-field-value" style="font-family:monospace;">${escapeHtml(orderId)}</span>
                </div>
                <div class="view-field">
                    <span class="view-field-label">Customer Name</span>
                    <span class="view-field-value">${escapeHtml(customerName)}</span>
                </div>
            </div>

            <div class="view-section">
                <div class="view-section-title">Reason for Return</div>
                <div style="background:rgba(255,255,255,0.04);border:1px solid var(--color-border);border-radius:10px;padding:12px;font-size:0.87rem;color:var(--color-text-main);line-height:1.5;">
                    ${escapeHtml(reason)}
                </div>
            </div>`;
    }

    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('show', 'open');
    }
}

/** Close View Details Modal */
function closeViewReturnModal() {
    const overlay = document.getElementById('return-view-overlay');
    if (overlay) {
        overlay.classList.remove('show', 'open');
        overlay.style.display = 'none';
    }
}

/** Open Delete Confirmation Modal */
function openDeleteReturnConfirm(id) {
    returnToDeleteId = id;
    const overlay = document.getElementById('return-confirm-overlay');
    const textEl = document.getElementById('delete-return-id-text');
    if (textEl) textEl.textContent = id;
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('show', 'open');
    }
}

/** Close Delete Confirmation Modal */
function closeDeleteReturnConfirm() {
    const overlay = document.getElementById('return-confirm-overlay');
    if (overlay) {
        overlay.classList.remove('show', 'open');
        overlay.style.display = 'none';
    }
    returnToDeleteId = null;
}

/** Confirm Delete Return */
async function confirmDeleteReturn() {
    if (!returnToDeleteId) return;

    const btn = document.getElementById('confirm-delete-return-btn');
    setButtonLoading(btn, true, 'Deleting...');

    try {
        await api.delete(`/customerReturn/${returnToDeleteId}`);
        showToast('Deleted', `Customer return ${returnToDeleteId} deleted successfully`, 'success');
        closeDeleteReturnConfirm();
        loadReturns();
    } catch (err) {
        console.error('[CustomerReturns] Delete error:', err);
        showToast('Error', err.message || 'Failed to delete return record', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/** Handle order selection change — populate spare parts return rows */
function handleOrderSelectChange() {
    const orderId = document.getElementById('r-order-id')?.value;
    const partsGroup = document.getElementById('return-parts-group');
    const partsHint  = document.getElementById('return-parts-hint');
    const partsList  = document.getElementById('return-parts-list');
    const qtyTotal   = document.getElementById('return-qty-total');

    // Hide both panels first
    if (partsGroup) partsGroup.style.display = 'none';
    if (partsHint)  partsHint.style.display  = 'none';
    if (partsList)  partsList.innerHTML = '';
    if (qtyTotal)   qtyTotal.textContent = '0';

    if (!orderId) return;

    const order = allOrdersForReturns.find(o =>
        String(o.orderId || o.orderID).trim() === String(orderId).trim()
    );

    const parts = order?.spareParts || [];

    if (parts.length === 0) {
        if (partsHint) partsHint.style.display = 'block';
        return;
    }

    if (partsGroup) partsGroup.style.display = 'block';

    let html = '';
    parts.forEach((part, idx) => {
        const pid  = escapeHtml(part.partID   || '');
        const name = escapeHtml(part.partName || part.partID || 'Unknown Part');
        const cbId = `rp-check-${idx}`;
        html += `
            <div class="return-part-row" id="rp-row-${idx}">
                <label class="rp-checkbox-wrap" for="${cbId}" title="Select this part for return">
                    <input
                        type="checkbox"
                        id="${cbId}"
                        class="rp-checkbox"
                        data-row="${idx}"
                        data-part-id="${pid}"
                        data-part-name="${name}"
                        onchange="toggleReturnPart(${idx})"
                    />
                    <span class="rp-checkmark"></span>
                </label>
                <div class="return-part-info">
                    <span class="return-part-name">${name}</span>
                    <span class="return-part-id">${pid}</span>
                </div>
            </div>`;
    });
    if (partsList) partsList.innerHTML = html;
}

/** Toggle a part row on/off when its checkbox changes */
function toggleReturnPart(idx) {
    const cb  = document.getElementById(`rp-check-${idx}`);
    const row = document.getElementById(`rp-row-${idx}`);
    if (!cb) return;
    if (cb.checked) {
        row?.classList.add('rp-selected');
    } else {
        row?.classList.remove('rp-selected');
    }
    updateReturnQtyTotal();
}

/** Update the running total — counts number of checked parts */
function updateReturnQtyTotal() {
    const checked = document.querySelectorAll('.rp-checkbox:checked').length;
    const el = document.getElementById('return-qty-total');
    if (el) el.textContent = checked;
}

// Global exposure
window.initCustomerReturnsPage = initCustomerReturnsPage;
window.loadReturns = loadReturns;
window.filterReturns = filterReturns;
window.openReturnModal = openReturnModal;
window.closeReturnModal = closeReturnModal;
window.submitReturnForm = submitReturnForm;
window.openViewReturnModal = openViewReturnModal;
window.closeViewReturnModal = closeViewReturnModal;
window.openDeleteReturnConfirm = openDeleteReturnConfirm;
window.closeDeleteReturnConfirm = closeDeleteReturnConfirm;
window.confirmDeleteReturn = confirmDeleteReturn;
window.handleOrderSelectChange = handleOrderSelectChange;
window.updateReturnQtyTotal = updateReturnQtyTotal;
window.toggleReturnPart = toggleReturnPart;
