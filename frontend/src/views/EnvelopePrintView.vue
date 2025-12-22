<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Controls (hidden when printing) -->
    <div class="no-print mb-6">
      <div class="flex justify-between items-center mb-3">
        <h1 class="text-2xl font-bold text-gray-900">Envelopes - #10 Standard</h1>
        <div class="flex gap-3">
          <button
            @click="handlePrint"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Print Envelopes
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
        <strong>Printing Instructions:</strong> Please set your printer margins to <strong>zero (0)</strong> for best results. Standard #10 envelope (horizontal): 9.5" x 4.125". One envelope per page.
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="text-gray-600">Loading households...</div>
    </div>

    <div v-else-if="envelopeData.length === 0" class="text-center py-12">
      <div class="text-gray-600">No households with addresses found.</div>
    </div>

    <!-- Envelopes -->
    <div v-else>
      <div
        v-for="(envelope, index) in envelopeData"
        :key="index"
        class="envelope"
      >
        <div class="envelope-content">
          <!-- Return Address (top left) -->
          <div class="return-address">
            <!-- You can customize this with your return address -->
          </div>
          
          <!-- Recipient Address (center-right) -->
          <div class="recipient-address">
            <!-- Names: Head and Spouse -->
            <div class="envelope-name">
              {{ envelope.names }}
            </div>
            <!-- Address -->
            <div class="envelope-address">
              <div v-if="envelope.address_line1">{{ envelope.address_line1 }}</div>
              <div v-if="envelope.address_line2">{{ envelope.address_line2 }}</div>
              <div v-if="envelope.city || envelope.state || envelope.postal_code">
                <span v-if="envelope.city">{{ envelope.city }}</span><span v-if="envelope.city && envelope.state">, </span>
                <span v-if="envelope.state">{{ envelope.state }}</span><span v-if="envelope.state && envelope.postal_code">&nbsp;&nbsp;</span>
                <span v-if="envelope.postal_code">{{ envelope.postal_code }}</span>
              </div>
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
const envelopeData = ref([]);

// Fetch all households and persons
async function fetchData() {
  try {
    const [householdsRes, personsRes] = await Promise.all([
      axios.get(`${getApiBaseURL()}/households`),
      axios.get(`${getApiBaseURL()}/persons`),
    ]);
    households.value = householdsRes.data;
    persons.value = personsRes.data;
    
    // Process data for envelopes
    await processEnvelopeData();
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
}

/**
 * Process households into envelope data for printing
 * Creates envelopes with head of household and spouse names, plus address
 */
async function processEnvelopeData() {
  const envelopes = [];
  
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
    
    envelopes.push({
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
    
    envelopes.push({
      names,
      ...address,
    });
  }
  
  envelopeData.value = envelopes;
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
  .envelope {
    border: 2px solid #333;
    width: 9.5in;
    height: 4.125in;
    margin: 1rem auto;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
  }
  
  .envelope-content {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 0.5in;
  }
  
  .return-address {
    position: absolute;
    top: 0.5in;
    left: 0.5in;
    font-size: 10pt;
    color: #666;
  }
  
  .recipient-address {
    position: absolute;
    top: 1.5in;
    left: 5in;
    max-width: 4in;
  }
  
  .envelope-name {
    font-size: 14pt;
    font-weight: 600;
    margin-bottom: 0.25in;
    line-height: 1.3;
  }
  
  .envelope-address {
    font-size: 12pt;
    line-height: 1.5;
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
  
  /* Set page size to #10 envelope (horizontal orientation) */
  @page {
    size: 9.5in 4.125in;
    margin: 0 !important;
  }
  
  /* Envelope layout - one per page (horizontal) */
  .envelope {
    width: 9.5in !important;
    height: 4.125in !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    page-break-after: always !important;
    page-break-inside: avoid !important;
  }
  
  /* Last envelope doesn't need a page break after it */
  .envelope:last-of-type {
    page-break-after: auto !important;
  }
  
  .envelope-content {
    width: 100% !important;
    height: 100% !important;
    position: relative !important;
    padding: 0 !important;
  }
  
  .return-address {
    position: absolute !important;
    top: 0.5in !important;
    left: 0.5in !important;
    font-size: 10pt !important;
    color: #666 !important;
  }
  
  .recipient-address {
    position: absolute !important;
    top: 1.5in !important;
    left: 5in !important;
    max-width: 4in !important;
  }
  
  .envelope-name {
    font-size: 14pt !important;
    font-weight: 600 !important;
    margin-bottom: 0.25in !important;
    line-height: 1.3 !important;
  }
  
  .envelope-address {
    font-size: 12pt !important;
    line-height: 1.5 !important;
  }
  
  /* Hide the container padding/margins */
  .max-w-7xl {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
}
</style>

