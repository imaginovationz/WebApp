*** Settings ***
Resource    ../../Configuration/URLs_Links_SetUp.robot

*** Keywords ***

Custom Mouse Over
    [Arguments]    ${xpath}
    Wait Until Element Is Visible   ${xpath}   ${iMax}
    Mouse Over   ${xpath}

Custom Input Text
    [Arguments]    ${xpath}    ${value}
    Wait Until Element Is Visible		${xpath}        ${iMax}
    Wait Until Keyword Succeeds     ${iMax}   ${Retry}      Input Text      ${xpath}    ${value}

Custom Click Element
    [Arguments]    ${xpath}
    Wait Until Element Is Visible		${xpath}        ${iMax}
    Wait Until Keyword Succeeds     ${iMax}   ${Retry}      Click Element      ${xpath}

Scroll To Element
    [Arguments]    ${xpath}
    Wait Until Element Is Visible		${xpath}        ${iMax}
    Sleep    ${OneSecSleep}
    Wait Until Keyword Succeeds     ${iMax}   ${Retry}      Scroll Element Into View      ${xpath}
    Sleep    ${OneSecSleep}
    
Scroll to an element
    [arguments]    ${xpath}
    ${x_cordinate}=        Get Horizontal Position  ${xpath}
    ${y_cordinate}=        Get Vertical Position    ${xpath}
    Execute Javascript  window.scrollTo(${x_cordinate}, ${y_cordinate})

Generate Screenshot Name
    ${curr_date}    Get Current Date    result_format=datetime
    ${op_folder}   Set Variable     ${EXECDIR}\\Reports\\Robot_Test_Report\\Screenshots\\${TEST_NAME}
    Create Directory    ${op_folder}
    ${TakeSS_Name} =   Set Variable  ${op_folder}\\${TEST_NAME}_${curr_date.month}_${curr_date.day}_${curr_date.hour}_${curr_date.minute}_${curr_date.second}
    ${SS_Name} =   Set Variable  ${op_folder}\\${TEST_NAME}_${curr_date.month}_${curr_date.day}_${curr_date.hour}_${curr_date.minute}_${curr_date.second}.png
    Sleep    ${minSleep}
    Set Test Variable    ${SS_Name}
    Set Test Variable    ${TakeSS_Name}

Custom Capture Page Screenshot
    [Arguments]    ${dummy_text_verify}=default
    Generate Screenshot Name
    Capture Page Screenshot   ${SS_Name}

Custom Take Screenshot
    Generate Screenshot Name
    Take Screenshot   ${TakeSS_Name}

Custom Select Value From Dropdown
    [Arguments]    ${xpath}    ${value}
    Wait Until Element Is Visible        ${xpath}        ${iMax}
    Wait Until Keyword Succeeds     ${iMax}   ${Retry}      Select From List By Label		${xpath}    ${value}

Custom Double Click Element
    [Documentation]    Verify if element is visible before Clicking.
    [Arguments]    ${xpath}
    Wait Until Element Is Visible   ${xpath}   ${iMax}
    Wait Until Keyword Succeeds     ${iMax}   ${Retry}      Double Click Element   ${xpath}

Verify User is able to navigate up on the screen
    [Documentation]  Verify User is able to navigate up on the screen 
    Scroll To Element   	${Navigate_Up}
    sleep     ${BelowOneSecSleep}
      
Click on Applicant dropdown arrow
    [Documentation]  Click on Applicant dropdown arrow
    Custom Click Element   ${Applicant_Dropdown}
    sleep     0.${OneSecSleep}

Select Applicant from Applicant dropdown list
    [Documentation]  Click on Applicant dropdown arrow
    [Arguments]   ${Applicant_Name}
    ${ApplicantName}    Replace String      ${Applicatnt_Name_R}    (Replace_With_Run_Time_Variable)    ${Applicant_Name}
    Custom Click Element       ${ApplicantName}
    sleep     ${BelowOneSecSleep}
    
Verify User is able to navigate down on the screen
    [Documentation]  Verify User is able to navigate down on the screen 
    Scroll To Element       ${Navigate_Down}
    sleep     ${BelowOneSecSleep}

Clear and Input Requested Mortgage Amount
    [Documentation]    Remove the values in the Requested Mortgage Amount and Input a new Value
    [Arguments]    ${xpath}       ${Value}
    Wait Until Element is Visible    ${xpath}
    Press Keys     ${xpath}     CTRL+A+DELETE
    Repeat Keyword  10 times  press keys    ${xpath}    BACKSPACE
    press keys    ${xpath}    ${Value}

Clear and Input Charge Amount
    [Documentation]    Remove the values in the Charge Amount and Input a new Value
    [Arguments]    ${xpath}       ${Value}
    Wait Until Element is Visible    ${xpath}
    Press Keys     ${xpath}     CTRL+A+DELETE
    Repeat Keyword  10 times  press keys    ${xpath}    BACKSPACE
    press keys    ${xpath}    ${Value}

Custom Input Date in Text Field
    [Arguments]      ${xpath}    ${value}
    Wait Until Page Contains Element    ${xpath}    ${iMax}
    Press Keys     ${xpath}     CTRL+A+DELETE
    @{list}     Split String To Characters    ${value}
    FOR    ${item}    IN    @{list}
            press keys     ${xpath}    ${item}
    END

Custom Click and Input text in Input TextBox
    [Documentation]    Enter text in the input textbox
    [Arguments]    ${xpath}    ${value}
    Wait Until Element Is Enabled		${xpath}        ${iMax}
    Wait Until Keyword Succeeds     ${iMax}   ${Retry}      Double Click Element   ${xpath}
    sleep    ${minSleep}
    Press Keys     ${xpath}     CTRL+A+DELETE
    Run keyword If    "${value}" != "None"   Wait Until Keyword Succeeds     ${iMax}   ${Retry}      Input Text		${xpath}     ${value}


Read values and Set suite variables for Pause and Resume
    [Arguments]    ${testname}=default
    #Reading checkpoints from the output excel
    ${CRMCheckpoint}  Read Test output Data Sheet    ${testname}    L
    Set Test Variable    ${CRMCheckpoint}    ${CRMCheckpoint}
    ${MMTGCheckpoint}  Read Test output Data Sheet    ${testname}    M
    Set Test Variable    ${MMTGCheckpoint}    ${MMTGCheckpoint}    
    ${LCMSCheckpoint}  Read Test output Data Sheet    ${testname}    N
    Set Test Variable    ${LCMSCheckpoint}    ${LCMSCheckpoint}
    ${DMCheckpoint}  Read Test output Data Sheet    ${testname}    O
    Set Test Variable    ${DMCheckpoint}    ${DMCheckpoint}
    ${DDGSCheckpoint}  Read Test output Data Sheet    ${testname}    P
    Set Test Variable    ${DDGSCheckpoint}    ${DDGSCheckpoint}
    ${ClassCheckpoint}  Read Test output Data Sheet    ${testname}    Q
    Set Test Variable    ${ClassCheckpoint}    ${ClassCheckpoint}
    ${ExcaliburCheckpoint}  Read Test output Data Sheet    ${testname}    R
    Set Test Variable    ${ExcaliburCheckpoint}    ${ExcaliburCheckpoint}
    ${ECMCheckPoint}    Read Test output Data Sheet    ${testname}    S
    Set Test Variable    ${ECMCheckPoint}    ${ECMCheckPoint}
    #Reading application specific numbers from the output file
    ${CRMNumber}  Read Test output Data Sheet    ${testname}    E
    Set Test Variable    ${CRMNumber}    ${CRMNumber}
    ${CIBC_Num}   Read Test output Data Sheet    ${testname}    F
    Set Test Variable    ${CIBC_Num}    ${CIBC_Num}
    Set test variable    ${Deal_Num}    ${CIBC_Num}
    Set test variable    ${Deal_Number}    ${CIBC_Num}
    ${mmtg_class_number_DN}  Read Test output Data Sheet    ${testname}    G
    Set Test Variable    ${mmtg_class_number_DN}    ${mmtg_class_number_DN}
    ${mmtg_hpp_plc_class_number_DN}  Read Test output Data Sheet    ${testname}    H
    Set Test Variable    ${mmtg_hpp_plc_class_number_DN}    ${mmtg_hpp_plc_class_number_DN}
    ${mmtg_hpp_mtg_class_number_DN}  Read Test output Data Sheet    ${testname}    I
    Set Test Variable    ${mmtg_hpp_mtg_class_number_DN}    ${mmtg_hpp_mtg_class_number_DN}
    ${Mortgage_Service_Num}  Read Test output Data Sheet    ${testname}    J
    Set Test Variable    ${Mortgage_Service_Num}    ${Mortgage_Service_Num}
	Set Test Variable    ${Product_Deal_CLASS_Number}    ${mmtg_class_number_DN}
    Set Test Variable    ${Product_Deal_CLASS_Number_HPPPLC}    ${mmtg_class_number_DN}
    Log    ${CRMCheckpoint}
    Log    ${MMTGCheckpoint}
    Log    ${LCMSCheckpoint}
    Log    ${DMCheckpoint}
    Log    ${DDGSCheckpoint}
    Log    ${ClassCheckpoint}
    Log    ${ExcaliburCheckpoint}
    Log    ${CRMNumber}
    Log    ${CIBC_Num}
    Log    ${mmtg_class_number_DN}
    Log    ${mmtg_hpp_plc_class_number_DN}
    Log    ${mmtg_hpp_mtg_class_number_DN}
    Log    ${Mortgage_Service_Num}



Click if button exist
    [Documentation]    It is for clicking OK on the unexpected occurance of warning message in Creditor Insurance
    [Arguments]    ${xpath}
    ${status}=    Run Keyword and Return Status    Element should be visible    ${xpath}
    Run Keyword If   '${status}'=='True'
    ...    Custom Click Element     ${xpath}

Get Month number by Month name
    [Arguments]    ${MonthDate}
    ${a}     Set Variable     ${MonthDate}
    ${dict1}     Create Dictionary     JAN=01     FEB=02     MAR=03     APR=04     MAY=05     JUN=06     JUL=07     AUG=08   SEP=09   OCT=10   NOV=11   DEC=12
    ${month}     Fetch From Left    ${a}     /
    ${month_no}     Get From Dictionary     ${dict1}     ${month}
    ${final}     Replace String     ${a}     ${month}     ${month_no}
    [Return]     ${final}

Verify Radio Button second approach is Selected
    [Documentation]    Verifies radio button group group_name is set to value
    [Arguments]    ${group_name}    ${value}
    ${RadioButton_selected}=  Run Keyword and return status   Radio Button Should Be Set To    ${group_name}    ${value}
    Run Keyword If   '${RadioButton_selected}'=='True'    Log  Radio Button for given GroupName:${group_name} and Value:${value} is selected
    ...  ELSE    Log      Radio Button for given GroupName:${group_name} and Value:${value} is NOT selected

Custom Select Value From UnorderList Dropdown
    [Arguments]      ${value}
    ${Value_Dropdown}    Replace String    ${ValueDropDown_R}    (Replace_With_Run_Time_Variable)    ${value}
    Wait Until Element Is Visible		${Value_Dropdown}      ${TenSecSleep}
    Custom Click Element		${Value_Dropdown}

Change Date Format
    [Arguments]    ${Appraisal_Date}
    ${new_date_format}=    Replace String    ${Appraisal_Date}    -    /
    @{splited_date}=    Split String    ${new_date_format}    /
    ${new_date_format}    set variable    ${splited_date}[1]/${splited_date}[0]/${splited_date}[2]
    [return]    ${new_date_format}

Check if Element is disabled
    [Documentation]    Verify is the element is disabled
    [Arguments]    ${xpath}    ${name}
    ${element_status}=    Run Keyword and return status    Element Should be Disabled    ${xpath}
    Run Keyword If    '${element_status}'=='True'    Log    Given ${name} XPATH=${xpath} is disabled
    ...  ELSE        Fail    Given ${name} XPATH=${xpath} is disabled

Switch to Current Active Window
    [Documentation]    It will switch to current active window
    @{window_handles}    SeleniumLibrary.Get Window Handles
    Switch Window    ${window_handles}[-1]
    Maximize Browser Window
    Unselect Frame

Change Date Format to MMMDDYYYY
    [Arguments]    ${DFR}
    ${a}   set variable      ${DFR}
     ${c_month}     Fetch From Left    ${a}     /
     ${c_month} =   Evaluate    "${c_month}".title()
     ${c_month_num}   Set Variable    ${c_month}       
     ${month_lenght}   Get length    ${c_month}
     ${c_month1}=    Run keyword if    ${month_lenght} < 3       Get Month name by Month number    ${c_month}
     ${c_month1}   Run keyword if    ${month_lenght} < 3       Evaluate    "${c_month1}".title()
     ${c_month}   Convert To Upper Case    ${c_month1}
     ${c_year}     Fetch From Right    ${a}     /
     ${c_date} =    Get Regexp Matches     ${a}    /(..)/    1
     ${c_date}   set variable     ${c_date}[0]
     ${c_date1}    Run keyword if   ${c_date}[0] == 0    Remove String    ${c_date}     0
     Set Test Variable  ${Date_MMMDDYYYY}      ${c_month}/${c_date}/${c_year} 
     Set Test Variable  ${Date_YYYYMMDD}      ${c_year}${c_month_num}${c_date}
     [Return]      ${Date_MMMDDYYYY}  
     
      