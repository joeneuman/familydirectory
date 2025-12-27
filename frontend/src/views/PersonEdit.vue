<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading...</div>
    </div>

    <div v-else-if="person && person.canEdit">
      <div class="mb-6">
        <router-link :to="`/person/${person.id}`" class="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← Back to Person
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900">Edit</h1>
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
                <label class="block text-sm font-medium text-gray-700">Generation</label>
                <input
                  v-model="formData.generation"
                  type="text"
                  placeholder="G1, G2, G3..."
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  Gender <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="formData.gender"
                  required
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
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
                  maxlength="2"
                  pattern="[A-Za-z]{2}"
                  placeholder="CA"
                  @input="formData.state = formData.state.toUpperCase().replace(/[^A-Z]/g, '')"
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
              <!-- Current photo preview -->
              <div v-if="formData.photo_url" class="mb-4">
                <img 
                  :src="getPhotoURL(formData.photo_url)" 
                  alt="Current photo" 
                  class="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  @click="formData.photo_url = ''"
                  class="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove photo
                </button>
              </div>
              
              <!-- File upload -->
              <label class="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                @change="handlePhotoUpload"
                class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p class="mt-1 text-sm text-gray-500">Upload a photo (JPEG, PNG, GIF, or WebP, max 5MB)</p>
              
              <!-- Upload progress -->
              <div v-if="uploading" class="mt-2 text-sm text-gray-600">
                Uploading...
              </div>
            </div>
          </div>


          <!-- Privacy Settings Link -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h2>
            <p class="text-sm text-gray-600 mb-4">Control who can see your information and which fields to hide from specific people.</p>
            <router-link
              :to="`/person/${person.id}/privacy`"
              class="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
            >
              Manage Privacy Settings
            </router-link>
          </div>

          <!-- Delete button (admin only) - keep in main content -->
          <div v-if="authStore.currentUser?.is_admin" class="pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="handleDelete"
              :disabled="deleting"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <span v-if="deleting">Deleting...</span>
              <span v-else>Delete Contact</span>
            </button>
          </div>
        </div>
      </form>

      <!-- Sticky Footer with Cancel/Save buttons -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-end space-x-4">
            <router-link
              :to="`/person/${person.id}`"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </router-link>
            <button
              v-if="hasChanges"
              type="button"
              @click="handleSubmit"
              :disabled="saving"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <span v-if="saving">Saving...</span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
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

</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { getApiBaseURL, getPhotoURL } from '../utils/api.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const person = ref(null);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const error = ref(null);
// Check if form data has changed
const hasChanges = computed(() => {
  if (!originalFormData.value || !person.value) return false;
  
  // Compare current formData with originalFormData
  const current = formData.value;
  const original = originalFormData.value;
  
  // Compare all fields
  return (
    current.first_name !== original.first_name ||
    current.last_name !== original.last_name ||
    current.full_name !== original.full_name ||
    current.email !== original.email ||
    current.phone !== original.phone ||
    current.address_line1 !== original.address_line1 ||
    current.address_line2 !== original.address_line2 ||
    current.city !== original.city ||
    current.state !== original.state ||
    current.postal_code !== original.postal_code ||
    current.country !== original.country ||
    current.date_of_birth !== original.date_of_birth ||
    current.wedding_anniversary_date !== original.wedding_anniversary_date ||
    current.generation !== original.generation ||
    current.gender !== original.gender ||
    current.photo_url !== original.photo_url ||
    current.is_deceased !== original.is_deceased ||
    current.is_admin !== original.is_admin
  );
});

const originalFormData = ref(null);
const uploading = ref(false);

/**
 * Format a date string for HTML date input (YYYY-MM-DD)
 * Handles timezone issues by extracting just the date part
 * without timezone interpretation
 */
function formatDateForInput(dateString) {
  if (!dateString) return '';
  
  // If it's already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If it has time component, extract just the date part
  // This avoids timezone shifts when parsing ISO strings
  const datePart = dateString.split('T')[0];
  
  // Validate it's in the correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  
  // Fallback: try to parse and format
  try {
    const date = new Date(dateString);
    // Use UTC methods to avoid timezone shifts
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.warn('Invalid date string:', dateString);
    return '';
  }
}

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
  gender: '',
  photo_url: '',
  is_deceased: false,
  is_admin: false,
});


async function fetchPerson() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons/${route.params.id}`);
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
      date_of_birth: person.value.date_of_birth ? formatDateForInput(person.value.date_of_birth) : '',
      wedding_anniversary_date: person.value.wedding_anniversary_date ? formatDateForInput(person.value.wedding_anniversary_date) : '',
      generation: person.value.generation || '',
      gender: person.value.gender || '',
      photo_url: person.value.photo_url || '',
      is_deceased: person.value.is_deceased || false,
      is_admin: person.value.is_admin || false,
    };
    
    // Store original form data for change detection
    originalFormData.value = JSON.parse(JSON.stringify(formData.value));
  } catch (error) {
    console.error('Error fetching person:', error);
  } finally {
    loading.value = false;
  }
}

async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'File size must be less than 5MB';
    return;
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Only image files are allowed (JPEG, PNG, GIF, WebP)';
    return;
  }

  uploading.value = true;
  error.value = null;

  try {
    const uploadFormData = new FormData();
    uploadFormData.append('photo', file);

    const response = await axios.post(`${getApiBaseURL()}/upload/photo`, uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Update the photo_url with the returned path
    formData.value.photo_url = response.data.photo_url;
  } catch (err) {
    console.error('Error uploading photo:', err);
    error.value = err.response?.data?.error || 'Failed to upload photo';
  } finally {
    uploading.value = false;
  }
}

async function handleSubmit() {
  saving.value = true;
  error.value = null;

  try {
    // If person is not head of household, don't send address fields
    const dataToSend = { ...formData.value };
    
    // Don't send gender if it's empty (for existing records that don't have gender set yet)
    if (!dataToSend.gender || dataToSend.gender === '') {
      delete dataToSend.gender;
    }
    
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


async function handleDelete() {
  const personName = person.value.full_name || `${person.value.first_name} ${person.value.last_name}`;
  if (!confirm(`Are you sure you want to delete ${personName}? This action cannot be undone.`)) {
    return;
  }

  deleting.value = true;
  error.value = null;

  try {
    await axios.delete(`${getApiBaseURL()}/persons/${route.params.id}`);
    // Redirect to directory after successful deletion
    router.push('/directory');
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to delete contact';
    deleting.value = false;
  }
}

onMounted(async () => {
  // Ensure current user is loaded
  if (!authStore.currentUser) {
    await authStore.fetchCurrentUser();
  }
  fetchPerson();
});
</script>

