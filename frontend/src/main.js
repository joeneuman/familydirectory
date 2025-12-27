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

app.mount('#app');

