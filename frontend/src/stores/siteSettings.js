import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { getApiBaseURL } from '../utils/api.js';

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  const siteName = ref('Family Directory');

  async function fetchSiteName() {
    try {
      const response = await axios.get(`${getApiBaseURL()}/settings/site-name`);
      siteName.value = response.data.siteName || 'Family Directory';
    } catch (error) {
      console.error('Error fetching site name:', error);
      siteName.value = 'Family Directory';
    }
  }

  function setSiteName(newName) {
    siteName.value = newName || 'Family Directory';
  }

  return {
    siteName,
    fetchSiteName,
    setSiteName,
  };
});

