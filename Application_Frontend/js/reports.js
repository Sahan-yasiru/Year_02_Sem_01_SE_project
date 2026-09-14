/**
 * Reports & Analytics Module - Model-View-Controller (MVC) Implementation
 */

// ==========================================
// 1. MODEL
// ==========================================
const ReportsModel = {
  summary: {
    totalRevenue: 0,
    inventoryValue: 0,
    totalOrders: 0,
    deliveredRate: "0%"
  },

  fetchReportsData: async function () {
    try {
      const [oRes, pRes, iRes] = await Promise.all([
        api.get("/orders").catch(() => ({ data: [] })),
        api.get("/spare-part").catch(() => ({ data: [] })),
        api.get("/inventory").catch(() => ({ data: [] }))
      ]);

      const orders = oRes.data || [];
      const spareParts = pRes.data || [];
      const inventory = iRes.data || [];

      let totalRevenue = 0;
      let deliveredOrders = 0;
      orders.forEach(o => {
        if (o.orderStatus === "DELIVERED" || o.orderStatus === "CONFIRMED") {
          totalRevenue += (o.totalPrice || 0);
        }
        if (o.orderStatus === "DELIVERED") {
          deliveredOrders++;
        }
      });

      let inventoryValue = 0;
      inventory.forEach(inv => {
        const qty = inv.quantity_on_hand || 0;
        const price = inv.part?.sellPrice || inv.part?.costPrice || 0;
        inventoryValue += (qty * price);
      });

      const deliveredRate = orders.length > 0 ? `${Math.round((deliveredOrders / orders.length) * 100)}%` : "0%";

      this.summary = {
        totalRevenue,
        inventoryValue,
        totalOrders: orders.length,
        deliveredRate
      };

      return this.summary;
    } catch (err) {
      console.error("Reports fetch error:", err);
      throw err;
    }
  }
};

// ==========================================
// 2. VIEW
// ==========================================
const ReportsView = {
  renderSummary: function (summary) {
    $("#report-total-revenue").text(`$${summary.totalRevenue.toFixed(2)}`);
    $("#report-inventory-val").text(`$${summary.inventoryValue.toFixed(2)}`);
    $("#report-total-orders").text(summary.totalOrders);
    $("#report-delivery-rate").text(summary.deliveredRate);
  }
};

// ==========================================
// 3. CONTROLLER
// ==========================================
const ReportsController = {
  init: function () {
    this.loadData();
  },

  loadData: async function () {
    try {
      const summary = await ReportsModel.fetchReportsData();
      ReportsView.renderSummary(summary);
    } catch (err) {
      console.warn("Could not load reports data:", err);
    }
  }
};
