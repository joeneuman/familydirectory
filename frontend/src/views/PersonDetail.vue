<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading...</div>
    </div>

    <div v-else-if="person">
      <div class="mb-6">
        <router-link to="/directory" class="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← Back to Directory
        </router-link>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <!-- Header with photo and name -->
        <div class="flex flex-col sm:flex-row gap-6 mb-6">
          <div v-if="person.photo_url" class="flex-shrink-0">
            <img
              :src="getPhotoURL(person.photo_url)"
              :alt="person.full_name || `${person.first_name} ${person.last_name}`"
              class="w-32 h-32 rounded-full object-cover"
            />
          </div>
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              {{ person.full_name || `${person.first_name} ${person.last_name}` }}
            </h1>
            <div class="text-gray-600 space-y-1">
              <div v-if="person.generation">Generation: {{ person.generation }}</div>
              <div v-if="person.is_deceased" class="text-red-600 font-medium">Deceased</div>
            </div>
          </div>
          <div v-if="person.canEdit" class="flex-shrink-0">
            <router-link
              :to="`/person/${person.id}/edit`"
              class="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Edit Info
            </router-link>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="border-t border-gray-200 pt-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Email</dt>
              <dd :class="isRecentChange('email') ? 'recent-change p-2 rounded' : ''" class="mt-1 text-sm text-gray-900">
                {{ person.email || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Phone</dt>
              <dd :class="isRecentChange('phone') ? 'recent-change p-2 rounded' : ''" class="mt-1 text-sm text-gray-900">
                {{ person.phone || '—' }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Address -->
        <div v-if="person.address_line1 || person.city" class="border-t border-gray-200 pt-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Address</h2>
          <div :class="isRecentChange('address') ? 'recent-change p-3 rounded' : ''" class="text-sm text-gray-900">
            <div v-if="person.address_line1">{{ person.address_line1 }}</div>
            <div v-if="person.address_line2">{{ person.address_line2 }}</div>
            <div v-if="person.city || person.state || person.postal_code">
              {{ [person.city, person.state, person.postal_code].filter(Boolean).join(', ') }}
            </div>
            <div v-if="person.country">{{ person.country }}</div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="border-t border-gray-200 pt-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd :class="isRecentChange('date_of_birth') ? 'recent-change p-2 rounded' : ''" class="mt-1 text-sm text-gray-900">
                {{ formatDate(person.date_of_birth) || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Age</dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ person.age || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Wedding Anniversary</dt>
              <dd :class="isRecentChange('wedding_anniversary_date') ? 'recent-change p-2 rounded' : ''" class="mt-1 text-sm text-gray-900">
                {{ formatDate(person.wedding_anniversary_date) || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Years Married</dt>
              <dd class="mt-1 text-sm text-gray-900">
                {{ person.years_married || '—' }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Relationships -->
        <div class="border-t border-gray-200 pt-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Relationships</h2>
          <div class="space-y-4">
            <div v-if="person.spouse">
              <dt class="text-sm font-medium text-gray-500">Spouse</dt>
              <dd class="mt-1">
                <router-link
                  :to="`/person/${person.spouse.id}`"
                  class="text-indigo-600 hover:text-indigo-800"
                >
                  {{ person.spouse.full_name || `${person.spouse.first_name} ${person.spouse.last_name}` }}
                </router-link>
              </dd>
            </div>
            <div v-if="person.parents && person.parents.length > 0">
              <dt class="text-sm font-medium text-gray-500">Parents</dt>
              <dd class="mt-1 space-y-1">
                <div v-for="parent in person.parents" :key="parent.id">
                  <router-link
                    :to="`/person/${parent.id}`"
                    class="text-indigo-600 hover:text-indigo-800"
                  >
                    {{ parent.full_name || `${parent.first_name} ${parent.last_name}` }}
                  </router-link>
                </div>
              </dd>
            </div>
            <div v-if="person.children && person.children.length > 0">
              <dt class="text-sm font-medium text-gray-500">Children</dt>
              <dd class="mt-1 space-y-1">
                <div v-for="child in person.children" :key="child.id">
                  <router-link
                    :to="`/person/${child.id}`"
                    class="text-indigo-600 hover:text-indigo-800"
                  >
                    {{ child.full_name || `${child.first_name} ${child.last_name}` }}
                  </router-link>
                </div>
              </dd>
            </div>
            <div v-if="!person.spouse && (!person.parents || person.parents.length === 0) && (!person.children || person.children.length === 0)">
              <p class="text-gray-600 text-sm">No relationships recorded</p>
            </div>
          </div>
        </div>

        <!-- Recent Changes Legend -->
        <div v-if="hasRecentChanges" class="border-t border-gray-200 pt-6 mt-6">
          <p class="text-sm text-gray-600">
            <span class="inline-block w-4 h-4 bg-yellow-200 rounded mr-2 align-middle"></span>
            Fields in this color were updated less than 3 months ago.
          </p>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-red-600">Person not found</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { format, parseISO, subMonths } from 'date-fns';
import { getApiBaseURL, getPhotoURL } from '../utils/api.js';

const route = useRoute();
const person = ref(null);
const loading = ref(true);

const hasRecentChanges = computed(() => {
  if (!person.value) return false;
  const threeMonthsAgo = subMonths(new Date(), 3);
  
  return isRecentChange('email') || 
         isRecentChange('phone') || 
         isRecentChange('address') || 
         isRecentChange('date_of_birth') || 
         isRecentChange('wedding_anniversary_date');
});

/**
 * Parse a date string in a timezone-agnostic way
 * Extracts just the date part (YYYY-MM-DD) to avoid timezone shifts
 */
function parseDateOnly(dateString) {
  if (!dateString) return null;
  
  // Extract just the date part (YYYY-MM-DD)
  const datePart = dateString.split('T')[0];
  
  // Parse the date components directly to avoid timezone issues
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create a date using local date components (not UTC)
  // This ensures the date displays correctly regardless of server timezone
  return new Date(year, month - 1, day);
}

function formatDate(dateString) {
  if (!dateString) return null;
  try {
    const date = parseDateOnly(dateString);
    if (!date || isNaN(date.getTime())) return dateString;
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

function isRecentChange(field) {
  if (!person.value) return false;
  const threeMonthsAgo = subMonths(new Date(), 3);
  
  if (field === 'email') {
    return person.value.last_modified_at && parseISO(person.value.last_modified_at) > threeMonthsAgo;
  }
  if (field === 'phone') {
    return person.value.phone_last_modified_at && parseISO(person.value.phone_last_modified_at) > threeMonthsAgo;
  }
  if (field === 'address') {
    return (person.value.address_line1_last_modified_at && parseISO(person.value.address_line1_last_modified_at) > threeMonthsAgo) ||
           (person.value.city_last_modified_at && parseISO(person.value.city_last_modified_at) > threeMonthsAgo);
  }
  if (field === 'date_of_birth') {
    return person.value.date_of_birth_last_modified_at && parseISO(person.value.date_of_birth_last_modified_at) > threeMonthsAgo;
  }
  if (field === 'wedding_anniversary_date') {
    return person.value.wedding_anniversary_date_last_modified_at && parseISO(person.value.wedding_anniversary_date_last_modified_at) > threeMonthsAgo;
  }
  return false;
}

async function fetchPerson() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons/${route.params.id}`);
    person.value = response.data;
  } catch (error) {
    console.error('Error fetching person:', error);
  } finally {
    loading.value = false;
  }
}


onMounted(() => {
  fetchPerson();
});
</script>

