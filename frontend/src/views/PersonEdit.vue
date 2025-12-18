<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading...</div>
    </div>

    <div v-else-if="person && person.canEdit">
      <div class="mb-6">
        <router-link :to="`/person/${person.id}`" class="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← Back to Person
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900">Edit Information</h1>
      </div>

      <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          {{ error }}
        </div>

        <div class="space-y-6">
          <!-- Basic Information -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  v-model="formData.first_name"
                  type="text"
                  required
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  v-model="formData.last_name"
                  type="text"
                  required
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  v-model="formData.full_name"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Generation</label>
                <input
                  v-model="formData.generation"
                  type="text"
                  placeholder="G1, G2, G3..."
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  v-model="formData.email"
                  type="email"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  v-model="formData.phone"
                  type="tel"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  v-model="formData.date_of_birth"
                  type="date"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Is Deceased</label>
                <input
                  v-model="formData.is_deceased"
                  type="checkbox"
                  class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div v-if="authStore.currentUser && authStore.currentUser.is_admin" class="flex items-center">
                <input
                  v-model="formData.is_admin"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm font-medium text-gray-700">Is Administrator</label>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Address</h2>
            <!-- Show household address if person is not head of household -->
            <div v-if="person && !person.is_head_of_household && person.household_address" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p class="text-sm font-medium text-blue-900 mb-1">Household Address (from head of household):</p>
              <p class="text-sm text-blue-700 whitespace-pre-line">{{ person.household_address }}</p>
              <p class="text-xs text-blue-600 mt-2">Address fields below are read-only. Remove from household to edit address.</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Address Line 1</label>
                <input
                  v-model="formData.address_line1"
                  type="text"
                  :disabled="person && !person.is_head_of_household"
                  :class="[
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm',
                    person && !person.is_head_of_household 
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  ]"
                />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Address Line 2</label>
                <input
                  v-model="formData.address_line2"
                  type="text"
                  :disabled="person && !person.is_head_of_household"
                  :class="[
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm',
                    person && !person.is_head_of_household 
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  ]"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">City</label>
                <input
                  v-model="formData.city"
                  type="text"
                  :disabled="person && !person.is_head_of_household"
                  :class="[
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm',
                    person && !person.is_head_of_household 
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  ]"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">State</label>
                <input
                  v-model="formData.state"
                  type="text"
                  :disabled="person && !person.is_head_of_household"
                  :class="[
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm',
                    person && !person.is_head_of_household 
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  ]"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Postal Code</label>
                <input
                  v-model="formData.postal_code"
                  type="text"
                  :disabled="person && !person.is_head_of_household"
                  :class="[
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm',
                    person && !person.is_head_of_household 
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  ]"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Country</label>
                <input
                  v-model="formData.country"
                  type="text"
                  :disabled="person && !person.is_head_of_household"
                  :class="[
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm',
                    person && !person.is_head_of_household 
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  ]"
                />
              </div>
            </div>
          </div>

          <!-- Marriage Information -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Marriage Information</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Wedding Anniversary</label>
                <input
                  v-model="formData.wedding_anniversary_date"
                  type="date"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <!-- Photo -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Photo</h2>
            <div>
              <label class="block text-sm font-medium text-gray-700">Photo URL</label>
              <input
                v-model="formData.photo_url"
                type="url"
                placeholder="https://..."
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p class="mt-1 text-sm text-gray-500">Enter a URL to a photo</p>
            </div>
          </div>

          <!-- Household Management -->
          <div v-if="person.primary_household_id">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Household Management</h2>
            <div class="space-y-4">
              <div>
                <button
                  type="button"
                  @click="showHouseholdModal = true"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Manage Household
                </button>
                <p class="mt-2 text-sm text-gray-600">
                  Select people to include in this household. People will be removed from their current households.
                </p>
              </div>
              
              <div v-if="person.primary_household_id" class="border-t border-gray-200 pt-4">
                <p class="text-sm text-gray-600 mb-2">
                  This person is currently in a household.
                </p>
                <button
                  type="button"
                  @click="removeFromHousehold"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Remove from Household
                </button>
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <router-link
              :to="`/person/${person.id}`"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </router-link>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <span v-if="saving">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>

    <div v-else-if="person && !person.canEdit" class="text-center py-12">
      <div class="text-red-600">You do not have permission to edit this person</div>
      <router-link to="/directory" class="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
        Back to Directory
      </router-link>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-red-600">Person not found</div>
    </div>
  </div>

  <!-- Household Management Modal -->
  <div
    v-if="showHouseholdModal"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click.self="showHouseholdModal = false"
  >
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Manage Household for {{ person.first_name }} {{ person.last_name }}
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          Select people to include in this household. People will be removed from their current households.
        </p>

        <div v-if="loadingPeople" class="text-center py-4">
          <div class="text-gray-600">Loading...</div>
        </div>

        <div v-else class="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4">
          <div
            v-for="p in allPeople"
            :key="p.id"
            class="flex items-center py-2 border-b border-gray-100 last:border-0"
          >
            <input
              :id="`person-${p.id}`"
              type="checkbox"
              :value="p.id"
              v-model="selectedHouseholdMembers"
              :disabled="p.id === person.id || (p.primary_household_id && p.id !== person.id && hasOtherMembersInHousehold(p))"
              :class="[
                'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded',
                (p.primary_household_id && p.id !== person.id && hasOtherMembersInHousehold(p)) ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            />
            <label 
              :for="`person-${p.id}`" 
              :class="[
                'ml-3 flex-1',
                (p.primary_household_id && p.id !== person.id && hasOtherMembersInHousehold(p)) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              ]"
            >
              <span class="text-sm font-medium text-gray-900">
                {{ p.full_name || `${p.first_name} ${p.last_name}` }}
              </span>
              <span v-if="p.id === person.id" class="ml-2 text-xs text-gray-500">(Head)</span>
              <span v-if="p.primary_household_id && p.id !== person.id && hasOtherMembersInHousehold(p)" class="ml-2 text-xs text-orange-600">
                (Currently in Another Household)
              </span>
            </label>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="showHouseholdModal = false"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveHousehold"
            :disabled="savingHousehold"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <span v-if="savingHousehold">Saving...</span>
            <span v-else>Save Household</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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
const error = ref(null);
const showHouseholdModal = ref(false);
const allPeople = ref([]);
const selectedHouseholdMembers = ref([]);
const loadingPeople = ref(false);
const savingHousehold = ref(false);

const formData = ref({
  first_name: '',
  last_name: '',
  full_name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'USA',
  date_of_birth: '',
  wedding_anniversary_date: '',
  generation: '',
  photo_url: '',
  is_deceased: false,
  is_admin: false,
});

async function fetchPerson() {
  try {
    const response = await axios.get(`/api/persons/${route.params.id}`);
    person.value = response.data;
    
    // Populate form
    formData.value = {
      first_name: person.value.first_name || '',
      last_name: person.value.last_name || '',
      full_name: person.value.full_name || '',
      email: person.value.email || '',
      phone: person.value.phone || '',
      address_line1: person.value.address_line1 || '',
      address_line2: person.value.address_line2 || '',
      city: person.value.city || '',
      state: person.value.state || '',
      postal_code: person.value.postal_code || '',
      country: person.value.country || 'USA',
      date_of_birth: person.value.date_of_birth ? person.value.date_of_birth.split('T')[0] : '',
      wedding_anniversary_date: person.value.wedding_anniversary_date ? person.value.wedding_anniversary_date.split('T')[0] : '',
      generation: person.value.generation || '',
      photo_url: person.value.photo_url || '',
      is_deceased: person.value.is_deceased || false,
      is_admin: person.value.is_admin || false,
    };
  } catch (error) {
    console.error('Error fetching person:', error);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  saving.value = true;
  error.value = null;

  try {
    // If person is not head of household, don't send address fields
    const dataToSend = { ...formData.value };
    if (person.value && !person.value.is_head_of_household) {
      // Remove address fields from the update
      delete dataToSend.address_line1;
      delete dataToSend.address_line2;
      delete dataToSend.city;
      delete dataToSend.state;
      delete dataToSend.postal_code;
      delete dataToSend.country;
    }
    
    await axios.put(`${getApiBaseURL()}/persons/${route.params.id}`, dataToSend);
    router.push(`/person/${route.params.id}`);
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save changes';
  } finally {
    saving.value = false;
  }
}

// Check if a person has other members in their household (not just themselves)
function hasOtherMembersInHousehold(targetPerson) {
  if (!targetPerson.primary_household_id) return false;
  
  // Count how many people are in the same household
  const householdMembers = allPeople.value.filter(p => 
    p.primary_household_id === targetPerson.primary_household_id
  );
  
  // If there's more than just this person, they have other members
  return householdMembers.length > 1;
}

async function fetchAllPeople() {
  loadingPeople.value = true;
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons`);
    allPeople.value = response.data;
    // Pre-select the current person
    selectedHouseholdMembers.value = [person.value.id];
  } catch (error) {
    console.error('Error fetching people:', error);
  } finally {
    loadingPeople.value = false;
  }
}

async function saveHousehold() {
  savingHousehold.value = true;
  try {
    // Get or create household - use 'new' if person doesn't have a household
    let householdId = person.value.primary_household_id;
    if (!householdId) {
      householdId = 'new';
    }
    
    await axios.post(`${getApiBaseURL()}/households/${householdId}/set-head`, {
      headPersonId: person.value.id,
      memberIds: selectedHouseholdMembers.value,
    });

    showHouseholdModal.value = false;
    await fetchPerson(); // Refresh person data
    // Refresh the page to see updated household
    window.location.reload();
  } catch (error) {
    console.error('Error saving household:', error);
    alert(error.response?.data?.error || 'Failed to save household');
  } finally {
    savingHousehold.value = false;
  }
}

async function removeFromHousehold() {
  if (!confirm('Remove this person from their household?')) {
    return;
  }

  try {
    await axios.post(`${getApiBaseURL()}/households/remove-member`, {
      personId: person.value.id,
    });
    await fetchPerson(); // Refresh person data
    window.location.reload();
  } catch (error) {
    console.error('Error removing from household:', error);
    alert(error.response?.data?.error || 'Failed to remove from household');
  }
}

// Watch for modal opening to fetch people
watch(showHouseholdModal, (isOpen) => {
  if (isOpen) {
    fetchAllPeople();
  }
});

onMounted(() => {
  fetchPerson();
});
</script>

