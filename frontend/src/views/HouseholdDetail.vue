<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading...</div>
    </div>

    <div v-else-if="household">
      <div class="mb-6">
        <router-link to="/directory" class="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← Back to Directory
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900 mt-4">{{ household.display_name || household.name }}</h1>
        <div v-if="household.address" class="text-gray-600 mt-2 whitespace-pre-line">
          {{ household.address }}
        </div>
        <p v-if="household.notes" class="text-gray-600 mt-2">{{ household.notes }}</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Household Members</h2>
        
        <div v-if="household.members && household.members.length > 0" class="space-y-4">
          <div
            v-for="member in household.members"
            :key="member.id"
            class="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
          >
            <router-link
              :to="`/person/${member.id}`"
              class="block hover:bg-gray-50 p-3 rounded-md transition-colors"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium text-gray-900">
                    {{ member.full_name || `${member.first_name} ${member.last_name}` }}
                  </h3>
                  <div class="text-sm text-gray-600 mt-1">
                    <span v-if="member.generation" class="mr-3">Generation: {{ member.generation }}</span>
                    <span v-if="member.email">{{ member.email }}</span>
                  </div>
                </div>
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </router-link>
          </div>
        </div>
        <div v-else class="text-gray-600">No members in this household</div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-red-600">Household not found</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const household = ref(null);
const loading = ref(true);

async function fetchHousehold() {
  try {
    const response = await axios.get(`/api/households/${route.params.id}`);
    household.value = response.data;
  } catch (error) {
    console.error('Error fetching household:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchHousehold();
});
</script>

