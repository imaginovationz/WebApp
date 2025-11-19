
import traceback
import string
from robot.libraries.BuiltIn import BuiltIn
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui  import Select
import sys
import time
import subprocess
import tkinter as tk
import keyboard

iMin = "10s"
MINIMUM_WAIT = int(iMin.strip(string.ascii_letters))

def get_driver():
    """
            For retrieving an instance of Selenium Web Driver
    """
    return BuiltIn().get_library_instance('SeleniumLibrary')


def xpath_checked(xpath):
    """
        For checking is an Insurance is selected or not
    """
    selenium_library = get_driver()
    try:
        if (selenium_library.driver.find_element_by_xpath(xpath + "/preceding::input[1]")) in ['true', True]:
            return True
        if (selenium_library.driver.find_element_by_xpath(xpath).get_attribute('checked')) in ['true', True]:
            return True
        if (selenium_library.driver.find_element_by_xpath(xpath + "/preceding::input[1]").get_attribute('checked')) in [
            'true', True]:
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
            print(value)
            if value == None:
                value = selenium_library.driver.find_element_by_xpath(xpath).text

        except:
            traceback.print_exception(*sys.exc_info())
            return str(value)
        return str(value)
    else:
        value = "Does not exist"
        return str(value)


def fn_retrieve_value_from_dropdown_xpath(xpath):
    """
        This function is for retrieving the values from the XPath
    """
    status = fn_validate_xpath(xpath)
    value = "None"

    if status != False:
        dropdown_xpath = xpath + "/select"
        dropdown_status = fn_validate_xpath(dropdown_xpath)
        #         print("printing Drop down Status", dropdown_xpath,dropdown_status)
        try:
            if dropdown_status != False:
                selenium_library = get_driver()
                selenium_library.driver.implicitly_wait(MINIMUM_WAIT)
                BuiltIn().run_keyword("Scroll To Element", xpath)
                #                 selenium_library.driver.implicitly_wait(MINIMUM_WAIT)
                locator_status_select = Select(selenium_library.driver.find_element_by_xpath(dropdown_xpath))
                return locator_status_select.first_selected_option()
            else:
                selenium_library = get_driver()
                selenium_library.driver.implicitly_wait(MINIMUM_WAIT)
                BuiltIn().run_keyword("Scroll To Element", xpath)
                #                 selenium_library.driver.implicitly_wait(MINIMUM_WAIT)
                value = selenium_library.driver.find_element_by_xpath(xpath).get_attribute("value")
                #                 selenium_library.driver.implicitly_wait(MINIMUM_WAIT)
                if value == None:
                    value = selenium_library.driver.find_element_by_xpath(xpath).text
        except:
            traceback.print_exception(*sys.exc_info())
            return str(value)
        return str(value)
    else:
        value = "Does not exist"
        return str(value)

def copy_text_to_clipboard(txt):
    """
            This function is for copy text to Clipboard
    """
    cmd = 'echo ' + txt.strip() + '|clip'
    return subprocess.check_call(cmd, shell=True)

def upload_file_for_documentation(file_path):
    """
            This function is for uploading the file
    """
    try:
        selenium_library = get_driver()
        time.sleep(2)
        copy_text_to_clipboard(file_path.strip())

        root = tk.Tk()
        print(root.clipboard_get())
        time.sleep(2)

        keyboard.press_and_release('ctrl+v')
        keyboard.press_and_release('enter')

    except:
        return False
    return True


def logFile(msg):
    """
            This function is for logging the message to log file
    """
    import os
    from datetime import datetime
    current_time = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    cwd = os.getcwd()
    log_file = cwd + "\\log_file.txt"
    file_obj = open(log_file, "a")
    file_obj.write(current_time + "              " + msg + "\n")
    file_obj.close()