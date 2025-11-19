*** Test Cases ***

Validate MROG00 And Products In Excalibur
    [Documentation]    Validate that MROG00 is present in Excalibur and all 9 required products are available in the MRO Grid file for the given mortgage.
    [Tags]    Excalibur    MROG00    ProductValidation

    # Step 1: Login to Excalibur and verify MROG00 is present
    Open Browser For Test    ${ENV_Browser}    ${MMTG_URL}    ${MMTG_Alias_Name}
    Login To Excalibur Application
    Search Mortgage By Number    ${MORTGAGE_NUMBER}
    Input PDE Command    MROG00
    Wait Until Page Contains    MROG00    timeout=10s
    CustomKeywords.Custom Capture Page Screenshot    Step 1 - MROG00 Grid Present

    # Step 2: Validate all 9 products are present in MROG00 grid
    Validate 9 Products Present In MROG00 Grid    ${MORTGAGE_NUMBER}
    CustomKeywords.Custom Capture Page Screenshot    Step 2 - 9 Products Validated
