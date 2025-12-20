import express from 'express';
import { Person } from '../models/Person.js';
import { Household } from '../models/Household.js';
import { MaritalRelationship } from '../models/MaritalRelationship.js';
import { authenticateToken } from '../middleware/auth.js';
import { canEdit } from '../utils/permissions.js';
import { differenceInYears, parseISO } from 'date-fns';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all persons (for directory/search)
router.get('/', async (req, res) => {
  try {
    const { search, sort } = req.query;
    let persons = await Person.findAll();

    // Enrich persons with household information
    const householdsMap = new Map();
    for (const person of persons) {
      if (person.primary_household_id && !householdsMap.has(person.primary_household_id)) {
        const household = await Household.findById(person.primary_household_id);
        if (household) {
          householdsMap.set(person.primary_household_id, household);
        }
      }
    }

    // Add is_head_of_household and household_address to each person
    const personsWithHouseholdInfo = await Promise.all(
      persons.map(async (person) => {
        let isHeadOfHousehold = false;
        let householdAddress = null;

        if (person.primary_household_id) {
          const household = householdsMap.get(person.primary_household_id);
          if (household) {
            if (household.primary_contact_person_id) {
              isHeadOfHousehold = household.primary_contact_person_id === person.id;
            } else {
              // If no explicit primary contact, check if person is the only member
              const members = await Person.findByHousehold(person.primary_household_id);
              isHeadOfHousehold = members.length === 1;
            }

            // Get household address if person is not the head
            if (!isHeadOfHousehold) {
              const members = await Person.findByHousehold(person.primary_household_id);
              let headMember = null;
              if (household.primary_contact_person_id) {
                headMember = members.find(m => m.id === household.primary_contact_person_id);
              }
              const addressSource = headMember || members.find(m => m.address_line1 || m.city || m.state) || members[0];
              if (addressSource) {
                householdAddress = getHouseholdAddress([addressSource]);
              }
            }
          }
        } else {
          // Person without household is automatically head of their own household
          isHeadOfHousehold = true;
        }

        // Calculate age if missing but date_of_birth exists
        let calculatedAge = person.age;
        if ((!calculatedAge || calculatedAge === null) && person.date_of_birth) {
          try {
            // Handle both Date objects (from PostgreSQL) and ISO strings
            let dob;
            if (person.date_of_birth instanceof Date) {
              dob = person.date_of_birth;
            } else {
              dob = parseISO(person.date_of_birth);
            }
            calculatedAge = differenceInYears(new Date(), dob);
            // Ensure it's a valid number
            if (isNaN(calculatedAge)) {
              calculatedAge = person.age;
            }
          } catch (e) {
            // Invalid date, keep age as null
            calculatedAge = person.age;
          }
        }

        // Calculate years_married if missing but wedding_anniversary_date exists
        let calculatedYearsMarried = person.years_married;
        if ((!calculatedYearsMarried || calculatedYearsMarried === null) && person.wedding_anniversary_date) {
          try {
            // Handle both Date objects (from PostgreSQL) and ISO strings
            let annDate;
            if (person.wedding_anniversary_date instanceof Date) {
              annDate = person.wedding_anniversary_date;
            } else {
              annDate = parseISO(person.wedding_anniversary_date);
            }
            calculatedYearsMarried = differenceInYears(new Date(), annDate);
            // Ensure it's a valid number
            if (isNaN(calculatedYearsMarried)) {
              calculatedYearsMarried = person.years_married;
            }
          } catch (e) {
            // Invalid date, keep years_married as null
            calculatedYearsMarried = person.years_married;
          }
        }

        // Get spouse if exists
        const spouse = await Person.getSpouse(person.id);

        const enrichedPerson = {
          ...person,
          age: calculatedAge,
          years_married: calculatedYearsMarried,
          is_head_of_household: isHeadOfHousehold,
          household_address: householdAddress,
          spouse: spouse,
        };

        // Filter private fields based on privacy settings
        return filterPrivateFields(enrichedPerson, req.user.id);
      })
    );

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      persons = personsWithHouseholdInfo.filter(p => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        return fullName.includes(searchLower) || 
               (p.email && p.email.toLowerCase().includes(searchLower));
      });
    } else {
      persons = personsWithHouseholdInfo;
    }

    // Sort options
    if (sort) {
      switch (sort) {
        case 'birthday':
          persons.sort((a, b) => {
            if (!a.date_of_birth) return 1;
            if (!b.date_of_birth) return -1;
            // Get next birthday
            const aDate = parseISO(a.date_of_birth);
            const bDate = parseISO(b.date_of_birth);
            const now = new Date();
            const aNext = new Date(now.getFullYear(), aDate.getMonth(), aDate.getDate());
            const bNext = new Date(now.getFullYear(), bDate.getMonth(), bDate.getDate());
            if (aNext < now) aNext.setFullYear(now.getFullYear() + 1);
            if (bNext < now) bNext.setFullYear(now.getFullYear() + 1);
            return aNext - bNext;
          });
          break;
        case 'anniversary':
          persons.sort((a, b) => {
            if (!a.wedding_anniversary_date) return 1;
            if (!b.wedding_anniversary_date) return -1;
            const aDate = parseISO(a.wedding_anniversary_date);
            const bDate = parseISO(b.wedding_anniversary_date);
            const now = new Date();
            const aNext = new Date(now.getFullYear(), aDate.getMonth(), aDate.getDate());
            const bNext = new Date(now.getFullYear(), bDate.getMonth(), bDate.getDate());
            if (aNext < now) aNext.setFullYear(now.getFullYear() + 1);
            if (bNext < now) bNext.setFullYear(now.getFullYear() + 1);
            return aNext - bNext;
          });
          break;
        case 'age_asc':
          persons.sort((a, b) => {
            if (!a.age && !b.age) return 0;
            if (!a.age) return 1;
            if (!b.age) return -1;
            return a.age - b.age;
          });
          break;
        case 'age_desc':
          persons.sort((a, b) => {
            if (!a.age && !b.age) return 0;
            if (!a.age) return 1;
            if (!b.age) return -1;
            return b.age - a.age;
          });
          break;
        case 'generation':
          persons.sort((a, b) => {
            if (!a.generation && !b.generation) return 0;
            if (!a.generation) return 1;
            if (!b.generation) return -1;
            return a.generation.localeCompare(b.generation);
          });
          break;
      }
    }

    res.json(persons);
  } catch (error) {
    console.error('Error fetching persons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to filter private fields based on privacy settings
function filterPrivateFields(person, viewerId) {
  // If viewing own profile, show everything
  if (person.id === viewerId) {
    return person;
  }

  // If no privacy settings, show everything
  if (!person.privacy_settings || typeof person.privacy_settings !== 'object') {
    return person;
  }

  const privacy = person.privacy_settings;
  
  // Check if viewer is in the restricted_people list
  const restrictedPeople = privacy.restricted_people || [];
  if (!Array.isArray(restrictedPeople) || restrictedPeople.length === 0) {
    // No restrictions, show everything
    return person;
  }

  // Check if current viewer is in the restricted list
  const isRestricted = restrictedPeople.includes(viewerId);
  if (!isRestricted) {
    // Viewer is not restricted, show everything
    return person;
  }

  // Viewer is restricted, apply privacy filters
  const filtered = { ...person };

  // Remove private fields based on privacy settings
  if (privacy.photo) {
    filtered.photo_url = null;
  }
  if (privacy.email) {
    filtered.email = null;
  }
  if (privacy.phone) {
    filtered.phone = null;
  }
  if (privacy.address) {
    filtered.address_line1 = null;
    filtered.address_line2 = null;
    filtered.city = null;
    filtered.state = null;
    filtered.postal_code = null;
    filtered.country = null;
    filtered.household_address = null;
  }
  if (privacy.generation) {
    filtered.generation = null;
  }
  if (privacy.age) {
    filtered.age = null;
  }
  if (privacy.birthday) {
    filtered.date_of_birth = null;
  }
  if (privacy.anniversary) {
    filtered.wedding_anniversary_date = null;
  }
  if (privacy.years_married) {
    filtered.years_married = null;
  }
  if (privacy.household_name) {
    // This is handled in the frontend, but we can mark it
    filtered.household_name_hidden = true;
  }

  return filtered;
}

// Helper function to get household address from members
function getHouseholdAddress(members) {
  // Prefer address from head of household, or any member with address
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

// Get single person with relationships
router.get('/:id', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Get related people
    const spouse = await Person.getSpouse(person.id);
    const parents = await Person.getParents(person.id);
    const children = await Person.getChildren(person.id);

    // Check edit permission
    const hasEditPermission = await canEdit(req.user.id, person.id);

    // Determine if person is head of household and get household address
    let isHeadOfHousehold = false;
    let householdAddress = null;
    
    if (person.primary_household_id) {
      const household = await Household.findById(person.primary_household_id);
      if (household) {
        // Check if person is the primary contact (explicit head)
        if (household.primary_contact_person_id) {
          isHeadOfHousehold = household.primary_contact_person_id === person.id;
        } else {
          // If no explicit primary contact, check if person is the only member
          const members = await Person.findByHousehold(person.primary_household_id);
          isHeadOfHousehold = members.length === 1;
        }
        
        // Get household address (from head of household) if person is not the head
        if (!isHeadOfHousehold) {
          const members = await Person.findByHousehold(person.primary_household_id);
          // Find the head of household to get their address
          let headMember = null;
          if (household.primary_contact_person_id) {
            headMember = members.find(m => m.id === household.primary_contact_person_id);
          }
          // Get address from head if available, otherwise from any member with address
          const addressSource = headMember || members.find(m => m.address_line1 || m.city || m.state) || members[0];
          if (addressSource) {
            householdAddress = getHouseholdAddress([addressSource]);
          }
        }
      }
    } else {
      // Person without household is automatically head of their own household
      isHeadOfHousehold = true;
    }

    // Calculate age if missing but date_of_birth exists
    let calculatedAge = person.age;
    if ((!calculatedAge || calculatedAge === null) && person.date_of_birth) {
      try {
        // Handle both Date objects (from PostgreSQL) and ISO strings
        let dob;
        if (person.date_of_birth instanceof Date) {
          dob = person.date_of_birth;
        } else {
          dob = parseISO(person.date_of_birth);
        }
        calculatedAge = differenceInYears(new Date(), dob);
        // Ensure it's a valid number
        if (isNaN(calculatedAge)) {
          calculatedAge = person.age;
        }
      } catch (e) {
        // Invalid date, keep age as null
        calculatedAge = person.age;
      }
    }

    // Calculate years_married if missing but wedding_anniversary_date exists
    let calculatedYearsMarried = person.years_married;
    if ((!calculatedYearsMarried || calculatedYearsMarried === null) && person.wedding_anniversary_date) {
      try {
        // Handle both Date objects (from PostgreSQL) and ISO strings
        let annDate;
        if (person.wedding_anniversary_date instanceof Date) {
          annDate = person.wedding_anniversary_date;
        } else {
          annDate = parseISO(person.wedding_anniversary_date);
        }
        calculatedYearsMarried = differenceInYears(new Date(), annDate);
        // Ensure it's a valid number
        if (isNaN(calculatedYearsMarried)) {
          calculatedYearsMarried = person.years_married;
        }
      } catch (e) {
        // Invalid date, keep years_married as null
        calculatedYearsMarried = person.years_married;
      }
    }

    const enrichedPerson = {
      ...person,
      age: calculatedAge,
      years_married: calculatedYearsMarried,
      spouse,
      parents,
      children,
      canEdit: hasEditPermission,
      is_head_of_household: isHeadOfHousehold,
      household_address: householdAddress,
    };

    // Filter private fields based on privacy settings (unless viewing own profile)
    const filteredPerson = filterPrivateFields(enrichedPerson, req.user.id);

    res.json(filteredPerson);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update person
router.put('/:id', async (req, res) => {
  try {
    const personId = req.params.id;
    
    // Check permission
    const hasPermission = await canEdit(req.user.id, personId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'You do not have permission to edit this person' });
    }

    // Get current person to check if they're head of household
    const currentPerson = await Person.findById(personId);
    if (!currentPerson) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // If person is not head of household, prevent address updates
    let isHeadOfHousehold = false;
    if (currentPerson.primary_household_id) {
      const household = await Household.findById(currentPerson.primary_household_id);
      if (household) {
        if (household.primary_contact_person_id) {
          isHeadOfHousehold = household.primary_contact_person_id === personId;
        } else {
          const members = await Person.findByHousehold(currentPerson.primary_household_id);
          isHeadOfHousehold = members.length === 1;
        }
      }
    } else {
      isHeadOfHousehold = true; // Person without household is head
    }

    // Remove address fields if person is not head of household
    if (!isHeadOfHousehold) {
      delete req.body.address_line1;
      delete req.body.address_line2;
      delete req.body.city;
      delete req.body.state;
      delete req.body.postal_code;
      delete req.body.country;
    }

    // Convert empty strings to null for date fields
    if (req.body.date_of_birth === '') {
      req.body.date_of_birth = null;
    }
    if (req.body.wedding_anniversary_date === '') {
      req.body.wedding_anniversary_date = null;
    }
    
    // Convert empty email string to null to avoid unique constraint violation
    // PostgreSQL unique constraints treat empty strings as values, so multiple empty strings violate the constraint
    if (req.body.email === '') {
      req.body.email = null;
    }

    // Calculate age if date_of_birth is provided
    if (req.body.date_of_birth) {
      try {
        const dob = parseISO(req.body.date_of_birth);
        const calculatedAge = differenceInYears(new Date(), dob);
        req.body.age = isNaN(calculatedAge) ? null : calculatedAge;
      } catch (e) {
        req.body.age = null;
      }
    } else {
      req.body.age = null;
    }

    // Calculate years_married if wedding_anniversary_date is provided
    if (req.body.wedding_anniversary_date) {
      try {
        const annDate = parseISO(req.body.wedding_anniversary_date);
        const calculatedYearsMarried = differenceInYears(new Date(), annDate);
        req.body.years_married = isNaN(calculatedYearsMarried) ? null : calculatedYearsMarried;
      } catch (e) {
        req.body.years_married = null;
      }
    } else {
      req.body.years_married = null;
    }

    // Validate and clean privacy_settings
    if (req.body.privacy_settings) {
      if (typeof req.body.privacy_settings !== 'object') {
        req.body.privacy_settings = {};
      } else {
        // Ensure restricted_people is an array
        if (req.body.privacy_settings.restricted_people && !Array.isArray(req.body.privacy_settings.restricted_people)) {
          req.body.privacy_settings.restricted_people = [];
        }
        // Ensure all boolean fields are actually booleans
        const booleanFields = ['photo', 'email', 'phone', 'address', 'generation', 'age', 'birthday', 'anniversary', 'years_married', 'household_name'];
        for (const field of booleanFields) {
          if (req.body.privacy_settings[field] !== undefined) {
            req.body.privacy_settings[field] = Boolean(req.body.privacy_settings[field]);
          }
        }
      }
    }

    // Update person
    const updatedPerson = await Person.update(personId, req.body);
    
    // If head of household's address was updated, update all household members' addresses
    if (isHeadOfHousehold && currentPerson.primary_household_id) {
      const addressFields = ['address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'];
      const addressWasUpdated = addressFields.some(field => req.body[field] !== undefined);
      
      if (addressWasUpdated) {
        // Get all household members (excluding the head)
        const household = await Household.findById(currentPerson.primary_household_id);
        if (household) {
          const allMembers = await Person.findByHousehold(currentPerson.primary_household_id);
          const membersToUpdate = allMembers.filter(m => m.id !== personId);
          
          // Prepare address fields from updated person
          const headAddressFields = {
            address_line1: req.body.address_line1 !== undefined ? req.body.address_line1 : updatedPerson.address_line1,
            address_line2: req.body.address_line2 !== undefined ? req.body.address_line2 : updatedPerson.address_line2,
            city: req.body.city !== undefined ? req.body.city : updatedPerson.city,
            state: req.body.state !== undefined ? req.body.state : updatedPerson.state,
            postal_code: req.body.postal_code !== undefined ? req.body.postal_code : updatedPerson.postal_code,
            country: req.body.country !== undefined ? req.body.country : updatedPerson.country,
          };
          
          // Update each member's address (only if user has permission to edit them)
          for (const member of membersToUpdate) {
            const canEditMember = await canEdit(req.user.id, member.id);
            if (canEditMember) {
              await Person.update(member.id, headAddressFields);
            }
          }
        }
      }
    }
    
    res.json(updatedPerson);
  } catch (error) {
    console.error('Error updating person:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get current user
router.get('/me/info', async (req, res) => {
  try {
    const person = await Person.findById(req.user.id);
    if (!person) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(person);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete person (admin only)
router.delete('/:id', async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await Person.findById(req.user.id);
    if (!currentUser || !currentUser.is_admin) {
      return res.status(403).json({ error: 'Only administrators can delete contacts' });
    }

    const personId = req.params.id;
    const person = await Person.findById(personId);
    
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Delete person (cascade will handle relationships)
    await Person.delete(personId);
    
    res.json({ success: true, message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new person (admin only)
router.post('/', async (req, res) => {
  try {
    // Check if user is admin
    const currentUser = await Person.findById(req.user.id);
    if (!currentUser || !currentUser.is_admin) {
      return res.status(403).json({ error: 'Only administrators can create new contacts' });
    }

    // Convert empty strings to null for date fields
    if (req.body.date_of_birth === '') {
      req.body.date_of_birth = null;
    }
    if (req.body.wedding_anniversary_date === '') {
      req.body.wedding_anniversary_date = null;
    }

    // Calculate age if date_of_birth is provided
    if (req.body.date_of_birth) {
      const dob = parseISO(req.body.date_of_birth);
      req.body.age = differenceInYears(new Date(), dob);
    } else {
      req.body.age = null;
    }

    // Calculate years_married if wedding_anniversary_date is provided
    if (req.body.wedding_anniversary_date) {
      const annDate = parseISO(req.body.wedding_anniversary_date);
      req.body.years_married = differenceInYears(new Date(), annDate);
    } else {
      req.body.years_married = null;
    }

    // Convert empty strings to null for other optional fields
    const fieldsToNullify = ['email', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'generation', 'photo_url', 'full_name'];
    for (const field of fieldsToNullify) {
      if (req.body[field] === '') {
        req.body[field] = null;
      }
    }

    // Create person
    const newPerson = await Person.create(req.body);
    
    res.status(201).json(newPerson);
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set spouse relationship
router.post('/:id/set-spouse', async (req, res) => {
  try {
    const personId = req.params.id;
    const { spouseId } = req.body;

    if (!spouseId) {
      return res.status(400).json({ error: 'Spouse ID is required' });
    }

    // Check if person exists
    const person = await Person.findById(personId);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Check if spouse exists
    const spouse = await Person.findById(spouseId);
    if (!spouse) {
      return res.status(404).json({ error: 'Spouse not found' });
    }

    // Check edit permission
    const hasEditPermission = await canEdit(req.user.id, personId);
    if (!hasEditPermission) {
      return res.status(403).json({ error: 'You do not have permission to edit this person' });
    }

    // Set the spouse relationship
    await MaritalRelationship.setSpouse(personId, spouseId);

    res.json({ success: true, message: 'Spouse relationship set successfully' });
  } catch (error) {
    console.error('Error setting spouse:', error);
    res.status(500).json({ error: 'Failed to set spouse relationship' });
  }
});

// Remove spouse relationship
router.delete('/:id/spouse', async (req, res) => {
  try {
    const personId = req.params.id;

    // Check if person exists
    const person = await Person.findById(personId);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Check edit permission
    const hasEditPermission = await canEdit(req.user.id, personId);
    if (!hasEditPermission) {
      return res.status(403).json({ error: 'You do not have permission to edit this person' });
    }

    // Remove the spouse relationship
    await MaritalRelationship.removeSpouse(personId);

    res.json({ success: true, message: 'Spouse relationship removed successfully' });
  } catch (error) {
    console.error('Error removing spouse:', error);
    res.status(500).json({ error: 'Failed to remove spouse relationship' });
  }
});

export default router;

