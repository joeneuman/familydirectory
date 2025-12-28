<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">
    <div v-if="loading" class="text-center py-12">
      <div class="text-soft-600">Loading...</div>
    </div>

    <div v-else-if="treeData.length === 0" class="text-center py-12">
      <div class="text-soft-600">No family tree data available</div>
    </div>

    <div v-else class="space-y-8">
      <!-- Render each G1 tree -->
      <div
        v-for="(tree, treeIndex) in treeData"
          :key="treeIndex"
        class="fam-tree-container"
      >
        <!-- G1 Header -->
        <div class="text-center mb-6">
          <div class="inline-block px-4 py-2 bg-warm-200 rounded-lg">
            <h2 class="text-xl font-bold text-warm-700">{{ tree.g1Label }}</h2>
          </div>
        </div>

        <!-- SVG Canvas for Tree -->
        <div class="relative overflow-x-auto" :style="{ minHeight: `${tree.height}px` }">
          <svg
            :width="tree.width"
            :height="tree.height"
            class="tree-svg"
            style="display: block;"
          >
            <!-- Draw connection lines -->
            <g v-for="(line, lineIndex) in tree.lines" :key="`line-${lineIndex}`">
              <line
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
                stroke="#8B7355"
                stroke-width="2"
              />
            </g>
          </svg>

          <!-- Person nodes positioned absolutely -->
          <div class="absolute inset-0">
            <div
              v-for="(node, nodeIndex) in tree.nodes"
              :key="`node-${nodeIndex}`"
              :style="{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: 'translate(-50%, -50%)',
                width: node.hasSpouse ? '240px' : '160px'
              }"
              class="person-node"
            >
              <div class="text-center">
                <!-- Photos - show both side by side for married couples -->
                <div class="mb-2 flex justify-center">
                  <div v-if="node.hasSpouse && node.spouse" class="flex -space-x-2">
                    <!-- Main person photo -->
                    <router-link :to="`/person/${node.person.id}`" class="block">
                      <img
                        v-if="node.person.photo_url"
                        :src="getPhotoURL(node.person.photo_url, node.person.id)"
                        :alt="node.person.full_name || `${node.person.first_name} ${node.person.last_name}`"
                        class="w-16 h-16 rounded-full object-cover border-2 border-white"
                      />
                      <div
                        v-else
                        class="w-16 h-16 rounded-full bg-warm-200 border-2 border-white flex items-center justify-center"
                      >
                        <span class="text-warm-600 text-xl font-bold">
                          {{ (node.person.full_name || `${node.person.first_name} ${node.person.last_name}`).charAt(0).toUpperCase() }}
                        </span>
                      </div>
                    </router-link>
                    <!-- Spouse photo -->
                    <router-link :to="`/person/${node.spouse.id}`" class="block">
                      <img
                        v-if="node.spouse.photo_url"
                        :src="getPhotoURL(node.spouse.photo_url, node.spouse.id)"
                        :alt="node.spouse.full_name || `${node.spouse.first_name} ${node.spouse.last_name}`"
                        class="w-16 h-16 rounded-full object-cover border-2 border-white"
                      />
                      <div
                        v-else
                        class="w-16 h-16 rounded-full bg-warm-200 border-2 border-white flex items-center justify-center"
                      >
                        <span class="text-warm-600 text-xl font-bold">
                          {{ (node.spouse.full_name || `${node.spouse.first_name} ${node.spouse.last_name}`).charAt(0).toUpperCase() }}
                        </span>
                      </div>
                    </router-link>
                  </div>
                  <!-- Single photo for unmarried -->
                  <router-link v-else :to="`/person/${node.person.id}`" class="block">
                    <img
                      v-if="node.person.photo_url"
                      :src="getPhotoURL(node.person.photo_url, node.person.id)"
                      :alt="node.person.full_name || `${node.person.first_name} ${node.person.last_name}`"
                      class="w-16 h-16 rounded-full object-cover"
                    />
                    <div
                      v-else
                      class="w-16 h-16 rounded-full bg-warm-200 flex items-center justify-center"
                    >
                      <span class="text-warm-600 text-xl font-bold">
                        {{ (node.person.full_name || `${node.person.first_name} ${node.person.last_name}`).charAt(0).toUpperCase() }}
                      </span>
                    </div>
                  </router-link>
                </div>
                <!-- Names -->
                <div class="text-sm font-semibold text-warm-700">
                  <router-link :to="`/person/${node.person.id}`" class="hover:text-warm-800">
                    {{ node.person.full_name || `${node.person.first_name} ${node.person.last_name}` }}
                  </router-link>
                  <span v-if="node.hasSpouse && node.spouse" class="block text-xs text-soft-600 mt-1">
                    & {{ node.spouse.full_name || `${node.spouse.first_name} ${node.spouse.last_name}` }}
                  </span>
                </div>
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
import { getApiBaseURL, getPhotoURL } from '../utils/api.js';

const persons = ref([]);
const loading = ref(true);

// Tree layout configuration
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100; // Reduced since we removed card padding
const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 160; // Reduced spacing
const GENERATION_OFFSET = 100; // Top padding for G1

// Build family tree data structure
const treeData = computed(() => {
  if (!persons.value || persons.value.length === 0) return [];

  // Group people by G1 (root ancestors)
  const g1People = persons.value.filter(p => p.generation === 'G1');
  
  if (g1People.length === 0) return [];

  // Build tree for each G1
  return g1People.map(g1 => {
    const tree = buildTreeForG1(g1);
    return {
      g1Label: g1.full_name || `${g1.first_name} ${g1.last_name}`,
      g1Id: g1.id,
      nodes: tree.nodes,
      lines: tree.lines,
      width: tree.width,
      height: tree.height
    };
  });
});

function buildTreeForG1(g1Person) {
  const nodes = [];
  const lines = [];
  const personMap = new Map();
  
  // Add all persons to map for quick lookup
  persons.value.forEach(p => personMap.set(p.id, p));
  
  // Build family tree structure recursively
  const treeStructure = new Map();
  const visited = new Set();
  
  function addToTree(person, generation) {
    if (visited.has(person.id)) return;
    visited.add(person.id);
    
    if (!treeStructure.has(person.id)) {
      treeStructure.set(person.id, {
        person,
        generation,
        children: []
      });
    }
    
    // Find children
    const children = persons.value.filter(p => 
      (p.mother_id === person.id || p.father_id === person.id) && !visited.has(p.id)
    );
    
    children.forEach(child => {
      const childGen = parseInt(child.generation?.replace('G', '') || '999');
      addToTree(child, childGen);
      treeStructure.get(person.id).children.push(child.id);
    });
  }
  
  // Build tree starting from G1
  addToTree(g1Person, 1);
  
  // Group by generation
  const generationMap = new Map();
  treeStructure.forEach((node, personId) => {
    if (!generationMap.has(node.generation)) {
      generationMap.set(node.generation, []);
    }
    generationMap.get(node.generation).push({ personId, ...node });
  });
  
  // Sort generations
  const sortedGenerations = Array.from(generationMap.keys()).sort((a, b) => a - b);
  
  // Calculate positions - two pass approach
  const nodePositions = new Map();
  let maxWidth = 0;
  
  // Pass 1: Position all nodes, grouping siblings
  // Process from bottom generation to top
  for (let i = sortedGenerations.length - 1; i >= 0; i--) {
    const genNum = sortedGenerations[i];
    const genNodes = generationMap.get(genNum);
    
    // Group siblings (children of same parent pair)
    const siblingGroups = new Map(); // parentKey -> [nodes]
    const standalone = [];
    
    genNodes.forEach(node => {
      const person = node.person;
      if (person.mother_id || person.father_id) {
        const parentKey = `${person.mother_id || ''}_${person.father_id || ''}`;
        if (!siblingGroups.has(parentKey)) {
          siblingGroups.set(parentKey, []);
        }
        siblingGroups.get(parentKey).push(node);
      } else {
        standalone.push(node);
      }
    });
    
    // Sort each group by age/name
    const sortNodes = (nodeList) => {
      return nodeList.sort((a, b) => {
        const ageA = Number(a.person.age) || 0;
        const ageB = Number(b.person.age) || 0;
        if (ageA !== ageB) return ageB - ageA;
        const nameA = (a.person.full_name || `${a.person.first_name} ${a.person.last_name}`).toLowerCase();
        const nameB = (b.person.full_name || `${b.person.first_name} ${b.person.last_name}`).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    };
    
    // Sort all groups
    const sortedSiblingGroups = new Map();
    siblingGroups.forEach((group, key) => {
      sortedSiblingGroups.set(key, sortNodes([...group]));
    });
    const sortedStandalone = sortNodes(standalone);
    
    // Position nodes in this generation
    let currentX = HORIZONTAL_SPACING;
    const allGroups = [...Array.from(sortedSiblingGroups.values()), ...(sortedStandalone.length > 0 ? [sortedStandalone] : [])];
    
    allGroups.forEach(group => {
      group.forEach((node, index) => {
        const x = currentX + (index * HORIZONTAL_SPACING);
        nodePositions.set(node.personId, { x, y: 0 });
      });
      currentX += (group.length * HORIZONTAL_SPACING) + (HORIZONTAL_SPACING * 0.5);
    });
    
    maxWidth = Math.max(maxWidth, currentX);
    
    // Pass 2: Center parents above their children (for previous generation)
    if (i > 0) {
      sortedSiblingGroups.forEach((group, parentKey) => {
        if (group.length > 0) {
          const firstChildX = nodePositions.get(group[0].personId)?.x || 0;
          const lastChildX = nodePositions.get(group[group.length - 1].personId)?.x || 0;
          const centerX = (firstChildX + lastChildX) / 2;
          
          // Find parent(s) - could be mother or father
          const firstChild = group[0].person;
          const parentId = firstChild.mother_id || firstChild.father_id;
          
          if (parentId && treeStructure.has(parentId)) {
            const existingPos = nodePositions.get(parentId);
            if (!existingPos || existingPos.x === 0) {
              nodePositions.set(parentId, { x: centerX, y: 0 });
            } else {
              // If parent already positioned, average with children center
              nodePositions.set(parentId, { x: (existingPos.x + centerX) / 2, y: 0 });
            }
          }
        }
      });
    }
  }
  
  // Track which people have been added as primary nodes (to avoid duplicates for married couples)
  const addedAsPrimary = new Set();
  
  // Set Y positions and create final nodes/lines
  let currentY = GENERATION_OFFSET;
  
  sortedGenerations.forEach(genNum => {
    const genNodes = generationMap.get(genNum);
    
    // Sort by x position
    const sortedNodes = genNodes.sort((a, b) => {
      const posA = nodePositions.get(a.personId)?.x || 0;
      const posB = nodePositions.get(b.personId)?.x || 0;
      return posA - posB;
    });
    
    sortedNodes.forEach(node => {
      const pos = nodePositions.get(node.personId);
      if (pos) {
        pos.y = currentY;
        
        // Check if person has a spouse
        const spouse = node.person.spouse;
        const hasSpouse = !!spouse;
        
        // If this person has a spouse, check if the spouse is already added as a primary node
        if (hasSpouse && spouse && addedAsPrimary.has(spouse.id)) {
          // Spouse is already a primary node, skip adding this person
          // They will be shown as spouse on the other node
          return;
        }
        
        // Add this person as primary node
        addedAsPrimary.add(node.person.id);
        
        // If spouse exists and is also in the tree structure, mark spouse as added too
        // and set spouse's position to match this person's position (so lines connect correctly)
        if (hasSpouse && spouse) {
          const spouseInTree = treeStructure.has(spouse.id);
          if (spouseInTree) {
            addedAsPrimary.add(spouse.id);
            // Set spouse's position to match this person's position
            // This ensures lines from spouse's children connect to the correct location
            nodePositions.set(spouse.id, { x: pos.x, y: currentY });
          }
        }
        
        nodes.push({
          person: node.person,
          spouse: spouse,
          hasSpouse: hasSpouse,
          x: pos.x,
          y: pos.y
        });
        
        // Draw line to biological parent only
        const person = node.person;
        let biologicalParentId = null;
        
        // Check if mother is biological
        if (person.mother_id && person.mother_relationship_type === 'biological') {
          biologicalParentId = person.mother_id;
        }
        // Check if father is biological (only if no biological mother)
        else if (person.father_id && person.father_relationship_type === 'biological') {
          biologicalParentId = person.father_id;
        }
        // Fallback: if relationship type not set, assume biological
        else if (person.mother_id && (!person.mother_relationship_type || person.mother_relationship_type === 'biological')) {
          biologicalParentId = person.mother_id;
        }
        else if (person.father_id && (!person.father_relationship_type || person.father_relationship_type === 'biological')) {
          biologicalParentId = person.father_id;
        }
        
        if (biologicalParentId) {
          const parentPos = nodePositions.get(biologicalParentId);
          
          if (parentPos && parentPos.y > 0) {
            lines.push({
              x1: parentPos.x,
              y1: parentPos.y + 40, // Below photo
              x2: pos.x,
              y2: pos.y - 40 // Above photo
            });
          }
        }
      }
    });
    
    currentY += VERTICAL_SPACING;
  });
  
  const width = Math.max(1200, maxWidth + HORIZONTAL_SPACING);
  const height = currentY + GENERATION_OFFSET;
  
  return { nodes, lines, width, height };
}

async function fetchPersons() {
  try {
    const response = await axios.get(`${getApiBaseURL()}/persons`);
    const personsList = response.data;
    
    // Fetch spouse data for all persons (batch in chunks to avoid overwhelming the server)
    const chunkSize = 10;
    const enrichedPersons = [];
    
    for (let i = 0; i < personsList.length; i += chunkSize) {
      const chunk = personsList.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (person) => {
          try {
            const personResponse = await axios.get(`${getApiBaseURL()}/persons/${person.id}`);
            return personResponse.data;
          } catch (error) {
            // If individual fetch fails, return person without spouse
            return person;
          }
        })
      );
      enrichedPersons.push(...chunkResults);
    }
    
    persons.value = enrichedPersons;
  } catch (error) {
    console.error('Error fetching persons:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchPersons();
});
</script>

<style scoped>
.fam-tree-container {
  margin-bottom: 4rem;
}

.tree-svg {
  background: transparent;
}

.person-node {
  z-index: 10;
}

.person-node:hover {
  z-index: 20;
}
</style>

