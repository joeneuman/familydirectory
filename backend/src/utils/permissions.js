import { Relationship } from '../models/Relationship.js';
import { Person } from '../models/Person.js';
import { Household } from '../models/Household.js';

/**
 * Check if currentUserId can edit targetPersonId
 * Rules:
 * 1. A person can always edit themselves
 * 2. Admins can edit anyone
 * 3. A person can edit if they are an ancestor of the target
 * 4. A person can edit if they are the spouse of someone who is an ancestor
 * 5. A head of household can edit anyone in their household
 */
export async function canEdit(currentUserId, targetPersonId) {
  // Rule 1: Can always edit self
  if (currentUserId === targetPersonId) {
    return true;
  }

  // Rule 2: Check if current user is an admin
  const currentUser = await Person.findById(currentUserId);
  if (currentUser && currentUser.is_admin) {
    return true;
  }

  // Rule 5: Check if current user is head of household and target is in same household
  if (currentUser && currentUser.primary_household_id) {
    const targetPerson = await Person.findById(targetPersonId);
    if (targetPerson && targetPerson.primary_household_id === currentUser.primary_household_id) {
      // Both are in the same household, check if current user is the head
      const household = await Household.findById(currentUser.primary_household_id);
      if (household) {
        // Check if current user is the primary contact (explicit head)
        if (household.primary_contact_person_id === currentUserId) {
          return true;
        }
        // If no explicit primary contact, check if current user is the only member (implicit head)
        if (!household.primary_contact_person_id) {
          const members = await Person.findByHousehold(currentUser.primary_household_id);
          if (members.length === 1 && members[0].id === currentUserId) {
            return true;
          }
        }
      }
    }
  }

  // Rule 3: Check if current user is an ancestor
  const isAncestor = await Relationship.isAncestor(currentUserId, targetPersonId);
  if (isAncestor) {
    return true;
  }

  // Rule 4: Check if current user is spouse of an ancestor
  const spouse = await Person.getSpouse(currentUserId);
  if (spouse) {
    const isSpouseAncestor = await Relationship.isAncestor(spouse.id, targetPersonId);
    if (isSpouseAncestor) {
      return true;
    }
  }

  return false;
}

