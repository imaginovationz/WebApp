
*** Settings ***
Documentation    WARNING! This file has been automatically generated using the Conformiq <Robot Framework Scripter> scripting backend. PLEASE DO NOT EDIT.
Library    SeleniumLibrary
Library    DateTime
Resource    ../../../common/CustomKeywords.robot



*** keywords ***
Read Inputs
	[Documentation]    Read Inputs
    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM Read Excel Sheet

    #No automation action found for custom action in nlp excel : PERFORM GetNumericExcelData

    BuiltIn.No Operation

Login to mMortgage and Open the Deal
	[Documentation]    Login to mMortgage and Open the Deal
    CustomKeywords.Open Browser for MMTG       ${gv_Test_Env_LTMAOTD}
    CustomKeywords.Custom Capture Page Screenshot
    CustomKeywords.Login to MMTG       ${gv_User_ID_LTMAOTD}       ${gv_Pwd_LTMAOTD}
    CustomKeywords.Custom Capture Page Screenshot
    CustomKeywords.Search and Open the Deal       ${gv_Deal_number_LTMAOTD}
    CustomKeywords.Check Deal Status       ${gv_Status_LTMAOTD}       ${gv_Language_LTMAOTD}
    CustomKeywords.Custom Capture Page Screenshot

Credit Bureau Consent and Pull Report
	[Documentation]    Credit Bureau Consent and Pull Report
    CustomKeywords.Custom Click Element       ${gv_xpath_CBCAPR}       ${gv_element_CBCAPR}
    CustomKeywords.Custom Capture Page Screenshot
    CustomKeywords.Custom Upload Credit Bureau Consent
    CustomKeywords.Custom Capture Page Screenshot
    CustomKeywords.CB Pull
    CustomKeywords.Custom Capture Page Screenshot

Mark Liability for Payout
	[Documentation]    Mark Liability for Payout
    #No automation action found for custom action in nlp excel : PERFORM Mark Liability for Payout

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    #No automation action found for custom action in nlp excel : PERFORM Mark Liability for Payout

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    #No automation action found for custom action in nlp excel : PERFORM Mark Liability for Payout

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    BuiltIn.No Operation

Fill other required details on Liabilities Panel
	[Documentation]    Fill other required details on Liabilities Panel
    CustomKeywords.Custom Liabilities Panel Fill
    CustomKeywords.Custom Capture Page Screenshot

Verify Letter of Direction Form in Document section
	[Documentation]    Verify Letter of Direction Form in Document section
    CustomKeywords.Custom Click Element       ${gv_xpath_VLODFIDS}       ${gv_element_VLODFIDS}

Validate DDGS API Request for LOD
	[Documentation]    Validate DDGS API Request for LOD
    CustomKeywords.Open Browser for IAT
    CustomKeywords.Search API transaction for the Deal       ${gv_Deal_Number_VDARFL}       ${gv_Portal_VDARFL}       ${gv_Test_Env_VDARFL}
    CustomKeywords.Capture and Validate LOD DDGS API Resquest
    CustomKeywords.Close Current Browser
    CustomKeywords.Switch to Previous Browser

Validate LOD Form in Conditions Panel is Outstanding
	[Documentation]    Validate LOD Form in Conditions Panel is Outstanding
    CustomKeywords.Custom Click Element       ${gv_xpath_VLFICPIO}       ${gv_element_VLFICPIO}
    CustomKeywords.Custom Capture Page Screenshot

Verify unsigned Letter of Direction Form is listed in ECM
	[Documentation]    Verify unsigned Letter of Direction Form is listed in ECM
    CustomKeywords.Close Current Browser
    CustomKeywords.Switch to Previous Browser

Change in Liability section
	[Documentation]    Change in Liability section
    CustomKeywords.Custom Click Element       ${gv_xpath_CILS}       ${gv_element_CILS}
    CustomKeywords.Custom Capture Page Screenshot

Verify Regenerated Letter of Direction Form in Document section
	[Documentation]    Verify Regenerated Letter of Direction Form in Document section
    CustomKeywords.Custom Click Element       ${gv_xpath_VRLODFIDS}       ${gv_element_VRLODFIDS}

Validate DDGS API Request for regenerated LOD
	[Documentation]    Validate DDGS API Request for regenerated LOD
    CustomKeywords.Open Browser for IAT
    CustomKeywords.Search API transaction for the Deal       ${gv_Deal_Number_VDARFRL}       ${gv_Portal_VDARFRL}       ${gv_Test_Env_VDARFRL}
    CustomKeywords.Capture and Validate LOD DDGS API Resquest
    CustomKeywords.Close Current Browser

Validate regenerated LOD Form in Conditions Panel is Outstanding
	[Documentation]    Validate regenerated LOD Form in Conditions Panel is Outstanding
    CustomKeywords.Switch to Previous Browser
    CustomKeywords.Custom Click Element       ${gv_xpath_VRLFICPIO}       ${gv_element_VRLFICPIO}
    CustomKeywords.Custom Capture Page Screenshot

Submit Deal and Capture CLASS number from mMortgage
	[Documentation]    Submit Deal and Capture CLASS number from mMortgage
    CustomKeywords.Submit Deal from mMortgage to LCMS       ${gv_Type_SDACCNFM}
    CustomKeywords.Capture CLASS number from mMortgage Deal       ${gv_Product_SDACCNFM}
    CustomKeywords.Check Deal Status       ${gv_Status_SDACCNFM}       ${gv_Language_SDACCNFM}

Login to LCMS after Submission
	[Documentation]    Login to LCMS after Submission
    LCMSCustomKeywords.Open Browser for LCMS       ${gv_Test_Env_LTLAS}       ${gv_Language_LTLAS}
    CustomKeywords.Custom Capture Page Screenshot
    LCMSCustomKeywords.Search and Open Case
    CustomKeywords.Custom Capture Page Screenshot

Complete Pre Approval Tasks
	[Documentation]    Complete Pre Approval Tasks
    CustomKeywords.Custom Click Element       ${gv_xpath_CPAT}       ${gv_element_CPAT}
    CustomKeywords.Custom Capture Page Screenshot
    LCMSCustomKeywords.Open and Complete PMA Task
    CustomKeywords.Custom Capture Page Screenshot
    LCMSCustomKeywords.Open and Complete VUC Task
    CustomKeywords.Custom Capture Page Screenshot
    LCMSCustomKeywords.Close Current Case

Approve Deal in mMortgage
	[Documentation]    Approve Deal in mMortgage
    CustomKeywords.Open Browser for MMTG       ${gv_Test_Env_ADIM}
    CustomKeywords.Login to MMTG       ${gv_User_ID_ADIM}       ${gv_Pwd_ADIM}
    CustomKeywords.Search and Open the Deal       ${gv_Deal_number_ADIM}
    CustomKeywords.Approve Deal in Underwriter

Login to LCMS after Approval
	[Documentation]    Login to LCMS after Approval
    LCMSCustomKeywords.Open Browser for LCMS       ${gv_Test_Env_LTLAA}       ${gv_Language_LTLAA}
    CustomKeywords.Custom Capture Page Screenshot
    LCMSCustomKeywords.Search and Open Case
    CustomKeywords.Custom Capture Page Screenshot

Validate Letter of Direction in Advancing Checklist after Approval
	[Documentation]    Validate Letter of Direction in Advancing Checklist after Approval
    CustomKeywords.Custom Capture Page Screenshot

CLose Advancing Checklist
	[Documentation]    CLose Advancing Checklist
    #No automation action found for custom action in nlp excel : PERFORM Close Advancing Checklist

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    BuiltIn.No Operation

Close Active Case in LCMS
	[Documentation]    Close Active Case in LCMS
    LCMSCustomKeywords.Close Current Case

Update Borrower details
	[Documentation]    Update Borrower details
    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    #No automation action found for custom action in nlp excel : PERFORM Update Borrower in CRM

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    #No automation action found for custom action in nlp excel : PERFORM Resubmit deal from CRM to MMTG

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    BuiltIn.No Operation

Open Deal in mMortgage after resubmission from CRM
	[Documentation]    Open Deal in mMortgage after resubmission from CRM
    CustomKeywords.Open Browser for MMTG       ${gv_Test_Env_ODIMARFC}
    CustomKeywords.Custom Capture Page Screenshot
    CustomKeywords.Login to MMTG       ${gv_User_ID_ODIMARFC}       ${gv_Pwd_ODIMARFC}
    CustomKeywords.Custom Capture Page Screenshot
    CustomKeywords.Search and Open the Deal       ${gv_Deal_number_ODIMARFC}
    CustomKeywords.Check Deal Status       ${gv_Status_ODIMARFC}       ${gv_Language_ODIMARFC}
    CustomKeywords.Custom Capture Page Screenshot

Fill New borrower details in mandatory panels
	[Documentation]    Fill New borrower details in mandatory panels
    #No automation action found for custom action in nlp excel : PERFORM Fill Required details in other panels for new borrower

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    BuiltIn.No Operation

Change in Liability section_100
	[Documentation]    Change in Liability section_100
    CustomKeywords.Custom Click Element       ${gv_xpath_CILS}       ${gv_element_CILS}
    CustomKeywords.Custom Capture Page Screenshot

Resubmit Deal from mMortgage
	[Documentation]    Resubmit Deal from mMortgage
    CustomKeywords.Submit Deal from mMortgage to LCMS       ${gv_Type_RDFM}
    CustomKeywords.Check Deal Status       ${gv_Status_RDFM}       ${gv_Language_RDFM}
    CustomKeywords.Custom Capture Page Screenshot

Submit Deal and Capture CLASS number from mMortgage_100
	[Documentation]    Submit Deal and Capture CLASS number from mMortgage_100
    CustomKeywords.Capture CLASS number from mMortgage Deal       ${gv_Product_SDACCNFM}
    CustomKeywords.Check Deal Status       ${gv_Status_SDACCNFM}       ${gv_Language_SDACCNFM}

Validate Outstanding status of LOD Form in Condtions Panel
	[Documentation]    Validate Outstanding status of LOD Form in Condtions Panel
    CustomKeywords.Custom Click Element       ${gv_xpath_VOSOLFICP}       ${gv_element_VOSOLFICP}
    CustomKeywords.Custom Capture Page Screenshot

Initiate E sign for 10782 LOD Form
	[Documentation]    Initiate E sign for 10782 LOD Form
    #No automation action found for custom action in nlp excel : PERFORM Initiate esign for Form

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    BuiltIn.No Operation

Validate LOD E sign status in Borrower Tasks Panel after initiating esign
	[Documentation]    Validate LOD E sign status in Borrower Tasks Panel after initiating esign
    CustomKeywords.Custom Click Element       ${gv_xpath_VLESSIBTPAIE}       ${gv_element_VLESSIBTPAIE}
    CustomKeywords.Custom Capture Page Screenshot

Validate Deal History Panel after initiating esign
	[Documentation]    Validate Deal History Panel after initiating esign
    CustomKeywords.Custom Click Element       ${gv_xpath_VDHPAIE}       ${gv_element_VDHPAIE}
    CustomKeywords.Custom Capture Page Screenshot

Complete E sign for the 10782 LOD Form
	[Documentation]    Complete E sign for the 10782 LOD Form
    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    BuiltIn.No Operation

Validate LOD E sign status in Borrower Tasks Panel after completing esign
	[Documentation]    Validate LOD E sign status in Borrower Tasks Panel after completing esign
    CustomKeywords.Custom Click Element       ${gv_xpath_VLESSIBTPACE}       ${gv_element_VLESSIBTPACE}
    CustomKeywords.Custom Capture Page Screenshot

Validate LOD Form in Conditions Panel is Received
	[Documentation]    Validate LOD Form in Conditions Panel is Received
    CustomKeywords.Custom Click Element       ${gv_xpath_VLFICPIR}       ${gv_element_VLFICPIR}
    CustomKeywords.Custom Capture Page Screenshot

Validate Deal History Panel after completing the LOD Form
	[Documentation]    Validate Deal History Panel after completing the LOD Form
    CustomKeywords.Custom Click Element       ${gv_xpath_VDHPACTLF}       ${gv_element_VDHPACTLF}
    CustomKeywords.Custom Capture Page Screenshot

Verify signed Letter of Direction Form is listed in ECM
	[Documentation]    Verify signed Letter of Direction Form is listed in ECM
    CustomKeywords.Close Current Browser
    CustomKeywords.Switch to Previous Browser

Capture CLASS number from Deal Notifications
	[Documentation]    Capture CLASS number from Deal Notifications
    CustomKeywords.Capture CLASS number from mMortgage Deal       ${gv_Product_CCNFDN}
    CustomKeywords.Custom Capture Page Screenshot

Validate Letter of Direction in Advancing Checklist after Approval_100
	[Documentation]    Validate Letter of Direction in Advancing Checklist after Approval_100
    CustomKeywords.Custom Capture Page Screenshot

Upload 10782 LOD Form via Wet sign
	[Documentation]    Upload 10782 LOD Form via Wet sign
    #No automation action found for custom action in nlp excel : PERFORM Upload LOD Form via Wet sign process

    #No automation action found for custom action in nlp excel : VERIFY Textual Rendering Output

    BuiltIn.No Operation

