<template>
  <div class="min-h-screen bg-warm-50 flex items-center justify-center px-4 py-12">
    <div class="max-w-2xl w-full">
      <div class="bg-white rounded-2xl shadow-soft-lg border border-soft-200 p-8 sm:p-10">
        <!-- Error Icon -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center mb-4">
            <img src="/images/error.gif" alt="Error" class="max-w-full h-auto" style="max-width: 600px; max-height: 600px;" />
          </div>
          <h1 class="text-3xl font-bold text-warm-800 mb-2">Something Went Wrong</h1>
          <p class="text-soft-600">We're sorry, but an error has occurred. Please help us fix it by providing details below.</p>
        </div>

        <!-- Error Details (if available) -->
        <div v-if="errorDetails" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <h2 class="text-sm font-semibold text-red-800 mb-2">Error Information:</h2>
          <pre class="text-xs text-red-700 overflow-auto max-h-40 font-mono">{{ errorDetails }}</pre>
        </div>

        <!-- Error Report Form -->
        <form @submit.prevent="submitErrorReport" class="space-y-6">
          <div>
            <label for="description" class="block text-sm font-medium text-soft-700 mb-2">
              What were you trying to do when this error occurred? <span class="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="4"
              required
              class="w-full px-4 py-3 border border-soft-200 rounded-xl focus:ring-2 focus:ring-warm-400 focus:border-warm-400 transition-all duration-200 resize-none"
              placeholder="Describe what you were doing when the error happened..."
            ></textarea>
          </div>

          <div>
            <label for="steps" class="block text-sm font-medium text-soft-700 mb-2">
              Steps to reproduce (if applicable)
            </label>
            <textarea
              id="steps"
              v-model="form.steps"
              rows="3"
              class="w-full px-4 py-3 border border-soft-200 rounded-xl focus:ring-2 focus:ring-warm-400 focus:border-warm-400 transition-all duration-200 resize-none"
              placeholder="1. Go to...&#10;2. Click on...&#10;3. Error occurs..."
            ></textarea>
          </div>

          <div>
            <label for="userEmail" class="block text-sm font-medium text-soft-700 mb-2">
              Your Email (optional - so we can follow up if needed)
            </label>
            <input
              id="userEmail"
              v-model="form.userEmail"
              type="email"
              class="w-full px-4 py-3 border border-soft-200 rounded-xl focus:ring-2 focus:ring-warm-400 focus:border-warm-400 transition-all duration-200"
              placeholder="your.email@example.com"
            />
          </div>

          <!-- Success/Error Messages -->
          <div v-if="message" :class="messageType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'" class="p-4 rounded-xl border">
            {{ message }}
          </div>

          <!-- Submit Button -->
          <div class="flex gap-4">
            <button
              type="submit"
              :disabled="submitting || !form.description.trim()"
              class="flex-1 px-6 py-3 bg-warm-600 text-white rounded-xl font-medium hover:bg-warm-700 focus:ring-2 focus:ring-warm-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span v-if="submitting">Submitting...</span>
              <span v-else>Submit Error Report</span>
            </button>
            <button
              type="button"
              @click="goBack"
              class="px-6 py-3 border border-soft-300 text-soft-700 rounded-xl font-medium hover:bg-warm-50 focus:ring-2 focus:ring-warm-400 focus:ring-offset-2 transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </form>

        <!-- Additional Help -->
        <div class="mt-8 pt-6 border-t border-soft-200">
          <p class="text-sm text-soft-600 text-center">
            You can also try refreshing the page or 
            <router-link to="/directory" class="text-warm-600 hover:text-warm-700 font-medium">return to the directory</router-link>.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  description: '',
  steps: '',
  userEmail: '',
});

const submitting = ref(false);
const message = ref('');
const messageType = ref('');
const errorDetails = ref('');

// Get error details from route query or localStorage
onMounted(() => {
  // Try to get error from route query
  if (route.query.error) {
    errorDetails.value = route.query.error;
  }
  
  // Try to get error from localStorage (set by error handler)
  const storedError = localStorage.getItem('last_error');
  if (storedError) {
    try {
      const errorData = JSON.parse(storedError);
      errorDetails.value = errorData.message || errorData.stack || storedError;
    } catch (e) {
      errorDetails.value = storedError;
    }
    // Clear stored error after reading
    localStorage.removeItem('last_error');
  }

  // Pre-fill email if user is logged in
  if (authStore.currentUser?.email) {
    form.value.userEmail = authStore.currentUser.email;
  }
});

function getApiBaseURL() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
}

async function submitErrorReport() {
  submitting.value = true;
  message.value = '';
  messageType.value = '';

  try {
    const errorReport = {
      description: form.value.description,
      steps: form.value.steps || null,
      userEmail: form.value.userEmail || null,
      errorDetails: errorDetails.value || null,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: authStore.currentUser?.id || null,
      userName: authStore.currentUser ? `${authStore.currentUser.first_name} ${authStore.currentUser.last_name}` : null,
    };

    await axios.post(`${getApiBaseURL()}/errors/report`, errorReport);

    message.value = 'Thank you! Your error report has been submitted successfully. We\'ll look into it right away.';
    messageType.value = 'success';
    
    // Clear form after successful submission
    form.value.description = '';
    form.value.steps = '';
    
    // Clear error details
    errorDetails.value = '';
    
    // Redirect after 3 seconds
    setTimeout(() => {
      router.push('/directory');
    }, 3000);
  } catch (error) {
    console.error('Error submitting report:', error);
    message.value = error.response?.data?.error || 'Failed to submit error report. Please try again.';
    messageType.value = 'error';
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/directory');
  }
}
</script>

