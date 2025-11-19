
import re
import json
from datetime import datetime
from robot.libraries.BuiltIn import BuiltIn

def fn_Fetch_decision_from_deal_notification(Deal_notification):
    """
            This function is for retrieving the decision from the Deal_notification
    """
    if "Application Decision - No Decision" in Deal_notification:
        return "No Decision"
    elif "Application Decision - Conditional Approved" in Deal_notification:
        return "Conditionally Approved"
    elif "Application Decision - Conditionally Approved" in Deal_notification:
        return "Conditionally Approved"
    elif "Application Decision - Decline" in Deal_notification:
        return "Decline"
    elif "Application Decision - Refer" in Deal_notification:
        return "Refer"


def splitTextToTriplet(string):
    """
            This function is to split text to Triplet
    """
    words = string.split()
    grouped_words = [' '.join(words[i: i + 3]) for i in range(0, len(words), 3)]
    return grouped_words


def fn_parse_class_number_from_notification(mmtg_type, tmp_notes):
    """
                This function is get Class Number from Deal Notification
    """
    _deal_notes = tmp_notes.split('\n')
    print(_deal_notes)
    print("test", mmtg_type)
    if mmtg_type == "mmtg":
        for tmp in _deal_notes:
            if "- MTG -" in tmp:
                text_list = re.split(r"[^a-zA-Z0-9-]", tmp)
                print(text_list)
                mmtg_class_num = [tmp_text_list for tmp_text_list in text_list if tmp_text_list.isdigit()][0]
                logFile("Parsed MMTG Class Number: {0}".format(str(mmtg_class_num)))
                #                 if  mmtg_class_num == None:
                #                     return  0
                return mmtg_class_num
    if mmtg_type == "hpp_plc":
        for tmp in _deal_notes:
            if "- HPP PLC -" in tmp:
                text_list = re.split(r"[^a-zA-Z0-9-]", tmp)
                print(text_list)
                hpp_plc_class_num = [tmp_text_list for tmp_text_list in text_list if tmp_text_list.isdigit()][0]
                logFile("Parsed hpp plc Class Number: {0}".format(str(hpp_plc_class_num)))
                #                 if  hpp_plc_class_num == None:
                #                     return  0
                return hpp_plc_class_num
    if mmtg_type == "hpp_mtg":
        for tmp in _deal_notes:
            if "HPP - MTG -" in tmp:
                text_list = re.split(r"[^a-zA-Z0-9-]", tmp)
                print(text_list)
                hpp_mmtg_class_num = [tmp_text_list for tmp_text_list in text_list if tmp_text_list.isdigit()][0]
                logFile("Parsed hpp mtg Class Number: {0}".format(str(hpp_mmtg_class_num)))
                #                 if  hpp_mmtg_class_num == None:
                #                     return  0
                return hpp_mmtg_class_num


def fetch_value_from_mmtg_deal_notification(tmp_notes, expected_value):
    """
                    This function is get TDSR, GDSR Value from Deal Notification
    """
    _deal_notes = tmp_notes.split('\n')
    print(_deal_notes)
    for tmp in _deal_notes:
        if expected_value in tmp:
            # text_list = re.split(r"[^a-zA-Z0-9-]", tmp)
            text_list = tmp.split(' ')
            for temp in text_list:
                if expected_value in temp:
                    # tdsr_mmtg = [tmp_text_list for tmp_text_list in text_list if tmp_text_list.isdigit()][0]
                    Value_list = temp.split(':')
                    expected_value_mmtg = [temp_text_list for temp_text_list in Value_list if temp_text_list][1]
                    return expected_value_mmtg


def fetch_RO_value_deal_notification(text):
    """
    This function is used to capture Rental Offset value from deal notification 
    """
    match = re.search(r'RENTAL OFFSET \(RO\)\s*\$\s*(\d+)', text)
    print(match)
    print(match.group(1))
    if match:
        return int(match.group().strip("RENTAL OFFSET (RO) $"))
        #return int(match.group(1).strip())

def fetch_CCBQFA_value_deal_notification(text):
    """
    This function is used to capture CCB QFA value from deal notification 
    """
    match = re.search(r'CCB AND/OR QFA\s*\$\s*(\d+)', text)
    print(match)
    print(match.group(1))
    if match:
        return int(match.group().strip("CCB AND/OR QFA $"))
#     return  None


# def RO_value(text):
#     return fetch_RO_value_deal_notification(text)
    
     
# def CCBQFA_value(text):
#     CCBQFA_value = fetch_CCBQFA_value_deal_notification(text)


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
    

def convertDateTime(docdatetime):
    date_obj = datetime.strptime(docdatetime, '%b %d, %Y, %I:%M:%S %p')
    
    formatted_date = date_obj.strftime('%Y%m%d')
    
    print(formatted_date)
    
    return formatted_date

def convert_numeric_string_to_integer(value):
    num = int(float(value.replace("$","").replace(",","")))
    print(num) 
    return num


def remove_percentage_symbol_and_convert_to_num(value1):
    num = BuiltIn.run_keyword("Replace String", value1, "%", "${EMPTY}")
    print(num)
    return num

def highlight_field(element):
    """Highlights element. It will work support xpath"""
    try:
        selenium_library = get_driver()
        js_element = selenium_library.driver.find_element_by_xpath(element)
        selenium_library.driver.execute_script("arguments[0].setAttribute('style','background:yellow; color:Red; border: solid 2px red')",js_element)
        import time 
        time.sleep(2)
    except Exception as err:
        traceback.print_exc()
        pass
    
def fetch_values_from_JSON(text):    
    """Helps in fetching value from JSON"""
    data = json.loads(text)    
    print(data.get("persCust")[0].get("assets")[1].get("realEstate"))
    print(data.get("persCust")[0].get("assets")[1].get("assetNumber"))
    print(data.get("persCust")[0].get("assets")[1].get("numberOfOwners"))
    income = data.get("persCust")[0].get("assets")[1].get("realEstate").get("monthlyRentalIncomeAmount")
    print(data.get("persCust")[1].get("assets")[1].get("realEstate"))
    print(data.get("persCust")[0].get("assets")[1].get("assetNumber"))
    print(data.get("persCust")[0].get("assets")[1].get("numberOfOwners"))
    income2 = data.get("persCust")[1].get("assets")[1].get("realEstate").get("monthlyRentalIncomeAmount")
    return income

# data.get("persCust")[0].get("assets")[0].get("realEstate").get("monthlyRentalIncomeAmount")
#     print(data["propertyPostalCode"])
    
    
    
