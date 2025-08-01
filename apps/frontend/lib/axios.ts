import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// Axios response interceptor for refresh token with infinite loop prevention
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        // Prevent refresh loop for /users/refresh-token endpoint
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/users/refresh-token")
        ) {
            originalRequest._retry = true;
            try {
                await api.post("/users/refresh-token");
                return api(originalRequest);
            } catch (refreshError) {
                const path = typeof window !== "undefined" ? window.location.pathname : "";
                if (
                    path !== "/user/login" &&
                    path !== "/user/signup"
                ) {
                    sessionStorage.setItem("authError", "Session expired. Please log in again.");
                    window.location.href = "/user/login";
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
export default api;