-- backend/dql/ALM_connection.sql
-- Example template that uses both placeholders:
--   <DB_NAME> and (optionally) <SelectedReleaseID>
SELECT TOP 100
    T.TEST_ID           AS [Test ID],
    T.TS_NAME           AS [Test Name],
    CY.CY_CYCLE         AS [Cycle Name],
    R.REL_NAME          AS [Release Name],
    TC.TC_STATUS        AS [Status]
FROM <DB_NAME>.dbo.TEST T
LEFT JOIN <DB_NAME>.dbo.TESTCYCL TC ON TC.TC_TEST_ID = T.TEST_ID
LEFT JOIN <DB_NAME>.dbo.CYCLE   CY ON CY.CY_CYCLE_ID = TC.TC_CYCLE_ID
LEFT JOIN <DB_NAME>.dbo.RELEASES R ON R.REL_ID = CY.CY_RELEASE_ID
WHERE (@@PLACEHOLDER@@ = @@PLACEHOLDER@@)
  OR (R.REL_ID = <SelectedReleaseID>) -- only applied if file contains the token and release_name is provided
ORDER BY [Test ID] DESC;
