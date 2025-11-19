*** Settings ***
Resource            ../../Configuration/URLs_Links_SetUp.robot


*** keywords ***


Validate for Creditor Insurance Details in EXCALIBUR
    Unlock Mtg creditor insurance deal in EXCALIBUR
    Validate for Creditor Insurance Premium value in EXCALIBUR
    Press F12 key in Excalibur
    Validate for Coverage Status and Security Value in EXCALIBUR
    Press F12 key in Excalibur
    Verify Document Generation Date
    Validate Customer Premium and New Insurance or security type value in EXCALIBUR
    Validate for Expiry Date value in EXCALIBUR
    Update Test Output Data Sheet     R    Passed

Validate for Creditor Insurance Details in EXCALIBUR for Class
    Unlock Mtg creditor insurance deal in EXCALIBUR
    Validate for Creditor Insurance Premium value in EXCALIBUR
    Press F12 key in Excalibur
    Validate for Coverage Status and Security Value in EXCALIBUR
    Press F12 key in Excalibur

    Navigate to given PDE    523    ${Mortgage_Service_Num}
    Add Test Step to E2E Test Report Word document     A113
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Validate Customer Premium and New Insurance or security type value in EXCALIBUR
    Validate for Expiry Date value in EXCALIBUR

Unlock Mtg creditor insurance deal in EXCALIBUR
    [Documentation]     Unlock Mtg creditor insurance deal in EXCALIBUR
    Navigate to given PDE    299A    ${Mortgage_Service_Num}
    ${status_to_active}=    Get Text from Excalibur    17    11     24
    Run Keyword If    "${status_to_active.upper()}"=="CHANGE STATUS TO: ACTIVE"    Run Keywords
    ...           excalibur_set_text        17    70    Y
    ...    AND    Press Enter Key in Excalibur
    Add Test Step to E2E Test Report Word document     A110
    Take Screenshot and Add to E2E Test Report Word document


Validate for Creditor Insurance Premium value in EXCALIBUR
    [Documentation]     Validate for Creditor Insurance Premium value in EXCALIBUR
    Navigate to given PDE    218    ${Mortgage_Service_Num}
    Add Test Step to E2E Test Report Word document     A111
    Take Screenshot and Add to E2E Test Report Word document
    ${is_key_present}    Run Keyword And Return Status    Dictionary Should Contain Key   ${customer_data}     Creditor Insurance Total
    Run Keyword If     ${is_key_present}     Verify CI premium value with LCMS Customer data   Creditor Insurance Total
   
    
    
Verify CI premium value with LCMS Customer data
    [Documentation]    Get CI Value with LCMS Customer data
    [Arguments]    ${key}
    
    ${ins_prem}=    Get From Dictionary    ${customer_data}     ${key}
    ${creditor_ins_prem}=    Get Text from Excalibur    15    30     7
    ${creditor_ins_prem}=     Strip String     ${creditor_ins_prem}
    Run Keyword If    """${creditor_ins_prem}"""=="""${ins_prem}"""  Log     Cred ins. prem. in EXCALIBUR found as expected
    ...     ELSE     Fail          Cred ins. prem. in EXCALIBUR not found as expected
    Take Screenshot and Add to E2E Test Report Word document
    
    
    
Validate for Coverage Status and Security Value in EXCALIBUR
    [Documentation]    Validate for Coverage Status and Security value in EXCALIBUR
    Navigate to given PDE    225    ${Mortgage_Service_Num}
    Add Test Step to E2E Test Report Word document     A112
    Take Screenshot and Add to E2E Test Report Word document
    Verify MLI coverage Status in Excalibur
    Press F12 key in Excalibur  
    Verify MCI coverage Status in Excalibur
    Press F12 key in Excalibur  
    Verify MDI coverage Status in Excalibur
    Press F12 key in Excalibur  
    Verify MDI Plus coverage Status in Excalibur
    Press F12 key in Excalibur  
   

    
Verify Document Generation Date 
    Navigate to given PDE    523    ${Mortgage_Service_Num}
    Add Test Step to E2E Test Report Word document     A113
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    excalibur_set_text        13    2    3
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur 
    ${document_gen_date}=    Get Text from Excalibur    22    31    8
    Run Keyword If    """${document_gen_date}"""=="""${Doc_Generation_Date}"""  Log     Document Generation date in EXCALIBUR found as expected
    ...     ELSE     Fail          Document Generation date in EXCALIBUR not found as expected
    Take Screenshot and Add to E2E Test Report Word document
    Press F12 key in Excalibur

Validate Customer Premium and New Insurance or security type value in EXCALIBUR
    [Documentation]    Validate Customer Premium and New Insurance or security type value in EXCALIBUR

    Add Test Step to E2E Test Report Word document     A114
    Take Screenshot and Add to E2E Test Report Word document
    Verify MLI Customer Premium in Excalibur 
    Verify MDI Customer Premium in Excalibur 
    Verify MDI plus Customer Premium in Excalibur   
    Verify MCI Customer Premium in Excalibur
    Press F12 key in Excalibur 
 

Validate for Expiry Date value in EXCALIBUR
    [Documentation]    Validate for Expiry Date value in EXCALIBUR
    Navigate to given PDE    522    ${Mortgage_Service_Num}
    Add Test Step to E2E Test Report Word document     A115
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    excalibur_set_text        9    2    1
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Take Screenshot and Add to E2E Test Report Word document
    Verify MLI Expiry Date in Excalibur
    Verify MDI Expiry Date in Excalibur
    Verify MDI plus Expiry Date in Excalibur
    Verify MCI Expiry Date in Excalibur
    Press F12 key in Excalibur 

   
Verify MLI coverage Status in Excalibur
    [Documentation]     Verify MLI coverage Status in Excalibur
    ${ins_name}=       Get Text from Excalibur    8    4    3
    ${cust_name1}=    Get Text from Excalibur    9    23    13
    ${cust_name2}=    Get Text from Excalibur    10    23    13
    ${coverage_status1}=    Get Coverage status from Excalibur    9    6    14
    ${coverage_status_2}=    Get Coverage status from Excalibur    10    6    14
    excalibur_set_text        8    2    1
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Verify Coverage status with LCMS Customer data    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}
 

   
Verify MCI coverage Status in Excalibur
    [Documentation]     Verify MCI coverage Status in Excalibur
    ${ins_name}=       Get Text from Excalibur    17    4    3
    ${cust_name1}=    Get Text from Excalibur    18    23    13
    ${cust_name2}=    Get Text from Excalibur    19    23    13
    ${coverage_status1}=    Get Coverage status from Excalibur    18    6    14
    ${coverage_status_2}=    Get Coverage status from Excalibur    19    6    14
    excalibur_set_text        17    2    1
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Verify Coverage status with LCMS Customer data    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}   
 


Verify MDI coverage Status in Excalibur
    [Documentation]     Verify MDI coverage Status in Excalibur
    ${ins_name}=       Get Text from Excalibur    11    4    3
    ${cust_name1}=    Get Text from Excalibur    12    23    13
    ${cust_name2}=    Get Text from Excalibur    13    23    13
    ${coverage_status1}=    Get Coverage status from Excalibur    12    6    14
    ${coverage_status_2}=    Get Coverage status from Excalibur    13    6    14
    excalibur_set_text        11    2    1
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Verify Coverage status with LCMS Customer data    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}
 

   
Verify MDI plus coverage Status in Excalibur
    [Documentation]     Verify MDI plus coverage Status in Excalibur
    ${ins_name}=       Get Text from Excalibur    14    4    4
    ${cust_name1}=    Get Text from Excalibur    15    23    13
    ${cust_name2}=    Get Text from Excalibur   16    23    13
    ${coverage_status1}=    Get Coverage status from Excalibur    15    6    14
    ${coverage_status_2}=    Get Coverage status from Excalibur    16    6    14
    excalibur_set_text        14    2    1        #14  2
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    Verify Coverage status with LCMS Customer data    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}   
        


Verify Coverage status with LCMS Customer data
    [Documentation]    Verify Coverage status with LCMS Customer data
    [Arguments]    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}
    
    ${ins_list}=    Get From Dictionary    ${customer_data}     ${ins_name}
    ${ins_list_len}=    Get Length  ${ins_list}
    FOR     ${index}     IN RANGE  0   ${ins_list_len}
    ${item}=        Get From List       ${ins_list}   ${index}

    Run Keyword IF    """${item['Customer_Name'].upper()}"""=="""${cust_name1.upper()}"""    Run Keywords
    ...    Verify Coverage Status for each borrower    ${item}      ${ins_name}     ${coverage_status1}     ${cust_name1}
    ...    AND    Verify Security Value for each borrower from Excalibur    ${item}      ${ins_name}     ${cust_name1}    9    31
      
    Run Keyword IF    """${item['Customer_Name'].upper()}"""=="""${cust_name2.upper()}"""    Run Keywords
    ...    Verify Coverage Status for each borrower    ${item}    ${ins_name}    ${coverage_status2}     ${cust_name2}
    ...    AND    Verify Security Value for each borrower from Excalibur    ${item}      ${ins_name}     ${cust_name2}    15    31    
    END


Verify Coverage Status for each borrower    
    [Documentation]     Verify Coverage Status for each borrower
    [Arguments]    ${item}    ${ins_name}     ${coverage_status}    ${cust_name}
    
    Run Keyword If    """${item['Premium_Status'].upper()}"""=="""${coverage_status.upper()}"""   Log     Coverage Status for ${ins_name} in EXCALIBUR found as expected for ${cust_name}
    ...        ELSE     Fail          Coverage Status for ${ins_name} in EXCALIBUR not found as expected for ${cust_name}
    

Verify Security Value for each borrower from Excalibur
    [Documentation]     Get and Verify Security Value for each borrower from Excalibur
    [Arguments]   ${item}    ${ins_name}    ${cust_name}    ${startRow}    ${startColumn}
    
    ${security_value}=       excalibur_get_text    ${startRow}    ${startColumn}    7    #9  31
    Take Screenshot and Add to E2E Test Report Word document
    ${security_value}=    Replace String    ${security_value}    ,    ${EMPTY}
    ${security_value_trunc}=     Strip String     ${security_value}    mode=right   
     Run Keyword If    """${item['Coverage_Amount']}"""=="""${security_value_trunc}"""   Log     Security Value for ${ins_name} in EXCALIBUR found as expected for ${cust_name}
     ...        ELSE     Fail          Security Value for ${ins_name} in EXCALIBUR not found as expected for ${cust_name}
     
    
Verify MLI Customer Premium in Excalibur
    [Documentation]     Verify MLI Customer Premium in Excalibur
    ${ins_name}=       Get Text from Excalibur    12    4    3
    ${cust_name1}=    Get Text from Excalibur    13    23    13
    ${cust_name2}=    Get Text from Excalibur    14    23    13
    ${coverage_status1}=    Get Coverage status from Excalibur    13    6    14
    ${coverage_status_2}=    Get Coverage status from Excalibur    14    6    14

    Verify Customer Premium with LCMS Customer data    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}    13    14

Verify MCI Customer Premium in Excalibur
    [Documentation]     Verify MCI Customer Premium in Excalibur
    
    keyboard.Press And Release   PAGE_DOWN
    Sleep     ${minSleep} 
    Take Screenshot and Add to E2E Test Report Word document
    ${ins_name}=       Get Text from Excalibur    9    4    3
    ${cust_name1}=    Get Text from Excalibur    10    23    13
    ${cust_name2}=    Get Text from Excalibur    11    23    13
    ${coverage_status1}=    Get Coverage status from Excalibur    10    6    14
    ${coverage_status_2}=    Get Coverage status from Excalibur    11    6    14

    Verify Customer Premium with LCMS Customer data    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}    10    11


Verify MDI Customer Premium in Excalibur
    [Documentation]     Verify MDI Customer Premium in Excalibur
    ${ins_name}=       Get Text from Excalibur    15    4    3
    ${cust_name1}=    Get Text from Excalibur    16    23    13
    ${cust_name2}=    Get Text from Excalibur    17    23    13
    ${coverage_status1}=    Get Coverage status from Excalibur    16    6    14
    ${coverage_status_2}=    Get Coverage status from Excalibur    17    6    14

    Verify Customer Premium with LCMS Customer data    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}    16    17


Verify MDI plus Customer Premium in Excalibur
    [Documentation]     Verify MDI plus Customer Premium in Excalibur
    ${ins_name}=       Get Text from Excalibur    18    4    4
    ${cust_name1}=    Get Text from Excalibur    19    23    13
    ${cust_name2}=    Get Text from Excalibur    20    23    13
    ${coverage_status1}=    Get Coverage status from Excalibur    19    6    14
    ${coverage_status_2}=    Get Coverage status from Excalibur    20    6    14

    Verify Customer Premium with LCMS Customer data    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}    19    20



Verify Customer Premium with LCMS Customer data
    [Documentation]    Verify Customer Premium with LCMS Customer data
    [Arguments]    ${ins_name}    ${cust_name1}    ${cust_name2}    ${coverage_status1}    ${coverage_status2}    ${row1}    ${row2}
    
    ${ins_list}=    Get From Dictionary    ${customer_data}     ${ins_name}
    ${ins_list_len}=    Get Length  ${ins_list}

    FOR     ${index}     IN RANGE  0   ${ins_list_len}
    ${item}=        Get From List       ${ins_list}   ${index}
    
    Run Keyword IF    """${item['Customer_Name'].upper()}"""=="""${cust_name1.upper()}"""    Verify Customer Premium and New Insurance or security type for each borrower    ${item}    ${ins_name}   ${row1}    ${coverage_status1}
    
    Run Keyword IF    """${item['Customer_Name'].upper()}"""=="""${cust_name2.upper()}"""    Verify Customer Premium and New Insurance or security type for each borrower    ${item}    ${ins_name}   ${row2}    ${coverage_status2}               
        
      
    END


Verify Customer Premium and New Insurance or security type for each borrower
    [Documentation]     Verify Customer Premium for each borrower
    [Arguments]    ${item}    ${ins_name}    ${startRow}    ${coverage_status} 
    
    ${premium_value}=    Verify Customer Premium for each borrower    ${item}    ${ins_name}    ${startRow}
    Run Keyword If   """${coverage_status.upper()}"""=="""PENDING APPLICATION""" and """${premium_value}""">"""0"""     Verify New Insurance or security type for each borrower     ${item}    ${ins_name}    ${startRow}    MY
    Run Keyword If   """${coverage_status.upper()}"""=="""PENDING WAIVER""" and """${premium_value}"""<="""0"""     Verify New Insurance or security type for each borrower     ${item}    ${ins_name}    ${startRow}    MN
    Run Keyword If   """${coverage_status.upper()}"""=="""JOINT-CIBC""" and """${premium_value}""">"""0"""    Verify New Insurance or security type for each borrower     ${item}    ${ins_name}    ${startRow}    MB
    

Verify Customer Premium for each borrower    
    [Documentation]     Verify Customer Premium for each borrower
    [Arguments]    ${item}    ${ins_name}     ${startRow}    
    
    excalibur_set_text        ${startRow}    2    3        #14  2
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    ${cust_prem_value}=       excalibur_get_text    21    37   8    #9  31
    Take Screenshot and Add to E2E Test Report Word document
    ${cust_prem_value_trunc}=     Strip String     ${cust_prem_value}
    ${prem_value}=        Run Keyword If    "${cust_prem_value_trunc}"==""    Set Variable    0.00
    ...    ELSE       Set Variable     ${cust_prem_value_trunc}     
    Log    ${cust_prem_value_trunc}
    Log    """${item['Premium_Value']}"""=="""${prem_value}"""
    Run Keyword If    """${item['Premium_Value']}"""=="""${prem_value}"""   Log     Customer Premium for ${ins_name} in EXCALIBUR found as expected
    ...        ELSE     Fail          Customer Premium for ${ins_name} in EXCALIBUR not found as expected
    
    Press F12 key in Excalibur
    Run Keyword IF    """${ins_name}"""=="""MCI"""     Run Keywords
    ...            keyboard.Press And Release   PAGE_DOWN
    ...    AND     Sleep     ${minSleep}
    
    [Return]    ${prem_value}

 
    

Get New Insurance or security type for each borrower
    [Documentation]     Get New Insurance or security type for each borrower
    [Arguments]        ${startRow}    
    
    excalibur_set_text        ${startRow}    2    8        #14  2
    Take Screenshot and Add to E2E Test Report Word document
    Press Enter Key in Excalibur
    ${NewIns_Security_value}=       excalibur_get_text    20    31   2    #9  31
    Take Screenshot and Add to E2E Test Report Word document
    ${NewIns_Security_value_trunc}=     Strip String     ${NewIns_Security_value}   
    
    [Return]    ${NewIns_Security_value_trunc}   
    

Verify New Insurance or security type for each borrower
    [Documentation]     Verify New Insurance or security type MY for each borrower  
    [Arguments]    ${item}    ${ins_name}    ${startRow}    ${expected_Value}        
     
    ${newIns_securityValue}=    Get New Insurance or security type for each borrower     ${startRow}
    Run Keyword If   """${newIns_securityValue}"""=="""${expected_Value}"""   Log     New Insurance or security type for ${ins_name} in EXCALIBUR found as expected
    ...        ELSE     Fail          New Insurance or security type for ${ins_name} in EXCALIBUR not found as expected
    
    Press F12 key in Excalibur
    excalibur_set_text        23    24    2        #14  2
    Press Enter Key in Excalibur
    Run Keyword IF    """${ins_name}"""=="""MCI"""     Run Keywords
    ...            keyboard.Press And Release   PAGE_DOWN
    ...    AND     Sleep     ${minSleep}


Verify MLI Expiry Date in Excalibur
    [Documentation]     Verify MLI coverage Status in Excalibur
    ${ins_name}=       Get Text from Excalibur    12    4    3
    ${cust_name1}=    Get Text from Excalibur    13    23    13
    ${cust_name2}=    Get Text from Excalibur    14    23    13
    ${expiry_date_1}=    Get Coverage status from Excalibur    13    52    12
    ${expiry_date_2}=    Get Coverage status from Excalibur    14    52    12
    Verify Expiry Date with Customer Age    ${ins_name}    ${cust_name1}    ${cust_name2}    ${expiry_date_1}    ${expiry_date_2}

Verify MCI Expiry Date in Excalibur
    [Documentation]     Verify MCI coverage Status in Excalibur
     keyboard.Press And Release   PAGE_DOWN
    Sleep     ${minSleep}
    Take Screenshot and Add to E2E Test Report Word document
    ${ins_name}=       Get Text from Excalibur    9    4    3
    ${cust_name1}=    Get Text from Excalibur    10    23    13
    ${cust_name2}=    Get Text from Excalibur    11    23    13
    ${expiry_date_1}=    Get Coverage status from Excalibur    10    52    12
    ${expiry_date_2}=    Get Coverage status from Excalibur    11    52    12
    Verify Expiry Date with Customer Age    ${ins_name}    ${cust_name1}    ${cust_name2}    ${expiry_date_1}    ${expiry_date_2}
  
  
Verify MDI Expiry Date in Excalibur
    [Documentation]     Verify MDI coverage Status in Excalibur
    ${ins_name}=       Get Text from Excalibur    15    4    3
    ${cust_name1}=    Get Text from Excalibur    16    23    13
    ${cust_name2}=    Get Text from Excalibur    17    23    13
    ${expiry_date_1}=    Get Coverage status from Excalibur    16    52    12
    ${expiry_date_2}=    Get Coverage status from Excalibur    17    52    12
    Verify Expiry Date with Customer Age    ${ins_name}    ${cust_name1}    ${cust_name2}    ${expiry_date_1}    ${expiry_date_2}
 
   
Verify MDI plus Expiry Date in Excalibur
    [Documentation]     Verify MDI Plus coverage Status in Excalibur
    ${ins_name}=       Get Text from Excalibur    18    4    3
    ${cust_name1}=    Get Text from Excalibur    19    23    13
    ${cust_name2}=    Get Text from Excalibur    20    23    13
    ${expiry_date_1}=    Get Coverage status from Excalibur    19    52    12
    ${expiry_date_2}=    Get Coverage status from Excalibur    20    52    12
    Verify Expiry Date with Customer Age    ${ins_name}    ${cust_name1}    ${cust_name2}    ${expiry_date_1}    ${expiry_date_2}


Verify Expiry Date with Customer Age
    [Documentation]    Verify Expiry Date with Customer Age
    [Arguments]    ${ins_name}    ${cust_name1}    ${cust_name2}    ${expiry_date_1}    ${expiry_date_2}
    
    ${ins_list}=    Get From Dictionary    ${customer_data}     ${ins_name}
    ${ins_list_len}=    Get Length  ${ins_list}
    FOR     ${index}     IN RANGE  0   ${ins_list_len}
    ${item}=        Get From List       ${ins_list}   ${index}

    Run Keyword IF    """${item['Customer_Name'].upper()}"""=="""${cust_name1.upper()}"""    Verify Expiry Date for each borrower    ${cust_DOB['${cust_name1.upper()}']}      ${ins_name}     ${expiry_date_1}     ${cust_name1}

    Run Keyword IF    """${item['Customer_Name'].upper()}"""=="""${cust_name2.upper()}"""    Verify Expiry Date for each borrower   ${cust_DOB['${cust_name2.upper()}']}    ${ins_name}    ${expiry_date_2}     ${cust_name2}
        
    END
    # keyboard.Press And Release   F12


Verify Expiry Date for each borrower    
    [Documentation]     Verify Coverage Status for each borrower
    [Arguments]    ${DOB}    ${ins_name}     ${expiry_date}    ${cust_name}
    
         
    ${years}    Set Variable    0
    ${years} =    Run Keyword IF    """${ins_name}"""=="""MLI""" or """${ins_name}"""=="""MCI"""     Set Variable    70
   	...               ELSE IF    """${ins_name}"""=="""MDI""" or """${ins_name}"""=="""MDI+"""     Set Variable    65
    ${expected_date}=    Calculate Expiry Date for each borrower      ${DOB}    ${years}
    Run Keyword If    """${expected_date}"""=="""${expiry_date}"""   Log     Expiry Date for ${ins_name} in EXCALIBUR found as expected for ${cust_name}
    ...        ELSE     Fail          Expiry Date for ${ins_name} in EXCALIBUR not found as expected for ${cust_name}
    


Get Text from Excalibur
    [Documentation]     Get Text from Excalibur
    [Arguments]   ${startRow}    ${startColumn}    ${lengthActualText}
    
    ${exc_text}=    excalibur_get_text    ${startRow}    ${startColumn}    ${lengthActualText}
    ${exc_text_trunc}=     Strip String     ${exc_text}    mode=right   
    
    [Return]    ${exc_text_trunc}


Press F12 key in Excalibur  
    keyboard.Press And Release   F12
    Sleep     ${minSleep}  
    
    
 
Get Coverage status from Excalibur
    [Documentation]     Get Insurance name from Excalibur
    [Arguments]   ${startRow}    ${startColumn}    ${lengthActualText}
    
    ${coverage_status}=    excalibur_get_text    ${startRow}    ${startColumn}    ${lengthActualText}
    ${coverage_status_trunc}=     Strip String     ${coverage_status}    mode=right 
    
    Run Keyword IF    "${coverage_status_trunc}"=="Pending App"  Set Test Variable    ${coverage_status_trunc}    Pending Application     
    
    [Return]    ${coverage_status_trunc}
    

Calculate Expiry Date for each borrower
    [Documentation]     Calculate Expiry Date for each borrower
    [Arguments]   ${DOB}    ${years}
   
    Log    ${DOB}
    Log    ${years}
    ${cust_expirydate_calc} =     ExcaliburUtility.addYearsToDate      ${DOB}    ${years}  
    
    [Return]    ${cust_expirydate_calc}
    

