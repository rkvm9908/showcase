export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const getToken = () => localStorage.getItem("token");
export const setToken = (t) =>
    t ? localStorage.setItem("token", t) : localStorage.removeItem("token");

export async function api(path, { method = "GET", body, form } = {}) {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let payload;
    if (form) payload = form; // FormData-ku Content-Type set pannaadheenga
    else if (body) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
    }

    const res = await fetch(`${API}/api${path}`, { method, headers, body: payload });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || "Something went wrong");
        err.status = res.status;
        throw err;
    }
    return data;
}