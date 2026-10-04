/**
 * customers.js — Customer Management: CRUD operations
 *
 * Real backend API: http://localhost:8080/api/customer
 *
 * CustomerDTO structure:
 * {
 *   customerID: string,
 *   name: { fistName: string, lastName: string },   ← typo is intentional (backend field)
 *   email: string,
 *   phoneNumber: string,
 *   address: string,
 *   user: { userID: int|null, userRole: string, username: string, password: string, email: string, phone: string }
 * }
 */

// -------------------------------------------------------
// Module state
// -------------------------------------------------------
let allCustomers = [];       // Full list from backend
let filteredCustomers = [];  // After search filter
let customerToDelete = null; // ID pending delete confirmation
let editingCustomerID = null; // ID being edited (null = adding new)

/* =====================================================
   PAGE INITIALISATION
   ===================================================== */
function initCustomersPage() {
    // Load data immediately
    loadCustomers();

    // Attach static event listeners (modal, search, buttons)
    document.getElementById('btn-add-customer')?.addEventListener('click', openAddModal);
    document.getElementById('search-input')?.addEventListener('input', onSearchInput);
    document.getElementById('customer-form')?.addEventListener('submit', onFormSubmit);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', closeConfirm);
    document.getElementById('confirm-delete-btn')?.addEventListener('click', confirmDeleteCustomer);

    // Close modal/confirm on overlay click
    document.getElementById('customer-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'customer-modal') closeModal();
    });
    document.getElementById('delete-confirm')?.addEventListener('click', (e) => {
        if (e.target.id === 'delete-confirm') closeConfirm();
    });
}

/* =====================================================
   LOAD ALL CUSTOMERS
   ===================================================== */
async function loadCustomers() {
    showTableSkeleton();

    try {
        const data = await api.get('/customer');
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        allCustomers = list;
        filteredCustomers = [...allCustomers];
        renderTable(filteredCustomers);
        updateCustomerCount(filteredCustomers.length);
    } catch (err) {
        console.error('[Customers] load error:', err);
        showTableError(err.message || 'Failed to load customers from backend');
    }
}

/* ─── Helpers for flexible DTO parsing ─── */
function getCustomerName(c) {
    if (!c) return '—';
    if (typeof c.name === 'string') return c.name.trim() || '—';
    if (c.name && typeof c.name === 'object') {
        const first = c.name.fistName || c.name.firstName || '';
        const last  = c.name.lastName || '';
        const full  = `${first} ${last}`.trim();
        if (full) return full;
    }
    return c.customerID || c.customerId || c.id || '—';
}

function getCustomerID(c) {
    return c?.customerID || c?.customerId || c?.id || '—';
}

/* =====================================================
   SEARCH / FILTER (client-side)
   ===================================================== */
function onSearchInput(e) {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
        filteredCustomers = [...allCustomers];
    } else {
        filteredCustomers = allCustomers.filter(c => {
            const fullName = getCustomerName(c).toLowerCase();
            const id       = getCustomerID(c).toLowerCase();
            const email    = (c.email || '').toLowerCase();
            const phone    = String(c.phoneNumber || c.phone || '').toLowerCase();
            return fullName.includes(q) || id.includes(q) || email.includes(q) || phone.includes(q);
        });
    }
    renderTable(filteredCustomers);
    updateCustomerCount(filteredCustomers.length);
}

function updateCustomerCount(count) {
    const el = document.getElementById('customer-count');
    if (el) el.textContent = `${count} customer${count !== 1 ? 's' : ''}`;
}

/* =====================================================
   RENDER TABLE
   ===================================================== */
function renderTable(customers) {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952
                                    4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07
                                    M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766
                                    l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0
                                    3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0
                                    2.625 2.625 0 0 1 5.25 0Z"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">No customers found</div>
                        <div class="empty-state-msg">
                            ${allCustomers.length === 0
                                ? 'No customers exist yet. Add your first customer to get started.'
                                : 'No customers match your search. Try a different keyword.'}
                        </div>
                        ${allCustomers.length === 0
                            ? `<button class="btn btn-primary" style="margin-top:16px" onclick="openAddModal()">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                </svg>
                                Add First Customer
                              </button>`
                            : ''}
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = customers.map((c, idx) => {
        const custID     = getCustomerID(c);
        const fullName   = getCustomerName(c);
        const initials   = getInitials(c.name || fullName);
        const bgColor    = avatarColor(custID);
        const phoneVal   = c.phoneNumber != null && c.phoneNumber !== 0 ? c.phoneNumber : (c.phone || c.user?.phone);
        const phone      = formatPhoneNumber(phoneVal);
        const email      = c.email || (c.user?.email || '—');
        const address    = c.address || '—';
        const username   = c.user?.username || '—';

        const safeCustID   = String(custID).replace(/'/g, "\\'");
        const safeFullName = String(fullName).replace(/'/g, "\\'");

        return `
        <tr class="row-enter" style="animation-delay: ${idx * 30}ms">
            <td>
                <div class="customer-cell">
                    <div class="avatar" style="background:${bgColor}; color:#444">${escapeHtml(initials)}</div>
                    <div class="customer-info">
                        <div class="name">${escapeHtml(fullName)}</div>
                        <div class="id">${escapeHtml(custID)}</div>
                    </div>
                </div>
            </td>
            <td class="hide-mobile">
                ${email !== '—'
                    ? `<a href="mailto:${escapeHtml(email)}" style="color:var(--color-info);text-decoration:none;">${escapeHtml(email)}</a>`
                    : '—'}
            </td>
            <td class="hide-mobile">${escapeHtml(String(phone))}</td>
            <td class="hide-mobile" style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(address)}">
                ${escapeHtml(address)}
            </td>
            <td class="hide-mobile">
                ${username !== '—'
                    ? `<span style="font-size:12px;color:var(--color-text-muted);">${escapeHtml(username)}</span>`
                    : '<span style="font-size:12px;color:#d1d5db;">—</span>'}
            </td>
            <td>
                <button class="action-btn action-edit" onclick="openEditModal('${safeCustID}')" title="Edit customer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07
                            a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z
                            M16.862 4.487 19.5 7.125"/>
                    </svg>
                </button>
                <button class="action-btn action-delete" onclick="openDeleteConfirm('${safeCustID}', '${safeFullName}')" title="Delete customer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673
                            a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0
                            a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0
                            a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201
                            a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0
                            a48.667 48.667 0 0 0-7.5 0"/>
                    </svg>
                </button>
            </td>
        </tr>`;
    }).join('');
}

/* =====================================================
   SKELETON LOADING ROWS
   ===================================================== */
function showTableSkeleton() {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    const skeletonRow = (w1, w2, w3) => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:12px">
                    <div class="skeleton skeleton-avatar"></div>
                    <div>
                        <div class="skeleton skeleton-text" style="width:${w1}px;margin-bottom:6px"></div>
                        <div class="skeleton skeleton-text" style="width:70px"></div>
                    </div>
                </div>
            </td>
            <td class="hide-mobile"><div class="skeleton skeleton-text" style="width:${w2}px"></div></td>
            <td class="hide-mobile"><div class="skeleton skeleton-text" style="width:90px"></div></td>
            <td class="hide-mobile"><div class="skeleton skeleton-text" style="width:${w3}px"></div></td>
            <td class="hide-mobile"><div class="skeleton skeleton-text" style="width:80px"></div></td>
            <td><div class="skeleton skeleton-text" style="width:60px"></div></td>
        </tr>`;

    tbody.innerHTML =
        skeletonRow(130, 160, 140) +
        skeletonRow(110, 180, 120) +
        skeletonRow(145, 150, 160) +
        skeletonRow(120, 170, 130) +
        skeletonRow(135, 140, 150);
}

/* =====================================================
   TABLE ERROR STATE
   ===================================================== */
function showTableError(message) {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="empty-state">
                    <div class="empty-state-icon" style="background:var(--color-danger-bg)">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="1.5">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0
                                2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z
                                M12 15.75h.007v.008H12v-.008z"/>
                        </svg>
                    </div>
                    <div class="empty-state-title">Failed to load customers</div>
                    <div class="empty-state-msg">${escapeHtml(message)}</div>
                    <button class="btn btn-outline" style="margin-top:16px" onclick="loadCustomers()">Try Again</button>
                </div>
            </td>
        </tr>`;
}

/* =====================================================
   MODAL — ADD / EDIT
   ===================================================== */
/**
 * Generate a sequential customer ID in the format C001, C002, …
 * Scans existing allCustomers to find the highest numeric suffix,
 * then returns the next one — consistent with S001 / B001 pattern.
 */
function generateCustomerID() {
    let maxNum = 0;
    (allCustomers || []).forEach(c => {
        const id = c ? (c.customerID || '') : '';
        if (id) {
            const match = id.match(/\d+/);
            if (match) {
                const num = parseInt(match[0], 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        }
    });
    return 'C' + String(maxNum + 1).padStart(3, '0');
}

function openAddModal() {
    editingCustomerID = null;
    resetForm();

    const modalTitle    = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const saveBtnLabel  = document.getElementById('save-btn-label');

    if (modalTitle)    modalTitle.textContent    = 'Add New Customer';
    if (modalSubtitle) modalSubtitle.textContent = 'Fill in the customer details below';
    if (saveBtnLabel)  saveBtnLabel.textContent  = 'Add Customer';

    // Auto-generate the customer ID — user never needs to see or type it
    const generatedID = generateCustomerID();
    const idField = document.getElementById('field-customerID');
    if (idField) idField.value = generatedID;

    // Show the generated ID as a read-only badge
    const badge = document.getElementById('customerID-badge');
    if (badge) badge.textContent = generatedID;
    const display = document.getElementById('customerID-display');
    if (display) display.style.display = 'block';

    showModal();
}

function openEditModal(customerID) {
    const customer = allCustomers.find(c => c.customerID === customerID);
    if (!customer) {
        showToast('Customer not found', 'Could not find that customer.', 'error');
        return;
    }

    editingCustomerID = customerID;
    resetForm();

    // Populate form fields
    const idField = document.getElementById('field-customerID');
    if (idField) idField.value = customer.customerID || '';

    // Hide the auto-generated badge in edit mode (ID is locked, no need to show it)
    const display = document.getElementById('customerID-display');
    if (display) display.style.display = 'none';

    const fnField = document.getElementById('field-firstName');
    if (fnField) fnField.value = customer.name?.fistName || '';

    const lnField = document.getElementById('field-lastName');
    if (lnField) lnField.value = customer.name?.lastName || '';

    const emailField = document.getElementById('field-email');
    if (emailField) emailField.value = customer.email || customer.user?.email || '';

    const phoneField = document.getElementById('field-phone');
    if (phoneField) phoneField.value = customer.phoneNumber || customer.user?.phone || '';

    const addrField = document.getElementById('field-address');
    if (addrField) addrField.value = customer.address || '';

    // User fields (if user exists)
    if (customer.user) {
        const unField = document.getElementById('field-username');
        if (unField) unField.value = customer.user.username || '';

        const ueField = document.getElementById('field-userEmail');
        if (ueField) ueField.value = customer.user.email || '';

        const upField = document.getElementById('field-userPhone');
        if (upField) upField.value = customer.user.phone || '';

        const urField = document.getElementById('field-userRole');
        if (urField) urField.value = customer.user.userRole || 'Customer';

        // Don't pre-fill password for security
        const pwField = document.getElementById('field-password');
        if (pwField) {
            pwField.value = '';
            pwField.placeholder = 'Leave blank to keep unchanged';
            pwField.required = false;
        }
    }

    const modalTitle    = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const saveBtnLabel  = document.getElementById('save-btn-label');

    if (modalTitle)    modalTitle.textContent    = 'Edit Customer';
    if (modalSubtitle) modalSubtitle.textContent = `Editing ${customer.name?.fistName || ''} ${customer.name?.lastName || ''}`;
    if (saveBtnLabel)  saveBtnLabel.textContent  = 'Save Changes';

    showModal();
}

function showModal() {
    const overlay = document.getElementById('customer-modal');
    if (!overlay) return;
    if (overlay.parentElement !== document.body) {
        document.body.appendChild(overlay);
    }
    overlay.classList.add('open');
    overlay.classList.add('show');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    overlay.style.zIndex = '99999';

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.style.display = 'inline-flex';

    setTimeout(() => document.getElementById('field-firstName')?.focus(), 50);
}

function closeModal() {
    const overlay = document.getElementById('customer-modal');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.classList.remove('show');
    overlay.style.display = 'none';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    resetForm();
    editingCustomerID = null;
}

function resetForm() {
    const form = document.getElementById('customer-form');
    if (form) form.reset();

    // Hide the customerID badge whenever form is reset
    const display = document.getElementById('customerID-display');
    if (display) display.style.display = 'none';

    // Clear validation states
    document.querySelectorAll('.form-input.is-invalid, .form-select.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    document.querySelectorAll('.form-error.show').forEach(el => {
        el.classList.remove('show');
    });

    // Re-enable password field for add mode
    const pwField = document.getElementById('field-password');
    if (pwField) {
        pwField.placeholder = 'Create a password';
        pwField.required = true;
    }
}

/* =====================================================
   FORM SUBMIT — Create or Update
   ===================================================== */
async function onFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const saveBtn = document.getElementById('save-btn');
    setButtonLoading(saveBtn, true, editingCustomerID ? 'Saving...' : 'Adding...');

    const payload = buildPayload();

    try {
        if (editingCustomerID) {
            // PUT /api/customer
            const updated = await api.put('/customer', payload);
            // Update in local array
            const idx = allCustomers.findIndex(c => c.customerID === editingCustomerID);
            if (idx !== -1) allCustomers[idx] = updated;
            filteredCustomers = applyCurrentSearch();
            renderTable(filteredCustomers);
            updateCustomerCount(filteredCustomers.length);
            showToast('Customer updated', `${payload.name.fistName} ${payload.name.lastName} was updated successfully.`, 'success');
        } else {
            // POST /api/customer
            const created = await api.post('/customer', payload);
            allCustomers.unshift(created);
            filteredCustomers = applyCurrentSearch();
            renderTable(filteredCustomers);
            updateCustomerCount(filteredCustomers.length);
            showToast('Customer added', `${payload.name.fistName} ${payload.name.lastName} was added successfully.`, 'success');
        }
        closeModal();
    } catch (err) {
        showToast('Operation failed', err.message, 'error');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

/**
 * Build the payload object that exactly matches the CustomerDTO.
 * Key note: the backend field is "fistName" (typo), not "firstName".
 */
function buildPayload() {
    const customerID = document.getElementById('field-customerID')?.value?.trim() || '';
    const password   = document.getElementById('field-password')?.value || '';
    const emailVal   = document.getElementById('field-email')?.value?.trim() || '';
    const phoneVal   = document.getElementById('field-phone')?.value?.trim() || '';

    const payload = {
        customerID: customerID,
        name: {
            fistName: document.getElementById('field-firstName')?.value?.trim() || '',
            lastName:  document.getElementById('field-lastName')?.value?.trim() || ''
        },
        email:       emailVal,
        phoneNumber: phoneVal,
        address:     document.getElementById('field-address')?.value?.trim() || '',
        user: {
            userRole: document.getElementById('field-userRole')?.value || 'Customer',
            username: document.getElementById('field-username')?.value?.trim() || '',
            email:    emailVal,
            phone:    phoneVal
        }
    };

    // Include password only if provided (edit mode may leave it blank)
    if (password) {
        payload.user.password = password;
    }

    // On edit, preserve the userID if the user object already exists
    if (editingCustomerID) {
        const existing = allCustomers.find(c => c.customerID === editingCustomerID);
        if (existing?.user?.userID) {
            payload.user.userID = existing.user.userID;
        }
    }

    return payload;
}

/* =====================================================
   FORM VALIDATION
   ===================================================== */
function validateForm() {
    let valid = true;

    const rules = [
        // customerID is auto-generated — excluded from validation
        { id: 'field-firstName',  errId: 'err-firstName',  msg: 'First name is required' },
        { id: 'field-lastName',   errId: 'err-lastName',   msg: 'Last name is required' },
        { id: 'field-email',      errId: 'err-email',      msg: 'Email Address is required', extra: validateEmail },
        { id: 'field-phone',      errId: 'err-phone',      msg: 'Phone Number is required' },
        { id: 'field-address',    errId: 'err-address',    msg: 'Address is required' },
        { id: 'field-username',   errId: 'err-username',   msg: 'Username is required' },
    ];

    // Password only required when adding a new customer
    if (!editingCustomerID) {
        rules.push({ id: 'field-password', errId: 'err-password', msg: 'Password is required' });
    }

    rules.forEach(rule => {
        const field = document.getElementById(rule.id);
        const errEl = document.getElementById(rule.errId);
        if (!field || field.disabled) return;

        const value = field.value.trim();
        let msg = '';

        if (!value) {
            msg = rule.msg;
        } else if (rule.extra) {
            msg = rule.extra(value);
        }

        if (msg) {
            field.classList.add('is-invalid');
            if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
            valid = false;
        } else {
            field.classList.remove('is-invalid');
            if (errEl) errEl.classList.remove('show');
        }
    });

    return valid;
}

function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address';
}

/* =====================================================
   DELETE CUSTOMER
   ===================================================== */
function openDeleteConfirm(customerID, customerName) {
    customerToDelete = customerID;

    const nameEl = document.getElementById('confirm-customer-name');
    if (nameEl) nameEl.textContent = customerName;

    const modal = document.getElementById('delete-confirm');
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

function closeConfirm() {
    const modal = document.getElementById('delete-confirm');
    if (modal) {
        modal.classList.remove('open');
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
    customerToDelete = null;
}

async function confirmDeleteCustomer() {
    if (!customerToDelete) return;

    const deleteBtn = document.getElementById('confirm-delete-btn');
    setButtonLoading(deleteBtn, true, 'Deleting...');

    try {
        await api.delete(`/customer/${customerToDelete}`);

        // Remove from local arrays
        allCustomers      = allCustomers.filter(c => c.customerID !== customerToDelete);
        filteredCustomers = filteredCustomers.filter(c => c.customerID !== customerToDelete);

        renderTable(filteredCustomers);
        updateCustomerCount(filteredCustomers.length);
        showToast('Customer deleted', 'The customer has been removed.', 'success');
        closeConfirm();
    } catch (err) {
        showToast('Delete failed', err.message, 'error');
    } finally {
        setButtonLoading(deleteBtn, false);
    }
}

/* =====================================================
   HELPERS
   ===================================================== */
/** Re-apply the current search filter to allCustomers */
function applyCurrentSearch() {
    const q = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    if (!q) return [...allCustomers];
    return allCustomers.filter(c => {
        const fullName = `${c.name?.fistName || ''} ${c.name?.lastName || ''}`.toLowerCase();
        return (
            fullName.includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.phoneNumber || '').toLowerCase().includes(q) ||
            (c.customerID || '').toLowerCase().includes(q)
        );
    });
}

// Expose handlers globally
window.initCustomersPage = initCustomersPage;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.openDeleteConfirm = openDeleteConfirm;
window.closeConfirm = closeConfirm;
window.confirmDeleteCustomer = confirmDeleteCustomer;
window.loadCustomers = loadCustomers;
window.loadCustomersData = loadCustomers;
