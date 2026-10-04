/**
 * app.js — Application shell: SPA navigation, toast system, sidebar toggle.
 * This file sets up the global UI frame and routing logic.
 */

/* =====================================================
   TOAST NOTIFICATION SYSTEM
   ===================================================== */

/**
 * Show a toast notification.
 * @param {string} title    — Bold heading (e.g. "Customer deleted")
 * @param {string} message  — Descriptive message (optional)
 * @param {'success'|'error'|'warning'} type
 * @param {number} duration — Auto-dismiss duration in ms (default 4000)
 */
function showToast(title, message = '', type = 'success', duration = 4000) {
    const icons = {
        success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>`,
        error:   `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>`,
        warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z"/></svg>`
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type} entering`;
    toast.innerHTML = `
        ${icons[type] || icons.success}
        <div class="toast-body">
            <div class="toast-title">${escapeHtml(title)}</div>
            ${message ? `<div class="toast-msg">${escapeHtml(message)}</div>` : ''}
        </div>
        <button class="toast-close" onclick="dismissToast(this.parentElement)" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
        <div class="toast-progress" style="--toast-duration: ${duration}ms"></div>
    `;

    const container = document.getElementById('toast-container');
    container.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._timer = timer;
}

function dismissToast(toast) {
    if (!toast || toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(toast._timer);
    toast.classList.remove('entering');
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 280);
}

/* =====================================================
   SIDEBAR TOGGLE (Mobile)
   ===================================================== */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('hamburger-btn');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
}

/* =====================================================
   SPA NAVIGATION
   ===================================================== */
let currentPage = null;

/**
 * Navigate to a page by loading its HTML into #main-content.
 * @param {string} page — page name without .html (e.g. 'customers')
 * @param {string} [title] — display title for the navbar
 */
function navigate(page, title) {
    if (currentPage === page) return;
    currentPage = page;

    // Clean up any modal/confirm overlays previously appended to body
    document.querySelectorAll('body > .modal-overlay, body > .confirm-overlay').forEach(el => el.remove());

    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Update navbar title
    if (title) {
        const titleEl = document.getElementById('nav-page-title');
        if (titleEl) titleEl.textContent = title;
    }

    const mainContent = document.getElementById('main-content');

    // Fade out, load, fade in
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(8px)';
    mainContent.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

    setTimeout(() => {
        fetch(`pages/${page}.html?v=${Date.now()}`, { cache: 'no-store' })
            .then(res => {
                if (!res.ok) throw new Error('Page not found');
                return res.text();
            })
            .then(html => {
                mainContent.innerHTML = html;
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';

                // Close mobile sidebar
                document.getElementById('sidebar')?.classList.remove('open');
                document.getElementById('sidebar-overlay')?.classList.remove('show');

                // Call page-specific init function if it exists
                const initFnMap = {
                    customers:     'initCustomersPage',
                    supplier:      'initSupplierPage',
                    users:         'initUsersPage',
                    orders:        'initOrdersPage',
                    brand:         'initBrandPage',
                    category:      'initCategoryPage',
                    'spare-parts': 'initSparePartsPage',
                    inventory:     'initInventoryPage',
                    'customer-returns': 'initCustomerReturnsPage',
                };
                const fnName = initFnMap[page];
                if (fnName && typeof window[fnName] === 'function') {
                    window[fnName]();
                }
            })
            .catch(err => {
                mainContent.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">Page Not Available</div>
                        <div class="empty-state-msg">${escapeHtml(err.message)}</div>
                    </div>`;
                mainContent.style.opacity = '1';
                mainContent.style.transform = 'translateY(0)';
            });
    }, 150);
}

/* =====================================================
   UTILITY HELPERS
   ===================================================== */

/** Safely escape HTML to prevent XSS */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/** Generate avatar initials from a name object or name string */
function getInitials(name) {
    if (!name) return '?';
    if (typeof name === 'string') {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return (parts[0] || '?').substring(0, 2).toUpperCase();
    }
    const first = (name.fistName || name.firstName || '').charAt(0).toUpperCase();
    const last  = (name.lastName || '').charAt(0).toUpperCase();
    const init  = (first + last).trim();
    if (init) return init;
    return '?';
}

/** Format a phone number (e.g. 772222224 -> 0772222224) */
function formatPhoneNumber(phone) {
    if (phone == null || phone === '' || phone === 0) return '—';
    const str = String(phone).trim();
    if (str.length === 9 && !str.startsWith('0')) {
        return '0' + str;
    }
    return str;
}

/** Generate a stable background color from a string (for avatars) */
function avatarColor(str) {
    const colors = [
        '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3',
        '#ede9fe', '#fee2e2', '#e0f2fe', '#f0fdf4'
    ];
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/** Format a date string to a readable format */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch {
        return '—';
    }
}

/** Set a button to loading state */
function setButtonLoading(btn, loading, loadingText = 'Saving...') {
    if (loading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = `<div class="spinner-sm"></div><span class="btn-label" style="margin-left:8px">${loadingText}</span>`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    }
}

/* =====================================================
   INITIALISE ON DOM READY
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();

    // Attach click handlers to sidebar links
    document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.dataset.page, link.dataset.title);
        });
    });

    // Load default page — Customers
    navigate('customers', 'Customers');
});

// Expose routing and toast helpers globally
window.navigate = navigate;
window.showToast = showToast;
window.dismissToast = dismissToast;
window.setButtonLoading = setButtonLoading;
