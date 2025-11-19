*** Settings ***
Library             SeleniumLibrary
Library             XML
Library             JSONLibrary
Library             String
Library             OperatingSystem
Library             Collections
Library             DateTime
Library             DatabaseLibrary
Library             AutoItLibrary
Library             Screenshot
Library             ExcelLibrary
Library             ExcelRobot
Library             keyboard
Library             RequestsLibrary
Variables           ../Configuration/TestConfig.py
Library             ../Utilities/ChromeDriverPathUtility.py
Library             ../Utilities/MmtgTDMUtility.py
Library             ../Utilities/MmtgPythonUtility.py
Library             ../Utilities/CommonUtility.py
Library             ../Utilities/DatabaseUtility.py
Library             ../Utilities/LCMSPythonUtility.py
Library             ../Utilities/ExcaliburUtility.py
Library             ../Utilities/PDFValidationUtility.py
Library             ../Utilities/GenerateReport.py
Library             ../Utilities/ExcelReadUtility.py
Library             ../Utilities/CLASSUtility.py
Library             ../Utilities/SOATDMUtility.py
Resource            ../Variables/CLASS_Variables.robot
Resource            ../Variables/CRM_Variables.robot
Resource            ../Variables/DDGS_Variables.robot
Resource            ../Variables/ECIF_Variables.robot
Resource            ../Variables/EXCALIBUR_Variables.robot
Resource            ../Variables/LCMS_Variables.robot
Resource            ../Variables/MMTG_Variables.robot
Resource            ../Variables/SOA_Variables.robot
Resource            ../Variables/DM_TOAD_Variables.robot
Resource            ../Keywords/Common/Browser_Keywords.robot
Resource            ../Keywords/Common/Common_Keywords.robot
Resource            ../Keywords/Common/Custom_Keywords.robot
Resource            ../Keywords/MMTG/CRM_Keywords.robot
Resource            ../Keywords/ECIF/ECIF_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_Common_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_Prospects_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_PersonalInformation_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_EmploymentInformation_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_Assets_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_Liabilities_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_SubjectProperty_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_Income_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_ProductSelection_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_ThirdPartyApplication_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_CreditorInsurance_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_DealContacts_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_Documents_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_DealSummary_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_DealHistory_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_DealNotification_Keywords.robot
Resource            ../Keywords/MMTG/MMTG_Underwriter_Keywords.robot
Resource            ../Keywords/DM/DM_Keywords.robot
Resource            ../Keywords/LCMS/LCMS_Common_Keywords.robot
Resource            ../Keywords/LCMS/LCMS_ActivitySelection_Keywords.robot
Resource            ../Keywords/LCMS/LCMS_CaseTask_Keywords.robot
Resource            ../Keywords/LCMS/LCMS_CaseSearch_Keywords.robot
Resource            ../Keywords/LCMS/LCMS_HomeScreen_Keywords.robot
Resource            ../Keywords/LCMS/LCMS_Scrubbing_Keywords.robot
Resource            ../Keywords/LCMS/LCMS_PreAdvancing_Keywords.robot
Resource            ../Keywords/CLASS/CLASS_Common_Keywords.robot
Resource            ../Keywords/CLASS/CLASS_Coins_Keywords.robot
Resource            ../Keywords/CLASS/CLASS_Custom_Keywords.robot
Resource            ../Keywords/EXCALIBUR/EXCALIBUR_Common_Keywords.robot
Resource            ../Keywords/EXCALIBUR/EXCALIBUR_CreditorInsurance_Keywords.robot
Resource            ../Keywords/DDGS/DDGS_Common_Keywords.robot
Resource            ../Keywords/DDGS/DDGS_Login_Keywords.robot
Resource            ../Keywords/SOA/SOA_Keywords.robot
Resource            ../Keywords/ECIF/Common_Keywords.robot

Resource            ../PageObjects/MMTG/CRM_PO.robot
Resource            ../PageObjects/ECIF/ECIF_PO.robot
Resource            ../PageObjects/MMTG/MMTG_Login_PO.robot
Resource            ../PageObjects/MMTG/MMTG_Prospects_PO.robot
Resource            ../PageObjects/MMTG/MMTG_PersonalInformation_PO.robot
Resource            ../PageObjects/MMTG/MMTG_EmploymentInformation_PO.robot
Resource            ../PageObjects/MMTG/MMTG_Assets_PO.robot
Resource            ../PageObjects/MMTG/MMTG_Liabilities_PO.robot
Resource            ../PageObjects/MMTG/MMTG_SubjectProperty_PO.robot
Resource            ../PageObjects/MMTG/MMTG_Income_PO.robot
Resource            ../PageObjects/MMTG/MMTG_ProductSelection_PO.robot
Resource            ../PageObjects/MMTG/MMTG_ThirdPartyApplication_PO.robot
Resource            ../PageObjects/MMTG/MMTG_CreditorInsurance_PO.robot
Resource            ../PageObjects/MMTG/MMTG_DealContacts_PO.robot
Resource            ../PageObjects/MMTG/MMTG_Documents_PO.robot
Resource            ../PageObjects/MMTG/MMTG_DealSummary_PO.robot
Resource            ../PageObjects/MMTG/MMTG_DealHistory_PO.robot
Resource            ../PageObjects/MMTG/MMTG_DealNotification_PO.robot
Resource            ../PageObjects/MMTG/MMTG_Underwriter_PO.robot
Resource            ../PageObjects/LCMS/LCMS_CaseSummary_PO.robot
Resource            ../PageObjects/LCMS/LCMS_ActivitySelection_PO.robot
Resource            ../PageObjects/LCMS/LCMS_CaseTask_PO.robot
Resource            ../PageObjects/LCMS/LCMS_CaseSearch_PO.robot
Resource            ../PageObjects/LCMS/LCMS_CreditorInsurance_PO.robot
Resource            ../PageObjects/LCMS/LCMS_HomeScreen_PO.robot
Resource            ../PageObjects/LCMS/LCMS_AdvancingChecklist_PO.robot
Resource            ../PageObjects/LCMS/LCMS_Scrubbing_PO.robot
Resource            ../PageObjects/LCMS/LCMS_ReceiveRFF_PO.robot
Resource            ../PageObjects/LCMS/LCMS_PreAdvancing_PO.robot
Resource            ../PageObjects/LCMS/LCMS_Disbursement_PO.robot
Resource            ../PageObjects/DDGS/DDGS_DocumentGeneration_PO.robot
Resource            ../PageObjects/DDGS/DDGS_Login_PO.robot
Resource            ../PageObjects/CLASS/CLASS_PrimaryMenu_PO.robot
Resource            ../PageObjects/CLASS/CLASS_ApplicationStatusCondition_PO.robot
Resource            ../PageObjects/CLASS/CLASS_ApplicationMenu_PO.robot
Resource            ../PageObjects/CLASS/CLASS_RetailLendingMenu_PO.robot
Resource            ../PageObjects/CLASS/CLASS_Common_PO.robot
Resource            ../PageObjects/CLASS/CLASS_PLCGeneralOptions_PO.robot

*** Variables ***

${ENV_Browser}                      CHROME
${E2E_TestDataSheet_Path}           ${EXECDIR}\\Data\\E2E_TestData.xlsx
${E2E_CLASS_TestDataSheet_Path}     ${EXECDIR}\\Data\\E2E_CLASS_TestData.xlsx
${E2E_TestOutputDataSheet_Path}     ${EXECDIR}\\Data\\E2E_TestOutputData.xlsx
${E2E_TestOutputDataSheet_Name}     E2E_Output
${E2E_HealthCheckTestOutputDataSheet_Path}     ${EXECDIR}\\Data\\E2E_HealthCheckTestOutputData.xlsx
${E2E_HealthCheckTestOutputDataSheet_Name}     E2E_Output
${E2E_MMTGProspectsDataSheet_Name}     Prospects
${E2E_ECIF_LoginTestDataSheet_Path}    ${EXECDIR}\\Data\\E2E_ECIFLogin_Data.xlsx
${E2ETestStepsExcelWorkbook}        ${EXECDIR}\\Data\\E2E_TestStepsForReport.xlsx
${E2ETestStepsExcelSheetName}       Steps
${ECIF_LAN}    ENG


${iMin}         5s
${iMax}         60s
${Retry}        2s
${OneSecRetry}  1s
${minSleep}     2s
${midSleep}     5s
${maxSleep}     10s
${OneSecSleep}   1s
${FifteenSecSleep}  15s
${FourSecSleep}    4s
${iMid}     30s
${TenSecSleep}    10s
${TwentySecSleep}    20s
${BelowOneSecSleep}    0.5s
${TimeOut_Max}      60
${TimeOut_Min}      20
${TimeOut_Mid}      45

${DSRCalulationExcelWorkbook}           ${EXECDIR}\\Files\\CalculationToolDSR.xlsx
${DSRCalulationExcelSheetName}          POC_BRUL20945

${CLASS_P1_Host}    P1

${MMTG_P1_URL}        https://sit.cibc.digitalmmortgage.com/login/
${CRM_P1_URL}         https://Mtgqa14:Apri%4025%40@dev.cibccrm.cibc.com/CIBCMortgageSIT/main.aspx
${ECIF_P1_URL}        https://launcher-cte.ecifui.sit.cibc.com/
# ${LCMS_P1_URL}        https://w3sit1.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=en&ROLE=abc&transitID=85823&userId=LB10010&to=P1&from=ADP1&applicationID=67&ECIFId=1234&ecifuiRelease=1.1&desktop=standalone&lcmsInstance=LCMS-STS-SIT1&mpso=MPSO-STS-SIT1
${LCMS_P1_URL}        https://w3sit1.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=en&ROLE=abc&transitID=85823&userId=LB10010&to=P1&from=ADP1&applicationID=67&ECIFId=1234&ecifuiRelease=1.1&desktop=standalone&lcmsInstance=LCMS-STS-SIT1&mpso=MPSO-STS-SIT1
${LCMS_P1_URL_FR}     https://w3sit1.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=fr&ROLE=abc&transitID=85823&userId=LB10010&to=P1&from=ADP1&applicationID=67&ECIFId=1234&ecifuiRelease=1.1&desktop=standalone&lcmsInstance=LCMS-STS-SIT1&mpso=MPSO-STS-SIT1
${EXCALIBUR_P1_Env}   uatnas2
${DDGS_URL_P1}        https://sit01.envoy-ui-docgen.cibc.com/generate-doc

${CLASS_PA_Host}    PA
${MMTG_PA_URL}        https://sit2.cibc.digitalmmortgage.com/login/
${CRM_PA_URL}         https://Mtgqa21:Apri@25@@dev.cibccrm.cibc.com/CIBCMortgageSIT2/main.aspx
${ECIF_PA_URL}        https://launcher-cte.ecifui.sit.cibc.com
${LCMS_PA_URL}        https://w3sit2.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=en&ROLE=ecif&transitID=85823&userId=ML10050&to=PA&from=ADP1&applicationID=67&ecifuiRelease=Current1&desktop=backoffice&lcms=LCMS-STS-SIT2&mpso=mpso-sit2-sts
${LCMS_PA_URL_FR}     https://w3sit2.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=fr&ROLE=ecif&transitID=85823&userId=ML10050&to=PA&from=ADP1&applicationID=67&ecifuiRelease=Current1&desktop=backoffice&lcms=LCMS-STS-SIT2&mpso=mpso-sit2-sts
${EXCALIBUR_PA_Env}   sitexcpa
${DDGS_URL_PA}        https://sit02.envoy-ui-docgen.cibc.com/generate-doc
${Integration_Audit_PA_URL}    https://sit2.cibc.digitalmmortgage.com/integration-audit/
${Integration_Audit_URL}    https://dev.cibc.digitalmmortgage.com/integrationaudit/home

${CLASS_HF_Host}    HF
${MMTG_HF_URL}         https://sit3.cibc.digitalmmortgage.com/login/
${CRM_HF_URL}          https://Mtgqa14:Apri%4025%40@dev.cibccrm.cibc.com/CIBCMortgageSIT3/main.aspx
${ECIF_HF_URL}         https://launcher-cte.ecifui.uat.cibc.com
${LCMS_HF_URL}         https://w3sit3.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=en&ROLE=ecif&transitID=85823&userId=BC10029&to=PIP|ADP1-HF&from=ADP1&applicationID=67&ecifuiRelease=Current1&desktop=backoffice&lcms=LCMS-STS-SIT3&mpso=mpso-sit3-sts
${LCMS_HF_URL_FR}      https://w3sit3.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=fr&ROLE=ecif&transitID=85823&userId=BC10029&to=PIP|ADP1-HF&from=ADP1&applicationID=67&ecifuiRelease=Current1&desktop=backoffice&lcms=LCMS-STS-SIT3&mpso=mpso-sit3-sts 
${EXCALIBUR_HF_Env}    uatdam04



${MMTG_T4_URL}    https://uat.cibc.digitalmmortgage.com/login/
${CRM_T4_URL}     https://Mtgqa21:Apri@25@@preprod.cibccrm.cibc.com/CIBCMortgageUAT/main.aspx
${ECIF_T4_URL}    https://launcher-cte.ecifui.uat.cibc.com
${LCMS_T4_URL}    https://w3uat3.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=en&ROLE=ecif&transitID=85823&userId=KJ00012&to=T4&from=ADT4&applicationID=67&ecifuiRelease=Current1&desktop=backoffice&lcms=LCMS-STS-UAT3&mpso=mpso-uat3-sts
${LCMS_T4_URL_FR}    https://w3uat3.mcc.dm.cibc.com/Advisor/home.jsp?activeLanguageCode=fr&ROLE=ecif&transitID=85823&userId=KJ00012&to=T4&from=ADT4&applicationID=67&ecifuiRelease=Current1&desktop=backoffice&lcms=LCMS-STS-UAT3&mpso=mpso-uat3-sts
${EXCALIBUR_T4_Env}    uatdam04

*** Keywords ***

Set Lending Test Environment
    Set Suite Variable      ${Env}
    # ${WebDriver_Chromedriver_Status}     Run Keyword And Return Status     Create Chrome Driver And Get Chrome Driver Path
    # Run Keyword If    "${WebDriver_Chromedriver_Status}"=="False"      Get Chrome Driver Path from T-Drive
    Get Chrome Driver Path from T-Drive
    Set Suite Variable      ${Chromedriverpath}
    Run Keyword If      "${Env}"=="SIT1" or "${Env}"=="P1"   Set Application URL For P1/SIT1 Environment
    ...  ELSE IF        "${Env}"=="SIT2" or "${Env}"=="PA"   Set Application URL For PA/SIT2 Environment
    ...  ELSE IF        "${Env}"=="SIT3" or "${Env}"=="HF"   Set Application URL For HF/SIT3 Environment
    ...  ELSE IF        "${Env}"=="UAT" or "${Env}"=="T4"    Set Application URL For T4/UAT Environment
    Register Keyword To Run On Failure      Capture Page Screenshot

Set Application URL For P1/SIT1 Environment
    Set Suite Variable  ${MMTG_URL}             ${MMTG_P1_URL}
    Set Suite Variable  ${MMTG_MA_User_Name}    ${MMTG_MA_User_Name_14}
    Set Suite Variable  ${CRM_URL}              ${CRM_P1_URL}
    Set Suite Variable  ${ECIF_URL}             ${ECIF_P1_URL}
    Set Suite Variable  ${COINS_ENV}            ${COINS_ENV_P1}
    Set Suite Variable  ${EXCALIBUR_ENV}        ${EXCALIBUR_P1_Env}
    Set Suite Variable  &{LCMS_Login_Params}    &{LCMS_Login_Params_P1}
    Set Suite Variable  &{DDGS_Login_Params}    &{DDGS_Login_Params_P1}
    Set Suite Variable  &{ECIF_Login_Params}    &{ECIF_Login_Params_P1}
    Set Suite Variable  ${DDGS_URL}             ${DDGS_URL_P1}
    Set Suite Variable  ${DB_USER_NAME}         ${DB_SIT_USER_NAME}
    Set Suite Variable  ${DB_PASSWORD}          ${DB_SIT_PASSWORD}
    Set Suite Variable  ${DB_HOST_NAME}         ${DB_SIT_HOST_NAME}
    Set Suite Variable  ${DB_PORT_NUMBER}       ${DB_SIT_PORT_NUMBER}
    Set Suite Variable  ${DB_SERVICE_NAME}      ${DB_SIT_SERVICE_NAME}

Set Application URL For PA/SIT2 Environment
    Set Suite Variable  ${MMTG_URL}             ${MMTG_PA_URL}
    Set Suite Variable  ${MMTG_MA_User_Name}    ${MMTG_MA_User_Name_14}
    Set Suite Variable  ${CRM_URL}              ${CRM_PA_URL}
    Set Suite Variable  ${ECIF_URL}             ${ECIF_PA_URL}
    Set Suite Variable  ${COINS_ENV}            ${COINS_ENV_PA}
    Set Suite Variable  ${EXCALIBUR_ENV}        ${EXCALIBUR_PA_Env}
    Set Suite Variable  &{LCMS_Login_Params}    &{LCMS_Login_Params_PA}
    Set Suite Variable  &{DDGS_Login_Params}    &{DDGS_Login_Params_PA}
    Set Suite Variable  &{ECIF_Login_Params}    &{ECIF_Login_Params_PA}
    Set Suite Variable  ${DDGS_URL}             ${DDGS_URL_PA}
    Set Suite Variable  ${DB_USER_NAME}         ${DB_SIT_USER_NAME}
    Set Suite Variable  ${DB_PASSWORD}          ${DB_SIT_PASSWORD}
    Set Suite Variable  ${DB_HOST_NAME}         ${DB_SIT_HOST_NAME}
    Set Suite Variable  ${DB_PORT_NUMBER}       ${DB_SIT_PORT_NUMBER}
    Set Suite Variable  ${DB_SERVICE_NAME}      ${DB_SIT_SERVICE_NAME}

Set Application URL For HF/SIT3 Environment
    Set Suite Variable  ${MMTG_URL}             ${MMTG_HF_URL}
    Set Suite Variable  ${MMTG_MA_User_Name}    ${MMTG_MA_User_Name_14}
    Set Suite Variable  ${CRM_URL}              ${CRM_T4_URL}
    Set Suite Variable  ${ECIF_URL}             ${ECIF_T4_URL}
    Set Suite Variable  ${COINS_ENV}            ${COINS_ENV_HF}
    Set Suite Variable  ${EXCALIBUR_ENV}        ${EXCALIBUR_HF_Env}
    Set Suite Variable  &{LCMS_Login_Params}    &{LCMS_Login_Params_HF}
    Set Suite Variable  &{DDGS_Login_Params}    &{DDGS_Login_Params_HF}
    Set Suite Variable  &{ECIF_Login_Params}    &{ECIF_Login_Params_HF}
    Set Suite Variable  ${DB_USER_NAME}         ${DB_UAT_USER_NAME}
    Set Suite Variable  ${DB_PASSWORD}          ${DB_UAT_PASSWORD}
    Set Suite Variable  ${DB_HOST_NAME}         ${DB_UAT_HOST_NAME}
    Set Suite Variable  ${DB_PORT_NUMBER}       ${DB_UAT_PORT_NUMBER}
    Set Suite Variable  ${DB_SERVICE_NAME}      ${DB_UAT_SERVICE_NAME}

Set Application URL For T4/UAT Environment
    Set Suite Variable  ${MMTG_URL}             ${MMTG_T4_URL}
    Set Suite Variable  ${MMTG_MA_User_Name}    ${MMTG_MA_User_Name_21}
    Set Suite Variable  ${CRM_URL}              ${CRM_HF_URL}
    Set Suite Variable  ${ECIF_URL}             ${ECIF_T4_URL}
    Set Suite Variable  ${COINS_ENV}            ${COINS_ENV_HF}
    Set Suite Variable  ${EXCALIBUR_ENV}        ${EXCALIBUR_T4_Env}
    Set Suite Variable  &{LCMS_Login_Params}    &{LCMS_Login_Params_T4}
    Set Suite Variable  &{DDGS_Login_Params}    &{DDGS_Login_Params_HF}
    Set Suite Variable  &{ECIF_Login_Params}    &{ECIF_Login_Params_HF}
    Set Suite Variable  ${DB_USER_NAME}         ${DB_UAT_USER_NAME}
    Set Suite Variable  ${DB_PASSWORD}          ${DB_UAT_PASSWORD}
    Set Suite Variable  ${DB_HOST_NAME}         ${DB_UAT_HOST_NAME}
    Set Suite Variable  ${DB_PORT_NUMBER}       ${DB_UAT_PORT_NUMBER}
    Set Suite Variable  ${DB_SERVICE_NAME}      ${DB_UAT_SERVICE_NAME}



Create Chrome Driver And Get Chrome Driver Path
    ${Chromedriverpath}    ChromeDriverPathUtility.create_chrome_driver_and_get_path
    Set Suite Variable     ${Chromedriverpath}

Get Chrome Driver Path from T-Drive
    ${Chromedriverpath}    ChromeDriverPathUtility.get_chrome_driver_path
    Set Suite Variable     ${Chromedriverpath}
