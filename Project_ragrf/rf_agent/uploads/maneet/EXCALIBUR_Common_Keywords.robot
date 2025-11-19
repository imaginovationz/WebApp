*** Settings ***
Resource            ../../Configuration/URLs_Links_SetUp.robot


*** keywords ***

Launch and Login to EXCALIBUR
    Add Test Step to E2E Test Report Word document     A27
    Launch Excalibur Application
    Take Screenshot and Add to E2E Test Report Word document
    Login to Excalibur    ${Excalibur_Username}    ${Excalibur_Password}
    Enter Commands in INITIAL MENU Screen
    Take Screenshot and Add to E2E Test Report Word document

Validate for Commitment or With Advancing status in EXCALIBUR
    Navigate to given PDE    218A    ${Mortgage_Service_Num}
    Add Test Step to E2E Test Report Word document     A28
    Take Screenshot and Add to E2E Test Report Word document
    ${Status_EXCALIBUR_Commitment}     Run Keyword and Return Status     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text     2    1     11    ${SPACE}Commitment
    ${Status_EXCALIBUR_Advancing}      Run Keyword and Return Status     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text     2    1     15    ${SPACE}WITH ADVANCING
    ${Status_EXCALIBUR_Fully Advanced}      Run Keyword and Return Status     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text     2    1     15    ${SPACE}Fully advanced
    Run Keyword If    "${Status_EXCALIBUR_Commitment}"=="True" or "${Status_EXCALIBUR_Advancing}"=="True" or "${Status_EXCALIBUR_Fully Advanced}"=="True"  Log     Status in EXCALIBUR found as expected
    ...     ELSE     Fail          Status in EXCALIBUR not found as expected
    Update Test Output Data Sheet    R    Passed

Validate for Offer Printed Status in Excalibur
    [Documentation]  This keyword is to verify the status of the Offer printed
    Add Test Step to E2E Test Report Word document      A35
    ${Mortgage Offer Printed Status}     Run Keyword and Return Status     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text     8    34     13    Offer printed
    Log     ${Mortgage Offer Printed Status}
    Run Keyword If    "${Mortgage Offer Printed Status}"=="True"    Log     Offer Printed Text is Found as Expected
    ...     ELSE     Fail          Offer Printed Text is not Found as Expected
    Take Screenshot and Add to E2E Test Report Word document

Launch Excalibur Application
    [Documentation]    This keyword will launch Excalibur Application
     ${Excalibur_Active_Status}     Run Keyword And Return Status      Check for Existing Reflection Workspace
     Run Keyword IF       "${Excalibur_Active_Status}"=="False"        launch_excalibur
     ...      ELSE IF     "${Excalibur_Active_Status}"=="True"         Reconnect to EXCALIBUR
    sleep   ${midSleep}
    Press Enter Key in Excalibur
    sleep   ${minSleep}
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          {ENTER}
    sleep   ${minSleep}
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          {ENTER}
    Validate Sign On Screen
    
Check for Existing Reflection Workspace
    Wait For Active Window     Reflection Workspace        TimeOut=${TimeOut_Min}
    sleep     ${OneSecSleep}
    
Reconnect to EXCALIBUR
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          {ALT}
    sleep     ${OneSecSleep}
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          I
    sleep     ${OneSecSleep}
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          H
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          D
    sleep     ${OneSecSleep}
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          {ALT}
    sleep     ${OneSecSleep}
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          I
    sleep     ${OneSecSleep}
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          H
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s      AutoITLibrary.Send          C

Login to Excalibur
    [Documentation]    This keyword will login to Excalibur
    [Arguments]    ${Excalibur_Username}    ${Excalibur_Password}
    Enter Username    ${Excalibur_Username}
    Enter Password    ${Excalibur_Password}
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Press Enter Key in Excalibur
    ${Status}    Verify if Error Screen is displayed while generating ticket
    Run keyword if    ${Status}    Press Enter Key in Excalibur
    Validate MAIN MENU Screen

Enter Commands in INITIAL MENU Screen
    [Documentation]    Enter Commands in Initial Menu
    Enter Command in Initial Main Menu
    Custom Take Screenshot
    Enter Env Command in Main Menu
    Custom Take Screenshot


Close Excalibur Application
    ExcaliburUtility.close_excalibur

Navigate to given PDE
    [Documentation]    Navigate to PDE 896 - Display Data Screen in Excalibur
    [Arguments]    ${PDE}    ${mortgage_number}
    Enter PDE Number in Entry Field    ${PDE}
    # Enter Mortgage Number in Key Value field    ${mortgage_number}.${rankofcharge}
    Enter Mortgage Number in Key Value field    ${mortgage_number}.1
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    sleep    ${minSleep}
    Custom Take Screenshot


Navigate to given PDE for renewal processing pannel In Excalibur
    [Documentation]    Navigate to PDE 651 - Display renewal processing Screen in Excalibur
    Add Test Step to E2E Test Report Word document     A32
    Run Keyword If    "${ENV}" == "SIT1" or "${ENV}" == "P1"    Navigate to given PDE for renewal processing pannel   651  ${Flow_20_Dict['mortgage_number_P1'][0]}
    Run Keyword If    "${ENV}" == "SIT2" or "${ENV}" == "PA"    Navigate to given PDE for renewal processing pannel   651  ${Flow_20_Dict['mortgage_number_PA'][0]}

To Print offer in Renewal Processing panel In Excalibur
    [Documentation]    This Keyword is use to provide PDE number and print the offer in renewal processing panel.
    Add Test Step to E2E Test Report Word document     A34
    Run Keyword If    "${ENV}" == "SIT1" or "${ENV}" == "P1"    To Print offer in Renewal Processing panel    ${Flow_20_Dict['mortgage_number_P1'][0]}
    Run Keyword If    "${ENV}" == "SIT2" or "${ENV}" == "PA"    To Print offer in Renewal Processing panel    ${Flow_20_Dict['mortgage_number_PA'][0]}




Navigate to given PDE for renewal processing pannel
    [Documentation]    Navigate to PDE 651 - Display renewal processing Screen in Excalibur
    [Arguments]    ${PDE}    ${mortgage_number}
    Enter PDE Number in Entry Field    ${PDE}
    Enter Mortgage Number in Key Value field    ${mortgage_number}.1
    Custom Take Screenshot
    Press Enter Key in Excalibur
    sleep    ${minSleep}
    Press Enter Key in Excalibur
    sleep   ${minSleep}
    Take Screenshot and Add to E2E Test Report Word document
    # Capture Screenshot and Add to E2E Test Report Word document


Delete offer in renewal processing panel
    [Documentation]     To delete offer  in renewal processing panel
    Validate for Offer Printed Status before deleting the offer in Excalibur
    Add Test Step to E2E Test Report Word document     A33
    Enter Delete Option Number in Entry Field   9   ${Flow_20_Dict['Reason Code for Delete Offer'][0]}


Validate for Offer Printed Status before deleting the offer in Excalibur
    [Documentation]  Validate for Offer Printed Status before deleting the offer in Excalibur
    Add Test Step to E2E Test Report Word document      A72
    ${Mortgage Offer Printed Status}     Run Keyword and Return Status     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text     8    34     13    Offer printed
    Log     ${Mortgage Offer Printed Status}
    Run Keyword If    "${Mortgage Offer Printed Status}"=="True"    Log     Offer Printed Text is available for this deal
    ...     ELSE     Fail         Offer Printed Text is Not available for this deal
    Take Screenshot and Add to E2E Test Report Word document

Custom Keyword for Excalibur to Get Text from Screen
    [Documentation]    This Keyword is use to get text from Excalibur Screen.
    [Arguments]    ${startRow}    ${startColumn}    ${lengthActualText}
    ${CaptureText}=    excalibur_get_text    ${startRow}    ${startColumn}    ${lengthActualText}
    Log    ActualText form Excalibur Screen:${CaptureText}
    Return From Keyword    ${CaptureText}

Custom Keyword for Excalibur to Capture & Compare Text with Actual Text
    [Documentation]    This Keyword is use to capture & compare text with actual text in Excalibur.
    [Arguments]    ${startRow}    ${startColumn}    ${lengthActualText}    ${ExpectedText}
    excalibur_capture_and_compare_text    ${startRow}    ${startColumn}    ${lengthActualText}    ${ExpectedText}

Enter Command in Initial Main Menu
    [Documentation]    Enter Command in Main Menu
    Press Enter Key in Excalibur
    excalibur_set_text      20   07   ${Excalibur_Library_Command}
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur

Press Enter Key in Excalibur
    [Documentation]    Keyword to press Enter Key
    excalibur_send_keys     {ENTER}
    sleep    ${minSleep}

Enter Env Command in Main Menu
    [Documentation]    Enter Env Command in Main Menu
    excalibur_set_text      20   07   ${Excalibur_Env_Setup_Command}(${EXCALIBUR_ENV})
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur

Set 896 in Entry Input
    [Documentation]    Navigate to 896 PDE
    excalibur_set_text      20   31   896
    Press Enter Key in Excalibur

Enter PDE Number in Entry Field
    [Documentation]    This Keyword is use to provide PDE number.
    [Arguments]    ${PDENumber}
    sleep    ${minSleep}
    Custom Keyword for Excalibur to Set Text    20    31    ${PDENumber}

Enter Delete Option Number in Entry Field
    [Documentation]    This Keyword is use to provide PDE number and delete the offer in renewal processing panel.
    [Arguments]    ${Option for Delete Offer}   ${Reason Code for Delete Offer}
    sleep   ${minSleep}
    Custom Keyword for Excalibur to Set Text    08    02    ${Option for Delete Offer}
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    sleep   ${minSleep}
    Custom Keyword for Excalibur to Set Text    15    55    ${Reason Code for Delete Offer}
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Sleep   ${minSleep}
    Take Screenshot and Add to E2E Test Report Word document
    Custom Keyword for Excalibur to Set Text    17    70    N
    Sleep     ${minSleep}
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Validate for deleted Offer Printed Status in Excalibur
    Sleep     ${minSleep}
    keyboard.Press And Release   F12
    Sleep     ${minSleep}
    keyboard.Press And Release   F12

Validate for deleted Offer Printed Status in Excalibur
    [Documentation]  This keyword is to verify the status of the deleted Offer printed
    Add Test Step to E2E Test Report Word document      A69
    ${Mortgage Offer Printed Status}     Run Keyword and Return Status     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text     8    34     13    Offer printed
    Log     ${Mortgage Offer Printed Status}
    Run Keyword If    "${Mortgage Offer Printed Status}"=="False"    Log     Offer Deleted Successfully
    ...     ELSE     Fail         offer not Deleted Successfully
    Take Screenshot and Add to E2E Test Report Word document

Custom Keyword for Clear field in Excalibur
    [Documentation]    This keyword is use to set text in required field for excalibur.
    clear_field     20    40    9

To Print offer in Renewal Processing panel
    [Documentation]    This Keyword is use to provide PDE number and print the offer in renewal processing panel.
    [Arguments]     ${mortgage_number}
    Enter PDE Number in Entry Field     655
    Take Screenshot and Add to E2E Test Report Word document
    sleep    ${OneSecSleep}
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Custom Keyword for Excalibur to Set Text    15    58    ${Flow_20_Dict['Renewal_Date'[0]}
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Custom Keyword for Clear field in Excalibur
    sleep    ${minSleep}
    Enter PDE Number in Entry Field    652
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Enter Mortgage Number in Key Value field for renewal processing panel    ${mortgage_number}.1
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Custom Keyword for Excalibur to Set Text    08    02    6
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    sleep  ${minSleep}
    keyboard.Press And Release   F12
    sleep     ${TwentySecSleep}
    Enter PDE Number in Entry Field    652
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Press Enter Key in Excalibur
    Sleep     ${minSleep}
    Enter Mortgage Number in Key Value field for renewal processing panel    ${mortgage_number}.1
    Press Enter Key in Excalibur

    
Enter Function Keys in Excalibur
    [Documentation]    Keyword to invoke pass function key
    [Arguments]     ${function_key}
    keyboard.Press And Release    ${function_key}
    sleep    ${OneSecSleep}

Enter Mortgage Number in Key Value field
    [Documentation]    This Keyword is use to provide value in Keyw Value Field.
    [Arguments]    ${MortgageNumber}
    Custom Keyword for Excalibur to Set Text    20    40    ${MortgageNumber}

Enter Mortgage Number in Key Value field for renewal processing panel
    [Documentation]    This Keyword is use to provide value in Keyw Value Field.
    [Arguments]    ${MortgageNumber}
    Custom Keyword for Excalibur to Set Text    5    31    ${MortgageNumber}



Custom Keyword for Excalibur to Set Text
    [Documentation]    This keyword is use to set text in required field for excalibur.
    [Arguments]    ${startRow}    ${startColumn}    ${ProvidedText}
    excalibur_set_text    ${startRow}    ${startColumn}    ${ProvidedText}
    Log    Provided text:${ProvidedText}
    ${ProvidedText}=    Convert To String    ${ProvidedText}
    ${LengthProvidedText}=    Get Length    ${ProvidedText}
    ${CapturedText}=    Custom Keyword for Excalibur to Get Text from Screen    ${startRow}    ${startColumn}    ${LengthProvidedText}
    Run Keyword If    '${ProvidedText}' == '${CapturedText}'    Log    Text set successfully.

Validate Sign On Screen
    Wait Until Keyword Succeeds     ${iMax}     2s     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text    22   06   4  CIBC
    sleep    ${minSleep}
    Wait Until Keyword Succeeds     ${iMax}     2s     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text    22   06   4  CIBC
    sleep    ${minSleep}

Enter Username
    [Documentation]    Enter Username
    [Arguments]    ${Excalibur_Username}
    clear_field             06   53   10
    excalibur_set_text      06   53   ${Excalibur_Username}           # enter text on excalibur

Enter Password
    [Documentation]    Enter Password
    [Arguments]    ${Excalibur_Password}
    clear_field             07   53   10
    excalibur_set_text      07   53   ${Excalibur_Password}

Validate MAIN MENU Screen
    [Documentation]    This Keyword is use to validate MAIN MENU on Excalibur Screen.
    Wait Until Keyword Succeeds     ${TenSecSleep}     2s     Custom Keyword for Excalibur to Capture & Compare Text with Actual Text    1    33    15    IBM i Main Menu

Verify if Error Screen is displayed while generating ticket
    ${text}    Fetch text from Excalibur Screen    01    28    24
    ${Status}    Run keyword and Return Status    BuiltIn.Should be equal as strings    ${text}    Display Program Messages
    [Return]    ${Status}

Fetch text from Excalibur Screen
    [Arguments]    ${Start_row}    ${start_col}    ${length}
    ${text}    fetch_text_from_excalibur    ${Start_row}    ${start_col}    ${length}
    [Return]    ${text}