/**
 * Main Application Coordinator & Routing Controller
 */
const AppController = {
  activeView: "dashboard",
  pollingInterval: null,

  init: function () {
    this.initTheme();
    this.initSidebar();
    this.initRouter();
    this.startAutoPolling();
  },

  initTheme: function () {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
      $("#theme-toggle-dark-icon").addClass("hidden");
      $("#theme-toggle-light-icon").removeClass("hidden");
    } else {
      document.documentElement.classList.remove("dark");
      $("#theme-toggle-dark-icon").removeClass("hidden");
      $("#theme-toggle-light-icon").addClass("hidden");
    }

    $("#btn-theme-toggle").off("click").on("click", function () {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");

      if (isDark) {
        $("#theme-toggle-dark-icon").addClass("hidden");
        $("#theme-toggle-light-icon").removeClass("hidden");
        Toast.info("Switched to Dark Mode 🌙", 2000);
      } else {
        $("#theme-toggle-dark-icon").removeClass("hidden");
        $("#theme-toggle-light-icon").addClass("hidden");
        Toast.info("Switched to Light Mode ☀️", 2000);
      }
    });
  },

  initSidebar: function () {
    const $sidebar = $("#sidebar");

    $("#btn-toggle-sidebar").off("click").on("click", function () {
      $sidebar.toggleClass("collapsed");
      const isCollapsed = $sidebar.hasClass("collapsed");
      localStorage.setItem("sidebarCollapsed", isCollapsed ? "true" : "false");
    });

    if (localStorage.getItem("sidebarCollapsed") === "true") {
      $sidebar.addClass("collapsed");
    }

    // Mobile drawer toggle
    $("#btn-mobile-menu").off("click").on("click", function () {
      $sidebar.toggleClass("-translate-x-full");
    });
  },

  initRouter: function () {
    const self = this;

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").trim() || "dashboard";
      self.navigateTo(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
  },

  navigateTo: function (viewName) {
    const validViews = ["dashboard", "customers", "orders", "spare-parts", "inventory", "suppliers", "brands", "categories", "users", "reports", "settings"];
    if (!validViews.includes(viewName)) {
      viewName = "dashboard";
    }

    this.activeView = viewName;

    // Update active state in sidebar nav
    $(".nav-item").removeClass("active");
    $(`.nav-item[data-view="${viewName}"]`).addClass("active");

    // Hide all view panels, show target view panel
    $(".view-panel").addClass("hidden");
    const $targetPanel = $(`#view-${viewName}`);
    if ($targetPanel.length) {
      $targetPanel.removeClass("hidden");
    }

    // Dispatch Controller init for target view
    switch (viewName) {
      case "dashboard":
        DashboardController.init();
        break;
      case "customers":
        CustomerController.init();
        break;
      case "orders":
        OrderController.init();
        break;
      case "spare-parts":
        SparePartController.init();
        break;
      case "inventory":
        InventoryController.init();
        break;
      case "suppliers":
        SupplierController.init();
        break;
      case "brands":
        BrandController.init();
        break;
      case "categories":
        CategoryController.init();
        break;
      case "users":
        UserController.init();
        break;
      case "reports":
        ReportsController.init();
        break;
      default:
        break;
    }

    // Auto-close mobile drawer if open
    if ($(window).width() < 1024) {
      $("#sidebar").addClass("-translate-x-full");
    }
  },

  startAutoPolling: function () {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Background auto-refresh data every 15 seconds without full page reload
    this.pollingInterval = setInterval(() => {
      if (this.activeView === "dashboard") {
        DashboardController.loadData();
      } else if (this.activeView === "customers") {
        CustomerModel.fetchCustomers().then(() => CustomerController.updateView()).catch(() => {});
      } else if (this.activeView === "orders") {
        OrderModel.fetchOrders().then(() => OrderController.updateView()).catch(() => {});
      } else if (this.activeView === "spare-parts") {
        SparePartModel.fetchSpareParts().then(() => SparePartController.updateView()).catch(() => {});
      } else if (this.activeView === "inventory") {
        InventoryModel.fetchInventory().then(() => InventoryController.updateView()).catch(() => {});
      } else if (this.activeView === "suppliers") {
        SupplierModel.fetchSuppliers().then(() => SupplierController.updateView()).catch(() => {});
      } else if (this.activeView === "brands") {
        BrandModel.fetchBrands().then(() => BrandController.updateView()).catch(() => {});
      } else if (this.activeView === "categories") {
        CategoryModel.fetchCategories().then(() => CategoryController.updateView()).catch(() => {});
      } else if (this.activeView === "users") {
        UserModel.fetchUsers().then(() => UserController.updateView()).catch(() => {});
      }
    }, 15000);
  }
};

$(document).ready(function () {
  AppController.init();
});
