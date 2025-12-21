# How to Change Email Address in Database

## Method 1: Using SQL (Quick)

After importing the sample data, update the email:

```powershell
# Connect to database
psql -U postgres -d family_directory

# Update Jane Smith's email to yours
UPDATE persons 
SET email = 'your.email@example.com' 
WHERE email = 'jane.smith@example.com';

# Verify it worked
SELECT first_name, last_name, email FROM persons WHERE email = 'your.email@example.com';

# Exit
\q
```

## Method 2: Update Multiple Emails

```sql
-- Update all emails to your domain (for testing)
UPDATE persons 
SET email = REPLACE(email, '@example.com', '@yourdomain.com')
WHERE email LIKE '%@example.com%';
```

## Method 3: Add Yourself as New Person

```sql
-- First, get a household ID
SELECT id, name FROM households LIMIT 1;

-- Then create yourself (replace HOUSEHOLD_ID with actual ID)
INSERT INTO persons (
  first_name, last_name, email, generation, primary_household_id
) VALUES (
  'Your', 'Name', 'your.email@example.com', 'G1', 'HOUSEHOLD_ID'
);
```

## Method 4: Edit After Logging In

1. Import sample data
2. Log in using console mode (copy link from terminal)
3. Once logged in, edit your own profile
4. Change the email to your real email
5. Now you can use your real email for future logins





