<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <router-link to="/directory" class="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        ← Back to Directory
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">Add New Contact</h1>
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
            <div v-if="formData.generation && formData.generation !== 'G1'">
              <label class="block text-sm font-medium text-gray-700">
                Mother <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.mother_id"
                :required="formData.generation && formData.generation !== 'G1'"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Mother</option>
                <option value="NOT_LISTED">Not listed here</option>
                <option v-for="p in allPeople" :key="p.id" :value="p.id">
                  {{ p.full_name || `${p.first_name} ${p.last_name}` }}
                </option>
              </select>
            </div>
            <div v-if="formData.generation && formData.generation !== 'G1'">
              <label class="block text-sm font-medium text-gray-700">
                Father <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.father_id"
                :required="formData.generation && formData.generation !== 'G1'"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Father</option>
                <option value="NOT_LISTED">Not listed here</option>
                <option v-for="p in allPeople" :key="p.id" :value="p.id">
                  {{ p.full_name || `${p.first_name} ${p.last_name}` }}
                </option>
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
            <div class="flex items-center">
              <input
                v-model="formData.is_deceased"
                type="checkbox"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label class="ml-2 block text-sm font-medium text-gray-700">Is Deceased</label>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Address</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Address Line 1</label>
              <input
                v-model="formData.address_line1"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Address Line 2</label>
              <input
                v-model="formData.address_line2"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">City</label>
              <input
                v-model="formData.city"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                v-model="formData.postal_code"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Country</label>
              <input
                v-model="formData.country"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                alt="Photo preview" 
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

        <!-- Buttons -->
        <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <router-link
            to="/directory"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </router-link>
          <button
            type="submit"
            :disabled="saving"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <span v-if="saving">Creating...</span>
            <span v-else>Create Contact</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { differenceInYears, parseISO } from 'date-fns';
import { useAuthStore } from '../stores/auth';
import { getApiBaseURL, getPhotoURL } from '../utils/api.js';

const router = useRouter();
const authStore = useAuthStore();
const saving = ref(false);
const error = ref(null);
const uploading = ref(false);

const formData = ref({
  first_name: '',
  last_name: '',
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
  mother_id: null,
  father_id: null,
});

const allPeople = ref([]);

async function fetchAllPeople() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons`);
    allPeople.value = response.data;
  } catch (err) {
    console.error('Error fetching people:', err);
  }
}

onMounted(async () => {
  // Check if user is admin
  if (!authStore.currentUser) {
    await authStore.fetchCurrentUser();
  }
  
  if (!authStore.currentUser || !authStore.currentUser.is_admin) {
    error.value = 'Only administrators can add new contacts';
    // Redirect after a moment
    setTimeout(() => {
      router.push('/directory');
    }, 2000);
  } else {
    // Fetch all people for mother/father dropdowns
    await fetchAllPeople();
  }
});

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
    // Validate: mother_id and father_id are required for non-G1
    if (formData.value.generation && formData.value.generation !== 'G1') {
      const motherId = formData.value.mother_id === 'NOT_LISTED' ? null : formData.value.mother_id;
      const fatherId = formData.value.father_id === 'NOT_LISTED' ? null : formData.value.father_id;
      
      if (!motherId && !fatherId) {
        error.value = 'Please select a Mother or Father, or choose "Not listed here" for both';
        saving.value = false;
        return;
      }
    }

    // Convert "NOT_LISTED" to null for backend
    if (formData.value.mother_id === 'NOT_LISTED') {
      formData.value.mother_id = null;
    }
    if (formData.value.father_id === 'NOT_LISTED') {
      formData.value.father_id = null;
    }

    // Calculate age if date_of_birth is provided
    if (formData.value.date_of_birth) {
      try {
        const dob = parseISO(formData.value.date_of_birth);
        formData.value.age = differenceInYears(new Date(), dob);
      } catch (e) {
        // Invalid date, skip age calculation
      }
    }

    // Calculate years_married if wedding_anniversary_date is provided
    if (formData.value.wedding_anniversary_date) {
      try {
        const annDate = parseISO(formData.value.wedding_anniversary_date);
        formData.value.years_married = differenceInYears(new Date(), annDate);
      } catch (e) {
        // Invalid date, skip calculation
      }
    }

    // Create the person
    const response = await axios.post(`${getApiBaseURL()}/persons`, formData.value);
    const newPersonId = response.data.id;

    router.push(`/person/${newPersonId}`);
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create contact';
  } finally {
    saving.value = false;
  }
}
</script>

