-- South Carolina Jury Big Data Generator - Database Schema
-- Matches JuryEdge Engine 28-field Juror interface

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

-- Synthetic jurors table — matches JuryEdge Engine 28-field Juror interface
CREATE TABLE synthetic_jurors (
    -- Field 1: ID (sequential per pool, but juror_id is our PK)
    juror_id VARCHAR(50) PRIMARY KEY,
    county_name VARCHAR(50) REFERENCES sc_county_demographics(county_name),
    juror_number INTEGER NOT NULL,

    -- Fields 2-3: Name
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,

    -- Fields 4-6: Demographics
    age INTEGER CHECK (age >= 18 AND age <= 75),
    age_bracket VARCHAR(10) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')),

    -- Field 7: Race
    race VARCHAR(20) CHECK (race IN ('White', 'Black', 'Hispanic', 'Other')),

    -- Field 8: Geography
    geographic_segment VARCHAR(50) NOT NULL,

    -- Field 9: Education
    education VARCHAR(50) CHECK (education IN (
        'Less than HS', 'HS Diploma/GED', 'Some College/Associates',
        'Bachelor''s Degree', 'Graduate/Professional'
    )),

    -- Field 10: Occupation
    occupation VARCHAR(100) NOT NULL,

    -- Field 11: Healthcare connection
    healthcare_connection VARCHAR(100),

    -- Fields 12-15: Household
    household_income INTEGER CHECK (household_income >= 12000 AND household_income <= 250000),
    homeownership VARCHAR(10) CHECK (homeownership IN ('Own', 'Rent')),
    marital_status VARCHAR(20) CHECK (marital_status IN (
        'Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Cohabiting'
    )),
    number_of_children INTEGER CHECK (number_of_children >= 0 AND number_of_children <= 5),

    -- Fields 16-17: Political
    political_registration VARCHAR(20) CHECK (political_registration IN (
        'Republican', 'Democrat', 'Independent', 'Unregistered'
    )),
    vote_2024 VARCHAR(20) CHECK (vote_2024 IN ('Trump', 'Harris', 'Did Not Vote', 'Other')),

    -- Fields 18-19: Religion
    religion VARCHAR(50) NOT NULL,
    church_attendance VARCHAR(30) CHECK (church_attendance IN (
        'Weekly or more', 'Monthly', 'Few times a year', 'Rarely/Never'
    )),

    -- Field 20: Military
    veteran VARCHAR(5) CHECK (veteran IN ('Yes', 'No')),

    -- Field 21: Media
    primary_news_source VARCHAR(50) NOT NULL,

    -- Field 22: Legal history
    litigation_history VARCHAR(50),

    -- Fields 23-26: Psychographic scores (1.0-10.0)
    tort_reform_attitude DECIMAL(3,1) CHECK (tort_reform_attitude BETWEEN 1.0 AND 10.0),
    authority_deference DECIMAL(3,1) CHECK (authority_deference BETWEEN 1.0 AND 10.0),
    healthcare_trust DECIMAL(3,1) CHECK (healthcare_trust BETWEEN 1.0 AND 10.0),
    damages_receptivity DECIMAL(3,1) CHECK (damages_receptivity BETWEEN 1.0 AND 10.0),

    -- Field 27: PCS (calculated)
    plaintiff_composite_score DECIMAL(3,1) CHECK (plaintiff_composite_score BETWEEN 0.1 AND 10.0),

    -- Field 28: Archetype (derived from PCS)
    juror_archetype VARCHAR(20) CHECK (juror_archetype IN (
        'Strong Plaintiff', 'Lean Plaintiff', 'True Swing', 'Lean Defense', 'Strong Defense'
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
CREATE INDEX idx_demographics_county ON sc_county_demographics(county_name);
