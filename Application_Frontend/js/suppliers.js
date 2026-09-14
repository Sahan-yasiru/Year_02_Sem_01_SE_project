/**
 * Supplier Module - Model-View-Controller (MVC) Implementation
 */

// ==========================================
// 1. MODEL
// ==========================================
const SupplierModel = {
  suppliers: [],
  filteredSuppliers: [],
  currentPage: 1,
  pageSize: 8,
  searchQuery: "",
  isLoading: false,

  fetchSuppliers: async function () {
    this.isLoading = true;
    try {
      const response = await api.get("/supplier");
      this.suppliers = response.data || [];
      this.applyFilter();
      return this.suppliers;
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  getSupplierById: async function (id) {
    const response = await api.get(`/supplier/${id}`);
    return response.data;
  },

  saveSupplier: async function (supplierData) {
    let response;
    if (supplierData.SupplierID && this.suppliers.some(s => s.SupplierID === supplierData.SupplierID)) {
      response = await api.put("/supplier", supplierData);
    } else {
      response = await api.post("/supplier", supplierData);
    }
    await this.fetchSuppliers();
    return response;
  },

  deleteSupplier: async function (id) {
    const response = await api.delete(`/supplier/${id}`);
    await this.fetchSuppliers();
    return response;
  },

  setSearchQuery: function (query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter: function () {
    if (!this.searchQuery) {
      this.filteredSuppliers = [...this.suppliers];
    } else {
      this.filteredSuppliers = this.suppliers.filter(s => {
        const id = (s.SupplierID || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const phone = String(s.phone || '').toLowerCase();
        return id.includes(this.searchQuery) ||
               name.includes(this.searchQuery) ||
               email.includes(this.searchQuery) ||
               phone.includes(this.searchQuery);
      });
    }
  },

  getPaginatedData: function () {
    const totalItems = this.filteredSuppliers.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const items = this.filteredSuppliers.slice(start, end);

    return {
      items,
      totalItems,
      totalPages,
      currentPage: this.currentPage,
      pageSize: this.pageSize
    };
  }
};

// ==========================================
// 2. VIEW
// ==========================================
const SupplierView = {
  renderSkeleton: function ($container) {
    let rowsHtml = '';
    for (let i = 0; i < 5; i++) {
      rowsHtml += `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="px-6 py-4"><div class="h-4 w-16 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-32 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-40 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-28 skeleton"></div></td>
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
          <td colspan="5" class="px-6 py-12 text-center">
            <div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <svg class="w-12 h-12 mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <p class="text-base font-medium">No suppliers found</p>
              <p class="text-xs text-slate-400 mt-1">Try searching or add a new supplier.</p>
            </div>
          </td>
        </tr>
      `);
      $paginationContainer.html('');
      return;
    }

    let rowsHtml = '';
    paginatedData.items.forEach(supplier => {
      const id = supplier.SupplierID || 'N/A';
      const name = supplier.name || 'Unnamed Supplier';
      const email = supplier.email || 'N/A';
      const phone = supplier.phone || 'N/A';

      rowsHtml += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">${id}</td>
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
              ${name.charAt(0).toUpperCase()}
            </div>
            <span>${name}</span>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">${email}</td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono">${phone}</td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="btn-view-supplier text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="View Details">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button class="btn-edit-supplier text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Edit Supplier">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button class="btn-delete-supplier text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Delete Supplier">
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
        <button class="btn-supplier-page px-3 py-1.5 text-xs rounded-lg transition-all ${activeClass}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    $container.html(`
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing <span class="font-semibold text-slate-900 dark:text-white">${startItem}</span> to <span class="font-semibold text-slate-900 dark:text-white">${endItem}</span> of <span class="font-semibold text-slate-900 dark:text-white">${totalItems}</span> suppliers
        </span>
        <div class="flex items-center gap-1.5">
          <button class="btn-supplier-prev px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
          </button>
          ${pagesButtons}
          <button class="btn-supplier-next px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `);
  },

  getFormModalHtml: function (supplier = null, nextId = '') {
    const isEdit = !!supplier;
    const id = supplier ? supplier.SupplierID || '' : nextId;
    const name = supplier ? supplier.name || '' : '';
    const email = supplier ? supplier.email || '' : '';
    const phone = supplier ? supplier.phone || '' : '';

    const idFieldHtml = isEdit
      ? `<input type="text" id="supp-id" value="${id}" readonly class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed text-sm focus:outline-none" />`
      : `<div class="flex items-center gap-2">
           <input type="text" id="supp-id" value="${id}" readonly
             class="w-full px-3.5 py-2 rounded-xl border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono font-bold text-sm focus:outline-none cursor-default" />
           <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold whitespace-nowrap">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
             Auto
           </span>
         </div>`;

    return `
      <form id="supplier-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Supplier ID <span class="text-rose-500">*</span></label>
          ${idFieldHtml}
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Supplier Name <span class="text-rose-500">*</span></label>
          <input type="text" id="supp-name" value="${name}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Bosch Automotive Corp" required />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Email Address <span class="text-rose-500">*</span></label>
          <input type="email" id="supp-email" value="${email}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="orders@bosch-auto.com" required />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Phone Number (Digits) <span class="text-rose-500">*</span></label>
          <input type="number" id="supp-phone" value="${phone}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="18005550199" required />
        </div>
      </form>
    `;
  },

  getViewModalHtml: function (supplier) {
    const id = supplier.SupplierID || 'N/A';
    const name = supplier.name || 'N/A';
    const email = supplier.email || 'N/A';
    const phone = supplier.phone || 'N/A';

    return `
      <div class="space-y-4">
        <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
            ${name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 class="text-base font-bold text-slate-900 dark:text-white">${name}</h4>
            <span class="inline-block text-xs font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">${id}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Email</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${email}</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Phone Number</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${phone}</span>
          </div>
        </div>
      </div>
    `;
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const SupplierController = {
  $tableBody: null,
  $paginationContainer: null,
  $searchInput: null,

  init: function () {
    this.$tableBody = $("#supplier-table-body");
    this.$paginationContainer = $("#supplier-pagination");
    this.$searchInput = $("#supplier-search-input");

    this.bindEvents();
    this.loadData();
  },

  bindEvents: function () {
    const self = this;

    if (this.$searchInput.length) {
      this.$searchInput.off("input").on("input", function () {
        SupplierModel.setSearchQuery($(this).val());
        self.updateView();
      });
    }

    $("#btn-add-supplier").off("click").on("click", function () {
      self.openAddModal();
    });

    this.$tableBody.off("click").on("click", ".btn-view-supplier", function () {
      const id = $(this).data("id");
      self.openViewModal(id);
    });

    this.$tableBody.on("click", ".btn-edit-supplier", function () {
      const id = $(this).data("id");
      self.openEditModal(id);
    });

    this.$tableBody.on("click", ".btn-delete-supplier", function () {
      const id = $(this).data("id");
      self.handleDelete(id);
    });

    this.$paginationContainer.off("click").on("click", ".btn-supplier-page", function () {
      SupplierModel.currentPage = parseInt($(this).data("page"));
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-supplier-prev", function () {
      SupplierModel.currentPage--;
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-supplier-next", function () {
      SupplierModel.currentPage++;
      self.updateView();
    });
  },

  loadData: async function () {
    SupplierView.renderSkeleton(this.$tableBody);
    try {
      await SupplierModel.fetchSuppliers();
      this.updateView();
    } catch (error) {
      Toast.error(error.message || "Failed to load suppliers.");
    }
  },

  updateView: function () {
    const paginatedData = SupplierModel.getPaginatedData();
    SupplierView.renderTable(paginatedData, this.$tableBody, this.$paginationContainer);
  },

  openAddModal: function () {
    const self = this;
    const nextId = IDGenerator.nextSupplierID(SupplierModel.suppliers);
    Modal.open({
      title: "Add Supplier",
      contentHtml: SupplierView.getFormModalHtml(null, nextId),
      saveText: "Create Supplier",
      onSave: async function () {
        const id = $("#supp-id").val().trim();
        const name = $("#supp-name").val().trim();
        const email = $("#supp-email").val().trim();
        const phone = parseInt($("#supp-phone").val()) || 0;

        if (!id || !name || !email) {
          Toast.warning("Please fill in required Supplier ID, Name, and Email.");
          return false;
        }

        const supplierData = {
          SupplierID: id,
          name: name,
          email: email,
          phone: phone
        };

        try {
          await SupplierModel.saveSupplier(supplierData);
          Toast.success("Supplier created successfully!");
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to save supplier.");
          return false;
        }
      }
    });
  },

  openEditModal: async function (id) {
    const self = this;
    try {
      const supplier = await SupplierModel.getSupplierById(id);
      Modal.open({
        title: `Edit Supplier ${id}`,
        contentHtml: SupplierView.getFormModalHtml(supplier),
        saveText: "Update Supplier",
        onSave: async function () {
          const name = $("#supp-name").val().trim();
          const email = $("#supp-email").val().trim();
          const phone = parseInt($("#supp-phone").val()) || 0;

          const supplierData = {
            SupplierID: id,
            name: name,
            email: email,
            phone: phone
          };

          try {
            await SupplierModel.saveSupplier(supplierData);
            Toast.success("Supplier updated successfully!");
            self.updateView();
            return true;
          } catch (err) {
            Toast.error(err.message || "Failed to update supplier.");
            return false;
          }
        }
      });
    } catch (err) {
      Toast.error("Could not fetch supplier details.");
    }
  },

  openViewModal: async function (id) {
    try {
      const supplier = await SupplierModel.getSupplierById(id);
      Modal.open({
        title: "Supplier Details",
        contentHtml: SupplierView.getViewModalHtml(supplier),
        saveText: "Close",
        saveBtnClass: "bg-slate-600 hover:bg-slate-700 text-white",
        onSave: async function () { return true; }
      });
    } catch (err) {
      Toast.error("Could not load supplier details.");
    }
  },

  handleDelete: function (id) {
    const self = this;
    Modal.confirm({
      title: "Delete Supplier",
      message: `Are you sure you want to delete supplier <strong>${id}</strong>?`,
      confirmText: "Delete Supplier",
      onConfirm: async function () {
        try {
          await SupplierModel.deleteSupplier(id);
          Toast.success(`Supplier ${id} deleted successfully.`);
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to delete supplier.");
          return false;
        }
      }
    });
  }
};
