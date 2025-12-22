<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 no-print">
      <div class="flex justify-between items-center mb-3">
        <h1 class="text-2xl font-bold text-gray-900">Family Directory - Print View</h1>
        <div class="flex gap-3">
          <button
            @click="handlePrint"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Print
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading...</div>
    </div>

    <div v-else>
      <!-- Print Title (only visible when printing) -->
      <div class="print-only text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ siteName }}</h1>
      </div>

      <div class="space-y-4">
      <!-- Grouped by Household (matching Directory view formatting) -->
      <template v-for="(item, index) in allHouseholdsSorted" :key="item.type === 'household' ? item.household.id : `individual-${item.person.id}`">
        <!-- Regular household -->
        <template v-if="item.type === 'household'">
          <template v-for="(household, householdIndex) in [item.household]" :key="household.id">
            <div class="mt-4 page-break-inside-avoid">
              <!-- Household Members - Head of household first, with bold name and address -->
              <!-- Box container around household -->
              <div class="border-t-4 border-l-4 border-r-4 border-gray-300">
                <div class="space-y-3 px-3 pt-3 pb-3">
                  <template v-for="(person, personIndex) in getSortedHouseholdMembers(household.id)" :key="person.id">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div class="flex items-start justify-between">
                        <div class="flex-1 flex items-start gap-3">
                          <!-- Photo -->
                          <div class="flex-shrink-0">
                            <img :src="getPhotoURL(person.photo_url, person.id)" :alt="person.full_name || `${person.first_name} ${person.last_name}`" class="w-16 h-16 rounded-full object-cover" />
                          </div>
                          <div class="flex-1">
                            <!-- Bold name if head of household -->
                            <h3 :class="isHeadOfHousehold(household.id, person.id) ? 'text-lg font-extrabold text-gray-900 mb-1' : 'text-lg font-semibold text-gray-900 mb-1'">
                              {{ person.full_name || `${person.first_name} ${person.last_name}` }}
                            </h3>
                            <!-- Show address only for head of household (full width) -->
                            <div v-if="isHeadOfHousehold(household.id, person.id) && household.address" class="text-sm text-gray-600 mb-2 whitespace-pre-line">
                              {{ household.address }}
                            </div>
                            <!-- Horizontal layout for other fields -->
                            <div class="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <div v-if="person.generation" class="flex items-center">
                                <span class="font-medium mr-1">Gen:</span> {{ person.generation }}
                              </div>
                              <div v-if="person.age !== null && person.age !== undefined" class="flex items-center">
                                <span class="font-medium mr-1">Age:</span> {{ person.age }}
                              </div>
                              <div v-if="person.date_of_birth" class="flex items-center">
                                <span class="font-medium mr-1">Bday:</span> {{ formatDateShort(person.date_of_birth) }}
                              </div>
                              <div v-if="person.wedding_anniversary_date" class="flex items-center">
                                <span class="font-medium mr-1">Anniv:</span> {{ formatDateShort(person.wedding_anniversary_date) }}
                              </div>
                              <div v-if="person.years_married !== null && person.years_married !== undefined" class="flex items-center">
                                <span class="font-medium mr-1">Married:</span> {{ person.years_married }}
                              </div>
                              <div v-if="person.email" class="flex items-center">
                                <span class="font-medium mr-1">Email:</span> {{ person.email }}
                              </div>
                              <div v-if="person.phone" class="flex items-center">
                                <span class="font-medium mr-1">Phone:</span> {{ person.phone }}
                              </div>
                              <!-- Show household name for non-head members -->
                              <div v-if="!isHeadOfHousehold(household.id, person.id)" class="flex items-center">
                                <span class="font-medium mr-1">Household:</span> 
                                {{ getHeadOfHouseholdName(household.id) }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
            <div class="mt-4 page-break-inside-avoid">
              <div class="border-t-4 border-l-4 border-r-4 border-gray-300">
                <div class="px-3 pt-3 pb-3">
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div class="flex items-start justify-between">
                      <div class="flex-1 flex items-start gap-3">
                        <!-- Photo -->
                        <div class="flex-shrink-0">
                          <img :src="getPhotoURL(person.photo_url, person.id)" :alt="person.full_name || `${person.first_name} ${person.last_name}`" class="w-16 h-16 rounded-full object-cover" />
                        </div>
                        <div class="flex-1">
                          <!-- Bold name (they're their own head) -->
                          <h3 class="text-lg font-extrabold text-gray-900 mb-1">
                            {{ person.full_name || `${person.first_name} ${person.last_name}` }}
                          </h3>
                          <!-- Show address if they have one (full width) -->
                          <div v-if="getPersonAddress(person)" class="text-sm text-gray-600 mb-2 whitespace-pre-line">
                            {{ getPersonAddress(person) }}
                          </div>
                          <!-- Horizontal layout for other fields -->
                          <div class="text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div v-if="person.generation" class="flex items-center">
                              <span class="font-medium mr-1">Gen:</span> {{ person.generation }}
                            </div>
                            <div v-if="person.age !== null && person.age !== undefined" class="flex items-center">
                              <span class="font-medium mr-1">Age:</span> {{ person.age }}
                            </div>
                            <div v-if="person.date_of_birth" class="flex items-center">
                              <span class="font-medium mr-1">Bday:</span> {{ formatDateShort(person.date_of_birth) }}
                            </div>
                            <div v-if="person.wedding_anniversary_date" class="flex items-center">
                              <span class="font-medium mr-1">Anniv:</span> {{ formatDateShort(person.wedding_anniversary_date) }}
                            </div>
                            <div v-if="person.years_married !== null && person.years_married !== undefined" class="flex items-center">
                              <span class="font-medium mr-1">Married:</span> {{ person.years_married }}
                            </div>
                            <div v-if="person.email" class="flex items-center">
                              <span class="font-medium mr-1">Email:</span> {{ person.email }}
                            </div>
                            <div v-if="person.phone" class="flex items-center">
                              <span class="font-medium mr-1">Phone:</span> {{ person.phone }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Bottom border to close the box -->
                <div class="border-b-4 border-gray-300"></div>
              </div>
            </div>
          </template>
        </template>
      </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { getApiBaseURL, getPhotoURL } from '../utils/api.js';
import { format } from 'date-fns';

const households = ref([]);
const persons = ref([]);
const loading = ref(true);

// Site name management - fetch from API
const siteName = ref('Family Directory');

// Fetch site name from API
async function fetchSiteName() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/settings/site-name`);
    siteName.value = response.data.siteName || 'Family Directory';
  } catch (error) {
    console.error('Error fetching site name:', error);
    siteName.value = 'Family Directory';
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

// Filter households to only those with at least one member
const householdsWithMembers = computed(() => {
  return households.value.filter(h => {
    const members = persons.value.filter(p => p.primary_household_id === h.id);
    return members.length > 0;
  });
});

// Get persons without households (they're heads of their own household)
const personsWithoutHousehold = computed(() => {
  return persons.value.filter(p => !p.primary_household_id);
});

// Combine households and individuals, sorted by head age (oldest to youngest)
const allHouseholdsSorted = computed(() => {
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
    
    // Third priority: Name (alphabetical)
    const nameA = `${headA.first_name} ${headA.last_name}`.toLowerCase();
    const nameB = `${headB.first_name} ${headB.last_name}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
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

/**
 * Handle print button click - opens browser print dialog
 * Safely checks for window object before calling print()
 */
function handlePrint() {
  if (typeof window !== 'undefined' && window.print) {
    window.print();
  } else {
    console.error('Print function not available');
  }
}

onMounted(() => {
  fetchData();
  // Fetch site name from API
  fetchSiteName();
});
</script>

<style scoped>
.print-only {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }
  
  .print-only {
    display: block !important;
  }
  
  .page-break-inside-avoid {
    page-break-inside: avoid;
  }
}
</style>
