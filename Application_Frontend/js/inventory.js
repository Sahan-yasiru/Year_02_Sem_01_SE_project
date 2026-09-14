/**
 * Inventory Module - Model-View-Controller (MVC) Implementation
 */

// ==========================================
// 1. MODEL
// ==========================================
const InventoryModel = {
  inventory: [],
  filteredInventory: [],
  currentPage: 1,
  pageSize: 8,
  searchQuery: "",
  isLoading: false,

  fetchInventory: async function () {
    this.isLoading = true;
    try {
      const response = await api.get("/inventory");
      this.inventory = response.data || [];
      this.applyFilter();
      return this.inventory;
    } catch (error) {
      console.error("Error fetching inventory:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  getInventoryById: async function (id) {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  saveInventory: async function (invData) {
    let response;
    if (invData.inventory_id && this.inventory.some(i => i.inventory_id === invData.inventory_id)) {
      response = await api.put("/inventory", invData);
    } else {
      response = await api.post("/inventory", invData);
    }
    await this.fetchInventory();
    return response;
  },

  deleteInventory: async function (id) {
    const response = await api.delete(`/inventory/${id}`);
    await this.fetchInventory();
    return response;
  },

  setSearchQuery: function (query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter: function () {
    if (!this.searchQuery) {
      this.filteredInventory = [...this.inventory];
    } else {
      this.filteredInventory = this.inventory.filter(item => {
        const id = (item.inventory_id || '').toLowerCase();
        const partName = (item.part?.partName || '').toLowerCase();
        const partId = (item.part?.partID || '').toLowerCase();
        return id.includes(this.searchQuery) ||
               partName.includes(this.searchQuery) ||
               partId.includes(this.searchQuery);
      });
    }
  },

  getPaginatedData: function () {
    const totalItems = this.filteredInventory.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const items = this.filteredInventory.slice(start, end);

    return {
      items,
      totalItems,
      totalPages,
      currentPage: this.currentPage,
      pageSize: this.pageSize
    };
  },

  getStockStatus: function (qty, threshold) {
    if (qty <= 0) return { label: "OUT OF STOCK", color: "danger", percent: 0 };
    if (qty <= threshold) return { label: "LOW STOCK", color: "warning", percent: Math.min(100, Math.round((qty / (threshold * 2)) * 100)) };
    return { label: "IN STOCK", color: "success", percent: Math.min(100, Math.round((qty / (threshold * 3)) * 100)) };
  }
};

// ==========================================
// 2. VIEW
// ==========================================
const InventoryView = {
  renderSkeleton: function ($container) {
    let rowsHtml = '';
    for (let i = 0; i < 5; i++) {
      rowsHtml += `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="px-6 py-4"><div class="h-4 w-16 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-36 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-24 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-16 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-6 w-24 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-8 w-24 skeleton"></div></td>
        </tr>
      `;
    }
    $container.html(rowsHtml);
  },

  renderTable: function (paginatedData, $tableBody, $paginationContainer) {
    if (paginatedData.items.length === 0) {
      $tableBody.html(`
        <tr>
          <td colspan="6" class="px-6 py-12 text-center">
            <div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <svg class="w-12 h-12 mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              <p class="text-base font-medium">No inventory items found</p>
              <p class="text-xs text-slate-400 mt-1">Add inventory items or search again.</p>
            </div>
          </td>
        </tr>
      `);
      $paginationContainer.html('');
      return;
    }

    let rowsHtml = '';
    paginatedData.items.forEach(item => {
      const id = item.inventory_id || 'N/A';
      const partName = item.part ? (item.part.partName || item.part.partID || 'Unlinked Part') : 'Unlinked Part';
      const qty = typeof item.quantity_on_hand === 'number' ? item.quantity_on_hand : 0;
      const threshold = typeof item.reorder_threshold === 'number' ? item.reorder_threshold : 5;
      const status = InventoryModel.getStockStatus(qty, threshold);

      let badgeHtml = '';
      let progressColor = 'bg-blue-500';
      if (status.color === 'danger') {
        badgeHtml = `<span class="badge badge-danger"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>OUT OF STOCK</span>`;
        progressColor = 'bg-rose-500';
      } else if (status.color === 'warning') {
        badgeHtml = `<span class="badge badge-warning"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>LOW STOCK</span>`;
        progressColor = 'bg-amber-500';
      } else {
        badgeHtml = `<span class="badge badge-success"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>IN STOCK</span>`;
        progressColor = 'bg-emerald-500';
      }

      rowsHtml += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">${id}</td>
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${partName}</td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-slate-900 dark:text-white w-8">${qty}</span>
              <div class="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div class="${progressColor} h-full rounded-full transition-all duration-500" style="width: ${status.percent}%;"></div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">${threshold} units</td>
          <td class="px-6 py-4">${badgeHtml}</td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="btn-edit-inv text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Adjust Stock">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button class="btn-delete-inv text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Delete Inventory Item">
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
        <button class="btn-inv-page px-3 py-1.5 text-xs rounded-lg transition-all ${activeClass}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    $container.html(`
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing <span class="font-semibold text-slate-900 dark:text-white">${startItem}</span> to <span class="font-semibold text-slate-900 dark:text-white">${endItem}</span> of <span class="font-semibold text-slate-900 dark:text-white">${totalItems}</span> inventory records
        </span>
        <div class="flex items-center gap-1.5">
          <button class="btn-inv-prev px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
          </button>
          ${pagesButtons}
          <button class="btn-inv-next px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `);
  },

  getFormModalHtml: function (inv = null, spareParts = [], nextId = '') {
    const isEdit = !!inv;
    const id = inv ? inv.inventory_id || '' : nextId;
    const selectedPartId = inv?.part?.partID || '';
    const qty = inv ? inv.quantity_on_hand || 0 : 0;
    const threshold = inv ? inv.reorder_threshold || 10 : 10;

    const partOptions = spareParts.map(p => `
      <option value="${p.partID}" ${p.partID === selectedPartId ? 'selected' : ''}>
        ${p.partID} - ${p.partName || ''}
      </option>
    `).join('');

    const idFieldHtml = isEdit
      ? `<input type="text" id="inv-id" value="${id}" readonly class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed text-sm focus:outline-none" />`
      : `<div class="flex items-center gap-2">
           <input type="text" id="inv-id" value="${id}" readonly
             class="w-full px-3.5 py-2 rounded-xl border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono font-bold text-sm focus:outline-none cursor-default" />
           <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold whitespace-nowrap">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
             Auto
           </span>
         </div>`;

    return `
      <form id="inventory-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Inventory Record ID <span class="text-rose-500">*</span></label>
          ${idFieldHtml}
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Spare Part <span class="text-rose-500">*</span></label>
          <select id="inv-part" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
            <option value="">-- Choose Spare Part --</option>
            ${partOptions}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Quantity On Hand <span class="text-rose-500">*</span></label>
            <input type="number" id="inv-qty" value="${qty}" min="0" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Reorder Threshold <span class="text-rose-500">*</span></label>
            <input type="number" id="inv-threshold" value="${threshold}" min="1" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>
        </div>
      </form>
    `;
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const InventoryController = {
  $tableBody: null,
  $paginationContainer: null,
  $searchInput: null,

  init: function () {
    this.$tableBody = $("#inventory-table-body");
    this.$paginationContainer = $("#inventory-pagination");
    this.$searchInput = $("#inventory-search-input");

    this.bindEvents();
    this.loadData();
  },

  bindEvents: function () {
    const self = this;

    if (this.$searchInput.length) {
      this.$searchInput.off("input").on("input", function () {
        InventoryModel.setSearchQuery($(this).val());
        self.updateView();
      });
    }

    $("#btn-add-inventory").off("click").on("click", function () {
      self.openAddModal();
    });

    this.$tableBody.off("click").on("click", ".btn-edit-inv", function () {
      const id = $(this).data("id");
      self.openEditModal(id);
    });

    this.$tableBody.on("click", ".btn-delete-inv", function () {
      const id = $(this).data("id");
      self.handleDelete(id);
    });

    this.$paginationContainer.off("click").on("click", ".btn-inv-page", function () {
      InventoryModel.currentPage = parseInt($(this).data("page"));
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-inv-prev", function () {
      InventoryModel.currentPage--;
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-inv-next", function () {
      InventoryModel.currentPage++;
      self.updateView();
    });
  },

  loadData: async function () {
    InventoryView.renderSkeleton(this.$tableBody);
    try {
      await InventoryModel.fetchInventory();
      this.updateView();
    } catch (error) {
      Toast.error(error.message || "Failed to load inventory.");
    }
  },

  updateView: function () {
    const paginatedData = InventoryModel.getPaginatedData();
    InventoryView.renderTable(paginatedData, this.$tableBody, this.$paginationContainer);
  },

  openAddModal: async function () {
    const self = this;
    let spareParts = [];
    try {
      const pRes = await api.get("/spare-part");
      spareParts = pRes.data || [];
    } catch (e) {}

    const nextId = IDGenerator.nextInventoryID(InventoryModel.inventories);
    Modal.open({
      title: "Add Inventory Record",
      contentHtml: InventoryView.getFormModalHtml(null, spareParts, nextId),
      saveText: "Create Record",
      onSave: async function () {
        const id = $("#inv-id").val().trim();
        const partId = $("#inv-part").val();
        const qty = parseInt($("#inv-qty").val()) || 0;
        const threshold = parseInt($("#inv-threshold").val()) || 5;

        if (!id || !partId) {
          Toast.warning("Please fill in Inventory ID and select a Spare Part.");
          return false;
        }

        const invData = {
          inventory_id: id,
          part: { partID: partId },
          quantity_on_hand: qty,
          reorder_threshold: threshold
        };

        try {
          await InventoryModel.saveInventory(invData);
          Toast.success("Inventory record added successfully!");
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to save inventory.");
          return false;
        }
      }
    });
  },

  openEditModal: async function (id) {
    const self = this;
    try {
      const inv = await InventoryModel.getInventoryById(id);
      let spareParts = [];
      try {
        const pRes = await api.get("/spare-part");
        spareParts = pRes.data || [];
      } catch (e) {}

      Modal.open({
        title: `Adjust Stock for ${id}`,
        contentHtml: InventoryView.getFormModalHtml(inv, spareParts),
        saveText: "Update Stock",
        onSave: async function () {
          const partId = $("#inv-part").val();
          const qty = parseInt($("#inv-qty").val()) || 0;
          const threshold = parseInt($("#inv-threshold").val()) || 5;

          const invData = {
            inventory_id: id,
            part: { partID: partId },
            quantity_on_hand: qty,
            reorder_threshold: threshold
          };

          try {
            await InventoryModel.saveInventory(invData);
            Toast.success("Stock updated successfully!");
            self.updateView();
            return true;
          } catch (err) {
            Toast.error(err.message || "Failed to update stock.");
            return false;
          }
        }
      });
    } catch (err) {
      Toast.error("Could not fetch inventory item.");
    }
  },

  handleDelete: function (id) {
    const self = this;
    Modal.confirm({
      title: "Delete Inventory Record",
      message: `Are you sure you want to delete inventory record <strong>${id}</strong>?`,
      confirmText: "Delete Record",
      onConfirm: async function () {
        try {
          await InventoryModel.deleteInventory(id);
          Toast.success(`Inventory record ${id} deleted successfully.`);
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to delete inventory record.");
          return false;
        }
      }
    });
  }
};
