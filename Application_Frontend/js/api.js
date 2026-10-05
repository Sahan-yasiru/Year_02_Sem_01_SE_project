/**
 * api.js — Centralized API utility
 * All backend communication goes through this module.
 */

const API_BASE = 'http://localhost:8080/api';

/**
 * Parses the standard APIResponse wrapper from the backend.
 * Backend format: { status, message, data }
 * Throws an error with the backend message on non-200 HTTP or non-200 status.
 */
async function handleResponse(res) {
    let body;
    try {
        body = await res.json();
    } catch {
        throw new Error('Invalid response from server');
    }

    if (!res.ok) {
        // Use backend message if available, otherwise use HTTP status text
        throw new Error(body?.message || res.statusText || 'Server error');
    }

    if (body && typeof body === 'object' && body.status && body.status >= 400) {
        throw new Error(body.message || `Server returned error status ${body.status}`);
    }

    return body; // { status, message, data }
}

function extractData(body) {
    if (body === null || body === undefined) return body;
    if (typeof body === 'object' && 'data' in body) {
        return body.data;
    }
    return body;
}

async function sendMultipart(method, endpoint, formData) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        body: formData
    });
    const body = await handleResponse(res);
    return extractData(body);
}

const api = {
    /**
     * GET request
     * @param {string} endpoint — e.g. '/customer'
     * @returns {Promise<any>}
     */
    get: async function (endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const body = await handleResponse(res);
        return extractData(body);
    },

    /**
     * POST request
     * @param {string} endpoint
     * @param {object} payload — JS object (will be JSON.stringify'd)
     * @returns {Promise<any>}
     */
    post: async function (endpoint, payload) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const body = await handleResponse(res);
        return extractData(body);
    },

    /**
     * PUT request
     * @param {string} endpoint
     * @param {object} payload
     * @returns {Promise<any>}
     */
    put: async function (endpoint, payload) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const body = await handleResponse(res);
        return extractData(body);
    },

    postMultipart: async function (endpoint, formData) {
        return sendMultipart('POST', endpoint, formData);
    },

    putMultipart: async function (endpoint, formData) {
        return sendMultipart('PUT', endpoint, formData);
    },

    /**
     * DELETE request
     * @param {string} endpoint — e.g. '/customer/C001'
     * @returns {Promise<any>}
     */
    delete: async function (endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        const body = await handleResponse(res);
        return extractData(body);
    }
};
