// assets/js/api.js

const API = (() => {

    // Change this only when deploying
     const BASE_URL = "http://localhost:5001/api/admin";
// const BASE_URL = "https://api-bright-path.algodev.in/api/admin";
    function getToken() {
        return localStorage.getItem("JWT_TOKEN");
    }

    function getHeaders(hasBody = false) {
        const headers = {};

        if (hasBody) {
            headers["Content-Type"] = "application/json";
        }

        const token = getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        return headers;
    }

    async function request(endpoint, options = {}) {
        let response;
        try {
            response = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    ...getHeaders(!!options.body),
                    ...(options.headers || {})
                }
            });
        } catch (networkErr) {
            throw new Error("Unable to connect to the server. Please check your network connection.");
        }

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const errorMessage = 
                data?.message || 
                data?.error || 
                (response.status === 401 ? "Unauthorized access. Please log in again." :
                 response.status === 404 ? "Requested resource not found." :
                 `Request failed with status ${response.status}`);

            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    return {
        // Core HTTP Methods
        get(endpoint) {
            return request(endpoint, { method: "GET" });
        },
        post(endpoint, body) {
            return request(endpoint, { method: "POST", body: JSON.stringify(body) });
        },
        put(endpoint, body) {
            return request(endpoint, { method: "PUT", body: JSON.stringify(body) });
        },
        patch(endpoint, body) {
            return request(endpoint, { method: "PATCH", body: JSON.stringify(body) });
        },
        delete(endpoint) {
            return request(endpoint, { method: "DELETE" });
        },

        // API Endpoint Modules
        students: {
            getById(id) {
                if (!id) return Promise.reject(new Error("Student ID is required."));
                return request(`/students/${encodeURIComponent(id)}`);
            },
            getAll(params = {}) {
                const query = new URLSearchParams(params).toString();
                return request(`/students${query ? `?${query}` : ''}`);
            },
            getFees(id) {
                return request(`/students/${encodeURIComponent(id)}/fees`);
            },
            getAttendance(id) {
                return request(`/students/${encodeURIComponent(id)}/attendance`);
            },
            getExams(id) {
                return request(`/students/${encodeURIComponent(id)}/exams`);
            }
        },

        admissions: {
      getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        return request(`/admissions${query ? `?${query}` : ''}`);
      },
      getById(id) {
        if (!id) return Promise.reject(new APIError("Admission ID is required.", 400));
        return request(`/admissions/${encodeURIComponent(id)}`);
      },
      create(payload) {
        return request('/admissions', { method: 'POST', body: JSON.stringify(payload) });
      }
    },
    };
})();