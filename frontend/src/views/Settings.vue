<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-warm-700 mb-2">Settings</h1>
      <router-link to="/directory" class="text-warm-600 hover:text-warm-700 font-medium transition-colors duration-200">
        ← Back to Directory
      </router-link>
    </div>

    <div class="card">
      <h2 class="text-xl font-semibold text-warm-700 mb-6">Site Configuration</h2>
      
      <!-- Site Name Section -->
      <div class="border-t border-soft-200 pt-6">
        <label class="block text-sm font-medium text-soft-700 mb-2">Site Name</label>
        <p class="text-sm text-soft-600 mb-4">
          Change the name displayed in the header and on the login page.
        </p>
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <input
              v-model="editSiteName"
              type="text"
              class="input-field"
              placeholder="Enter site name"
              @keyup.enter="saveSiteName"
            />
          </div>
          <button
            @click="saveSiteName"
            :disabled="loading || !editSiteName.trim()"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Saving...</span>
            <span v-else>Save</span>
          </button>
        </div>
        <p v-if="saveMessage" :class="saveMessageType === 'error' ? 'text-red-500' : 'text-green-600'" class="mt-2 text-sm font-medium">
          {{ saveMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import { getApiBaseURL } from '../utils/api.js';

const router = useRouter();
const authStore = useAuthStore();
const currentUser = computed(() => authStore.currentUser);

const editSiteName = ref('');
const loading = ref(false);
const saveMessage = ref('');
const saveMessageType = ref('');

// Check if user is admin, redirect if not
onMounted(async () => {
  // Ensure current user is loaded
  if (!authStore.currentUser) {
    await authStore.fetchCurrentUser();
  }
  
  // Redirect if not admin
  if (!authStore.currentUser || !authStore.currentUser.is_admin) {
    router.push('/directory');
    return;
  }
  
  // Fetch current site name
  await fetchSiteName();
});

async function fetchSiteName() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/settings/site-name`);
    editSiteName.value = response.data.siteName || 'Family Directory';
  } catch (error) {
    console.error('Error fetching site name:', error);
    editSiteName.value = 'Family Directory';
  }
}

async function saveSiteName() {
  if (!editSiteName.value.trim()) {
    return;
  }
  
  loading.value = true;
  saveMessage.value = '';
  
  try {
    // Ensure token is in headers - get it from localStorage or auth store
    const token = authStore.token || localStorage.getItem('auth_token');
    if (!token) {
      saveMessage.value = 'You must be logged in to change settings.';
      saveMessageType.value = 'error';
      loading.value = false;
      return;
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    await axios.post(`${getApiBaseURL()}/settings/site-name`, {
      value: editSiteName.value.trim()
    }, config);
    saveMessage.value = 'Site name saved successfully!';
    saveMessageType.value = 'success';
    
    // Clear message after 3 seconds
    setTimeout(() => {
      saveMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('Error saving site name:', error);
    if (error.response?.status === 403) {
      saveMessage.value = 'You do not have permission to change the site name.';
    } else {
      saveMessage.value = 'Failed to save site name. Please try again.';
    }
    saveMessageType.value = 'error';
  } finally {
    loading.value = false;
  }
}
</script>

