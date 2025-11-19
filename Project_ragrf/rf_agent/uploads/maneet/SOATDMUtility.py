import win32com.client
import time
import pandas as pd
import numpy as np
from numpy import str
from openpyxl import load_workbook


def getDMInfoFromTDMSheetPd(excelPath, testCaseID, worksheetName):
    """

    Load the excel sheet and filters the "TestCaseName" for the desired value and returns a listed dictionary rows

    Parameters:
    excelPath (str): Location of Workbook on filesystem
    testCaseID (str): testcase Id value to search for
    worksheetName (str): the name of the Worksheet to get the values from

    Returns:

    mtg_sheet_filtered_dict (dict): dictionary of the values in the found cells -
                                    key (str): column name
                                    values (list): cell values

    """
    mtg_sheet = pd.read_excel(excelPath, worksheetName, dtype=str)
    mtg_sheet_filtered = mtg_sheet[mtg_sheet['TestCaseID'].eq(testCaseID)]
    mtg_sheet_filtered = mtg_sheet_filtered.replace([np.nan], [None])
#     mtg_sheet_filtered_list = mtg_sheet_filtered.to_dict('list')
    mtg_sheet_filtered_list = mtg_sheet_filtered.to_numpy().tolist()
    print("Dict Without Customer Name - Pandas")
    print(mtg_sheet_filtered)
    print(mtg_sheet_filtered_list)
    return mtg_sheet_filtered_list



