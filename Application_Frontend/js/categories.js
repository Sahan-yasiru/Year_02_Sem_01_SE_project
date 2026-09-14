/**
 * Categories Module - MVC Implementation
 * API: GET/POST/PUT/DELETE /api/category
 * CategoryDTO: { categoryId (int, auto), categoryName, categoryDescription }
 */

// ==========================================
// 1. MODEL
// ==========================================
const CategoryModel = {
  categories: [],
  filteredCategories: [],
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  isLoading: false,

  fetchCategories: async function () {
    this.isLoading = true;
    try {
      const response = await api.get('/category');
      this.categories = response.data || [];
      this.applyFilter();
      return this.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  getCategoryById: async function (id) {
    const response = await api.get(`/category/${id}`);
    return response.data;
  },

  saveCategory: async function (categoryData) {
    let response;
    // categoryId == 0 means new (not yet persisted)
    if (categoryData.categoryId && categoryData.categoryId !== 0 && this.categories.some(c => c.categoryId === categoryData.categoryId)) {
      response = await api.put('/category', categoryData);
    } else {
      response = await api.post('/category', categoryData);
    }
    await this.fetchCategories();
    return response;
  },

  deleteCategory: async function (id) {
    const response = await api.delete(`/category/${id}`);
    await this.fetchCategories();
    return response;
  },

  setSearchQuery: function (query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter: function () {
    if (!this.searchQuery) {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = this.categories.filter(c => {
        const id = String(c.categoryId || '').toLowerCase();
        const name = (c.categoryName || '').toLowerCase();
        const desc = (c.categoryDescription || '').toLowerCase();
        return id.includes(this.searchQuery) || name.includes(this.searchQuery) || desc.includes(this.searchQuery);
      });
    }
  },

  getPaginatedData: function () {
    const totalItems = this.filteredCategories.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.pageSize;
    return {
      items: this.filteredCategories.slice(start, start + this.pageSize),
      totalItems, totalPages,
      currentPage: this.currentPage,
      pageSize: this.pageSize
    };
  }
};

// ==========================================
// 2. VIEW
// ==========================================
const CategoryView = {
  // Colour palette for category badges (cycles through)
  _colours: [
    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  ],

  renderSkeleton: function ($container) {
    let html = '';
    for (let i = 0; i < 5; i++) {
      html += `<tr class="border-b border-slate-100 dark:border-slate-800">
        <td class="px-6 py-4"><div class="h-4 w-8 skeleton"></div></td>
        <td class="px-6 py-4"><div class="h-5 w-32 skeleton rounded-full"></div></td>
        <td class="px-6 py-4"><div class="h-4 w-56 skeleton"></div></td>
        <td class="px-6 py-4"><div class="h-8 w-20 skeleton ml-auto"></div></td>
      </tr>`;
    }
    $container.html(html);
  },

  renderTable: function (paginatedData, $tableBody, $paginationContainer) {
    if (paginatedData.items.length === 0) {
      $tableBody.html(`
        <tr>
          <td colspan="4" class="px-6 py-12 text-center">
            <div class="flex flex-col items-center text-slate-400 dark:text-slate-500">
              <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              <p class="font-medium">No categories found</p>
              <p class="text-xs mt-1">Add your first category to get started.</p>
            </div>
          </td>
        </tr>`);
      $paginationContainer.html('');
      return;
    }

    let html = '';
    paginatedData.items.forEach((c, index) => {
      const id = c.categoryId;
      const name = c.categoryName || 'Unnamed';
      const desc = c.categoryDescription || '—';
      const colourCls = this._colours[index % this._colours.length];
      html += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4 text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">#${id}</td>
          <td class="px-6 py-4">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold ${colourCls}">${name}</span>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">${desc}</td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="btn-edit-category text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Edit Category">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button class="btn-delete-category text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Delete Category">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </td>
        </tr>`;
    });
    $tableBody.html(html);
    this.renderPagination(paginatedData, $paginationContainer);
  },

  renderPagination: function (data, $container) {
    const { currentPage, totalPages, totalItems, pageSize } = data;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    let pages = '';
    for (let p = 1; p <= totalPages; p++) {
      const cls = p === currentPage
        ? 'bg-teal-600 text-white shadow-sm font-semibold'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700';
      pages += `<button class="btn-category-page px-3 py-1.5 text-xs rounded-lg transition-all ${cls}" data-page="${p}">${p}</button>`;
    }
    $container.html(`
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing <span class="font-semibold text-slate-900 dark:text-white">${startItem}</span> to <span class="font-semibold text-slate-900 dark:text-white">${endItem}</span> of <span class="font-semibold text-slate-900 dark:text-white">${totalItems}</span> categories
        </span>
        <div class="flex items-center gap-1.5">
          <button class="btn-category-prev px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
          ${pages}
          <button class="btn-category-next px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>Next</button>
        </div>
      </div>`);
  },

  getFormModalHtml: function (category = null) {
    const isEdit = !!category;
    const id = category ? category.categoryId : null;
    const name = category ? category.categoryName || '' : '';
    const desc = category ? category.categoryDescription || '' : '';

    const idRow = isEdit
      ? `<div>
           <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Category ID</label>
           <input type="text" value="#${id}" readonly class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed text-sm focus:outline-none" />
         </div>`
      : `<div class="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/50 text-teal-700 dark:text-teal-300 text-xs font-medium flex items-center gap-2">
           <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           Category ID will be <strong>auto-assigned</strong> by the database.
         </div>`;

    return `
      <form id="category-form" class="space-y-4">
        ${idRow}
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Category Name <span class="text-rose-500">*</span></label>
          <input type="text" id="cat-name" value="${name}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="e.g. Engine Parts" required />
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Description</label>
          <textarea id="cat-desc" rows="3" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="Short description of this category...">${desc}</textarea>
        </div>
      </form>`;
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const CategoryController = {
  $tableBody: null,
  $paginationContainer: null,
  $searchInput: null,

  init: function () {
    this.$tableBody = $('#category-table-body');
    this.$paginationContainer = $('#category-pagination');
    this.$searchInput = $('#category-search-input');
    this.bindEvents();
    this.loadData();
  },

  bindEvents: function () {
    const self = this;
    this.$searchInput.off('input').on('input', function () {
      CategoryModel.setSearchQuery($(this).val());
      self.updateView();
    });

    $('#btn-add-category').off('click').on('click', function () { self.openAddModal(); });

    this.$tableBody.off('click')
      .on('click', '.btn-edit-category', function () { self.openEditModal($(this).data('id')); })
      .on('click', '.btn-delete-category', function () { self.handleDelete($(this).data('id')); });

    this.$paginationContainer.off('click')
      .on('click', '.btn-category-page', function () { CategoryModel.currentPage = parseInt($(this).data('page')); self.updateView(); })
      .on('click', '.btn-category-prev', function () { CategoryModel.currentPage--; self.updateView(); })
      .on('click', '.btn-category-next', function () { CategoryModel.currentPage++; self.updateView(); });
  },

  loadData: async function () {
    CategoryView.renderSkeleton(this.$tableBody);
    try {
      await CategoryModel.fetchCategories();
      this.updateView();
    } catch (error) {
      Toast.error(error.message || 'Failed to load categories.');
      this.$tableBody.html(`<tr><td colspan="4" class="px-6 py-8 text-center text-rose-500 font-medium">Failed to connect to backend server.</td></tr>`);
    }
  },

  updateView: function () {
    CategoryView.renderTable(CategoryModel.getPaginatedData(), this.$tableBody, this.$paginationContainer);
  },

  openAddModal: function () {
    const self = this;
    Modal.open({
      title: 'Add New Category',
      contentHtml: CategoryView.getFormModalHtml(),
      saveText: 'Create Category',
      onSave: async function () {
        const categoryData = {
          categoryId: 0,
          categoryName: $('#cat-name').val().trim(),
          categoryDescription: $('#cat-desc').val().trim()
        };
        if (!categoryData.categoryName) {
          Toast.warning('Category Name is required.');
          return false;
        }
        try {
          await CategoryModel.saveCategory(categoryData);
          Toast.success('Category created successfully!');
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || 'Failed to save category.');
          return false;
        }
      }
    });
  },

  openEditModal: async function (id) {
    const self = this;
    try {
      const category = await CategoryModel.getCategoryById(id);
      Modal.open({
        title: `Edit Category — #${id}`,
        contentHtml: CategoryView.getFormModalHtml(category),
        saveText: 'Update Category',
        onSave: async function () {
          const categoryData = {
            categoryId: id,
            categoryName: $('#cat-name').val().trim(),
            categoryDescription: $('#cat-desc').val().trim()
          };
          try {
            await CategoryModel.saveCategory(categoryData);
            Toast.success('Category updated successfully!');
            self.updateView();
            return true;
          } catch (err) {
            Toast.error(err.message || 'Failed to update category.');
            return false;
          }
        }
      });
    } catch (err) {
      Toast.error('Could not fetch category details.');
    }
  },

  handleDelete: function (id) {
    const self = this;
    Modal.confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete category <strong>#${id}</strong>? This cannot be undone.`,
      confirmText: 'Delete Category',
      onConfirm: async function () {
        try {
          await CategoryModel.deleteCategory(id);
          Toast.success(`Category #${id} deleted successfully.`);
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || 'Failed to delete category.');
          return false;
        }
      }
    });
  }
};
