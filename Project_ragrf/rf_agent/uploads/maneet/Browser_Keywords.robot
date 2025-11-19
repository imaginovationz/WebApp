*** Settings ***
Documentation       This is browser keywords file
Resource            ../../Configuration/URLs_Links_SetUp.robot

*** Keywords ***

Open Browser For Test
    [Documentation]    Keyword to open test browser based upon input provided by user in config file.
    [Arguments]    ${param_Browser}=${ENV_Browser}     ${param_URL}=${MMTG_URL}    ${param_alias_name}=${EMPTY}     ${param_Grid_URL}=${EMPTY}
    Run Keyword If    '${param_Grid_URL}' != ''    Open Browser in Grid    ${param_Grid_URL}    ${param_URL}    ${param_Browser}
    ...    ELSE IF    '${param_Browser}' == 'CHROME'    Open Chrome Browser With Extension Blocked    ${param_URL}      ${param_alias_name}
    ...    ELSE IF    '${param_Browser}' == 'HEADLESS CHROME'    Open Headless Chrome Browser    ${param_URL}       ${param_alias_name}
    ...    ELSE IF    '${param_Browser}' == 'IE'    Open IE Browser    ${param_URL}     ${param_alias_name}
    ...    ELSE IF    '${param_Browser}' == 'FF'    Open FF Browser    ${param_URL}     ${param_alias_name}
    ...    ELSE IF    '${param_Browser}' == 'EDGE'    Open EdgeBrowser    ${param_URL}      ${param_alias_name}
    ...    ELSE IF    '${param_Browser}' == 'PHANTOMJS'    Open PhantomJS    ${param_URL}       ${param_alias_name}
    ...    ELSE      Open Chrome Browser With Extension Blocked    ${param_URL}         ${param_alias_name}

Open Chrome Browser With Extension Blocked
    [Arguments]    ${URL}       ${Alias_Chrome}
    [Documentation]    Open Chrome Browser with start-maximized and disabled Automation extension
    Log     ${Chromedriverpath}
    Open Browser        ${URL}      Chrome        alias=${Alias_Chrome}         executable_path=${Chromedriverpath}         options=add_argument("start-maximized");add_argument("ignore-certificate-errors");add_argument("incognito")

Open EdgeBrowser
    [Arguments]    ${URL}       ${Alias_Edge}
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].DesiredCapabilities.EDGE    sys,selenium.webdriver
    Set To Dictionary    ${options}    ignoreProtectedModeSettings    ${True}    enablePersistentHover    ${False}    nativeEvents    ${False}    requireWindowFocus    ${True}    IntroduceInstabilityByIgnoringProtectedModeSettings    ${True}
    Create WebDriver    Edge    alias=${Alias_Edge}     executable_path=${MSEdgedriverpath}     capabilities=${options}
    Maximize Browser Window
    Go To    ${URL}

Open Headless Chrome Browser
    [Arguments]    ${URL}       ${Alias_Chrome}
    [Documentation]    Open Chrome Headless Browse with start-maximized
    Log        ${Chromedriverpath}
    Open Browser        ${URL}      Chrome        alias=${Alias_Chrome}         executable_path=${Chromedriverpath}     options=add_argument("headless");add_argument("start-maximized");add_argument("ignore-certificate-errors");add_argument("incognito");add_argument("window-size\=1280,720")

Open IE Browser
    [Arguments]    ${URL}   ${Alias_Name}
    [Documentation]    Open IE Browser
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].DesiredCapabilities.INTERNETEXPLORER    sys,selenium.webdriver
    Set To Dictionary    ${options}    ignoreProtectedModeSettings    ${False}    enablePersistentHover    ${False}    nativeEvents    ${False}    requireWindowFocus    ${True}    IntroduceInstabilityByIgnoringProtectedModeSettings    ${True}
    Create WebDriver    Ie    alias=${Alias_Name}     capabilities=${options}
    Go To    ${URL}

Open FF Browser
    [Arguments]    ${URL}   ${Alias_Name}
    [Documentation]    Open FireFox Browser
    Open Browser    ${URL}    ff        alias=${Alias_Name}
    Maximize Browser Window

Open PhantomJS
    [Arguments]    ${URL}       ${Alias_Name}
    Open Browser    ${URL}    phantomjs     alias=${Alias_Name}
    Set Window Size    ${1280}    ${720}

Open Browser in Grid
    [Arguments]    ${GRID_URL}    ${URL}    ${BROWSER}
    [Documentation]    Open Browser in Grid
    ${list}=    Create List    --no-sandbox    --disable-gpu    --disable-dev-shm-usage    --headless    --ignore-certificate-errors
    ${desired_caps}=    Create Dictionary    enableVNC=${True}    enableVideo=${True}    sessionTimeout=30m    args=${list}
    Run Keyword If    '${BROWSER}' =='chrome'    SeleniumLibrary.Open Browser    ${URL}    ${BROWSER}    remote_url=${GRID_URL}    desired_capabilities=${desired_caps}
    ...    ELSE    SeleniumLibrary.Open Browser    ${URL}    ${BROWSER}    remote_url=${GRID_URL}    desired_capabilities=${desired_caps}
    Maximize Browser Window
    BuiltIn.Sleep    ${maxSleep}
    BuiltIn.Sleep    ${maxSleep}

Launch ENVOY Application on Browser
    [Documentation]  This keyword launches Application on Browser
    Open Browser For Test    ${ENV_Browser}      ${ECIF_URL}      ${ECIF_Alias_Name}
    Add Test Step to E2E Test Report Word document     A43
    Capture Screenshot and Add to E2E Test Report Word document

Update Maturity Date To Less Than 32 Days
    [Documentation]    Update the mortgage maturity date so it is less than 32 days from today.
    # Implementation assumes navigation to the maturity date field is already handled by Search Mortgage By PDE
    ${new_date}=    Get Date    increment=+30d    result_format=%Y-%m-%d
    Custom Input Text    ${Maturity_Date_Field_Xpath}    ${new_date}
    Custom Click Element    ${Save_Button_Xpath}
    Wait Until Page Contains    Successfully updated    timeout=10s

Validate Mortgage Details For Renewal
    [Documentation]    Validate mortgage details, language, employee field, and maturity details for renewal eligibility.
    Element Should Contain    ${Mortgage_Details_Section_Xpath}    1 Year Closed Fixed Rate
    Element Should Contain    ${Language_Field_Xpath}    English
    Element Should Contain    ${Employee_Field_Xpath}    No
    Element Should Contain    ${Maturity_Details_Section_Xpath}    Pending Renewal
    Element Should Contain    ${Maturity_Details_Section_Xpath}    Fully Advanced

Input PDE And Mortgage Number For Renewal Agreement Print
    [Arguments]    ${PDE}    ${Mortgage_Number}    ${Action}
    [Documentation]    Input PDE, mortgage number, and print action to print the renewal agreement.
    Custom Input Text    ${PDE_Input_Xpath}    ${PDE}
    Custom Input Text    ${Mortgage_Number_Input_Xpath}    ${Mortgage_Number}
    Custom Input Text    ${Action_Input_Xpath}    ${Action}
    Custom Click Element    ${Submit_Button_Xpath}
    Wait Until Page Contains    Print request submitted    timeout=10s

Login To Excalibur Application
    [Documentation]    Login to Excalibur application.
    Custom Input Text    ${Excalibur_Username_Xpath}    ${EXCALIBUR_USERNAME}
    Custom Input Text    ${Excalibur_Password_Xpath}    ${EXCALIBUR_PASSWORD}
    Custom Click Element    ${Excalibur_Login_Button_Xpath}
    Wait Until Page Contains    Dashboard    timeout=15s

Login To Envoy Application
    [Documentation]    Login to Envoy application.
    Custom Input Text    ${Envoy_Username_Xpath}    ${ENVOY_USERNAME}
    Custom Input Text    ${Envoy_Password_Xpath}    ${ENVOY_PASSWORD}
    Custom Click Element    ${Envoy_Login_Button_Xpath}
    Wait Until Page Contains    Welcome    timeout=15s

Enter Mortgage Number In Envoy
    [Arguments]    ${Mortgage_Number}
    [Documentation]    Enter the 7-digit mortgage number in Envoy.
    Custom Input Text    ${Envoy_Mortgage_Number_Input_Xpath}    ${Mortgage_Number}
    Custom Click Element    ${Envoy_Search_Button_Xpath}
    Wait Until Page Contains    Mortgage Details    timeout=10s

Wait Until MD189X Is Generated
    [Arguments]    ${Mortgage_Number}
    [Documentation]    Wait until MD189X document is generated for the given mortgage number.
    Wait Until Keyword Succeeds    2 min    10s    Page Should Contain Element    xpath=//td[contains(text(),'MD189X') and contains(text(),'${Mortgage_Number}')]

Download MD189X Letter
    [Arguments]    ${Mortgage_Number}
    [Documentation]    Download the MD189X letter for the given mortgage number.
    Click Element    xpath=//td[contains(text(),'MD189X') and contains(text(),'${Mortgage_Number}')]/following-sibling::td//a[contains(text(),'Download')]
    Wait Until File Exists    ${DOWNLOAD_DIR}/MD189X_${Mortgage_Number}.pdf    timeout=30s

Validate MD189X Letter Contents
    [Documentation]    Validate required elements in the downloaded MD189X letter.
    Validate MD189X PDF Contains Fields    ${DOWNLOAD_DIR}/MD189X_${MORTGAGE_NUMBER}.pdf

Custom Capture Page Screenshot
    [Arguments]    ${Step_Description}
    [Documentation]    Capture page screenshot and add to E2E test report with step description.
    Capture Screenshot and Add to E2E Test Report Word document
    Add Test Message to E2E Test Report Word document    ${Step_Description}
