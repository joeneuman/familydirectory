<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav v-if="isAuthenticated" class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/directory" class="text-xl font-semibold text-gray-900">
              Family Directory
            </router-link>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showMenu = ref(false);
const menuContainer = ref(null);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUser = computed(() => authStore.currentUser);

// Close menu when route changes
watch(() => route.path, () => {
  showMenu.value = false;
});

// Click outside to close menu
onMounted(() => {
  document.addEventListener('click', (event) => {
    if (menuContainer.value && !menuContainer.value.contains(event.target)) {
      showMenu.value = false;
    }
  });
});

function handleLogout() {
  showMenu.value = false;
  authStore.logout();
  router.push('/login');
}

// Fetch current user on mount if authenticated
onMounted(async () => {
  if (isAuthenticated.value && !currentUser.value) {
    try {
      await authStore.fetchCurrentUser();
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  }
});
</script>

