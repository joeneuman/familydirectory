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

// Helper function to get the photo URL
// Converts relative paths (/uploads/...) to full backend URLs
export function getPhotoURL(photoUrl) {
  if (!photoUrl) return null;
  
  // If it's already a full URL (http/https), return as-is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // If it's a relative path starting with /uploads/, convert to backend URL
  if (photoUrl.startsWith('/uploads/')) {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Always use the backend port (3001) for uploads
    // For localhost, use localhost:3001
    // For IP addresses, use the same hostname with port 3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:3001${photoUrl}`;
    }
    
    // For IP addresses (mobile/external access)
    return `http://${hostname}:3001${photoUrl}`;
  }
  
  // Fallback: assume it's a relative path, try to convert it
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:3001${photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}`;
  }
  return `http://${hostname}:3001${photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}`;
}

