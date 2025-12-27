import { Person } from '../models/Person.js';
import pool from '../config/database.js';

/**
 * Calculate the relationship between two people based on parent-child relationships
 * Uses mother_id and father_id from the persons table
 * 
 * @param {string} currentUserId - The logged-in user's ID
 * @param {string} targetPersonId - The person to find relationship to
 * @returns {Promise<string|null>} - Relationship label (e.g., "Niece", "Nephew", "Cousin", "Sibling", etc.) or null if no relationship
 */
export async function calculateRelationship(currentUserId, targetPersonId) {
  // Same person
  if (currentUserId === targetPersonId) {
    return null; // Don't show relationship to self
  }

  // Get both people
  const currentUser = await Person.findById(currentUserId);
  const targetPerson = await Person.findById(targetPersonId);

  if (!currentUser || !targetPerson) {
    return null;
  }

  // Collect all person IDs we need (parents, grandparents, etc.)
  const personIdsToLoad = new Set([currentUserId, targetPersonId]);
  
  // Add parent IDs
  if (currentUser.mother_id) personIdsToLoad.add(currentUser.mother_id);
  if (currentUser.father_id) personIdsToLoad.add(currentUser.father_id);
  if (targetPerson.mother_id) personIdsToLoad.add(targetPerson.mother_id);
  if (targetPerson.father_id) personIdsToLoad.add(targetPerson.father_id);

  // Load all people we need in one query
  const peopleMap = new Map();
  if (personIdsToLoad.size > 0) {
    const idsArray = Array.from(personIdsToLoad);
    const result = await pool.query(
      `SELECT * FROM persons WHERE id = ANY($1::uuid[])`,
      [idsArray]
    );
    result.rows.forEach(p => peopleMap.set(p.id, p));
  }

  // Get people from map
  const currentUserFromMap = peopleMap.get(currentUserId);
  const targetPersonFromMap = peopleMap.get(targetPersonId);

  if (!currentUserFromMap || !targetPersonFromMap) {
    return null;
  }

  // Get parents for both
  const currentUserParents = [];
  if (currentUserFromMap.mother_id && peopleMap.has(currentUserFromMap.mother_id)) {
    currentUserParents.push(peopleMap.get(currentUserFromMap.mother_id));
  }
  if (currentUserFromMap.father_id && peopleMap.has(currentUserFromMap.father_id)) {
    currentUserParents.push(peopleMap.get(currentUserFromMap.father_id));
  }

  const targetPersonParents = [];
  if (targetPersonFromMap.mother_id && peopleMap.has(targetPersonFromMap.mother_id)) {
    targetPersonParents.push(peopleMap.get(targetPersonFromMap.mother_id));
  }
  if (targetPersonFromMap.father_id && peopleMap.has(targetPersonFromMap.father_id)) {
    targetPersonParents.push(peopleMap.get(targetPersonFromMap.father_id));
  }

  // Direct parent-child relationships
  if (currentUserParents.some(p => p.id === targetPersonId)) {
    // Current user's parent is the target person
    return targetPersonFromMap.gender === 'Female' ? 'Mother' : 'Father';
  }
  if (targetPersonParents.some(p => p.id === currentUserId)) {
    // Target person's parent is the current user - target is the child
    return targetPersonFromMap.gender === 'Female' ? 'Daughter' : 'Son';
  }

  // Siblings (share at least one parent)
  const sharedParents = currentUserParents.filter(p => 
    targetPersonParents.some(tp => tp.id === p.id)
  );
  if (sharedParents.length > 0) {
    return targetPersonFromMap.gender === 'Female' ? 'Sister' : 'Brother';
  }

  // Load grandparents if needed
  const grandparentIds = new Set();
  currentUserParents.forEach(p => {
    if (p.mother_id) grandparentIds.add(p.mother_id);
    if (p.father_id) grandparentIds.add(p.father_id);
  });
  targetPersonParents.forEach(p => {
    if (p.mother_id) grandparentIds.add(p.mother_id);
    if (p.father_id) grandparentIds.add(p.father_id);
  });

  // Load grandparents
  if (grandparentIds.size > 0) {
    const grandparentArray = Array.from(grandparentIds);
    const grandparentResult = await pool.query(
      `SELECT * FROM persons WHERE id = ANY($1::uuid[])`,
      [grandparentArray]
    );
    grandparentResult.rows.forEach(p => peopleMap.set(p.id, p));
  }

  // Grandparent/Grandchild relationships
  // Check if current user's parent is target's grandparent
  for (const parent of currentUserParents) {
    const parentParents = [];
    if (parent.mother_id && peopleMap.has(parent.mother_id)) {
      parentParents.push(peopleMap.get(parent.mother_id));
    }
    if (parent.father_id && peopleMap.has(parent.father_id)) {
      parentParents.push(peopleMap.get(parent.father_id));
    }
    if (parentParents.some(p => p.id === targetPersonId)) {
      return targetPersonFromMap.gender === 'Female' ? 'Grandmother' : 'Grandfather';
    }
  }

  // Check if target's parent is current user's grandparent
  for (const parent of targetPersonParents) {
    const parentParents = [];
    if (parent.mother_id && peopleMap.has(parent.mother_id)) {
      parentParents.push(peopleMap.get(parent.mother_id));
    }
    if (parent.father_id && peopleMap.has(parent.father_id)) {
      parentParents.push(peopleMap.get(parent.father_id));
    }
    if (parentParents.some(p => p.id === currentUserId)) {
      return currentUserFromMap.gender === 'Female' ? 'Granddaughter' : 'Grandson';
    }
  }

  // Niece/Nephew relationships
  // If target's parent is current user's sibling
  for (const targetParent of targetPersonParents) {
    const targetParentParents = [];
    if (targetParent.mother_id && peopleMap.has(targetParent.mother_id)) {
      targetParentParents.push(peopleMap.get(targetParent.mother_id));
    }
    if (targetParent.father_id && peopleMap.has(targetParent.father_id)) {
      targetParentParents.push(peopleMap.get(targetParent.father_id));
    }
    
    // Check if target's parent shares a parent with current user (making them siblings)
    const isSibling = currentUserParents.some(cp => 
      targetParentParents.some(tpp => tpp.id === cp.id)
    );
    
    if (isSibling) {
      return targetPersonFromMap.gender === 'Female' ? 'Niece' : 'Nephew';
    }
  }

  // If current user's parent is target's sibling
  for (const currentParent of currentUserParents) {
    const currentParentParents = [];
    if (currentParent.mother_id && peopleMap.has(currentParent.mother_id)) {
      currentParentParents.push(peopleMap.get(currentParent.mother_id));
    }
    if (currentParent.father_id && peopleMap.has(currentParent.father_id)) {
      currentParentParents.push(peopleMap.get(currentParent.father_id));
    }
    
    // Check if current user's parent shares a parent with target (making them siblings)
    const isSibling = targetPersonParents.some(tp => 
      currentParentParents.some(cpp => cpp.id === tp.id)
    );
    
    if (isSibling) {
      return targetPersonFromMap.gender === 'Female' ? 'Aunt' : 'Uncle';
    }
  }

  // Cousins (parents are siblings)
  for (const currentParent of currentUserParents) {
    const currentParentParents = [];
    if (currentParent.mother_id && peopleMap.has(currentParent.mother_id)) {
      currentParentParents.push(peopleMap.get(currentParent.mother_id));
    }
    if (currentParent.father_id && peopleMap.has(currentParent.father_id)) {
      currentParentParents.push(peopleMap.get(currentParent.father_id));
    }

    for (const targetParent of targetPersonParents) {
      const targetParentParents = [];
      if (targetParent.mother_id && peopleMap.has(targetParent.mother_id)) {
        targetParentParents.push(peopleMap.get(targetParent.mother_id));
      }
      if (targetParent.father_id && peopleMap.has(targetParent.father_id)) {
        targetParentParents.push(peopleMap.get(targetParent.father_id));
      }

      // If parents share a parent, they're siblings, making current user and target cousins
      const areSiblings = currentParentParents.some(cpp => 
        targetParentParents.some(tpp => tpp.id === cpp.id)
      );

      if (areSiblings) {
        return 'Cousin';
      }
    }
  }

  return null; // No relationship found
}
