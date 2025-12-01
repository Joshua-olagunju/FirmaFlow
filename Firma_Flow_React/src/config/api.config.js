/**
 * API Configuration
 * Centralized configuration for API base URL
 * Reads from environment variables set in .env file
 */

// Get API base URL from environment variables
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE || "http://localhost/FirmaFlow";

// Helper function to build API endpoints
export const buildApiUrl = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

export default API_BASE_URL;
