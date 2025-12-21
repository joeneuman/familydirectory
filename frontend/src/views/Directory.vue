<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">

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
                      <!-- Photos - show both side by side for anniversaries with spouse -->
                      <div v-if="displayFilters.photo" class="flex-shrink-0">
                        <!-- Anniversary with spouse - show both photos side by side -->
                        <div v-if="event.hasAnniversary && event.spouseId && (event.photo_url || event.spouse_photo_url)" class="flex -space-x-2">
                          <img 
                            v-if="event.photo_url" 
                            :src="getPhotoURL(event.photo_url)" 
                            :alt="event.name.split(' & ')[0]" 
                            class="w-12 h-12 rounded-full object-cover border-2 border-white" 
                          />
                          <img 
                            v-if="event.spouse_photo_url" 
                            :src="getPhotoURL(event.spouse_photo_url)" 
                            :alt="event.name.split(' & ')[1]" 
                            class="w-12 h-12 rounded-full object-cover border-2 border-white" 
                          />
                        </div>
                        <!-- Single photo for birthdays or individual anniversaries -->
                        <img 
                          v-else-if="event.photo_url" 
                          :src="getPhotoURL(event.photo_url)" 
                          :alt="event.name" 
                          class="w-12 h-12 rounded-full object-cover" 
                        />
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
                          <a v-if="displayFilters.phone && event.phone" :href="`tel:${event.phone}`" @click.stop class="flex items-center text-indigo-600 hover:text-indigo-800">
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
        <!-- Grouped by Household (including individuals in their own households) -->
        <template v-for="(item, index) in allHouseholdsSorted" :key="item.type === 'household' ? item.household.id : `individual-${item.person.id}`">
          <!-- Regular household -->
          <template v-if="item.type === 'household'">
            <template v-for="(household, householdIndex) in [item.household]" :key="household.id">
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
                            <span class="font-medium mr-1">Married:</span> {{ person.years_married }}
                          </div>
                          <div v-if="displayFilters.email && person.email" class="flex items-center">
                            <span class="font-medium mr-1">Email:</span> {{ person.email }}
                          </div>
                          <a v-if="displayFilters.phone && person.phone" :href="`tel:${person.phone}`" @click.stop class="flex items-center text-indigo-600 hover:text-indigo-800">
                            <span class="font-medium mr-1">Phone:</span> {{ person.phone }}
                          </a>
                          <!-- Show household name for non-head members (if not hidden by privacy) -->
                          <div v-if="displayFilters.household_name && !isHeadOfHousehold(household.id, person.id) && !(person.privacy_settings && person.privacy_settings.household_name)" class="flex items-center">
                            <span class="font-medium mr-1">Household:</span> 
                            {{ getHeadOfHouseholdName(household.id) }}
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
          </template>
          
          <!-- Individual person (their own household) -->
          <template v-else-if="item.type === 'individual'">
            <template v-for="(person, personIndex) in [item.person]" :key="person.id">
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
                            <div v-if="displayFilters.years_married && person.wedding_anniversary_date" class="flex items-center">
                              <span class="font-medium mr-1">Married:</span>
                            </div>
                            <div v-if="displayFilters.email && person.email" class="flex items-center">
                              <span class="font-medium mr-1">Email:</span> {{ person.email }}
                            </div>
                            <a v-if="displayFilters.phone && person.phone" :href="`tel:${person.phone}`" @click.stop class="flex items-center text-indigo-600 hover:text-indigo-800">
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
                      <a v-if="displayFilters.phone && person.phone" :href="`tel:${person.phone}`" @click.stop class="flex items-center text-indigo-600 hover:text-indigo-800">
                        <span class="font-medium mr-1">Phone:</span> {{ person.phone }}
                      </a>
                      <div v-if="displayFilters.household_name && person.primary_household_id && !(person.privacy_settings && person.privacy_settings.household_name)" class="flex items-center">
                        <span class="font-medium mr-1">Household:</span> 
                        {{ getHeadOfHouseholdName(person.primary_household_id) }}
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
              id="filter-household-name"
              type="checkbox"
              v-model="displayFilters.household_name"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="filter-household-name" class="ml-3 text-sm font-medium text-gray-700">Household Name</label>
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
import { ref, computed, onMounted, watch, inject } from 'vue';
import axios from 'axios';
import { parseISO, format } from 'date-fns';
import { getApiBaseURL, getPhotoURL } from '../utils/api.js';

// Inject shared state from App.vue
const directorySearchQuery = inject('directorySearchQuery');
const directorySortBy = inject('directorySortBy');
const showDirectoryFilterModal = inject('showDirectoryFilterModal');

const households = ref([]);
const persons = ref([]);
const loading = ref(true);

// Use injected values with local computed refs for reactivity
const searchQuery = computed({
  get: () => directorySearchQuery.value,
  set: (value) => { directorySearchQuery.value = value; }
});

const sortBy = computed({
  get: () => directorySortBy.value,
  set: (value) => { directorySortBy.value = value; }
});

const showFilterModal = computed({
  get: () => showDirectoryFilterModal.value,
  set: (value) => { showDirectoryFilterModal.value = value; }
});

// Default display filters for MVP - based on Joseph Neuman's preferences
// These are used when no saved preferences exist for a view
// View-specific defaults
const defaultDisplayFiltersByView = {
  household: {
    photo: true,
    email: true,
    phone: true,
    address: true,
    generation: false,
    age: true,
    birthday: false,
    anniversary: false,
    years_married: true,
    household_name: false,
  },
  next_event: {
    photo: true,
    email: false,
    phone: false,
    address: true,
    generation: false,
    age: true,
    birthday: true,
    anniversary: true,
    years_married: true,
    household_name: false,
  },
  age_asc: {
    photo: true,
    email: true,
    phone: true,
    address: false,
    generation: false,
    age: true,
    birthday: true,
    anniversary: false,
    years_married: false,
    household_name: true,
  },
  age_desc: {
    photo: true,
    email: true,
    phone: true,
    address: false,
    generation: false,
    age: true,
    birthday: true,
    anniversary: false,
    years_married: false,
    household_name: true,
  },
  generation: {
    photo: true,
    email: true,
    phone: true,
    address: false,
    generation: false,
    age: true,
    birthday: true,
    anniversary: false,
    years_married: false,
    household_name: true,
  },
  name: {
    photo: true,
    email: true,
    phone: true,
    address: false,
    generation: false,
    age: true,
    birthday: true,
    anniversary: false,
    years_married: false,
    household_name: true,
  },
};

// Fallback default (used if view type not found in defaults)
const defaultDisplayFilters = {
  photo: true,
  email: true,
  phone: true,
  address: false,
  generation: false,
  age: true,
  birthday: true,
  anniversary: false,
  years_married: false,
  household_name: true,
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
    // Merge saved preferences with view-specific defaults
    const viewDefaults = defaultDisplayFiltersByView[currentViewType.value] || defaultDisplayFilters;
    return { ...viewDefaults, ...response.data };
  } catch (error) {
    // If preference doesn't exist (404), use view-specific defaults
    if (error.response?.status === 404) {
      return { ...(defaultDisplayFiltersByView[currentViewType.value] || defaultDisplayFilters) };
    }
    console.error('Error loading saved filters:', error);
    return { ...(defaultDisplayFiltersByView[currentViewType.value] || defaultDisplayFilters) };
  }
}

// Initialize with defaults for current view (will be updated on mount)
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

function formatDateShort(dateString) {
  if (!dateString) return null;
  try {
    const date = parseDateOnly(dateString);
    if (!date || isNaN(date.getTime())) return dateString;
    return format(date, 'MMM d, yy');
  } catch {
    return dateString;
  }
}

function formatScheduleDate(dateString) {
  try {
    const date = parseDateOnly(dateString);
    if (!date || isNaN(date.getTime())) return dateString;
    return format(date, 'MMMM d, yyyy - EEEE'); // e.g., "January 4, 2026 - Sunday"
  } catch {
    return dateString;
  }
}

// Schedule view: Group events by date for next 12 months
const scheduleView = computed(() => {
  if (sortBy.value !== 'next_event') return [];
  
  const now = new Date();
  const events = [];
  
  // Track processed spouses to avoid duplicate anniversaries
  const processedSpousePairs = new Set();
  
  // Collect all birthdays and anniversaries for next 12 months
  persons.value.forEach(person => {
    // Add birthday if exists
    if (person.date_of_birth) {
      try {
        const birthDate = parseDateOnly(person.date_of_birth);
        if (!birthDate || isNaN(birthDate.getTime())) throw new Error('Invalid date');
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
        const annDate = parseDateOnly(person.wedding_anniversary_date);
        if (!annDate || isNaN(annDate.getTime())) throw new Error('Invalid date');
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
            
            // Check if this person has a spouse and create a combined anniversary event
            if (person.spouse) {
              const spousePairKey = [person.id, person.spouse.id].sort().join('_');
              if (!processedSpousePairs.has(spousePairKey)) {
                processedSpousePairs.add(spousePairKey);
                const spouseName = person.spouse.full_name || `${person.spouse.first_name} ${person.spouse.last_name}`;
                const combinedName = `${person.full_name || `${person.first_name} ${person.last_name}`} & ${spouseName}`;
                events.push({
                  date: eventDate,
                  personId: person.id,
                  spouseId: person.spouse.id,
                  name: combinedName,
                  eventType: 'anniversary',
                  age: person.age,
                  generation: person.generation,
                  email: person.email,
                  phone: person.phone,
                  photo_url: person.photo_url,
                  spouse_photo_url: person.spouse.photo_url,
                  years_married: yearsAtEvent,
                  address: getPersonAddress(person),
                });
              }
            } else {
              // No spouse, add individual anniversary
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
        }
      } catch (e) {
        // Invalid date
      }
    }
  });
  
  // Group events by date, then by person (to combine birthday + anniversary on same date)
  // For spouses, use a combined key
  const groupedByDateAndPerson = {};
  events.forEach(event => {
    // For spouse anniversaries, use a combined key
    const key = event.spouseId 
      ? `${event.date}_spouse_${[event.personId, event.spouseId].sort().join('_')}`
      : `${event.date}_${event.personId}`;
      
    if (!groupedByDateAndPerson[key]) {
      groupedByDateAndPerson[key] = {
        date: event.date,
        personId: event.personId,
        spouseId: event.spouseId || null,
        name: event.name,
        generation: event.generation,
        email: event.email,
        phone: event.phone,
        photo_url: event.photo_url,
        spouse_photo_url: event.spouse_photo_url || null,
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

function getHeadOfHouseholdName(householdId) {
  const head = getHeadOfHousehold(householdId);
  if (!head) return '';
  return head.full_name || `${head.first_name} ${head.last_name}`;
}

function getSortedHouseholdMembers(householdId) {
  const members = getHouseholdMembers(householdId);
  const head = getHeadOfHousehold(householdId);
  
  if (!head) return members;
  
  // Put head first, then spouse (if exists and in household), then rest
  const headIndex = members.findIndex(m => m.id === head.id);
  if (headIndex === -1) return members;
  
  const headMember = members[headIndex];
  const otherMembers = members.filter(m => m.id !== head.id);
  
  // Find spouse if exists and is in this household
  let spouse = null;
  if (head.spouse && head.spouse.id) {
    spouse = otherMembers.find(m => m.id === head.spouse.id);
  }
  const restMembers = spouse 
    ? otherMembers.filter(m => m.id !== spouse.id)
    : otherMembers;
  
  // Return: head, spouse (if exists and in household), then rest
  if (spouse) {
    return [headMember, spouse, ...restMembers];
  }
  return [headMember, ...restMembers];
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

// Combined list of households and individuals, sorted chronologically by head age
const allHouseholdsSorted = computed(() => {
  if (sortBy.value !== 'household') return [];
  
  // Get all households with members
  const householdsList = householdsWithMembers.value.map(h => ({
    type: 'household',
    household: h,
    head: getHeadOfHousehold(h.id)
  }));
  
  // Get all persons without households (they're heads of their own household)
  const individualsList = personsWithoutHousehold.value.map(p => ({
    type: 'individual',
    person: p,
    head: p
  }));
  
  // Combine and sort by head age
  const combined = [...householdsList, ...individualsList];
  
  return combined.sort((a, b) => {
    const headA = a.head;
    const headB = b.head;
    
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
