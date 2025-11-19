*** Settings ***
Documentation    WARNING! This file has been automatically generated using the Conformiq <Robot Framework Scripter> scripting backend. PLEASE DO NOT EDIT.
Library    SeleniumLibrary
Library    DateTime
Resource    ../../../Resources/common/Initialize.robot
Resource    ../../../Resources/common/Finalize.robot
Resource    ../../../Resources/Keywords/CIBCDesktop/MVP8.2_1E/MVP8_2_1E.robot

*** Variables ***

*** Test Cases ***
TC001_Functional LOD MMTG LCMS TC21
    [Documentation]    Functional_LOD_MMTG_LCMS_TC21
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC001_Functional LOD MMTG LCMS TC21    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Credit Bureau Consent and Pull Report
    MVP8_2_1E.Mark Liability for Payout
    MVP8_2_1E.Fill other required details on Liabilities Panel
    MVP8_2_1E.Verify Letter of Direction Form in Document section
    MVP8_2_1E.Validate DDGS API Request for LOD
    MVP8_2_1E.Validate LOD Form in Conditions Panel is Outstanding
    MVP8_2_1E.Verify unsigned Letter of Direction Form is listed in ECM
    [Teardown]    Finalize.Finalize Test

TC002_Functional LOD MMTG LCMS TC21a
    [Documentation]    Functional_LOD_MMTG_LCMS_TC21a
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC002_Functional LOD MMTG LCMS TC21a    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Change in Liability section
    MVP8_2_1E.Verify Regenerated Letter of Direction Form in Document section
    MVP8_2_1E.Validate DDGS API Request for regenerated LOD
    MVP8_2_1E.Validate regenerated LOD Form in Conditions Panel is Outstanding
    MVP8_2_1E.Verify unsigned Letter of Direction Form is listed in ECM
    [Teardown]    Finalize.Finalize Test

TC003_Functional LOD MMTG LCMS TC21b
    [Documentation]    Functional_LOD_MMTG_LCMS_TC21b
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC003_Functional LOD MMTG LCMS TC21b    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Submit Deal and Capture CLASS number from mMortgage
    MVP8_2_1E.Login to LCMS after Submission
    MVP8_2_1E.Complete Pre Approval Tasks
    MVP8_2_1E.Approve Deal in mMortgage
    MVP8_2_1E.Login to LCMS after Approval
    MVP8_2_1E.Validate Letter of Direction in Advancing Checklist after Approval
    MVP8_2_1E.CLose Advancing Checklist
    MVP8_2_1E.Close Active Case in LCMS
    [Teardown]    Finalize.Finalize Test

TC004_Functional LOD MMTG LCMS TC21c
    [Documentation]    Functional_LOD_MMTG_LCMS_TC21c
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC004_Functional LOD MMTG LCMS TC21c    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Update Borrower details
    MVP8_2_1E.Open Deal in mMortgage after resubmission from CRM
    MVP8_2_1E.Fill New borrower details in mandatory panels
    MVP8_2_1E.Change in Liability section_100
    MVP8_2_1E.Verify Regenerated Letter of Direction Form in Document section
    MVP8_2_1E.Validate DDGS API Request for regenerated LOD
    MVP8_2_1E.Validate regenerated LOD Form in Conditions Panel is Outstanding
    MVP8_2_1E.Verify unsigned Letter of Direction Form is listed in ECM
    MVP8_2_1E.Resubmit Deal from mMortgage
    [Teardown]    Finalize.Finalize Test

TC005_Functional LOD MMTG LCMS TC21d
    [Documentation]    Functional_LOD_MMTG_LCMS_TC21d
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC005_Functional LOD MMTG LCMS TC21d    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Submit Deal and Capture CLASS number from mMortgage_100
    MVP8_2_1E.Login to LCMS after Submission
    MVP8_2_1E.Complete Pre Approval Tasks
    MVP8_2_1E.Approve Deal in mMortgage
    MVP8_2_1E.Login to LCMS after Approval
    MVP8_2_1E.Validate Letter of Direction in Advancing Checklist after Approval
    MVP8_2_1E.CLose Advancing Checklist
    MVP8_2_1E.Close Active Case in LCMS
    [Teardown]    Finalize.Finalize Test

TC006_Functional LOD MMTG LCMS TC21e
    [Documentation]    Functional_LOD_MMTG_LCMS_TC21e
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC006_Functional LOD MMTG LCMS TC21e    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Validate Outstanding status of LOD Form in Condtions Panel
    MVP8_2_1E.Initiate E sign for 10782 LOD Form
    MVP8_2_1E.Validate LOD E sign status in Borrower Tasks Panel after initiating esign
    MVP8_2_1E.Validate Deal History Panel after initiating esign
    MVP8_2_1E.Complete E sign for the 10782 LOD Form
    MVP8_2_1E.Validate LOD E sign status in Borrower Tasks Panel after completing esign
    MVP8_2_1E.Validate LOD Form in Conditions Panel is Received
    MVP8_2_1E.Validate Deal History Panel after completing the LOD Form
    MVP8_2_1E.Verify signed Letter of Direction Form is listed in ECM
    [Teardown]    Finalize.Finalize Test

TC007_Functional LOD MMTG LCMS TC21f
    [Documentation]    Functional_LOD_MMTG_LCMS_TC21f
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC007_Functional LOD MMTG LCMS TC21f    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Capture CLASS number from Deal Notifications
    MVP8_2_1E.Login to LCMS after Approval
    MVP8_2_1E.Validate Letter of Direction in Advancing Checklist after Approval_100
    MVP8_2_1E.CLose Advancing Checklist
    MVP8_2_1E.Close Active Case in LCMS
    [Teardown]    Finalize.Finalize Test

TC008_Functional LOD MMTG LCMS TC22
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC008_Functional LOD MMTG LCMS TC22    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Credit Bureau Consent and Pull Report
    MVP8_2_1E.Mark Liability for Payout
    MVP8_2_1E.Fill other required details on Liabilities Panel
    MVP8_2_1E.Verify Letter of Direction Form in Document section
    MVP8_2_1E.Validate DDGS API Request for LOD
    MVP8_2_1E.Validate LOD Form in Conditions Panel is Outstanding
    MVP8_2_1E.Verify unsigned Letter of Direction Form is listed in ECM
    [Teardown]    Finalize.Finalize Test

TC009_Functional LOD MMTG LCMS TC22a
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22a
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC009_Functional LOD MMTG LCMS TC22a    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Change in Liability section
    MVP8_2_1E.Verify Regenerated Letter of Direction Form in Document section
    MVP8_2_1E.Validate DDGS API Request for regenerated LOD
    MVP8_2_1E.Validate regenerated LOD Form in Conditions Panel is Outstanding
    MVP8_2_1E.Verify unsigned Letter of Direction Form is listed in ECM
    [Teardown]    Finalize.Finalize Test

TC010_Functional LOD MMTG LCMS TC22b
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22b
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC010_Functional LOD MMTG LCMS TC22b    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Submit Deal and Capture CLASS number from mMortgage
    MVP8_2_1E.Login to LCMS after Submission
    MVP8_2_1E.Complete Pre Approval Tasks
    MVP8_2_1E.Approve Deal in mMortgage
    MVP8_2_1E.Login to LCMS after Approval
    MVP8_2_1E.Validate Letter of Direction in Advancing Checklist after Approval
    MVP8_2_1E.CLose Advancing Checklist
    MVP8_2_1E.Close Active Case in LCMS
    [Teardown]    Finalize.Finalize Test

TC011_Functional LOD MMTG LCMS TC22c
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22c
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC011_Functional LOD MMTG LCMS TC22c    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Validate Outstanding status of LOD Form in Condtions Panel
    MVP8_2_1E.Initiate E sign for 10782 LOD Form
    MVP8_2_1E.Validate LOD E sign status in Borrower Tasks Panel after initiating esign
    MVP8_2_1E.Validate Deal History Panel after initiating esign
    MVP8_2_1E.Complete E sign for the 10782 LOD Form
    MVP8_2_1E.Validate LOD E sign status in Borrower Tasks Panel after completing esign
    MVP8_2_1E.Validate LOD Form in Conditions Panel is Received
    MVP8_2_1E.Validate Deal History Panel after completing the LOD Form
    MVP8_2_1E.Verify signed Letter of Direction Form is listed in ECM
    [Teardown]    Finalize.Finalize Test

TC012_Functional LOD MMTG LCMS TC22d
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22d
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC012_Functional LOD MMTG LCMS TC22d    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Capture CLASS number from Deal Notifications
    MVP8_2_1E.Login to LCMS after Approval
    MVP8_2_1E.Validate Letter of Direction in Advancing Checklist after Approval_100
    MVP8_2_1E.CLose Advancing Checklist
    MVP8_2_1E.Close Active Case in LCMS
    [Teardown]    Finalize.Finalize Test

TC013_Functional LOD MMTG LCMS TC22e
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22e
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC013_Functional LOD MMTG LCMS TC22e    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Update Borrower details
    MVP8_2_1E.Open Deal in mMortgage after resubmission from CRM
    MVP8_2_1E.Fill New borrower details in mandatory panels
    MVP8_2_1E.Change in Liability section_100
    MVP8_2_1E.Verify Regenerated Letter of Direction Form in Document section
    MVP8_2_1E.Validate DDGS API Request for regenerated LOD
    MVP8_2_1E.Validate regenerated LOD Form in Conditions Panel is Outstanding
    MVP8_2_1E.Verify unsigned Letter of Direction Form is listed in ECM
    MVP8_2_1E.Resubmit Deal from mMortgage
    [Teardown]    Finalize.Finalize Test

TC014_Functional LOD MMTG LCMS TC22f
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22f
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC014_Functional LOD MMTG LCMS TC22f    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Submit Deal and Capture CLASS number from mMortgage_100
    MVP8_2_1E.Login to LCMS after Submission
    MVP8_2_1E.Complete Pre Approval Tasks
    MVP8_2_1E.Approve Deal in mMortgage
    MVP8_2_1E.Login to LCMS after Approval
    MVP8_2_1E.Validate Letter of Direction in Advancing Checklist after Approval
    MVP8_2_1E.CLose Advancing Checklist
    MVP8_2_1E.Close Active Case in LCMS
    [Teardown]    Finalize.Finalize Test

TC015_Functional LOD MMTG LCMS TC22g
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22g
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC015_Functional LOD MMTG LCMS TC22g    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Validate Outstanding status of LOD Form in Condtions Panel
    MVP8_2_1E.Upload 10782 LOD Form via Wet sign
    MVP8_2_1E.Validate LOD Form in Conditions Panel is Received
    MVP8_2_1E.Validate Deal History Panel after completing the LOD Form
    MVP8_2_1E.Verify signed Letter of Direction Form is listed in ECM
    [Teardown]    Finalize.Finalize Test

TC016_Functional LOD MMTG LCMS TC22h
    [Documentation]    Functional_LOD_MMTG_LCMS_TC22h
    [Tags]
    [Setup]    Run Keywords    Initialize.Initialize settings    TC016_Functional LOD MMTG LCMS TC22h    MVP8.2_1E    MVP8_2_1E
    ...    AND    Initialize.Open Browser For Test
    MVP8_2_1E.Read Inputs
    MVP8_2_1E.Login to mMortgage and Open the Deal
    MVP8_2_1E.Capture CLASS number from Deal Notifications
    MVP8_2_1E.Login to LCMS after Approval
    MVP8_2_1E.Validate Letter of Direction in Advancing Checklist after Approval_100
    MVP8_2_1E.CLose Advancing Checklist
    MVP8_2_1E.Close Active Case in LCMS
    [Teardown]    Finalize.Finalize Test

Validate Liabilities And Employment Screen Labels And Values
    [Documentation]    Validate Liabilities and Employment Screen with all the Labels and valid values for Digital Switch with 2 borrowers, Pre-Approval, English.
    [Tags]    MVP8_2_1E    Liabilities    Employment    Labels    PreApproval

    # Step 1: Create Application as per Preconditions and convert to Pre-Approval
    Create Digital Switch Application With Two Borrowers And Convert To PreApproval
    Custom Capture Page Screenshot    Application created and converted to Pre-Approval

    # Step 2: Select Application Number hyperlink and navigate to Liabilities
    Wait Until Element Is Visible    ${Deal Pipeline_Deal PipelineSCREENDeal PipelineSCREENApplication NumberHYPERLINK_WEB_EN}    ${iMax}
    Custom Click Element    ${Deal Pipeline_Deal PipelineSCREENDeal PipelineSCREENApplication NumberHYPERLINK_WEB_EN}    Application Number
    Wait Until Element Is Visible    ${Liabilities_LiabilitiesSCREENLiabilitiesSCREENCredit Bureau ConsentHYPERLINK_WEB_EN}    ${iMax}
    Custom Capture Page Screenshot    Navigated to Liabilities

    # Step 3: Consent document uploaded manually
    Custom Click Element    ${Credit Bureau Consent_Credit Bureau ConsentPOPUPManualBUTTON_WEB_EN}    Manual Consent
    Wait Until Element Is Visible    ${Credit Bureau Consent_Credit Bureau ConsentUPLOADDocumentBUTTON_WEB_EN}    ${iMax}
    Custom Choose File    ${Credit Bureau Consent_Credit Bureau ConsentUPLOADDocumentBUTTON_WEB_EN}    ${Filepath_UCCP}
    Wait Until Element Is Visible    ${Credit Bureau Consent_Credit Bureau ConsentPOPUPSave Consent Detail}    ${iMax}
    Custom Click Element    ${Credit Bureau Consent_Credit Bureau ConsentPOPUPSave Consent Detail}    Save Consent Details
    Custom Capture Page Screenshot    Consent document uploaded

    # Step 4: In expiry select yes
    Wait Until Element Is Visible    //input[@id="expiryYes"]    ${iMax}
    Click Element    //input[@id="expiryYes"]
    Verify Radio Button is Selected    //input[@id="expiryYes"]
    Custom Capture Page Screenshot    Expiry selected Yes

    # Step 5: In Consent Form Generation checkbox select yes
    Wait Until Element Is Visible    //input[@id="consentFormGenYes"]    ${iMax}
    Click Element    //input[@id="consentFormGenYes"]
    Verify Radio Button is Selected    //input[@id="consentFormGenYes"]
    Custom Capture Page Screenshot    Consent Form Generation selected Yes

    # Step 6: Validate below Links are available & Clickable
    Validate Liabilities Screen Links Are Clickable

    # Step 7: Validate Labels are available with valid Data
    Validate Liabilities Main Labels With Data

    # Step 8: Validate additional (expanded) liability Labels with Valid Data
    Expand First Liability Row
    Validate Expanded Liability Labels With Data

    # Step 9: Add a Client Volunteered Liability & validate all Labels
    Add Client Volunteered Liability And Validate Labels

    # Step 10: Select Yes and Click Validate & Save
    Wait Until Element Is Visible    ${Product Selection Main Page_Product Selection Main PageSCREENValidated&SaveBUTTON_WEB_EN}    ${iMax}
    Click Element    ${Product Selection Main Page_Product Selection Main PageSCREENValidated&SaveBUTTON_WEB_EN}
    Wait Until Element Is Visible    ${Product Selection Main Page_Product Selection Main PageSCREENSaved ResultGROUPOKBUTTON_WEB_EN}    ${iMax}
    Click Element    ${Product Selection Main Page_Product Selection Main PageSCREENSaved ResultGROUPOKBUTTON_WEB_EN}
    Custom Capture Page Screenshot    Liability added and saved
