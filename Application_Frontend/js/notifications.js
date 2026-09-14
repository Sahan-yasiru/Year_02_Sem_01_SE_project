/**
 * Toast Notification Utility
 */
const Toast = {
  container: null,

  init: function () {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.className = "fixed bottom-5 right-5 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-4";
      document.body.appendChild(this.container);
    }
  },

  show: function (type, message, duration = 4000) {
    this.init();

    const toast = document.createElement("div");
    toast.className = "toast-enter pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all";

    let bgBorderIconClass = "";
    let iconSvg = "";

    switch (type) {
      case "success":
        bgBorderIconClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
        iconSvg = `<svg class="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        break;
      case "error":
        bgBorderIconClass = "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300";
        iconSvg = `<svg class="w-5 h-5 text-rose-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        break;
      case "warning":
        bgBorderIconClass = "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
        iconSvg = `<svg class="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
        break;
      default: // info
        bgBorderIconClass = "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300";
        iconSvg = `<svg class="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.className += " " + bgBorderIconClass;

    toast.innerHTML = `
      <div class="flex items-center">
        ${iconSvg}
        <span class="text-sm font-medium leading-snug">${message}</span>
      </div>
      <button class="ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none close-btn">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    `;

    const closeBtn = toast.querySelector(".close-btn");
    closeBtn.addEventListener("click", () => this.dismiss(toast));

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  },

  dismiss: function (toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove("toast-enter");
    toast.classList.add("toast-exit");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 350);
  },

  success: function (message, duration) {
    this.show("success", message, duration);
  },

  error: function (message, duration) {
    this.show("error", message, duration);
  },

  warning: function (message, duration) {
    this.show("warning", message, duration);
  },

  info: function (message, duration) {
    this.show("info", message, duration);
  }
};
