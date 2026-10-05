const dashboardEndpoints = [
    ['orders', '/orders'],
    ['inventory', '/inventory'],
    ['customers', '/customer'],
    ['suppliers', '/supplier'],
    ['parts', '/spare-part']
];

function initDashboardPage() {
    const today = document.getElementById('dashboard-today');
    if (today) {
        today.textContent = new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    loadDashboardData();
}

async function loadDashboardData() {
    const results = await Promise.allSettled(
        dashboardEndpoints.map(([, endpoint]) => api.get(endpoint))
    );
    const data = {};
    const failed = [];

    results.forEach((result, index) => {
        const [key] = dashboardEndpoints[index];
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            data[key] = result.value;
        } else {
            data[key] = [];
            failed.push(key);
        }
    });

    renderDashboard(data);
    const message = document.getElementById('dashboard-load-message');
    if (message) {
        message.hidden = failed.length === 0;
        message.textContent = failed.length
            ? `Some dashboard data could not be loaded (${failed.join(', ')}). Check the API connection and refresh.`
            : '';
    }
}

function renderDashboard(data) {
    const orders = data.orders || [];
    const inventory = data.inventory || [];
    const customers = data.customers || [];
    const suppliers = data.suppliers || [];
    const parts = data.parts || [];
    const activeOrders = orders.filter(order => !['CANCELLED', 'RETURNED'].includes(order.orderStatus));
    const orderValue = activeOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    setDashboardText('dashboard-order-value', formatDashboardCurrency(orderValue));
    setDashboardText('dashboard-customer-count', customers.length.toLocaleString());
    setDashboardText('dashboard-part-count', parts.length.toLocaleString());
    setDashboardText('dashboard-inventory-count', inventory.length.toLocaleString());
    setDashboardText('dashboard-supplier-count', suppliers.length.toLocaleString());

    renderDashboardChart(orders);
    renderDashboardStock(inventory);
    renderDashboardRecentOrders(orders);
}

function setDashboardText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
}

function formatDashboardCurrency(value) {
    return `Rs. ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function renderDashboardChart(orders) {
    const chart = document.getElementById('dashboard-orders-chart');
    if (!chart) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        return {
            date,
            label: date.toLocaleDateString(undefined, { weekday: 'short' }),
            count: 0
        };
    });

    orders.forEach(order => {
        if (!order.date) return;
        const datePart = String(order.date).slice(0, 10);
        const [year, month, date] = datePart.split('-').map(Number);
        const orderDate = new Date(year, month - 1, date);
        if (Number.isNaN(orderDate.getTime())) return;
        const day = days.find(item => item.date.getTime() === orderDate.getTime());
        if (day) day.count += 1;
    });

    const maxCount = Math.max(1, ...days.map(day => day.count));
    setDashboardText('dashboard-week-orders', days.reduce((sum, day) => sum + day.count, 0).toLocaleString());
    chart.innerHTML = days.map((day, index) => {
        const height = day.count ? Math.max(8, Math.round((day.count / maxCount) * 100)) : 3;
        return `
            <div class="dashboard-bar-column">
                <span class="dashboard-bar-count">${day.count || ''}</span>
                <div class="dashboard-bar-track">
                    <div class="dashboard-bar ${index === days.length - 1 ? 'dashboard-bar-today' : ''}" style="height:${height}%"></div>
                </div>
                <span class="dashboard-bar-label">${escapeHtml(day.label)}</span>
            </div>`;
    }).join('');
}

function renderDashboardStock(inventory) {
    const stockList = document.getElementById('dashboard-stock-list');
    if (!stockList) return;
    const outOfStock = inventory.filter(item => Number(item.quantity_on_hand ?? 0) <= 0);
    const lowStock = inventory.filter(item => {
        const quantity = Number(item.quantity_on_hand ?? 0);
        const threshold = Number(item.reorder_threshold ?? 0);
        return quantity > 0 && quantity <= threshold;
    });
    const attentionItems = [...outOfStock, ...lowStock].slice(0, 4);

    setDashboardText('dashboard-out-count', outOfStock.length.toLocaleString());
    setDashboardText('dashboard-low-count', lowStock.length.toLocaleString());
    stockList.innerHTML = attentionItems.length
        ? attentionItems.map(item => {
            const part = item.part || {};
            const quantity = Number(item.quantity_on_hand ?? 0);
            const out = quantity <= 0;
            return `
                <div class="dashboard-stock-item">
                    <span class="dashboard-stock-indicator ${out ? 'is-out' : 'is-low'}"></span>
                    <span class="dashboard-stock-name">${escapeHtml(part.partName || part.partID || item.inventory_id || 'Inventory item')}</span>
                    <span class="dashboard-stock-quantity ${out ? 'is-out' : 'is-low'}">${quantity} left</span>
                </div>`;
        }).join('')
        : '<div class="dashboard-stock-empty">All tracked items are above their reorder levels.</div>';
}

function renderDashboardRecentOrders(orders) {
    const tbody = document.getElementById('dashboard-recent-orders');
    if (!tbody) return;

    const sorted = [...orders].sort((first, second) => {
        const firstDate = new Date(first.date || 0).getTime();
        const secondDate = new Date(second.date || 0).getTime();
        return secondDate - firstDate;
    }).slice(0, 5);

    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="dashboard-table-empty">No orders to show yet.</td></tr>';
        return;
    }

    tbody.innerHTML = sorted.map(order => {
        const customerName = [order.customer?.name?.fistName, order.customer?.name?.lastName]
            .filter(Boolean)
            .join(' ') || order.customer?.customerID || 'Walk-in customer';
        const date = order.date
            ? new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : '—';
        const status = order.orderStatus || 'UNKNOWN';
        const statusClass = status.toLowerCase().replace(/[^a-z-]/g, '');
        return `
            <tr>
                <td class="dashboard-order-id">${escapeHtml(order.orderId || '—')}</td>
                <td>${escapeHtml(customerName)}</td>
                <td class="dashboard-order-date">${escapeHtml(date)}</td>
                <td class="dashboard-order-amount">${escapeHtml(formatDashboardCurrency(Number(order.totalPrice || 0)))}</td>
                <td><span class="dashboard-order-status status-${statusClass}">${escapeHtml(status.replaceAll('_', ' '))}</span></td>
            </tr>`;
    }).join('');
}

window.initDashboardPage = initDashboardPage;
