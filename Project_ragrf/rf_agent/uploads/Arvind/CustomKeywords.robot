*** Settings ***
Documentation     WARNING! This is a library File.
Library    XML
Library    String
Library    Collections
Library    SeleniumLibrary
Library    DateTime
Resource    Initialize.robot
Variables    ../ConfigFiles/CIBCDesktop/TestConfig.py
Library    ../Utility/CustomUtility.py
Variables    ../../Data/CIBCDesktop/Messages.py
Library    ../Utility/MmtgPythonUtility.py
Library    OperatingSystem
Library    ../Utility/FileHandlingUtility.py


*** Variables ***
#${Filepath_UCCP}    ${CURDIR}/../CBConsentFile.pdf
${mMTG Login Screen_mMTG Login ScreenSCREENLogin FormFORMUser NameTEXTBOX_WEB_EN}    //*[@id="username"]
${mMTG Login Screen_mMTG Login ScreenSCREENLogin FormFORMPasswordTEXTBOX_WEB_EN}    //*[@id="pwd"]
${mMTG Login Screen_mMTG Login ScreenSCREENLoginBUTTON_WEB_EN}    //*[@id="welcome"]/div/form/div[4]/button

${Landing Page_Landing PageSCREENApplication MenusTREENODEDeal PipelineTREENODE_WEB_EN}    (//a[@class="dealpipeline nav-link"])[last()]
${Deal Pipeline_Deal PipelineSCREENEnter Legacy NumberFORMLegacy NumberTEXTBOX_WEB_EN}    //*[@id="search"]
${Deal Pipeline_Deal PipelineSCREENSearchBUTTON_WEB_EN}    //*[@id="searchButton"]//following::button[1]
${Deal Pipeline_Deal PipelineSCREENDeal PipelineSCREENApplication NumberHYPERLINK_WEB_EN}    (//a[contains(text(),'CIBC-')])[1]

${Credit Bureau Consent_Credit Bureau ConsentPOPUPManualBUTTON_WEB_EN}    //*[@id="liability_CBConcent_Manual_Applicable_id"]/label
${Liabilities_LiabilitiesSCREENLiabilitiesSCREENCredit Bureau ConsentHYPERLINK_WEB_EN}    //app-applicant-liabilities[@class="ng-star-inserted"]/div[1]/div[2]/div[1]/div/div
${Credit Bureau Consent_Credit Bureau ConsentUPLOADDocumentBUTTON_WEB_EN}    //input[@id="upload"]
${Credit Bureau Consent_Credit Bureau ConsentPOPUPSave Consent Detail}     //button[contains(text(), "Save Consent Details")] | //button[contains(text(), "Enregistrer les renseignements sur le consentement")]
${Liabilities_LiabilitiesSCREENCredit Consent AvailableBUTTON_WEB_EN}    //app-applicant-liabilities[@class="ng-star-inserted"]/div[1]/div[2]/div[1]/div/div/div[2]

${UnderwriterApproveConfirmationPopupYesButton}    //*[@id='ApproveConfirmation'] //button[contains(text(),'Yes')]
${UnderwriterDealSummaryApproveButton}    //button[contains(text(),'Approve')]
${DealSummarySubmitDealOKButton}    //div[@id = "submitMsgPopup"]//button[contains(text(), "OK") or contains(text(), "ok")]
${Product Selection Main Page_Product Selection Main PageSCREENValidated&SaveBUTTON_WEB_EN}    //div[contains(text(), "Validate & Save") or contains(text(), "Enregistrer")]
${Product Selection Main Page_Product Selection Main PageSCREENSaved ResultGROUPOKBUTTON_WEB_EN}    //div[@id = "submitMsgPopup"]//button[contains(text(), "OK") or contains(text(), "ok")]

${Deal Notes_Deal NotesSCREENSubmitBUTTON_WEB_EN}    //*[@class='btn PersBtnSele PersBtnDiv float-left ng-star-inserted']
${DealSummarySubmitDealOKButton}    //div[@id = "submitMsgPopup"]//button[contains(text(), "OK") or contains(text(), "ok")]
${Deal Notes_Deal NotesSCREENOKBUTTON_WEB_EN}     //div[@id = "savedMsgPopup"]//button[contains(text(), "OK") or contains(text(), "ok")]

${CRMNavBarSalesLabel}    //span[@id='navTabModuleButtonTextId']
${CRMNavBarSalesApplications}    //a[@id='nav_oppts' and @title='Applications']
${CRMNewApplicationLaunchECIFButton}    //*[@id="opportunity|NoRelationship|Form|cibc.opportunity.Button7.Button"]/span/a/span
${CRMNewApplicationRefreshPageButton}    //*[@id="opportunity|NoRelationship|Form|cibc.opportunity.Button6.Button"]/span/a/span




&{Status_List}    In-Progress=En cours    Submitted=Soumise    Approved=Autorisées    Declined=Refusées    Conditionally Approved=Approuvée conditionnellement    Cancelled=Annulé    Funded=Décaissement
&{Form_Status_List}    Outstanding=En cours    Completed=C    Pending=P

*** Keywords ***
Verify Widget Status
    [Documentation]    verifies widget status of given locator and parameterized status
    [Arguments]    ${widget_locator}    ${widget_Status}
    Run Keyword If    ("""${widget_Status}""" == """ENABLED""")
    ...    Element Should Be Enabled		${widget_locator}
    Run Keyword If    ("""${widget_Status}""" == """DISABLED""")
    ...    Element Should Be Disabled		${widget_locator}
    Run Keyword If    ("""${widget_Status}""" == """VISIBLE""")
    ...    Element Should Be Visible		${widget_locator}
    Run Keyword If    ("""${widget_Status}""" == """HIDDEN""")
    ...    Element Should Not Be Visible		${widget_locator}


Custom Capture Page Screenshot 
    [Documentation]    This keyword is used to capture screenshot and save in with current date time format   
    [Arguments]    ${dummy_text_verify}=default 
    ${curr_date}    Get Current Date    result_format=datetime
    ${op_folder}   CustomUtility.create_return_test_case_directory    ${test_NAME}
    #Create Directory    Logs/${op_folder}
    #Create Directory    Logs/${TEST NAME}
    #${curr_date}=   Create Log Directory and return Date for Screenshot
    ${SS_Name} =   Set Variable  Logs/${op_folder}/${op_folder}_${curr_date.hour}_${curr_date.minute}_${curr_date.second}_${curr_date.microsecond}.png
    Capture Page Screenshot   ${SS_Name}    # Logs/${TEST NAME}/${TEST NAME}_${curr_date.hour}_${curr_date.minute}_${curr_date.second}_${curr_date.microsecond}.png 
    # Log     Screenshot Disabled

Custom Click Element
    [Documentation]    Verify if element is visible before Clicking.
    [Arguments]    ${xpath}    ${elementlabel}=default  
    Wait Until Element Is Visible   ${xpath}   ${iMin}
    ${check}    Run Keyword and Return Status    Click Element   ${xpath}
    Run keyword If    '${check}'=='False'    Click Element   ${xpath} 
   
Verify Radio Button is Selected
    [Documentation]    Verify if given radio button element is selected or not.
    [Arguments]    ${radio_button_xpath}   
    sleep  ${minSleep}
    Wait Until Element Is Enabled   ${radio_button_xpath}   ${iMax}
    ${status}=   CustomUtility.xpath_checked    ${radio_button_xpath}
    Log   ${status}
    Run Keyword If   '${status}'=='True'    Log  Given XPATH=${radio_button_xpath} radio button is selected
    ...  ELSE       Fail    Given XPATH=${radio_button_xpath} radio button is NOT selected

Custom Input Text
    [Documentation]    Enter text in the input textbox
    [Arguments]    ${xpath}    ${value}         
    Wait Until Element Is Visible		${xpath}        ${iMax}
    Log    ${xpath}
    ${check}    Run Keyword and Return Status    Input Text		${xpath}     ${value}
    Run keyword If    '${check}'=='False'    Run Keywords
    ...    Click Element    ${xpath}
    ...    AND    Input Text		${xpath}     ${value}
    
Custom Select Value From Dropdown
    [Documentation]    Select value from the dropdown
    [Arguments]    ${xpath}    ${value}
    Wait Until Element Is Visible        ${xpath}        ${iMax}
    Log    ${xpath}
    Select From List By Label		${xpath}    ${value}

Custom Select Value From Dropdown by Value
    [Documentation]    Select value from the dropdown
    [Arguments]    ${xpath}    ${value}         
    Wait Until Element Is Visible        ${xpath}        ${iMax}
    Log    ${xpath}
    Select From List By Value	${xpath}    ${value}
    
Custom Select Value From Dropdown by Index
    [Documentation]    Select value from the dropdown
    [Arguments]    ${xpath}    ${index}         
    Wait Until Element Is Visible        ${xpath}        ${iMax}
    Log    ${xpath}
    Select From List By Index	${xpath}    ${index}

Custom Choose File
    [Documentation]    Upload file
    [Arguments]    ${xpath}    ${file_path}         
    Wait Until Element Is Enabled   ${xpath}    ${iMax}
    Log    ${xpath}
    Choose file		${xpath}    ${file_path}

Highlight Element
    [Arguments]    ${xpath}
    CustomUtility.Highlight_field    ${xpath}

Dehighlight Element
    [Arguments]    ${xpath}
    CustomUtility.Dehighlight_field    ${xpath}

Custom Capture Focused Screenshot
    [Arguments]    ${xpath}
    Wait Until Element Is Visible    ${xpath}    5
    # Scroll to Element    ${xpath}
    # Scroll Element Into View    ${xpath}
    Highlight Element    ${xpath}
    sleep    2
    Custom Capture Page Screenshot
    Dehighlight Element    ${xpath}

Custom Extract Text
    [Arguments]    ${xpath}
    Wait Until Element Is Visible    ${xpath}    10
    ${Extracted_text}    CustomUtility.fn_retrieve_value_from_xpath    ${xpath}
    [Return]    ${Extracted_text}

Custom Date Input
    # [Arguments]    ${xpath}    ${year}    ${month}    ${day}
    [Arguments]    ${xpath}    ${Date_Funds_Required}
    ${year}    Get Substring    ${Date_Funds_Required}    6    10
    ${month}    Get Substring    ${Date_Funds_Required}    0    2
    ${day}    Get Substring    ${Date_Funds_Required}    3    5
    # //*[@id='B1_ProdDet_MortgageDetails_DateFundsRequired']/div/div/input//following-sibling::div//span[@class='mydpicon icon-mydpcalendar']
    # //*[@id='B1_ProdDet_MortgageDetails_DateFundsRequired']
    # //*[@id='B1_ProdDet_MortgageDetails_DateFundsRequired']/div/div/following-sibling::div//button[@class='headerlabelbtn yearlabel']
    Custom Click Element    ${xpath}/div/div/input//following-sibling::div//span[@class='mydpicon icon-mydpcalendar']/parent::button
    ${is_datepicker_opened}    Run Keyword and Return Status    Wait Until Element Is Visible    ${xpath}/div/div/following-sibling::div//button[@class='headerlabelbtn yearlabel']    5
    Run Keyword If    '${is_datepicker_opened}'=='False'    Custom Click Element    ${xpath}/div/div/input//following-sibling::div//span[@class='mydpicon icon-mydpcalendar']/parent::button
    Custom Click Element    ${xpath}/div/div/following-sibling::div//button[@class='headerlabelbtn yearlabel']
    ${is_year_visible}    Run Keyword and Return Status    Custom Click Element    ${xpath}/div/div/following-sibling::div//table[contains(@class,'yeartable')]//div[contains(text(),'${year}')]
    Run Keyword If    '${is_year_visible}'=='False'    Run Keywords
    ...    Custom Click Element    ${xpath}/div/div/following-sibling::div//table[contains(@class,'yeartable')]//button[contains(@class,'yearchangebtn')]
    ...    AND    Custom Click Element    ${xpath}/div/div/following-sibling::div//table[contains(@class,'yeartable')]//div[contains(text(),'${year}')]
    Custom Click Element    ${xpath}/div/div/following-sibling::div//button[@class='headerlabelbtn monthlabel']
    Custom Click Element    (${xpath}/div/div/following-sibling::div//table[contains(@class,'monthtable')]//div)[${month}]
    ${day_check}=    Get Substring    ${day}    0    1
    ${day_check1}=    Get Substring    ${day}    1    2
    Run Keyword If    '${day_check}'=='0'    Custom Click Element    ${xpath}/div/div/following-sibling::div//table[contains(@class,'caltable')]//div[contains(@class,'currmonth')]/span[text()='${day_check1}']
    ...    ELSE    Custom Click Element    ${xpath}/div/div/following-sibling::div//table[contains(@class,'caltable')]//div[contains(@class,'currmonth')]/span[text()='${day}']
 
Custom Input Text to Input with Dropdown
    [Arguments]    ${xpath}    ${text}    ${count}=0
    # Scroll Element Into View    ${xpath}
    Custom Scroll To Element On ECIF    ${xpath}
    Wait Until Element Is Enabled    ${xpath}    5
    Custom Click Element    ${xpath}
    Custom Input Text    ${xpath}    ${text}
    Repeat Keyword    ${count} times    Press Keys    ${xpath}    ARROW_DOWN
    Press Keys    ${xpath}    ENTER

# Custom Scroll To Element On ECIF
    # [Arguments]    ${xpath}
    # Press Keys    //div[@id='main-content']//parent::section    END
    # Scroll to Element for ECIF    ${xpath}
    
Scroll To Element
    [Documentation]    Get x and y cordinate of xpath and navigate to that point. Need to implement this as Scroll Element Into View was not working.
    [Arguments]  ${locator}
    ${x_cordinate}=        Get Horizontal Position  ${locator}
    ${y_cordinate}=        Get Vertical Position    ${locator}
    # Log    x=${x_cordinate}, y=${y_cordinate}
    Execute Javascript  window.scrollTo(${x_cordinate}, ${y_cordinate}-90)

Custom Wait
    [Arguments]    ${timespan}=${iMin}
    sleep    ${timespan}

Custom Scroll To Element On ECIF
    [Arguments]    ${xpath}
    Press Keys    //div[@class='main-container']/parent::div    END
    Scroll to Element    ${xpath}

Custom Click Unexpected Button
    [Arguments]    ${xpath}
    CustomUtility.fn_click_unexpected_button    ${xpath}

Custom Mouse Over
    [Documentation]    performs mouse over operation for specified element
    [Arguments]    ${xpath}
    Wait Until Element Is Visible   ${xpath}   ${iMax}
    Mouse Over   ${xpath}




Open Browser for MMTG
    [Arguments]    ${env}
    Open Chrome Browser With Extension Blocked    ${mMTG_${env}_URL}
    # Run Keyword If    '${env}'=='SIT'    Login to MMTG in SIT  ${mMTG_SIT_User_Name}    ${Password}
    # ...    ELSE IF    '${env}'=='SIT2'    Login to MMTG in SIT2  ${mMTG_SIT2_User_Name}    ${Password}
    # ...    ELSE IF    '${env}'=='SIT3'    Login to MMTG in SIT3  ${mMTG_SIT3_User_Name}    ${Password}
    # ...    ELSE IF    '${env}'=='UAT'    Login to MMTG in UAT  ${mMTG_UAT_User_Name}    ${Password} 

Open Browser for IAT
    Open Chrome Browser With Extension Blocked    ${IAT_URL}    

Open Browser and Login to ECM
    [Arguments]    ${env}
    Open Chrome Browser With Extension Blocked    ${ECIF_${env}_URL}
    Wait Until Element Is Visible    //input[@id='react-select-10-input']    ${iMin}
    Custom Input Text to Input with Dropdown    //input[@id='react-select-10-input']    ENVOY - SIT (STS)
    Custom Input Text to Input with Dropdown    //input[@id='react-select-12-input']    P1
    Custom Input Text to Input with Dropdown    //input[@id='react-select-13-input']    ADP1
    Clear Element Text    //input[@id='userID']
    Custom Input Text    //input[@id='userID']    SM10083
    Press Keys    //input[@id='userID']    TAB
    sleep    2
    Custom Input Text to Input with Dropdown    //input[@id='react-select-17-input']    412
    Custom Scroll To Element On ECIF    //button[@type='submit']
    Custom Click Element    //button[@type='submit']
    sleep    2
    Wait Until Element Is Visible    //a[contains(normalize-space(),'Document Search')]    ${iMin}
    sleep    2
    
Open Browser for CRM
    [Arguments]    ${env}
    Open Chrome Browser With Extension Blocked    ${CRM_${env}_URL}

Login to MMTG
    [Arguments]    ${User_ID}    ${Password}=Btg#1234
    Custom Input Text    ${mMTG Login Screen_mMTG Login ScreenSCREENLogin FormFORMUser NameTEXTBOX_WEB_EN}    ${User_ID}
    Custom Input Text    ${mMTG Login Screen_mMTG Login ScreenSCREENLogin FormFORMPasswordTEXTBOX_WEB_EN}    ${Password}
    Custom Click Element    ${mMTG Login Screen_mMTG Login ScreenSCREENLoginBUTTON_WEB_EN}
    Change MMTG UI Language    ${Excel_Dict['Language']}

Search and Open the Deal
    [Arguments]    ${Deal_no}
    Custom Click Element		${Landing Page_Landing PageSCREENApplication MenusTREENODEDeal PipelineTREENODE_WEB_EN}
    Custom Input Text		${Deal Pipeline_Deal PipelineSCREENEnter Legacy NumberFORMLegacy NumberTEXTBOX_WEB_EN}     ${Deal_no}
    Custom Click Element		${Deal Pipeline_Deal PipelineSCREENSearchBUTTON_WEB_EN}     
    Custom Capture Page Screenshot
    Custom Click Element		//a[contains(text(),'${Deal_no}')]
    Wait Until Element Is Visible    //span[@id='deal_app_id' and text()='${Deal_no}']    ${iMin}
    Wait Until Element Is Visible    //div[@id='dealsummary_applicant_name'][1]    ${iMin}
    Custom Capture Page Screenshot
    ${Deal_borrower_count}    SeleniumLibrary.Get Element Count    //div[@id='dealsummary_applicant_name']
    Set Global Variable    ${Deal_borrower_count}

Check Deal Status
    [Arguments]    ${Required_Deal_Status}    ${lang}
    Wait Until Element Is Visible    //*[@id="deal_status_id"]    ${iMin}
    ${Deal_Status}=    SeleniumLibrary.Get Text    //*[@id="deal_status_id"]
    Run Keyword If    '${lang}'=='EN'    Should Be Equal As Strings    ${Deal_Status}    ${Required_Deal_Status}
    ...    ELSE IF    '${lang}'=='FR'    Should Be Equal As Strings    ${Deal_Status}    ${Status_List}[${Required_Deal_Status}]
    ...    ELSE    Fail    Language entered is not valid

Credit Bureau Consent
    #${Upload_File}=    Normalize Path    ${Filepath_UCCP}
    Custom Click Element    ${Credit Bureau Consent_Credit Bureau ConsentPOPUPManualBUTTON_WEB_EN}
    Custom Choose File       ${Credit Bureau Consent_Credit Bureau ConsentUPLOADDocumentBUTTON_WEB_EN}       ${CBConsentFilePath}
    sleep        5
    #${Customer_count}     Get length     ${Ecif_Customer_dict['Borrower_Code']}   
    FOR  ${c_count}     IN RANGE    ${Deal_borrower_count}
    Custom Click Element    //*[@id="liability_CBConsent_SIN_Yes_Id_${c_count}"]/label
    Custom Click Element    //*[@id="liability_CBConsent_EDR_Yes_Id_${c_count}"]/label
    Custom Click Element     //*[@id="liability_CBConsent_MM_No_Id_${c_count}"]/label
    Custom Capture Page Screenshot
    END
    sleep    2
    Scroll Element Into View    ${Credit Bureau Consent_Credit Bureau ConsentPOPUPSave Consent Detail}
    Custom Click Element		${Credit Bureau Consent_Credit Bureau ConsentPOPUPSave Consent Detail}
    sleep    2
    Wait Until Element Is Visible    //app-applicant-liabilities[@class="ng-star-inserted"]/div[1]/div[2]/div[1]/div/div/div[2]    20

CB Pull
    sleep    5
    Custom Click Element		${Liabilities_LiabilitiesSCREENCredit Consent AvailableBUTTON_WEB_EN}
    sleep    10

Custom Upload Credit Bureau Consent
    Custom Click Element		${Liabilities_LiabilitiesSCREENLiabilitiesSCREENCredit Bureau ConsentHYPERLINK_WEB_EN}
    ${CB_consent_form_loading_check}    Run Keyword and Return Status    Wait Until Element Is Visible    //h4[text()='Credit Bureau Consent']/following-sibling::button[@type='button' and @class='close'][1]    5
    ${Manual_radio_button_check}=    Run Keyword and Return Status    Wait Until Element Is Visible		${Credit Bureau Consent_Credit Bureau ConsentPOPUPManualBUTTON_WEB_EN}    20
    
    Run Keyword If    '${Manual_radio_button_check}'=='False' and '${CB_consent_form_loading_check}'=='True'    Run Keywords
    ...    Custom Click Element    //h4[text()='Credit Bureau Consent']/following-sibling::button[@type='button' and @class='close'][1]
    ...    AND    Custom Click Element		${Liabilities_LiabilitiesSCREENLiabilitiesSCREENCredit Bureau ConsentHYPERLINK_WEB_EN}
    ...    ELSE IF    '${Manual_radio_button_check}'=='False' and '${CB_consent_form_loading_check}'=='False'    Custom Click Element		${Liabilities_LiabilitiesSCREENLiabilitiesSCREENCredit Bureau ConsentHYPERLINK_WEB_EN}
    Credit Bureau Consent
    sleep        10

Custom Liabilities Panel Fill
    [Documentation]    Fills Liabilities Panel
    Custom Click Element    //*[@id='appName_dropDisp_id']
    ${applicant_count}=    SeleniumLibrary.Get Element Count    //*[contains(@id,'appName_dropList_id')]
    ${limit}=    Evaluate  ${applicant_count}+1
    Custom Click Element    //*[@id='appName_dropDisp_id']
    Custom Click Element    ${Liabilities_tab_xpath}
    sleep    1
    FOR    ${index}    IN RANGE    1    ${limit}
        Custom Click Element    //*[@id='appName_dropDisp_id']
        Custom Click Element    (//*[contains(@id,'appName_dropList_id')])[${index}]
        ${count}=    SeleniumLibrary.Get Element Count    //img[contains(@id,'liab_TabelHed_open_icon')]//preceding-sibling::img[not(contains(@src,'delete.png'))]
        ${count}=    Evaluate    ${count}+1
        Custom Complete Warning Liabilities    ${count}
    END

Custom Complete Warning Liabilities
    [Arguments]    ${count}
    FOR    ${record}    IN RANGE    1    ${count}
        Custom Click Element    (//img[contains(@id,'liab_TabelHed_open_icon')]//preceding-sibling::img[not(contains(@src,'delete.png'))])[${record}]
        Custom Select Value From Dropdown By Value    //select[@id='B1_CurrentLiablities_edited_SelectProperty']    0
        Custom Select Value From Dropdown By Value    //select[@id='B1_CurrentLiablities_edited_RankofCharge']    1
        Custom Date Input    //*[@id='B1_CurrentLiablities_edited_MaturityDate']    02/02/2024
        Custom Click Element    //div[contains(text(),'Validate & Save') or contains(text(),'Valider et Enregistrer')]
        ${complete_check}    Run Keyword and Return Status    Custom Click Element    //div[@id='submitMsgPopup']//button[contains(text(),'OK') or contains(text(),'accord')]
        Run Keyword If    '${complete_check}'=='False'    Run Keywords
        ...    Custom Date Input    //*[@id='B1_CurrentLiablities_edited_MaturityDate']    02/02/2024
        ...    AND    Custom Click Element    //div[contains(text(),'Validate & Save') or contains(text(),'Valider et Enregistrer')]
        ...    AND    Custom Click Element    //div[@id='submitMsgPopup']//button[contains(text(),'OK') or contains(text(),'accord')]
    END

Switch to Previous Browser
    @{Browser_ids}    Get Browser Ids
    Switch Browser    ${Browser_ids}[-1]

Close Current Browser
    Close Browser
            
Search API transaction for the Deal
    [Arguments]    ${Deal_no}    ${Portal}    ${env_field}    ${API_name}=DDGS10782MG
    Custom Select Value From Dropdown    //select[@id="applicationSelect"]    ${Portal}
    Custom Select Value From Dropdown By Value    //select[@id="environmentSelect"]    ${env_field.lower()}
    Custom Input Text    //input[@id="searchInput"]    ${Deal_no}
    Custom Capture Page Screenshot
    Custom Click Element    //button[@id="searchButton"]
    Wait Until Element Is Visible    //table[@id='dataTable']    ${iMin}
    Element Should be Visible    (//table[@id='dataTable']/tbody/tr/td[3][text()='${API_name}'])[1]
    Custom Capture Focused Screenshot    (//table[@id='dataTable']/tbody/tr/td[3][text()='${API_name}'])[1]
    Custom Click Element    (//table[@id='dataTable']/tbody/tr/td[3][text()='${API_name}'])[1]/following-sibling::td[1]/a
    
Custom Extract Payload Data
    Element Should be Visible    //h5[@id='dataModalLabel' and text()='Data Details']
    ${Extracted_JSON_String}    Custom Extract Text    //*[@id="modalContent"]
    &{Payload_dict}    CustomUtility.convert_dict_string_to_dict    ${Extracted_JSON_String}
    Press Keys    None    CTRL+F
    Press Keys    None    multipleAccountDetails
    Press keys    None    ENTER
    Custom Capture Page Screenshot
    Custom Click Element    //button[text()='Close']
    [Return]    ${Payload_dict} 
    
Capture and Validate LOD DDGS API Resquest
    Custom Capture Page Screenshot
    ${MMTG_DDGS_API_Request_data}    Custom Extract Payload Data
    CustomUtility.validate_Liability_data_in_API_request    ${Consolidated_Liab_dict}    ${MMTG_DDGS_API_Request_data}
    

Edit Application
    [Documentation]    Edit Application from Deal Summary panel
    CustomKeywords.Custom Click Element    //*[@id="sign"]
    sleep    1
    CustomKeywords.Custom Click Element    //*[@id="fab_copy_id"]
    sleep    7

Approve Deal in Underwriter
    Custom Click Element    ${UnderwriterDealSummaryApproveButton}
    Custom Click Element    ${UnderwriterApproveConfirmationPopupYesButton}
    Custom Click Element    ${DealSummarySubmitDealOKButton}

Update Appraisal Amnt and Date in Underwriter
    [Documentation]    Update Appraisal Amnt and Date in Underwriter
    Custom Click Element    //a[@id='productSelFA']
    ${Appraisal_Value}    Custom Extract Text    //div[@id='prod_selection_propertyvalue_id']
    Scroll To Element    //*[@id="B1_ProdDet_CA_Details_AppraisalAmount"]
    sleep    1
    Custom Date Input    //*[@id="B1_ProdDet_CA_Details_AppraisalDate"]    04/01/2025
    sleep    3
    Custom Click Element    //*[@id="B1_ProdDet_CA_Details_AppraisalAmount"]
    Press Keys    //*[@id="B1_ProdDet_CA_Details_AppraisalAmount"]    ${Appraisal_Value.replace('$','').replace(',','').replace('.00','')}
    Custom Click Element    ${Product Selection Main Page_Product Selection Main PageSCREENValidated&SaveBUTTON_WEB_EN}
    Custom Click Element    ${Product Selection Main Page_Product Selection Main PageSCREENSaved ResultGROUPOKBUTTON_WEB_EN}
    sleep    3

Submit the deal in Deal Summary
    Custom Click Element    //*[@id="dealSummaryFA"]
    Wait Until Element Is Visible    ${Deal Notes_Deal NotesSCREENSubmitBUTTON_WEB_EN}    ${iMin}
    Custom Capture Page Screenshot
    Scroll to Element    ${Deal Notes_Deal NotesSCREENSubmitBUTTON_WEB_EN}
    Custom Click Element    ${Deal Notes_Deal NotesSCREENSubmitBUTTON_WEB_EN}
    Wait Until Element Is Visible    ${DealSummarySubmitDealOKButton}    ${iMin}
    Custom Capture Page Screenshot
    Custom Click Element    ${DealSummarySubmitDealOKButton}  
    
Login to Underwriter and Update Appraisal details
    ${deal_no}    Custom Extract Text    //span[@id='deal_app_id']
    Open Browser for MMTG    SIT2
    Login to MMTG    uw01
    Search and Open the Deal    ${deal_no}
    Edit Application
    Update Appraisal Amnt and Date in Underwriter
    Submit the deal in Deal Summary
    Close Browser
    @{browser_ids}    Get Browser Ids
    Switch Browser    ${browser_ids}[0]
    Search and Open the Deal    ${deal_no}
    
Capture CLASS number from mMortgage Deal
    Custom Click Element    //a[@id='dNotifFA']
    Custom Click Element    (//*[@id='checkboxLabel']/span[1])[last()]
    Scroll To Element    (//*[@id='checkboxLabel']/span[1])[last()]
    ${notification}    Custom Extract Text    (//*[@id='mobileNotif'])[last()]
    Custom Capture Focused Screenshot    (//*[@id='mobileNotif'])[last()]
    ${numbers}    Customutility.fn_extract_class_number_from_notification    ${notification}
    Set Global Variable    \${CLASS_number}    ${numbers}
    Log    CLASS_number=${CLASS_number}

Submit Deal from mMortgage to LCMS
    [Arguments]    ${type}
    Submit the deal in Deal Summary
    Run Keyword If    '${type}'=='Initial'    Login to Underwriter and Update Appraisal details
    



Validate 10782 Form Generation Inline Message in Liabilities Panel
    [Arguments]    ${lang}=EN
    #Element Should Be Visible    //div[contains(normalize-space(),"${Liabilities_10782_Generation_Inline_Message_${lang}}")]/button[@class='close']/parent::div
    Element Should Be Visible    //div[contains(normalize-space(text()),"${Liabilities_10782_Generation_Inline_Message_${lang}}")]/button[@class='close']/parent::div
    Custom Capture Focused Screenshot    //div[contains(normalize-space(text()),"${Liabilities_10782_Generation_Inline_Message_${lang}}")]/button[@class='close']/parent::div/parent::div
    Custom Click Element    //div[contains(normalize-space(text()),"${Liabilities_10782_Generation_Inline_Message_${lang}}")]/button[@class='close']


Validate LOD Sign Message on Deal History Panel
    [Arguments]    ${Sign_message_mode}    ${lang}
    Run Keyword If    '${Sign_message_mode}'=='Esign Initiated'    Check Latest Message on Deal History Panel    ${DealHistory_Esign_Request_Initiated_Message_${lang}}
    ...    ELSE IF    '${Sign_message_mode}'=='Esign Completed'    Check Latest Message on Deal History Panel    ${DealHistory_Esign_Request_Completed_Message_${lang}}
    ...    ELSE IF    '${Sign_message_mode}'=='Upload Completed'    Check Latest Message on Deal History Panel    ${DealHistory_Manual_Upload_Completed_Message_${lang}}
    ...    ELSE    Fail    Passed Sign message parameter <${Sign_message_mode}> is INVALID.

Check Latest Message on Deal History Panel
    [Arguments]    ${Message}
    Wait Until Element is Visible    (//div[@class="content-box"])[last()]
    ${UI_Message}    Custom Extract Text    (//div[@class="content-box"])[last()]/div/div
    Should Be Equal As Strings    ${UI_Message.strip()}    ${Message} 

Validate LOD Form 10782 status in Conditions panel
    [Arguments]    ${lang}    ${status}
    Wait Until Element Is Visible    //label[contains(@class,"doc_label_primary") and text()="${Letter_of_Direction_Form_10782_label_${lang}}"]    ${iMin}
    Custom Capture Page Screenshot
    ${Status_UI}    Custom Extract Text    //label[contains(@class,"doc_label_primary") and text()="${Letter_of_Direction_Form_10782_label_${lang}}"]/following-sibling::label
    Run Keyword If    '${lang}'=='EN'    Should Be Equal As Strings    ${Status_UI.strip()}    (${status})
    Run Keyword If    '${lang}'=='FR'    Should Be Equal As Strings    ${Status_UI.strip()}    (${Form_Status_List}[${status}])

# Download the Letter from Document popup

Verify esign status for LOD Form 10782 in Borrower Tasks Panel
    [Arguments]    ${Required_status}    ${lang}
    Wait Until Element Is Visible    //div[@id='accordion']//div[contains(text(),"${Letter_of_Direction_Form_10782_BorrowerTasks_label_${lang}}")]    ${iMin}
    Custom Capture Page Screenshot
    ${Form_sign_status_on_UI}    Cuistom Extract Text    //div[@id='accordion']//div[contains(text(),"${Letter_of_Direction_Form_10782_BorrowerTasks_label_${lang}})]/following-sibling::div/span
    Run Keyword If    '${lang}'=='EN'    Should Be Equal As Strings    ${Status_on_UI.strip()}    Status : ${Required_status}
    ...    ELSE IF    '${lang}'=='FR'    Should Be Equal As Strings    ${Status_on_UI.strip()}    État : ${Form_Status_List}[${Required_status}]
    FOR    ${itr}    IN RANGE    2    ${Deal_borrower_count}+2
        ${borrower_sign_status}    Custom Extract Text    //div[@id='accordion']//div[contains(text(),"${Letter_of_Direction_Form_10782_BorrowerTasks_label_${lang}}")]/parent::a/following-sibling::div/div[${itr}]/div[4]
        Run Keyword If    '${lang}'=='EN'    Should Be Equal As Strings    ${borrower_sign_status.strip()}    ${Required_status}
        ...    ELSE IF    '${lang}'=='FR'    Should Be Equal As Strings    ${borrower_sign_status.strip()}    ${Form_Status_List}[${Required_status}]
    END


Validate LOD Form 10782 section in Documents Panel
    [Arguments]    ${lang}    ${Required}
    Wait Until Element is Visible    //label[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")]/parent::div/following-sibling::div/button[contains(@id,"fileUpload_label")]    ${iMin}
    Scroll To Element    //label[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")]/parent::div/parent::div
    Custom Capture Focused Screenshot    //label[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")]/parent::div/parent::div
    
Verify LOD Form Timestamp
    [Arguments]    ${lang}
    Log    Inactive
    # Custom Click Element    //label[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")]/parent::div/following-sibling::div/button[contains(@id,"fileUpload_label")]
    # Wait Until Element Is Visible    (//h4[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")])[last()]    ${iMin}
    # Element Should Be Visible    (//h4[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")])[last()]/parent::div/following-sibling::div[1]//span[@class='docPdf']
    # MmtgPythonUtility.verify_TimeStamp_and_Existence_of_UnsignedLODForm 

Close LOD Form 10782 popup in Documents panel
    Custom Click Element    (//h4[contains(text(),"${Letter_of_Direction_Form_10782_label_EN}") or contains(text(),"${Letter_of_Direction_Form_10782_label_FR}")])[last()]/following-sibling::button[@class='close']
    Custom Capture Page Screenshot

Initiate esign for LOD Form 10782
    Verify LOD Form Timestamp
    Wait Until Element Is Visible    //div[@class='sendEmailBtn']    ${iMin}
    Custom Capture Page Screenshot
    Custom Click Element    //div[@class='sendEmailBtn']
    Wait Until Element Is Visible    //p[@id='con_statu_hed_0']    ${iMin}
    Custom Capture Page Screenshot
    Custom Click Element    (//h4[contains(text(),"${Letter_of_Direction_Form_10782_label_EN}") or contains(text(),"${Letter_of_Direction_Form_10782_label_FR}")])[last()]/parent::div/following-sibling::div[2]/div[2]/button
    Wait Until Element Is Visible    //label[contains(text(),"${Letter_of_Direction_Form_10782_label_EN}") or contains(text(),"${Letter_of_Direction_Form_10782_label_FR}")]/parent::div/following-sibling::div/button[contains(@id,"fileUpload_label")]    ${iMin}

Upload file for LOD Form 10782 via Wet sign
    [Arguments]    ${lang}=EN
    Verify LOD Form Timestamp
    Custom Click Element    //input[@id='liability_CBConcent_Manual_Applicable_id-input']
    Custom Choose File    //button[@class='uploadBtn']/following-sibling::input    ${UploadFilePath}
    Custom Click Element    (//h4[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")])[last()]/parent::div/following-sibling::div[2]/div/button
    Wait Until Element Is Visible    (//h4[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")])[1]/parent::div/following-sibling::div[contains(text(),'Your Response Is Saved Successfully !')]    ${iMin}
    Custom Click Element    (//h4[contains(text(),"${Letter_of_Direction_Form_10782_label_${lang}}")])[1]/following-sibling::button
    
Select Applicant from Dropdown
    [Arguments]    ${appName}
    Custom Click Element    //p[@id='appName_dropDisp_id']
    Wait Until Element is Visible    //p[contains(@id,'appName_dropList_id')]    ${iMin}
    Custom Click Element    //p[contains(@id,'appName_dropList_id') and contains(text(),"${appName}")]

Borrower Checkbox Should be Unselected
    [Arguments]    ${name_label}
    ${check_status}    Run Keyword and Return Status    Checkbox Should Not Be Selected    //button[@class='drop-toggle btn flat']/following-sibling::div/label/span[text()='${name_label}']/preceding-sibling::input
    Run Keyword If    '${check_status}'=='False'    Unselect Checkbox    //button[@class='drop-toggle btn flat']/following-sibling::div/label/span[text()='${name_label}']/preceding-sibling::input

Select Borrower Checkbox
    [Arguments]    ${name_label}
    ${check_status}    Run Keyword and Return Status    Checkbox Should Be Selected    //button[@class='drop-toggle btn flat']/following-sibling::div/label/span[text()='${name_label}']/preceding-sibling::input
    Run Keyword If    '${check_status}'=='False'    Select Checkbox    //button[@class='drop-toggle btn flat']/following-sibling::div/label/span[text()='${name_label}']/preceding-sibling::input

Select Borrower for Liability ownership
    [Arguments]    ${appName}
    Custom Click Element    //button[@class='drop-toggle btn flat']
    ${borrowers}    SeleniumLibrary.Get Element Count    //button[@class='drop-toggle btn flat']/following-sibling::div/label
    FOR    ${itr}    IN RANGE    1    ${borrowers}+1
        ${cur_borrower_label}    Custom Extract Text    (//button[@class='drop-toggle btn flat']/following-sibling::div/label/span)[${itr}]
        ${match}=    Run Keyword And Return Status    Should Contain    ${cur_borrower_label}    ${appName}  
        #${match}=    Evaluate    '"%s" in "%s"' % (${appName}, ${cur_borrower_label})
        Run Keyword If    '${match}'=='True'    Select Borrower Checkbox    ${cur_borrower_label} 
        ...    ELSE    Borrower Checkbox Should be Unselected    ${cur_borrower_label}
    END
    Custom Click Element    //button[@class='drop-toggle btn flat']

Select Required Payout options
    [Arguments]    ${Payout_details}
    Run Keyword If    '${Payout_details['OP']}'=='PC'    Run Keywords
    ...    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_PayOut' or @id='B1_CurrentLiablities_edited_PayOut']    1
    ...    AND    Run Keyword If    '${Payout_details['SOF']}'=='FP'    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_SourceofFunds' or @id='B1_CurrentLiablities_edited_SourceofFunds']    1
    ...    AND    Run Keyword If    '${Payout_details['SOF']}'=='PA'    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_SourceofFunds' or @id='B1_CurrentLiablities_edited_SourceofFunds']    0
    Run keyword If    '${Payout_details['OP']}'=='LD'    Run Keywords
    ...    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_PayOut' or @id='B1_CurrentLiablities_edited_PayOut']    3
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_DecreaseLimitto' or @id='B1_CurrentLiablities_edited_DecreaseLimitto']    ${Payout_details['DLValue']}
     Run keyword If    '${Payout_details['OP']}'=='PDLD'    Run Keywords
    ...    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_PayOut' or @id='B1_CurrentLiablities_edited_PayOut']    2
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_DecreaseLimitto' or @id='B1_CurrentLiablities_edited_DecreaseLimitto']    ${Payout_details['DLValue']}
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_Paydown' or @id='B1_CurrentLiablities_edited_Paydown']    ${Payout_details['PDValue']}

Custom Add and Mark Liability for Payout
    [Arguments]    ${Liability_Data}    ${applicant_name}
    Custom Click Element    //img[contains(@src,'add_icon_grey.png')]/parent::div/parent::div | //span[@id='deal_liability_addAnotherLiable_button']
    Select Borrower for Liability ownership    ${applicant_name}
    Run Keyword If    '${Liability_Data['IsCIBCLiability']}'=='Y'    Scroll Element Into View    //div/label/span[@id='span_B1_CurrentLiablities_new_CIBCLiability']
    Run Keyword If    '${Liability_Data['IsCIBCLiability']}'=='Y'    Custom Click Element    //div/label/span[@id='span_B1_CurrentLiablities_new_CIBCLiability']
    Run Keyword If    '${Liability_Data['LiabilityType']}'=='PLC'    Run Keywords
    ...    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_LiabilityType']    10
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_Limit']    ${Liability_Data['LiabilityLimit']}
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_Balance']    ${Liability_Data['LiabilityBalance']}
    Run Keyword If    '${Liability_Data['LiabilityType']}'=='PL'    Run Keywords
    ...    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_LiabilityType']    3
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_Limit']    ${Liability_Data['LiabilityLimit']}
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_Balance']    ${Liability_Data['LiabilityBalance']}
    Run Keyword If    '${Liability_Data['LiabilityType']}'=='MTG'    Run Keywords
    ...    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_LiabilityType']    0
    ...    AND    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_SelectProperty']    0
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_Balance']    ${Liability_Data['LiabilityBalance']}
    ...    AND    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_RankofCharge']    1
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_MortgageAccountNumber']    ${Liability_Data['MANum']}
    ...    AND    Custom Date Input    //*[@id='B1_CurrentLiablities_new_MaturityDate']    10/24/2025
    Run Keyword If    '${Liability_Data['LiabilityType']}'=='CC'    Run Keywords
    ...    Custom Select Value from Dropdown By Value    //select[@id='B1_CurrentLiablities_new_LiabilityType']    2
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_Limit']    ${Liability_Data['LiabilityLimit']}
    ...    AND    Custom Input Text    //input[@id='B1_CurrentLiablities_new_Balance']    ${Liability_Data['LiabilityBalance']}
    Custom Capture Page Screenshot
    Select Required Payout options    ${Liability_Data['Payout']}
    Custom Capture Page Screenshot
    Custom Click Element    //*[@class='PersBtnDiv PersBtnSele']
    Custom Capture Page Screenshot
    # ${Save_popup_FR_check}    Run Keyword and Return Status    Wait Until
    Custom Click Unexpected Button    (//button[@class='btn btn-prospect-rev' and contains(text(),'OK')])[1]
    Custom Click Unexpected Button    (//button[@class='btn btn-prospect-rev' and contains(text(),"D'accord")])[1]
    Run Keyword If    '${Liability_Data['IsCIBCLiability']}'=='Y'    Validate 10782 Form Generation Inline Message in Liabilities Panel    ${lang}
    
    
Custom Mark Existing Liability for Payout
    [Arguments]    ${Liability_Data}    ${lang}
    ${Existing_liab_count}    SeleniumLibrary.Get Element Count    //img[contains(@id,'liab_TabelHed_open_icon_')]
    ${limit_index}    Evaluate    ${Existing_liab_count}-1
    FOR    ${liab_itr}    IN RANGE    0    ${Existing_liab_count}
        ${CV_Liab_check}    Run Keyword and Return Status    Element Should Be Visible    //img[contains(@id,'liab_TabelHed_open_icon_${liab_itr}')]/preceding-sibling::img[contains(@id,'liab_TabelHed_del_icon_')]
        Continue For Loop If    '${CV_Liab_check}'=='True'
        Custom Click Element    //img[contains(@id,'liab_TabelHed_open_icon_${liab_itr}')]
        ${current_LSN}    Custom Extract Text    //input[@id='B1_CurrentLiablities_edited_LiabilitySourceNumber']
        Continue For Loop If    '${current_LSN.strip()}'=='Does not exist'
        Exit For Loop If    '${current_LSN.strip()}'=='${Liability_Data['LSN']}'
        Run Keyword If    '${current_LSN.strip()}'!='${Liability_Data['LSN']}' and '${liab_itr}'=='${limit_index}'    Fail    No Liablity with LSN: <${Liability_Data['LSN']}> found.
    END
    Select Required Payout options    ${Liability_Data['Payout']}
    Custom Capture Page Screenshot
    Custom Click Element    //*[@class='PersBtnDiv PersBtnSele']
    Run Keyword If    '${lang}'=='EN'    Wait Until Element Is Visible    //button[@class='btn btn-prospect-rev' and text()='OK' or text()='ok']    ${iMin}
    Run Keyword If    '${lang}'=='FR'    Wait Until Element Is Visible    (//button[@class='btn btn-prospect-rev' and contains(text(),"D'accord")])[1]    ${iMin}
    Custom Capture Page Screenshot
    Custom Click Unexpected Button    //button[@class='btn btn-prospect-rev' and text()='OK' or text()='ok']
    Custom Click Unexpected Button    (//button[@class='btn btn-prospect-rev' and contains(text(),"D'accord")])[1]
    Validate 10782 Form Generation Inline Message in Liabilities Panel    ${lang}


Mark Liability for Payout
    [Arguments]    ${Borrower_Liability_Data_Details}    ${Borrower_label}    ${lang}
    ${Borrower_Liability_Data}=    Evaluate    json.loads('''${Borrower_Liability_Data_Details}''')    modules=json
    Select Applicant from Dropdown    ${Borrower_Liability_Data['ApplicantName']}
    ${Liablity_count}    Evaluate    len(${Borrower_Liability_Data['Liabilities']})
    FOR    ${liab_itr}    IN RANGE    ${Liablity_count}
        Run Keyword If    '${Borrower_Liability_Data['Liabilities'][${liab_itr}]['Origin']}'=='CV'    Custom Add and Mark Liability for Payout    ${Borrower_Liability_Data['Liabilities'][${liab_itr}]}     ${Borrower_Liability_Data['ApplicantName']}    ${lang}
        Run Keyword If    '${Borrower_Liability_Data['Liabilities'][${liab_itr}]['Origin']}'=='CB'    Custom Mark Existing Liability for Payout    ${Borrower_Liability_Data['Liabilities'][${liab_itr}]}    ${lang}
    END
    Press Keys    None    HOME
    Custom Capture Page Screenshot
    Press Keys    None    PAGE_DOWN
    Custom Capture Page Screenshot



# Mark CB Liability for Payout
    # [Arguments]    ${Liability_Data}
    # {'name':'AB', 'liab_data':[type:'CB', 'LSN':'XXXXXX', 'payout_op':'PC', 'PC_op':'FP/PA', 'LD_amount':'1000', PD_amount:'250'],
    # 'liab_data':['type':'CV', 'liab_type':'PLC', 'CIBC':'Y', 'limit_amount':'20000', 'payout_op':'PC', 'PC_op':'FP/PA', 'LD_amount':'1000', PD_amount:'250']}
    
    # ${liab_count}    SeleniumLibrary.Get Count    //div[contains(@id,'liab_TabelHed_name_') and contains(text(),'${Liability_Data['name']}')]/parent::div/parent::a/following::div
    # FOR    ${liab_itr}    IN RANGE    1    ${liab_count}+1
        # Custom Click Element    (//div[contains(@id,'liab_TabelHed_name_') and contains(text(),'${Liability_Data['name']}')]/parent::div/parent::a/following::div)[${liab_itr}]
        # ${LSN_UI}    Custom Extract Text     //input[@id='B1_CurrentLiablities_edited_LiabilitySourceNumber']
        # ${match}    Should Be Equal As Strings    ${Liability_Data['liab_data']['']}
    
    
    # END
    
# Update Liability for Regeneration



Open the deal records in ECM
    [Arguments]    ${deal_no}
    Custom Click Element    //a[contains(normalize-space(),'Document Search')]
    sleep    5
    Switch Window    title=Envoy
    Custom Select Value from Dropdown    //label[contains(normalize-space(),"Product Type:")]/following-sibling::select    Residential Mortgage
    Custom Click Element    (//input[@name='Residential Mortage'])[3]
    Custom Input Text    //input[@data-testid='mMortgageNo']    ${deal_no}
    Custom Capture Page Screenshot
    Custom Click Element    //button[text()='Search']
    Wait Until Element Is Visible    //label[text()='Document Filter']    ${iMin}
    Custom Capture Page Screenshot

Validate Letter of Direction Form 10782 is listed in ECM
    [Arguments]    ${Doc_Sign_Status}
    Element Should be Visible    (//table/tbody/tr/td[text()='10782MG'])[last()]
    Scroll To Element    (//table/tbody/tr/td[text()='10782MG'])[last()]
    Custom Click Element    (//table/tbody/tr/td[text()='10782MG'])[last()]/preceding-sibling::td[2]/span
    sleep    1
    Custom Capture Page Screenshot
    Custom Click Element    (//table/tbody/tr/td[text()='10782MG'])[last()]/preceding-sibling::td[1]
    sleep    5
    @{ECM_win_titles}    Get Window Titles
    Log    ${ECM_win_titles}
    sleep    5
    @{ECM_win_titles}    Get Window Titles
    Log    ${ECM_win_titles}
    @{ECM_win_handles}    Get Window Handles
    # Switch Window    title=Letter of Direction - Payment of CIBC Liabilities
    Switch Window    ${ECM_win_handles}[-1]
    sleep    5
    Custom Capture Page Screenshot
    Close Window
    Switch Window    title=Envoy
    
Open Applications Tab
    CustomKeywords.Custom Mouse Over    ${CRMNavBarSalesLabel}
    ${Application_label_check}    Run Keyword and Return Status    Wait Until Keyword Succeeds    3x    10s    CustomKeywords.Custom Click Element    ${CRMNavBarSalesApplications}
    Run Keyword If    '${Application_label_check}'=='False'    Run keywords
    ...    Custom Click Element    //a[@id='rightNavLink']
    ...    AND    Wait Until Keyword Succeeds    3x    10s    CustomKeywords.Custom Click Element    ${CRMNavBarSalesApplications}
    # CustomKeywords.Custom Click Element    ${CRMNavBarSalesApplications}
    Wait Until Element Is Visible      ${CRMApplicationPageNewButton}    ${iMax}
    CustomKeywords.Custom Mouse Over    //div[@class='navTabFiller']
    sleep    2
    
   
Open CRM Application
    [Arguments]    ${Deal_no}
    Select Frame    //iframe[@id='contentIFrame0']
    CustomKeywords.Custom Input Text    //input[@id='crmGrid_findCriteria']    ${Deal_no}
    Press Keys    //input[@id='crmGrid_findCriteria']    ENTER
    sleep    1
    Custom Click Element    //nobr[@title='${Deal_no}']/parent::td/preceding-sibling::td/nobr/a
    sleep    1
    Unselect Frame


Open the deal in CRM
    [Arguments]    ${deal_no}
    Open Applications Tab
    Open CRM Application    ${deal_no}
    
Update Borrower in CRM
    [Arguments]    ${Borrower_op}    ${Borrower_details}
    ${detail_dict}    CustomUtility.convert_dict_string_to_dict    ${Borrower_details}
    Run Keyword If    '${Borrower_op}'=='ADD BORROWER'    Add Borrower in CRM Application    ${detail_dict}
    ...    ELSE IF    '${Borrower_op}'=='REMOVE BORROWER'    Remove Borrower in CRM Application    ${detail_dict}
    ...    ELSE IF    '${Borrower_op}'=='CHANGE BORROWER'    Change Borrower in CRM Application    ${detail_dict}
    ...    ELSE IF    '${Borrower_op}'=='SWAP BORROWER ROLES'    Swap Borrower roles in CRM Application    ${detail_dict}
    


Add Borrower in CRM Application
    [Arguments]    ${Borrower_details}
    # {'add_name':'', 'type':'OC', 'CIF':''}
    ECIF Login
    CustomKeywords.Custom Input Text    //input[@id='ecifNumber']    ${Borrower_details}['CIF']
    Custom Click Element    //button[@value='Search']
    Wait Until Element Is Visible    //label[text()='CIF / ECIF No.']/following-sibling::div/span    ${iMin}
    Add Client Info to CRM new UI
    Click Refresh Button
    Select Relationship to Primary    ${Borrower_details}['type']    ${Deal_borrower_count}
    Select Applicant Type in CRM    ${Borrower_details}['type']    ${Deal_borrower_count}
    
Remove Borrower in CRM Application
    [Arguments]    ${Borrower_details}
    # {'remove_name':'', 'type':''}
    @{name_split}    Split String    ${Borrower_details}['remove_name']
    Select Frame    //iframe[@id='contentIFrame1']
    Custom Click Element    (//span[@title="${name_split[1].upper()}, ${name_split[0].upper()}"])[1]
    Press Keys    None    BACKSPACE
    Unselect Frame
    Click Save Button in CRM

Change Borrower in CRM Application
    [Arguments]    ${Borrower_details}
    Remove Borrower in CRM Application    ${Borrower_details}
    Add Borrower in CRM Application    ${Borrower_details}

# Swap Borrower roles in CRM Application
    # [Arguments]    ${Borrower_details}
    # {}


ECIF Login
    [Documentation]    Login into ECIF through CRM
    sleep    10
    Wait Until Element Is Visible      ${CRMNewApplicationLaunchECIFButton}    ${iMax}
    Wait Until Keyword Succeeds    3x    10s    CustomKeywords.Custom Click Element    ${CRMNewApplicationLaunchECIFButton}
    Switch Window    title=ECIF UI Launcher
    ${dropdown_check}    Run Keyword and Return Status    Custom Click Element    //*[@name='transitID']/preceding-sibling::div/div
    Run Keyword If    '${dropdown_check}'=='True'    Run Keywords
    ...    Press Keys    None    2
    ...    AND    Press Keys    None    ENTER
    ...    ELSE    Custom Input Text    //input[@name='transitID']    2   
    sleep    2
    Switch Window    title=StandAlone
    sleep    2
    CustomKeywords.Custom Click Element    //a[contains(text(), 'Client Search')]
    sleep    2


Add Client Info to CRM new UI
    [Documentation]    Adds Client Information to CRM
    @{browser_ids}    Get Browser Ids		
    FOR    ${id}    IN    @{browser_ids}
        @{window_titles}=    Get Window Titles    browser=${id}
        Log    Browser ${id} has these windows: ${window_titles}	
    END
    Wait until Element Is Visible    //div[text()='Client Details']    10
    Custom Scroll To Element On ECIF    //a[text()='Add Client Info to CRM']
    Custom Click Element    //a[text()='Add Client Info to CRM']
    ${WindowHandles}=    Get Window Handles
    log    ${WindowHandles} 
    Switch Window    ${WindowHandles}[-1]   
    # Custom Capture Page Screenshot
    close window
    # Switch Window    ${WindowHandles}[1]
    # close window
    Switch Window    ${WindowHandles}[0]     #switches to main window
    sleep    10    

Click Refresh Button
    sleep    5
    Wait Until Element Is Visible      ${CRMNewApplicationRefreshPageButton}    ${iMax}
    # CustomKeywords.Custom Click Element    ${CRMNewApplicationLaunchECIFButton}
    Wait Until Keyword Succeeds    3x    10s    CustomKeywords.Custom Click Element    ${CRMNewApplicationRefreshPageButton}

Select Relationship to Primary
    [Arguments]    ${borrower_code}    ${index}
    Custom Select Frame    //*[@id='contentIFrame1']
    sleep    5
    ${b_code}    Get Substring    ${borrower_code}    0    2
    ${Applicant_Number}    Evaluate    ${index}+1
    Run Keyword If    '${b_code}'=='SP'    Custom Select Value From Dropdown    //select[@id='cibc_relationshiptoprimaryapplicant${Applicant_Number}_i']    Spouse
    Run Keyword If    '${b_code}'=='SG'    Custom Select Value From Dropdown    //select[@id='cibc_relationshiptoprimaryapplicant${Applicant_Number}_i']    Spouse
    Run Keyword If    '${b_code}'=='SC'    Custom Select Value From Dropdown    //select[@id='cibc_relationshiptoprimaryapplicant${Applicant_Number}_i']    Spouse
    Run Keyword If    '${b_code}'=='CG'    Custom Select Value From Dropdown    //select[@id='cibc_relationshiptoprimaryapplicant${Applicant_Number}_i']    Other
    Run Keyword If    '${b_code}'=='OC'    Custom Select Value From Dropdown    //select[@id='cibc_relationshiptoprimaryapplicant${Applicant_Number}_i']    Other
    Unselect Frame   

Select Applicant Type in CRM
    [Arguments]    ${borrower_code}    ${index}
    Custom Select Frame    //*[@id='contentIFrame1']
    sleep    5
    ${b_code}    Get Substring    ${borrower_code}    0    2
    ${Applicant_Number}    Evaluate    ${index}+1
    
    Run Keyword If    '${b_code}'=='SG'    Select Applicant Type    ${Applicant_Number}    Guarantor
    Run Keyword If    '${b_code}'=='CG'    Select Applicant Type    ${Applicant_Number}    Guarantor
    Unselect Frame
    
Select Applicant Type
    [Arguments]    ${Applicant_Number}    ${App_Type}
    Custom Click Element    //*[@id="cibc_applicanttype${Applicant_Number}"]
    Custom Select Value From Dropdown    //select[@id='cibc_applicanttype${Applicant_Number}_i']    ${App_Type}

Submit Application in CRM
    Click Save Button in CRM
    Click Submit Button in CRM
    sleep    2
    # ${message}=    Handle Alert
    Run Keyword and Ignore Error    Handle Alert
    # Click Save Button in CRM
    Custom Capture Page Screenshot
    Unselect Frame
    # Custom Select Frame    //*[@id='contentIFrame1']
    # Custom Select Frame    //*[contains(@id,'contentIFrame')][last()]
    ${submit_status}    Run Keyword and Return Status    Validate If Application Submitted Successfully to Mmtg
    Run Keyword If    '${submit_status}'=='False'    Run Keywords
    ...    Unselect Frame
    ...    AND    Click Save Button in CRM
    ...    AND    Click Submit Button in CRM
    ...    AND    Custom Capture Page Screenshot
    ...    AND    Validate If Application Submitted Successfully to Mmtg

Click Save Button in CRM
    sleep    5
    # Custom Select Frame    //*[@id='contentIFrame1']
    Run Keyword and Ignore Error    Handle Alert
    Custom Select Frame    //*[contains(@id,'contentIFrame')][last()]
    sleep    5
    # sleep    5
    Custom Click Element    //*[@id='savefooter_statuscontrol']
    Unselect Frame
    
Click Submit Button in CRM
    # Click Save Button in CRM
    Unselect Frame
    Custom Select Frame    //*[@id='contentIFrame1']
    # Custom Select Frame    //*[contains(@id,'contentIFrame')][last()]
    Custom Select Frame    //*[@id='WebResource_DHLinks']
    sleep    10
    Scroll To Element    //div[@id='submitDHLink']
    Custom Click Element    //div[@id='submitDHLink']
        
Validate If Application Submitted Successfully to Mmtg
    sleep    15
    # Custom Select Frame    //*[@id='contentIFrame0']
    Custom Capture Page Screenshot
    Unselect Frame
    Custom Select Frame    //*[contains(@id,'contentIFrame')][last()]
    ${ext_id}    SeleniumLibrary.Get Text    //*[@id="cibc_applicationexternalid"]/div[1]/span
    Should Not Be Equal    ${ext_id}    --


# Complete esign process for all borrowers via OneSpan

# Custom Fill Borrower specific panels with deafault values

Custom Capture all saved Liabilities for Payout
    ${Consolidated_Liab_dict}=    MmtgPythonUtility.get_applicants_and_liabilities_details
    Set Global Variable    ${Consolidated_Liab_dict}
    Log    Consolidated_Liab_dict = ${Consolidated_Liab_dict}
    
Download the unsigned LOD 10782 Form
    [Arguments]    ${TestCaseName}
    MmtgPythonUtility.download_and_verify_LOD_Form    ${TestCaseName}
    
# Mark Liability for Payout
    # [Arguments]    ${Liability_data}    ${Borrower_label}
    # MmtgPythonUtility.markpayout_for_liabilities_of_applicants    ${Liability_data}


Extract Test data from Excel Data
    [Arguments]    ${SheetPath}    ${SheetName}    ${TestCaseName}
    ${Data_dict}    FileHandlingUtility.custom_extract_excel_data_for_single_rows    ${SheetPath}    ${SheetName}    ${TestCaseName}
    Log    Excel_Dict = ${Data_dict}
    [Return]    ${Data_dict}
    

Change MMTG UI Language
    [Arguments]    ${language}=EN
    Wait until Element Is Visible    //a[@class='dealpipeline nav-link' and contains(@href,'dealpipeline')]/div/span    ${iMin}
    ${English_lang_check}    Run Keyword and Return Status    Element Should Be Visible    //a[@class='dealpipeline nav-link' and contains(@href,'dealpipeline')]/div/span[text()="Deal Pipeline"]
    ${French_lang_check}    Run Keyword and Return Status    Element Should Be Visible    //a[@class='dealpipeline nav-link' and contains(@href,'dealpipeline')]/div/span[text()="Pipeline d’opérations"]
    Run Keyword If    '${language}'=='EN' and '${English_lang_check}'=='False'    Change Language to English
    ...    ELSE IF    '${language}'=='FR' and '${French_lang_check}'=='False'    Change Language to French

Change Language to English
    Custom Click Element    //div[@id='userProfileDiv']/a
    Custom Click Element    //div[@id='userProfileDiv']/div[@id='demo']//li[contains(text(),"Passez à l'anglais")]
    Custom Click Element    //button[text()='Enregistrer' and @class='btn btn-prospect-rev']
    Wait until Element Is Visible    //a[@class='dealpipeline nav-link' and contains(@href,'dealpipeline')]/div/span    ${iMin}
    Element Should Be Visible    //a[@class='dealpipeline nav-link' and contains(@href,'dealpipeline')]/div/span[text()="Deal Pipeline"]
    
Change Language to French
    Custom Click Element    //div[@id='userProfileDiv']/a
    Custom Click Element    //div[@id='userProfileDiv']/div[@id='demo']//li[contains(text(),"Switch to French")]
    Custom Click Element    //button[text()='Save' and @class='btn btn-prospect-rev']
    Wait until Element Is Visible    //a[@class='dealpipeline nav-link' and contains(@href,'dealpipeline')]/div/span    ${iMin}
    Element Should Be Visible    //a[@class='dealpipeline nav-link' and contains(@href,'dealpipeline')]/div/span[text()="Pipeline d’opérations"]
    





Create Digital Switch Application With Two Borrowers And Convert To PreApproval
    [Documentation]    Creates a Digital Switch application with 2 borrowers (PB, SB) and converts to Pre-Approval.
    # Assumes login and landing page are handled by suite setup.
    # Implement application creation steps as per system under test.
    # This is a placeholder for the actual implementation.
    # If a reusable keyword exists in your suite for this, replace this with that keyword.
    # For now, fail if not implemented.
    Fail    Keyword 'Create Digital Switch Application With Two Borrowers And Convert To PreApproval' not implemented. Please provide implementation.

Validate Liabilities Screen Links Are Clickable
    [Documentation]    Validates that required links on Liabilities screen are visible and clickable.
    ${links}    Create List
    ...    //a[contains(text(),'Refresh CIBC Internal Liabilities')]
    ...    //a[contains(text(),'Re-Order Credit')]
    ...    //a[contains(text(),"View Applicants CB Report")]
    ...    //a[contains(text(),"Add Liabilities")]
    FOR    ${link}    IN    @{links}
        Wait Until Element Is Visible    ${link}    ${iMax}
        Element Should Be Enabled        ${link}
        Custom Capture Focused Screenshot    ${link}
    END

Validate Liabilities Main Labels With Data
    [Documentation]    Validates main labels and their data on Liabilities screen.
    ${labels}    Create List
    ...    //label[contains(text(),'Applicant Name')]
    ...    //label[contains(text(),'Liability belongs to')]
    ...    //label[contains(text(),'Liability Type')]
    ...    //label[contains(text(),'Creditor Name')]
    ...    //label[contains(text(),'Limit')]
    ...    //label[contains(text(),'Balance')]
    ...    //label[contains(text(),'Payment (Monthly)')]
    ...    //span[contains(@class,'expand-icon')]
    ...    //span[contains(text(),'Total')]
    FOR    ${label}    IN    @{labels}
        Wait Until Element Is Visible    ${label}    ${iMax}
        Custom Capture Focused Screenshot    ${label}
    END

Expand First Liability Row
    [Documentation]    Expands the first liability row to show additional details.
    Wait Until Element Is Visible    (//span[contains(@class,'expand-icon')])[1]    ${iMax}
    Click Element    (//span[contains(@class,'expand-icon')])[1]
    Custom Wait    1

Validate Expanded Liability Labels With Data
    [Documentation]    Validates expanded liability labels and their data.
    ${expanded_labels}    Create List
    ...    //label[contains(text(),'Applicants')]
    ...    //label[contains(text(),'Joint Property')]
    ...    //label[contains(text(),'CIBC Liability')]
    ...    //label[contains(text(),'Liability Source')]
    ...    //label[contains(text(),'Creditor Type')]
    ...    //label[contains(text(),'Creditor Name')]
    ...    //label[contains(text(),'Rank of Charge')]
    ...    //label[contains(text(),'Maturity Date')]
    ...    //label[contains(text(),'Limit')]
    ...    //label[contains(text(),'Balance')]
    ...    //label[contains(text(),'Payment (Monthly)')]
    ...    //label[contains(text(),'Pay Out')]
    ...    //label[contains(text(),'Source of Funds')]
    ...    //label[contains(text(),'Mortgage Account Number')]
    ...    //label[contains(text(),'Previous Insurer Number')]
    ...    //label[contains(text(),'Description')]
    ...    //label[contains(text(),'Liability Source Number')]
    FOR    ${label}    IN    @{expanded_labels}
        Wait Until Element Is Visible    ${label}    ${iMax}
        Custom Capture Focused Screenshot    ${label}
    END

Add Client Volunteered Liability And Validate Labels
    [Documentation]    Adds a Client Volunteered Liability and validates all form labels.
    # Click Add Liabilities
    Wait Until Element Is Visible    //a[contains(text(),"Add Liabilities")]    ${iMax}
    Click Element    //a[contains(text(),"Add Liabilities")]
    Wait Until Element Is Visible    //h4[contains(text(),"Add Liabilities")]    ${iMax}
    Custom Capture Focused Screenshot    //h4[contains(text(),"Add Liabilities")]
    ${form_labels}    Create List
    ...    //label[contains(text(),'Applicant Name')]
    ...    //label[contains(text(),'Select Applicants to Add Liabilities')]
    ...    //label[contains(text(),'Liability Type')]
    ...    //label[contains(text(),'Description')]
    ...    //label[contains(text(),'Creditor Type')]
    ...    //label[contains(text(),'Creditor Name')]
    ...    //label[contains(text(),'Liability Source')]
    ...    //label[contains(text(),'Mortgage Account Number')]
    ...    //label[contains(text(),'CIBC Liability')]
    ...    //label[contains(text(),'Rank of Charge')]
    ...    //label[contains(text(),'Limit')]
    ...    //label[contains(text(),'Balance')]
    ...    //label[contains(text(),'Payment (Monthly)')]
    ...    //label[contains(text(),'Maturity Date')]
    ...    //label[contains(text(),'Pay Out')]
    ...    //label[contains(text(),'Source of Funds')]
    ...    //label[contains(text(),'Previous Insurer Number')]
    ...    //label[contains(text(),'Description')]
    FOR    ${label}    IN    @{form_labels}
        Wait Until Element Is Visible    ${label}    ${iMax}
        Custom Capture Focused Screenshot    ${label}
    END
    # Fill minimal required fields for Client Volunteered Liability (example, adjust as per app)
    # Custom Input Text    <applicant_name_xpath>    PB
    # Custom Select Value From Dropdown    <liability_type_xpath>    Client Volunteered
    # ... (other required fields)
    # Select Yes for required radio/checkboxes if present
    # Click Validate & Save handled in main test
