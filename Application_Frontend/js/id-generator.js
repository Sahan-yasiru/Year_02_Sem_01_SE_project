/**
 * ID Generator Utility
 * Auto-generates the next sequential ID for entities with manual string primary keys.
 * Format: PREFIX + zero-padded number  e.g.  C001, SUP003, SP012
 */
const IDGenerator = {

  /**
   * Parse the numeric suffix from an ID string.
   * Works for any prefix length:  "C001" → 1,  "SUP003" → 3,  "INV012" → 12
   */
  _extractNum: function (id, prefix) {
    if (!id || !id.startsWith(prefix)) return 0;
    const num = parseInt(id.slice(prefix.length), 10);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Given a list of existing IDs, prefix, and zero-pad width, return the next ID.
   * @param {string[]} existingIds  - array of current IDs from the API
   * @param {string}   prefix       - e.g. "C", "SUP", "SP", "INV", "ORD"
   * @param {number}   padWidth     - total digits  e.g. 3 → "001"
   */
  next: function (existingIds, prefix, padWidth = 3) {
    const self = this;
    const max = existingIds.reduce((acc, id) => {
      const n = self._extractNum(id, prefix);
      return n > acc ? n : acc;
    }, 0);
    const nextNum = max + 1;
    return prefix + String(nextNum).padStart(padWidth, '0');
  },

  // ── Convenience helpers per entity ──────────────────────────────────────

  /** Customer: C001, C002 … */
  nextCustomerID: function (customers) {
    const ids = (customers || []).map(c => c.customerID || '');
    return this.next(ids, 'C', 3);
  },

  /** Supplier: SUP001, SUP002 … */
  nextSupplierID: function (suppliers) {
    const ids = (suppliers || []).map(s => s.supplierID || s.SupplierID || '');
    return this.next(ids, 'SUP', 3);
  },

  /** Spare Part: SP001, SP002 … */
  nextSparePartID: function (spareParts) {
    const ids = (spareParts || []).map(p => p.partID || '');
    return this.next(ids, 'SP', 3);
  },

  /** Inventory: INV001, INV002 … */
  nextInventoryID: function (inventories) {
    const ids = (inventories || []).map(i => i.inventory_id || i.inventoryId || '');
    return this.next(ids, 'INV', 3);
  },

  /** Order: ORD001, ORD002 … */
  nextOrderID: function (orders) {
    const ids = (orders || []).map(o => o.orderId || o.orderID || '');
    return this.next(ids, 'ORD', 3);
  },

  /** Brand: B001, B002 … */
  nextBrandID: function (brands) {
    const ids = (brands || []).map(b => b.brandID || '');
    return this.next(ids, 'B', 3);
  }
};
