import express from 'express';
import { Person } from '../models/Person.js';
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

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      persons = persons.filter(p => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        return fullName.includes(searchLower) || 
               (p.email && p.email.toLowerCase().includes(searchLower));
      });
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

    res.json({
      ...person,
      spouse,
      parents,
      children,
      canEdit: hasEditPermission,
    });
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

    // Calculate age if date_of_birth is provided
    if (req.body.date_of_birth) {
      const dob = parseISO(req.body.date_of_birth);
      req.body.age = differenceInYears(new Date(), dob);
    }

    // Calculate years_married if wedding_anniversary_date is provided
    if (req.body.wedding_anniversary_date) {
      const annDate = parseISO(req.body.wedding_anniversary_date);
      req.body.years_married = differenceInYears(new Date(), annDate);
    }

    // Update person
    const updatedPerson = await Person.update(personId, req.body);
    
    res.json(updatedPerson);
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: 'Internal server error' });
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

export default router;

