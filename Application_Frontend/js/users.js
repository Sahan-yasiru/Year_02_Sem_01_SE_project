/**
 * User / Admin Module - Model-View-Controller (MVC) Implementation
 */

// ==========================================
// 1. MODEL
// ==========================================
const UserModel = {
  users: [],
  filteredUsers: [],
  currentPage: 1,
  pageSize: 8,
  searchQuery: "",
  isLoading: false,

  fetchUsers: async function () {
    this.isLoading = true;
    try {
      const response = await api.get("/user");
      this.users = response.data || [];
      this.applyFilter();
      return this.users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  saveUser: async function (userData) {
    let response;
    if (userData.userID && this.users.some(u => u.userID === userData.userID)) {
      response = await api.put("/user", userData);
    } else {
      response = await api.post("/user", userData);
    }
    await this.fetchUsers();
    return response;
  },

  deleteUser: async function (id) {
    const response = await api.delete(`/user/${id}`);
    await this.fetchUsers();
    return response;
  },

  setSearchQuery: function (query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter: function () {
    if (!this.searchQuery) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(u => {
        const name = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role = (u.userRole || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        return name.includes(this.searchQuery) ||
               email.includes(this.searchQuery) ||
               role.includes(this.searchQuery) ||
               phone.includes(this.searchQuery);
      });
    }
  },

  getPaginatedData: function () {
    const totalItems = this.filteredUsers.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const items = this.filteredUsers.slice(start, end);

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
const UserView = {
  renderSkeleton: function ($container) {
    let rowsHtml = '';
    for (let i = 0; i < 5; i++) {
      rowsHtml += `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="px-6 py-4"><div class="h-4 w-12 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-32 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-40 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-28 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-6 w-20 skeleton"></div></td>
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <p class="text-base font-medium">No user accounts found</p>
              <p class="text-xs text-slate-400 mt-1">Try searching or add a new admin user.</p>
            </div>
          </td>
        </tr>
      `);
      $paginationContainer.html('');
      return;
    }

    let rowsHtml = '';
    paginatedData.items.forEach(user => {
      const id = user.userID || 0;
      const username = user.username || 'N/A';
      const email = user.email || 'N/A';
      const phone = user.phone || 'N/A';
      const role = user.userRole || 'Customer';

      let roleBadge = '';
      if (role === 'Admin' || role === 'Owner') {
        roleBadge = `<span class="badge badge-danger"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>${role}</span>`;
      } else if (role === 'Store_Manager') {
        roleBadge = `<span class="badge badge-warning"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>Manager</span>`;
      } else if (role === 'Sales_Staff') {
        roleBadge = `<span class="badge badge-info"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>Staff</span>`;
      } else {
        roleBadge = `<span class="badge badge-success"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Customer</span>`;
      }

      rowsHtml += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">#${id}</td>
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold">
              ${username.charAt(0).toUpperCase()}
            </div>
            <span>${username}</span>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">${email}</td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">${phone}</td>
          <td class="px-6 py-4">${roleBadge}</td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="btn-edit-user text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Edit User">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button class="btn-delete-user text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Delete User">
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
        <button class="btn-user-page px-3 py-1.5 text-xs rounded-lg transition-all ${activeClass}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    $container.html(`
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing <span class="font-semibold text-slate-900 dark:text-white">${startItem}</span> to <span class="font-semibold text-slate-900 dark:text-white">${endItem}</span> of <span class="font-semibold text-slate-900 dark:text-white">${totalItems}</span> users
        </span>
        <div class="flex items-center gap-1.5">
          <button class="btn-user-prev px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
          </button>
          ${pagesButtons}
          <button class="btn-user-next px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `);
  },

  getFormModalHtml: function (user = null) {
    const isEdit = !!user;
    const username = user ? user.username || '' : '';
    const email = user ? user.email || '' : '';
    const phone = user ? user.phone || '' : '';
    const role = user ? user.userRole || 'Admin' : 'Admin';

    return `
      <form id="user-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Username <span class="text-rose-500">*</span></label>
          <input type="text" id="user-username" value="${username}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="admin_john" required />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Email <span class="text-rose-500">*</span></label>
          <input type="email" id="user-email" value="${email}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="john@company.com" required />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Password ${isEdit ? '(Leave empty to keep unchanged)' : '<span class="text-rose-500">*</span>'}</label>
          <input type="password" id="user-password" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="••••••••" ${!isEdit ? 'required' : ''} />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Phone Number</label>
            <input type="tel" id="user-phone" value="${phone}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="+1 555-0188" />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">User Role <span class="text-rose-500">*</span></label>
            <select id="user-role" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="Admin" ${role === 'Admin' ? 'selected' : ''}>Admin</option>
              <option value="Owner" ${role === 'Owner' ? 'selected' : ''}>Owner</option>
              <option value="Store_Manager" ${role === 'Store_Manager' ? 'selected' : ''}>Store Manager</option>
              <option value="Sales_Staff" ${role === 'Sales_Staff' ? 'selected' : ''}>Sales Staff</option>
              <option value="Customer" ${role === 'Customer' ? 'selected' : ''}>Customer</option>
            </select>
          </div>
        </div>
      </form>
    `;
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const UserController = {
  $tableBody: null,
  $paginationContainer: null,
  $searchInput: null,

  init: function () {
    this.$tableBody = $("#user-table-body");
    this.$paginationContainer = $("#user-pagination");
    this.$searchInput = $("#user-search-input");

    this.bindEvents();
    this.loadData();
  },

  bindEvents: function () {
    const self = this;

    if (this.$searchInput.length) {
      this.$searchInput.off("input").on("input", function () {
        UserModel.setSearchQuery($(this).val());
        self.updateView();
      });
    }

    $("#btn-add-user").off("click").on("click", function () {
      self.openAddModal();
    });

    this.$tableBody.off("click").on("click", ".btn-edit-user", function () {
      const id = parseInt($(this).data("id"));
      self.openEditModal(id);
    });

    this.$tableBody.on("click", ".btn-delete-user", function () {
      const id = parseInt($(this).data("id"));
      self.handleDelete(id);
    });

    this.$paginationContainer.off("click").on("click", ".btn-user-page", function () {
      UserModel.currentPage = parseInt($(this).data("page"));
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-user-prev", function () {
      UserModel.currentPage--;
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-user-next", function () {
      UserModel.currentPage++;
      self.updateView();
    });
  },

  loadData: async function () {
    UserView.renderSkeleton(this.$tableBody);
    try {
      await UserModel.fetchUsers();
      this.updateView();
    } catch (error) {
      Toast.error(error.message || "Failed to load user accounts.");
    }
  },

  updateView: function () {
    const paginatedData = UserModel.getPaginatedData();
    UserView.renderTable(paginatedData, this.$tableBody, this.$paginationContainer);
  },

  openAddModal: function () {
    const self = this;
    Modal.open({
      title: "Add New User / Admin",
      contentHtml: UserView.getFormModalHtml(),
      saveText: "Create Account",
      onSave: async function () {
        const username = $("#user-username").val().trim();
        const email = $("#user-email").val().trim();
        const password = $("#user-password").val();
        const phone = $("#user-phone").val().trim();
        const userRole = $("#user-role").val();

        if (!username || !email || !password) {
          Toast.warning("Please fill in required Username, Email, and Password.");
          return false;
        }

        const userData = {
          username: username,
          email: email,
          password: password,
          phone: phone ? phone : null,
          userRole: userRole
        };

        try {
          await UserModel.saveUser(userData);
          Toast.success("User account created successfully!");
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to save user account.");
          return false;
        }
      }
    });
  },

  openEditModal: function (id) {
    const self = this;
    const user = UserModel.users.find(u => u.userID === id);
    if (!user) {
      Toast.error("User not found.");
      return;
    }

    Modal.open({
      title: `Edit User ${user.username}`,
      contentHtml: UserView.getFormModalHtml(user),
      saveText: "Update Account",
      onSave: async function () {
        const username = $("#user-username").val().trim();
        const email = $("#user-email").val().trim();
        const password = $("#user-password").val();
        const phone = $("#user-phone").val().trim();
        const userRole = $("#user-role").val();

        const userData = {
          userID: id,
          username: username,
          email: email,
          password: password || user.password,
          phone: phone ? phone : null,
          userRole: userRole
        };

        try {
          await UserModel.saveUser(userData);
          Toast.success("User account updated successfully!");
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to update user account.");
          return false;
        }
      }
    });
  },

  handleDelete: function (id) {
    const self = this;
    Modal.confirm({
      title: "Delete User Account",
      message: `Are you sure you want to delete user account <strong>#${id}</strong>?`,
      confirmText: "Delete User",
      onConfirm: async function () {
        try {
          await UserModel.deleteUser(id);
          Toast.success(`User #${id} deleted successfully.`);
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to delete user account.");
          return false;
        }
      }
    });
  }
};
