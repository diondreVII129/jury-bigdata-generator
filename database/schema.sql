-- South Carolina Jury Big Data Generator - Database Schema
-- Randy v2.1: 36-field Juror interface (30 core + 6 computed)

DROP TABLE IF EXISTS synthetic_jurors;
DROP TABLE IF EXISTS sc_county_demographics;

-- County demographics table based on US Census ACS 2021
CREATE TABLE sc_county_demographics (
    county_id SERIAL PRIMARY KEY,
    county_name VARCHAR(50) UNIQUE NOT NULL,
    county_fips VARCHAR(3) NOT NULL,
    total_population INTEGER NOT NULL,
    median_age DECIMAL(4,1) NOT NULL,

    pct_white DECIMAL(4,1),
    pct_black DECIMAL(4,1),
    pct_hispanic DECIMAL(4,1),
    pct_asian DECIMAL(4,1),

    pct_less_than_hs DECIMAL(4,1),
    pct_hs_graduate DECIMAL(4,1),
    pct_some_college DECIMAL(4,1),
    pct_bachelors_degree DECIMAL(4,1),
    pct_graduate_degree DECIMAL(4,1),

    median_household_income INTEGER,
    per_capita_income INTEGER,
    pct_below_poverty DECIMAL(4,1),
    unemployment_rate DECIMAL(4,1),

    pct_blue_collar DECIMAL(4,1),
    pct_white_collar DECIMAL(4,1),
    pct_service_industry DECIMAL(4,1),

    top_industry_1 VARCHAR(100),
    top_industry_2 VARCHAR(100),
    top_industry_3 VARCHAR(100),
    top_industry_1_pct DECIMAL(4,1),
    top_industry_2_pct DECIMAL(4,1),
    top_industry_3_pct DECIMAL(4,1),

    median_home_value INTEGER,
    pct_homeowners DECIMAL(4,1),
    pct_renters DECIMAL(4,1),

    urbanization VARCHAR(200),
    pct_urban DECIMAL(4,1),
    pct_suburban DECIMAL(4,1),
    pct_rural DECIMAL(4,1),

    political_lean VARCHAR(50),
    pct_evangelical DECIMAL(4,1),

    data_source VARCHAR(100) DEFAULT 'US Census Bureau ACS 2021',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Synthetic jurors table — Randy v2.1 36-field schema (30 core + 6 computed)
CREATE TABLE synthetic_jurors (
    juror_id VARCHAR(50) PRIMARY KEY,
    county_name VARCHAR(50) REFERENCES sc_county_demographics(county_name),
    juror_number INTEGER NOT NULL,

    -- DEMOGRAPHICS (9 core fields)
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    age INTEGER CHECK (age >= 18 AND age <= 75),
    age_bracket VARCHAR(10) NOT NULL,
    generation VARCHAR(20) CHECK (generation IN ('Gen Z', 'Millennial', 'Gen X', 'Boomer', 'Silent')),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')),
    race VARCHAR(20) CHECK (race IN ('White', 'Black', 'Hispanic', 'Asian', 'Multiracial', 'Other')),
    geographic_segment VARCHAR(100) NOT NULL,

    -- RESIDENTIAL (2 core fields)
    years_in_county VARCHAR(20) CHECK (years_in_county IN ('Less than 2 years', '2-9 years', '10-19 years', '20+ years')),
    homeownership VARCHAR(10) CHECK (homeownership IN ('Owner', 'Renter')),

    -- HOUSING (1 core field)
    housing_type VARCHAR(20) CHECK (housing_type IN ('Single Family', 'Multi-Family', 'Mobile Home')),

    -- SOCIOECONOMIC (6 core fields)
    education VARCHAR(50) CHECK (education IN (
        'Less than HS', 'HS Diploma/GED', 'Some College/Associates',
        'Bachelor''s', 'Graduate/Professional'
    )),
    employment_status VARCHAR(30) CHECK (employment_status IN (
        'Full-Time', 'Part-Time', 'Unemployed', 'Retired', 'Not in Labor Force'
    )),
    employer_type VARCHAR(20) CHECK (employer_type IN (
        'Private Sector', 'Government', 'Self-Employed', 'Nonprofit', 'Not Employed'
    )),
    occupation VARCHAR(100) NOT NULL,
    household_income INTEGER CHECK (household_income >= 12000 AND household_income <= 250000),
    healthcare_connection VARCHAR(100),

    -- FAMILY (2 core fields)
    marital_status VARCHAR(30) CHECK (marital_status IN (
        'Single/Never Married', 'Married', 'Divorced', 'Widowed', 'Separated'
    )),
    number_of_children INTEGER CHECK (number_of_children >= 0 AND number_of_children <= 5),

    -- VETERAN/DISABILITY (2 core fields)
    veteran BOOLEAN DEFAULT FALSE,
    disability_status VARCHAR(5) CHECK (disability_status IN ('Yes', 'No')),

    -- POLITICAL (2 core fields)
    political_registration VARCHAR(20) CHECK (political_registration IN (
        'Democrat', 'Republican', 'Independent', 'Unaffiliated', 'Not Registered'
    )),
    vote_2024 VARCHAR(20) CHECK (vote_2024 IN ('Trump2024', 'Harris2024', 'Did Not Vote', 'Third Party')),

    -- RELIGIOUS (2 core fields)
    religion VARCHAR(50) NOT NULL,
    church_attendance VARCHAR(30) CHECK (church_attendance IN (
        'Weekly or more', '2-3x per month', 'Monthly', 'Occasionally', 'Rarely/Never'
    )),

    -- MEDIA/JURY HISTORY (3 core fields)
    primary_news_source VARCHAR(50) NOT NULL,
    prior_jury_service VARCHAR(5) CHECK (prior_jury_service IN ('Yes', 'No')),
    litigation_history VARCHAR(30),

    -- METADATA (1 core field - auto-derived)
    flag_color VARCHAR(10) CHECK (flag_color IN ('Green', 'Yellow', 'Red')),

    -- 6 COMPUTED FIELDS ([PROXY-INFERRED])
    tort_reform_attitude DECIMAL(3,1) CHECK (tort_reform_attitude BETWEEN 0.0 AND 10.0),
    authority_deference DECIMAL(3,1) CHECK (authority_deference BETWEEN 0.0 AND 10.0),
    healthcare_trust DECIMAL(3,1) CHECK (healthcare_trust BETWEEN 0.0 AND 10.0),
    damages_receptivity DECIMAL(3,1) CHECK (damages_receptivity BETWEEN 0.0 AND 10.0),
    plaintiff_composite_score DECIMAL(3,1) CHECK (plaintiff_composite_score BETWEEN 0.0 AND 10.0),
    juror_archetype VARCHAR(20) CHECK (juror_archetype IN (
        'Champion', 'Strong Plaintiff', 'Lean Plaintiff', 'True Swing',
        'Lean Defense', 'Strong Defense', 'Skeptic'
    )),

    -- Metadata
    generated_at TIMESTAMP DEFAULT NOW(),
    generation_batch_id UUID
);

-- Performance indexes
CREATE INDEX idx_jurors_county ON synthetic_jurors(county_name);
CREATE INDEX idx_jurors_race ON synthetic_jurors(race);
CREATE INDEX idx_jurors_age ON synthetic_jurors(age);
CREATE INDEX idx_jurors_education ON synthetic_jurors(education);
CREATE INDEX idx_jurors_batch ON synthetic_jurors(generation_batch_id);
CREATE INDEX idx_jurors_archetype ON synthetic_jurors(juror_archetype);
CREATE INDEX idx_jurors_pcs ON synthetic_jurors(plaintiff_composite_score);
CREATE INDEX idx_jurors_vote ON synthetic_jurors(vote_2024);
CREATE INDEX idx_jurors_registration ON synthetic_jurors(political_registration);
CREATE INDEX idx_jurors_flag_color ON synthetic_jurors(flag_color);
CREATE INDEX idx_jurors_religion ON synthetic_jurors(religion);
CREATE INDEX idx_jurors_church ON synthetic_jurors(church_attendance);
CREATE INDEX idx_jurors_news ON synthetic_jurors(primary_news_source);
CREATE INDEX idx_demographics_county ON sc_county_demographics(county_name);
