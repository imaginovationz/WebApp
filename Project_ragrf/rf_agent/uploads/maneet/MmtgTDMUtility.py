import pandas as pd
import numpy as np
from numpy import str



def getMmtgInfoFromTDMSheetPd(excelPath, testCaseID, worksheetName):
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
    mtg_sheet_filtered = mtg_sheet[mtg_sheet['TestCaseName'].eq(testCaseID)]
    mtg_sheet_filtered = mtg_sheet_filtered.replace([np.nan], [None])
    mtg_sheet_filtered_dict = mtg_sheet_filtered.to_dict('list')
    print("Dict Without Customer Name - Pandas")
    print(mtg_sheet_filtered_dict)
    return mtg_sheet_filtered_dict


def get_mmtg_info_from_tdm_sheet_with_cust_name_pandas(Excel_path, TestCaseid, WorkSheet_Name):
    """

    Load the excel sheet and filters the "TestCaseName" for the desired value and returns a listed dictionary rows, appends first and last name field values from 'Ecif Customer' worksheet

    Parameters:
    Excel_path (str): Location of Workbook on filesystem
    TestCaseid (str): testcase Id value to search for
    WorkSheet_Name (str): the name of the Worksheet to get the values from

    Returns:

    mtg_dict (dict): dictionary of the values in the found cells -
                                    key (str): column name
                                    values (list): cell values

    """
    print("************", Excel_path, TestCaseid, WorkSheet_Name)

    mtg_dict = getMmtgInfoFromTDMSheetPd(Excel_path, TestCaseid, WorkSheet_Name)

    mtg_sheet = pd.read_excel(Excel_path, 'Ecif_Customer', dtype=str)
    mtg_sheet_filtered = mtg_sheet[mtg_sheet['TestCaseName'].eq(TestCaseid)]
    mtg_sheet_filtered = mtg_sheet_filtered.replace([np.nan], [None])
    mtg_sheet_filtered = mtg_sheet_filtered.filter(items=['First_name', 'Surname'])
    ecif_dict = mtg_sheet_filtered.to_dict('list')

    mtg_dict.update(ecif_dict)
    print("Dict with Customer Name - Pandas")
    print(mtg_dict)
    return mtg_dict






