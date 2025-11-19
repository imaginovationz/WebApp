*** Settings ***
Documentation     WARNING! This is a library File.
Library           XML
Library           String
Library    Collections
Library    ../Utility/WebDriverUtils.py
Variables    ../ConfigFiles/CIBCDesktop/TestConfig.py
Resource    CustomKeywords.robot

*** Variables ***
${DATA_DIR}       ${CURDIR}/../../Data/CIBCDesktop
${XML_DATA_FILE}    TestData.xml

*** Keywords ***
Initialize settings
    [Arguments]    ${test_NAME}    ${module_NAME}    ${model_NAME}
    Set Global Variable    ${ENV_LANGUAGE}    EN
    Set Global Variable    ${DEVICE}    WEB
    Set Global Variable    ${temp_SUITE_NAME}    DC
    ${Excel_Dict}    CustomKeywords.Extract Test data from Excel Data    ${Test_Data_Excel_path}    ${module_NAME}    ${test_NAME[25:]}
    Set Global Variable    ${Excel_Dict}
    # Initialize Test    ${temp_SUITE_NAME}    ${test_NAME}     ${module_NAME}    ${model_NAME}

Initialize Test
    [Arguments]    ${temp_SUITE_NAME}    ${test_NAME}    ${module_NAME}    ${model_NAME}    ${param_ENV}=None
    [Documentation]    Keyword to initialize the Test
    Load Card Data    ${temp_SUITE_NAME}    ${test_NAME}    ${module_NAME}    ${model_NAME}    ${param_ENV}

Load Card Data
    [Arguments]    ${temp_SUITE_NAME}    ${test_NAME}    ${module_NAME}    ${model_NAME}    ${param_ENV}=None
    [Documentation]    Keyword To Load the Card Data    # ${DB_CHECK}=    Run Keyword    Check TestCase Availability    ${TEST_NAME}    # ${XML_TEST_CARD_FILE}=    Set Variable if    '${param_ENV}' == 'None'    ${DATA_DIR}\/${XML_DATA_FILE}    ${DATA_DIR}\/TestData_${param_ENV}.xml    # Run Keyword If    ${DB_CHECK}==1    Load Card Data From DB    # ...    # ELSE    Load Card Data XML    ${XML_TEST_CARD_FILE}
    ${XML_TEST_CARD_FILE}=    Set Variable if    '${param_ENV}' == 'None'    ${DATA_DIR}\/${XML_DATA_FILE}    ${DATA_DIR}\/TestData_${param_ENV}.xml
    Load Card Data XML    ${XML_TEST_CARD_FILE}    ${temp_SUITE_NAME}    ${test_NAME}    ${module_NAME}    ${model_NAME}

Load Card Data XML
    [Arguments]    ${param_DataFile}    ${temp_SUITE_NAME}    ${TEST_NAME}    ${module_NAME}    ${model_NAME}
    [Documentation]    KW to Load the Card Data
    # Checking the Test Suite Count. Test Suite Count should be 1
    ${testSuiteCount}=    XML.Get Element Count    ${param_DataFile}    */${temp_SUITE_NAME}
    Should Not Be Equal As Numbers    ${testSuiteCount}    0    ${\n}ERROR: Test Data Import Failed.${\n}Test Suite Name: ${temp_SUITE_NAME} Not Found in Data File.${\n}Test Suite Name in ${XML_DATA_FILE} should be same as the one in project file
    Should Be Equal As Numbers    ${testSuiteCount}    1    ${\n}ERROR: Test Data Import Failed.${\n}Multiple Tags for Test Suite: ${temp_SUITE_NAME} Found in Data File.${\n}Please check you data file and make the required changes
    ${tcXpath}=    Set Variable    */${temp_SUITE_NAME}/MODULE[@Name="${module_NAME}"]/MODEL[@Name="${model_NAME}"]/TEST_CASE[@Name="${TEST_NAME}"]
    # Checking the Test Case. Test Cause    Count should be 1
    ${testCaseCount}=    XML.Get Element Count    ${param_DataFile}    ${tcXpath}
    Should Be Equal As Numbers    ${testCaseCount}    1    ${\n}ERROR: Test Data Import Failed.${\n}Multiple Test Cases With Name:"${TEST_NAME}" Found in Test Suite: "${temp_SUITE_NAME}".${\n}Please check you data file and make the required changes
    Element Should Exist    ${param_DataFile}    ${tcXpath}    ${\n}ERROR: Test Data Import Failed.${\n}Unable to Find Test Case:"${TEST_NAME}" Under TAG: "${temp_SUITE_NAME}" in Test Data File.${\n}Check For Spelling Mistake and White Spaces
    ${TD}=    Get Child Elements    ${param_DataFile}    ${tcXpath}
    FOR    ${Element}    IN    @{TD}
        ${VariableName}=    Set Variable    ${Element.tag}
        Log To Console    ${VariableName}
        ${VariableValue}=    Set Variable    ${Element.text}
        ${attr}=    XML.Get Element Attribute    ${Element}    KW
        ${attr}=    Convert To String    ${attr}
        ${VariableValue}=    Run Keyword If    '${attr}'!= '${None}'    Run Keyword And Return From Variable    ${VariableValue}
        ...    ELSE    Set Variable    ${VariableValue}
        Set Suite Variable    ${gv_${VariableName}}    ${VariableValue}
    END

Open Chrome Browser
    [Arguments]    ${URL}
    [Documentation]    Open Chrome Browser with start-maximized
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_argument    incognito
    Call Method    ${options}    add_argument    start-maximized
    Create WebDriver    Chrome    chrome_options=${options}
    Go To    ${URL}
    # Open Browser    ${URL}    chrome
    # Maximize Browser Window

Open Chrome Browser With Extension Blocked
    [Arguments]    ${URL}
    [Documentation]    Open Chrome Browser with start-maximized and disabled Automation extension
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_experimental_option    useAutomationExtension    ${False}
    Call Method    ${options}    add_argument    start-maximized
    Call Method    ${options}    add_argument    incognito
    # Create WebDriver    Chrome    chrome_options=${options}
    #Create WebDriver    Chrome   executable_path=${Chromedriverpath_new}  chrome_options=${options}
    ${Chrome_driver_path}=    WebDriverUtils.get_chrome_driver_path
     
     
    ${status}	Run Keyword and Return Status    Create WebDriver    Chrome   chrome_options=${options}   executable_path=${Chrome_driver_path}
    Run Keyword If    '${status}' == 'False'    Fail    Could not launch chrome with the correct driver
     
    Maximize Browser Window
    Go To    ${URL}

Open Headless Chrome Browser
    [Arguments]    ${URL}
    [Documentation]    Open Chrome Headless Browse with start-maximized
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_argument    headless
    Call Method    ${options}    add_argument    ignore-certificate-errors
    Call Method    ${options}    add_argument    incognito
    Call Method    ${options}    add_argument    window-size\=1280,720
    Create WebDriver    Chrome    chrome_options=${options}
    Go To    ${URL}


Open IE Browser
    [Arguments]    ${URL}
    [Documentation]    Open IE Browser
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].DesiredCapabilities.INTERNETEXPLORER    sys,selenium.webdriver
    # Set To Dictionary    ${options}    ignoreProtectedModeSettings    ${True}    enablePersistentHover    ${False}    nativeEvents    ${False}
    Set To Dictionary    ${options}    ignoreProtectedModeSettings    ${False}    enablePersistentHover    ${False}    nativeEvents    ${False}    requireWindowFocus    ${True}    IntroduceInstabilityByIgnoringProtectedModeSettings    ${True}
    # Open Browser    ${URL}    ie
    Create WebDriver    Ie    capabilities=${options}
    Go To    ${URL}



Open FF Browser
    [Arguments]    ${URL}
    [Documentation]    Open FireFox Browser
    Open Browser    ${URL}    ff
    Maximize Browser Window
Open PhantomJS
    [Arguments]    ${URL}
    Open Browser    ${URL}    phantomjs
    Set Window Size    ${1280}    ${720}

Open EdgeBrowser
    [Arguments]    ${URL}
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].DesiredCapabilities.EDGE    sys,selenium.webdriver
    # Set To Dictionary    ${options}    ignoreProtectedModeSettings    ${True}    enablePersistentHover    ${False}    nativeEvents    ${False}
    # Open Browser    ${URL}    ie
    # Call Method    ${options}    add_argument    start-maximized
    Set To Dictionary    ${options}    ignoreProtectedModeSettings    ${True}    enablePersistentHover    ${False}    nativeEvents    ${False}    requireWindowFocus    ${True}    IntroduceInstabilityByIgnoringProtectedModeSettings    ${True}
    Create WebDriver    Edge    capabilities=${options}
    Maximize Browser Window
    Go To    ${URL}
    
# Open EdgeChromium Browser
    # [Arguments]    ${URL}
    # [Documentation]    Open Edge Chromium based Browser with
    # Open Browser    about:blank    Edge    options=add_argument("--ignore-certificate-errors")
    # Maximize Browser Window
    # Go To  ${URL}

Open Browser in Grid
    [Arguments]    ${GRID_URL}    ${URL}    ${BROWSER}
    [Documentation]    Open Browser in Grid
    ${list}=    Create List    --no-sandbox    --disable-gpu    --disable-dev-shm-usage    --headless    --ignore-certificate-errors
    ${desired_caps}=    Create Dictionary    enableVNC=${True}    enableVideo=${True}    sessionTimeout=30m    args=${list}
    Log    ${desired_caps}
    Run Keyword If    '${BROWSER}' =='chrome'    SeleniumLibrary.Open Browser    ${URL}    ${BROWSER}    remote_url=${GRID_URL}    desired_capabilities=${desired_caps}
    ...    ELSE    SeleniumLibrary.Open Browser    ${URL}    ${BROWSER}    remote_url=${GRID_URL}    desired_capabilities=${desired_caps}
    Maximize Browser Window
    Wait Until Loading Is Complete
    BuiltIn.Sleep    4s
    AUTCommon.Verify Page Is Loaded Completely
    BuiltIn.Sleep    4s

Open Browser For Test
    [Documentation]    Keyword to open test browser based upon input provided by user in config file.
    [Arguments]    ${param_Browser}=${ENV_Browser}     ${param_URL}=${ENV_URL}    ${param_Grid_URL}=${ENV_GRID_URL}
    Run Keyword If    '${param_Grid_URL}' != ''    Open Browser in Grid    ${param_Grid_URL}    ${param_URL}    ${param_Browser}
    #Run Keyword If    '${param_Browser}' == 'CHROME'    Open Chrome Browser With Extension Blocked    ${param_URL}
    ...    ELSE IF    '${param_Browser}' == 'CHROME'    Open Chrome Browser With Extension Blocked    ${param_URL}
    ...    ELSE IF    '${param_Browser}' == 'HEADLESS CHROME'    Open Headless Chrome Browser    ${param_URL}
    ...    ELSE IF    '${param_Browser}' == 'IE'    Open IE Browser    ${param_URL}
    ...    ELSE IF    '${param_Browser}' == 'FF'    Open FF Browser    ${param_URL}
    ...    ELSE IF    '${param_Browser}' == 'EDGE'    Open EdgeBrowser    ${param_URL}
    ...    ELSE IF    '${param_Browser}' == 'PHANTOMJS'    Open PhantomJS    ${param_URL}
    ...    ELSE IF    '${param_Browser}' == 'EDGE'    Open EdgeBrowser    ${param_URL}
    # ...    ELSE IF    '${param_Browser}' == 'EDGECHROMIUM'    Open EdgeChromium Browser    ${param_URL}
    ...    ELSE      Open Chrome Browser With Extension Blocked    ${param_URL}
 
