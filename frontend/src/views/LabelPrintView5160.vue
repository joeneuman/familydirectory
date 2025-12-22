<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Controls (hidden when printing) -->
    <div class="no-print mb-6">
      <div class="flex justify-between items-center mb-3">
        <h1 class="text-2xl font-bold text-gray-900">Address Labels - Avery 5160</h1>
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
        <strong>Printing Instructions:</strong> Please set your printer margins to <strong>zero (0)</strong> for best results. Avery 5160: 30 labels per sheet (3 columns x 10 rows), 1" x 2.625" per label.
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading households...</div>
    </div>

    <div v-else-if="labelData.length === 0" class="text-center py-12">
      <div class="text-gray-600">No households with addresses found.</div>
    </div>

    <!-- Label Sheets -->
    <div v-else>
      <div
        v-for="(sheet, sIndex) in sheetedLabels"
        :key="sIndex"
        class="label-sheet"
      >
        <div
          v-for="(label, index) in sheet"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { getApiBaseURL } from '../utils/api.js';

const loading = ref(true);
const households = ref([]);
const persons = ref([]);
const labelData = ref([]);

// Group labels into sheets of 30 (3 columns x 10 rows for Avery 5160)
const sheetedLabels = computed(() => {
  const perSheet = 30; // 3 x 10
  const sheets = [];
  for (let i = 0; i < labelData.value.length; i += perSheet) {
    sheets.push(labelData.value.slice(i, i + perSheet));
  }
  return sheets;
});

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
      head = personsMap.get(headId);
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
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    max-width: 8.5in;
    margin: 0 auto;
  }
  
  .label {
    border: 1px dashed #ccc;
    padding: 0.5rem;
    min-height: 2.625in;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .label-content {
    display: flex;
    flex-direction: column;
  }
  
  .label-name {
    font-size: 10pt;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .label-address {
    font-size: 9pt;
    line-height: 1.4;
  }
}
</style>

<style>
/* Global print styles */
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
  
  /* Set page margins to 0 - all spacing handled by label-sheet padding */
  @page {
    size: 8.5in 11in;
    margin: 0 !important;
  }
  
  /* Label sheet layout for Avery 5160 */
  /* 3 columns x 10 rows = 30 labels per sheet */
  /* Each label: 1" x 2.625" */
  /* Sheet: 8.5" x 11" */
  /* Spacing: 0.125" vertical gap, 0.125" horizontal gap */
  /* Margins: 0.5" top, 0.1875" left/right, 0.5" bottom */
  
  .label-sheet {
    width: 8.5in !important;
    height: 11in !important;
    display: grid !important;
    grid-template-columns: repeat(3, 2.625in) !important;
    grid-template-rows: repeat(10, 1in) !important;
    gap: 0.125in !important; /* Uniform gap */
    padding: 0.5in 0.1875in 0.5in 0.1875in !important; /* top, right, bottom, left */
    box-sizing: border-box !important;
    margin: 0 !important;
    max-width: 100% !important;
    page-break-after: always !important; /* each sheet = new physical page */
  }
  
  /* Last sheet doesn't need a page break after it */
  .label-sheet:last-of-type {
    page-break-after: auto !important;
  }
  
  .label {
    width: 2.625in !important;
    height: 1in !important;
    padding: 0.1in !important;
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
    font-size: 10pt !important;
    font-weight: 600 !important;
    margin-bottom: 0.1in !important;
    line-height: 1.2 !important;
  }
  
  .label-address {
    font-size: 9pt !important;
    line-height: 1.3 !important;
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

