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

// Helper function to get a random cute animal image
// Uses person ID to ensure consistent image for same person
export function getRandomAnimalImage(personId) {
  // List of cute animals
  const animals = [
    '🐱', '🐶', '🐰', '🐻', '🐼', '🐨', '🦊', '🐯', '🦁', '🐷',
    '🐸', '🐵', '🐧', '🐦', '🦆', '🦉', '🐺', '🐹', '🐭', '🦄'
  ];
  
  // Use person ID to get consistent animal for same person
  if (personId) {
    // Convert person ID to a number for consistent selection
    const hash = personId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const index = Math.abs(hash) % animals.length;
    // Use a service that provides animal images
    // Using DiceBear's avataaars with seed for consistency
    const seed = personId.replace(/-/g, '');
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }
  
  // Fallback: random animal emoji (but we'll use avataaars for actual images)
  const randomSeed = Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
}

// Helper function to get the photo URL
// Converts relative paths (/uploads/...) to full backend URLs
// Returns a random cute animal image if photoUrl is null/empty
export function getPhotoURL(photoUrl, personId = null) {
  // If no photo URL, return a random cute animal image
  if (!photoUrl) {
    return getRandomAnimalImage(personId);
  }
  
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

