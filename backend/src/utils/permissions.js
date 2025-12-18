import { Relationship } from '../models/Relationship.js';
import { Person } from '../models/Person.js';

/**
 * Check if currentUserId can edit targetPersonId
 * Rules:
 * 1. A person can always edit themselves
 * 2. Admins can edit anyone
 * 3. A person can edit if they are an ancestor of the target
 * 4. A person can edit if they are the spouse of someone who is an ancestor
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

