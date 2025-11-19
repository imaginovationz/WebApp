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
    [Tags]    Regression    Renewal    MD189X

    # Step 1: Login to Excalibur and update maturity date
    Open Browser For Test    ${ENV_Browser}    ${MMTG_URL}    ${MMTG_Alias_Name}
    Login To Excalibur Application
    Custom Capture Page Screenshot    Step 1 - Logged in to Excalibur

    Search Mortgage By PDE    655
    Update Maturity Date To Less Than 32 Days
    Custom Capture Page Screenshot    Step 1 - Maturity date updated

    # Step 2: Validate mortgage details, language, employee field, maturity details
    Search Mortgage By PDE    218
    Validate Mortgage Details For Renewal
    Custom Capture Page Screenshot    Step 2 - Mortgage details validated

    # Step 3: Print renewal agreement on demand
    Input PDE And Mortgage Number For Renewal Agreement Print    651    ${MORTGAGE_NUMBER}    6 pr
    Custom Capture Page Screenshot    Step 3 - Renewal agreement print initiated

    # Step 4: Validate "offer printed" message
    Wait Until Page Contains    offer printed    timeout=15s
    Custom Capture Page Screenshot    Step 4 - Offer printed message validated

    # Step 5: Login to Envoy and enter mortgage number
    Launch ENVOY Application on Browser
    Login To Envoy Application
    Enter Mortgage Number In Envoy    ${MORTGAGE_NUMBER}
    Custom Capture Page Screenshot    Step 5 - Envoy mortgage number entered

    # Step 6: Verify MD189X is generated
    Wait Until MD189X Is Generated    ${MORTGAGE_NUMBER}
    Custom Capture Page Screenshot    Step 6 - MD189X generated

    # Step 7: Download and validate MD189X letter contents
    Download MD189X Letter    ${MORTGAGE_NUMBER}
    Validate MD189X Letter Contents
    Custom Capture Page Screenshot    Step 7 - MD189X letter contents validated

    [Teardown]    Close All Applications
