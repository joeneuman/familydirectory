<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <!-- Search and Sort -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or phone..."
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="showFilterModal = true"
            class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-2"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <select
            v-model="sortBy"
            class="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="household">Household</option>
            <option value="next_event">Next Event</option>
            <option value="age_asc">Youngest View</option>
            <option value="age_desc">Oldest View</option>
            <option value="generation">Generation</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- People List -->
    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading...</div>
    </div>

    <div v-else-if="sortBy !== 'next_event' && ((sortBy === 'household' && householdsWithMembers.length === 0 && personsWithoutHousehold.length === 0) || (sortBy !== 'household' && filteredPersons.length === 0))" class="text-center py-12">
      <div class="text-gray-600">No people found</div>
    </div>

    <div v-else-if="sortBy === 'next_event' && scheduleView.length === 0" class="text-center py-12">
      <div class="text-gray-600">No upcoming events in the next 12 months</div>
    </div>

    <div v-else class="space-y-4">
      <!-- Schedule/Calendar view for Next Event -->
      <template v-if="sortBy === 'next_event'">
        <div
          v-for="dateGroup in scheduleView"
          :key="dateGroup.date"
          class="mb-6"
        >
          <!-- Date Card -->
          <div class="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-4">
            <h3 class="text-lg font-bold text-gray-900 mb-3">
              {{ formatScheduleDate(dateGroup.date) }}
            </h3>
            
            <!-- Events on this date -->
            <div class="space-y-2">
              <div
                v-for="event in dateGroup.events"
                :key="event.id"
                class="bg-gray-50 rounded-md p-3 border border-gray-200"
              >
                <router-link :to="`/person/${event.personId}`" class="block">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 flex items-start gap-3">
                      <!-- Photo -->
                      <div v-if="displayFilters.photo && event.photo_url" class="flex-shrink-0">
                        <img :src="getPhotoURL(event.photo_url)" :alt="event.name" class="w-12 h-12 rounded-full object-cover" />
                      </div>
                      <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 mb-1">{{ event.name }}</h4>
                        <!-- Show address if filter is on (full width) -->
                        <div v-if="displayFilters.address && event.address" class="text-sm text-gray-600 mb-2 whitespace-pre-line">
                          {{ event.address }}
                        </div>
                        <div class="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <!-- Show birthday if it exists and filter allows -->
                          <div v-if="event.hasBirthday && displayFilters.birthday" class="flex items-center">
                            <span class="font-medium text-indigo-600 mr-1">🎂 Birthday</span>
                            <span v-if="event.birthdayAge !== null && event.birthdayAge !== undefined">({{ event.birthdayAge }} years old)</span>
                          </div>
                          <!-- Show anniversary if it exists and filter allows -->
                          <div v-if="event.hasAnniversary && displayFilters.anniversary" class="flex items-center">
                            <span class="font-medium text-pink-600 mr-1">💍 Anniversary</span>
                            <span v-if="event.anniversaryYears !== null && event.anniversaryYears !== undefined">({{ event.anniversaryYears }} years)</span>
                          </div>
                          <div v-if="displayFilters.generation && event.generation" class="flex items-center">
                            <span class="font-medium mr-1">Gen:</span> {{ event.generation }}
                          </div>
                          <div v-if="displayFilters.email && event.email" class="flex items-center">
                            <span class="font-medium mr-1">Email:</span> {{ event.email }}
                          </div>
                          <a v-if="displayFilters.phone && event.phone" :href="`tel:${event.phone}`" class="flex items-center text-indigo-600 hover:text-indigo-800">
                            <span class="font-medium mr-1">Phone:</span> {{ event.phone }}
                          </a>
                        </div>
                      </div>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Group by household if household sort is selected -->
      <template v-else-if="sortBy === 'household'">
        <!-- Grouped by Household -->
        <template v-for="(household, index) in householdsWithMembers" :key="household.id">
          <div class="mt-4">
            <!-- Household Members - Head of household first, with bold name and address -->
            <!-- Box container around household -->
            <div class="border-t-4 border-l-4 border-r-4 border-gray-300">
              <div class="space-y-3 px-3 pt-3 pb-3">
                <template v-for="(person, personIndex) in getSortedHouseholdMembers(household.id)" :key="person.id">
                  <div
                    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                  <router-link :to="`/person/${person.id}`" class="block">
                    <div class="flex items-start justify-between">
                    <div class="flex-1 flex items-start gap-3">
                      <!-- Photo -->
                      <div v-if="displayFilters.photo && person.photo_url" class="flex-shrink-0">
                        <img :src="getPhotoURL(person.photo_url)" :alt="person.full_name || `${person.first_name} ${person.last_name}`" class="w-16 h-16 rounded-full object-cover" />
                      </div>
                      <div class="flex-1">
                        <!-- Bold name if head of household -->
                        <h3 :class="isHeadOfHousehold(household.id, person.id) ? 'text-lg font-extrabold text-gray-900 mb-1' : 'text-lg font-semibold text-gray-900 mb-1'">
                          {{ person.full_name || `${person.first_name} ${person.last_name}` }}
                        </h3>
                        <!-- Show address only for head of household (full width) -->
                        <div v-if="displayFilters.address && isHeadOfHousehold(household.id, person.id) && household.address" class="text-sm text-gray-600 mb-2 whitespace-pre-line">
                          {{ household.address }}
                        </div>
                        <!-- Horizontal layout for other fields -->
                        <div class="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <div v-if="displayFilters.generation && person.generation" class="flex items-center">
                            <span class="font-medium mr-1">Gen:</span> {{ person.generation }}
                          </div>
                          <div v-if="displayFilters.age && person.age !== null && person.age !== undefined" class="flex items-center">
                            <span class="font-medium mr-1">Age:</span> {{ person.age }}
                          </div>
                          <div v-if="displayFilters.birthday && person.date_of_birth" class="flex items-center">
                            <span class="font-medium mr-1">Bday:</span> {{ formatDateShort(person.date_of_birth) }}
                          </div>
                          <div v-if="displayFilters.anniversary && person.wedding_anniversary_date" class="flex items-center">
                            <span class="font-medium mr-1">Anniv:</span> {{ formatDateShort(person.wedding_anniversary_date) }}
                          </div>
                          <div v-if="displayFilters.years_married && person.years_married !== null && person.years_married !== undefined" class="flex items-center">
                            <span class="font-medium mr-1">Yrs Married:</span> {{ person.years_married }}
                          </div>
                          <div v-if="displayFilters.email && person.email" class="flex items-center">
                            <span class="font-medium mr-1">Email:</span> {{ person.email }}
                          </div>
                          <a v-if="displayFilters.phone && person.phone" :href="`tel:${person.phone}`" class="flex items-center text-indigo-600 hover:text-indigo-800">
                            <span class="font-medium mr-1">Phone:</span> {{ person.phone }}
                          </a>
                          <!-- Don't show city/state if address is already shown for head -->
                          <div v-if="displayFilters.location && !isHeadOfHousehold(household.id, person.id) && (person.city || person.state)" class="flex items-center">
                            <span class="font-medium mr-1">Location:</span> {{ [person.city, person.state].filter(Boolean).join(', ') }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </router-link>
                  </div>
                </template>
              </div>
              <!-- Bottom border to close the box -->
              <div class="border-b-4 border-gray-300"></div>
            </div>
          </div>
        </template>

        <!-- People without households (each is their own head) -->
        <template v-if="personsWithoutHousehold.length > 0">
          <template v-for="(person, index) in personsWithoutHousehold" :key="person.id">
            <!-- Box container around person without household -->
            <div class="mt-4">
              <div class="border-t-4 border-l-4 border-r-4 border-gray-300">
                <div class="px-3 pt-3 pb-3">
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <router-link :to="`/person/${person.id}`" class="block">
                    <div class="flex items-start justify-between">
                      <div class="flex-1 flex items-start gap-3">
                        <!-- Photo -->
                        <div v-if="displayFilters.photo && person.photo_url" class="flex-shrink-0">
                          <img :src="getPhotoURL(person.photo_url)" :alt="person.full_name || `${person.first_name} ${person.last_name}`" class="w-16 h-16 rounded-full object-cover" />
                        </div>
                        <div class="flex-1">
                          <!-- Bold name (they're their own head) -->
                          <h3 class="text-lg font-extrabold text-gray-900 mb-1">
                            {{ person.full_name || `${person.first_name} ${person.last_name}` }}
                          </h3>
                          <!-- Show address if they have one (full width) -->
                          <div v-if="displayFilters.address && getPersonAddress(person)" class="text-sm text-gray-600 mb-2 whitespace-pre-line">
                            {{ getPersonAddress(person) }}
                          </div>
                          <!-- Horizontal layout for other fields -->
                          <div class="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div v-if="displayFilters.generation && person.generation" class="flex items-center">
                              <span class="font-medium mr-1">Gen:</span> {{ person.generation }}
                            </div>
                            <div v-if="displayFilters.age && person.age !== null && person.age !== undefined" class="flex items-center">
                              <span class="font-medium mr-1">Age:</span> {{ person.age }}
                            </div>
                            <div v-if="displayFilters.birthday && person.date_of_birth" class="flex items-center">
                              <span class="font-medium mr-1">Bday:</span> {{ formatDateShort(person.date_of_birth) }}
                            </div>
                            <div v-if="displayFilters.anniversary && person.wedding_anniversary_date" class="flex items-center">
                              <span class="font-medium mr-1">Anniv:</span> {{ formatDateShort(person.wedding_anniversary_date) }}
                            </div>
                            <div v-if="displayFilters.years_married && person.years_married !== null && person.years_married !== undefined" class="flex items-center">
                              <span class="font-medium mr-1">Yrs Married:</span> {{ person.years_married }}
                            </div>
                            <div v-if="displayFilters.email && person.email" class="flex items-center">
                              <span class="font-medium mr-1">Email:</span> {{ person.email }}
                            </div>
                            <a v-if="displayFilters.phone && person.phone" :href="`tel:${person.phone}`" class="flex items-center text-indigo-600 hover:text-indigo-800">
                              <span class="font-medium mr-1">Phone:</span> {{ person.phone }}
                            </a>
                          </div>
                        </div>
                      </div>
                      <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </router-link>
                  </div>
                </div>
                <!-- Bottom border to close the box -->
                <div class="border-b-4 border-gray-300"></div>
              </div>
            </div>
          </template>
        </template>
      </template>

      <template v-else-if="sortBy !== 'next_event'">
        <!-- Flat list when sorting or searching -->
        <div
          v-for="person in filteredPersons"
          :key="person.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <router-link :to="`/person/${person.id}`" class="block">
              <div class="flex items-start justify-between">
                <div class="flex-1 flex items-start gap-3">
                  <!-- Photo -->
                  <div v-if="displayFilters.photo && person.photo_url" class="flex-shrink-0">
                    <img :src="getPhotoURL(person.photo_url)" :alt="person.full_name || `${person.first_name} ${person.last_name}`" class="w-16 h-16 rounded-full object-cover" />
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">
                      {{ person.full_name || `${person.first_name} ${person.last_name}` }}
                    </h3>
                    <!-- Show address if filter is on (full width) -->
                    <div v-if="displayFilters.address && getPersonAddress(person)" class="text-sm text-gray-600 mb-2 whitespace-pre-line">
                      {{ getPersonAddress(person) }}
                    </div>
                    <div class="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div v-if="displayFilters.generation && person.generation" class="flex items-center">
                        <span class="font-medium mr-1">Gen:</span> {{ person.generation }}
                      </div>
                      <div v-if="displayFilters.age && person.age !== null && person.age !== undefined" class="flex items-center">
                        <span class="font-medium mr-1">Age:</span> {{ person.age }}
                      </div>
                      <div v-if="displayFilters.birthday && person.date_of_birth" class="flex items-center">
                        <span class="font-medium mr-1">Bday:</span> {{ formatDateShort(person.date_of_birth) }}
                      </div>
                      <div v-if="displayFilters.anniversary && person.wedding_anniversary_date" class="flex items-center">
                        <span class="font-medium mr-1">Anniv:</span> {{ formatDateShort(person.wedding_anniversary_date) }}
                      </div>
                      <div v-if="displayFilters.years_married && person.years_married !== null && person.years_married !== undefined" class="flex items-center">
                        <span class="font-medium mr-1">Yrs Married:</span> {{ person.years_married }}
                      </div>
                      <div v-if="displayFilters.email && person.email" class="flex items-center">
                        <span class="font-medium mr-1">Email:</span> {{ person.email }}
                      </div>
                      <a v-if="displayFilters.phone && person.phone" :href="`tel:${person.phone}`" class="flex items-center text-indigo-600 hover:text-indigo-800">
                        <span class="font-medium mr-1">Phone:</span> {{ person.phone }}
                      </a>
                      <div v-if="displayFilters.location && (person.city || person.state)" class="flex items-center">
                        <span class="font-medium mr-1">Location:</span> {{ [person.city, person.state].filter(Boolean).join(', ') }}
                      </div>
                    </div>
                  </div>
                </div>
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </router-link>
        </div>
      </template>
    </div>
  </div>

  <!-- Filter Modal -->
  <div
    v-if="showFilterModal"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click.self="showFilterModal = false"
  >
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Display Options</h3>
        <p class="text-sm text-gray-600 mb-1">Select which information to display in the directory view.</p>
        <p class="text-xs text-indigo-600 mb-4 font-medium">Current view: {{ currentViewName }}</p>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div class="flex items-center">
            <input
              id="filter-photo"
              type="checkbox"
              v-model="displayFilters.photo"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-photo" class="ml-3 text-sm font-medium text-gray-700">Photo</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-email"
              type="checkbox"
              v-model="displayFilters.email"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-email" class="ml-3 text-sm font-medium text-gray-700">Email</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-phone"
              type="checkbox"
              v-model="displayFilters.phone"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-phone" class="ml-3 text-sm font-medium text-gray-700">Phone</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-address"
              type="checkbox"
              v-model="displayFilters.address"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-address" class="ml-3 text-sm font-medium text-gray-700">Address</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-generation"
              type="checkbox"
              v-model="displayFilters.generation"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-generation" class="ml-3 text-sm font-medium text-gray-700">Generation</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-age"
              type="checkbox"
              v-model="displayFilters.age"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-age" class="ml-3 text-sm font-medium text-gray-700">Age</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-birthday"
              type="checkbox"
              v-model="displayFilters.birthday"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-birthday" class="ml-3 text-sm font-medium text-gray-700">Birthday</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-anniversary"
              type="checkbox"
              v-model="displayFilters.anniversary"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-anniversary" class="ml-3 text-sm font-medium text-gray-700">Anniversary</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-years-married"
              type="checkbox"
              v-model="displayFilters.years_married"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-years-married" class="ml-3 text-sm font-medium text-gray-700">Years Married</label>
          </div>
          <div class="flex items-center">
            <input
              id="filter-location"
              type="checkbox"
              v-model="displayFilters.location"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-location" class="ml-3 text-sm font-medium text-gray-700">Location (City/State)</label>
          </div>
        </div>

        <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <button
            v-if="hasFilterChanges"
            type="button"
            @click="saveAsDefault"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            Set as Default for {{ currentViewName }}
          </button>
          <div v-else></div>
          <button
            type="button"
            @click="showFilterModal = false"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { parseISO, format } from 'date-fns';
import { getApiBaseURL, getPhotoURL } from '../utils/api.js';

const households = ref([]);
const persons = ref([]);
const searchQuery = ref('');
const sortBy = ref('household'); // Default to household
const loading = ref(true);
const showFilterModal = ref(false);

// Default display filters
const defaultDisplayFilters = {
  photo: false,
  email: true,
  phone: true,
  address: true,
  generation: true,
  age: true,
  birthday: true,
  anniversary: true,
  years_married: false,
  location: true,
};

// Get current view type (used for preference key)
const currentViewType = computed(() => {
  return sortBy.value; // Use the actual sort value (household, next_event, age_asc, etc.)
});

// Get view name for display
const currentViewName = computed(() => {
  const viewNames = {
    household: 'Household',
    next_event: 'Next Event',
    age_asc: 'Youngest View',
    age_desc: 'Oldest View',
    generation: 'Generation',
    name: 'Name (A-Z)'
  };
  return viewNames[sortBy.value] || 'List';
});

// Load saved filters from backend for current view or use defaults
async function loadDisplayFilters() {
  const viewKey = `directoryDisplayFilters_${currentViewType.value}`;
  try {
    const response = await axios.get(`/api/preferences/${viewKey}`);
    return { ...defaultDisplayFilters, ...response.data };
  } catch (error) {
    // If preference doesn't exist (404), use defaults
    if (error.response?.status === 404) {
      return { ...defaultDisplayFilters };
    }
    console.error('Error loading saved filters:', error);
    return { ...defaultDisplayFilters };
  }
}

const displayFilters = ref({ ...defaultDisplayFilters });

// Reload filters when view changes
watch(sortBy, async () => {
  const filters = await loadDisplayFilters();
  displayFilters.value = filters;
  loadedFilters.value = { ...filters };
});

// Track loaded filters for comparison
const loadedFilters = ref({ ...defaultDisplayFilters });

// Check if current filters differ from saved defaults for current view
const hasFilterChanges = computed(() => {
  return JSON.stringify(displayFilters.value) !== JSON.stringify(loadedFilters.value);
});

// Save current filters as default for current view
async function saveAsDefault(event) {
  const viewKey = `directoryDisplayFilters_${currentViewType.value}`;
  try {
    await axios.post(`${getApiBaseURL()}/preferences/${viewKey}`, displayFilters.value);
    
    // Update loaded filters to match current
    loadedFilters.value = { ...displayFilters.value };
    
    // Show a brief confirmation with view name
    if (event && event.target) {
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = `Saved for ${currentViewName.value}!`;
      button.classList.add('bg-green-600', 'hover:bg-green-700');
      button.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600', 'hover:bg-green-700');
        button.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
      }, 2000);
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
    alert('Failed to save preferences. Please try again.');
  }
}


function formatDateShort(dateString) {
  if (!dateString) return null;
  try {
    return format(parseISO(dateString), 'MMM d, yy');
  } catch {
    return dateString;
  }
}

function formatScheduleDate(dateString) {
  try {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d, yyyy'); // e.g., "Monday, February 18, 2024"
  } catch {
    return dateString;
  }
}

// Schedule view: Group events by date for next 12 months
const scheduleView = computed(() => {
  if (sortBy.value !== 'next_event') return [];
  
  const now = new Date();
  const events = [];
  
  // Collect all birthdays and anniversaries for next 12 months
  persons.value.forEach(person => {
    // Add birthday if exists
    if (person.date_of_birth) {
      try {
        const birthDate = parseISO(person.date_of_birth);
        const thisYearBday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const nextYearBday = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
        
        // Add this year's birthday if it's in the next 12 months
        // Handle case where birthday already passed this year - use next year's date
        let targetBday = thisYearBday;
        if (thisYearBday < now) {
          targetBday = nextYearBday;
        }
        
        if (targetBday >= now) {
          const daysUntil = Math.floor((targetBday - now) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 365) {
            const eventDate = targetBday.toISOString().split('T')[0];
            const ageAtEvent = targetBday === thisYearBday ? person.age : (person.age ? person.age + 1 : null);
            events.push({
              date: eventDate,
              personId: person.id,
              name: person.full_name || `${person.first_name} ${person.last_name}`,
              eventType: 'birthday',
              age: ageAtEvent,
              generation: person.generation,
              email: person.email,
              phone: person.phone,
              photo_url: person.photo_url,
              years_married: null,
              address: getPersonAddress(person),
            });
          }
        }
      } catch (e) {
        // Invalid date
      }
    }
    
    // Add anniversary if exists
    if (person.wedding_anniversary_date) {
      try {
        const annDate = parseISO(person.wedding_anniversary_date);
        const thisYearAnn = new Date(now.getFullYear(), annDate.getMonth(), annDate.getDate());
        const nextYearAnn = new Date(now.getFullYear() + 1, annDate.getMonth(), annDate.getDate());
        
        // Add this year's anniversary if it's in the next 12 months
        // Handle case where anniversary already passed this year - use next year's date
        let targetAnn = thisYearAnn;
        if (thisYearAnn < now) {
          targetAnn = nextYearAnn;
        }
        
        if (targetAnn >= now) {
          const daysUntil = Math.floor((targetAnn - now) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 365) {
            const eventDate = targetAnn.toISOString().split('T')[0];
            const yearsAtEvent = targetAnn === thisYearAnn ? person.years_married : (person.years_married ? person.years_married + 1 : null);
            events.push({
              date: eventDate,
              personId: person.id,
              name: person.full_name || `${person.first_name} ${person.last_name}`,
              eventType: 'anniversary',
              age: person.age,
              generation: person.generation,
              email: person.email,
              phone: person.phone,
              photo_url: person.photo_url,
              years_married: yearsAtEvent,
              address: getPersonAddress(person),
            });
          }
        }
      } catch (e) {
        // Invalid date
      }
    }
  });
  
  // Group events by date, then by person (to combine birthday + anniversary on same date)
  const groupedByDateAndPerson = {};
  events.forEach(event => {
    const key = `${event.date}_${event.personId}`;
    if (!groupedByDateAndPerson[key]) {
      groupedByDateAndPerson[key] = {
        date: event.date,
        personId: event.personId,
        name: event.name,
        generation: event.generation,
        email: event.email,
        phone: event.phone,
        photo_url: event.photo_url,
        address: event.address,
        hasBirthday: false,
        hasAnniversary: false,
        birthdayAge: null,
        anniversaryYears: null,
      };
    }
    
    // Combine event types for same person on same date
    if (event.eventType === 'birthday') {
      groupedByDateAndPerson[key].hasBirthday = true;
      groupedByDateAndPerson[key].birthdayAge = event.age;
    } else if (event.eventType === 'anniversary') {
      groupedByDateAndPerson[key].hasAnniversary = true;
      groupedByDateAndPerson[key].anniversaryYears = event.years_married;
    }
  });
  
  // Group combined events by date
  const groupedByDate = {};
  Object.values(groupedByDateAndPerson).forEach(combinedEvent => {
    if (!groupedByDate[combinedEvent.date]) {
      groupedByDate[combinedEvent.date] = [];
    }
    groupedByDate[combinedEvent.date].push(combinedEvent);
  });
  
  // Convert to array and sort by date
  const dateGroups = Object.keys(groupedByDate)
    .map(date => ({
      date,
      events: groupedByDate[date].sort((a, b) => {
        // Sort by name within each date
        return a.name.localeCompare(b.name);
      })
    }))
    .sort((a, b) => {
      // Sort dates chronologically
      return new Date(a.date) - new Date(b.date);
    });
  
  return dateGroups;
});


function getHouseholdMembers(householdId) {
  return persons.value.filter(p => p.primary_household_id === householdId);
}

function getHeadOfHousehold(householdId) {
  const members = getHouseholdMembers(householdId);
  if (members.length === 0) return null;
  
  // First, try to use primary_contact_person_id from household object
  const household = households.value.find(h => h.id === householdId);
  if (household && household.primary_contact_person_id) {
    const headById = members.find(m => m.id === household.primary_contact_person_id);
    if (headById) return headById;
  }
  
  // Second, try to find the head using is_head_of_household flag from backend
  const headByFlag = members.find(m => m.is_head_of_household);
  if (headByFlag) return headByFlag;
  
  // Fallback: Use the display_name from backend to extract the head's name
  if (household && household.display_name) {
    const displayName = household.display_name.replace(' Household', '');
    const head = members.find(m => {
      const fullName = m.full_name || `${m.first_name} ${m.last_name}`;
      return fullName === displayName;
    });
    if (head) return head;
  }
  
  // Final fallback: Find the oldest blood relative (lowest generation, then oldest age)
  const withGeneration = members.filter(m => m.generation);
  if (withGeneration.length === 0) {
    // If no one has generation, use oldest person
    return members.sort((a, b) => {
      if (!a.age && !b.age) return 0;
      if (!a.age) return 1;
      if (!b.age) return -1;
      return b.age - a.age;
    })[0];
  }
  
  // Sort by generation (lowest first), then by age (oldest first)
  const sorted = withGeneration.sort((a, b) => {
    const genA = parseInt(a.generation.replace('G', '')) || 999;
    const genB = parseInt(b.generation.replace('G', '')) || 999;
    if (genA !== genB) return genA - genB;
    
    if (!a.age && !b.age) return 0;
    if (!a.age) return 1;
    if (!b.age) return -1;
    return b.age - a.age;
  });
  
  return sorted[0];
}

function isHeadOfHousehold(householdId, personId) {
  const head = getHeadOfHousehold(householdId);
  return head && head.id === personId;
}

function getSortedHouseholdMembers(householdId) {
  const members = getHouseholdMembers(householdId);
  const head = getHeadOfHousehold(householdId);
  
  if (!head) return members;
  
  // Put head first, then rest
  const headIndex = members.findIndex(m => m.id === head.id);
  if (headIndex === -1) return members;
  
  const sorted = [members[headIndex], ...members.filter(m => m.id !== head.id)];
  return sorted;
}

function getPersonAddress(person) {
  // For non-head members, use household_address if available
  if (person.household_address && !person.is_head_of_household) {
    return person.household_address;
  }
  
  // Otherwise use person's own address
  if (!person.address_line1 && !person.city && !person.state) return null;
  
  const parts = [];
  if (person.address_line1) parts.push(person.address_line1);
  if (person.address_line2) parts.push(person.address_line2);
  if (person.city || person.state || person.postal_code) {
    const cityStateZip = [
      person.city,
      person.state,
      person.postal_code
    ].filter(Boolean).join(', ');
    if (cityStateZip) parts.push(cityStateZip);
  }
  if (person.country && person.country !== 'USA') {
    parts.push(person.country);
  }
  
  return parts.length > 0 ? parts.join('\n') : null;
}

// Filter households to only those with at least one member, sorted by head of household age (oldest to youngest)
const householdsWithMembers = computed(() => {
  if (sortBy.value !== 'household') return [];
  
  // Ensure we have data before processing
  if (!households.value || !persons.value || households.value.length === 0 || persons.value.length === 0) {
    return [];
  }
  
  let validHouseholds = households.value.filter(household => {
    const members = persons.value.filter(p => p.primary_household_id === household.id);
    return members.length > 0;
  });
  
  // Apply search filter if active
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    validHouseholds = validHouseholds.filter(household => {
      const members = persons.value.filter(p => p.primary_household_id === household.id);
      // Include household if any member matches the search
      return members.some(p => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const email = (p.email || '').toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
      });
    });
  }
  
  // Sort households by head of household - generation first, then age
  // Create a new array to avoid mutating the original
  const sorted = [...validHouseholds].sort((a, b) => {
    const headA = getHeadOfHousehold(a.id);
    const headB = getHeadOfHousehold(b.id);
    
    // If no head found, put at the end
    if (!headA && !headB) return 0;
    if (!headA) return 1;
    if (!headB) return -1;
    
    // First priority: Generation (G1 is oldest, then G2, etc.)
    const genA = headA.generation ? parseInt(headA.generation.replace('G', '')) || 999 : 999;
    const genB = headB.generation ? parseInt(headB.generation.replace('G', '')) || 999 : 999;
    
    if (genA !== genB) {
      return genA - genB; // Lower generation first (G1 before G2, etc.)
    }
    
    // Second priority: Age (if same generation, oldest first)
    const ageA = Number(headA.age);
    const ageB = Number(headB.age);
    
    const hasAgeA = !isNaN(ageA) && ageA !== null && ageA !== undefined;
    const hasAgeB = !isNaN(ageB) && ageB !== null && ageB !== undefined;
    
    // If both have ages, sort by age (oldest first)
    if (hasAgeA && hasAgeB) {
      const ageDiff = ageB - ageA; // Descending order (oldest first)
      if (ageDiff !== 0) return ageDiff;
    }
    
    // If one has age and one doesn't (same generation), prioritize the one with age
    if (hasAgeA && !hasAgeB) return -1;
    if (!hasAgeA && hasAgeB) return 1;
    
    // If neither has age (same generation), use name as tiebreaker
    const nameA = (headA.full_name || `${headA.first_name} ${headA.last_name}`).toLowerCase();
    const nameB = (headB.full_name || `${headB.first_name} ${headB.last_name}`).toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  return sorted;
});

const personsWithoutHousehold = computed(() => {
  if (sortBy.value !== 'household') return [];
  
  // Filter to people without a household
  let peopleWithout = persons.value.filter(p => !p.primary_household_id);
  
  // Apply search filter if active
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    peopleWithout = peopleWithout.filter(p => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }
  
  // Sort by generation first, then age - they're all heads of their own household
  return peopleWithout.sort((a, b) => {
    // First priority: Generation (G1 is oldest, then G2, etc.)
    const genA = a.generation ? parseInt(a.generation.replace('G', '')) || 999 : 999;
    const genB = b.generation ? parseInt(b.generation.replace('G', '')) || 999 : 999;
    
    if (genA !== genB) {
      return genA - genB; // Lower generation first (G1 before G2, etc.)
    }
    
    // Second priority: Age (if same generation, oldest first)
    const ageA = Number(a.age);
    const ageB = Number(b.age);
    
    const hasAgeA = !isNaN(ageA) && ageA !== null && ageA !== undefined;
    const hasAgeB = !isNaN(ageB) && ageB !== null && ageB !== undefined;
    
    // If both have ages, sort by age (oldest first)
    if (hasAgeA && hasAgeB) {
      const ageDiff = ageB - ageA; // Descending order (oldest first)
      if (ageDiff !== 0) return ageDiff;
    }
    
    // If one has age and one doesn't (same generation), prioritize the one with age
    if (hasAgeA && !hasAgeB) return -1;
    if (!hasAgeA && hasAgeB) return 1;
    
    // If neither has age (same generation), use name as tiebreaker
    const nameA = (a.full_name || `${a.first_name} ${a.last_name}`).toLowerCase();
    const nameB = (b.full_name || `${b.first_name} ${b.last_name}`).toLowerCase();
    return nameA.localeCompare(nameB);
  });
});

const filteredPersons = computed(() => {
  let filtered = [...persons.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(p => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }

  // Sort persons (skip sorting if household or next_event - those are handled separately)
  if (sortBy.value && sortBy.value !== 'household' && sortBy.value !== 'next_event') {
    filtered.sort((a, b) => {
      switch (sortBy.value) {
        case 'next_event':
          // Helper function to get next event date (birthday or anniversary, whichever is sooner)
          // This includes ALL people with birthdays or anniversaries, regardless of filter settings
          function getNextEventDate(person) {
            const now = new Date();
            let nextBirthday = null;
            let nextAnniversary = null;
            
            // Calculate next birthday
            if (person.date_of_birth) {
              try {
                const birthDate = parseISO(person.date_of_birth);
                let nextBday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                if (nextBday < now) {
                  nextBday.setFullYear(now.getFullYear() + 1);
                }
                nextBirthday = nextBday;
              } catch (e) {
                // Invalid date
              }
            }
            
            // Calculate next anniversary
            if (person.wedding_anniversary_date) {
              try {
                const annDate = parseISO(person.wedding_anniversary_date);
                let nextAnn = new Date(now.getFullYear(), annDate.getMonth(), annDate.getDate());
                if (nextAnn < now) {
                  nextAnn.setFullYear(now.getFullYear() + 1);
                }
                nextAnniversary = nextAnn;
              } catch (e) {
                // Invalid date
              }
            }
            
            // Return whichever is sooner, or null if neither exists
            if (!nextBirthday && !nextAnniversary) return null;
            if (!nextBirthday) return nextAnniversary;
            if (!nextAnniversary) return nextBirthday;
            return nextBirthday < nextAnniversary ? nextBirthday : nextAnniversary;
          }
          
          const aNext = getNextEventDate(a);
          const bNext = getNextEventDate(b);
          
          // People with events come first, sorted by date
          // People without events go to the end
          if (!aNext && !bNext) return 0;
          if (!aNext) return 1;
          if (!bNext) return -1;
          return aNext - bNext;

        case 'age_asc':
          if (!a.age && !b.age) return 0;
          if (!a.age) return 1;
          if (!b.age) return -1;
          return a.age - b.age;

        case 'age_desc':
          if (!a.age && !b.age) return 0;
          if (!a.age) return 1;
          if (!b.age) return -1;
          return b.age - a.age;

        case 'generation':
          if (!a.generation && !b.generation) return 0;
          if (!a.generation) return 1;
          if (!b.generation) return -1;
          const numA = parseInt(a.generation.replace('G', '')) || 999;
          const numB = parseInt(b.generation.replace('G', '')) || 999;
          return numA - numB;

        case 'name':
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return nameA.localeCompare(nameB);

        default:
          return 0;
      }
    });
  }

  return filtered;
});

async function fetchData() {
  try {
    const [householdsRes, personsRes] = await Promise.all([
      axios.get(`${getApiBaseURL()}/households`),
      axios.get(`${getApiBaseURL()}/persons`),
    ]);
    households.value = householdsRes.data;
    persons.value = personsRes.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
  // Load filters for current view
  const filters = await loadDisplayFilters();
  displayFilters.value = filters;
  loadedFilters.value = { ...filters };
});
</script>
