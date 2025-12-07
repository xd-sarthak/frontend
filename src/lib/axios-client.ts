import { CustomError } from "@/types/custom-error.type";
import axios from "axios";

// Get base URL from environment variable with fallback
// In production, VITE_API_BASE_URL must be set in Vercel environment variables
// Example: https://task-manager-l2ug.onrender.com/api
const getBaseURL = (): string => {
  const envURL = import.meta.env.VITE_API_BASE_URL;
  
  // If environment variable is set, validate and use it
  if (envURL) {
    const trimmedURL = envURL.trim();
    
    // Ensure it has a protocol
    if (trimmedURL.startsWith('http://') || trimmedURL.startsWith('https://')) {
      // Remove trailing slash if present
      return trimmedURL.replace(/\/$/, '');
    }
    
    // If no protocol, assume https in production, http in development
    const protocol = import.meta.env.PROD ? 'https://' : 'http://';
    return `${protocol}${trimmedURL}`.replace(/\/$/, '');
  }
  
  // Fallback based on environment
  if (import.meta.env.PROD) {
    // In production, VITE_API_BASE_URL must be set
    // This is a critical error - log it clearly
    console.error(
      '❌ VITE_API_BASE_URL is not set in production environment!\n' +
      'Please set it in your Vercel project settings:\n' +
      'Settings → Environment Variables → Add VITE_API_BASE_URL\n' +
      'Example value: https://task-manager-l2ug.onrender.com/api'
    );
    
    // Try to use relative URLs as last resort (won't work for cross-origin)
    // This will likely fail, but at least the app won't crash immediately
    return '';
  }
  
  // Development fallback
  return 'http://localhost:4000/api';
};

const baseURL = getBaseURL();

// Log the base URL being used (helpful for debugging)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', baseURL || '(relative URLs)');
}

const options = {
  baseURL: baseURL || undefined, // axios accepts undefined for relative URLs
  withCredentials: true,
  timeout: 10000,
};

const API = axios.create(options);

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle network errors (e.g., CORS, connection refused, invalid URL)
    if (!error.response) {
      console.error('Network error:', error.message);
      const customError: CustomError = {
        ...error,
        message: error.message || 'Network error. Please check your API configuration.',
        errorCode: 'NETWORK_ERROR',
      };
      return Promise.reject(customError);
    }

    const { data, status } = error.response;

    if (data === "Unauthorized" && status === 401) {
      window.location.href = "/";
    }

    const customError: CustomError = {
      ...error,
      errorCode: data?.errorCode || "UNKNOWN_ERROR",
    };

    return Promise.reject(customError);
  }
);

export default API;
