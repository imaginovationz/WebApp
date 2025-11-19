from robot.libraries.BuiltIn import BuiltIn
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException        
from selenium.webdriver.common.by import By
from selenium.webdriver import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.ui import Select
from test.test_concurrent_futures import capture
from selenium.webdriver.chrome.webdriver import WebDriver
import traceback
import subprocess
import os
import time
from builtins import len
import sys
import random
import json
# from autoit.win import win_get_title
from SeleniumLibrary import SeleniumLibrary
import SeleniumLibrary
import openpyxl
from openpyxl import Workbook
from openpyxl import load_workbook
from openpyxl.styles import Color, PatternFill, Font, Border, Alignment
from openpyxl.styles import colors
import shutil
import datetime
from _datetime import timedelta
from keyboard import record



def get_driver():
    return BuiltIn().get_library_instance('SeleniumLibrary')

def xpath_checked(xpath):
    """
        For checking is an Insurance is selected or not
    """
    selenium_library = get_driver()
    try:
        if (selenium_library.driver.find_element_by_xpath(xpath+"/preceding::input[1]")) in ['true',True]:
            return True
        if (selenium_library.driver.find_element_by_xpath(xpath).get_attribute('checked')) in ['true',True]:
            return True
        if (selenium_library.driver.find_element_by_xpath(xpath+"/preceding::input[1]").get_attribute('checked')) in ['true',True]:
            return True
        return False
    except:
        import sys
        traceback.print_exception(*sys.exc_info())
        return False
    
def fn_validate_xpath(xpath):
    """
        Check if given xpath exist in the page.
        Input: xpath ->
        Return status pass or Fail
    """
    
    try:
        selenium_library = get_driver()
        selenium_library.driver.find_element_by_xpath(xpath)
    except NoSuchElementException:
        return False
    return True

def fn_click_unexpected_button(xpath):
    try:
        if fn_validate_xpath(xpath):
            selenium_library = get_driver() 
            selenium_library.driver.find_element_by_xpath(xpath).click()
            time.sleep(3)
    except:
        import sys
        traceback.print_exception(*sys.exc_info())
            

def fn_retrieve_value_from_xpath(xpath):
    """
        This function is for retrieving the values from the XPath
    """
    status = fn_validate_xpath(xpath)    
    value = "None"
    
    if status != False:
        try:
            selenium_library = get_driver()
            value = selenium_library.driver.find_element_by_xpath(xpath).get_attribute("value")
            if value == None:
                value = selenium_library.driver.find_element_by_xpath(xpath).text
        except:
            import sys
            traceback.print_exception(*sys.exc_info())
            return str(value)
        return str(value)
    else:
        value = "Does not exist"
        return str(value)
    
def Highlight_field(element):
    """Highlights element. It will work support xpath"""
    try:
        selenium_library = get_driver()
        js_element = selenium_library.driver.find_element_by_xpath(element)
#         selenium_library.driver.execute_script("arguments[0].setAttribute('style','background:yellow; color:Red; border: solid 2px red')",js_element)
#         selenium_library.driver.execute_script("arguments[0].setAttribute('style','color:Red; border: solid 2px red')",js_element)
        selenium_library.driver.execute_script("arguments[0].setAttribute('style','border: solid 2px red')",js_element)
        import time 
        time.sleep(2)
    except Exception as err:
        traceback.print_exc()
        pass

def Dehighlight_field(element):
    """Change the highlighted element to original. It will work support xpath"""
    try:
        selenium_library = get_driver()
        js_element = selenium_library.driver.find_element_by_xpath(element)
#         selenium_library.driver.execute_script("arguments[0].setAttribute('style','background:#fff')",js_element)
#         selenium_library.driver.execute_script("arguments[0].setAttribute('style','color: default; border: none')",js_element)
        selenium_library.driver.execute_script("arguments[0].setAttribute('style','border: none')",js_element)
        import time 
        time.sleep(2)
    except Exception as err:
        traceback.print_exc()
        pass

def create_return_test_case_directory(test_case_name):
    """
        It will create test case directory based on below rules.
        If test case name is more than 60 characters then folder name will be  <first 50 characters>__<last 10 characters>
        e.g. IP: "TC27 EN HPP PLC MTGLI Waive CI Cancel DIP Apply DIP Q1 YesTC27 DI WaiveTC27PLC LI ErrorPLC DI Apply PLC DI Q1 No PLC DI Q2 No PLC DI Q3 No TC27"
             OP: TC27 EN HPP PLC MTGLI Waive CI Cancel DIP Apply DI__Q3 No TC27 
    """
    try:
        folder_name = test_case_name
        if len(test_case_name) > 60:
            folder_name =  str(test_case_name[:50])+"__"+test_case_name[-10:]
        
        if not os.path.exists(os.path.join(os.getcwd(),'Logs\\'+folder_name)):
            os.makedirs(os.path.join(os.getcwd(),'Logs\\'+folder_name))
        
        return  folder_name
            
    except Exception as err:
        traceback.print_exc()
        return test_case_name    
    
def convert_dict_string_to_dict(dict_string):
    try:
        converted_dict = json.loads(dict_string)
        return converted_dict
    except:
        import sys
        traceback.print_exception(*sys.exc_info())
        return {}    

def fn_extract_class_number_from_notification(Notification_Text):
    if Notification_Text.strip() == 'Unable to process for auto adjudication due to technical error. Resubmit application at a later time.' or 'Failure during reservation of CLASS Number' in Notification_Text.strip():
        return 'AUTO ADJUDICATION ERROR'
    x = Notification_Text.split(" - ")
    if len(x) == 1:
        return 'NOTIFICATION ERROR'
    if x[2].strip() == 'MTG':
        MTG_Class_Number = str(x[3])
        number_list = [MTG_Class_Number, MTG_Class_Number]
    else:
        PLC_Class_Number = str(x[3])
        MTG_Class_Number = str(x[6])[0:9]
        number_list = [PLC_Class_Number, MTG_Class_Number]
    print(x)
    return number_list 
    
def convert_dict_string_to_dict(dict_string):
    try:
        return json.loads(dict_string) 
    except:
        import sys
        traceback.print_exception(*sys.exc_info())
        return {}
    
def validate_Liability_data_in_API_request(LiabData, requestData):
#     cust_keys = LiabData.keys()
#     for custKey in cust_keys:
#         custLiabData = LiabData[custKey]
    print("LiabData",LiabData)
    print("requestData",requestData)
    

def zoom_level(zoom_level):
    """
        for setting zoom
    """
    selenium_library = get_driver()
    try:
        selenium_library.driver.execute_script(f'document.body.style.zoom = "{zoom_level}%";')
    except:
        import sys
        traceback.print_exception(*sys.exc_info())
        return {}    
    

def validate_elements_visible_and_clickable(driver, xpaths, screenshot_func, timeout=10):
    """
    Validates that all elements specified by their XPaths are visible and clickable.
    Takes a screenshot using the provided screenshot_func for each element.
    Raises AssertionError if any element is not visible or not enabled.
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    for xpath in xpaths:
        try:
            element = WebDriverWait(driver, timeout).until(
                EC.visibility_of_element_located((By.XPATH, xpath))
            )
        except Exception:
            raise AssertionError(f"Element with xpath '{xpath}' is not visible within {timeout} seconds.")
        if not element.is_enabled():
            raise AssertionError(f"Element with xpath '{xpath}' is not enabled/clickable.")
        screenshot_func(element)


def validate_labels_with_data(driver, label_xpaths, screenshot_func, timeout=10):
    """
    Validates that all label elements specified by their XPaths are visible.
    Takes a screenshot using the provided screenshot_func for each label.
    Raises AssertionError if any label is not visible.
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    for xpath in label_xpaths:
        try:
            element = WebDriverWait(driver, timeout).until(
                EC.visibility_of_element_located((By.XPATH, xpath))
            )
        except Exception:
            raise AssertionError(f"Label with xpath '{xpath}' is not visible within {timeout} seconds.")
        screenshot_func(element)


def expand_first_liability_row(driver, timeout=10):
    """
    Expands the first liability row by clicking the first expand icon.
    Raises AssertionError if the expand icon is not found or not clickable.
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    xpath = "(//span[contains(@class,'expand-icon')])[1]"
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.XPATH, xpath))
        )
        element.click()
    except Exception:
        raise AssertionError("Could not expand the first liability row (expand icon not clickable).")


def add_client_volunteered_liability_and_validate_labels(driver, form_label_xpaths, screenshot_func, add_liabilities_xpath, add_liabilities_header_xpath, timeout=10):
    """
    Clicks 'Add Liabilities', waits for the form, validates all form labels, and takes screenshots.
    Raises AssertionError if any step fails.
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    try:
        add_liabilities_link = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.XPATH, add_liabilities_xpath))
        )
        add_liabilities_link.click()
    except Exception:
        raise AssertionError("Could not click 'Add Liabilities' link.")

    try:
        header = WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((By.XPATH, add_liabilities_header_xpath))
        )
        screenshot_func(header)
    except Exception:
        raise AssertionError("Add Liabilities form header not visible after clicking link.")

    for xpath in form_label_xpaths:
        try:
            label = WebDriverWait(driver, timeout).until(
                EC.visibility_of_element_located((By.XPATH, xpath))
            )
        except Exception:
            raise AssertionError(f"Form label with xpath '{xpath}' is not visible within {timeout} seconds.")
        screenshot_func(label)
