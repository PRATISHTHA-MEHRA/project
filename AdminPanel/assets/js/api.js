// assets/js/api.js

const API = (() => {

    // Change this only when deploying
    const BASE_URL = "http://localhost:5001/api";

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

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...getHeaders(!!options.body),
                ...(options.headers || {})
            }
        });

        let data;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                data?.error ||
                `Request failed (${response.status})`
            );
        }

        return data;
    }

    return {

        // GET
        get(endpoint) {
            return request(endpoint, {
                method: "GET"
            });
        },

        // POST
        post(endpoint, body) {
            return request(endpoint, {
                method: "POST",
                body: JSON.stringify(body)
            });
        },

        // PUT
        put(endpoint, body) {
            return request(endpoint, {
                method: "PUT",
                body: JSON.stringify(body)
            });
        },

        // PATCH
        patch(endpoint, body) {
            return request(endpoint, {
                method: "PATCH",
                body: JSON.stringify(body)
            });
        },

        // DELETE
        delete(endpoint) {
            return request(endpoint, {
                method: "DELETE"
            });
        }

    };

})();