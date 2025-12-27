import axios from 'axios';
import { FrappeConfig, FrappeUser } from '../types';

export const CONFIG: FrappeConfig = {
  baseUrl: 'https://api.shagarh.com',
};

// Initialize Axios instance with credentials support (Cookies)
const api = axios.create({
  baseURL: CONFIG.baseUrl,
  withCredentials: true, // This ensures the browser sends the 'sid' cookie automatically
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Simulates the Frappe `call` method.
 * Supports GET to avoid CSRF token requirements for read-only data.
 */
export const frappeCall = async (method: string, args: any = {}, verb: 'GET' | 'POST' = 'POST') => {
  try {
    const config: any = {
      method: verb,
      url: `/api/method/${method}`,
    };

    if (verb === 'GET') {
      const params = new URLSearchParams();
      Object.entries(args).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });
      config.params = params;
    } else {
      config.data = args;
    }

    const response = await api(config);
    return response.data.message;
  } catch (error: any) {
    const errorData = error.response?.data || {};
    
    if (errorData._server_messages) {
      try {
        const messages = JSON.parse(errorData._server_messages);
        const text = messages.map((m: any) => JSON.parse(m).message).join(', ');
        if (text) throw new Error(text);
      } catch (e) {
        // Fallback
      }
    }

    const message = errorData.message || errorData.exception || error.message || "Request failed";
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
};

export const frappeLogin = async (usr: string, pwd: string) => {
  try {
    // The server will set the 'sid' cookie in the response. 
    // Because we used `withCredentials: true`, the browser saves it.
    const response = await api.post('/api/method/login', { usr, pwd });
    return response.data;
  } catch (error: any) {
    const json = error.response?.data || {};
    throw new Error(json.message || "Login failed");
  }
};

export const frappeLogout = async () => {
  try {
    await api.post('/api/method/logout');
  } catch (e) {
    console.warn("Logout failed", e);
  }
};

export const frappeSignup = async (email: string, fullName: string) => {
    return frappeCall('frappe.core.doctype.user.user.sign_up', {
        email: email,
        full_name: fullName,
        redirect_to: window.location.origin
    });
};

/**
 * Generic Fetcher for List
 */
export const fetchList = async (doctype: string, fields: string[] = ["*"], filters: any = {}, limit_start = 0, limit_page_length = 20) => {
  const params = new URLSearchParams({
    fields: JSON.stringify(fields),
    filters: JSON.stringify(filters),
    limit_start: limit_start.toString(),
    limit_page_length: limit_page_length.toString(),
  });

  try {
    const response = await api.get(`/api/resource/${encodeURIComponent(doctype)}`, { params });
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 403) throw new Error("Permission Denied");
    if (error.response?.status === 401) throw new Error("Unauthorized");
    throw new Error(error.response?.data?.exception || "Failed to fetch list");
  }
};

/**
 * Generic Fetcher for Document
 */
export const fetchDoc = async (doctype: string, name: string) => {
  try {
    const response = await api.get(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 403) throw new Error("Permission Denied");
    if (error.response?.status === 404) throw new Error("Document not found");
    throw new Error("Failed to fetch document");
  }
};

/**
 * Generic Saver (POST/PUT)
 */
export const saveDoc = async (doctype: string, doc: any) => {
  const isNew = !doc.name; 
  const url = isNew 
    ? `/api/resource/${encodeURIComponent(doctype)}`
    : `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(doc.name)}`;
    
  const method = isNew ? 'POST' : 'PUT';

  try {
    const response = await api.request({
      url,
      method,
      data: doc
    });
    return response.data.data;
  } catch (error: any) {
    const errorData = error.response?.data || {};
    throw new Error(errorData.exception || errorData.message || "Failed to save");
  }
};

/**
 * Fetch Metadata
 */
export const fetchMeta = async (doctype: string) => {
    try {
        const res = await frappeCall('hrms.api.get_doctype_fields', { doctype }, 'GET');
        if (Array.isArray(res)) {
             return { name: doctype, fields: res };
        }
        return res;
    } catch (e) {
        console.warn(`Remote metadata fetch failed for ${doctype}.`, e);
        return null;
    }
};
