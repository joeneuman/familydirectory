-- Family Directory Database Schema
-- Use this file to create the database structure on Hostinger
-- Upload this via Hostinger's database management tool (phpMyAdmin or similar)

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

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
    is_admin BOOLEAN DEFAULT FALSE,
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
    person1_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    person2_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'married',
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person1_id, person2_id)
);

-- Magic link tokens table
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token UUID NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    preference_key VARCHAR(255) NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_persons_email ON persons(email);
CREATE INDEX IF NOT EXISTS idx_persons_household ON persons(primary_household_id);
CREATE INDEX IF NOT EXISTS idx_relationships_parent ON relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_relationships_child ON relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE households IS 'Family households';
COMMENT ON TABLE persons IS 'Family members';
COMMENT ON TABLE relationships IS 'Parent-child relationships';
COMMENT ON TABLE marital_relationships IS 'Marital relationships between persons';
COMMENT ON TABLE magic_link_tokens IS 'Magic link authentication tokens';
COMMENT ON TABLE user_preferences IS 'User-specific preferences and settings';

