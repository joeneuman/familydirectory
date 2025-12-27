import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { getApiBaseURL } from '../utils/api.js';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || null);
  const currentUser = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  // Set up axios interceptor
  axios.defaults.headers.common['Authorization'] = token.value 
    ? `Bearer ${token.value}` 
    : '';

  function setToken(newToken) {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  function setUser(user) {
    currentUser.value = user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  async function fetchCurrentUser() {
    try {
      const response = await axios.get(`${getApiBaseURL()}/persons/me/info`);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      // If token is invalid (403), clear it
      if (error.response?.status === 403) {
        logout();
      }
      throw error;
    }
  }

  return {
    token,
    currentUser,
    isAuthenticated,
    setToken,
    setUser,
    logout,
    fetchCurrentUser,
  };
});


