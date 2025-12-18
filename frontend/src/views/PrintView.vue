<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">Family Directory - Print View</h1>
      <button
        @click="window.print()"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Print
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading...</div>
    </div>

    <div v-else class="space-y-8">
      <!-- By Household -->
      <div>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">By Household</h2>
        <div
          v-for="household in households"
          :key="household.id"
          class="mb-6 page-break-inside-avoid"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ household.name }}</h3>
          <div v-if="household.members && household.members.length > 0" class="space-y-2">
            <div
              v-for="member in household.members"
              :key="member.id"
              class="text-sm text-gray-700"
            >
              <strong>{{ member.full_name || `${member.first_name} ${member.last_name}` }}</strong>
              <span v-if="member.generation"> ({{ member.generation }})</span>
              <div v-if="member.email" class="text-gray-600 ml-4">Email: {{ member.email }}</div>
              <div v-if="member.phone" class="text-gray-600 ml-4">Phone: {{ member.phone }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- By Generation -->
      <div class="mt-12">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">By Generation</h2>
        <div
          v-for="generation in generations"
          :key="generation"
          class="mb-6 page-break-inside-avoid"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ generation }}</h3>
          <div class="space-y-2">
            <div
              v-for="person in personsByGeneration[generation]"
              :key="person.id"
              class="text-sm text-gray-700"
            >
              <strong>{{ person.full_name || `${person.first_name} ${person.last_name}` }}</strong>
              <div v-if="person.email" class="text-gray-600 ml-4">Email: {{ person.email }}</div>
              <div v-if="person.phone" class="text-gray-600 ml-4">Phone: {{ person.phone }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const households = ref([]);
const persons = ref([]);
const loading = ref(true);

const generations = computed(() => {
  const gens = [...new Set(persons.value.map(p => p.generation).filter(Boolean))];
  return gens.sort();
});

const personsByGeneration = computed(() => {
  const grouped = {};
  persons.value.forEach(person => {
    if (!person.generation) return;
    if (!grouped[person.generation]) {
      grouped[person.generation] = [];
    }
    grouped[person.generation].push(person);
  });
  return grouped;
});

async function fetchData() {
  try {
    const [householdsRes, personsRes] = await Promise.all([
      axios.get('/api/households'),
      axios.get('/api/persons'),
    ]);
    households.value = householdsRes.data;
    persons.value = personsRes.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
@media print {
  .page-break-inside-avoid {
    page-break-inside: avoid;
  }
}
</style>


