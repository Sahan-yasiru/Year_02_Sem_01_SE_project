/**
 * Order Module - Model-View-Controller (MVC) Implementation
 */

// ==========================================
// 1. MODEL
// ==========================================
const OrderModel = {
  orders: [],
  filteredOrders: [],
  currentPage: 1,
  pageSize: 8,
  searchQuery: "",
  statusFilter: "ALL",
  isLoading: false,

  fetchOrders: async function () {
    this.isLoading = true;
    try {
      const response = await api.get("/orders");
      this.orders = response.data || [];
      this.applyFilter();
      return this.orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  getOrderById: async function (id) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  saveOrder: async function (orderData) {
    let response;
    if (orderData.orderId && this.orders.some(o => o.orderId === orderData.orderId)) {
      response = await api.put("/orders", orderData);
    } else {
      response = await api.post("/orders", orderData);
    }
    await this.fetchOrders();
    return response;
  },

  deleteOrder: async function (id) {
    const response = await api.delete(`/orders/${id}`);
    await this.fetchOrders();
    return response;
  },

  setSearchQuery: function (query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  },

  setStatusFilter: function (status) {
    this.statusFilter = status;
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter: function () {
    this.filteredOrders = this.orders.filter(order => {
      const id = (order.orderId || '').toLowerCase();
      const custName = `${order.customer?.name?.fistName || ''} ${order.customer?.name?.lastName || ''}`.toLowerCase();
      const status = (order.orderStatus || '').toUpperCase();

      const matchesSearch = !this.searchQuery ||
                            id.includes(this.searchQuery) ||
                            custName.includes(this.searchQuery);

      const matchesStatus = this.statusFilter === "ALL" || status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  },

  getPaginatedData: function () {
    const totalItems = this.filteredOrders.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const items = this.filteredOrders.slice(start, end);

    return {
      items,
      totalItems,
      totalPages,
      currentPage: this.currentPage,
      pageSize: this.pageSize
    };
  },

  getValidTransitions: function (currentStatus) {
    switch (currentStatus) {
      case "CONFIRMED":
        return ["PROCESSING", "CANCELLED"];
      case "PROCESSING":
        return ["DELIVERED", "CANCELLED"];
      case "DELIVERED":
        return ["RETURNED"];
      case "CANCELLED":
      case "RETURNED":
        return [];
      default:
        return ["CONFIRMED", "PROCESSING", "DELIVERED", "CANCELLED"];
    }
  }
};

// ==========================================
// 2. VIEW
// ==========================================
const OrderView = {
  renderSkeleton: function ($container) {
    let rowsHtml = '';
    for (let i = 0; i < 5; i++) {
      rowsHtml += `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="px-6 py-4"><div class="h-4 w-16 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-32 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-12 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-20 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-24 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-6 w-24 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-8 w-24 skeleton"></div></td>
        </tr>
      `;
    }
    $container.html(rowsHtml);
  },

  getStatusBadgeHtml: function (status) {
    switch (status) {
      case "CONFIRMED":
        return `<span class="badge badge-info"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>Confirmed</span>`;
      case "PROCESSING":
        return `<span class="badge badge-warning"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>Processing</span>`;
      case "DELIVERED":
        return `<span class="badge badge-success"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Delivered</span>`;
      case "CANCELLED":
        return `<span class="badge badge-danger"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>Cancelled</span>`;
      case "RETURNED":
        return `<span class="badge bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"><span class="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>Returned</span>`;
      default:
        return `<span class="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">${status || 'UNKNOWN'}</span>`;
    }
  },

  renderTable: function (paginatedData, $tableBody, $paginationContainer) {
    if (paginatedData.items.length === 0) {
      $tableBody.html(`
        <tr>
          <td colspan="7" class="px-6 py-12 text-center">
            <div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <svg class="w-12 h-12 mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              <p class="text-base font-medium">No orders found</p>
              <p class="text-xs text-slate-400 mt-1">Try adjusting filter or place a new order.</p>
            </div>
          </td>
        </tr>
      `);
      $paginationContainer.html('');
      return;
    }

    let rowsHtml = '';
    paginatedData.items.forEach(order => {
      const id = order.orderId || 'N/A';
      const custName = order.customer ? `${order.customer.name?.fistName || ''} ${order.customer.name?.lastName || ''}`.trim() : 'Guest';
      const quantity = order.quantity || 1;
      const totalPrice = typeof order.totalPrice === 'number' ? `$${order.totalPrice.toFixed(2)}` : '$0.00';
      const dateStr = order.date ? new Date(order.date).toLocaleDateString() : 'N/A';
      const statusBadge = this.getStatusBadgeHtml(order.orderStatus);

      rowsHtml += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">${id}</td>
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${custName}</td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">${quantity}</td>
          <td class="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">${totalPrice}</td>
          <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">${dateStr}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="btn-view-order text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="View Order">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button class="btn-edit-order text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Update Status / Order">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button class="btn-delete-order text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Delete Order">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </td>
        </tr>
      `;
    });

    $tableBody.html(rowsHtml);
    this.renderPagination(paginatedData, $paginationContainer);
  },

  renderPagination: function (data, $container) {
    const { currentPage, totalPages, totalItems, pageSize } = data;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    let pagesButtons = '';
    for (let p = 1; p <= totalPages; p++) {
      const activeClass = p === currentPage
        ? 'bg-blue-600 text-white shadow-sm font-semibold'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700';

      pagesButtons += `
        <button class="btn-order-page px-3 py-1.5 text-xs rounded-lg transition-all ${activeClass}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    $container.html(`
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing <span class="font-semibold text-slate-900 dark:text-white">${startItem}</span> to <span class="font-semibold text-slate-900 dark:text-white">${endItem}</span> of <span class="font-semibold text-slate-900 dark:text-white">${totalItems}</span> orders
        </span>
        <div class="flex items-center gap-1.5">
          <button class="btn-order-prev px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
          </button>
          ${pagesButtons}
          <button class="btn-order-next px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `);
  },

  getFormModalHtml: function (order = null, customers = [], spareParts = [], nextId = '') {
    const isEdit = !!order;
    const id = order ? order.orderId || '' : nextId;
    const selectedCustId = order?.customer?.customerID || '';
    const quantity = order ? order.quantity || 1 : 1;
    const totalPrice = order ? order.totalPrice || 0 : 0;
    const currentStatus = order ? order.orderStatus || 'CONFIRMED' : 'CONFIRMED';
    const address = order ? order.address || '' : '';

    const customerOptions = customers.map(c => `
      <option value="${c.customerID}" ${c.customerID === selectedCustId ? 'selected' : ''}>
        ${c.customerID} - ${c.name?.fistName || ''} ${c.name?.lastName || ''} (${c.email || ''})
      </option>
    `).join('');

    const sparePartOptions = spareParts.map(p => `
      <option value="${p.partID}" data-price="${p.sellPrice || 0}">
        ${p.partID} - ${p.partName || ''} ($${p.sellPrice || 0})
      </option>
    `).join('');

    const validTransitions = isEdit ? OrderModel.getValidTransitions(currentStatus) : ["CONFIRMED"];
    const statusOptions = [currentStatus, ...validTransitions].map(st => `
      <option value="${st}" ${st === currentStatus ? 'selected' : ''}>${st}</option>
    `).join('');

    const idFieldHtml = isEdit
      ? `<input type="text" id="order-id" value="${id}" readonly class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed text-sm focus:outline-none" />`
      : `<div class="flex items-center gap-2">
           <input type="text" id="order-id" value="${id}" readonly
             class="w-full px-3.5 py-2 rounded-xl border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono font-bold text-sm focus:outline-none cursor-default" />
           <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold whitespace-nowrap">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
             Auto
           </span>
         </div>`;

    return `
      <form id="order-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Order ID <span class="text-rose-500">*</span></label>
          ${idFieldHtml}
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Select Customer <span class="text-rose-500">*</span></label>
          <select id="order-customer" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
            <option value="">-- Choose Customer --</option>
            ${customerOptions}
          </select>
        </div>

        ${!isEdit ? `
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Spare Part Item</label>
          <select id="order-part" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="">-- Choose Spare Part --</option>
            ${sparePartOptions}
          </select>
        </div>
        ` : ''}

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Quantity <span class="text-rose-500">*</span></label>
            <input type="number" id="order-quantity" value="${quantity}" min="1" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Total Price ($) <span class="text-rose-500">*</span></label>
            <input type="number" step="0.01" id="order-price" value="${totalPrice}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Order Status</label>
          <select id="order-status" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium">
            ${statusOptions}
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Delivery Address</label>
          <textarea id="order-address" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Shipping destination address">${address}</textarea>
        </div>
      </form>
    `;
  },

  getViewModalHtml: function (order) {
    const id = order.orderId || 'N/A';
    const custName = order.customer ? `${order.customer.name?.fistName || ''} ${order.customer.name?.lastName || ''}`.trim() : 'Guest Customer';
    const custEmail = order.customer?.email || 'N/A';
    const quantity = order.quantity || 1;
    const totalPrice = typeof order.totalPrice === 'number' ? `$${order.totalPrice.toFixed(2)}` : '$0.00';
    const dateStr = order.date ? new Date(order.date).toLocaleString() : 'N/A';
    const address = order.address || 'N/A';
    const statusBadge = this.getStatusBadgeHtml(order.orderStatus);

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
          <div>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">${id}</span>
            <h4 class="text-base font-bold text-slate-900 dark:text-white mt-1">${custName}</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">${custEmail}</p>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Quantity</span>
            <span class="font-semibold text-slate-900 dark:text-white">${quantity} Items</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Total Amount</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">${totalPrice}</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60 sm:col-span-2">
            <span class="text-xs text-slate-400 block mb-0.5">Order Date</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${dateStr}</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60 sm:col-span-2">
            <span class="text-xs text-slate-400 block mb-0.5">Delivery Address</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${address}</span>
          </div>
        </div>
      </div>
    `;
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const OrderController = {
  $tableBody: null,
  $paginationContainer: null,
  $searchInput: null,
  $statusFilterSelect: null,

  init: function () {
    this.$tableBody = $("#order-table-body");
    this.$paginationContainer = $("#order-pagination");
    this.$searchInput = $("#order-search-input");
    this.$statusFilterSelect = $("#order-status-filter");

    this.bindEvents();
    this.loadData();
  },

  bindEvents: function () {
    const self = this;

    if (this.$searchInput.length) {
      this.$searchInput.off("input").on("input", function () {
        OrderModel.setSearchQuery($(this).val());
        self.updateView();
      });
    }

    if (this.$statusFilterSelect.length) {
      this.$statusFilterSelect.off("change").on("change", function () {
        OrderModel.setStatusFilter($(this).val());
        self.updateView();
      });
    }

    $("#btn-add-order").off("click").on("click", function () {
      self.openAddModal();
    });

    this.$tableBody.off("click").on("click", ".btn-view-order", function () {
      const id = $(this).data("id");
      self.openViewModal(id);
    });

    this.$tableBody.on("click", ".btn-edit-order", function () {
      const id = $(this).data("id");
      self.openEditModal(id);
    });

    this.$tableBody.on("click", ".btn-delete-order", function () {
      const id = $(this).data("id");
      self.handleDelete(id);
    });

    this.$paginationContainer.off("click").on("click", ".btn-order-page", function () {
      OrderModel.currentPage = parseInt($(this).data("page"));
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-order-prev", function () {
      OrderModel.currentPage--;
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-order-next", function () {
      OrderModel.currentPage++;
      self.updateView();
    });
  },

  loadData: async function () {
    OrderView.renderSkeleton(this.$tableBody);
    try {
      await OrderModel.fetchOrders();
      this.updateView();
    } catch (error) {
      Toast.error(error.message || "Failed to load orders.");
    }
  },

  updateView: function () {
    const paginatedData = OrderModel.getPaginatedData();
    OrderView.renderTable(paginatedData, this.$tableBody, this.$paginationContainer);
  },

  openAddModal: async function () {
    const self = this;
    let customers = [];
    let spareParts = [];
    try {
      const cRes = await api.get("/customer");
      customers = cRes.data || [];
      const pRes = await api.get("/spare-part");
      spareParts = pRes.data || [];
    } catch (e) {
      console.warn("Could not fetch pre-requisite customers/parts:", e);
    }

    const nextId = IDGenerator.nextOrderID(OrderModel.orders);
    Modal.open({
      title: "Create New Order",
      contentHtml: OrderView.getFormModalHtml(null, customers, spareParts, nextId),
      saveText: "Place Order",
      onSave: async function () {
        const orderId = $("#order-id").val().trim();
        const custId = $("#order-customer").val();
        const partId = $("#order-part").val();
        const quantity = parseInt($("#order-quantity").val()) || 1;
        const totalPrice = parseFloat($("#order-price").val()) || 0;
        const orderStatus = $("#order-status").val();
        const address = $("#order-address").val().trim();

        if (!orderId || !custId) {
          Toast.warning("Please fill in required Order ID and Customer.");
          return false;
        }

        const orderData = {
          orderId: orderId,
          customer: { customerID: custId },
          spareParts: partId ? [{ partID: partId }] : [],
          quantity: quantity,
          totalPrice: totalPrice,
          date: new Date().toISOString(),
          orderStatus: orderStatus,
          address: address
        };

        try {
          await OrderModel.saveOrder(orderData);
          Toast.success("Order created successfully!");
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to create order.");
          return false;
        }
      }
    });

    // Auto-calculate price when selecting part & quantity
    $(document).off("change", "#order-part, #order-quantity").on("change", "#order-part, #order-quantity", function () {
      const selectedOption = $("#order-part option:selected");
      const price = parseFloat(selectedOption.data("price")) || 0;
      const qty = parseInt($("#order-quantity").val()) || 1;
      $("#order-price").val((price * qty).toFixed(2));
    });
  },

  openEditModal: async function (id) {
    const self = this;
    try {
      const order = await OrderModel.getOrderById(id);
      let customers = [];
      try {
        const cRes = await api.get("/customer");
        customers = cRes.data || [];
      } catch (e) {}

      Modal.open({
        title: `Update Order ${id}`,
        contentHtml: OrderView.getFormModalHtml(order, customers, []),
        saveText: "Update Order",
        onSave: async function () {
          const custId = $("#order-customer").val();
          const quantity = parseInt($("#order-quantity").val()) || 1;
          const totalPrice = parseFloat($("#order-price").val()) || 0;
          const orderStatus = $("#order-status").val();
          const address = $("#order-address").val().trim();

          const orderData = {
            orderId: id,
            customer: { customerID: custId },
            spareParts: order.spareParts || [],
            quantity: quantity,
            totalPrice: totalPrice,
            date: order.date || new Date().toISOString(),
            orderStatus: orderStatus,
            address: address
          };

          try {
            await OrderModel.saveOrder(orderData);
            Toast.success("Order updated successfully!");
            self.updateView();
            return true;
          } catch (err) {
            Toast.error(err.message || "Failed to update order.");
            return false;
          }
        }
      });
    } catch (err) {
      Toast.error("Could not fetch order details.");
    }
  },

  openViewModal: async function (id) {
    try {
      const order = await OrderModel.getOrderById(id);
      Modal.open({
        title: "Order Details",
        contentHtml: OrderView.getViewModalHtml(order),
        saveText: "Close",
        saveBtnClass: "bg-slate-600 hover:bg-slate-700 text-white",
        onSave: async function () { return true; }
      });
    } catch (err) {
      Toast.error("Could not load order details.");
    }
  },

  handleDelete: function (id) {
    const self = this;
    Modal.confirm({
      title: "Delete Order",
      message: `Are you sure you want to delete order <strong>${id}</strong>? This action cannot be undone.`,
      confirmText: "Delete Order",
      onConfirm: async function () {
        try {
          await OrderModel.deleteOrder(id);
          Toast.success(`Order ${id} deleted successfully.`);
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to delete order.");
          return false;
        }
      }
    });
  }
};
