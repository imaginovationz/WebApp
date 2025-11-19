from robot.libraries.BuiltIn import BuiltIn
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

import os
import traceback
import sys
import json
import string
import ast
import time


def get_driver():
    """
                For retrieving an instance of Selenium Web Driver
    """
    return BuiltIn().get_library_instance('SeleniumLibrary')


currentdir = os.path.dirname(os.path.realpath(__file__))
parentdir = os.path.dirname(currentdir)
sys.path.append(parentdir)
from Configuration import TestConfig
from Utilities.DatabaseUtility import load_to_json
from Configuration.TestConfig import DB_HOST_NAME, DB_PORT_NUMBER, DB_SERVICE_NAME, DB_SCHEMA_DMRTL, DB_SCHEMA_CWL, DB_ADJ_APP, DB_SECURITY_REA, DB_Application, DB_Applicant, DB_USER_NAME, DB_PASSWORD,  \
    ORACLE_CLIENT_32_DEPENDECY, ORACLE_CLIENT_64_DEPENDECY, iMin

# ENV_URL_EN, ENV_URL_FR, DEF_ENV_URL, FFMPEG_PATH, RECORD_SCREEN, SSI_Mapping_File

MINIMUM_WAIT = int(iMin.strip(string.ascii_letters))


def fn_list_down_frames():
    """
        Function to list down all the frames.
    """
    selenium_library = get_driver()
    # selenium_library.driver.switch_to.default_content()
    el = selenium_library.driver.find_elements(By.XPATH, '//iframe')
    i = 0
    for x in el:
        i = i + 1
        try:
            print(" Frame  " + str(i) + " " + str(x.get_attribute("id")))
            print(" Frame  " + str(i) + " " + str(x.get_attribute("name")))
        except:
            pass


def fn_check_task_table_return_row_with_match_data(table_class_name, **task_details):
    """
        Iterate over given table and check if given string is present or not
        Input: table_class_name -> css selector for table e.g. table.af_table_content
               task_details   -> text to checked
        Return row with given data.
    """
    TaskName = TaskStatus = TaskQueue = QueueOwner = ""
    for key, value in task_details.items():
        if key == "TaskName":
            TaskName = value
        if key == "TaskStatus":
            TaskStatus = value
        if key == "TaskQueue":
            TaskQueue = value
        if key == "QueueOwner":
            QueueOwner = value

    print("Passed TaskName:{0} , TaskStatus: {1} , TaskQueue:{2} , QueueOwner:{3} ".format(TaskName, TaskStatus,
                                                                                           TaskQueue, QueueOwner))

    selenium_library = get_driver()

    table_element = selenium_library.driver.find_element_by_css_selector(table_class_name)
    row_cnt = 1
    for row in table_element.find_elements_by_css_selector('tr'):
        row_data = ""
        for cell in row.find_elements_by_tag_name('td'):
            row_data = row_data + ":" + str(cell.text).strip()
        print(row_data)

        if (TaskStatus == "[Dont care]" and TaskQueue == "[Dont care]" and QueueOwner == "[Dont care]"):
            if TaskName in row_data.strip():
                return row_cnt
                break
        elif (TaskQueue == "[Dont care]" and QueueOwner == "[Dont care]"):
            if ((TaskName in row_data.strip()) and (TaskStatus in row_data.strip())):
                return row_cnt
                break
        elif (QueueOwner == "[Dont care]"):
            if ((TaskName in row_data.strip()) and (TaskStatus in row_data.strip()) and (
                    TaskQueue in row_data.strip())):
                return row_cnt
                break
        else:
            if ((TaskName in row_data.strip()) and (TaskStatus in row_data.strip()) and (
                    TaskQueue in row_data.strip()) and (QueueOwner in row_data.strip())):
                return row_cnt
                break
        row_cnt += 1
    return row_cnt


def fn_Update_Work_Item(TaskName, Complete_all_Work_Item, Work_Item_Json):
    """
        This is generic Function to update work item. First argument is Task Name,
        Second argument is to specifify whether we want to update all work Item to Complete. Input should be either Yes/No
        Third argument should be in JSON Format. And if we want to update specific work Item
    """
    selenium_library = get_driver()
    if (TaskName in ["Document Generation", "Document Generation"]):
        print("Received Task Name", TaskName)
        if (Complete_all_Work_Item in ["Yes", "true", True]):
            complete_button_xpath = '//input[contains(@onclick,"evaluateWorkItemSubmitEnabling")]'
            element_count = len(selenium_library.driver.find_elements_by_xpath(complete_button_xpath))
            for i in range(1, element_count, 2):
                BuiltIn().run_keyword("SeleniumLibrary.Wait Until Element Is Enabled",
                                      "({0})[{1}]".format(complete_button_xpath, i))
                BuiltIn().run_keyword("SeleniumLibrary.Click Element", "({0})[{1}]".format(complete_button_xpath, i))
        else:
            if (Work_Item_Json not in ['[Dont care]', '[Don\'t care]']):
                _expected_op_json = load_to_json(Work_Item_Json)
                for tmp_record in _expected_op_json:  # iterate each record of user input
                    print(tmp_record)
                    work_item = work_staus = ""
                    for key, value in tmp_record.items():
                        if key == "workItem":
                            work_item = str(value)
                        if key == "requiredStatus":
                            work_staus = str(value)
                    print(work_item, work_staus)
                    if work_staus in ["Outstanding", "Outstanding"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[2]/tbody/descendant::input".format(
                                                  work_item))
                    if work_staus in ["Completed", "completed"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[1]/tbody/descendant::input".format(
                                                  work_item))

    if (TaskName in ["Scrubbing", "Disbursement"]):
        print("Received Task Name", TaskName)
        if (Complete_all_Work_Item in ["Yes", "true", True]):
            complete_button_xpath = '//input[contains(@onclick,"evaluateWorkItemSubmitEnabling")]'
            element_count = len(selenium_library.driver.find_elements_by_xpath(complete_button_xpath))
            print("---------------------")
            print(element_count)
            for i in range(1, element_count, 3):
                work_item_status = BuiltIn().run_keyword("BuiltIn.Run keyword and return status",
                                                         "SeleniumLibrary.Element Should Be Enabled",
                                                         "({0})[{1}]".format(complete_button_xpath, i))
                if work_item_status == True:
                    BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                          "({0})[{1}]".format(complete_button_xpath, i))
        #                 BuiltIn().run_keyword("SeleniumLibrary.Wait Until Element Is Enabled","({0})[{1}]".format(complete_button_xpath,i))
        #                 BuiltIn().run_keyword("SeleniumLibrary.Click Element","({0})[{1}]".format(complete_button_xpath,i))
        if (Complete_all_Work_Item in ["No", "Not Required"]):
            complete_button_xpath = '//input[contains(@onclick,"evaluateWorkItemSubmitEnabling")]'
            element_count = len(selenium_library.driver.find_elements_by_xpath(complete_button_xpath))
            print(element_count)
            for i in range(1, element_count, 3):
                BuiltIn().run_keyword("SeleniumLibrary.Wait Until Element Is Enabled",
                                      "({0})[{1}]".format(complete_button_xpath, i))
                BuiltIn().run_keyword("SeleniumLibrary.Click Element", "({0})[{1}]".format(complete_button_xpath, i))
        if (Complete_all_Work_Item in ["Outstanding"]):
            complete_button_xpath = '//input[contains(@onclick,"evaluateWorkItemSubmitEnabling")]'
            element_count = len(selenium_library.driver.find_elements_by_xpath(complete_button_xpath))
            print(element_count)
            for i in range(1, element_count, 3):
                BuiltIn().run_keyword("SeleniumLibrary.Wait Until Element Is Enabled",
                                      "({0})[{1}]".format(complete_button_xpath, i))
                BuiltIn().run_keyword("SeleniumLibrary.Click Element", "({0})[{1}]".format(complete_button_xpath, i))
        else:
            if (Work_Item_Json not in ['[Dont care]', '[Don\'t care]']):
                _expected_op_json = load_to_json(Work_Item_Json)
                for tmp_record in _expected_op_json:  # iterate each record of user input
                    print(tmp_record)
                    work_item = work_staus = ""
                    for key, value in tmp_record.items():
                        if key == "workItem":
                            work_item = str(value)
                        if key == "requiredStatus":
                            work_staus = str(value)
                    print(work_item, work_staus)
                    if work_staus in ["Completed", "completed"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[1]/tbody/descendant::input".format(
                                                  work_item))
                    if work_staus in ["Not Required"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[2]/tbody/descendant::input".format(
                                                  work_item))
                    if work_staus in ["Outstanding", "Outstanding"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[3]/tbody/descendant::input".format(
                                                  work_item))

    if (TaskName in ["Pre Advancing"]):
        print("Received Task Name", TaskName)
        if (Complete_all_Work_Item in ["Yes", "true", True, "Completed"]):
            #             complete_button_xpath = "//span[contains(@style,\"MARGIN-LEFT: 20px\")]"
            complete_button_xpath = "//span[contains(@style,\"MARGIN-LEFT: 20px\") or contains(@style,\"margin-left:20px\")]"
            element_count = len(selenium_library.driver.find_elements_by_xpath(complete_button_xpath))
            print("---------------------")
            print(element_count)
            for i in range(1, int(element_count) + 1, 1):
                BuiltIn().run_keyword_and_ignore_error("SeleniumLibrary.Wait Until Element Is Enabled", "({0})[{1}]".format(
                    complete_button_xpath + "/following::table[1]/tbody/descendant::input", i))
                BuiltIn().run_keyword_and_ignore_error("SeleniumLibrary.Click Element", "({0})[{1}]".format(
                    complete_button_xpath + "/following::table[1]/tbody/descendant::input", i))
        if (Complete_all_Work_Item in ["No", "Not Required"]):
            #             complete_button_xpath = "//span[contains(@style,\"MARGIN-LEFT: 20px\")]"
            complete_button_xpath = "//span[contains(@style,\"MARGIN-LEFT: 20px\") or contains(@style,\"margin-left:20px\")]"
            element_count = len(selenium_library.driver.find_elements_by_xpath(complete_button_xpath))
            print("---------------------")
            print(element_count)
            for i in range(1, int(element_count) + 1, 1):
                BuiltIn().run_keyword("SeleniumLibrary.Wait Until Element Is Enabled", "({0})[{1}]".format(
                    complete_button_xpath + "/following::table[2]/tbody/descendant::input", i))
                BuiltIn().run_keyword("SeleniumLibrary.Click Element", "({0})[{1}]".format(
                    complete_button_xpath + "/following::table[2]/tbody/descendant::input", i))
        if (Complete_all_Work_Item in ["Outstanding"]):
            #             complete_button_xpath = "//span[contains(@style,\"MARGIN-LEFT: 20px\")]"
            complete_button_xpath = "//span[contains(@style,\"MARGIN-LEFT: 20px\") or contains(@style,\"margin-left:20px\")]"
            element_count = len(selenium_library.driver.find_elements_by_xpath(complete_button_xpath))
            print("---------------------")
            print(element_count)
            for i in range(1, int(element_count) + 1, 1):
                BuiltIn().run_keyword("SeleniumLibrary.Wait Until Element Is Enabled", "({0})[{1}]".format(
                    complete_button_xpath + "/following::table[3]/tbody/descendant::input", i))
                BuiltIn().run_keyword("SeleniumLibrary.Click Element", "({0})[{1}]".format(
                    complete_button_xpath + "/following::table[3]/tbody/descendant::input", i))
        else:
            if (Work_Item_Json not in ['[Dont care]', '[Don\'t care]']):
                _expected_op_json = load_to_json(Work_Item_Json)
                for tmp_record in _expected_op_json:  # iterate each record of user input
                    print(tmp_record)
                    work_item = work_staus = ""
                    for key, value in tmp_record.items():
                        if key == "workItem":
                            work_item = str(value)
                        if key == "requiredStatus":
                            work_staus = str(value)
                    print(work_item, work_staus)
                    if work_staus in ["Completed", "completed"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[1]/tbody/descendant::input".format(
                                                  work_item))
                    if work_staus in ["Not Required"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[2]/tbody/descendant::input".format(
                                                  work_item))
                    if work_staus in ["Outstanding", "Outstanding"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[3]/tbody/descendant::input".format(
                                                  work_item))
                    if work_staus in ["Failed", "Outstanding"]:
                        BuiltIn().run_keyword("SeleniumLibrary.Click Element",
                                              "//span[contains(text(),\"{0}\")]/following::table[4]/tbody/descendant::input".format(
                                                  work_item))
  
  
def fetch_db_data(sqlquery):  
    try:
        print("Making DB connection call")
        cursor = create_db_connection(DB_HOST_NAME, DB_PORT_NUMBER,DB_USER_NAME, DB_PASSWORD, DB_SERVICE_NAME)
        table_row_lst=[]
        #sqlquery="select * from cwl_sit1.subject_property fetch first 2 rows only"
        sqlquery = sqlquery.replace(";","")
        cursor.execute(sqlquery)
        cursor.rowfactory = lambda *args: dict(zip([d[0] for d in cursor.description], args))
        rowval = cursor.fetchone()
        while rowval: 
            table_row_lst.append(rowval)
            rowval = cursor.fetchone()
        close_db_connection(cursor,DB_SERVICE_NAME)
        print(table_row_lst)
        return  table_row_lst
    except Exception as ex:
        print("Exception in fetch_db_data")
        print(traceback.format_exc())
        print(sys.exc_info()[2])
        raise   Exception("Database_Exception in method fetch_db_data for Databases service" +  DB_SERVICE_NAME+ ". "+str(ex))  
    
    
    
def compare_db_result(sql_query_op,expected_op):
    """
    It will compare the result of sql query with the passed the parameter.Both the value should be in json
    Parameters:
                sql_query_op
                expected_op - should be in a list
    Returns: true/false
    """
    _sql_query_json = load_to_json(sql_query_op)
    print("SQL QUERY OP:"+str(_sql_query_json))
    #If ask is to check if record is null, then it will iterate over all db record and check if all have value as null. If any record have some data then it will fail
    if(isStringNullEmpty(expected_op)):
        for tmp_record in _sql_query_json:
            for key,value in tmp_record.items():
                if (isStringNullEmpty(value)==False):
                    return False
        return True
    #other part needs to be worked
    else:
        _expected_op_json = load_to_json(expected_op)
        _record_match = False
        for tmp_record in _expected_op_json:   #iterate each record of user input
            for key,value in tmp_record.items():
                __user_value = str(value)
                print(__user_value)
                __user_key = str(key)
                print(__user_key)


                if(str(__user_value) not in ["NA","na","[Don't Care]"]):  #checks for value only if expected output is not NA. Given input should be NA if query gives no output i.e:[] 
                    print("Checking for value:"+str(__user_value))
                
                    for tmp_record in _sql_query_json:  #iterate each record from sql query to match record
                        for key,value in tmp_record.items():
                            if (__user_value.strip()==str(value).strip()):
                                print("Columns:{0} & Value:{1} is matched with sql query output".format(__user_key,__user_value))
                                _record_match = True
                                break
                        else:
                            _record_match = False
                            print("Columns:{0} & Value:{1} NOT matched with sql query output".format(__user_key,__user_value))
                            continue
                        break   #break the outer loop for sql query
                else:
                     _record_match = True
                     break
                if(_record_match== False):
                    return _record_match
        return _record_match    
 
def pma_pev_or_uv_set_appoval_condition_met(Task):
    selenium_library = get_driver()
    selenium_library.driver.implicitly_wait(MINIMUM_WAIT)
    count = len(selenium_library.driver.find_elements_by_xpath("//span[text()='Conditions Added']//ancestor::tr/following-sibling::tr//select | //span[text()='Conditions ajoutées']//ancestor::tr/following-sibling::tr//select"))
#     count = len(selenium_library.driver.find_elements_by_xpath("//span[text()='Conditions Added']//ancestor::tr/following-sibling::tr//select"))
    for i in range(1, count):
        locator_status_xpath ="//span[text()='Conditions Added']//ancestor::tr/following-sibling::tr[{0}]//select | //span[text()='Conditions ajoutées']//ancestor::tr/following-sibling::tr[{0}]//select".format(i)
#         locator_status_xpath ="//span[text()='Conditions Added']//ancestor::tr/following-sibling::tr[{0}]//select".format(i)
        
        locator_status_select = Select(selenium_library.driver.find_element_by_xpath(locator_status_xpath))
        if Task == 'PMA':
            locator_status_select.select_by_value("0")
        elif Task == 'UW':
            locator_status_select.select_by_value("3")
        time.sleep(2) 
        
def pma_pev_or_uv_set_appoval_condition_met_french(Task):
    selenium_library = get_driver()
    selenium_library.driver.implicitly_wait(MINIMUM_WAIT)
    count = len(selenium_library.driver.find_elements_by_xpath("//span[text()='Conditions ajoutées']//ancestor::tr/following-sibling::tr//select"))
#     count = len(selenium_library.driver.find_elements_by_xpath("//span[text()='Conditions Added']//ancestor::tr/following-sibling::tr//select"))
    for i in range(1, count):
        locator_status_xpath ="//span[text()='Conditions ajoutées']//ancestor::tr/following-sibling::tr[{0}]//select".format(i)
#         locator_status_xpath ="//span[text()='Conditions Added']//ancestor::tr/following-sibling::tr[{0}]//select".format(i)
        
        locator_status_select = Select(selenium_library.driver.find_element_by_xpath(locator_status_xpath))
        if Task == 'PMA':
            locator_status_select.select_by_value("0")
        elif Task == 'UW':
            locator_status_select.select_by_value("3")
        time.sleep(2)
        
        
        
                
        
        
        
        
                        