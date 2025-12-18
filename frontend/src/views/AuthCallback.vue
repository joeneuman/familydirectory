<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div v-if="loading" class="text-gray-600">Logging you in...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  const token = route.query.token;
  
  if (!token) {
    error.value = 'No token provided';
    loading.value = false;
    return;
  }

  try {
    authStore.setToken(token);
    await authStore.fetchCurrentUser();
    router.push('/directory');
  } catch (err) {
    error.value = 'Failed to authenticate';
    loading.value = false;
  }
});
</script>

