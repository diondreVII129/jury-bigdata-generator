-- ============================================================================
-- South Carolina County Demographics Seed Data
-- Source: US Census Bureau, American Community Survey (ACS) 5-Year Estimates, 2021
-- Table: sc_county_demographics
-- Counties: All 46 South Carolina counties
-- Generated for jury pool demographic analysis
-- ============================================================================

-- Abbeville County (FIPS 001)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Abbeville', '001', 24527, 42.1,
    68.5, 26.8, 2.4, 0.5,
    18.2, 35.6, 23.1, 14.8, 8.3,
    36842, 21654, 19.8, 6.2,
    38.0, 34.0, 28.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    22.5, 15.3, 12.8,
    98400, 68.2, 31.8,
    'rural', 8.0, 22.0, 70.0,
    'R+18', 42.0
);

-- Aiken County (FIPS 003)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Aiken', '003', 170872, 41.8,
    66.2, 25.4, 4.8, 1.2,
    13.5, 30.2, 25.8, 18.7, 11.8,
    52143, 28976, 14.2, 5.1,
    32.0, 40.0, 28.0,
    'Manufacturing', 'Healthcare', 'Construction',
    18.4, 14.7, 10.2,
    152300, 70.5, 29.5,
    'suburban', 22.0, 42.0, 36.0,
    'R+14', 38.5
);

-- Allendale County (FIPS 005)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Allendale', '005', 8789, 40.6,
    22.1, 73.8, 2.6, 0.3,
    25.4, 36.1, 22.5, 10.2, 5.8,
    22917, 14283, 35.6, 10.8,
    35.0, 28.0, 37.0,
    'Healthcare', 'Agriculture', 'Public Administration',
    18.2, 15.6, 13.4,
    56200, 58.4, 41.6,
    'rural', 5.0, 10.0, 85.0,
    'D+28', 35.0
);

-- Anderson County (FIPS 007)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Anderson', '007', 204446, 40.5,
    78.2, 15.1, 3.8, 1.1,
    14.8, 32.4, 24.6, 17.3, 10.9,
    48237, 26132, 15.4, 4.8,
    36.0, 36.0, 28.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    21.3, 14.5, 12.1,
    142800, 69.8, 30.2,
    'suburban', 25.0, 38.0, 37.0,
    'R+22', 44.5
);

-- Bamberg County (FIPS 009)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Bamberg', '009', 13810, 43.2,
    32.4, 62.8, 3.1, 0.4,
    22.1, 34.8, 23.6, 12.4, 7.1,
    29543, 17842, 28.4, 8.9,
    34.0, 30.0, 36.0,
    'Healthcare', 'Manufacturing', 'Agriculture',
    17.5, 14.8, 12.3,
    68500, 62.1, 37.9,
    'rural', 8.0, 15.0, 77.0,
    'D+14', 36.0
);

-- Barnwell County (FIPS 011)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Barnwell', '011', 20547, 41.7,
    44.6, 49.8, 3.8, 0.4,
    21.3, 35.2, 23.8, 12.8, 6.9,
    32186, 18974, 25.1, 7.6,
    36.0, 29.0, 35.0,
    'Manufacturing', 'Healthcare', 'Public Administration',
    19.2, 16.1, 11.8,
    74800, 64.3, 35.7,
    'rural', 10.0, 18.0, 72.0,
    'R+4', 38.0
);

-- Beaufort County (FIPS 013)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Beaufort', '013', 192122, 44.8,
    70.2, 17.3, 8.2, 1.8,
    8.4, 20.6, 22.8, 28.4, 19.8,
    72018, 42365, 9.8, 3.9,
    22.0, 46.0, 32.0,
    'Accommodation and Food Services', 'Healthcare', 'Retail Trade',
    16.8, 14.2, 13.5,
    318700, 72.4, 27.6,
    'suburban', 28.0, 48.0, 24.0,
    'R+6', 28.5
);

-- Berkeley County (FIPS 015)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Berkeley', '015', 229861, 34.6,
    62.8, 24.2, 7.4, 2.3,
    10.2, 27.4, 27.6, 22.1, 12.7,
    62874, 30542, 10.8, 4.2,
    30.0, 40.0, 30.0,
    'Manufacturing', 'Construction', 'Healthcare',
    16.2, 13.8, 13.1,
    228400, 73.6, 26.4,
    'suburban', 20.0, 55.0, 25.0,
    'R+10', 34.0
);

-- Calhoun County (FIPS 017)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Calhoun', '017', 14553, 46.8,
    47.2, 47.1, 3.5, 0.6,
    19.6, 34.2, 24.1, 13.8, 8.3,
    40218, 23156, 18.6, 6.4,
    34.0, 32.0, 34.0,
    'Agriculture', 'Manufacturing', 'Public Administration',
    16.4, 14.2, 13.8,
    102500, 76.8, 23.2,
    'rural', 3.0, 12.0, 85.0,
    'R+2', 36.0
);

-- Charleston County (FIPS 019)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Charleston', '019', 421578, 36.4,
    64.8, 25.4, 5.6, 1.9,
    7.8, 20.4, 22.6, 29.8, 19.4,
    68347, 39284, 12.4, 3.8,
    22.0, 48.0, 30.0,
    'Healthcare', 'Accommodation and Food Services', 'Professional Services',
    15.8, 13.6, 12.4,
    298500, 62.4, 37.6,
    'urban', 52.0, 34.0, 14.0,
    'D+2', 26.0
);

-- Cherokee County (FIPS 021)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Cherokee', '021', 57300, 39.4,
    72.4, 20.6, 4.8, 0.6,
    18.6, 34.8, 24.2, 14.2, 8.2,
    40126, 22487, 18.2, 5.8,
    40.0, 32.0, 28.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    24.6, 14.8, 11.9,
    112400, 65.2, 34.8,
    'suburban', 18.0, 35.0, 47.0,
    'R+20', 44.0
);

-- Chester County (FIPS 023)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Chester', '023', 32244, 41.2,
    52.6, 42.4, 3.2, 0.4,
    20.4, 35.6, 23.4, 13.1, 7.5,
    35218, 20146, 22.4, 7.2,
    38.0, 30.0, 32.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    22.8, 15.4, 11.6,
    89600, 64.8, 35.2,
    'rural', 12.0, 25.0, 63.0,
    'R+8', 40.0
);

-- Chesterfield County (FIPS 025)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Chesterfield', '025', 45650, 42.6,
    59.8, 34.2, 3.6, 0.5,
    20.8, 35.4, 22.8, 13.6, 7.4,
    36742, 20856, 21.6, 6.8,
    37.0, 30.0, 33.0,
    'Manufacturing', 'Healthcare', 'Agriculture',
    21.4, 14.6, 10.8,
    92100, 66.4, 33.6,
    'rural', 8.0, 22.0, 70.0,
    'R+14', 42.0
);

-- Clarendon County (FIPS 027)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Clarendon', '027', 33745, 44.2,
    40.8, 53.6, 3.8, 0.4,
    21.6, 34.6, 23.2, 13.2, 7.4,
    33486, 19652, 24.8, 7.8,
    34.0, 30.0, 36.0,
    'Healthcare', 'Agriculture', 'Public Administration',
    16.8, 14.2, 12.6,
    86400, 68.2, 31.8,
    'rural', 6.0, 18.0, 76.0,
    'D+6', 38.0
);

-- Colleton County (FIPS 029)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Colleton', '029', 37680, 43.4,
    50.2, 43.8, 3.8, 0.5,
    20.2, 34.8, 23.4, 13.6, 8.0,
    36218, 20984, 22.8, 6.6,
    34.0, 30.0, 36.0,
    'Healthcare', 'Manufacturing', 'Agriculture',
    16.4, 14.8, 12.2,
    96800, 66.8, 33.2,
    'rural', 10.0, 18.0, 72.0,
    'R+6', 38.5
);

-- Darlington County (FIPS 031)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Darlington', '031', 66618, 40.8,
    52.8, 41.6, 3.4, 0.6,
    18.4, 33.8, 24.2, 15.2, 8.4,
    39874, 22186, 20.6, 6.4,
    36.0, 32.0, 32.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    22.4, 15.2, 12.4,
    104200, 66.4, 33.6,
    'rural', 14.0, 26.0, 60.0,
    'R+10', 40.0
);

-- Dillon County (FIPS 033)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Dillon', '033', 29976, 38.6,
    42.8, 47.4, 6.8, 0.4,
    24.6, 34.2, 22.4, 12.2, 6.6,
    29842, 16948, 29.4, 9.2,
    36.0, 26.0, 38.0,
    'Manufacturing', 'Agriculture', 'Healthcare',
    20.8, 15.4, 14.6,
    72400, 60.8, 39.2,
    'rural', 10.0, 15.0, 75.0,
    'D+4', 40.0
);

-- Dorchester County (FIPS 035)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Dorchester', '035', 162809, 35.2,
    62.4, 26.8, 6.2, 2.1,
    9.8, 26.2, 27.4, 23.2, 13.4,
    64528, 31246, 9.6, 4.0,
    28.0, 42.0, 30.0,
    'Healthcare', 'Manufacturing', 'Construction',
    14.8, 13.6, 12.4,
    224800, 74.2, 25.8,
    'suburban', 22.0, 56.0, 22.0,
    'R+8', 32.0
);

-- Edgefield County (FIPS 037)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Edgefield', '037', 27124, 42.4,
    56.2, 37.8, 3.8, 0.6,
    17.4, 33.6, 24.2, 15.6, 9.2,
    44862, 24518, 16.8, 5.4,
    36.0, 34.0, 30.0,
    'Manufacturing', 'Public Administration', 'Agriculture',
    18.6, 14.2, 12.8,
    124600, 74.6, 25.4,
    'rural', 6.0, 22.0, 72.0,
    'R+12', 40.0
);

-- Fairfield County (FIPS 039)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Fairfield', '039', 22406, 44.6,
    36.4, 58.2, 3.4, 0.4,
    21.8, 34.4, 23.2, 13.2, 7.4,
    33942, 19846, 23.4, 7.8,
    35.0, 30.0, 35.0,
    'Manufacturing', 'Healthcare', 'Public Administration',
    19.4, 16.2, 13.6,
    86200, 68.4, 31.6,
    'rural', 5.0, 20.0, 75.0,
    'D+8', 36.0
);

-- Florence County (FIPS 041)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Florence', '041', 138696, 39.6,
    52.4, 41.8, 3.4, 1.2,
    14.6, 30.8, 24.6, 18.4, 11.6,
    45218, 25684, 18.2, 5.6,
    30.0, 38.0, 32.0,
    'Healthcare', 'Manufacturing', 'Retail Trade',
    18.6, 16.4, 13.2,
    138400, 64.8, 35.2,
    'suburban', 28.0, 35.0, 37.0,
    'R+6', 38.0
);

-- Georgetown County (FIPS 043)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Georgetown', '043', 63218, 47.2,
    61.4, 32.8, 3.4, 0.8,
    14.2, 30.4, 23.8, 19.2, 12.4,
    46834, 28462, 17.4, 5.2,
    28.0, 38.0, 34.0,
    'Accommodation and Food Services', 'Healthcare', 'Manufacturing',
    16.2, 15.4, 13.8,
    184600, 72.6, 27.4,
    'rural', 12.0, 30.0, 58.0,
    'R+10', 34.0
);

-- Greenville County (FIPS 045)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Greenville', '045', 525534, 37.2,
    68.4, 18.6, 8.4, 2.4,
    10.2, 24.6, 23.8, 26.2, 15.2,
    58146, 33482, 12.8, 3.6,
    28.0, 44.0, 28.0,
    'Manufacturing', 'Healthcare', 'Professional Services',
    17.8, 14.2, 11.6,
    204600, 66.4, 33.6,
    'urban', 42.0, 40.0, 18.0,
    'R+12', 40.0
);

-- Greenwood County (FIPS 047)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Greenwood', '047', 70264, 39.8,
    58.2, 33.4, 5.6, 1.2,
    16.4, 32.2, 24.4, 16.8, 10.2,
    41236, 23848, 19.2, 5.8,
    34.0, 36.0, 30.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    22.4, 16.8, 12.6,
    118600, 62.4, 37.6,
    'suburban', 22.0, 35.0, 43.0,
    'R+12', 42.0
);

-- Hampton County (FIPS 049)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Hampton', '049', 18826, 40.4,
    34.6, 56.8, 6.4, 0.4,
    23.4, 35.2, 22.6, 12.4, 6.4,
    31246, 17842, 27.6, 8.4,
    36.0, 26.0, 38.0,
    'Agriculture', 'Healthcare', 'Manufacturing',
    16.8, 15.4, 14.2,
    72800, 64.2, 35.8,
    'rural', 5.0, 12.0, 83.0,
    'D+10', 36.0
);

-- Horry County (FIPS 051)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Horry', '051', 358438, 42.8,
    76.4, 13.8, 6.2, 1.4,
    12.4, 28.6, 24.8, 21.4, 12.8,
    48562, 27846, 15.6, 5.2,
    24.0, 36.0, 40.0,
    'Accommodation and Food Services', 'Retail Trade', 'Healthcare',
    22.4, 16.8, 13.2,
    198400, 68.2, 31.8,
    'suburban', 30.0, 42.0, 28.0,
    'R+16', 36.0
);

-- Jasper County (FIPS 053)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Jasper', '053', 30073, 36.8,
    33.2, 40.6, 22.4, 1.2,
    24.8, 32.4, 22.2, 13.4, 7.2,
    38642, 20486, 22.4, 6.8,
    32.0, 28.0, 40.0,
    'Accommodation and Food Services', 'Construction', 'Healthcare',
    18.6, 16.4, 14.2,
    142800, 62.6, 37.4,
    'rural', 10.0, 28.0, 62.0,
    'D+4', 30.0
);

-- Kershaw County (FIPS 055)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Kershaw', '055', 66418, 42.4,
    64.8, 29.4, 3.4, 0.8,
    14.6, 32.4, 25.2, 17.4, 10.4,
    49862, 27248, 14.8, 5.0,
    34.0, 36.0, 30.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    18.6, 15.4, 12.8,
    148200, 72.4, 27.6,
    'rural', 14.0, 30.0, 56.0,
    'R+16', 38.0
);

-- Lancaster County (FIPS 057)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Lancaster', '057', 98012, 39.8,
    68.4, 23.6, 5.2, 1.0,
    14.2, 31.4, 25.6, 18.4, 10.4,
    52486, 27642, 13.8, 4.6,
    32.0, 38.0, 30.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    18.4, 14.6, 13.2,
    168400, 72.8, 27.2,
    'suburban', 16.0, 48.0, 36.0,
    'R+16', 40.0
);

-- Laurens County (FIPS 059)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Laurens', '059', 67493, 40.6,
    66.8, 26.4, 4.6, 0.6,
    18.2, 34.6, 23.8, 14.8, 8.6,
    40842, 22684, 18.4, 5.8,
    40.0, 32.0, 28.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    26.4, 14.6, 11.8,
    114600, 66.8, 33.2,
    'rural', 14.0, 28.0, 58.0,
    'R+20', 44.0
);

-- Lee County (FIPS 061)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Lee', '061', 16828, 42.8,
    30.4, 64.2, 3.6, 0.4,
    24.2, 35.8, 22.4, 11.4, 6.2,
    28462, 16248, 30.2, 9.4,
    34.0, 26.0, 40.0,
    'Agriculture', 'Healthcare', 'Public Administration',
    18.6, 16.4, 14.2,
    64800, 62.4, 37.6,
    'rural', 4.0, 10.0, 86.0,
    'D+16', 36.0
);

-- Lexington County (FIPS 063)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Lexington', '063', 304196, 38.4,
    76.2, 13.4, 6.2, 2.0,
    9.8, 26.4, 25.8, 24.2, 13.8,
    61842, 32186, 10.4, 3.8,
    26.0, 44.0, 30.0,
    'Healthcare', 'Retail Trade', 'Manufacturing',
    14.8, 13.6, 12.4,
    192400, 74.6, 25.4,
    'suburban', 28.0, 52.0, 20.0,
    'R+18', 38.0
);

-- Marion County (FIPS 067)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Marion', '067', 30346, 43.4,
    35.4, 58.6, 3.8, 0.4,
    24.8, 35.2, 22.4, 11.4, 6.2,
    28642, 16484, 30.8, 10.2,
    34.0, 26.0, 40.0,
    'Healthcare', 'Manufacturing', 'Agriculture',
    16.8, 15.2, 13.4,
    68400, 62.8, 37.2,
    'rural', 8.0, 14.0, 78.0,
    'D+12', 38.0
);

-- Marlboro County (FIPS 069)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Marlboro', '069', 26118, 40.2,
    38.4, 52.8, 5.6, 0.6,
    25.6, 34.8, 22.2, 11.2, 6.2,
    27846, 16142, 31.4, 10.6,
    36.0, 26.0, 38.0,
    'Manufacturing', 'Healthcare', 'Agriculture',
    20.4, 16.2, 12.8,
    62400, 60.4, 39.6,
    'rural', 8.0, 14.0, 78.0,
    'D+6', 38.0
);

-- McCormick County (FIPS 065)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'McCormick', '065', 9462, 52.4,
    42.6, 52.8, 2.8, 0.4,
    18.4, 32.6, 23.4, 15.4, 10.2,
    34862, 22486, 21.8, 7.2,
    30.0, 32.0, 38.0,
    'Public Administration', 'Healthcare', 'Agriculture',
    16.8, 15.6, 14.2,
    118400, 78.4, 21.6,
    'rural', 2.0, 8.0, 90.0,
    'D+4', 34.0
);

-- Newberry County (FIPS 071)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Newberry', '071', 38440, 41.4,
    55.6, 34.2, 7.4, 0.8,
    17.8, 33.4, 24.2, 15.8, 8.8,
    40684, 22846, 17.6, 5.4,
    38.0, 32.0, 30.0,
    'Manufacturing', 'Healthcare', 'Agriculture',
    24.8, 14.6, 10.4,
    108400, 68.6, 31.4,
    'rural', 12.0, 22.0, 66.0,
    'R+14', 42.0
);

-- Oconee County (FIPS 073)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Oconee', '073', 79546, 45.8,
    86.4, 6.8, 4.2, 0.8,
    14.2, 32.4, 24.6, 17.8, 11.0,
    46248, 26842, 14.6, 4.4,
    36.0, 34.0, 30.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    22.6, 14.8, 12.4,
    162400, 74.8, 25.2,
    'rural', 10.0, 28.0, 62.0,
    'R+28', 46.0
);

-- Orangeburg County (FIPS 075)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Orangeburg', '075', 86175, 41.6,
    28.4, 64.8, 4.2, 0.8,
    19.8, 33.4, 24.2, 14.6, 8.0,
    33486, 19248, 25.4, 8.2,
    32.0, 32.0, 36.0,
    'Healthcare', 'Manufacturing', 'Public Administration',
    17.4, 16.2, 13.8,
    92400, 62.4, 37.6,
    'rural', 16.0, 22.0, 62.0,
    'D+18', 34.0
);

-- Pickens County (FIPS 077)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Pickens', '077', 126884, 38.6,
    88.2, 5.4, 3.8, 1.2,
    12.4, 30.2, 23.4, 20.8, 13.2,
    48642, 26484, 16.2, 4.2,
    34.0, 38.0, 28.0,
    'Manufacturing', 'Education', 'Healthcare',
    20.4, 16.8, 14.2,
    168400, 68.4, 31.6,
    'suburban', 18.0, 40.0, 42.0,
    'R+26', 48.0
);

-- Richland County (FIPS 079)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Richland', '079', 416862, 33.4,
    42.8, 46.2, 5.8, 2.6,
    8.4, 22.6, 24.8, 26.4, 17.8,
    54218, 30842, 16.4, 4.8,
    20.0, 50.0, 30.0,
    'Public Administration', 'Healthcare', 'Education',
    16.2, 15.4, 14.8,
    178600, 56.4, 43.6,
    'urban', 52.0, 36.0, 12.0,
    'D+18', 28.0
);

-- Saluda County (FIPS 081)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Saluda', '081', 20618, 42.6,
    58.4, 27.8, 11.2, 0.6,
    20.4, 34.8, 23.2, 13.8, 7.8,
    42186, 22648, 16.4, 5.2,
    40.0, 30.0, 30.0,
    'Manufacturing', 'Agriculture', 'Construction',
    22.4, 16.8, 12.6,
    118200, 76.4, 23.6,
    'rural', 4.0, 16.0, 80.0,
    'R+18', 42.0
);

-- Spartanburg County (FIPS 083)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Spartanburg', '083', 327126, 38.4,
    66.2, 21.4, 8.6, 2.0,
    13.6, 29.4, 24.2, 20.4, 12.4,
    49684, 27248, 15.4, 4.6,
    34.0, 38.0, 28.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    22.8, 14.6, 12.4,
    156800, 64.6, 35.4,
    'urban', 36.0, 38.0, 26.0,
    'R+14', 42.0
);

-- Sumter County (FIPS 085)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Sumter', '085', 106512, 36.4,
    42.6, 47.8, 5.8, 1.4,
    15.8, 31.2, 26.4, 16.4, 10.2,
    40862, 22486, 20.4, 6.8,
    30.0, 36.0, 34.0,
    'Healthcare', 'Public Administration', 'Retail Trade',
    16.4, 14.8, 13.6,
    118400, 58.4, 41.6,
    'suburban', 28.0, 32.0, 40.0,
    'D+4', 36.0
);

-- Union County (FIPS 087)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Union', '087', 27316, 44.2,
    62.4, 33.2, 2.6, 0.4,
    20.6, 35.8, 23.4, 12.8, 7.4,
    33248, 20146, 22.6, 7.4,
    38.0, 28.0, 34.0,
    'Manufacturing', 'Healthcare', 'Retail Trade',
    24.6, 15.8, 11.4,
    82400, 66.4, 33.6,
    'rural', 12.0, 22.0, 66.0,
    'R+14', 42.0
);

-- Williamsburg County (FIPS 089)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'Williamsburg', '089', 30368, 44.8,
    28.6, 66.4, 3.2, 0.4,
    23.4, 35.6, 22.8, 12.0, 6.2,
    27486, 15842, 31.6, 10.4,
    34.0, 26.0, 40.0,
    'Healthcare', 'Agriculture', 'Manufacturing',
    16.4, 15.8, 14.2,
    62800, 64.8, 35.2,
    'rural', 4.0, 10.0, 86.0,
    'D+20', 36.0
);

-- York County (FIPS 091)
INSERT INTO sc_county_demographics (
    county_name, county_fips, total_population, median_age,
    pct_white, pct_black, pct_hispanic, pct_asian,
    pct_less_than_hs, pct_hs_graduate, pct_some_college, pct_bachelors_degree, pct_graduate_degree,
    median_household_income, per_capita_income, pct_below_poverty, unemployment_rate,
    pct_blue_collar, pct_white_collar, pct_service_industry,
    top_industry_1, top_industry_2, top_industry_3,
    top_industry_1_pct, top_industry_2_pct, top_industry_3_pct,
    median_home_value, pct_homeowners, pct_renters,
    urbanization, pct_urban, pct_suburban, pct_rural,
    political_lean, pct_evangelical
) VALUES (
    'York', '091', 280892, 37.8,
    70.4, 19.6, 6.4, 1.8,
    9.6, 25.8, 25.4, 24.8, 14.4,
    62486, 33248, 10.8, 3.8,
    26.0, 44.0, 30.0,
    'Healthcare', 'Manufacturing', 'Retail Trade',
    14.2, 13.8, 13.4,
    218400, 72.6, 27.4,
    'suburban', 24.0, 52.0, 24.0,
    'R+12', 36.0
);
