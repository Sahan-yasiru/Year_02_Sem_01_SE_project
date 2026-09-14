/**
 * Spare Parts Module - Model-View-Controller (MVC) Implementation
 */

// ==========================================
// 1. MODEL
// ==========================================
const SparePartModel = {
  spareParts: [],
  filteredParts: [],
  brands: [],
  categories: [],
  currentPage: 1,
  pageSize: 8,
  searchQuery: "",
  isLoading: false,

  fetchSpareParts: async function () {
    this.isLoading = true;
    try {
      const response = await api.get("/spare-part");
      this.spareParts = response.data || [];
      this.applyFilter();
      return this.spareParts;
    } catch (error) {
      console.error("Error fetching spare parts:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  },

  fetchBrandsAndCategories: async function () {
    try {
      const [bRes, cRes] = await Promise.all([
        api.get("/brand").catch(() => ({ data: [] })),
        api.get("/category").catch(() => ({ data: [] }))
      ]);
      this.brands = bRes.data || [];
      this.categories = cRes.data || [];
    } catch (e) {
      console.warn("Could not fetch brands/categories:", e);
    }
  },

  getSparePartById: async function (id) {
    const response = await api.get(`/spare-part/${id}`);
    return response.data;
  },

  saveSparePart: async function (partData) {
    let response;
    if (partData.partID && this.spareParts.some(p => p.partID === partData.partID)) {
      response = await api.put("/spare-part", partData);
    } else {
      response = await api.post("/spare-part", partData);
    }
    await this.fetchSpareParts();
    return response;
  },

  deleteSparePart: async function (id) {
    const response = await api.delete(`/spare-part/${id}`);
    await this.fetchSpareParts();
    return response;
  },

  setSearchQuery: function (query) {
    this.searchQuery = query.toLowerCase().trim();
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter: function () {
    if (!this.searchQuery) {
      this.filteredParts = [...this.spareParts];
    } else {
      this.filteredParts = this.spareParts.filter(p => {
        const id = (p.partID || '').toLowerCase();
        const num = (p.partNum || '').toLowerCase();
        const name = (p.partName || '').toLowerCase();
        const brand = (p.brand?.brandName || '').toLowerCase();
        const cat = (p.category?.categoryName || '').toLowerCase();
        return id.includes(this.searchQuery) ||
               num.includes(this.searchQuery) ||
               name.includes(this.searchQuery) ||
               brand.includes(this.searchQuery) ||
               cat.includes(this.searchQuery);
      });
    }
  },

  getPaginatedData: function () {
    const totalItems = this.filteredParts.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const items = this.filteredParts.slice(start, end);

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
const SparePartView = {
  renderSkeleton: function ($container) {
    let rowsHtml = '';
    for (let i = 0; i < 5; i++) {
      rowsHtml += `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="px-6 py-4"><div class="h-4 w-16 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-24 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-36 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-20 skeleton"></div></td>
          <td class="px-6 py-4"><div class="h-4 w-20 skeleton"></div></td>
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <p class="text-base font-medium">No spare parts found</p>
              <p class="text-xs text-slate-400 mt-1">Try searching or add a new spare part item.</p>
            </div>
          </td>
        </tr>
      `);
      $paginationContainer.html('');
      return;
    }

    let rowsHtml = '';
    paginatedData.items.forEach(part => {
      const id = part.partID || 'N/A';
      const partNum = part.partNum || 'N/A';
      const name = part.partName || 'Unnamed Part';
      const cost = typeof part.costPrice === 'number' ? `$${part.costPrice.toFixed(2)}` : '$0.00';
      const sell = typeof part.sellPrice === 'number' ? `$${part.sellPrice.toFixed(2)}` : '$0.00';

      rowsHtml += `
        <tr class="table-row-fade border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td class="px-6 py-4 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">${id}</td>
          <td class="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-300 font-semibold">${partNum}</td>
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-white">${name}</td>
          <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">${cost}</td>
          <td class="px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">${sell}</td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="btn-view-part text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="View Part">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button class="btn-edit-part text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Edit Part">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </button>
            <button class="btn-delete-part text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-id="${id}" title="Delete Part">
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
        <button class="btn-part-page px-3 py-1.5 text-xs rounded-lg transition-all ${activeClass}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    $container.html(`
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Showing <span class="font-semibold text-slate-900 dark:text-white">${startItem}</span> to <span class="font-semibold text-slate-900 dark:text-white">${endItem}</span> of <span class="font-semibold text-slate-900 dark:text-white">${totalItems}</span> spare parts
        </span>
        <div class="flex items-center gap-1.5">
          <button class="btn-part-prev px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
          </button>
          ${pagesButtons}
          <button class="btn-part-next px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
            Next
          </button>
        </div>
      </div>
    `);
  },

  getFormModalHtml: function (part = null, brands = [], categories = [], nextId = '') {
    const isEdit = !!part;
    const id = part ? part.partID || '' : nextId;
    const partNum = part ? part.partNum || '' : '';
    const partName = part ? part.partName || '' : '';
    const costPrice = part ? part.costPrice || 0 : 0;
    const sellPrice = part ? part.sellPrice || 0 : 0;
    const selectedBrandId = part?.brand?.brandID || '';
    const selectedCatId = part?.category?.categoryId || '';

    const brandOptions = brands.map(b => `
      <option value="${b.brandID}" ${b.brandID === selectedBrandId ? 'selected' : ''}>
        ${b.brandName || b.brandID}
      </option>
    `).join('');

    const categoryOptions = categories.map(c => `
      <option value="${c.categoryId}" ${c.categoryId == selectedCatId ? 'selected' : ''}>
        ${c.categoryName || c.categoryId}
      </option>
    `).join('');

    const idFieldHtml = isEdit
      ? `<input type="text" id="part-id" value="${id}" readonly class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed text-sm focus:outline-none" />`
      : `<div class="flex items-center gap-2">
           <input type="text" id="part-id" value="${id}" readonly
             class="w-full px-3.5 py-2 rounded-xl border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono font-bold text-sm focus:outline-none cursor-default" />
           <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold whitespace-nowrap">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
             Auto
           </span>
         </div>`;

    return `
      <form id="part-form" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Part ID <span class="text-rose-500">*</span></label>
            ${idFieldHtml}
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Part Number <span class="text-rose-500">*</span></label>
            <input type="text" id="part-num" value="${partNum}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. PN-99482" required />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Part Name <span class="text-rose-500">*</span></label>
          <input type="text" id="part-name" value="${partName}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Brake Pad Front Set" required />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Cost Price ($) <span class="text-rose-500">*</span></label>
            <input type="number" step="0.01" id="part-cost" value="${costPrice}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="45.00" required />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Sell Price ($) <span class="text-rose-500">*</span></label>
            <input type="number" step="0.01" id="part-sell" value="${sellPrice}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="75.00" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Brand</label>
            <select id="part-brand" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">-- Choose Brand --</option>
              ${brandOptions}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Category</label>
            <select id="part-category" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">-- Choose Category --</option>
              ${categoryOptions}
            </select>
          </div>
        </div>
      </form>
    `;
  },

  getViewModalHtml: function (part) {
    const id = part.partID || 'N/A';
    const partNum = part.partNum || 'N/A';
    const name = part.partName || 'N/A';
    const cost = typeof part.costPrice === 'number' ? `$${part.costPrice.toFixed(2)}` : '$0.00';
    const sell = typeof part.sellPrice === 'number' ? `$${part.sellPrice.toFixed(2)}` : '$0.00';
    const brand = part.brand?.brandName || 'N/A';
    const category = part.category?.categoryName || 'N/A';

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
          <span class="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">${id}</span>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white mt-1">${name}</h4>
          <p class="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">Part #: ${partNum}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Cost Price</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">${cost}</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Sell Price</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">${sell}</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Brand</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${brand}</span>
          </div>
          <div class="p-3 rounded-lg border border-slate-100 dark:border-slate-700/60">
            <span class="text-xs text-slate-400 block mb-0.5">Category</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${category}</span>
          </div>
        </div>
      </div>
    `;
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const SparePartController = {
  $tableBody: null,
  $paginationContainer: null,
  $searchInput: null,

  init: function () {
    this.$tableBody = $("#sparepart-table-body");
    this.$paginationContainer = $("#sparepart-pagination");
    this.$searchInput = $("#sparepart-search-input");

    this.bindEvents();
    this.loadData();
  },

  bindEvents: function () {
    const self = this;

    if (this.$searchInput.length) {
      this.$searchInput.off("input").on("input", function () {
        SparePartModel.setSearchQuery($(this).val());
        self.updateView();
      });
    }

    $("#btn-add-sparepart").off("click").on("click", function () {
      self.openAddModal();
    });

    this.$tableBody.off("click").on("click", ".btn-view-part", function () {
      const id = $(this).data("id");
      self.openViewModal(id);
    });

    this.$tableBody.on("click", ".btn-edit-part", function () {
      const id = $(this).data("id");
      self.openEditModal(id);
    });

    this.$tableBody.on("click", ".btn-delete-part", function () {
      const id = $(this).data("id");
      self.handleDelete(id);
    });

    this.$paginationContainer.off("click").on("click", ".btn-part-page", function () {
      SparePartModel.currentPage = parseInt($(this).data("page"));
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-part-prev", function () {
      SparePartModel.currentPage--;
      self.updateView();
    });

    this.$paginationContainer.on("click", ".btn-part-next", function () {
      SparePartModel.currentPage++;
      self.updateView();
    });
  },

  loadData: async function () {
    SparePartView.renderSkeleton(this.$tableBody);
    try {
      await Promise.all([
        SparePartModel.fetchSpareParts(),
        SparePartModel.fetchBrandsAndCategories()
      ]);
      this.updateView();
    } catch (error) {
      Toast.error(error.message || "Failed to load spare parts.");
    }
  },

  updateView: function () {
    const paginatedData = SparePartModel.getPaginatedData();
    SparePartView.renderTable(paginatedData, this.$tableBody, this.$paginationContainer);
  },

  openAddModal: function () {
    const self = this;
    const nextId = IDGenerator.nextSparePartID(SparePartModel.spareParts);
    Modal.open({
      title: "Add Spare Part",
      contentHtml: SparePartView.getFormModalHtml(null, SparePartModel.brands, SparePartModel.categories, nextId),
      saveText: "Create Part",
      onSave: async function () {
        const partID = $("#part-id").val().trim();
        const partNum = $("#part-num").val().trim();
        const partName = $("#part-name").val().trim();
        const costPrice = parseFloat($("#part-cost").val()) || 0;
        const sellPrice = parseFloat($("#part-sell").val()) || 0;
        const brandId = $("#part-brand").val();
        const catId = $("#part-category").val();

        if (!partID || !partNum || !partName) {
          Toast.warning("Please fill in Part ID, Part Number, and Part Name.");
          return false;
        }

        const partData = {
          partID: partID,
          partNum: partNum,
          partName: partName,
          costPrice: costPrice,
          sellPrice: sellPrice,
          brand: brandId ? { brandID: brandId } : null,
          category: catId ? { categoryId: parseInt(catId) } : null
        };

        try {
          await SparePartModel.saveSparePart(partData);
          Toast.success("Spare part created successfully!");
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to save spare part.");
          return false;
        }
      }
    });
  },

  openEditModal: async function (id) {
    const self = this;
    try {
      const part = await SparePartModel.getSparePartById(id);
      Modal.open({
        title: `Edit Spare Part ${id}`,
        contentHtml: SparePartView.getFormModalHtml(part, SparePartModel.brands, SparePartModel.categories),
        saveText: "Update Part",
        onSave: async function () {
          const partNum = $("#part-num").val().trim();
          const partName = $("#part-name").val().trim();
          const costPrice = parseFloat($("#part-cost").val()) || 0;
          const sellPrice = parseFloat($("#part-sell").val()) || 0;
          const brandId = $("#part-brand").val();
          const catId = $("#part-category").val();

          const partData = {
            partID: id,
            partNum: partNum,
            partName: partName,
            costPrice: costPrice,
            sellPrice: sellPrice,
            brand: brandId ? { brandID: brandId } : part.brand,
            category: catId ? { categoryId: parseInt(catId) } : part.category
          };

          try {
            await SparePartModel.saveSparePart(partData);
            Toast.success("Spare part updated successfully!");
            self.updateView();
            return true;
          } catch (err) {
            Toast.error(err.message || "Failed to update spare part.");
            return false;
          }
        }
      });
    } catch (err) {
      Toast.error("Could not fetch spare part details.");
    }
  },

  openViewModal: async function (id) {
    try {
      const part = await SparePartModel.getSparePartById(id);
      Modal.open({
        title: "Spare Part Details",
        contentHtml: SparePartView.getViewModalHtml(part),
        saveText: "Close",
        saveBtnClass: "bg-slate-600 hover:bg-slate-700 text-white",
        onSave: async function () { return true; }
      });
    } catch (err) {
      Toast.error("Could not load spare part details.");
    }
  },

  handleDelete: function (id) {
    const self = this;
    Modal.confirm({
      title: "Delete Spare Part",
      message: `Are you sure you want to delete spare part <strong>${id}</strong>?`,
      confirmText: "Delete Part",
      onConfirm: async function () {
        try {
          await SparePartModel.deleteSparePart(id);
          Toast.success(`Spare part ${id} deleted successfully.`);
          self.updateView();
          return true;
        } catch (err) {
          Toast.error(err.message || "Failed to delete spare part.");
          return false;
        }
      }
    });
  }
};
