*** Settings ***
Documentation   The objective of this flow is to renew a Mortgage with new rates and do the validation in Excalibe, RMS, rightfax application.
Resource        ../../Resources/Configuration/URLs_Links_SetUp.robot
Suite Setup     Set Lending Test Environment
Test Setup      Initialize for E2E Test Report in Word Format
Test Teardown   Add Test Execution Status to E2E Test Report
Suite Teardown  Close All Applications
Force Tags      E2E_Automation      Excalibur_Rightfax_RMS      Flow20



*** Test Cases ***
TC01_Excalibur_Rightfax_RMS
    [Documentation]     The objective of this flow is to renew a Mortgage with new rates and do the validation in Excalibur, RMS, Rightfax application.
    [Tags]              Excalibur_Rightfax_RMS               mortgage       Pabot_No
    Load E2E Test Data     ${E2E_TestDataSheet_Path}    ${TEST NAME}
    Set Test Output Data Sheet and Row Number       15
    Launch and Login to EXCALIBUR
    Navigate to given PDE for renewal processing pannel In Excalibur
    Delete offer in renewal processing panel
    To Print offer in Renewal Processing panel In Excalibur
    Validate for Offer Printed Status in Excalibur
    Login to Envoy application and Enter Username and Password
    Verify And Navigate to Document Status
    Retreive the Excalibur Application ID in Envoy Application
    Validate the Excalibur Application ID with Envoy Application ID In Envoy ApplicationID

Validate Mortgage Renewal Eligibility And Generate MD189X
    [Documentation]    Validate mortgage is eligible for renewal offer and generate MD189X letter.
    [Tags]    Renewal    MD189X    Excalibur    Envoy

    # Step 1: Login to Excalibur and update maturity date to <32 days
    Open Browser For Test    ${ENV_Browser}    ${MMTG_URL}    ${MMTG_Alias_Name}
    Login To Excalibur Application
    Search Mortgage By Number    ${MORTGAGE_NUMBER}
    Update Maturity Date To Less Than 32 Days    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot

    # Step 2: Validate Mortgage Details, Language, Employee Field, Maturity Details
    Input PDE Command    218
    Validate Mortgage Details For Renewal    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot

    # Step 3: Print the Renewal Agreement (on demand process)
    Input PDE Command    651
    Input Mortgage Number    ${MORTGAGE_NUMBER}
    Input Print Renewal Agreement Command    6 pr
    CustomKeywords.Custom Capture Page Screenshot

    # Step 4: Validate message "offer printed"
    Wait Until Page Contains    offer printed    timeout=10s
    CustomKeywords.Custom Capture Page Screenshot

    # Step 5: Login to Envoy and enter mortgage number
    Launch ENVOY Application on Browser
    Login To Envoy Application
    Input Mortgage Number In Envoy    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot

    # Step 6: Verify MD189X is generated
    Wait Until MD189X Is Generated    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot

    # Step 7: Download MD189X and validate letter elements
    Download MD189X Letter    ${MORTGAGE_NUMBER}
    Validate MD189X Letter Elements
    CustomKeywords.Custom Capture Page Screenshot

Validate Mortgage Renewal Offer And MD189X Generation
    [Documentation]    Validates that a mortgage is eligible for renewal offer and generates the MD189X letter.
    [Tags]    Smoke    Renewal    MD189X

    # Step 1: Login to Excalibur and update maturity date
    Login To Excalibur Application
    Search Mortgage By Number    ${MORTGAGE_NUMBER}
    Update Maturity Date To Less Than 32 Days    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot    Step 1 - Maturity Date Updated

    # Step 2: Validate mortgage details for renewal
    Input PDE Command    218
    Validate Mortgage Details For Renewal    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot    Step 2 - Mortgage Details Validated

    # Step 3: Print the Renewal Agreement (on demand)
    Input PDE Command    651
    Input Mortgage Number    ${MORTGAGE_NUMBER}
    Input Print Renewal Agreement Command    6 pr
    CustomKeywords.Custom Capture Page Screenshot    Step 3 - Renewal Agreement Print Command

    # Step 4: Validate "offer printed" message
    Wait Until Page Contains    offer printed    timeout=15s
    CustomKeywords.Custom Capture Page Screenshot    Step 4 - Offer Printed Message

    # Step 5: Login to Envoy and enter mortgage number
    Login To Envoy Application
    Input Mortgage Number In Envoy    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot    Step 5 - Envoy Mortgage Number Entered

    # Step 6: Validate MD189X is generated
    Wait Until MD189X Is Generated    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot    Step 6 - MD189X Generated

    # Step 7: Download and validate MD189X letter elements
    Download MD189X Letter    ${MORTGAGE_NUMBER}
    Validate MD189X Letter Elements
    CustomKeywords.Custom Capture Page Screenshot    Step 7 - MD189X Letter Validated

*** Keywords ***

Validate 9 Products Present In MROG00 Grid
    [Arguments]    ${mortgage_number}
    ${products}=    Create List
    ...    {'Discount code':'01','Mortgage Term':'1 Year Closed Fixed Rate Mortgages','Rate code':'R01C','Product code':'CL','Mro discount':'MRO Discount Rate - 1 Year Closed Fixed Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    ...    {'Discount code':'01','Mortgage Term':'2 Year Closed Fixed Rate Mortgages','Rate code':'R02C','Product code':'CL','Mro discount':'MRO Discount Rate - 2 Year Closed Fixed Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    ...    {'Discount code':'01','Mortgage Term':'3 Year Closed Fixed Rate Mortgages','Rate code':'R03C','Product code':'CL','Mro discount':'MRO Discount Rate - 3 Year Closed Fixed Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    ...    {'Discount code':'01','Mortgage Term':'4 Year Closed Fixed Rate Mortgages','Rate code':'R04C','Product code':'CL','Mro discount':'MRO Discount Rate - 4 Year Closed Fixed Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    ...    {'Discount code':'01','Mortgage Term':'5 Year Closed Fixed Rate Mortgages','Rate code':'R05C','Product code':'CL','Mro discount':'MRO Discount Rate - 5 Year Closed Fixed Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    ...    {'Discount code':'01','Mortgage Term':'7 Year Closed Fixed Rate Mortgages','Rate code':'R07C','Product code':'CL','Mro discount':'MRO Discount Rate - 7 Year Closed Fixed Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    ...    {'Discount code':'01','Mortgage Term':'3 Year Variable Flex Closed Variable Rate Mortgages','Rate code':'RVR03','Product code':'CV','Mro discount':'3 Year Variable Flex Closed Variable Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    ...    {'Discount code':'01','Mortgage Term':'5 Year Variable Flex Closed Variable Rate Mortgages','Rate code':'RVR0D','Product code':'CV','Mro discount':'5 Year Variable Flex Closed Variable Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    ...    {'Discount code':'01','Mortgage Term':'5 Year Open Variable Rate Mortgages','Rate code':'RVR0D','Product code':'DV','Mro discount':'5 Year Open Variable Rate Mortgages','Discount Rate Expiry Date':'9999999'}
    Validate Products In MROG00 Grid    ${mortgage_number}    ${products}
