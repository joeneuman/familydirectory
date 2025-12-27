<template>
  <div class="min-h-screen flex items-center justify-center bg-warm-50 px-4 py-12">
    <div class="max-w-md w-full">
      <div class="card text-center">
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-warm-700 mb-4">
            Magic Link Expired
          </h2>
          <p class="text-base text-soft-600 mb-6">
            This magic link has expired.
          </p>
          
          <!-- If user is already logged in -->
          <div v-if="hasAutoLogin" class="mb-6 p-4 bg-warm-100 border border-warm-200 rounded-lg">
            <p class="text-sm text-warm-800 mb-3">
              You're already logged in. You will be redirected to the home page, or you can click the link below.
            </p>
            <a 
              :href="baseURL" 
              class="text-warm-600 hover:text-warm-700 underline font-medium"
            >
              {{ baseURL }}
            </a>
          </div>
          
          <!-- If user is not logged in -->
          <div v-else class="mb-6 p-4 bg-warm-100 border border-warm-200 rounded-lg">
            <p class="text-sm text-warm-800 mb-3">
              You need to request another magic link to log in. You will be redirected to the home page, or you can click the link below.
            </p>
            <a 
              :href="baseURL" 
              class="text-warm-600 hover:text-warm-700 underline font-medium"
            >
              {{ baseURL }}
            </a>
          </div>
          
          <!-- Countdown Timer -->
          <div class="mb-6">
            <div class="text-6xl font-bold text-warm-600 mb-4">
              {{ countdown }}
            </div>
            <p class="text-sm text-soft-600">
              Redirecting to home page...
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import { nextTick } from 'vue';

const router = useRouter();
const authStore = useAuthStore();
const countdown = ref(5);
const hasAutoLogin = ref(false);
// Initialize with empty string, will be set in onMounted
const baseURL = ref('');
let countdownInterval = null;

// Check for automatic login (check localStorage for auth token)
async function checkAutoLogin() {
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Check if user is already authenticated
      if (authStore.currentUser) {
        hasAutoLogin.value = true;
      } else if (authStore.isAuthenticated) {
        // Token exists, try to fetch user to verify it's still valid
        try {
          await authStore.fetchCurrentUser();
          hasAutoLogin.value = true;
        } catch (error) {
          // Token is invalid, no auto-login
          hasAutoLogin.value = false;
        }
      } else {
        // Token exists in localStorage but not in store, try to validate it
        try {
          await authStore.fetchCurrentUser();
          hasAutoLogin.value = true;
        } catch (error) {
          hasAutoLogin.value = false;
        }
      }
    } else {
      hasAutoLogin.value = false;
    }
  } catch (error) {
    console.error('Error checking auto login:', error);
    hasAutoLogin.value = false;
  }
}

// Start countdown
function startCountdown() {
  countdownInterval = setInterval(() => {
    countdown.value--;
    
    if (countdown.value <= 0) {
      clearInterval(countdownInterval);
      // Redirect to base URL (external redirect)
      window.location.href = baseURL.value || window.location.origin;
    }
  }, 2000); // Each number lasts 2 seconds
}

onMounted(async () => {
  // Set baseURL immediately when component mounts
  if (typeof window !== 'undefined') {
    baseURL.value = window.location.origin;
  }
  
  // Wait for next tick to ensure DOM is ready
  await nextTick();
  
  // Check auto login (non-blocking - don't await)
  checkAutoLogin();
  
  // Start countdown immediately
  startCountdown();
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

