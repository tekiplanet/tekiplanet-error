import axios from 'axios';

// Export the apiClient instance
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// We should use the same instance for all requests
export const axiosInstance = apiClient;

// Add request interceptor to handle authentication and logging
apiClient.interceptors.request.use((config) => {
    // Log request details
    console.log('Request Config:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        withCredentials: config.withCredentials
    });

    // Add token to request if it exists
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Add response interceptor to handle responses and errors
apiClient.interceptors.response.use(
    (response) => {
        console.log('Response Data:', response.data);
        return response;
    },
    (error) => {
        console.error('API Error:', error);

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(new Error('Session expired. Please login again.'));
        }

        return Promise.reject(error);
    }
);
