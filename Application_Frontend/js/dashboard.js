/**
 * Dashboard Module - Model-View-Controller (MVC) Implementation
 */

// ==========================================
// 1. MODEL
// ==========================================
const DashboardModel = {
  stats: {
    totalCustomers: 0,
    totalOrders: 0,
    totalSpareParts: 0,
    totalSuppliers: 0,
    totalInventoryItems: 0,
    pendingOrders: 0,
    lowStockItemsCount: 0,
    completedOrders: 0
  },
  recentOrders: [],
  lowStockItems: [],
  isLoading: false,

  fetchDashboardData: async function () {
    this.isLoading = true;
    try {
      const [cRes, oRes, spRes, sRes, iRes] = await Promise.all([
        api.get("/customer").catch(() => ({ data: [] })),
        api.get("/orders").catch(() => ({ data: [] })),
        api.get("/spare-part").catch(() => ({ data: [] })),
        api.get("/supplier").catch(() => ({ data: [] })),
        api.get("/inventory").catch(() => ({ data: [] }))
      ]);

      const customers = cRes.data || [];
      const orders = oRes.data || [];
      const spareParts = spRes.data || [];
      const suppliers = sRes.data || [];
      const inventory = iRes.data || [];

      this.stats.totalCustomers = customers.length;
      this.stats.totalOrders = orders.length;
      this.stats.totalSpareParts = spareParts.length;
      this.stats.totalSuppliers = suppliers.length;
      this.stats.totalInventoryItems = inventory.length;

      this.stats.pendingOrders = orders.filter(o => o.orderStatus === "PROCESSING" || o.orderStatus === "CONFIRMED").length;
      this.stats.completedOrders = orders.filter(o => o.orderStatus === "DELIVERED").length;

      this.lowStockItems = inventory.filter(inv => (inv.quantity_on_hand || 0) <= (inv.reorder_threshold || 5));
      this.stats.lowStockItemsCount = this.lowStockItems.length;

      this.recentOrders = [...orders].reverse().slice(0, 5);

      return {
        stats: this.stats,
        recentOrders: this.recentOrders,
        lowStockItems: this.lowStockItems
      };
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
};

// ==========================================
// 2. VIEW
// ==========================================
const DashboardView = {
  renderStats: function (stats) {
    $("#stat-customers").text(stats.totalCustomers);
    $("#stat-orders").text(stats.totalOrders);
    $("#stat-parts").text(stats.totalSpareParts);
    $("#stat-suppliers").text(stats.totalSuppliers);
    $("#stat-inventory").text(stats.totalInventoryItems);
    $("#stat-pending").text(stats.pendingOrders);
    $("#stat-lowstock").text(stats.lowStockItemsCount);
    $("#stat-completed").text(stats.completedOrders);
  },

  renderRecentOrders: function (orders, $container) {
    if (orders.length === 0) {
      $container.html(`
        <tr>
          <td colspan="5" class="px-6 py-6 text-center text-xs text-slate-400">
            No recent orders recorded yet.
          </td>
        </tr>
      `);
      return;
    }

    let html = '';
    orders.forEach(order => {
      const id = order.orderId || 'N/A';
      const custName = order.customer ? `${order.customer.name?.fistName || ''} ${order.customer.name?.lastName || ''}`.trim() : 'Guest Customer';
      const amount = typeof order.totalPrice === 'number' ? `$${order.totalPrice.toFixed(2)}` : '$0.00';
      const statusBadge = OrderView.getStatusBadgeHtml(order.orderStatus);
      const dateStr = order.date ? new Date(order.date).toLocaleDateString() : 'N/A';

      html += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-sm">
          <td class="px-6 py-3.5 font-mono font-semibold text-blue-600 dark:text-blue-400 text-xs">${id}</td>
          <td class="px-6 py-3.5 font-medium text-slate-900 dark:text-white">${custName}</td>
          <td class="px-6 py-3.5 font-bold text-slate-900 dark:text-white">${amount}</td>
          <td class="px-6 py-3.5">${statusBadge}</td>
          <td class="px-6 py-3.5 text-xs text-slate-500 dark:text-slate-400">${dateStr}</td>
        </tr>
      `;
    });
    $container.html(html);
  },

  renderLowStockItems: function (lowStockItems, $container) {
    if (lowStockItems.length === 0) {
      $container.html(`
        <tr>
          <td colspan="4" class="px-6 py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ All inventory items are adequately stocked!
          </td>
        </tr>
      `);
      return;
    }

    let html = '';
    lowStockItems.forEach(item => {
      const id = item.inventory_id || 'N/A';
      const partName = item.part?.partName || item.part?.partID || 'Unlinked Item';
      const qty = item.quantity_on_hand || 0;
      const threshold = item.reorder_threshold || 5;

      html += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-sm">
          <td class="px-6 py-3.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">${id}</td>
          <td class="px-6 py-3.5 font-medium text-slate-900 dark:text-white">${partName}</td>
          <td class="px-6 py-3.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
              ${qty} units
            </span>
          </td>
          <td class="px-6 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium">${threshold} units</td>
        </tr>
      `;
    });
    $container.html(html);
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const DashboardController = {
  $recentOrdersTable: null,
  $lowStockTable: null,

  init: function () {
    this.$recentOrdersTable = $("#dashboard-recent-orders-body");
    this.$lowStockTable = $("#dashboard-low-stock-body");

    this.loadData();
  },

  loadData: async function () {
    try {
      const data = await DashboardModel.fetchDashboardData();
      DashboardView.renderStats(data.stats);
      DashboardView.renderRecentOrders(data.recentOrders, this.$recentOrdersTable);
      DashboardView.renderLowStockItems(data.lowStockItems, this.$lowStockTable);
    } catch (err) {
      console.warn("Could not load dashboard data:", err);
    }
  }
};
