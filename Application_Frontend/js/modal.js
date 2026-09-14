/**
 * Modal & Confirmation Dialog Utility (MVC Shared View Helper)
 */
const Modal = {
  container: null,

  init: function () {
    if (!this.container) {
      this.container = document.getElementById("global-modal-container");
      if (!this.container) {
        this.container = document.createElement("div");
        this.container.id = "global-modal-container";
        this.container.className = "fixed inset-0 z-50 flex items-center justify-center hidden bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto";
        document.body.appendChild(this.container);
      }
    }
  },

  open: function ({ title, contentHtml, onSave, saveText = "Save Changes", saveBtnClass = "bg-blue-600 hover:bg-blue-700 text-white" }) {
    this.init();

    this.container.innerHTML = `
      <div class="modal-panel-enter bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden transform transition-all my-8">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${title}</h3>
          <button id="modal-close-x" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="px-6 py-5 max-h-[70vh] overflow-y-auto">
          ${contentHtml}
        </div>

        <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/60">
          <button id="modal-cancel-btn" type="button" class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            Cancel
          </button>
          <button id="modal-submit-btn" type="button" class="px-5 py-2 text-sm font-medium rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${saveBtnClass}">
            <span id="modal-submit-text">${saveText}</span>
            <span id="modal-submit-spinner" class="hidden">
              <svg class="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          </button>
        </div>
      </div>
    `;

    this.container.classList.remove("hidden");

    const close = () => this.close();
    document.getElementById("modal-close-x").onclick = close;
    document.getElementById("modal-cancel-btn").onclick = close;

    const submitBtn = document.getElementById("modal-submit-btn");
    submitBtn.onclick = async () => {
      const submitText = document.getElementById("modal-submit-text");
      const submitSpinner = document.getElementById("modal-submit-spinner");

      try {
        submitBtn.disabled = true;
        submitText.classList.add("opacity-50");
        submitSpinner.classList.remove("hidden");

        const result = await onSave();
        if (result !== false) {
          this.close();
        }
      } catch (err) {
        console.error("Modal save error:", err);
      } finally {
        submitBtn.disabled = false;
        submitText.classList.remove("opacity-50");
        submitSpinner.classList.add("hidden");
      }
    };
  },

  confirm: function ({ title = "Are you sure?", message = "This action cannot be undone.", confirmText = "Delete", onConfirm }) {
    this.open({
      title: title,
      contentHtml: `
        <div class="flex items-start gap-4">
          <div class="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex-shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm text-slate-600 dark:text-slate-300 mt-1">${message}</p>
          </div>
        </div>
      `,
      saveText: confirmText,
      saveBtnClass: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20",
      onSave: onConfirm
    });
  },

  close: function () {
    if (this.container) {
      this.container.classList.add("hidden");
      this.container.innerHTML = "";
    }
  }
};
