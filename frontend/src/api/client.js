import axios from 'axios';

// Default API base URL (Vite proxy forwards /api to backend if running)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Checks if the FastAPI backend is currently running and reachable.
 */
export async function checkBackendHealth() {
  try {
    const res = await apiClient.get('/health', { timeout: 1500 });
    return res.status === 200;
  } catch {
    return false;
  }
}
