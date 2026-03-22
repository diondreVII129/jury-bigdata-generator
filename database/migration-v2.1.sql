-- Migration: Upgrade synthetic_jurors from 28-field to Randy v2.1 36-field schema
-- Run this on existing databases to add new columns without dropping data.

-- New core fields
ALTER TABLE synthetic_jurors ADD COLUMN IF NOT EXISTS generation VARCHAR(20);
ALTER TABLE synthetic_jurors ADD COLUMN IF NOT EXISTS years_in_county VARCHAR(20);
ALTER TABLE synthetic_jurors ADD COLUMN IF NOT EXISTS housing_type VARCHAR(20);
ALTER TABLE synthetic_jurors ADD COLUMN IF NOT EXISTS employment_status VARCHAR(30);
ALTER TABLE synthetic_jurors ADD COLUMN IF NOT EXISTS employer_type VARCHAR(20);
ALTER TABLE synthetic_jurors ADD COLUMN IF NOT EXISTS disability_status VARCHAR(5);
ALTER TABLE synthetic_jurors ADD COLUMN IF NOT EXISTS prior_jury_service VARCHAR(5);
ALTER TABLE synthetic_jurors ADD COLUMN IF NOT EXISTS flag_color VARCHAR(10);

-- Drop old CHECK constraints that need updating
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_race_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_homeownership_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_marital_status_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_political_registration_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_vote_2024_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_church_attendance_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_juror_archetype_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_tort_reform_attitude_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_authority_deference_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_healthcare_trust_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_damages_receptivity_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_plaintiff_composite_score_check;
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_education_check;

-- Change veteran from VARCHAR to BOOLEAN
ALTER TABLE synthetic_jurors DROP CONSTRAINT IF EXISTS synthetic_jurors_veteran_check;
ALTER TABLE synthetic_jurors ALTER COLUMN veteran TYPE BOOLEAN USING (veteran = 'Yes');

-- Add updated CHECK constraints
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_race_check
    CHECK (race IN ('White', 'Black', 'Hispanic', 'Asian', 'Multiracial', 'Other'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_homeownership_check
    CHECK (homeownership IN ('Owner', 'Renter'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_marital_status_check
    CHECK (marital_status IN ('Single/Never Married', 'Married', 'Divorced', 'Widowed', 'Separated'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_political_registration_check
    CHECK (political_registration IN ('Democrat', 'Republican', 'Independent', 'Unaffiliated', 'Not Registered'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_vote_2024_check
    CHECK (vote_2024 IN ('Trump2024', 'Harris2024', 'Did Not Vote', 'Third Party'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_church_attendance_check
    CHECK (church_attendance IN ('Weekly or more', '2-3x per month', 'Monthly', 'Occasionally', 'Rarely/Never'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_juror_archetype_check
    CHECK (juror_archetype IN ('Champion', 'Strong Plaintiff', 'Lean Plaintiff', 'True Swing', 'Lean Defense', 'Strong Defense', 'Skeptic'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_education_check
    CHECK (education IN ('Less than HS', 'HS Diploma/GED', 'Some College/Associates', 'Bachelor''s', 'Graduate/Professional'));

-- Psychographic scores now allow 0.0 (was 1.0 minimum)
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_tort_reform_attitude_check
    CHECK (tort_reform_attitude BETWEEN 0.0 AND 10.0);
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_authority_deference_check
    CHECK (authority_deference BETWEEN 0.0 AND 10.0);
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_healthcare_trust_check
    CHECK (healthcare_trust BETWEEN 0.0 AND 10.0);
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_damages_receptivity_check
    CHECK (damages_receptivity BETWEEN 0.0 AND 10.0);
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_plaintiff_composite_score_check
    CHECK (plaintiff_composite_score BETWEEN 0.0 AND 10.0);

-- New CHECK constraints for new fields
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_generation_check
    CHECK (generation IN ('Gen Z', 'Millennial', 'Gen X', 'Boomer', 'Silent'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_years_in_county_check
    CHECK (years_in_county IN ('Less than 2 years', '2-9 years', '10-19 years', '20+ years'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_housing_type_check
    CHECK (housing_type IN ('Single Family', 'Multi-Family', 'Mobile Home'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_employment_status_check
    CHECK (employment_status IN ('Full-Time', 'Part-Time', 'Unemployed', 'Retired', 'Not in Labor Force'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_employer_type_check
    CHECK (employer_type IN ('Private Sector', 'Government', 'Self-Employed', 'Nonprofit', 'Not Employed'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_disability_status_check
    CHECK (disability_status IN ('Yes', 'No'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_prior_jury_service_check
    CHECK (prior_jury_service IN ('Yes', 'No'));
ALTER TABLE synthetic_jurors ADD CONSTRAINT synthetic_jurors_flag_color_check
    CHECK (flag_color IN ('Green', 'Yellow', 'Red'));

-- New indexes for new filterable fields
CREATE INDEX IF NOT EXISTS idx_jurors_flag_color ON synthetic_jurors(flag_color);
CREATE INDEX IF NOT EXISTS idx_jurors_religion ON synthetic_jurors(religion);
CREATE INDEX IF NOT EXISTS idx_jurors_church ON synthetic_jurors(church_attendance);
CREATE INDEX IF NOT EXISTS idx_jurors_news ON synthetic_jurors(primary_news_source);
