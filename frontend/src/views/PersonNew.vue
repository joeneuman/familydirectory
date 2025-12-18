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
            <div class="flex items-center">
              <input
                v-model="formData.is_deceased"
                type="checkbox"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label class="ml-2 block text-sm font-medium text-gray-700">Is Deceased</label>
            </div>
            <div class="flex items-center">
              <input
                v-model="isHeadOfHousehold"
                type="checkbox"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label class="ml-2 block text-sm font-medium text-gray-700">Head of Household</label>
            </div>
          </div>
        </div>

        <!-- Address (only shown if head of household) -->
        <div v-if="isHeadOfHousehold">
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

const router = useRouter();
const authStore = useAuthStore();
const saving = ref(false);
const error = ref(null);
const isHeadOfHousehold = ref(false);

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
});

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
  }
});

async function handleSubmit() {
  saving.value = true;
  error.value = null;

  try {
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

    // Create the person first
    const response = await axios.post('/api/persons', formData.value);
    const newPersonId = response.data.id;

    // If head of household is checked, create household and set as head
    if (isHeadOfHousehold.value) {
      try {
        await axios.post('/api/households/new/set-head', {
          headPersonId: newPersonId,
          memberIds: [newPersonId], // Just the head for now
        });
      } catch (householdError) {
        console.error('Error creating household:', householdError);
        // Continue anyway - person is created, household can be set up later
      }
    }

    router.push(`/person/${newPersonId}`);
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create contact';
  } finally {
    saving.value = false;
  }
}
</script>

