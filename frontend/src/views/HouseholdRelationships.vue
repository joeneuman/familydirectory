<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-12">
      <div class="text-soft-600">Loading...</div>
    </div>

    <div v-else-if="person && person.canEdit">
      <div class="mb-6">
        <router-link :to="`/person/${person.id}/edit`" class="text-warm-600 hover:text-warm-700 mb-4 inline-block font-medium transition-colors duration-200">
          ← Back to Edit
        </router-link>
      </div>

      <div class="card">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Household/Relationships</h1>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {{ error }}
        </div>

        <!-- Household Management -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Household Management</h2>
          
          <div v-if="loadingPeople" class="text-center py-4">
            <div class="text-gray-600">Loading...</div>
          </div>

          <div v-else class="space-y-4">
            <!-- Spouse Selection -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <label class="block text-sm font-medium text-gray-700 mb-2">Select Spouse (Optional)</label>
              <select
                v-model="selectedSpouse"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option :value="null">None</option>
                <option
                  v-for="p in allPeople.filter(p => p.id !== person.id)"
                  :key="p.id"
                  :value="p.id"
                >
                  {{ p.full_name || `${p.first_name} ${p.last_name}` }}
                </option>
              </select>
              <p class="mt-1 text-xs text-gray-500">Select a spouse to show them directly under you in the family view and combine anniversaries in the event view.</p>
            </div>

            <!-- Household Members Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Household Members</label>
              <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4">
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
                    :disabled="p.id === person.id"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label 
                    :for="`person-${p.id}`" 
                    class="ml-3 flex-1 cursor-pointer"
                  >
                    <span class="text-sm font-medium text-gray-900">
                      {{ p.full_name || `${p.first_name} ${p.last_name}` }}
                    </span>
                    <span v-if="p.id === person.id" class="ml-2 text-xs text-gray-500">(Head)</span>
                    <span v-if="p.primary_household_id && p.id !== person.id" class="ml-2 text-xs text-orange-600">
                      (Currently in Another Household)
                    </span>
                    <span v-if="selectedSpouse === p.id" class="ml-2 text-xs text-indigo-600">
                      (Spouse)
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Remove from Household -->
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

        <!-- Parent Relationships -->
        <div v-if="person.generation && person.generation !== 'G1'" class="border-t border-gray-200 pt-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Parent Relationships</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Mother <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.mother_id"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Mother</option>
                <option value="NOT_LISTED">Not listed here</option>
                <option v-for="p in availableMothers" :key="p.id" :value="p.id">
                  {{ p.full_name || `${p.first_name} ${p.last_name}` }}
                </option>
              </select>
              <div v-if="formData.mother_id && formData.mother_id !== '' && formData.mother_id !== 'NOT_LISTED'" class="mt-2">
                <label class="block text-sm font-medium text-gray-700">
                  Mother Relationship Type
                </label>
                <select
                  v-model="formData.mother_relationship_type"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="biological">Biological Parent</option>
                  <option value="step">Stepparent</option>
                  <option value="in-law">Mother-in-law</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Father <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.father_id"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Father</option>
                <option value="NOT_LISTED">Not listed here</option>
                <option v-for="p in availableFathers" :key="p.id" :value="p.id">
                  {{ p.full_name || `${p.first_name} ${p.last_name}` }}
                </option>
              </select>
              <div v-if="formData.father_id && formData.father_id !== '' && formData.father_id !== 'NOT_LISTED'" class="mt-2">
                <label class="block text-sm font-medium text-gray-700">
                  Father Relationship Type
                </label>
                <select
                  v-model="formData.father_relationship_type"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="biological">Biological Parent</option>
                  <option value="step">Stepparent</option>
                  <option value="in-law">Father-in-law</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Footer with Cancel/Save buttons -->
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-end space-x-4">
              <router-link
                :to="`/person/${person.id}/edit`"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </router-link>
              <button
                v-if="hasChanges || hasHouseholdChanges"
                type="button"
                @click="handleSubmit"
                :disabled="saving || savingHousehold"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                <span v-if="saving || savingHousehold">Saving...</span>
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="person && !person.canEdit" class="text-center py-12">
      <div class="text-red-600">You do not have permission to edit this person</div>
      <router-link :to="`/person/${person.id}`" class="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
        Back to Person Detail
      </router-link>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-red-600">Person not found</div>
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
const allPeople = ref([]);
const selectedHouseholdMembers = ref([]);
const selectedSpouse = ref(null);
const loadingPeople = ref(false);
const savingHousehold = ref(false);

const formData = ref({
  mother_id: null,
  father_id: null,
  mother_relationship_type: 'biological',
  father_relationship_type: 'biological',
});

const originalFormData = ref(null);
const originalHouseholdData = ref(null);

// Computed properties for mother/father dropdowns
const availableMothers = computed(() => {
  return allPeople.value.filter(p => p.id !== person.value?.id);
});

const availableFathers = computed(() => {
  return allPeople.value.filter(p => p.id !== person.value?.id);
});

// Check if form data has changed
const hasChanges = computed(() => {
  if (!originalFormData.value || !person.value) return false;
  
  const current = formData.value;
  const original = originalFormData.value;
  
  return (
    current.mother_id !== original.mother_id ||
    current.father_id !== original.father_id ||
    current.mother_relationship_type !== original.mother_relationship_type ||
    current.father_relationship_type !== original.father_relationship_type
  );
});

// Check if household data has changed
const hasHouseholdChanges = computed(() => {
  if (!originalHouseholdData.value || !person.value) return false;
  
  const currentSpouse = selectedSpouse.value;
  const originalSpouse = originalHouseholdData.value.spouse;
  
  const currentMembers = [...selectedHouseholdMembers.value].sort();
  const originalMembers = [...originalHouseholdData.value.members].sort();
  
  return (
    currentSpouse !== originalSpouse ||
    JSON.stringify(currentMembers) !== JSON.stringify(originalMembers)
  );
});

async function fetchPerson() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons/${route.params.id}`);
    person.value = response.data;
    
    // Populate form
    formData.value = {
      mother_id: person.value.mother_id ? person.value.mother_id : (person.value.generation && person.value.generation !== 'G1' ? 'NOT_LISTED' : null),
      father_id: person.value.father_id ? person.value.father_id : (person.value.generation && person.value.generation !== 'G1' ? 'NOT_LISTED' : null),
      mother_relationship_type: person.value.mother_relationship_type || 'biological',
      father_relationship_type: person.value.father_relationship_type || 'biological',
    };
    
    // Store original form data for change detection
    originalFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (error) {
    console.error('Error fetching person:', error);
  } finally {
    loading.value = false;
  }
}

async function initializeHouseholdData() {
  // Pre-select the current person
  selectedHouseholdMembers.value = [person.value.id];
  
  // Pre-select current household members
  if (person.value.primary_household_id) {
    const currentMembers = allPeople.value.filter(p => 
      p.primary_household_id === person.value.primary_household_id
    );
    const memberIds = currentMembers.map(m => m.id);
    selectedHouseholdMembers.value = [...new Set([...selectedHouseholdMembers.value, ...memberIds])];
  }
  
  // Pre-select current spouse if exists
  if (person.value.spouse) {
    selectedSpouse.value = person.value.spouse.id;
  }
  
  // Store original household data for change detection
  originalHouseholdData.value = {
    spouse: selectedSpouse.value,
    members: [...selectedHouseholdMembers.value],
  };
}

async function handleSubmit() {
  saving.value = true;
  error.value = null;

  try {
    // Save parent relationships if changed
    if (hasChanges.value) {
      // Validate: mother_id and father_id are required for non-G1
      if (person.value.generation && person.value.generation !== 'G1') {
        const motherSelected = formData.value.mother_id && formData.value.mother_id !== '';
        const fatherSelected = formData.value.father_id && formData.value.father_id !== '';
        
        if (!motherSelected && !fatherSelected) {
          error.value = 'Please select a Mother or Father, or choose "Not listed here" for at least one';
          saving.value = false;
          return;
        }
      }

      const dataToSend = { ...formData.value };
      
      // Convert "NOT_LISTED" to null for backend
      if (dataToSend.mother_id === 'NOT_LISTED') {
        dataToSend.mother_id = null;
        dataToSend.mother_relationship_type = 'biological';
      }
      if (dataToSend.father_id === 'NOT_LISTED') {
        dataToSend.father_id = null;
        dataToSend.father_relationship_type = 'biological';
      }
      
      // Only send relationship types if parent is selected
      if (!dataToSend.mother_id) {
        delete dataToSend.mother_relationship_type;
      }
      if (!dataToSend.father_id) {
        delete dataToSend.father_relationship_type;
      }
      
      await axios.put(`${getApiBaseURL()}/persons/${route.params.id}`, dataToSend);
    }
    
    // Save household if changed
    if (hasHouseholdChanges.value) {
      await saveHousehold();
    }
    
    router.push(`/person/${route.params.id}/edit`);
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save changes';
    saving.value = false;
  } finally {
    saving.value = false;
  }
}

async function fetchAllPeople() {
  loadingPeople.value = true;
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons`);
    allPeople.value = response.data;
    
    // Pre-select the current person
    selectedHouseholdMembers.value = [person.value.id];
    
    // Pre-select current household members
    if (person.value.primary_household_id) {
      const currentMembers = allPeople.value.filter(p => 
        p.primary_household_id === person.value.primary_household_id
      );
      const memberIds = currentMembers.map(m => m.id);
      selectedHouseholdMembers.value = [...new Set([...selectedHouseholdMembers.value, ...memberIds])];
    }
    
    // Pre-select current spouse if exists
    if (person.value.spouse) {
      selectedSpouse.value = person.value.spouse.id;
    }
  } catch (error) {
    console.error('Error fetching people:', error);
  } finally {
    loadingPeople.value = false;
  }
}

async function saveHousehold() {
  savingHousehold.value = true;
  try {
    let householdId = person.value.primary_household_id;
    if (!householdId) {
      householdId = 'new';
    }
    
    await axios.post(`${getApiBaseURL()}/households/${householdId}/set-head`, {
      headPersonId: person.value.id,
      memberIds: selectedHouseholdMembers.value,
    });

    if (selectedSpouse.value) {
      await axios.post(`${getApiBaseURL()}/persons/${person.value.id}/set-spouse`, {
        spouseId: selectedSpouse.value,
      });
    } else if (person.value.spouse) {
      await axios.delete(`${getApiBaseURL()}/persons/${person.value.id}/spouse`);
    }

    await fetchPerson();
    await initializeHouseholdData();
  } catch (error) {
    console.error('Error saving household:', error);
    throw error; // Re-throw to be handled by handleSubmit
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
    await fetchPerson();
    window.location.reload();
  } catch (error) {
    console.error('Error removing from household:', error);
    alert(error.response?.data?.error || 'Failed to remove from household');
  }
}

onMounted(async () => {
  if (!authStore.currentUser) {
    await authStore.fetchCurrentUser();
  }
  await fetchPerson();
  await fetchAllPeople();
  await initializeHouseholdData();
});
</script>

