<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 no-print">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Print Options</h1>
      <router-link to="/directory" class="text-indigo-600 hover:text-indigo-800 inline-block mb-4">
        ← Back to Directory
      </router-link>
    </div>

    <!-- Print Type Selection -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 no-print">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Select Print Type</h2>
      <div class="space-y-3">
        <label class="flex items-center cursor-pointer">
          <input
            type="radio"
            v-model="selectedPrintType"
            value="directory"
            class="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-gray-700">Directory</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input
            type="radio"
            v-model="selectedPrintType"
            value="labels-5163"
            class="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-gray-700">Address Labels - Avery 5163/8163</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input
            type="radio"
            v-model="selectedPrintType"
            value="labels-5160"
            class="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-gray-700">Address Labels - Avery 5160</span>
        </label>
        <label class="flex items-center cursor-pointer">
          <input
            type="radio"
            v-model="selectedPrintType"
            value="envelopes"
            class="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-gray-700">#10 Envelopes</span>
        </label>
      </div>
    </div>

    <!-- Preview Area -->
    <div v-if="selectedPrintType" class="print-preview-container">
      <!-- Directory Preview -->
      <PrintView v-if="selectedPrintType === 'directory'" class="preview-mode" />

      <!-- Labels 5163/8163 Preview -->
      <LabelPrintView v-if="selectedPrintType === 'labels-5163'" class="preview-mode" />

      <!-- Labels 5160 Preview -->
      <LabelPrintView5160 v-if="selectedPrintType === 'labels-5160'" class="preview-mode" />

      <!-- Envelopes Preview -->
      <EnvelopePrintView v-if="selectedPrintType === 'envelopes'" class="preview-mode" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PrintView from './PrintView.vue';
import LabelPrintView from './LabelPrintView.vue';
import LabelPrintView5160 from './LabelPrintView5160.vue';
import EnvelopePrintView from './EnvelopePrintView.vue';

const selectedPrintType = ref('');
</script>

<style scoped>
.print-preview-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
}

.preview-mode {
  max-height: 600px;
  overflow-y: auto;
}

/* Show all controls in preview mode - they'll be hidden when actually printing via @media print */
.preview-mode :deep(.no-print) {
  display: revert !important;
}
</style>

<style>
@media print {
  .no-print {
    display: none !important;
  }
  
  .print-preview-container {
    border: none !important;
    max-height: none !important;
    overflow: visible !important;
  }
  
  .preview-mode {
    max-height: none !important;
    overflow: visible !important;
  }
}
</style>
