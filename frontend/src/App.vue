<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav v-if="isAuthenticated" class="bg-white shadow-sm border-b sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center min-h-16 py-3">
          <div class="flex items-center">
            <router-link to="/directory" class="text-xl font-semibold text-gray-900">
              Family Directory
            </router-link>
          </div>
          
          <!-- Search, Filter, and Sort - only show on Directory page -->
          <div v-if="route.name === 'Directory'" class="flex-1 flex items-center gap-2 sm:gap-3 mx-2 sm:mx-4">
            <!-- Search Input - full width on larger screens, icon on very small -->
            <div class="hidden lg:flex flex-1 min-w-0 search-input-container">
              <input
                :value="directorySearchQuery"
                @input="updateDirectorySearch($event.target.value)"
                type="text"
                placeholder="Search by name, email, or phone..."
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <!-- Search Icon Button - shows on small screens -->
            <button
              @click="showSearchModal = true"
              class="lg:hidden px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-center flex-shrink-0"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              @click="showDirectoryFilterModal = true"
              class="filter-btn px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-1 sm:gap-2 text-sm flex-shrink-0"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span class="hidden sm:inline">Filter</span>
            </button>
            <select
              :value="directorySortBy"
              @change="updateDirectorySort($event.target.value)"
              class="sort-dropdown border border-gray-300 rounded-md text-sm appearance-none bg-white inline-flex items-center focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="name">Name (A-Z)</option>
              <option value="household">Household</option>
              <option value="next_event">Next Event</option>
              <option value="age_asc">Youngest</option>
              <option value="age_desc">Oldest</option>
              <option value="generation">Generation</option>
            </select>
          </div>
          
          <!-- Search Footer -->
          <div
            v-if="showSearchModal"
            class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-50 p-4"
          >
            <div class="max-w-7xl mx-auto flex items-center gap-3">
              <input
                :value="directorySearchQuery"
                @input="updateDirectorySearch($event.target.value)"
                type="text"
                placeholder="Search by name, email, or phone..."
                class="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-base"
                autofocus
              />
              <button
                @click="closeSearchModal"
                class="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium"
              >
                Close
              </button>
            </div>
          </div>
          
          <div class="flex items-center">
            <!-- User Menu Dropdown -->
            <div class="relative" v-if="currentUser" ref="menuContainer">
              <button
                @click.stop="showMenu = !showMenu"
                class="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-3 py-2"
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
                class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
              >
                <div class="py-1">
                  <router-link
                    v-if="currentUser && currentUser.is_admin"
                    to="/person/new"
                    @click="showMenu = false"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Add Contact
                  </router-link>
                  <router-link
                    to="/print"
                    @click="showMenu = false"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Print
                  </router-link>
                  <button
                    @click="handleLogout"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
import { ref, computed, onMounted, watch, provide } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showMenu = ref(false);
const menuContainer = ref(null);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUser = computed(() => authStore.currentUser);
const isSmallScreen = ref(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

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

function updateDirectorySort(value) {
  directorySortBy.value = value;
}

function closeSearchModal() {
  showSearchModal.value = false;
  directorySearchQuery.value = '';
}

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
  
  // Fetch current user if authenticated
  if (isAuthenticated.value && !currentUser.value) {
    authStore.fetchCurrentUser().catch(error => {
      console.error('Failed to fetch current user:', error);
    });
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

