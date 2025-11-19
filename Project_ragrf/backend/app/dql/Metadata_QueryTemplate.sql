SELECT
    '<LOB>' AS LOB,
    '<DOMAIN_NAME>' AS DOMAIN_NAME,
    '<PROJECT_NAME>' AS PROJECT_NAME,
    '<DB_NAME>' AS DB_NAME,
    SF_TABLE_NAME,
    SF_USER_LABEL,
    SF_COLUMN_NAME
FROM <DB_NAME>.dbo.SYSTEM_FIELD
WHERE SF_TABLE_NAME ='BUG'
    AND SF_USER_LABEL IN ('Reopen Count','*Detected in Phase','Application Under Test','Closed on Date','Defect ID','Detected By','Detected in Cycle','Detected in Release','Detected on Date','Priority','Root Cause','Severity','Status','Sub-Cause','Vendor Variance?')

UNION ALL

SELECT
    '<LOB>' AS LOB,
    '<DOMAIN_NAME>' AS DOMAIN_NAME,
    '<PROJECT_NAME>' AS PROJECT_NAME,
    '<DB_NAME>' AS DB_NAME,
    SF_TABLE_NAME,
    SF_USER_LABEL,
    SF_COLUMN_NAME
FROM <DB_NAME>.dbo.SYSTEM_FIELD
WHERE SF_TABLE_NAME ='CYCL_FOLD'
    AND SF_USER_LABEL IN ('Target Cycle','Test Set Folder ID','Test Set Folder','Test Set ID')

UNION ALL

SELECT
    '<LOB>' AS LOB,
    '<DOMAIN_NAME>' AS DOMAIN_NAME,
    '<PROJECT_NAME>' AS PROJECT_NAME,
    '<DB_NAME>' AS DB_NAME,
    SF_TABLE_NAME,
    SF_USER_LABEL,
    SF_COLUMN_NAME
FROM <DB_NAME>.dbo.SYSTEM_FIELD
WHERE SF_TABLE_NAME ='RELEASE_CYCLES'
    AND SF_USER_LABEL IN ('Cycle ID','End Date','Name','Release ID','Start Date')

UNION ALL

SELECT
    '<LOB>' AS LOB,
    '<DOMAIN_NAME>' AS DOMAIN_NAME,
    '<PROJECT_NAME>' AS PROJECT_NAME,
    '<DB_NAME>' AS DB_NAME,
    SF_TABLE_NAME,
    SF_USER_LABEL,
    SF_COLUMN_NAME
FROM <DB_NAME>.dbo.SYSTEM_FIELD
WHERE SF_TABLE_NAME ='RELEASES'
    AND SF_USER_LABEL IN ('Area','End Date','Name','Project Complexity','Project Name','Release ID','Start Date')

UNION ALL

SELECT
    '<LOB>' AS LOB,
    '<DOMAIN_NAME>' AS DOMAIN_NAME,
    '<PROJECT_NAME>' AS PROJECT_NAME,
    '<DB_NAME>' AS DB_NAME,
    SF_TABLE_NAME,
    SF_USER_LABEL,
    SF_COLUMN_NAME
FROM <DB_NAME>.dbo.SYSTEM_FIELD
WHERE SF_TABLE_NAME ='TEST'
    AND SF_USER_LABEL IN ('Automated','Creation Date','Regression','Test ID','Test Name','Test Stage','Type')

UNION ALL

SELECT
    '<LOB>' AS LOB,
    '<DOMAIN_NAME>' AS DOMAIN_NAME,
    '<PROJECT_NAME>' AS PROJECT_NAME,
    '<DB_NAME>' AS DB_NAME,
    SF_TABLE_NAME,
    SF_USER_LABEL,
    SF_COLUMN_NAME
FROM <DB_NAME>.dbo.SYSTEM_FIELD
WHERE SF_TABLE_NAME ='TESTCYCL'
    AND SF_USER_LABEL IN ('Exec Date','Planned Exec Date','Status','Target Cycle','Test','Test Instance','TestSet')

