<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Controls (hidden when printing) -->
    <div class="no-print mb-6">
      <div class="flex justify-between items-center mb-3">
        <h1 class="text-2xl font-bold text-gray-900">Address Labels - Avery 5163/8163</h1>
        <div class="flex gap-3">
          <button
            @click="handlePrint"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Print Labels
          </button>
          <button
            @click="$router.push('/directory')"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to Directory
          </button>
        </div>
      </div>
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
        <strong>Printing Instructions:</strong> Please set your printer margins to <strong>zero (0)</strong> for best results.
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading households...</div>
    </div>

    <div v-else-if="labelData.length === 0" class="text-center py-12">
      <div class="text-gray-600">No households with addresses found.</div>
    </div>

    <!-- Label Sheet -->
    <div v-else class="label-sheet">
      <div
        v-for="(label, index) in labelData"
        :key="index"
        class="label"
      >
        <div class="label-content">
          <!-- Names: Head and Spouse -->
          <div class="label-name">
            {{ label.names }}
          </div>
          <!-- Address -->
          <div class="label-address">
            <div v-if="label.address_line1">{{ label.address_line1 }}</div>
            <div v-if="label.address_line2">{{ label.address_line2 }}</div>
            <div v-if="label.city || label.state || label.postal_code">
              <span v-if="label.city">{{ label.city }}</span><span v-if="label.city && label.state">, </span>
              <span v-if="label.state">{{ label.state }}</span><span v-if="label.state && label.postal_code">&nbsp;&nbsp;</span>
              <span v-if="label.postal_code">{{ label.postal_code }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { getApiBaseURL } from '../utils/api.js';

const loading = ref(true);
const households = ref([]);
const persons = ref([]);
const labelData = ref([]);

// Fetch all households and persons
async function fetchData() {
  try {
    const [householdsRes, personsRes] = await Promise.all([
      axios.get(`${getApiBaseURL()}/households`),
      axios.get(`${getApiBaseURL()}/persons`),
    ]);
    households.value = householdsRes.data;
    persons.value = personsRes.data;
    
    // Process data for labels
    await processLabelData();
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
}

/**
 * Process households into label data for printing
 * Creates labels with head of household and spouse names, plus address
 * Includes both households with multiple members and individuals who are heads of their own household
 */
async function processLabelData() {
  const labels = [];
  
  // Create a map of person IDs to full person data (with spouse info from persons API)
  const personsMap = new Map();
  persons.value.forEach(person => {
    personsMap.set(person.id, person);
  });
  
  // Process households from database
  for (const household of households.value) {
    // Skip households without members
    if (!household.members || household.members.length === 0) continue;
    
    // Find head of household (primary_contact_person_id or first member)
    let head = null;
    if (household.primary_contact_person_id) {
      const headId = household.primary_contact_person_id;
      // Get full person data from persons array (which has spouse info)
      head = personsMap.get(headId);
      // If not found in persons, use member data
      if (!head) {
        head = household.members.find(m => m.id === headId);
      }
    }
    
    // If no explicit head, use first member
    if (!head && household.members.length > 0) {
      const firstMemberId = household.members[0].id;
      head = personsMap.get(firstMemberId) || household.members[0];
    }
    
    if (!head) continue;
    
    // Get spouse from person's spouse property (from persons API)
    let spouse = null;
    if (head.spouse && head.spouse.id) {
      spouse = personsMap.get(head.spouse.id) || head.spouse;
    }
    
    // Get address from head of household
    const address = {
      address_line1: head.address_line1,
      address_line2: head.address_line2,
      city: head.city,
      state: head.state,
      postal_code: head.postal_code,
    };
    
    // Skip if no address
    if (!address.address_line1 && !address.city) continue;
    
    // Format names: head always listed first
    let names = '';
    const headFirstName = head.first_name;
    const headLastName = head.last_name;
    const headName = head.full_name || `${headFirstName} ${headLastName}`;
    
    if (spouse) {
      const spouseFirstName = spouse.first_name;
      const spouseLastName = spouse.last_name;
      const spouseName = spouse.full_name || `${spouseFirstName} ${spouseLastName}`;
      
      // Check if last names match (case-insensitive)
      if (headLastName && spouseLastName && headLastName.toLowerCase() === spouseLastName.toLowerCase()) {
        // Same last name: "Jane and Jack Smith"
        names = `${headFirstName} and ${spouseFirstName} ${headLastName}`;
      } else {
        // Different last names: "Jane Jones and Jack Smith" (head first)
        names = `${headName} and ${spouseName}`;
      }
    } else {
      names = headName;
    }
    
    labels.push({
      names,
      ...address,
    });
  }
  
  // Process individuals who are heads of their own household (primary_household_id = null)
  // These are people who don't belong to any household record but are treated as heads of their own household
  const individualsWithoutHousehold = persons.value.filter(p => !p.primary_household_id);
  
  for (const individual of individualsWithoutHousehold) {
    // Get spouse from person's spouse property (from persons API)
    let spouse = null;
    if (individual.spouse && individual.spouse.id) {
      spouse = personsMap.get(individual.spouse.id) || individual.spouse;
    }
    
    // Get address from individual
    const address = {
      address_line1: individual.address_line1,
      address_line2: individual.address_line2,
      city: individual.city,
      state: individual.state,
      postal_code: individual.postal_code,
    };
    
    // Skip if no address
    if (!address.address_line1 && !address.city) continue;
    
    // Format names: head always listed first
    let names = '';
    const headFirstName = individual.first_name;
    const headLastName = individual.last_name;
    const headName = individual.full_name || `${headFirstName} ${headLastName}`;
    
    if (spouse) {
      const spouseFirstName = spouse.first_name;
      const spouseLastName = spouse.last_name;
      const spouseName = spouse.full_name || `${spouseFirstName} ${spouseLastName}`;
      
      // Check if last names match (case-insensitive)
      if (headLastName && spouseLastName && headLastName.toLowerCase() === spouseLastName.toLowerCase()) {
        // Same last name: "Jane and Jack Smith"
        names = `${headFirstName} and ${spouseFirstName} ${headLastName}`;
      } else {
        // Different last names: "Jane Jones and Jack Smith" (head first)
        names = `${headName} and ${spouseName}`;
      }
    } else {
      names = headName;
    }
    
    labels.push({
      names,
      ...address,
    });
  }
  
  labelData.value = labels;
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
});
</script>

<style scoped>
/* Scoped styles for screen view */
@media screen {
  .label-sheet {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    max-width: 8.5in;
    margin: 0 auto;
  }
  
  .label {
    border: 1px dashed #ccc;
    padding: 1rem;
    min-height: 2in;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .label-content {
    display: flex;
    flex-direction: column;
  }
  
  .label-name {
    font-size: 14pt;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .label-address {
    font-size: 12pt;
    line-height: 1.5;
  }
}

/* Global print styles - not scoped */
</style>

<style>
/* Global print styles to hide navigation and other elements */
@media print {
  /* Hide navigation header */
  nav,
  #app > nav,
  header {
    display: none !important;
  }
  
  /* Hide the no-print class elements */
  .no-print {
    display: none !important;
  }
  
  /* Remove margins and padding from body */
  body {
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Remove background colors */
  body,
  #app {
    background: white !important;
  }
  
  /* Set page margins for all pages (ensures consistent top spacing on all pages including subsequent ones) */
  /* Using page margin instead of padding ensures spacing works correctly on page breaks */
  @page {
    margin: 0.276in 0.171in 0 0.276in !important; /* top: 7mm (0.276in), right: 0.171in, bottom: 0, left: 7mm (0.276in) */
    size: 8.5in 11in;
  }
  
  /* Label sheet layout for Avery 5163/8163 */
  /* 2 columns x 5 rows = 10 labels per sheet */
  /* Each label: 2" x 4" */
  /* Sheet: 8.5" x 11" */
  /* Gap: 0.138in vertical, 0.296in horizontal (spacing between labels - reduced by 2mm/0.079in from previous) */
  /* Using @page margins for page spacing instead of padding */
  
  .label-sheet {
    width: 8.5in !important;
    height: 11in !important;
    display: grid !important;
    grid-template-columns: repeat(2, 4in) !important;
    grid-template-rows: repeat(5, 2in) !important;
    gap: 0.01in 0.217in !important; /* Vertical gap: 0.01in (reduced by 3mm/0.118in - minimal to prevent overlap), Horizontal gap: 0.217in */
    padding: 0.552in 0 0 0.276in !important; /* top: 14mm (0.552in - added 7mm more), left: 7mm (0.276in) - ensures margins on all pages */
    box-sizing: border-box !important;
    page-break-after: always !important;
    margin: 0 !important;
    max-width: 100% !important;
  }
  
  .label {
    width: 4in !important;
    height: 2in !important;
    padding: 0.125in !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: flex-start !important;
    page-break-inside: avoid !important;
  }
  
  .label-content {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
  }
  
  .label-name {
    font-size: 18pt !important;
    font-weight: 600 !important;
    margin-bottom: 0.15in !important;
    line-height: 1.3 !important;
  }
  
  .label-address {
    font-size: 16pt !important;
    line-height: 1.4 !important;
  }
  
  /* Hide the container padding/margins */
  .max-w-7xl {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Ensure labels don't break across pages */
  .label {
    page-break-inside: avoid !important;
  }
}
</style>


