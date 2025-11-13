import { API_BASE } from "../config/config.js";

async function request(method, path, body) {
    const options = { method, headers: {} };

    if (body !== undefined && body !== null) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    if (!response.ok) {
        let message = `Yêu cầu thất bại (${response.status})`;
        try {
            const data = await response.json();
            if (data && typeof data === "object") {
                message = data.message || JSON.stringify(data);
            }
        } catch (jsonError) {
            try {
                const text = await response.text();
                if (text) {
                    message = text;
                }
            } catch (textError) {
                /* noop */
            }
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
}

export function fetchTransactions(userid) {
    return request("GET", `/api/transactions/${userid}`);
}

export function createTransaction(payload) {
    return request("POST", "/api/transactions", payload);
}

export function updateTransaction(id, payload) {
    return request("PUT", `/api/transactions/${id}`, payload);
}

export function deleteTransaction(id) {
    return request("DELETE", `/api/transactions/${id}`);
}

export const transactionApi = {
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
};

export default transactionApi;