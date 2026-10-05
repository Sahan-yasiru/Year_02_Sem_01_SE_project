const CUSTOMER_API_BASE_URL = "http://localhost:8080/api";

const customerApi = {

  async get(endpoint) {

    const response = await fetch(`${CUSTOMER_API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const result = await response.json();

    // Supports both:
    // [ ... ]
    // { data: [ ... ] }
    return result?.data ?? result;
  }

};
