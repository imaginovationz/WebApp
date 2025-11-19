import os
import subprocess
import re
import sys

import requests
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService

requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)
os.environ['WDM_SSL_VERIFY'] = '0'


def create_chrome_driver_and_get_path():
    chrome_driver_path = ChromeDriverManager().install()
    return chrome_driver_path

currentdir = os.path.dirname(os.path.realpath(__file__))
parentdir = os.path.dirname(currentdir)
sys.path.append(parentdir)
from Configuration import TestConfig
from Configuration.TestConfig import Chrome_Driver_Folder_Location

def get_chrome_driver_path():
    import win32api
    try:
        chrome_paths = [
            r'C:\Program Files\Google\Chrome\Application\chrome.exe',
            r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
        ]
        chrome_path = None
        for path in chrome_paths:
            if os.path.exists(path):
                chrome_path = path
                break

        if not chrome_path:
            raise FileNotFoundError("Chrome executable not found.")

        info = win32api.GetFileVersionInfo(chrome_path, '\\')
        # https://discussions.unity.com/t/bitwise-operation-on-integers-what-does-x-16-and-x-0xffff-do-numerically/784442/3
        # shift right by 16 bits
        chrome_major_version = info['FileVersionMS'] >> 16
        chrome_driver_path = f'{Chrome_Driver_Folder_Location}\\v{chrome_major_version}\\chromedriver.exe'
        return chrome_driver_path
    except Exception as e:
        print(f"Error getting Chrome version: {e}")
        return None

def validate_md189x_pdf_contains_fields(pdf_path):
    """
    Validate that the MD189X PDF letter contains required fields:
    1. Fixed Rate Product Change Frequency
    2. Posted Rate
    3. Adjustment Rate
    4. Discretionary Discount Rate
    5. Total Discount Rate

    Args:
        pdf_path (str): Path to the downloaded MD189X PDF letter.

    Raises:
        AssertionError: If any required field is missing in the PDF text.
    """
    import os
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"MD189X PDF not found at: {pdf_path}")

    # Use PyPDF2 (assumed available) for PDF text extraction
    from PyPDF2 import PdfReader

    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    required_fields = [
        "Fixed Rate Product Change Frequency",
        "Posted Rate",
        "Adjustment Rate",
        "Discretionary Discount Rate",
        "Total Discount Rate"
    ]
    missing = [field for field in required_fields if field not in text]
    if missing:
        raise AssertionError(f"MD189X PDF is missing required fields: {', '.join(missing)}")

# Register for Robot Framework
def Validate_MD189X_PDF_Contains_Fields(pdf_path):
    validate_md189x_pdf_contains_fields(pdf_path)
