*** Settings ***
Documentation     WARNING! This is a library File.
Library    XML
Library    String
Library    Collections
Library    SeleniumLibrary
Library    DateTime
Resource    Initialize.robot
Variables    ../ConfigFiles/CIBCDesktop/TestConfig.py
Library    CustomUtility.py
Resource    CustomKeywords.robot
Variables    Messages.py

*** Variables ***
${Case_search_button}    //custom-tool[@hotkey='Ctrl+Shift+Q']
${Case_number_field}    //input[@id='searchCriteriaSubform:caseInfoSection:txtCaseNumber']
${Search_submit_button}    //*[@id='searchCriteriaSubform:Search']
${Result_case_number_button}    //*[@id='searchsubform:searchListTable:0:lblCaseNumber']
${Case_tasks_tab}    //button[@title='Case Tasks']
${PMA_task_label}    //span[contains(text(),'Perform Manual Adjudication')][1]
${Open_task_button}    //button[@id='opentaskdetailsbtn']
${Complete_task_button}    //button[@id='completetaskbtn']
${PMA_Add_Conditions_radio_button}    //input[@id='taskCategory3']
${PMA_Conditions_dropdpown}    //select[@id='conditionsListDropdown']
${PMA_Add_Conditions_button}    //button[@id='addConditions']
${PMA_Submit_button}    //button[@id='submitButton']
${PMA_OK_button}    //button[@id='btnOk']
${VUC_task_label}    //span[contains(text(),'Verify U/W Conditions')][1]
${VUC_Generate_Conditional_Approval_Letter_button}    //button[@id='generateApprCondLetter']
${VUC_Complete_button}    //button[@id='completeButton']
${View_Documents_Generated}    //button[@title='View Document Generated']
${Underwriting_expand}    //a[@id='underwritingId__xc_']
${Conditional_Approval_Letter_link}    //a[text()='Conditional Approval Letter']
${Approval_Letter_link}    //a[text()='Approval Letter']
${Return_button}    //button[text()='Return']
${Case_close_button}    //button[@id='closeCaseBtn']
${Letter_generation_validation_msg}    //span[text()='']
${Scrubbing_task_label}    //span[contains(text(),'Scrubbing')][1]
${Scrubbing_Solicitor_firstname_search_box}    //input[@id='txtFirstName']
${Scrubbing_Solicitor_lastname_search_box}    //input[@id='txtLastName']
${Scrubbing_Solicitor_search_button}    //button[@id='btnSearch']
${Scrubbing_Solicitor_search_results_radiobutton_0}    //input[@id='j_id109:0:radio' and @name='solicitorinfo' and @type='radio'] | //input[@id='j_id103:0:radio' and @name='solicitorinfo' and @type='radio']
${Scrubbing_Solicitor_validate_button}    //button[@id='btnValidate']
${Scrubbing_Solicitor_successful_validation_msg}    //span[text()='Validated Solicitor successfully.']
${Scrubbing_Reason_Codes_label}    //*[@id='ReasonCodeLabel']
${Scrubbing_Submit_button}    //button[@id='btnSubmit']
${Scrubbing_Post_Submission_Yes_button}    //button[@id='btnYes']
${DG_task_label}    //span[contains(text(),'Document Generation')][1]
${DG_Issue_Approval_Package_button}    //button[@id='issueApprovalPackage'] | //button[@id='btnGenSolPkg']
${DG_Approval_Package_Successful_Generation_msg}    //*[contains(text(),'Approval Package generated successfully')] | //*[contains(text(),'Solicitor Package generated successfully and Loan Note Successfully saved.')]
${Advancing_expand}    //a[@id='assets6Id11__xc_'] | //a[contains(text(),'+ Advancing')]
${Approval_Package_link}    //a[text()='Approval Package Non Builder Non Transfer'] | //a[contains(text(),'HPP Solicitor Documents Package')]
${DG_Window_button}    //div[@id='mainIconList']/custom-tool[13]
${DG_Window_Document_dropdown}    //select[@id='documentDropdown']
${DG_Window_Mortgage_number_field}    //input[@id='j_id24']
${DG_Window_Fax_number_field}    //input[@id='j_id39']
${DG_Window_Generate_Document_button}    //button[text()='Generate Document']
${DG_Window_Cancel_button}    //button[@id='cancelBtn']
${DG_Window_Close_button}    //td[@id='closeImg_ms__id37']
${Advancing_Checklist}    //button[@title='Advancing Checklist']
${Advancing_Checklist_Save_button}    //button[@id='advChecklistSaveBtn']
${Advancing_Checklist_Successful_Save_msg}    //span[@id='messageOnSave' and text()='Your changes have been saved.']
${Advancing_Checklist_Return_button}    //button[@id='advChecklistReturnBtn']
${Pre_Advancing_task_label}    //span[contains(text(),'Pre Advancing')][1]
${Pre_Advancing_IBB_To_Solicitor_radio}    //input[@id='ibbToSolicitor' and @name='fundingPaymentmethod']
${Pre_Advancing_EFT_radio}    //input[@id='eft' and @name='fundingPaymentmethod']
${Pre_Advancing_Solicitor_Validate_button}    //button[@id='validateSol']
${Pre_Advancing_Successful_Solicitor_validation_msg}    //span[text()='Validated Solicitor successfully.']
${Pre_Advancing_Advancing_Section}    //a[text()='+ Advancing Section']
${PA_Advancing_Section_Payment_Method}    //select[@id='ViewRFF:netAdvanceFundingMethodList']
${PA_Advancing_Section_Submit_button}    //button[@id='btnSubmit']
${PFI_task_label}    //span[contains(text(),'Perform Fraud Investigation')][1]
${PFI_Pass_Radio_button}    //input[@name='passFailExceptionChoice' and @value='pass']
${Disbursement_task_label}    //span[contains(text(),"Disbursement")][1]
${Post_Funding_task_label}    //span[contains(text(),"Post Funding Activities")][1]
${Refresh_button}    //button[contains(text(),"Refresh")]
${Verify_Fully_Funded_Case_Status}    //span[contains(text(),"Fully Funded")]
${Receive_RFF_task_label}    //span[contains(text(),'Receive RFF')][1]
${Amount_of_RFF_Textbox}    //input[@id='rffAmount']
${Pre_Advancing_EFT_radio}    //input[@id='eft' and @name='fundingPaymentmethod']
${IBB_Preferred_Transit_Textbox}    //input[@id='ibbPrefTransit']
${Pre_Advancing_Get_Transit_Details}    //button[@id='btGetTransitDetails']
${Pre_Advancing_HPP_Advance_Textbox}    //input[contains(@id,'ViewRFF:j_id')]
${Pre_Advancing_Save_Button}    //button[@id='btnSave']
${Complete_task_yes_button}    //button[@id='completetaskbtn' and contains(text(),"Yes")]
${VUC_Defer_OK_Yes_button}    //button[@id='btnYes']
${Generate_Documents_label_for_HPP}    //button[@title='Generate Documents']
${Generate_Documents_Activity_Select_Document_Dropdown}    //select[@id="documentsListForGeneration"]
${Generate_Documents_Activity_Generate_Button}    //button[@id="generateDocument"]
${Cancel_button}    //button[@id="cancelButton"]
${PEV_task_label}    //span[contains(text(),"Perform Evidence Verification")][1]
${PMA_Generate_button}    //button[contains(text(),"Generate")]
${EL_task_label}    //span[contains(text(),"Evaluate Lender")][1]


&{Letter_Status_List}    Outstanding=O    Received=R    Requested=R    Validated=V    Deferred=D

*** Keywords ***

Open Browser for LCMS
    [Arguments]    ${env}    ${lang}
    Open Chrome Browser With Extension Blocked    ${LCMS_${env}_${lang}_URL}

Search and Open Case
    [Arguments]    ${Case_Number}
    
    # ${CaseSearch_ClassNumber}=    Get Substring    ${class_number}    6    16
    # Set Global Variable    ${CaseSearch_ClassNumber}
    # press keys    None    CTRL+SHIFT+S
    Select Frame    //*[@id='advisorDesktop']
    sleep    2
    Custom Click Element    ${Case_search_button}
    # Press Keys    None    CTRL+SHIFT+S
    Unselect Frame
    sleep    2
    Select Frame    //iframe[@id='advisorDesktop']
    Select Frame    //iframe[contains(@id,'desktop')]
    sleep    1
    Custom Click Element    ${Case_number_field}
    Custom Input Text    ${Case_number_field}    ${Case_Number}
    sleep    10
    Scroll To Element    ${Search_submit_button}
    Custom Click Element    ${Search_submit_button}
    Scroll To Element    ${Search_submit_button}
    Custom Capture Page Screenshot
    Custom Double Click Element    ${Result_case_number_button}
    Unselect Frame
    sleep    10
    Switch Window    title=Case Overview
    Maximize Browser Window
    Select Frame    //iframe[@id='bannerframe']
    sleep    3
    Wait Until Element Is Visible    //span[text()='Case #: ${Case_Number}']    10
    Custom Capture Page Screenshot
    Unselect Frame

Open and Complete PMA Task
    Select Frame    //iframe[@id='casetasksframe']
    ${PFI_check}    Run Keyword and Return Status    Element Should Be Visible    ${PFI_task_label}
    Run Keyword If    '${PFI_check}'=='True'    Run Keywords
    ...    Unselect Frame
    ...    AND    Complete PFI Task as Pass
    ...    AND    Select Frame    //iframe[@id='casetasksframe']
    Custom Capture Page Screenshot
    ${Evaluate_Lender_check}    Run Keyword and Return Status    Wait Until Element is visible     ${EL_task_label}    3
    Run Keyword If    '${Evaluate_Lender_check}'=='True'    Run Keywords
    ...    Unselect Frame
    ...    AND    Complete Evaluate Lender Task
    ...    AND    Select Frame    //iframe[@id='casetasksframe']
    Custom Click Element    ${PMA_task_label}
    Custom Click Enabled Element    ${Open_task_button}
    sleep    2
    Scroll To Element    ${PMA_Add_Conditions_radio_button}
    Custom Click Element    ${PMA_Add_Conditions_radio_button}
    # Custom Select Value From Dropdown    ${PMA_Conditions_dropdpown}    BDown: Cash
    # sleep    2
    # # Run Keyword And Continue On Failure    Custom Click Element    ${PMA_Generate_button}
    # Run Keyword And Continue On Failure    Scroll To Element    ${PMA_Add_Conditions_button}
    # Custom Click Enabled Element    ${PMA_Add_Conditions_button}
    # sleep    1
    Scroll To Element    ${PMA_Submit_button}
    Custom Click Element    ${PMA_Submit_button}
    sleep    6
    ${VUC_prompt_NO}    Run Keyword and Return Status    Wait Until Element is visible    //td[contains(text(),'Verify U/W Conditions')]    10
    Run Keyword If    '${VUC_prompt_NO}'=='True'   Run Keywords
    ...    Custom Capture Page Screenshot
    ...    AND    Custom Click Element    ${PMA_Submit_button}
    ...    AND    sleep    2
    Custom Click Element    ${PMA_OK_button} | ${VUC_Defer_OK_Yes_button}
    sleep    4
    Custom Capture Page Screenshot
    Custom Click Element    ${PMA_OK_button} | ${VUC_Defer_OK_Yes_button}
    sleep    2
    Custom Capture Page Screenshot
    Unselect Frame
    
Open and Complete VUC Task
    Select Frame    //*[@id='casetasksframe']
    Custom Capture Page Screenshot
    Custom Click Element    ${VUC_task_label}
    Custom Click Enabled Element    ${Open_task_button}
    sleep    2
    Scroll To Element    ${VUC_Generate_Conditional_Approval_Letter_button}
    Custom Click Element    ${VUC_Generate_Conditional_Approval_Letter_button}
    sleep    3
    Scroll To Element    ${VUC_Generate_Conditional_Approval_Letter_button}
    Custom Capture Page Screenshot
    # Element sShould Not Visible    ${Letter_generation_validation_msg}
    ${Verify_conditions_dropdown_count}    SeleniumLibrary.Get Element Count    //select[contains(@id,'verifyConditionsList:') and contains(@id,':conditionStatus')]
    Log    ${Verify_conditions_dropdown_count}
    Scroll To Element    //select[@id='verifyConditionsList:0:conditionStatus']
    FOR    ${i}    IN RANGE    0    ${Verify_conditions_dropdown_count}
        Custom Select Value From Dropdown    //select[@id='verifyConditionsList:${i}:conditionStatus']    Met
    END
    sleep    10
    Run Keyword And Continue On Failure    Scroll To Element    ${VUC_Complete_button}
    Custom Capture Page Screenshot
    sleep    3
    Custom Click Enabled Element    ${VUC_Complete_button}
    Custom Capture Page Screenshot
    sleep    5
    Custom Click Element    ${PMA_OK_button}
    sleep    4
    Custom Capture Page Screenshot
    Unselect Frame
    
Close Current Case
    Select frame    //iframe[@id='bannerframe']
    Custom Click Element    ${Case_close_button}
    sleep    3
    Switch Window    main
    
Open and Complete Scrubbing Task
    Select Frame    //*[@id='casetasksframe']
    Custom Capture Page Screenshot
    Custom Click Element    ${Scrubbing_task_label}
    Custom Click Enabled Element    ${Open_task_button}
    sleep    2
    Custom Input Text    ${Scrubbing_Solicitor_firstname_search_box}    ${Solicitor_name['SIT'][0]}
    Custom Input Text    ${Scrubbing_Solicitor_lastname_search_box}    ${Solicitor_name['SIT'][1]}
    Custom Click Element    ${Scrubbing_Solicitor_search_button}
    Custom Click Element    ${Scrubbing_Solicitor_search_results_radiobutton_0}
    Custom Click Enabled Element    ${Scrubbing_Solicitor_validate_button}
    sleep    2
    Wait Until Element Is Visible    ${Scrubbing_Solicitor_successful_validation_msg}    10
    Scroll To Element    ${Scrubbing_Reason_Codes_label}
    # ${Work_Items_count}    SeleniumLibrary.Get Element Count    //input[contains(@id,'itr:') and contains(@id,':j_id160') and contains(@name,'ppoRadio') and @type='radio']
    # FOR    ${i}    IN RANGE    0    ${Work_Items_count}
        # ${Enable_check}    Run Keyword and Return Status    Element Should Be Enabled    //input[@id='itr:${i}:j_id160' and contains(@name,'ppoRadio') and @type='radio']
        # Run Keyword If    '${Enable_check}'=='True'    Custom Click Element    //input[@id='itr:${i}:j_id160' and contains(@name,'ppoRadio') and @type='radio']
        # ...    ELSE    Run Keyword And Continue On Failure    Custom Click Element    //input[@id='itr:${i}:j_id162' and contains(@name,'ppoRadio') and @type='radio']
    # END
    ${Work_Items_count}    SeleniumLibrary.Get Element Count    //input[contains(@id,'itr:') and (contains(@id,':j_id170') or contains(@id,':j_id164')) and contains(@name,'ppoRadio') and @type='radio']
    FOR    ${i}    IN RANGE    0    ${Work_Items_count}
        ${Enable_check}    Run Keyword and Return Status    Element Should Be Enabled    //input[@id='itr:${i}:j_id170' and contains(@name,'ppoRadio') and @type='radio']
        Run Keyword If    '${Enable_check}'=='True'    Custom Click Element    //input[@id='itr:${i}:j_id170' and contains(@name,'ppoRadio') and @type='radio']
        ...    ELSE    Run Keyword And Continue On Failure    Custom Click Element    //input[@id='itr:${i}:j_id172' and contains(@name,'ppoRadio') and @type='radio']
    END
    Scroll To Element    ${Scrubbing_Submit_button}
    Custom Click Enabled Element    ${Scrubbing_Submit_button}
    sleep    3
    Custom Click Element    ${Scrubbing_Post_Submission_Yes_button}
    sleep    3
    Custom Capture Page Screenshot
    Custom Click Element    ${PMA_OK_button}
    sleep    4
    Custom Capture Page Screenshot
    Unselect Frame
    
Open and Complete Document Generation Task
    Select Frame    //*[@id='casetasksframe']
    Custom Capture Page Screenshot
    Custom Click Element    ${DG_task_label}
    Custom Click Enabled Element    ${Open_task_button}
    sleep    2
    Custom Click Element    ${DG_Issue_Approval_Package_button}
    sleep    5
    Element Should Be Visible    ${DG_Approval_Package_Successful_Generation_msg}
    ${Work_Items_count}    SeleniumLibrary.Get Element Count    //input[contains(@id,'itr:') and contains(@id,':j_id163') and contains(@name,'ppoRadio') and @type='radio']
    FOR    ${i}    IN RANGE    0    ${Work_Items_count}
        # ${Enable_check}    Run Keyword and Return Status    Element Should Be Enabled    //input[@id='itr:${i}:j_id160' and contains(@name,'ppoRadio') and @type='radio']
        Custom Click Enabled Element    //input[@id='itr:${i}:j_id163' and contains(@name,'ppoRadio') and @type='radio']
    END
    Custom Click Enabled Element    ${Scrubbing_Submit_button}
    sleep    3
    Custom Click Element    ${Scrubbing_Post_Submission_Yes_button}
    sleep    4
    Custom Click Element    ${PMA_OK_button}
    sleep    4
    Custom Capture Page Screenshot
    Unselect Frame
   
    
Waive all Checklist items except LOD Form 10782 in Advancing Checklist
    Select Frame    //*[@id='bannerframe']
    Custom Click Element    ${Refresh_button} 
    Unselect Frame   
    Custom Click Element    ${Advancing_Checklist}
    sleep    3
    # FOR    ${j}    IN RANGE    0    10
        # Select Frame    //*[@id='custProfileActivityIframe_activity_${j}']
        # ${frame_check}    Run Keyword and Return Status    Element Should Be Visible    ${Advancing_Checklist_Save_button}
        # Run Keyword If    '${frame_check}'=='True'    Exit For Loop
        # Unselect Frame
        # Select Frame    //*[@id='advisorDesktop']
        # Select Frame    //*[@id='cframe_ms__id32']
    # END
    Select Frame    //iframe[contains(@id,'advancing_checkList')]
    sleep    1
    ${Advancing_Checklist_dropdown_count}    SeleniumLibrary.Get Element Count    //select[contains(@id,'j_id60:') and contains(@id,':j_id67')]
    Log    ${Advancing_Checklist_dropdown_count}
    Scroll To Element    ${Advancing_Checklist_Save_button}
    FOR    ${i}    IN RANGE    0    ${Advancing_Checklist_dropdown_count}
        ${checklist_item}    Custom Extract Text    //select[@id='j_id60:${i}:j_id67']/parent::td/preceding-sibling::td/button
        Run Keyword If    "${checklist_item}"!="${Letter_of_Direction_Form_10782_LCMS_label_EN}"    Custom Select Value From Dropdown    //select[@id='j_id60:${i}:j_id67']    Waived
        ...    ELSE IF    "${checklist_item}"!="${Letter_of_Direction_Form_10782_LCMS_label_FR}"    Custom Select Value From Dropdown    //select[@id='j_id60:${i}:j_id67']    Waived
    END
    sleep    1
    Custom Click Element    ${Advancing_Checklist_Save_button}
    sleep    10
    Wait Until Element Is Visible    ${Advancing_Checklist_Successful_Save_msg}    5
    Custom Capture Page Screenshot
    Custom Click Element    ${Advancing_Checklist_Return_button}
    Unselect Frame
    
Fill up Pre Advancing Task details for MTG
    Select Frame    //*[@id='casetasksframe']
    Custom Capture Page Screenshot
    Custom Click Element    ${Pre_Advancing_task_label}
    Custom Click Enabled Element    ${Open_task_button}
    sleep    2
    ${Pre_Advancing_Work_Items_count}    SeleniumLibrary.Get Element Count    //input[contains(@id,'itr:') and contains(@id,':j_id163')]
    Log    ${Pre_Advancing_Work_Items_count}
    # Scroll To Element    ${Advancing_Checklist_Save_button}
    FOR    ${i}    IN RANGE    0    ${Pre_Advancing_Work_Items_count}
        ${Enable_check}    Run Keyword and Return Status    Element Should Be Enabled    //input[@id='itr:${i}:j_id163' and contains(@name,'ppoRadio') and @type='radio']
        Run Keyword If    '${Enable_check}'=='True'    Custom Click Element    //input[@id='itr:${i}:j_id163' and contains(@name,'ppoRadio') and @type='radio']
        ...    ELSE    Run Keyword And Continue On Failure    Custom Click Element    //input[@id='itr:${i}:j_id165' and contains(@name,'ppoRadio') and @type='radio']
    END
    Custom Click Element    ${Pre_Advancing_IBB_To_Solicitor_radio}
    sleep    2
    Scroll To Element    ${Pre_Advancing_Solicitor_Validate_button}
    Custom Click Element    ${Pre_Advancing_Solicitor_Validate_button}
    sleep    3
    Scroll To Element    ${Pre_Advancing_Solicitor_Validate_button}
    ${solicitor_selected}    Run Keyword and Return Status    Wait Until Element Is Visible    ${Pre_Advancing_Successful_Solicitor_validation_msg}    5
    Run Keyword If    '${solicitor_selected}'=='False'
    ...    Run Keywords
    ...    CustomFunction.Custom Click Element    //input[@id='trustAccDtls:0:radio']
    ...    AND    Custom Click Element    ${Pre_Advancing_Solicitor_Validate_button}
    ...    AND    sleep    3
    ...    AND    Scroll To Element    ${Pre_Advancing_Solicitor_Validate_button}
    ...    AND    Wait Until Element Is Visible    ${Pre_Advancing_Successful_Solicitor_validation_msg}    5
    Scroll To Element    ${Pre_Advancing_Advancing_Section}
    Custom Click Element    ${Pre_Advancing_Advancing_Section}
    sleep    4
    Custom Select Value From Dropdown    ${PA_Advancing_Section_Payment_Method}    IBB
    sleep    2
    Custom Click Enabled Element    ${PA_Advancing_Section_Submit_button}
    sleep    3
    Custom Click Enabled Element    ${Scrubbing_Post_Submission_Yes_button}
    sleep    5
    Custom Capture Page Screenshot
    Custom Click Enabled Element    ${PMA_OK_button}
    sleep    3
    Unselect Frame


Complete PFI Task as Pass
    Select Frame    //*[@id='casetasksframe']
    Custom Capture Page Screenshot
    Custom Click Element    ${PFI_task_label}
    Custom Click Enabled Element    ${PFI_Pass_Radio_button}
    Custom Click Enabled Element    ${Complete_task_button}
    sleep    2
    Custom Click Enabled Element    ${Complete_task_button}
    sleep    2
    Custom Capture Page Screenshot
    Unselect Frame


Open Advancing Checklist in LCMS
    Custom Click Element    //button[@title='Advancing Checklist']
    Custom Capture Page Screenshot
    
Check Letter of Direction document in Advancing Checklist
    [Arguments]    ${lang}
    Select Frame    //iframe[@id='advancing_checkList-0']
    Wait Until Element Is Visible    //button[text()="${Letter_of_Direction_Form_10782_LCMS_label_${lang}}"]    ${iMin}
    Custom Capture Focused Screenshot    //button[text()="${Letter_of_Direction_Form_10782_LCMS_label_${lang}}"]/parent::td/parent::tr
    Unselect Frame
    
Verify status of Letter of Direction in Advancing Checklist
    [Arguments]    ${Required_status}    ${lang}
    Select Frame    //iframe[@id='advancing_checkList-0']
    Custom Capture Page Screenshot
    ${Selected_option_UI}    Get Selected List Label    //button[text()="${Letter_of_Direction_Form_10782_LCMS_label_${lang}}"]/parent::td/following-sibling::td/select
    Run Keyword If    '${lang}'=='EN'    Should Be Equal As Strings    ${Selected_option_UI}    ${Required_status}
    ...    ELSE IF    '${lang}'=='FR'    Should Be Equal As Strings    ${Selected_option_UI}    ${Letter_Status_List}[${Required_status}]
    ...    ELSE    Fail    Language entered <${lang}> is not valid
    Unselect Frame

Close Advancing Checklist in LCMS
    Select Frame    //iframe[@id='advancing_checkList-0']
    Custom Click Element    ${Advancing_Checklist_Save_button}
    sleep    2
    Custom Click Element    ${Advancing_Checklist_Return_button}
    Custom Capture Page Screenshot

Update status of Letter of Direction in Advancing Checklist
    [Arguments]    ${Updated_status}    ${lang}
    Select Frame    //iframe[@id='advancing_checkList-0']
    Custom Capture Page Screenshot
    ${Selected_option_UI}    Get Selected List Label    //button[text()="${Letter_of_Direction_Form_10782_LCMS_label_${lang}}"]/parent::td/following-sibling::td/select
    Run Keyword If    '${lang}'=='EN'    Custom Select Value From Dropdown     //button[text()="${Letter_of_Direction_Form_10782_LCMS_label_${lang}}"]/parent::td/following-sibling::td/select    ${Updated_status}
    ...    ELSE IF    '${lang}'=='FR'    Custom Select Value From Dropdown     //button[text()="${Letter_of_Direction_Form_10782_LCMS_label_${lang}}"]/parent::td/following-sibling::td/select    ${Letter_Status_List}[${Updated_status}]
    ...    ELSE    Fail    Language entered <${lang}> is not valid
    Custom Capture Page Screenshot
    Unselect Frame


Validate Pre Advancing Task Completion
    [Aruguments]    ${check}
    Fill up Pre Advancing Task details for MTG
    







