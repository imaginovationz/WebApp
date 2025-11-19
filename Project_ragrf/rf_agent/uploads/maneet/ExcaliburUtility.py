import comtypes.client

import os
import sys
import subprocess as sp
import time
import robot.api.logger as lg
from datetime import datetime


currentdir = os.path.dirname(os.path.realpath(__file__))
parentdir = os.path.dirname(currentdir)
sys.path.append(parentdir)
from Configuration.TestConfig import REFLECTION_SESSION_NAME, REFLECTION_SESSION_FOLDER,REFLECTION_PROGRAM_NAME


ROBOT_LIBRARY_SCOPE = 'GLOBAL'


def get_windows_app_obj():
    """
         This function is for getting instance of WScript.Shell COM object
    """
    try:
        wsh = comtypes.client.GetActiveObject('WScript.Shell')
    except:
        wsh = comtypes.client.CreateObject('WScript.Shell')
    return wsh


def launch_excalibur():
    """
    Keyword to launch excalibur
    """
    itimeout = 0
    try:
        extra = comtypes.client.GetActiveObject('EXTRA.SYSTEM')
        print("active")
    except:
        sp.Popen([REFLECTION_PROGRAM_NAME, REFLECTION_SESSION_FOLDER+"\\"+REFLECTION_SESSION_NAME])
        extra = comtypes.client.CreateObject('EXTRA.SYSTEM')
        print("new")
    while itimeout < 30:
        try:
            sess0 = extra.ActiveSession
        except:
            pass
        if not sess0 is None:
            screen0 = sess0.Screen
            try:
                stxt = screen0.GetString(1, 41, 7)
                if stxt == "NETWORK":
                    break
            except:
                pass
        time.sleep(1)
        itimeout += 1
    if not sess0 is None:
        return
    
    
def get_excalibur_object():
    """
    This is to get current excaliber object
    """    
    try:
        extra = comtypes.client.GetActiveObject('EXTRA.SYSTEM')
        print("active")
    except:
        extra = comtypes.client.CreateObject('EXTRA.SYSTEM')
        print("new")
    sess0 = extra.ActiveSession
    screen0 = sess0.Screen
    return screen0


def clear_field(startrow, startcol, length_of_field):
    """
    This keyword is used to set text on the application by providing the 3 arguments as follow :
    [startrow, startcol, input_text]
    Sets the text with the given coordinates.
    """
    __space = ""
    space_length = 0
    while space_length < int(length_of_field):
        __space += " "
        space_length += 1
    print(":"+__space+":")
    excalibur_set_text(startrow, startcol, __space)

def excalibur_set_text(startrow, startcol, input_text):
    """
    This keyword is used to set text on the application by providing the 3 arguments as follow :
    [startrow, startcol, input_text]
    Sets the text with the given coordinates.
    """
    screen0 = get_excalibur_object()
    time.sleep(0.2)
    screen0.PutString(input_text,startrow, startcol)
    time.sleep(0.2)
    temptxt = excalibur_get_text(startrow, startcol, len(input_text))
    print("Received text:",input_text ," Parsed text:",temptxt)
    if temptxt.lower() == input_text.lower():
        r_txt = "Text %s set." % input_text
        lg.info(r_txt, True, True)
        return
    raise AssertionError("Text %s not set." % input_text)

def excalibur_capture_and_compare_text(startrow, startcol, length_of_input_text, input_text):
    """
    This keyword is used to capture and compare text on the application by providing the 3 arguments as follow :
    [startrow, startcol, length_of_input_text, input_text]
    Gets the text with the given coordinates.
    """
    screen0 = get_excalibur_object()
    time.sleep(0.2)
    screen_text = screen0.GetString(startrow, startcol, length_of_input_text)
    time.sleep(0.2)
    lg.info(screen_text, True, True)
    lg.info(input_text, True, True)
    if screen_text == input_text:
        r_txt = "Text %s captured." % screen_text
        lg.info(screen_text, True, True)
        return
    raise AssertionError("Text %s not matched." % screen_text)


def excalibur_get_text(startrow, startcol, length_of_input_text):
    """
    This keyword requires 3 arguments which as follow: [startrow, startcol, length_of_input_text]
    Returns the text captured using above coordinates.
    """

    screen0 = get_excalibur_object()
    time.sleep(0.2)
    screen_text = screen0.GetString(startrow, startcol, length_of_input_text)
    time.sleep(0.2)
    lg.info(screen_text, True, True)
    return screen_text


def excalibur_send_keys(param1):
    """
    This keyword is used to perform keyboard operations.
    Sends keyboard keys on to the application.
    """
    wsh = get_windows_app_obj()
    print(REFLECTION_SESSION_NAME)
    print("Reflection Workspace - [{0}]".format(REFLECTION_SESSION_NAME))
    wsh.AppActivate("Reflection Workspace - [{0}]".format(REFLECTION_SESSION_NAME))
    time.sleep(0.2)
    wsh.SendKeys(param1)
    time.sleep(0.2)


def close_excalibur():
    """
        Keyword to close excalibur
    """
    os.system("TASKKILL /F /T /IM R8win.exe")
    time.sleep(1)
    os.system("TASKKILL /F /T /IM Attachmate.Emulation.Frame.exe")
    time.sleep(1)


def fetch_text_from_excalibur(start_row,start_col,length):
    """
            This Function fetches text from excalibur
    """
    screen0 = get_excalibur_object()
    time.sleep(0.2)
    screen_text = screen0.GetString(start_row,start_col,length)
    return screen_text

def addYearsToDate(datevalue,years):
    """
                This Function adds given number of years to provided date
    """
    date_str=datetime.strptime(datevalue, "%b %d, %Y")

    expected_date = date_str.replace(year=date_str.year+int(years))

    return expected_date.strftime("%b %d, %Y")
