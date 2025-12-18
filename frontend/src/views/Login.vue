<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Family Directory
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your email to receive a login link
        </p>
      </div>
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div>
          <label for="email" class="sr-only">Email address</label>
          <input
            id="email"
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>

        <div v-if="message" :class="messageType === 'error' ? 'text-red-600' : 'text-green-600'" class="text-sm text-center">
          {{ message }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span v-if="loading">Sending...</span>
            <span v-else>Send Magic Link</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { getApiBaseURL } from '../utils/api.js';

const email = ref('');
const message = ref('');
const messageType = ref('');
const loading = ref(false);

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


