/**
 * Brands Module - MVC Implementation
 * API: GET/POST/PUT/DELETE /api/brand
 * BrandDTO: { brandID (String, manual), brandName, countryOfOrigin }
 */

// ==========================================
// 1. MODEL
// ==========================================
const BrandModel = {
  brands: [],
  filteredBrands: [],
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  isLoading: false,

  fetchBrands: async function () {
    this.isLoading = true;
    try {
      const response = await api.get('/brand');
      this.brands = response.data || [];
      this.applyFilter();
      return this.brands;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  getBrandById: async function (id) {
    const response = await api.get(`/brand/${id}`);
    return response.data;
  },

  saveBrand: async function (brandData) {
    let response;
    if (brandData.brandID && this.brands.some(b => b.brandID === brandData.brandID)) {
      response = await api.put('/brand', brandData);
    } else {
      response = await api.post('/brand', brandData);
    }
    await this.fetchBrands();
    return response;
  },

  deleteBrand: async function (id) {
    const response = await api.delete(`/brand/${id}`);
    await this.fetchBrands();
    return response;
  },

  setSearchQuery: function (query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter: function () {
    if (!this.searchQuery) {
      this.filteredBrands = [...this.brands];
    } else {
      this.filteredBrands = this.brands.filter(b => {
        const id = (b.brandID || '').toLowerCase();
        const name = (b.brandName || '').toLowerCase();
        const country = (b.countryOfOrigin || '').toLowerCase();
        return id.includes(this.searchQuery) || name.includes(this.searchQuery) || country.includes(this.searchQuery);
      });
    }
  },

  getPaginatedData: function () {
    const totalItems = this.filteredBrands.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.pageSize;
    return {
      items: this.filteredBrands.slice(start, start + this.pageSize),
      totalItems, totalPages,
      currentPage: this.currentPage,
      pageSize: this.pageSize
    };
  }
};

// ==========================================
// 2. VIEW
// ==========================================
const BrandView = {
  renderSkeleton: function ($container) {
    let html = '';
    for (let i = 0; i < 5; i++) {
      html += `<tr class="border-b border-slate-100 dark:border-slate-800">
        <td class="px-6 py-4"><div class="h-4 w-16 skeleton"></div></td>
        <td class="px-6 py-4"><div class="h-4 w-28 skeleton"></div></td>
        <td class="px-6 py-4"><div class="h-4 w-20 skeleton"></div></td>
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
              <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              <p class="font-medium">No brands found</p>
              <p class="text-xs mt-1">Add your first brand to get started.</p>
            </div>
          </td>
        </tr>`);
      $paginationContainer.html('');
      return;
    }

    const flagEmoji = (country) => {
      const map = { 'Japan': '🇯🇵', 'Germany': '🇩🇪', 'USA': '🇺🇸', 'United States': '🇺🇸', 'UK': '🇬🇧', 'China': '🇨🇳', 'South Korea': '🇰🇷', 'Italy': '🇮🇹', 'France': '🇫🇷', 'India': '🇮🇳', 'Sri Lanka': '🇱🇰' };
      return map[country] || '🌐';
    };

    let html = '';
    paginatedData.items.forEach(b => {
      const id = b.brandID || 'N/A';
      const name = b.brandName || 'Unknown';
      const country = b.countryOfOrigin || '—';
      html += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4 text-xs font-mono font-semibold text-violet-600 dark:text-violet-400">${id}</td>
          <td class="px-6 py-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">
              ${name.charAt(0).toUpperCase()}
            </div>
            ${name}
          </td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">${flagEmoji(country)} ${country}</td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="btn-edit-brand text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Edit Brand">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button class="btn-delete-brand text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Delete Brand">
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
        ? 'bg-violet-600 text-white shadow-sm font-semibold'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700';
      pages += `<button class="btn-brand-page px-3 py-1.5 text-xs rounded-lg transition-all ${cls}" data-page="${p}">${p}</button>`;
    }
    $container.html(`
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing <span class="font-semibold text-slate-900 dark:text-white">${startItem}</span> to <span class="font-semibold text-slate-900 dark:text-white">${endItem}</span> of <span class="font-semibold text-slate-900 dark:text-white">${totalItems}</span> brands
        </span>
        <div class="flex items-center gap-1.5">
          <button class="btn-brand-prev px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
          ${pages}
          <button class="btn-brand-next px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>Next</button>
        </div>
      </div>`);
  },

  getFormModalHtml: function (brand = null, nextId = '') {
    const isEdit = !!brand;
    const id = brand ? brand.brandID || '' : nextId;
    const name = brand ? brand.brandName || '' : '';
    const country = brand ? brand.countryOfOrigin || '' : '';

    const idFieldHtml = isEdit
      ? `<input type="text" id="brand-id" value="${id}" readonly class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed text-sm focus:outline-none" />`
      : `<div class="flex items-center gap-2">
           <input type="text" id="brand-id" value="${id}" readonly
             class="w-full px-3.5 py-2 rounded-xl border-2 border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-mono font-bold text-sm focus:outline-none cursor-default" />
           <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 text-xs font-semibold whitespace-nowrap">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
             Auto
           </span>
         </div>`;

    return `
      <form id="brand-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Brand ID <span class="text-rose-500">*</span></label>
          ${idFieldHtml}
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Brand Name <span class="text-rose-500">*</span></label>
          <input type="text" id="brand-name" value="${name}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" placeholder="e.g. Bosch" required />
        </div>
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Country of Origin <span class="text-rose-500">*</span></label>
          <input type="text" id="brand-country" value="${country}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" placeholder="e.g. Germany" required />
        </div>
      </form>`;
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const BrandController = {
  $tableBody: null,
  $paginationContainer: null,
  $searchInput: null,

  init: function () {
    this.$tableBody = $('#brand-table-body');
    this.$paginationContainer = $('#brand-pagination');
    this.$searchInput = $('#brand-search-input');
    this.bindEvents();
    this.loadData();
  },

  bindEvents: function () {
    const self = this;
    this.$searchInput.off('input').on('input', function () {
      BrandModel.setSearchQuery($(this).val());
      self.updateView();
    });

    $('#btn-add-brand').off('click').on('click', function () { self.openAddModal(); });

    this.$tableBody.off('click')
      .on('click', '.btn-edit-brand', function () { self.openEditModal($(this).data('id')); })
      .on('click', '.btn-delete-brand', function () { self.handleDelete($(this).data('id')); });

    this.$paginationContainer.off('click')
      .on('click', '.btn-brand-page', function () { BrandModel.currentPage = parseInt($(this).data('page')); self.updateView(); })
      .on('click', '.btn-brand-prev', function () { BrandModel.currentPage--; self.updateView(); })
      .on('click', '.btn-brand-next', function () { BrandModel.currentPage++; self.updateView(); });
  },

  loadData: async function () {
    BrandView.renderSkeleton(this.$tableBody);
    try {
      await BrandModel.fetchBrands();
      this.updateView();
    } catch (error) {
      Toast.error(error.message || 'Failed to load brands.');
      this.$tableBody.html(`<tr><td colspan="4" class="px-6 py-8 text-center text-rose-500 font-medium">Failed to connect to backend server.</td></tr>`);
    }
  },

  updateView: function () {
    BrandView.renderTable(BrandModel.getPaginatedData(), this.$tableBody, this.$paginationContainer);
  },

  openAddModal: function () {
    const self = this;
    const nextId = IDGenerator.nextBrandID(BrandModel.brands);
    Modal.open({
      title: 'Add New Brand',
      contentHtml: BrandView.getFormModalHtml(null, nextId),
      saveText: 'Create Brand',
      onSave: async function () {
        const brandData = {
          brandID: $('#brand-id').val().trim(),
          brandName: $('#brand-name').val().trim(),
          countryOfOrigin: $('#brand-country').val().trim()
        };
        if (!brandData.brandID || !brandData.brandName || !brandData.countryOfOrigin) {
          Toast.warning('Please fill in all required fields.');
          return false;
        }
        try {
          await BrandModel.saveBrand(brandData);
          Toast.success('Brand created successfully!');
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || 'Failed to save brand.');
          return false;
        }
      }
    });
  },

  openEditModal: async function (id) {
    const self = this;
    try {
      const brand = await BrandModel.getBrandById(id);
      Modal.open({
        title: `Edit Brand — ${id}`,
        contentHtml: BrandView.getFormModalHtml(brand),
        saveText: 'Update Brand',
        onSave: async function () {
          const brandData = {
            brandID: id,
            brandName: $('#brand-name').val().trim(),
            countryOfOrigin: $('#brand-country').val().trim()
          };
          try {
            await BrandModel.saveBrand(brandData);
            Toast.success('Brand updated successfully!');
            self.updateView();
            return true;
          } catch (err) {
            Toast.error(err.message || 'Failed to update brand.');
            return false;
          }
        }
      });
    } catch (err) {
      Toast.error('Could not fetch brand details.');
    }
  },

  handleDelete: function (id) {
    const self = this;
    Modal.confirm({
      title: 'Delete Brand',
      message: `Are you sure you want to delete brand <strong>${id}</strong>? This cannot be undone.`,
      confirmText: 'Delete Brand',
      onConfirm: async function () {
        try {
          await BrandModel.deleteBrand(id);
          Toast.success(`Brand ${id} deleted successfully.`);
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || 'Failed to delete brand.');
          return false;
        }
      }
    });
  }
};
