*** Settings ***
Resource            ../../Configuration/URLs_Links_SetUp.robot

*** Keywords ***

Add Test Execution Status to E2E Test Report
    Run Keyword If     "${TEST STATUS}"=="FAIL"     Run Keyword And Ignore Error     Capture Screenshot and Add to E2E Test Report Word document
    Add Test Status to E2E Test Report Word document

Close All Applications
    Run Keyword And Ignore Error     Close All Browsers  
    Run Keyword And Ignore Error     Close Coins  
    Run Keyword And Ignore Error     Close Excalibur

Switch To English Language
    [Documentation]    Switch To English Language
    Custom Click Element    ${MMTG_Profile_Expand_Icon_Xpath}
    Custom Click Element    ${MMTG_Profile_Switch_Language_Xpath}
    Custom Click Element    ${Landing Page_Landing PageSCREENSaveBUTTON_WEB_EN}
    Wait until Element is Enabled    ${MMTG_Login_Menu}    15
    Custom Click Element    ${MMTG_Login_Menu}

Set Test Output Data Sheet and Row Number
    [Arguments]     ${RowNumber}
    ${TestOutputData_Row}   Set Variable    ${RowNumber}
    Set Test Variable    ${TestOutputData_Row}
    ${CurrentDataTimeStamp}     Get Current Date    result_format=%Y-%m-%d %H:%M:%S
    Set Test Variable    ${CurrentDataTimeStamp}
    ExcelRobot.Open Excel To Write     ${E2E_TestOutputDataSheet_Path}
    ExcelRobot.Write To Cell By Name   ${E2E_TestOutputDataSheet_Name}      A${TestOutputData_Row}     ${TEST NAME}
    ExcelRobot.Write To Cell By Name   ${E2E_TestOutputDataSheet_Name}      B${TestOutputData_Row}     ${ENV}
    ExcelRobot.Write To Cell By Name   ${E2E_TestOutputDataSheet_Name}      C${TestOutputData_Row}     ${CurrentDataTimeStamp}
    Sleep    ${OneSecSleep}
    ExcelRobot.Save Excel
    
Set Health Check Test Output Data Sheet and Row Number
    [Arguments]     ${RowNumber}
    ${TestOutputData_Row}   Set Variable    ${RowNumber}
    Set Test Variable    ${TestOutputData_Row}
    ${CurrentDataTimeStamp}     Get Current Date    result_format=%Y-%m-%d %H:%M:%S
    Set Test Variable    ${CurrentDataTimeStamp}
    ExcelRobot.Open Excel To Write     ${E2E_HealthCheckTestOutputDataSheet_Path}
    ExcelRobot.Write To Cell By Name   ${E2E_HealthCheckTestOutputDataSheet_Name}      A${TestOutputData_Row}     ${TEST NAME}
    ExcelRobot.Write To Cell By Name   ${E2E_HealthCheckTestOutputDataSheet_Name}      B${TestOutputData_Row}     ${ENV}
    ExcelRobot.Write To Cell By Name   ${E2E_HealthCheckTestOutputDataSheet_Name}      C${TestOutputData_Row}     ${CurrentDataTimeStamp}
    Sleep    ${OneSecSleep}
    ExcelRobot.Save Excel

Update Test Output Data Sheet
    [Arguments]     ${Column_Name}     ${Cell_Value}
    ExcelRobot.Open Excel To Write     ${E2E_TestOutputDataSheet_Path}
    ExcelRobot.Write To Cell By Name   ${E2E_TestOutputDataSheet_Name}      ${Column_Name}${TestOutputData_Row}     ${Cell_Value}
    Sleep    ${OneSecSleep}
    ExcelRobot.Save Excel
    
Update Health Check Test Output Data Sheet
    [Arguments]     ${Column_Name}     ${Cell_Value}
    ExcelRobot.Open Excel To Write     ${${E2E_HealthCheckTestOutputDataSheet_Path}}
    ExcelRobot.Write To Cell By Name   ${${E2E_HealthCheckTestOutputDataSheet_Name}}      ${Column_Name}${TestOutputData_Row}     ${Cell_Value}
    Sleep    ${OneSecSleep}
    ExcelRobot.Save Excel
    
Update TDM Sheet Output Data Sheet
    [Arguments]     ${Column_Name}     ${Cell_Value}
    ExcelRobot.Open Excel To Write     ${E2E_TestDataSheet_Path}
    ExcelRobot.Write To Cell By Name   ${E2E_MMTGProspectsDataSheet_Name}      ${Column_Name}${TestOutputData_Row}     ${Cell_Value}
    Sleep    ${OneSecSleep}
    ExcelRobot.Save Excel

Read Test output Data Sheet 
    [Arguments]     ${TEST NAME}    ${Column_Name}     
    ExcelRobot.Open Excel     ${E2E_TestOutputDataSheet_Path}
    ${TestOutput}  Excelrobot.Read Cell Data By Name    ${E2E_TestOutputDataSheet_Name}      ${Column_Name}${TestOutputData_Row}
    [Return]    ${TestOutput}



Initialize for E2E Test Report in Word Format
    Set Test Variable                   ${E2E_Test_Report_Path}     ${EXECDIR}\\Reports\\E2E_Report\\${TEST_NAME}.docx
    Create File                         ${E2E_Test_Report_Path}   
    GenerateReport.Initialize Report    ${E2E_Test_Report_Path}     ${TEST_NAME}
    GenerateReport.Write Text           ${E2E_Test_Report_Path}     <<Test Status at the End of the Document>>
    GenerateReport.Write Heading        ${E2E_Test_Report_Path}     ${TEST DOCUMENTATION}


Add Test Status to E2E Test Report Word document
    GenerateReport.Write Heading         ${E2E_Test_Report_Path}    Test Status ${TEST_STATUS}

Add Test Step to E2E Test Report Word document
    [Arguments]     ${ExcelCellName}
    ${Test_Step_Description}    ExcelReadUtility.Read Final Result Excel   ${E2ETestStepsExcelWorkbook}    ${E2ETestStepsExcelSheetName}    ${ExcelCellName}
    GenerateReport.Write Bullet         ${E2E_Test_Report_Path}     Test Step: ${Test_Step_Description}

Add Test Message to E2E Test Report Word document
    [Arguments]     ${TestMessage}
    GenerateReport.Write Text         ${E2E_Test_Report_Path}    ${TestMessage}

Capture Screenshot and Add to E2E Test Report Word document
    Generate Screenshot Name
    Capture Page Screenshot   ${SS_Name}
    sleep   ${minSleep}
    GenerateReport.Attach Picture   ${E2E_Test_Report_Path}       ${SS_Name}

Take Screenshot and Add to E2E Test Report Word document
    Generate Screenshot Name
    sleep   ${minSleep}
    Take Screenshot         ${SS_Name}
    Get Active Window Image     ${SS_Name}
    Get Screen Image    ${SS_Name}
    sleep   ${minSleep}
    GenerateReport.Attach Picture   ${E2E_Test_Report_Path}       ${SS_Name}

DSR Calculation for BRUL20945
    DSR Calculation BRUL20945

DSR Calculation BRUL20945
    ${PropertyValue_IntValue}       Convert To Number       ${mMtg_AssetProperty_dict['Property_Value'][0]}
    ${Total_Prior_Charge_Value}     Run Keyword If     """${mMtg_ProductSelection_dict['Rank_of_Charge'][0]}"""=="""1"""    Set Variable     0
    ...    ELSE IF    """${mMtg_ProductSelection_dict['Rank_of_Charge'][0]}"""=="""2"""    Wait Until Keyword Succeeds     ${TenSecSleep}     ${OneSecSleep}         SeleniumLibrary.Get Element Attribute         ${ProductSelection_Rankofcharge_TotalPriorCharge}     value
    ${Total_Prior_Charge_Value}       String.Remove String   ${Total_Prior_Charge_Value}    $     ,    
    ${Total_Prior_Charge_IntValue}       Convert To Number   ${Total_Prior_Charge_Value}
    ${LTV_IntValue}       Convert To Number   ${LTV} 
    ExcelReadUtility.Write_Value_to_Excel       ${DSRCalulationExcelWorkbook}       ${DSRCalulationExcelSheetName}    B1   ${PropertyValue_IntValue}
    ExcelReadUtility.Write_Value_to_Excel       ${DSRCalulationExcelWorkbook}       ${DSRCalulationExcelSheetName}    B2   ${LTV_IntValue}      
    ExcelReadUtility.Write_Value_to_Excel       ${DSRCalulationExcelWorkbook}       ${DSRCalulationExcelSheetName}    B3   ${Total_Prior_Charge_IntValue}
    ExcelReadUtility.Open_Excel_In_Win32Com     ${DSRCalulationExcelWorkbook}
    ${IndividualRealEstateLTVLimit_Value}     Run Keyword IF      """${PropertyValue_IntValue}""">="""500000""" and "${LTV_IntValue}"=="95"     ExcelReadUtility.Read Final Result Excel   ${DSRCalulationExcelWorkbook}    ${DSRCalulationExcelSheetName}    B12
    ...                                 ELSE                ExcelReadUtility.Read Final Result Excel   ${DSRCalulationExcelWorkbook}    ${DSRCalulationExcelSheetName}    B17    
    ${IndividualRealEstateLTVLimit}   Evaluate     math.ceil(${IndividualRealEstateLTVLimit_Value})
    Set Test Variable    ${IndividualRealEstateLTVLimit}
    Log     Individual RealEstate LTV Limit: ${IndividualRealEstateLTVLimit}
    
Set MMTG Data Sheet and Row Number
    [Arguments]     ${RowNumber}    ${TEST NAME}
    ${TestOutputData_Row}   Set Variable    ${RowNumber}
    Set Test Variable    ${TestOutputData_Row}
    ${CurrentDataTimeStamp}     Get Current Date    result_format=%Y-%m-%d %H:%M:%S
    Set Test Variable    ${CurrentDataTimeStamp}
    ExcelRobot.Open Excel To Write     ${E2E_TestDataSheet_Path}
    ExcelRobot.Write To Cell By Name   ${E2E_MMTGProspectsDataSheet_Name}      A${TestOutputData_Row}     ${TEST NAME}
    ExcelRobot.Write To Cell By Name   ${E2E_MMTGProspectsDataSheet_Name}      B${TestOutputData_Row}     ${ENV}
    ExcelRobot.Write To Cell By Name   ${E2E_MMTGProspectsDataSheet_Name}      C${TestOutputData_Row}     ${CurrentDataTimeStamp}
    Sleep    ${OneSecSleep}
    ExcelRobot.Save Excel