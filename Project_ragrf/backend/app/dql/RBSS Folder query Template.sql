SELECT 
    Path
FROM
(    
    SELECT
        '/' + L00.CF_ITEM_NAME AS Path
    FROM <DB_NAME>.dbo.CYCL_FOLD L00
    LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L00.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
    LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
    WHERE L00.CF_FATHER_ID=-1    
        AND '/' + L00.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME AS Path
    FROM <DB_NAME>.dbo.CYCL_FOLD L00
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L01.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
    LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
    WHERE L00.CF_FATHER_ID=-1
        AND L01.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME AS Path
    FROM <DB_NAME>.dbo.CYCL_FOLD L00
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L02.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
    LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
    WHERE L00.CF_FATHER_ID=-1
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME AS Path
    FROM <DB_NAME>.dbo.CYCL_FOLD L00
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L03.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
    LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
    WHERE L00.CF_FATHER_ID=-1
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND L03.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L03.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME AS Path
    FROM <DB_NAME>.dbo.CYCL_FOLD L00
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L01 ON L01.CF_FATHER_ID = L00.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L02 ON L02.CF_FATHER_ID = L01.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L03 ON L03.CF_FATHER_ID = L02.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCL_FOLD L04 ON L04.CF_FATHER_ID = L03.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.CYCLE ON CYCLE.CY_FOLDER_ID=L04.CF_ITEM_ID
    LEFT JOIN <DB_NAME>.dbo.TESTCYCL ON TESTCYCL.TC_CYCLE_ID = CYCLE.CY_CYCLE_ID
    LEFT JOIN <DB_NAME>.dbo.TEST ON TEST.TS_TEST_ID=TESTCYCL.TC_TEST_ID
    WHERE L00.CF_FATHER_ID=-1
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND L03.CF_ITEM_NAME <> ''
        AND L04.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L03.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L04.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME Path
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
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND L03.CF_ITEM_NAME <> ''
        AND L04.CF_ITEM_NAME <> ''
        AND L05.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L03.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L04.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L05.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME Path
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
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND L03.CF_ITEM_NAME <> ''
        AND L04.CF_ITEM_NAME <> ''
        AND L05.CF_ITEM_NAME <> ''
        AND L06.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L03.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L04.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L05.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L06.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME Path
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
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND L03.CF_ITEM_NAME <> ''
        AND L04.CF_ITEM_NAME <> ''
        AND L05.CF_ITEM_NAME <> ''
        AND L06.CF_ITEM_NAME <> ''
        AND L07.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L03.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L04.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L05.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L06.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L07.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME Path
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
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND L03.CF_ITEM_NAME <> ''
        AND L04.CF_ITEM_NAME <> ''
        AND L05.CF_ITEM_NAME <> ''
        AND L06.CF_ITEM_NAME <> ''
        AND L07.CF_ITEM_NAME <> ''
        AND L08.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L03.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L04.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L05.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L06.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L07.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L08.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME + '/' + L09.CF_ITEM_NAME Path
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
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND L03.CF_ITEM_NAME <> ''
        AND L04.CF_ITEM_NAME <> ''
        AND L05.CF_ITEM_NAME <> ''
        AND L06.CF_ITEM_NAME <> ''
        AND L07.CF_ITEM_NAME <> ''
        AND L08.CF_ITEM_NAME <> ''
        AND L09.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L03.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L04.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L05.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L06.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L07.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L08.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L09.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME + '/' + L09.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL

    UNION

    SELECT
        '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME + '/' + L09.CF_ITEM_NAME + '/' + L10.CF_ITEM_NAME Path
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
        AND L01.CF_ITEM_NAME <> ''
        AND L02.CF_ITEM_NAME <> ''
        AND L03.CF_ITEM_NAME <> ''
        AND L04.CF_ITEM_NAME <> ''
        AND L05.CF_ITEM_NAME <> ''
        AND L06.CF_ITEM_NAME <> ''
        AND L07.CF_ITEM_NAME <> ''
        AND L08.CF_ITEM_NAME <> ''
        AND L09.CF_ITEM_NAME <> ''
        AND L10.CF_ITEM_NAME <> ''
        AND LOWER(L01.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L02.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L03.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L04.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L05.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L06.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L07.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L08.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L09.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND LOWER(L10.CF_ITEM_NAME) NOT IN ('to be deleted', 'deleted', 'remove', 'removed', 'to-be-deleted', 'trash')
        AND '/' + L00.CF_ITEM_NAME + '/' + L01.CF_ITEM_NAME + '/' + L02.CF_ITEM_NAME + '/' + L03.CF_ITEM_NAME + '/' + L04.CF_ITEM_NAME + '/' + L05.CF_ITEM_NAME  + '/' + L06.CF_ITEM_NAME + '/' + L07.CF_ITEM_NAME + '/' + L08.CF_ITEM_NAME + '/' + L09.CF_ITEM_NAME + '/' + L10.CF_ITEM_NAME LIKE '<FolderSearchKeyword>'
        --AND TESTCYCL.TC_TESTCYCL_ID IS NOT NULL
) AS O
ORDER BY Path


