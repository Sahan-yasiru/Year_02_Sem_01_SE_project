/**
 * Central API Configuration & Request Utility
 */
const API_BASE_URL = "http://localhost:8080/api";

const api = {
  /**
   * Generic Request Method
   */
  request: function (options) {
    const url = options.url.startsWith("http") ? options.url : `${API_BASE_URL}${options.url}`;
    
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        type: options.method || "GET",
        contentType: "application/json",
        dataType: "json",
        data: options.data ? JSON.stringify(options.data) : null,
        timeout: options.timeout || 15000,
        headers: options.headers || {},
        success: function (response) {
          // Spring Boot backend returns APIResponse { status, message, data }
          if (response && response.status !== undefined) {
            if (response.status >= 200 && response.status < 300) {
              resolve(response);
            } else {
              reject(new Error(response.message || "API error occurred"));
            }
          } else {
            resolve({ status: 200, message: "Success", data: response });
          }
        },
        error: function (xhr, status, error) {
          let errorMessage = "An unexpected error occurred.";
          
          if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
          } else if (xhr.responseText) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              if (parsed.message) errorMessage = parsed.message;
            } catch (e) {
              // fallback
            }
          } else if (status === "timeout") {
            errorMessage = "Request timed out. Please check server connectivity.";
          } else if (xhr.status === 0) {
            errorMessage = "Unable to connect to Spring Boot server at " + API_BASE_URL;
          } else if (xhr.status === 404) {
            errorMessage = "Resource not found (404).";
          } else if (xhr.status === 400) {
            errorMessage = "Bad request (400). Please check your form input.";
          } else if (xhr.status === 500) {
            errorMessage = "Internal server error (500).";
          }

          reject({
            status: xhr.status,
            message: errorMessage,
            xhr: xhr,
            error: error
          });
        }
      });
    });
  },

  get: function (url, params) {
    let query = "";
    if (params) {
      query = "?" + $.param(params);
    }
    return this.request({ method: "GET", url: url + query });
  },

  post: function (url, data) {
    return this.request({ method: "POST", url: url, data: data });
  },

  put: function (url, data) {
    return this.request({ method: "PUT", url: url, data: data });
  },

  delete: function (url) {
    return this.request({ method: "DELETE", url: url });
  }
};
