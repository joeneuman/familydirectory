<template>
  <div id="app" class="min-h-screen bg-warm-50">
    <nav v-if="isAuthenticated" class="bg-white shadow-soft border-b border-soft-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center min-h-16 py-4">
          <div class="flex items-center">
            <router-link to="/directory" class="text-2xl font-bold text-warm-700 hover:text-warm-600 transition-colors duration-200">
              {{ siteName }}
            </router-link>
          </div>
          
          <!-- Search, Filter, and Sort - only show on Directory page -->
          <div v-if="route.name === 'Directory'" class="flex-1 flex items-center gap-2 sm:gap-3 mx-2 sm:mx-4">
            <!-- Search Input - full width on larger screens, icon on very small -->
            <div class="hidden lg:flex flex-1 min-w-0 search-input-container relative">
              <input
                :value="directorySearchQuery"
                @input="updateDirectorySearch($event.target.value)"
                type="text"
                placeholder="Search by name, email, or phone..."
                class="input-field text-sm pr-10"
              />
              <!-- Clear button (X) - only show when there's text -->
              <button
                v-if="directorySearchQuery"
                @click="updateDirectorySearch('')"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                type="button"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <!-- Search Icon Button - shows on small screens -->
            <button
              @click="toggleSearchModal"
              class="lg:hidden px-3 py-2 border border-soft-200 rounded-xl hover:bg-warm-50 focus:ring-2 focus:ring-warm-400 focus:border-warm-400 flex items-center justify-center flex-shrink-0 transition-all duration-200"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <select
              :value="directorySortBy"
              @change="updateDirectorySort($event.target.value)"
              class="sort-dropdown border border-soft-200 rounded-xl text-sm appearance-none bg-white inline-flex items-center focus:ring-2 focus:ring-warm-400 focus:border-warm-400 px-4 py-2 transition-all duration-200 hover:bg-warm-50"
            >
              <option value="name">Name (A-Z)</option>
              <option value="household">Household</option>
              <option value="next_event">Next Event</option>
              <option value="age_asc">Youngest</option>
              <option value="age_desc">Oldest</option>
              <option value="generation">Generation</option>
            </select>
            <button
              @click="showDirectoryFilterModal = true"
              class="filter-btn px-3 sm:px-4 py-2 border border-soft-200 rounded-xl hover:bg-warm-50 focus:ring-2 focus:ring-warm-400 focus:border-warm-400 flex items-center gap-1 sm:gap-2 text-sm flex-shrink-0 transition-all duration-200"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span class="hidden sm:inline">Filter</span>
            </button>
          </div>
          
          <!-- Search Bar - Overlay at top -->
          <div
            v-if="showSearchModal"
            class="fixed top-0 left-0 right-0 bg-white border-b border-soft-200 shadow-soft-lg z-50 p-4 backdrop-blur-sm bg-white/98"
          >
            <div class="max-w-7xl mx-auto flex items-center gap-3">
              <div class="flex-1 relative">
                <input
                  ref="searchInputRef"
                  :value="directorySearchQuery"
                  @input="updateDirectorySearch($event.target.value)"
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  class="input-field text-base pr-10"
                />
                <!-- Clear button (X) - only show when there's text -->
                <button
                  v-if="directorySearchQuery"
                  @click="clearSearchAndFocus"
                  class="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  type="button"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <!-- Close button (X) - always visible to close modal -->
              <button
                @click="closeSearchModal"
                class="px-3 py-2 text-gray-400 hover:text-gray-600 focus:outline-none flex-shrink-0"
                type="button"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="flex items-center">
            <!-- User Menu Dropdown -->
            <div class="relative" v-if="currentUser" ref="menuContainer">
              <button
                @click.stop="showMenu = !showMenu"
                class="flex items-center text-soft-700 hover:text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-400 focus:ring-offset-2 rounded-xl px-4 py-2 transition-all duration-200 font-medium"
              >
                <span class="font-medium">
                  {{ currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}` }}
                </span>
                <svg
                  class="ml-2 h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="showMenu"
                class="absolute right-0 mt-2 w-48 rounded-xl shadow-soft-lg bg-white border border-soft-200 z-50 overflow-hidden"
              >
                <div class="py-1">
                  <router-link
                    v-if="currentUser && currentUser.is_admin"
                    to="/person/new"
                    @click="showMenu = false"
                    class="block px-4 py-2.5 text-sm text-soft-700 hover:bg-warm-50 hover:text-warm-700 transition-colors duration-150"
                  >
                    Add Contact
                  </router-link>
                  
                  <router-link
                    v-if="currentUser && currentUser.is_admin"
                    to="/settings"
                    @click="showMenu = false"
                    class="block px-4 py-2.5 text-sm text-soft-700 hover:bg-warm-50 hover:text-warm-700 transition-colors duration-150"
                  >
                    Settings
                  </router-link>
                  
                  <router-link
                    to="/print/options"
                    @click="showMenu = false"
                    class="block px-4 py-2.5 text-sm text-soft-700 hover:bg-warm-50 hover:text-warm-700 transition-colors duration-150"
                  >
                    Print
                  </router-link>
                  
                  <button
                    @click="handleLogout"
                    class="block w-full text-left px-4 py-2.5 text-sm text-soft-700 hover:bg-warm-50 hover:text-warm-700 transition-colors duration-150"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import axios from 'axios';
import { getApiBaseURL } from './utils/api.js';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showMenu = ref(false);
const menuContainer = ref(null);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUser = computed(() => authStore.currentUser);
const isSmallScreen = ref(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

// Site name management - fetch from API
const siteName = ref('Family Directory');

// Fetch site name from API
async function fetchSiteName() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/settings/site-name`);
    siteName.value = response.data.siteName || 'Family Directory';
  } catch (error) {
    console.error('Error fetching site name:', error);
    siteName.value = 'Family Directory';
  }
}

// Directory controls state (shared with Directory component)
// Persist view selection in localStorage
const getStoredSortBy = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('directorySortBy');
    return stored || 'name'; // Default to Name (A-Z)
  }
  return 'name';
};

const directorySearchQuery = ref('');
const directorySortBy = ref(getStoredSortBy());
const showDirectoryFilterModal = ref(false);
const showSearchModal = ref(false);
const searchInputRef = ref(null);

// Watch for changes and persist to localStorage
watch(directorySortBy, (newValue) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('directorySortBy', newValue);
  }
});

// Get display name for sort dropdown
function getSortDisplayName(value) {
  const names = {
    household: 'Household',
    next_event: 'Next Event',
    age_asc: 'Youngest',
    age_desc: 'Oldest',
    generation: 'Generation',
    name: 'Name (A-Z)'
  };
  return names[value] || 'Household';
}


// Provide these to child components
provide('directorySearchQuery', directorySearchQuery);
provide('directorySortBy', directorySortBy);
provide('showDirectoryFilterModal', showDirectoryFilterModal);

function updateDirectorySearch(value) {
  directorySearchQuery.value = value;
}

function clearSearchAndFocus() {
  updateDirectorySearch('');
  // Refocus the input after clearing
  nextTick(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
  });
}

function updateDirectorySort(value) {
  directorySortBy.value = value;
}

function toggleSearchModal() {
  if (showSearchModal.value) {
    // If modal is open, close it
    showSearchModal.value = false;
  } else {
    // If modal is closed, open it (focus will be handled by watcher)
    showSearchModal.value = true;
  }
}

function closeSearchModal() {
  showSearchModal.value = false;
  directorySearchQuery.value = '';
}

// Watch for search modal opening and focus the input
watch(showSearchModal, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      if (searchInputRef.value) {
        searchInputRef.value.focus();
      }
    });
  }
});

// Close menu when route changes
watch(() => route.path, () => {
  showMenu.value = false;
});

function handleLogout() {
  showMenu.value = false;
  authStore.logout();
  router.push('/login');
}


// Click outside to close menu and initialize
onMounted(() => {
  // Screen size tracking
  const updateScreenSize = () => {
    isSmallScreen.value = window.innerWidth < 640;
  };
  window.addEventListener('resize', updateScreenSize);
  updateScreenSize();
  
  // Click outside menu handler
  document.addEventListener('click', (event) => {
    if (menuContainer.value && !menuContainer.value.contains(event.target)) {
      showMenu.value = false;
    }
  });
  
  // Fetch current user if authenticated (but not on login page)
  if (isAuthenticated.value && !currentUser.value && route.path !== '/login') {
    authStore.fetchCurrentUser().catch(error => {
      console.error('Failed to fetch current user:', error);
      // If token is invalid (403), clear it
      if (error.response?.status === 403) {
        authStore.logout();
      }
    });
  }
  
  // Fetch site name from API
  fetchSiteName();
});

// Watch for route changes to refresh site name when leaving Settings page
watch(() => route.path, (newPath, oldPath) => {
  if (oldPath === '/settings' && newPath !== '/settings') {
    fetchSiteName();
  }
});
</script>

<style scoped>
.sort-dropdown {
  width: auto;
  min-width: fit-content;
  padding: 8px;
}

@media (min-width: 640px) {
  .search-input-container {
    min-width: 250px;
  }
}
</style>

