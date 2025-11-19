SELECT
    BUG.BG_BUG_ID,
    BUG.BG_SUMMARY,
    BUG.BG_STATUS,
    BUG.BG_SEVERITY,
    BUG.BG_PRIORITY,
    BUG.BG_DETECTION_DATE,
    BUG.BG_RESPONSIBLE      AS AssignedTo,
    BUG.BG_USER_TEMPLATE_01 AS RootCause,
    BUG.BG_USER_TEMPLATE_10 AS DetectedInPhase,
    BUG.BG_USER_TEMPLATE_13 AS ApplicationUnderTest,
    '' AS Comments
FROM <DB_NAME>.dbo.BUG
WHERE BUG.BG_STATUS NOT IN ('Closed', 'Rejected')
    AND BUG.BG_USER_TEMPLATE_10 IN ('SIT', 'UAT')
    AND BUG.BG_DETECTED_IN_REL IN (SELECT DISTINCT REL_ID 
                                   FROM <DB_NAME>.dbo.RELEASES 
                                   WHERE REL_USER_TEMPLATE_01='<SelectedReleaseProject>')



