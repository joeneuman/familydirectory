// Helper function to get the API base URL
// Detects if accessing from mobile/external device and uses full backend URL
export function getApiBaseURL() {
  const hostname = window.location.hostname;
  
  // If accessing via IP address (mobile device), use full backend URL
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Use the same hostname but backend port
    return `http://${hostname}:3001/api`;
  }
  
  // Otherwise use relative path (works with Vite proxy)
  return '/api';
}

