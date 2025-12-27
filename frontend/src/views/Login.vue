<template>
  <div class="min-h-screen flex items-center justify-center bg-warm-50 px-4 py-12">
    <div class="max-w-md w-full">
      <div class="card text-center">
        <div class="mb-8">
          <h2 class="text-4xl font-bold text-warm-700 mb-3">
            {{ siteName }}
          </h2>
          <p class="text-base text-soft-600">
            Enter your email to receive a login link
          </p>
        </div>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              autofocus
              class="input-field"
              placeholder="Email address"
            />
          </div>

          <div v-if="message" :class="messageType === 'error' ? 'text-red-500' : 'text-green-600'" class="text-sm text-center font-medium">
            {{ message }}
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Sending...</span>
              <span v-else>Send Magic Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSiteSettingsStore } from '../stores/siteSettings';

const route = useRoute();
const siteSettingsStore = useSiteSettingsStore();
const email = ref('');
const message = ref('');
const messageType = ref('');
const loading = ref(false);

// Use site name from store (reactive)
const siteName = computed(() => siteSettingsStore.siteName);

// Check for error query parameters on mount
onMounted(() => {
  const error = route.query.error;
  if (error === 'link_expired') {
    message.value = 'This login link has expired. Please request a new one.';
    messageType.value = 'error';
  }
  // Fetch site name from API
  siteSettingsStore.fetchSiteName();
});

async function handleSubmit() {
  loading.value = true;
  message.value = '';
  
  try {
    const response = await axios.post(`${getApiBaseURL()}/auth/request-link`, {
      email: email.value,
    });
    message.value = response.data.message;
    messageType.value = 'success';
    email.value = '';
  } catch (error) {
    message.value = error.response?.data?.error || 'An error occurred';
    messageType.value = 'error';
  } finally {
    loading.value = false;
  }
}
</script>


