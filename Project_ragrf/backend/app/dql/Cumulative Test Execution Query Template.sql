SELECT
    Folder,
    SUM(TotalTestCases) AS TotalTestCases,
    0 AS PlannedTCExecuted,
    SUM(Executed) AS Executed,
    SUM(Passed) AS Passed,
    SUM(Failed) AS Failed,
    SUM(Blocked)  AS Blocked,
    SUM(Deferred) AS Deferred,    
    CASE WHEN SUM(Executed)=0 THEN 0 ELSE SUM(Passed) / CAST(SUM(Executed) AS DECIMAL(5)) End AS PassedPerc,
    CASE WHEN SUM(TotalTestCases) -  SUM(Deferred)=0 THEN 0 ELSE SUM(Passed) / CAST((SUM(TotalTestCases) -  SUM(Deferred)) AS DECIMAL(5)) END AS CompletedPerc,
    0 AS VarianceAgainstPlan,
    '' AS Status,
    CASE WHEN SUM(TotalTestCases)=0 THEN 0 ELSE SUM(AutomationCount) / CAST(SUM(TotalTestCases) AS DECIMAL(5)) End AS AutomationPerc,
    '' AS TotalNumberOfTestDays,
    '' AS CurrentTestDay,
    SUM(AutomationCount) AS AutomationCount
FROM
( 
    SELECT
        Path,
        Folder,
        Automated,
        Regression,
        SUM(Passed) + SUM(Failed) AS Executed,
        SUM(Passed)   AS Passed,
        SUM(Failed)   AS Failed,
        SUM(NoRun)    AS NoRun,
        SUM(Blocked)  AS Blocked,
        SUM(Deferred) AS Deferred,
        SUM(Others)   AS Others,
        SUM(ValidTestCase) AS TotalTestCases,
        SUM(AutomationCount) AS AutomationCount
    FROM
    (    
        SELECT
            '<SelectedPath>' AS Path,
            '<FolderName>' AS Folder,
            TC_STATUS,
            Automated,
            CASE WHEN UPPER(LEFT(Automated,1))='Y' THEN 1 ELSE 0 END AS AutomationCount,
            Regression,
            TC_TESTCYCL_ID,
            CASE WHEN UPPER(TC_STATUS) <> 'N/A' THEN 1 ELSE 0 END AS ValidTestCase,
            CASE WHEN UPPER(TC_STATUS) = 'PASSED'   THEN 1 ELSE 0 END AS Passed,
            CASE WHEN UPPER(TC_STATUS) = 'FAILED'   THEN 1 ELSE 0 END AS Failed,
            CASE WHEN UPPER(TC_STATUS) = 'NO RUN'   THEN 1 ELSE 0 END AS NoRun,
            CASE WHEN UPPER(TC_STATUS) = 'BLOCKED'  THEN 1 ELSE 0 END AS Blocked,
            CASE WHEN UPPER(TC_STATUS) = 'DEFERRED' THEN 1 ELSE 0 END AS Deferred,
            CASE WHEN TC_STATUS NOT IN ('PASSED', 'FAILED', 'NO RUN', 'BLOCKED', 'DEFERRED', 'N/A', 'NOT COMPLETED') THEN 1 ELSE 0 END AS Others
        FROM
        (
            SELECT
                '/' + L00.CF_ITEM_NAME AS Path,
                L00.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME AS Path,
                L01.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME AS Path,
                L02.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME AS Path,
                L03.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L03.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME AS Path,
                L04.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L04 ON L04.CF_FATHER_ID = L03.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L04.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME Path,
                L05.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L04 ON L04.CF_FATHER_ID = L03.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L05 ON L05.CF_FATHER_ID = L04.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L05.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME Path,
                L06.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L04 ON L04.CF_FATHER_ID = L03.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L05 ON L05.CF_FATHER_ID = L04.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L06 ON L06.CF_FATHER_ID = L05.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L06.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME Path,
                L07.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L04 ON L04.CF_FATHER_ID = L03.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L05 ON L05.CF_FATHER_ID = L04.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L06 ON L06.CF_FATHER_ID = L05.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L07 ON L07.CF_FATHER_ID = L06.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L07.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME Path,
                L08.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L04 ON L04.CF_FATHER_ID = L03.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L05 ON L05.CF_FATHER_ID = L04.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L06 ON L06.CF_FATHER_ID = L05.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L07 ON L07.CF_FATHER_ID = L06.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L08 ON L08.CF_FATHER_ID = L07.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L08.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME + '/' + L09.CF_ITEM_NAME Path,
                L09.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L04 ON L04.CF_FATHER_ID = L03.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L05 ON L05.CF_FATHER_ID = L04.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L06 ON L06.CF_FATHER_ID = L05.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L07 ON L07.CF_FATHER_ID = L06.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L08 ON L08.CF_FATHER_ID = L07.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L09 ON L09.CF_FATHER_ID = L08.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L09.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME + '/' + L09.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

            UNION ALL

            SELECT
                '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME + '/' + L09.CF_ITEM_NAME + '/' + L10.CF_ITEM_NAME Path,
                L10.CF_ITEM_NAME,
                CYCLE.CY_CYCLE,
                TESTCYCL.TC_TESTCYCL_ID,
                RTRIM(TESTCYCL.TC_STATUS) AS TC_STATUS,
                TEST.TS_USER_TEMPLATE_12 AS Automated,
                TEST.TS_USER_TEMPLATE_13 AS Regression
            FROM <DB_NAME>.dbo.CYCL_FOLD L00
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L04 ON L04.CF_FATHER_ID = L03.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L05 ON L05.CF_FATHER_ID = L04.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L06 ON L06.CF_FATHER_ID = L05.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L07 ON L07.CF_FATHER_ID = L06.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L08 ON L08.CF_FATHER_ID = L07.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L09 ON L09.CF_FATHER_ID = L08.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L10 ON L10.CF_FATHER_ID = L09.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L10.CF_ITEM_ID
            LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
            LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
            WHERE L00.CF_FATHER_ID=-1
                AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME + '/' + L09.CF_ITEM_NAME + '/' + L10.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
                AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL
        ) AS O
        WHERE Path LIKE '<SelectedPath>%'
    ) AS O2
    GROUP BY Path, Folder, Automated, Regression
) AS O3
GROUP BY Folder
