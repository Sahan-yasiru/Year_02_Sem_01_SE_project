/**
 * customer-transactions.js — Customer Transaction Management
 * Backend API: http://localhost:8080/api/customerTransaction
 */

let allTransactions = [];
let filteredTransactions = [];
let allOrdersForTxn = [];
let txnToDeleteId = null;
let editingTxnId = null;   // numeric saleID when editing, null for new

/** Initialise Customer Transactions page */
function initCustomerTransactionsPage() {
    loadTransactions();
    loadOrdersForTxn();

    // Backdrop click closes modals
    document.getElementById('txn-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'txn-modal-overlay') closeTransactionModal();
    });
    document.getElementById('txn-view-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'txn-view-overlay') closeViewTransactionModal();
    });
    document.getElementById('txn-confirm-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'txn-confirm-overlay') closeDeleteTransactionConfirm();
    });
}

/* ── Data Loading ─────────────────────────────────────────────────────────── */

/** Fetch all transactions from backend and render */
async function loadTransactions() {
    const tbody = document.getElementById('txn-tbody');
    const emptyState = document.getElementById('txn-empty');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;padding:40px;color:var(--color-text-muted);">
                <div class="spinner-sm" style="display:inline-block;margin-right:8px;"></div> Loading transactions…
            </td>
        </tr>`;
    if (emptyState) emptyState.style.display = 'none';

    try {
        const data = await api.get('/customerTransaction');
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        allTransactions = list;
        filteredTransactions = [...allTransactions];
        renderTransactionsTable(filteredTransactions);
        updateTransactionStats(filteredTransactions);
    } catch (err) {
        console.error('[CustomerTransactions] Load error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:30px;color:var(--color-danger);">
                    Failed to load transactions: ${escapeHtml(err.message || 'Server connection error')}
                </td>
            </tr>`;
        showToast('Error', err.message || 'Failed to fetch customer transactions', 'error');
    }
}

/** Load orders for the order select dropdown */
async function loadOrdersForTxn() {
    const orderSelect = document.getElementById('txn-order-id');
    if (!orderSelect) return;

    try {
        const data = await api.get('/orders');
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        allOrdersForTxn = list;
        populateOrderSelect(orderSelect, list);
    } catch (err) {
        console.warn('[CustomerTransactions] Load orders error:', err);
    }
}

/** Populate an order <select> element with the given order list */
function populateOrderSelect(selectEl, list) {
    let html = '<option value="">— Select Order —</option>';
    list.forEach(order => {
        const orderId = order.orderId || order.orderID || '';
        const customerName = getTxnOrderCustomerName(order);
        const total = order.totalPrice
            ? ` (Rs ${Number(order.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })})`
            : '';
        html += `<option value="${escapeHtml(orderId)}">${escapeHtml(orderId)} — ${escapeHtml(customerName)}${total}</option>`;
    });
    selectEl.innerHTML = html;
}

/* ── Render ───────────────────────────────────────────────────────────────── */

/** Render the transactions table */
function renderTransactionsTable(list) {
    const tbody = document.getElementById('txn-tbody');
    const emptyState = document.getElementById('txn-empty');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    let html = '';
    list.forEach(txn => {
        const saleId   = txn.saleID ?? txn.saleId ?? '—';
        const dateStr  = txn.date ? formatDate(txn.date) : '—';
        const orderId  = txn.order ? (txn.order.orderId || txn.order.orderID || '—') : '—';
        const customer = txn.order ? getTxnOrderCustomerName(txn.order) : '—';
        const amount   = txn.amount != null
            ? `Rs ${Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            : '—';
        const method   = txn.paymentMethod || '—';
        const methodBadge = method === 'CASH_ON_DELIVERY'
            ? `<span class="badge-cod">💵 Cash</span>`
            : method === 'ONLINE_PAYMENT'
                ? `<span class="badge-online">🌐 Online</span>`
                : `<span>${escapeHtml(method)}</span>`;

        html += `
            <tr>
                <td style="font-weight:700;font-family:monospace;color:var(--color-accent);">#${escapeHtml(String(saleId))}</td>
                <td style="color:var(--color-text-muted);font-size:0.85rem;">${escapeHtml(dateStr)}</td>
                <td>
                    <span class="badge-status badge-CONFIRMED" style="font-family:monospace;">${escapeHtml(orderId)}</span>
                </td>
                <td style="font-weight:500;">${escapeHtml(customer)}</td>
                <td style="text-align:right;font-weight:700;color:var(--color-text-main);">${escapeHtml(amount)}</td>
                <td>${methodBadge}</td>
                <td style="text-align:right;">
                    <div style="display:inline-flex;gap:6px;">
                        <button class="btn btn-ghost btn-sm" onclick="openViewTransactionModal(${saleId})" title="View Details">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="openTransactionModal(${saleId})" title="Edit Transaction">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                            </svg>
                        </button>
                        <button class="btn btn-ghost btn-sm" style="color:var(--color-danger);" onclick="openDeleteTransactionConfirm(${saleId})" title="Delete Transaction">
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

/** Update the 4 stat cards */
function updateTransactionStats(list) {
    const totalEl   = document.getElementById('txn-stat-total');
    const revenueEl = document.getElementById('txn-stat-revenue');
    const codEl     = document.getElementById('txn-stat-cod');
    const onlineEl  = document.getElementById('txn-stat-online');
    if (!totalEl) return;

    let totalRevenue = 0;
    let codCount = 0;
    let onlineCount = 0;

    list.forEach(t => {
        totalRevenue += (t.amount || 0);
        if (t.paymentMethod === 'CASH_ON_DELIVERY') codCount++;
        else if (t.paymentMethod === 'ONLINE_PAYMENT') onlineCount++;
    });

    totalEl.textContent   = list.length;
    revenueEl.textContent = `Rs ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    codEl.textContent     = codCount;
    onlineEl.textContent  = onlineCount;
}

/* ── Search / Filter ──────────────────────────────────────────────────────── */

/** Filter transactions by search query and payment method */
function filterTransactions() {
    const q      = (document.getElementById('txn-search')?.value || '').trim().toLowerCase();
    const method = (document.getElementById('txn-filter-method')?.value || '');

    filteredTransactions = allTransactions.filter(t => {
        const saleId   = String(t.saleID ?? t.saleId ?? '').toLowerCase();
        const orderId  = (t.order?.orderId || t.order?.orderID || '').toLowerCase();
        const customer = getTxnOrderCustomerName(t.order).toLowerCase();
        const matchQ   = !q || saleId.includes(q) || orderId.includes(q) || customer.includes(q);
        const matchM   = !method || t.paymentMethod === method;
        return matchQ && matchM;
    });
    renderTransactionsTable(filteredTransactions);
}

/* ── Add / Edit Modal ─────────────────────────────────────────────────────── */

/**
 * Open the Add or Edit modal.
 * @param {number|null} editId — saleID when editing, null/undefined for new
 */
function openTransactionModal(editId = null) {
    if (!allOrdersForTxn || allOrdersForTxn.length === 0) {
        loadOrdersForTxn();
    }
    editingTxnId = editId;

    const overlay    = document.getElementById('txn-modal-overlay');
    const titleEl    = document.getElementById('txn-modal-title');
    const subtitleEl = document.getElementById('txn-modal-subtitle');
    const submitBtn  = document.getElementById('txn-submit-btn');

    const orderSelect   = document.getElementById('txn-order-id');
    const dateInput     = document.getElementById('txn-date');
    const amountInput   = document.getElementById('txn-amount');
    const methodSelect  = document.getElementById('txn-payment-method');

    if (editId != null) {
        const txn = allTransactions.find(t => (t.saleID ?? t.saleId) === editId);
        if (!txn) return;

        titleEl.textContent    = 'Edit Transaction';
        subtitleEl.textContent = `Updating Sale ID #${editId}`;
        submitBtn.innerHTML    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg> Update Transaction`;

        if (orderSelect && txn.order) {
            orderSelect.value = txn.order.orderId || txn.order.orderID || '';
        }
        if (dateInput && txn.date) {
            dateInput.value = new Date(txn.date).toISOString().split('T')[0];
        } else {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        amountInput.value  = txn.amount ?? '';
        methodSelect.value = txn.paymentMethod || '';
    } else {
        titleEl.textContent    = 'New Transaction';
        subtitleEl.textContent = 'Record a customer payment';
        submitBtn.innerHTML    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Save Transaction`;

        if (orderSelect) orderSelect.value = '';
        dateInput.value   = new Date().toISOString().split('T')[0];
        amountInput.value = '';
        if (methodSelect) methodSelect.value = '';
    }

    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('show', 'open');
    }
}

/** Close the Add/Edit modal */
function closeTransactionModal() {
    const overlay = document.getElementById('txn-modal-overlay');
    if (overlay) {
        overlay.classList.remove('show', 'open');
        overlay.style.display = 'none';
    }
    editingTxnId = null;
}

/** Handle form submission for create / update */
async function submitTransactionForm(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('txn-submit-btn');

    const orderId  = document.getElementById('txn-order-id').value;
    const dateStr  = document.getElementById('txn-date').value;
    const amount   = parseFloat(document.getElementById('txn-amount').value);
    const method   = document.getElementById('txn-payment-method').value;

    if (!orderId) {
        showToast('Validation Error', 'Please select an order', 'warning');
        return;
    }
    if (!dateStr) {
        showToast('Validation Error', 'Please select a transaction date', 'warning');
        return;
    }
    if (isNaN(amount) || amount < 0) {
        showToast('Validation Error', 'Please enter a valid amount', 'warning');
        return;
    }
    if (!method) {
        showToast('Validation Error', 'Please select a payment method', 'warning');
        return;
    }

    // Look up the selected order so all OrderDTO primitive fields (quantity, totalPrice, etc.)
    // are populated — Jackson cannot deserialize null into primitive int.
    const selectedOrder = allOrdersForTxn.find(
        o => String(o.orderId || o.orderID).trim() === String(orderId).trim()
    );

    const orderPayload = selectedOrder
        ? {
            orderId:     selectedOrder.orderId || selectedOrder.orderID,
            quantity:    Number(selectedOrder.quantity   || 0),
            totalPrice:  Number(selectedOrder.totalPrice || 0),
            orderStatus: selectedOrder.orderStatus || 'CONFIRMED',
            address:     selectedOrder.address || ''
          }
        : {
            orderId:     String(orderId).trim(),
            quantity:    0,
            totalPrice:  0,
            orderStatus: 'CONFIRMED',
            address:     ''
          };

    const payload = {
        date:          new Date(dateStr).toISOString(),
        amount:        amount,
        paymentMethod: method,
        order:         orderPayload
    };

    setButtonLoading(submitBtn, true, editingTxnId != null ? 'Updating...' : 'Saving...');

    try {
        if (editingTxnId != null) {
            await api.put(`/customerTransaction/${editingTxnId}`, payload);
            showToast('Success', `Transaction #${editingTxnId} updated successfully`, 'success');
        } else {
            await api.post('/customerTransaction', payload);
            showToast('Success', 'Transaction created successfully', 'success');
        }
        closeTransactionModal();
        loadTransactions();
    } catch (err) {
        console.error('[CustomerTransactions] Save error:', err);
        showToast('Error', err.message || 'Failed to save transaction', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/* ── View Modal ───────────────────────────────────────────────────────────── */

/** Open the view-details modal for a given saleID */
function openViewTransactionModal(id) {
    const txn = allTransactions.find(t => (t.saleID ?? t.saleId) === id);
    if (!txn) return;

    const overlay   = document.getElementById('txn-view-overlay');
    const subtitleEl = document.getElementById('txn-view-subtitle');
    const bodyEl    = document.getElementById('txn-view-body');

    if (subtitleEl) subtitleEl.textContent = `Sale ID #${id}`;

    const dateStr  = txn.date ? formatDate(txn.date) : '—';
    const orderId  = txn.order ? (txn.order.orderId || txn.order.orderID || '—') : '—';
    const customer = txn.order ? getTxnOrderCustomerName(txn.order) : '—';
    const amount   = txn.amount != null
        ? `Rs ${Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : '—';
    const method   = txn.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery'
        : txn.paymentMethod === 'ONLINE_PAYMENT' ? 'Online Payment'
        : escapeHtml(txn.paymentMethod || '—');

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="txn-view-section">
                <div class="txn-view-section-title">Transaction Summary</div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Sale ID</span>
                    <span class="txn-view-field-value" style="font-family:monospace;color:var(--color-accent);">#${escapeHtml(String(id))}</span>
                </div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Date</span>
                    <span class="txn-view-field-value">${escapeHtml(dateStr)}</span>
                </div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Amount</span>
                    <span class="txn-view-field-value" style="color:var(--color-accent);font-weight:700;">${escapeHtml(amount)}</span>
                </div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Payment Method</span>
                    <span class="txn-view-field-value">${escapeHtml(method)}</span>
                </div>
            </div>

            <div class="txn-view-section">
                <div class="txn-view-section-title">Associated Order</div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Order ID</span>
                    <span class="txn-view-field-value" style="font-family:monospace;">${escapeHtml(orderId)}</span>
                </div>
                <div class="txn-view-field">
                    <span class="txn-view-field-label">Customer</span>
                    <span class="txn-view-field-value">${escapeHtml(customer)}</span>
                </div>
            </div>`;
    }

    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('show', 'open');
    }
}

/** Close the view details modal */
function closeViewTransactionModal() {
    const overlay = document.getElementById('txn-view-overlay');
    if (overlay) {
        overlay.classList.remove('show', 'open');
        overlay.style.display = 'none';
    }
}

/* ── Delete ───────────────────────────────────────────────────────────────── */

/** Open delete confirmation for a given saleID */
function openDeleteTransactionConfirm(id) {
    txnToDeleteId = id;
    const overlay = document.getElementById('txn-confirm-overlay');
    const textEl  = document.getElementById('txn-delete-id-text');
    if (textEl) textEl.textContent = `#${id}`;
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('show', 'open');
    }
}

/** Close delete confirmation */
function closeDeleteTransactionConfirm() {
    const overlay = document.getElementById('txn-confirm-overlay');
    if (overlay) {
        overlay.classList.remove('show', 'open');
        overlay.style.display = 'none';
    }
    txnToDeleteId = null;
}

/** Execute the deletion after user confirms */
async function confirmDeleteTransaction() {
    if (txnToDeleteId == null) return;

    const btn = document.getElementById('txn-confirm-delete-btn');
    setButtonLoading(btn, true, 'Deleting...');

    try {
        await api.delete(`/customerTransaction/${txnToDeleteId}`);
        showToast('Deleted', `Transaction #${txnToDeleteId} deleted successfully`, 'success');
        closeDeleteTransactionConfirm();
        loadTransactions();
    } catch (err) {
        console.error('[CustomerTransactions] Delete error:', err);
        showToast('Error', err.message || 'Failed to delete transaction', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Extract a readable customer name from an order object */
function getTxnOrderCustomerName(order) {
    if (!order || !order.customer) return 'N/A';
    const c = order.customer;
    if (typeof c === 'string') return c;
    if (c.name) {
        if (typeof c.name === 'string') return c.name;
        const first = c.name.fistName || c.name.firstName || '';
        const last  = c.name.lastName || '';
        const full  = `${first} ${last}`.trim();
        if (full) return full;
    }
    return c.customerID || c.id || 'Customer';
}

/* ── Global exposure ──────────────────────────────────────────────────────── */
window.initCustomerTransactionsPage     = initCustomerTransactionsPage;
window.loadTransactions                 = loadTransactions;
window.filterTransactions               = filterTransactions;
window.openTransactionModal             = openTransactionModal;
window.closeTransactionModal            = closeTransactionModal;
window.submitTransactionForm            = submitTransactionForm;
window.openViewTransactionModal         = openViewTransactionModal;
window.closeViewTransactionModal        = closeViewTransactionModal;
window.openDeleteTransactionConfirm     = openDeleteTransactionConfirm;
window.closeDeleteTransactionConfirm    = closeDeleteTransactionConfirm;
window.confirmDeleteTransaction         = confirmDeleteTransaction;
