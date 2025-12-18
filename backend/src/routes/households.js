import express from 'express';
import { Household } from '../models/Household.js';
import { Person } from '../models/Person.js';
import { authenticateToken } from '../middleware/auth.js';
import { canEdit } from '../utils/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Helper function to find oldest blood relative in household
async function findOldestBloodRelative(householdId, members, household = null) {
  if (members.length === 0) return null;

  // First, check if household has a primary_contact_person_id set
  // This is the explicit head of household
  if (household && household.primary_contact_person_id) {
    const primaryContact = members.find(m => m.id === household.primary_contact_person_id);
    if (primaryContact) {
      return primaryContact;
    }
  }

  // Get all person IDs in household
  const memberIds = members.map(m => m.id);

  // Find blood relatives - people who are part of the family lineage
  // A person is a blood relative if:
  // 1. They have a generation (G1, G2, G3, etc.) - they're part of the family tree
  // 2. They have parents (in relationships table) - they're a descendant
  // 3. They have children - they're an ancestor
  // Spouses who married in and have no generation/parents/children are NOT blood relatives
  const bloodRelatives = [];
  
  for (const member of members) {
    let isBloodRelative = false;

    // Check if they have a generation assigned (part of family tree)
    if (member.generation) {
      isBloodRelative = true;
    } else {
      // Check if they have parents (they're a descendant in the family tree)
      const parents = await Person.getParents(member.id);
      if (parents.length > 0) {
        isBloodRelative = true;
      } else {
        // Check if they have children (they're an ancestor)
        const children = await Person.getChildren(member.id);
        if (children.length > 0) {
          isBloodRelative = true;
        }
      }
    }

    if (isBloodRelative) {
      bloodRelatives.push(member);
    }
  }

  if (bloodRelatives.length === 0) {
    // If no clear blood relatives found, use the oldest person with a generation
    const withGeneration = members.filter(m => m.generation);
    if (withGeneration.length > 0) {
      return withGeneration.sort((a, b) => {
        if (!a.age && !b.age) return 0;
        if (!a.age) return 1;
        if (!b.age) return -1;
        return b.age - a.age; // Oldest first
      })[0];
    }
    // Last resort: oldest person
    return members.sort((a, b) => {
      if (!a.age && !b.age) return 0;
      if (!a.age) return 1;
      if (!b.age) return -1;
      return b.age - a.age; // Oldest first
    })[0];
  }

  // Sort blood relatives:
  // 1. By generation (G1 first, then G2, etc.)
  // 2. Prioritize those with parents (they're descendants in the family tree)
  // 3. Then by age (oldest first)
  const bloodRelativesWithParents = await Promise.all(
    bloodRelatives.map(async (person) => {
      const parents = await Person.getParents(person.id);
      return { person, hasParents: parents.length > 0 };
    })
  );

  bloodRelativesWithParents.sort((a, b) => {
    // First sort by generation
    const genA = a.person.generation ? parseInt(a.person.generation.replace('G', '')) || 999 : 999;
    const genB = b.person.generation ? parseInt(b.person.generation.replace('G', '')) || 999 : 999;
    if (genA !== genB) return genA - genB;

    // Then prioritize those with parents (descendants in family tree)
    if (a.hasParents && !b.hasParents) return -1;
    if (!a.hasParents && b.hasParents) return 1;

    // For same generation and parent status, prefer first name alphabetically (Jane before John)
    // This is a simple tiebreaker - you can set primary_contact_person_id for explicit control
    const nameA = (a.person.first_name || '').toLowerCase();
    const nameB = (b.person.first_name || '').toLowerCase();
    if (nameA !== nameB) return nameA.localeCompare(nameB);

    // Then by age (oldest first)
    const ageA = a.person.age;
    const ageB = b.person.age;
    if (!ageA && !ageB) return 0;
    if (!ageA) return 1;
    if (!ageB) return -1;
    return ageB - ageA;
  });

  return bloodRelativesWithParents[0].person;
}

// Helper function to get household address from members
function getHouseholdAddress(members) {
  // Prefer address from oldest blood relative, or any member with address
  const memberWithAddress = members.find(m => 
    m.address_line1 || m.city || m.state
  );
  
  if (!memberWithAddress) return null;

  const parts = [];
  if (memberWithAddress.address_line1) parts.push(memberWithAddress.address_line1);
  if (memberWithAddress.address_line2) parts.push(memberWithAddress.address_line2);
  if (memberWithAddress.city || memberWithAddress.state || memberWithAddress.postal_code) {
    const cityStateZip = [
      memberWithAddress.city,
      memberWithAddress.state,
      memberWithAddress.postal_code
    ].filter(Boolean).join(', ');
    if (cityStateZip) parts.push(cityStateZip);
  }
  if (memberWithAddress.country && memberWithAddress.country !== 'USA') {
    parts.push(memberWithAddress.country);
  }

  return parts.length > 0 ? parts.join('\n') : null;
}

// Get all households with their members
router.get('/', async (req, res) => {
  try {
    const households = await Household.findAll();
    
    // Get members for each household
    const householdsWithMembers = await Promise.all(
      households.map(async (household) => {
        const members = await Person.findByHousehold(household.id);
        
        // Skip households with no members - they shouldn't exist
        if (members.length === 0) {
          return null;
        }
        
        // Find oldest blood relative for naming
        const oldestBloodRelative = await findOldestBloodRelative(household.id, members, household);
        
        // Compute display name
        let displayName = household.name;
        if (oldestBloodRelative) {
          displayName = `${oldestBloodRelative.first_name} ${oldestBloodRelative.last_name} Household`;
        }

        // Get household address
        const address = getHouseholdAddress(members);

        return {
          ...household,
          display_name: displayName,
          address: address,
          members: members.map(m => ({
            id: m.id,
            first_name: m.first_name,
            last_name: m.last_name,
            full_name: m.full_name || `${m.first_name} ${m.last_name}`,
            email: m.email,
            generation: m.generation,
            address_line1: m.address_line1,
            address_line2: m.address_line2,
            city: m.city,
            state: m.state,
            postal_code: m.postal_code,
            country: m.country,
          })),
        };
      })
    );

    // Filter out null values (empty households)
    const validHouseholds = householdsWithMembers.filter(h => h !== null);

    res.json(validHouseholds);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single household
router.get('/:id', async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);
    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    const members = await Person.findByHousehold(req.params.id);
    
    // Find oldest blood relative for naming
    const oldestBloodRelative = await findOldestBloodRelative(req.params.id, members, household);
    
    // Compute display name
    let displayName = household.name;
    if (oldestBloodRelative) {
      displayName = `${oldestBloodRelative.first_name} ${oldestBloodRelative.last_name} Household`;
    }

    // Get household address
    const address = getHouseholdAddress(members);

    res.json({
      ...household,
      display_name: displayName,
      address: address,
      members,
    });
  } catch (error) {
    console.error('Error fetching household:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make person head of household and manage household membership
router.post('/:id/set-head', async (req, res) => {
  try {
    let householdId = req.params.id;
    const { headPersonId, memberIds } = req.body;

    if (!headPersonId) {
      return res.status(400).json({ error: 'Head person ID is required' });
    }

    // Check permission - user must be able to edit the head person
    const hasPermission = await canEdit(req.user.id, headPersonId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to set this person as head of household' });
    }

    // Get head person
    const headPerson = await Person.findById(headPersonId);
    if (!headPerson) {
      return res.status(404).json({ error: 'Head person not found' });
    }

    // Get or create household
    let household;
    if (householdId === 'new' || householdId === 'null') {
      // Create new household
      household = await Household.create({
        name: `${headPerson.first_name} ${headPerson.last_name} Household`,
        primary_contact_person_id: headPersonId,
      });
      householdId = household.id;
    } else {
      // Update existing household
      household = await Household.findById(householdId);
      if (!household) {
        return res.status(404).json({ error: 'Household not found' });
      }
      await Household.update(householdId, {
        primary_contact_person_id: headPersonId,
      });
    }

    // Set head person's household
    await Person.update(headPersonId, {
      primary_household_id: household.id,
    });

    // Update all member household assignments
    if (memberIds && Array.isArray(memberIds)) {
      // Remove all selected members from their current households first
      for (const memberId of memberIds) {
        // Check permission for each member
        const canEditMember = await canEdit(req.user.id, memberId);
        if (canEditMember) {
          await Person.update(memberId, {
            primary_household_id: household.id,
          });
        }
      }
    }

    // Get updated household with members
    const members = await Person.findByHousehold(household.id);
    const oldestBloodRelative = await findOldestBloodRelative(household.id, members, household);
    const displayName = oldestBloodRelative 
      ? `${oldestBloodRelative.first_name} ${oldestBloodRelative.last_name} Household`
      : household.name;
    const address = getHouseholdAddress(members);

    res.json({
      ...household,
      display_name: displayName,
      address: address,
      members,
    });
  } catch (error) {
    console.error('Error setting head of household:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove person from household
router.post('/remove-member', async (req, res) => {
  try {
    const { personId } = req.body;

    if (!personId) {
      return res.status(400).json({ error: 'Person ID is required' });
    }

    // Check permission
    const hasPermission = await canEdit(req.user.id, personId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to remove this person from household' });
    }

    // Remove person from household
    await Person.update(personId, {
      primary_household_id: null,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing person from household:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

