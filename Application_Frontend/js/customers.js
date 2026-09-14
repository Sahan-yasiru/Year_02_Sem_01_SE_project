/**
 * Customer Module - Model-View-Controller (MVC) Implementation
 */

// ==========================================
// 1. MODEL
// ==========================================
const CustomerModel = {
  customers: [],
  filteredCustomers: [],
  currentPage: 1,
  pageSize: 8,
  searchQuery: "",
  isLoading: false,

  fetchCustomers: async function () {
    this.isLoading = true;
    try {
      const response = await api.get("/customer");
      this.customers = response.data || [];
      this.applyFilter();
      return this.customers;
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  getCustomerById: async function (id) {
    const response = await api.get(`/customer/${id}`);
    return response.data;
  },

  saveCustomer: async function (customerData) {
    let response;
    if (customerData.customerID && this.customers.some(c => c.customerID === customerData.customerID)) {
      response = await api.put("/customer", customerData);
    } else {
      response = await api.post("/customer", customerData);
    }
    await this.fetchCustomers();
    return response;
  },

  deleteCustomer: async function (id) {
    const response = await api.delete(`/customer/${id}`);
    await this.fetchCustomers();
    return response;
  },

  setSearchQuery: function (query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter: function () {
    if (!this.searchQuery) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = this.customers.filter(c => {
        const fullName = `${c.name?.fistName || ''} ${c.name?.lastName || ''}`.toLowerCase();
        const id = (c.customerID || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phoneNumber || '').toLowerCase();
        const address = (c.address || '').toLowerCase();
        return fullName.includes(this.searchQuery) ||
               id.includes(this.searchQuery) ||
               email.includes(this.searchQuery) ||
               phone.includes(this.searchQuery) ||
               address.includes(this.searchQuery);
      });
    }
  },

  getPaginatedData: function () {
    const totalItems = this.filteredCustomers.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const items = this.filteredCustomers.slice(start, end);

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
const CustomerView = {
  renderSkeleton: function ($container) {
    let rowsHtml = '';
    for (let i = 0; i < 5; i++) {
      rowsHtml += `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="px-6 py-4"><div class="h-4 w-16 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-32 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-40 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-28 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-48 skeleton"></div></td>
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <p class="text-base font-medium">No customers found</p>
              <p class="text-xs text-slate-400 mt-1">Try adjusting your search query or add a new customer.</p>
            </div>
          </td>
        </tr>
      `);
      $paginationContainer.html('');
      return;
    }

    let rowsHtml = '';
    paginatedData.items.forEach(customer => {
      const id = customer.customerID || 'N/A';
      const firstName = customer.name?.fistName || '';
      const lastName = customer.name?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Customer';
      const email = customer.email || 'N/A';
      const phone = customer.phoneNumber || 'N/A';
      const address = customer.address || 'N/A';

      rowsHtml += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">${id}</td>
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              ${fullName.charAt(0).toUpperCase()}
            </div>
            <span>${fullName}</span>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">${email}</td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">${phone}</td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs">${address}</td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="btn-view-customer text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="View Details">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button class="btn-edit-customer text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Edit Customer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button class="btn-delete-customer text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Delete Customer">
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
        <button class="btn-customer-page px-3 py-1.5 text-xs rounded-lg transition-all ${activeClass}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    $container.html(`
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing <span class="font-semibold text-slate-900 dark:text-white">${startItem}</span> to <span class="font-semibold text-slate-900 dark:text-white">${endItem}</span> of <span class="font-semibold text-slate-900 dark:text-white">${totalItems}</span> entries
        </span>
        <div class="flex items-center gap-1.5">
          <button class="btn-customer-prev px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
          </button>
          ${pagesButtons}
          <button class="btn-customer-next px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `);
  },

  getFormModalHtml: function (customer = null, nextId = '') {
    const isEdit = !!customer;
    const id = customer ? customer.customerID || '' : nextId;
    const firstName = customer ? customer.name?.fistName || '' : '';
    const lastName = customer ? customer.name?.lastName || '' : '';
    const email = customer ? customer.email || '' : '';
    const phone = customer ? customer.phoneNumber || '' : '';
    const address = customer ? customer.address || '' : '';

    const idFieldHtml = isEdit
      ? `<input type="text" id="cust-id" value="${id}" readonly class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm focus:outline-none" />`
      : `<div class="flex items-center gap-2">
           <input type="text" id="cust-id" value="${id}" readonly
             class="w-full px-3.5 py-2 rounded-xl border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono font-bold text-sm focus:outline-none cursor-default" />
           <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold whitespace-nowrap">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
             Auto
           </span>
         </div>`;

    return `
      <form id="customer-form" class="space-y-4">
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Customer ID <span class="text-rose-500">*</span></label>
            ${idFieldHtml}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">First Name <span class="text-rose-500">*</span></label>
              <input type="text" id="cust-firstname" value="${firstName}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="John" required />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Last Name <span class="text-rose-500">*</span></label>
              <input type="text" id="cust-lastname" value="${lastName}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Doe" required />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Email Address <span class="text-rose-500">*</span></label>
            <input type="email" id="cust-email" value="${email}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="john.doe@example.com" required />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Phone Number <span class="text-rose-500">*</span></label>
            <input type="tel" id="cust-phone" value="${phone}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="+1 555-0199" required />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Address</label>
            <textarea id="cust-address" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="123 Main Street, Suite 100">${address}</textarea>
          </div>
        </div>
      </form>
    `;
  },

  getViewModalHtml: function (customer) {
    const id = customer.customerID || 'N/A';
    const fullName = `${customer.name?.fistName || ''} ${customer.name?.lastName || ''}`.trim() || 'N/A';
    const email = customer.email || 'N/A';
    const phone = customer.phoneNumber || 'N/A';
    const address = customer.address || 'N/A';

    return `
      <div class="space-y-4">
        <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
          <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
            ${fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 class="text-base font-bold text-slate-900 dark:text-white">${fullName}</h4>
            <span class="inline-block text-xs font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">${id}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Email</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${email}</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Phone</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${phone}</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60 sm:col-span-2">
            <span class="text-xs text-slate-400 block mb-0.5">Address</span>
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
const CustomerController = {
  $tableBody: null,
  $paginationContainer: null,
  $searchInput: null,

  init: function () {
    this.$tableBody = $("#customer-table-body");
    this.$paginationContainer = $("#customer-pagination");
    this.$searchInput = $("#customer-search-input");

    this.bindEvents();
    this.loadData();
  },

  bindEvents: function () {
    const self = this;

    // Search input event
    if (this.$searchInput.length) {
      this.$searchInput.off("input").on("input", function () {
        CustomerModel.setSearchQuery($(this).val());
        self.updateView();
      });
    }

    // Add Customer button
    $("#btn-add-customer").off("click").on("click", function () {
      self.openAddModal();
    });

    // Delegated table action buttons
    this.$tableBody.off("click").on("click", ".btn-view-customer", function () {
      const id = $(this).data("id");
      self.openViewModal(id);
    });

    this.$tableBody.on("click", ".btn-edit-customer", function () {
      const id = $(this).data("id");
      self.openEditModal(id);
    });

    this.$tableBody.on("click", ".btn-delete-customer", function () {
      const id = $(this).data("id");
      self.handleDelete(id);
    });

    // Delegated pagination buttons
    this.$paginationContainer.off("click").on("click", ".btn-customer-page", function () {
      CustomerModel.currentPage = parseInt($(this).data("page"));
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-customer-prev", function () {
      CustomerModel.currentPage--;
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-customer-next", function () {
      CustomerModel.currentPage++;
      self.updateView();
    });
  },

  loadData: async function () {
    CustomerView.renderSkeleton(this.$tableBody);
    try {
      await CustomerModel.fetchCustomers();
      this.updateView();
    } catch (error) {
      Toast.error(error.message || "Failed to load customers.");
      this.$tableBody.html(`
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-rose-500 font-medium">
            Failed to connect to backend server.
          </td>
        </tr>
      `);
    }
  },

  updateView: function () {
    const paginatedData = CustomerModel.getPaginatedData();
    CustomerView.renderTable(paginatedData, this.$tableBody, this.$paginationContainer);
  },

  openAddModal: function () {
    const self = this;
    const nextId = IDGenerator.nextCustomerID(CustomerModel.customers);
    Modal.open({
      title: "Add New Customer",
      contentHtml: CustomerView.getFormModalHtml(null, nextId),
      saveText: "Create Customer",
      onSave: async function () {
        const customerData = {
          customerID: $("#cust-id").val().trim(),
          name: {
            fistName: $("#cust-firstname").val().trim(),
            lastName: $("#cust-lastname").val().trim()
          },
          email: $("#cust-email").val().trim(),
          phoneNumber: $("#cust-phone").val().trim(),
          address: $("#cust-address").val().trim()
        };

        if (!customerData.customerID || !customerData.name.fistName || !customerData.name.lastName || !customerData.email || !customerData.phoneNumber) {
          Toast.warning("Please fill in all required fields.");
          return false;
        }

        try {
          await CustomerModel.saveCustomer(customerData);
          Toast.success("Customer created successfully!");
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to save customer.");
          return false;
        }
      }
    });
  },

  openEditModal: async function (id) {
    const self = this;
    try {
      const customer = await CustomerModel.getCustomerById(id);
      Modal.open({
        title: "Edit Customer",
        contentHtml: CustomerView.getFormModalHtml(customer),
        saveText: "Update Customer",
        onSave: async function () {
          const customerData = {
            customerID: $("#cust-id").val().trim(),
            name: {
              fistName: $("#cust-firstname").val().trim(),
              lastName: $("#cust-lastname").val().trim()
            },
            email: $("#cust-email").val().trim(),
            phoneNumber: $("#cust-phone").val().trim(),
            address: $("#cust-address").val().trim()
          };

          try {
            await CustomerModel.saveCustomer(customerData);
            Toast.success("Customer updated successfully!");
            self.updateView();
            return true;
          } catch (err) {
            Toast.error(err.message || "Failed to update customer.");
            return false;
          }
        }
      });
    } catch (err) {
      Toast.error("Could not fetch customer details.");
    }
  },

  openViewModal: async function (id) {
    try {
      const customer = await CustomerModel.getCustomerById(id);
      Modal.open({
        title: "Customer Details",
        contentHtml: CustomerView.getViewModalHtml(customer),
        saveText: "Close",
        saveBtnClass: "bg-slate-600 hover:bg-slate-700 text-white",
        onSave: async function () { return true; }
      });
    } catch (err) {
      Toast.error("Could not load customer details.");
    }
  },

  handleDelete: function (id) {
    const self = this;
    Modal.confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete customer <strong>${id}</strong>? This action cannot be undone.`,
      confirmText: "Delete Customer",
      onConfirm: async function () {
        try {
          await CustomerModel.deleteCustomer(id);
          Toast.success(`Customer ${id} deleted successfully.`);
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to delete customer.");
          return false;
        }
      }
    });
  }
};
