-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Households table
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_contact_person_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Persons table
CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    date_of_birth DATE,
    age INTEGER,
    wedding_anniversary_date DATE,
    years_married INTEGER,
    generation VARCHAR(10),
    photo_url VARCHAR(500),
    is_deceased BOOLEAN DEFAULT FALSE,
    primary_household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    -- Timestamps for change tracking
    last_modified_at TIMESTAMP,
    phone_last_modified_at TIMESTAMP,
    address_line1_last_modified_at TIMESTAMP,
    address_line2_last_modified_at TIMESTAMP,
    city_last_modified_at TIMESTAMP,
    state_last_modified_at TIMESTAMP,
    postal_code_last_modified_at TIMESTAMP,
    country_last_modified_at TIMESTAMP,
    date_of_birth_last_modified_at TIMESTAMP,
    wedding_anniversary_date_last_modified_at TIMESTAMP,
    photo_url_last_modified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationships table (parent-child)
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'biological',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, child_id)
);

-- Marital relationships table
CREATE TABLE IF NOT EXISTS marital_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_a_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person_b_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    marriage_date DATE,
    divorce_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_a_id, person_b_id),
    CHECK (person_a_id != person_b_id)
);

-- Magic link tokens table
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_persons_email ON persons(email);
CREATE INDEX IF NOT EXISTS idx_persons_household ON persons(primary_household_id);
CREATE INDEX IF NOT EXISTS idx_relationships_parent ON relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_relationships_child ON relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_marital_person_a ON marital_relationships(person_a_id);
CREATE INDEX IF NOT EXISTS idx_marital_person_b ON marital_relationships(person_b_id);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_email ON magic_link_tokens(email);

-- Foreign key for households primary_contact_person_id
ALTER TABLE households 
ADD CONSTRAINT fk_households_primary_contact 
FOREIGN KEY (primary_contact_person_id) 
REFERENCES persons(id) ON DELETE SET NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marital_relationships_updated_at BEFORE UPDATE ON marital_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



