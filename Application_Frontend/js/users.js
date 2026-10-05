/**
 * users.js — User Management: full CRUD
 *
 * API endpoint: /api/user
 *
 * UserDTO:
 * {
 *   userID:   number (Integer, optional for save)
 *   userRole: string ("Admin", "Owner", "Store_Manager", "Sales_Staff", "Customer")
 *   username: string
 *   password: string
 *   email:    string
 *   phone:    string
 * }
 */

/* ─── Module State ─────────────────────────────────── */
let usrAllUsers     = [];
let usrFilteredUsers = [];
let usrToDelete     = null;
let usrEditingID    = null;

/* =====================================================
   PAGE INITIALISATION
   ===================================================== */
function initUsersPage() {
    document.getElementById('btn-add-user')?.addEventListener('click', openAddUserModal);
    document.getElementById('user-search-input')?.addEventListener('input', onUserSearchFilter);
    document.getElementById('user-role-filter')?.addEventListener('change', onUserSearchFilter);
    document.getElementById('user-form')?.addEventListener('submit', onUserFormSubmit);
    document.getElementById('user-cancel-btn')?.addEventListener('click', closeUserModal);
    document.getElementById('user-modal-close-btn')?.addEventListener('click', closeUserModal);
    document.getElementById('user-confirm-cancel-btn')?.addEventListener('click', closeUserDeleteConfirm);
    document.getElementById('user-confirm-delete-btn')?.addEventListener('click', confirmDeleteUser);
    document.getElementById('btn-toggle-pwd')?.addEventListener('click', togglePasswordVisibility);

    // Close modal on overlay click
    document.getElementById('user-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'user-modal') closeUserModal();
    });
    document.getElementById('user-delete-confirm')?.addEventListener('click', (e) => {
        if (e.target.id === 'user-delete-confirm') closeUserDeleteConfirm();
    });

    // Load users from backend
    loadUsersData();
}

async function loadUsersData() {
    showUserSkeleton();
    try {
        usrAllUsers = await api.get('/user');
        usrFilteredUsers = [...usrAllUsers];
        renderUsersTable(usrFilteredUsers);
        updateUserCount(usrFilteredUsers.length);
    } catch (err) {
        showUserTableError(err.message);
    }
}

/* =====================================================
   SEARCH & FILTER
   ===================================================== */
function onUserSearchFilter() {
    const q = document.getElementById('user-search-input')?.value.trim().toLowerCase() || '';
    const roleFilter = document.getElementById('user-role-filter')?.value || '';

    usrFilteredUsers = usrAllUsers.filter(u => {
        const matchesQuery = !q ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q) ||
            String(u.userID || '').includes(q);

        const matchesRole = !roleFilter || u.userRole === roleFilter;

        return matchesQuery && matchesRole;
    });

    renderUsersTable(usrFilteredUsers);
    updateUserCount(usrFilteredUsers.length);
}

function updateUserCount(n) {
    const el = document.getElementById('user-count');
    if (el) el.textContent = `${n} user${n !== 1 ? 's' : ''}`;
}

/* =====================================================
   ROLE BADGE FORMATTING
   ===================================================== */
function getRoleBadgeHtml(role) {
    const r = role || 'Sales_Staff';
    let style = 'background:rgba(255,255,255,0.08);color:var(--color-text-muted);border:1px solid rgba(255,255,255,0.15);';
    let label = r.replace('_', ' ');

    switch (r) {
        case 'Admin':
            style = 'background:rgba(124,58,237,0.18);color:#C4B5FD;border:1px solid rgba(124,58,237,0.35);';
            break;
        case 'Owner':
            style = 'background:rgba(245,158,11,0.18);color:#FDE68A;border:1px solid rgba(245,158,11,0.35);';
            break;
        case 'Store_Manager':
            style = 'background:rgba(0,117,255,0.18);color:#93C5FD;border:1px solid rgba(0,117,255,0.35);';
            break;
        case 'Sales_Staff':
            style = 'background:rgba(16,185,129,0.18);color:#6EE7B7;border:1px solid rgba(16,185,129,0.35);';
            break;
        case 'Customer':
            style = 'background:rgba(100,116,139,0.18);color:#CBD5E1;border:1px solid rgba(100,116,139,0.35);';
            break;
    }

    return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:0.3px;${style}">${escapeHtml(label)}</span>`;
}

/* =====================================================
   RENDER TABLE
   ===================================================== */
function renderUsersTable(users) {
    const tbody = document.getElementById('user-tbody');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table-cell">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">${usrAllUsers.length === 0 ? 'No users found' : 'No matching users'}</div>
                        <div class="empty-state-msg">${usrAllUsers.length === 0 ? 'Click "Add User" to create the first account.' : 'Try adjusting your search query or role filter.'}</div>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => {
        const id       = u.userID != null ? u.userID : '—';
        const username = u.username || 'Unnamed';
        const email    = u.email || '—';
        const phone    = u.phone || '—';
        const role     = u.userRole || 'Sales_Staff';
        const initials = username.substring(0, 2).toUpperCase();
        const color    = avatarColor(String(id));

        return `
            <tr>
                <td>
                    <div class="avatar-cell">
                        <div class="avatar" style="background:${color};font-size:11px;">${escapeHtml(initials)}</div>
                        <div class="avatar-info">
                            <span class="user-name">${escapeHtml(username)}</span>
                            <span class="user-id">ID: ${escapeHtml(String(id))}</span>
                        </div>
                    </div>
                </td>
                <td>
                    ${getRoleBadgeHtml(role)}
                </td>
                <td class="hide-mobile">
                    <span style="color:var(--color-text-main);font-size:13px;">${escapeHtml(email)}</span>
                </td>
                <td class="hide-mobile">
                    <span style="color:var(--color-text-muted);font-size:13px;">${escapeHtml(phone)}</span>
                </td>
                <td style="text-align:right;">
                    <div class="action-buttons" style="justify-content:flex-end;">
                        <button class="action-btn action-edit" title="Edit User & Password" onclick="openEditUserModal(${id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                            </svg>
                        </button>
                        <button class="action-btn action-delete" title="Delete User" onclick="openUserDeleteConfirm(${id}, '${escapeHtml(username)}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function showUserSkeleton() {
    const tbody = document.getElementById('user-tbody');
    if (!tbody) return;
    tbody.innerHTML = Array(5).fill(0).map(() => `
        <tr>
            <td><div class="skeleton" style="height:36px;width:180px"></div></td>
            <td><div class="skeleton" style="height:22px;width:90px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:14px;width:150px"></div></td>
            <td class="hide-mobile"><div class="skeleton" style="height:14px;width:100px"></div></td>
            <td><div class="skeleton" style="height:30px;width:66px;margin-left:auto;"></div></td>
        </tr>`).join('');
}

function showUserTableError(msg) {
    const tbody = document.getElementById('user-tbody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-table-cell">
                <div class="empty-state">
                    <div class="empty-state-title" style="color:var(--color-danger)">Failed to load users</div>
                    <div class="empty-state-msg">${escapeHtml(msg)}</div>
                    <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="loadUsersData()">Try Again</button>
                </div>
            </td>
        </tr>`;
}

/* =====================================================
   PASSWORD VISIBILITY TOGGLE
   ===================================================== */
function togglePasswordVisibility() {
    const input = document.getElementById('field-user-password');
    const icon = document.getElementById('pwd-eye-icon');
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>`;
    } else {
        input.type = 'password';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`;
    }
}

/* =====================================================
   OPEN / CLOSE MODAL
   ===================================================== */
function openAddUserModal() {
    usrEditingID = null;
    clearUserForm();

    document.getElementById('field-user-id').value = '';
    document.getElementById('user-modal-title').textContent = 'Add New User';
    document.getElementById('user-modal-subtitle').textContent = 'Fill in user credentials and assign role';
    document.getElementById('user-submit-text').textContent = 'Add User';
    const passwordInput = document.getElementById('field-user-password');
    passwordInput.placeholder = 'Enter password';
    passwordInput.required = true;
    document.getElementById('user-password-required').style.display = '';

    openUserModal();
    setTimeout(() => document.getElementById('field-user-username')?.focus(), 60);
}

function openEditUserModal(id) {
    const user = usrAllUsers.find(u => u.userID === id);
    if (!user) { showToast('User not found', '', 'error'); return; }

    usrEditingID = id;
    clearUserForm();

    document.getElementById('field-user-id').value       = user.userID;
    document.getElementById('field-user-username').value = user.username || '';
    document.getElementById('field-user-role').value     = user.userRole || 'Sales_Staff';
    document.getElementById('field-user-email').value    = user.email || '';
    document.getElementById('field-user-phone').value    = user.phone || '';
    const passwordInput = document.getElementById('field-user-password');
    passwordInput.value = '';
    passwordInput.placeholder = 'Leave blank to keep unchanged';
    passwordInput.required = false;
    document.getElementById('user-password-required').style.display = 'none';

    document.getElementById('user-modal-title').textContent    = 'Edit User';
    document.getElementById('user-modal-subtitle').textContent = `Editing account for ${user.username || 'User #' + id}`;
    document.getElementById('user-submit-text').textContent    = 'Save Changes';

    openUserModal();
}

function openUserModal() {
    const modal = document.getElementById('user-modal');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.classList.add('open', 'show');
    modal.style.display       = 'flex';
    modal.style.opacity       = '1';
    modal.style.pointerEvents = 'all';
    modal.style.zIndex        = '99999';
}

function closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) {
        modal.classList.remove('open', 'show');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    }
    clearUserForm();
    usrEditingID = null;
}

function clearUserForm() {
    ['field-user-id', 'field-user-username', 'field-user-email', 'field-user-phone', 'field-user-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const pwdInput = document.getElementById('field-user-password');
    if (pwdInput) pwdInput.type = 'password';

    const roleSelect = document.getElementById('field-user-role');
    if (roleSelect) roleSelect.value = 'Sales_Staff';

    document.querySelectorAll('#user-form .form-control').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('#user-form .form-error').forEach(el => { el.classList.remove('show'); el.textContent = ''; });
}

/* =====================================================
   DELETE CONFIRMATION
   ===================================================== */
function openUserDeleteConfirm(id, username) {
    usrToDelete = id;
    const nameEl = document.getElementById('user-delete-name');
    if (nameEl) nameEl.textContent = username || `ID #${id}`;

    const modal = document.getElementById('user-delete-confirm');
    if (modal) {
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        modal.classList.add('open', 'show');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'all';
        modal.style.zIndex = '99999';
    }
}

function closeUserDeleteConfirm() {
    const modal = document.getElementById('user-delete-confirm');
    if (modal) {
        modal.classList.remove('open', 'show');
        modal.style.display = 'none';
    }
    usrToDelete = null;
}

async function confirmDeleteUser() {
    if (!usrToDelete) return;
    const btn = document.getElementById('user-confirm-delete-btn');
    setButtonLoading(btn, true, 'Deleting...');
    try {
        await api.delete('/user/' + usrToDelete);
        usrAllUsers     = usrAllUsers.filter(u => u.userID !== usrToDelete);
        usrFilteredUsers = usrFilteredUsers.filter(u => u.userID !== usrToDelete);
        renderUsersTable(usrFilteredUsers);
        updateUserCount(usrFilteredUsers.length);
        closeUserDeleteConfirm();
        showToast('User deleted', 'User account was deleted successfully.', 'success');
    } catch (err) {
        showToast('Delete failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* =====================================================
   FORM VALIDATION & SUBMIT
   ===================================================== */
function validateUserForm() {
    let valid = true;

    const rules = [
        { id: 'field-user-username', errId: 'err-user-username', msg: 'Username is required' },
        { id: 'field-user-email',    errId: 'err-user-email',    msg: 'Email address is required' },
    ];
    if (!usrEditingID) {
        rules.push({ id: 'field-user-password', errId: 'err-user-password', msg: 'Password is required' });
    }

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

    // Validate email format
    const emailVal = document.getElementById('field-user-email')?.value.trim() || '';
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (emailVal && !emailRegex.test(emailVal)) {
        const input = document.getElementById('field-user-email');
        const errEl = document.getElementById('err-user-email');
        if (input) input.classList.add('error');
        if (errEl) { errEl.textContent = 'Please enter a valid email address'; errEl.classList.add('show'); }
        valid = false;
    }

    return valid;
}

function buildUserPayload() {
    const rawID = document.getElementById('field-user-id').value;
    const userID = rawID ? parseInt(rawID, 10) : null;

    return {
        userID,
        username: document.getElementById('field-user-username').value.trim(),
        userRole: document.getElementById('field-user-role').value,
        password: document.getElementById('field-user-password').value,
        email:    document.getElementById('field-user-email').value.trim(),
        phone:    document.getElementById('field-user-phone').value.trim(),
    };
}

async function onUserFormSubmit(e) {
    e.preventDefault();
    if (!validateUserForm()) return;

    const btn = document.getElementById('user-save-btn');
    setButtonLoading(btn, true, usrEditingID ? 'Saving...' : 'Adding...');

    const payload = buildUserPayload();

    try {
        if (usrEditingID) {
            const updated = await api.put('/user', payload);
            const idx = usrAllUsers.findIndex(u => u.userID === usrEditingID);
            if (idx !== -1) usrAllUsers[idx] = updated;
        } else {
            const created = await api.post('/user', payload);
            usrAllUsers.unshift(created);
        }

        onUserSearchFilter();
        closeUserModal();
        showToast(
            usrEditingID ? 'User updated' : 'User created',
            `Account for ${payload.username} was ${usrEditingID ? 'updated' : 'created'} successfully.`,
            'success'
        );
    } catch (err) {
        showToast('Operation failed', err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

/* ─── Global Exports ─────────────────────────────── */
window.initUsersPage          = initUsersPage;
window.openAddUserModal       = openAddUserModal;
window.openEditUserModal      = openEditUserModal;
window.closeUserModal         = closeUserModal;
window.openUserDeleteConfirm  = openUserDeleteConfirm;
window.closeUserDeleteConfirm = closeUserDeleteConfirm;
window.confirmDeleteUser      = confirmDeleteUser;
window.togglePasswordVisibility = togglePasswordVisibility;
window.loadUsersData          = loadUsersData;
