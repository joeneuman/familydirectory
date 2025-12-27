import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Global error handler for unhandled errors
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info);
  
  // Store error details for the error view
  const errorInfo = {
    message: err.message || 'An unexpected error occurred',
    stack: err.stack,
    name: err.name,
    info: info,
    component: instance?.$options?.name || 'Unknown',
  };
  
  localStorage.setItem('last_error', JSON.stringify(errorInfo));
  
  // Navigate to error page
  router.push('/error');
};

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Store error details
  const errorInfo = {
    message: event.reason?.message || 'An unexpected error occurred',
    stack: event.reason?.stack,
    name: event.reason?.name || 'PromiseRejection',
    reason: event.reason,
  };
  
  localStorage.setItem('last_error', JSON.stringify(errorInfo));
  
  // Navigate to error page
  router.push('/error');
  
  // Prevent default browser error handling
  event.preventDefault();
});

// Handle global window errors (for testing)
window.addEventListener('error', (event) => {
  // Only handle errors that aren't already handled by Vue
  if (event.error && !event.error._handled) {
    console.error('Global window error:', event.error);
    
    // Mark as handled to prevent duplicate handling
    event.error._handled = true;
    
    // Store error details
    const errorInfo = {
      message: event.error.message || event.message || 'An unexpected error occurred',
      stack: event.error.stack,
      name: event.error.name || 'Error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    };
    
    localStorage.setItem('last_error', JSON.stringify(errorInfo));
    
    // Navigate to error page
    router.push('/error');
  }
});

// Add a test function to window for easy error triggering (available in all environments)
window.triggerTestError = function(message = 'Test error for error handling') {
  const error = new Error(message);
  error.name = 'TestError';
  // Store error and redirect
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };
  localStorage.setItem('last_error', JSON.stringify(errorInfo));
  router.push('/error');
};

app.mount('#app');

