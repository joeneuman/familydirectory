# CSV Import Guide

This guide explains how to prepare and import your family data from a Google Sheet or CSV file.

## CSV Column Requirements

Your CSV file must include these columns (some are optional):

### Required Columns
- `first_name` - Person's first name
- `last_name` - Person's last name

### Optional Columns
- `email` - Email address (required for login, but can be added later)
- `phone` - Phone number
- `address_line1` - Street address
- `address_line2` - Apartment, suite, etc.
- `city` - City
- `state` - State or province
- `postal_code` - ZIP or postal code
- `country` - Country (defaults to "USA" if not provided)
- `date_of_birth` - Format: YYYY-MM-DD (e.g., "1975-05-12")
- `wedding_anniversary_date` - Format: YYYY-MM-DD (e.g., "2000-08-15")
- `generation` - Generation identifier (e.g., "G1", "G2", "G3")
- `mother_name` - Full name: "First Last" (for parent-child relationship)
- `father_name` - Full name: "First Last" (for parent-child relationship)
- `spouse_name` - Full name: "First Last" (for marital relationship)
- `is_deceased` - "true" or "false" (defaults to false)
- `is_admin` - "true" or "false" (defaults to false) - Set to "true" to make this person an administrator
- `photo_url` - URL to a photo image

## Example CSV

```csv
first_name,last_name,email,phone,address_line1,city,state,postal_code,date_of_birth,wedding_anniversary_date,generation,mother_name,father_name,spouse_name,is_deceased,is_admin
Jane,Smith,jane@example.com,555-0100,123 Main St,Springfield,IL,62701,1950-01-15,1970-06-20,G1,,,John Smith,false,true
John,Smith,john@example.com,555-0101,123 Main St,Springfield,IL,62701,1948-03-10,1970-06-20,G1,,,Jane Smith,false,false
Alice,Smith,alice@example.com,555-0200,456 Oak Ave,Chicago,IL,60601,1975-05-12,2000-08-15,G2,Jane Smith,John Smith,Bob Doe,false,false
Bob,Doe,bob@example.com,555-0201,456 Oak Ave,Chicago,IL,60601,1973-07-22,2000-08-15,G2,,,Alice Smith,false,false
Charlie,Doe,charlie@example.com,555-0300,456 Oak Ave,Chicago,IL,60601,2005-11-30,,G3,Alice Smith,Bob Doe,,false,false
```

**Note:** Each person will be imported as the head of their own household. After import, you can use the "Manage Household" feature in the UI to assign people to the same household (e.g., assign John to Jane's household, or assign Alice, Bob, and Charlie to the same household).

## Preparing Your Data

### Step 1: Export from Google Sheets

1. Open your Google Sheet with family data
2. File → Download → Comma-separated values (.csv)
3. Save the file

### Step 2: Clean Your Data

Before importing, ensure:

- **Names match exactly** for relationships:
  - `mother_name` and `father_name` must exactly match `first_name last_name` of existing people
  - `spouse_name` must exactly match `first_name last_name` of existing people
  - Matching is case-insensitive but spelling must be exact

- **Dates are in YYYY-MM-DD format**:
  - ✅ Correct: "1975-05-12"
  - ❌ Wrong: "5/12/1975" or "May 12, 1975"

- **Households**:
  - People are imported without households
  - The existing system automatically treats people without households as heads of their own household
  - After import, you can manually assign people to households through the UI

- **Generations are set**:
  - G1 = Root generation (your mother)
  - G2 = Next generation (you, siblings)
  - G3 = Children
  - G4 = Grandchildren, etc.

### Step 3: Import Order Considerations

The import script processes in two passes:
1. Creates all households and persons
2. Creates relationships

So you can list people in any order - the script will match relationships by name.

## Running the Import

```bash
cd backend
node scripts/import-csv.js path/to/your/data.csv
```

### What Happens During Import

1. **Persons are created** - People are imported without households
2. **Ages are calculated** - From `date_of_birth`
3. **Years married are calculated** - From `wedding_anniversary_date`
4. **Parent-child relationships** - Created from `mother_name` and `father_name`
5. **Marital relationships** - Created from `spouse_name`

**Note:** The existing system automatically treats people without households as heads of their own household. After import, you can manually assign people to households through the UI by editing a person and using the "Manage Household" feature.

### Import Output

The script will log:
- Each household created
- Each person created
- Each relationship created
- Warnings for missing relationships (e.g., "Mother not found: Jane Doe")

### Common Issues

**"Mother not found" or "Father not found"**
- Check that `mother_name`/`father_name` exactly matches `first_name last_name` in the CSV
- Ensure the parent is listed in the CSV (can be in any order)

**"Spouse not found"**
- Check that `spouse_name` exactly matches `first_name last_name` in the CSV
- Ensure the spouse is listed in the CSV

**Household assignment**
- Each person is imported as the head of their own household
- After import, use the "Manage Household" feature in the UI to assign people to households
- This allows you to manually organize your family structure

**Missing emails**
- People without emails cannot log in
- You can add emails later through the edit interface

## After Import

1. **Verify data** - Check a few people in the web interface
2. **Add missing emails** - Edit people to add email addresses for login
3. **Test login** - Try logging in with one of the email addresses
4. **Verify permissions** - Test that ancestors can edit descendants

## Updating Data

The CSV import is for **initial data loading only**. After import:

- Use the web interface to make changes
- Changes are tracked with timestamps
- Recent changes (last 3 months) are highlighted

If you need to re-import:

1. **Clear the database** (be careful!):
   ```sql
   TRUNCATE TABLE persons, households, relationships, marital_relationships CASCADE;
   ```

2. Run the import again

## Tips

- **Start small**: Import a few test records first to verify the format
- **Check relationships**: After import, verify parent-child and spouse relationships are correct
- **Add photos later**: You can add `photo_url` values through the edit interface
- **Email addresses**: Make sure at least one person (yourself) has an email for initial login


