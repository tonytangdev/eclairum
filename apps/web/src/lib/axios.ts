import axios from "axios";

/**
 * Preconfigured axios instance for making API requests
 * Uses SERVER_API_URL from environment variables as the base URL
 */
const apiClient = axios.create({
  baseURL: process.env.SERVER_API_URL,
});

export default apiClient;
