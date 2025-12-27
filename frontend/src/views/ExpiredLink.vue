<template>
  <div class="min-h-screen flex items-center justify-center bg-warm-50 px-4 py-12">
    <div class="max-w-md w-full">
      <div class="card text-center">
        <div class="mb-8">
          <!-- If user is already logged in -->
          <template v-if="hasAutoLogin">
            <p class="text-xl text-warm-800 mb-6">
              You're already logged in. You will be redirected automatically.
            </p>
          </template>
          
          <!-- If user is not logged in -->
          <template v-else>
            <h2 class="text-3xl font-bold text-warm-700 mb-4">
              Magic Link Expired
            </h2>
            <p class="text-xl text-warm-800 mb-6">
              Your Magic Link has expired. You will be redirected to create another magic link.
            </p>
          </template>
          
          <!-- Countdown Timer -->
          <div class="mb-6">
            <div class="text-6xl font-bold text-warm-600 mb-4">
              {{ countdown }}
            </div>
            <p class="text-lg text-soft-600">
              Redirecting to 
              <a 
                :href="baseURL" 
                class="text-warm-600 hover:text-warm-700 underline font-medium"
              >
                {{ displayURL }}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const countdown = ref(5);
const hasAutoLogin = ref(false);
// Set baseURL immediately - use window.location.origin if available, otherwise empty string
const baseURL = ref(typeof window !== 'undefined' ? window.location.origin : '');
let countdownInterval = null;

// Display URL without https:// or http://
const displayURL = computed(() => {
  if (!baseURL.value) return 'home page';
  try {
    const url = new URL(baseURL.value);
    return url.hostname; // Returns just the domain (e.g., "neumanfam.com")
  } catch {
    // Fallback if URL parsing fails
    return baseURL.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
});

// Check for automatic login (check localStorage for auth token)
async function checkAutoLogin() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      hasAutoLogin.value = false;
      return;
    }
    
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
      const redirectUrl = baseURL.value || (typeof window !== 'undefined' ? window.location.origin : '/');
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    }
  }, 2000); // Each number lasts 2 seconds
}

onMounted(() => {
  // Ensure baseURL is set
  if (typeof window !== 'undefined' && !baseURL.value) {
    baseURL.value = window.location.origin;
  }
  
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

