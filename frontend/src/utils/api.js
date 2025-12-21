// Helper function to get the API base URL
// Uses relative path which works with Nginx proxy for both HTTP and HTTPS
export function getApiBaseURL() {
  const hostname = window.location.hostname;
  
  // For localhost (development), use the backend port directly
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // For production, use relative path which is proxied by Nginx
  // This works for both HTTP and HTTPS automatically
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
    
    // For localhost (development), use the backend port directly
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:3001${photoUrl}`;
    }
    
    // For production, use relative path which is proxied by Nginx
    // This works for both HTTP and HTTPS automatically
    return photoUrl;
  }
  
  // Fallback: assume it's a relative path
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:3001${photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}`;
  }
  
  // For production, return as relative path (proxied by Nginx)
  return photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl;
}

