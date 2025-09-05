/**
 * Helper function to construct absolute API URLs regardless of environment
 * @param {string} path - The API path (e.g., '/api/reports')
 * @returns {string} - The full API URL
 */
export function getApiUrl(path) {
  // Make sure the path starts with a slash
  const normPath = path.startsWith('/') ? path : `/${path}`;
  
  // In browser environment
  if (typeof window !== 'undefined') {
    return normPath;
  }
  
  // In server environment, we need to construct the full URL
  const baseUrl = 
    process.env.NEXT_PUBLIC_API_URL || // Use explicitly set API URL if available
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || // Use Vercel URL if deployed
    process.env.NEXT_PUBLIC_SITE_URL || // Fallback to site URL
    'http://localhost:3000'; // Local development fallback
    
  return `${baseUrl}${normPath}`;
}
