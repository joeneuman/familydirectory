<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-12">
      <div class="text-soft-600">Loading...</div>
    </div>

    <div v-else-if="person && person.canEdit">
      <div class="mb-6">
        <router-link :to="`/person/${person.id}`" class="text-warm-600 hover:text-warm-700 mb-4 inline-block font-medium transition-colors duration-200">
          ← Back to Person
        </router-link>
        <h1 class="text-3xl font-bold text-warm-700">Privacy Settings</h1>
        <p class="text-soft-600 mt-2">
          Select specific people who should have limited viewership of your information, and choose which fields to hide from them.
        </p>
      </div>

      <div class="card">
        <!-- Select People with Limited Access -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-soft-700 mb-2">People with Limited Access</label>
          <div class="max-h-48 overflow-y-auto border border-soft-200 rounded-xl p-3 space-y-2">
            <div
              v-for="p in allPeople.filter(p => p.id !== person.id)"
              :key="p.id"
              class="flex items-center py-1"
            >
              <input
                :id="`privacy-person-${p.id}`"
                type="checkbox"
                :value="p.id"
                v-model="privacySettings.restricted_people"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label 
                :for="`privacy-person-${p.id}`" 
                class="ml-3 flex-1 cursor-pointer text-sm text-soft-900"
              >
                {{ p.full_name || `${p.first_name} ${p.last_name}` }}
              </label>
            </div>
            <p v-if="allPeople.filter(p => p.id !== person.id).length === 0" class="text-sm text-soft-500 italic">
              No other people in the directory
            </p>
          </div>
        </div>

        <!-- Fields to Hide from Restricted People -->
        <div v-if="privacySettings.restricted_people && privacySettings.restricted_people.length > 0">
          <label class="block text-sm font-medium text-soft-700 mb-3">Fields to Hide from Selected People</label>
          <div class="space-y-3">
            <div class="flex items-center">
              <input
                id="privacy-photo"
                type="checkbox"
                v-model="privacySettings.photo"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-photo" class="ml-3 text-sm font-medium text-soft-700">Hide Photo</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-email"
                type="checkbox"
                v-model="privacySettings.email"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-email" class="ml-3 text-sm font-medium text-soft-700">Hide Email</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-phone"
                type="checkbox"
                v-model="privacySettings.phone"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-phone" class="ml-3 text-sm font-medium text-soft-700">Hide Phone</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-address"
                type="checkbox"
                v-model="privacySettings.address"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-address" class="ml-3 text-sm font-medium text-soft-700">Hide Address</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-generation"
                type="checkbox"
                v-model="privacySettings.generation"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-generation" class="ml-3 text-sm font-medium text-soft-700">Hide Generation</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-age"
                type="checkbox"
                v-model="privacySettings.age"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-age" class="ml-3 text-sm font-medium text-soft-700">Hide Age</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-birthday"
                type="checkbox"
                v-model="privacySettings.birthday"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-birthday" class="ml-3 text-sm font-medium text-soft-700">Hide Birthday</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-anniversary"
                type="checkbox"
                v-model="privacySettings.anniversary"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-anniversary" class="ml-3 text-sm font-medium text-soft-700">Hide Anniversary</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-years-married"
                type="checkbox"
                v-model="privacySettings.years_married"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-years-married" class="ml-3 text-sm font-medium text-soft-700">Hide Years Married</label>
            </div>
            <div class="flex items-center">
              <input
                id="privacy-household-name"
                type="checkbox"
                v-model="privacySettings.household_name"
                class="h-4 w-4 text-warm-600 focus:ring-warm-500 border-soft-300 rounded"
              />
              <label for="privacy-household-name" class="ml-3 text-sm font-medium text-soft-700">Hide Household Name</label>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-soft-500 italic">
          Select people above to configure which fields to hide from them.
        </p>

        <!-- Buttons -->
        <div class="flex justify-end space-x-4 pt-6 mt-6 border-t border-soft-200">
          <router-link
            :to="`/person/${person.id}`"
            class="btn-secondary"
          >
            Cancel
          </router-link>
          <button
            type="button"
            @click="handleSave"
            :disabled="saving"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save Privacy Settings</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-red-600">You don't have permission to edit this person's privacy settings.</div>
      <router-link to="/directory" class="text-warm-600 hover:text-warm-700 mt-4 inline-block">
        ← Back to Directory
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { getApiBaseURL } from '../utils/api.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const person = ref(null);
const loading = ref(true);
const saving = ref(false);
const allPeople = ref([]);

const privacySettings = ref({
  restricted_people: [],
  photo: false,
  email: false,
  phone: false,
  address: false,
  generation: false,
  age: false,
  birthday: false,
  anniversary: false,
  years_married: false,
  household_name: false,
});

async function fetchPerson() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons/${route.params.id}`);
    person.value = response.data;
    
    // Initialize privacy settings from person data
    if (person.value.privacy_settings) {
      privacySettings.value = {
        restricted_people: person.value.privacy_settings.restricted_people || [],
        photo: person.value.privacy_settings.photo || false,
        email: person.value.privacy_settings.email || false,
        phone: person.value.privacy_settings.phone || false,
        address: person.value.privacy_settings.address || false,
        generation: person.value.privacy_settings.generation || false,
        age: person.value.privacy_settings.age || false,
        birthday: person.value.privacy_settings.birthday || false,
        anniversary: person.value.privacy_settings.anniversary || false,
        years_married: person.value.privacy_settings.years_married || false,
        household_name: person.value.privacy_settings.household_name || false,
      };
    }
  } catch (error) {
    console.error('Error fetching person:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchAllPeople() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons`);
    allPeople.value = response.data;
  } catch (err) {
    console.error('Error fetching people:', err);
  }
}

async function handleSave() {
  saving.value = true;

  try {
    const dataToSend = {};
    
    // Add privacy settings to the update (only if there are restrictions)
    if (privacySettings.value.restricted_people && privacySettings.value.restricted_people.length > 0) {
      dataToSend.privacy_settings = { ...privacySettings.value };
    } else {
      // If no restricted people, set to empty object
      dataToSend.privacy_settings = { restricted_people: [] };
    }
    
    await axios.put(`${getApiBaseURL()}/persons/${route.params.id}`, dataToSend);
    router.push(`/person/${route.params.id}`);
  } catch (err) {
    console.error('Error saving privacy settings:', err);
    alert(err.response?.data?.error || 'Failed to save privacy settings');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchPerson();
  await fetchAllPeople();
});
</script>

