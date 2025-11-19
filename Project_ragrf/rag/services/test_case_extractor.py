"""
Test case extraction service for parsing Excel documents with test cases
"""
import pandas as pd
import os
import sys
from typing import List, Dict, Any, Optional
import logging

# Adjust import path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.test_case import TestCase

logger = logging.getLogger(__name__)

class TestCaseExtractor:
    """Service for extracting test cases from Excel files"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def extract_from_excel(self, file_path: str) -> List[TestCase]:
        """Extract test cases from Excel file"""
        try:
            test_cases = []
            df = pd.read_excel(file_path)
            
            # Validate the expected columns are present
            required_columns = [
                "Test Case ID", "Test Case Description", "Test Step", 
                "Test Case Expected Results"
            ]
            
            # Find the actual column names that match our required ones
            # (allows for some flexibility in column naming)
            column_mapping = self._map_columns(df.columns, required_columns)
            
            if not all(col in column_mapping for col in required_columns):
                missing = [col for col in required_columns if col not in column_mapping]
                self.logger.error(f"Missing required columns in Excel: {missing}")
                return []
                
            # Process each row in the dataframe
            current_test_case = None
            current_id = None
            
            for _, row in df.iterrows():
                row_id = str(row.get(column_mapping.get("Test Case ID"), "")).strip()
                
                # Skip empty rows
                if pd.isna(row_id) or row_id == "":
                    continue
                    
                # New test case or continuation
                if row_id != current_id:
                    # Save previous test case if exists
                    if current_test_case is not None:
                        test_cases.append(current_test_case)
                        
                    # Create new test case
                    current_id = row_id
                    current_test_case = TestCase(
                        test_case_id=row_id,
                        description=str(row.get(column_mapping.get("Test Case Description"), "")).strip(),
                        steps=[],
                        expected_results=[]
                    )
                    
                    # Extract reference documents if available
                    for doc_type in ["BRD", "SID", "BID"]:
                        if doc_type in df.columns:
                            doc_value = row.get(doc_type)
                            if pd.notna(doc_value) and doc_value != "":
                                current_test_case.reference_documents[doc_type] = str(doc_value).strip()
                
                # Add test step
                step_num = len(current_test_case.steps) + 1
                step_text = str(row.get(column_mapping.get("Test Step"), "")).strip()
                
                if pd.notna(step_text) and step_text != "":
                    current_test_case.steps.append({
                        "step_num": step_num,
                        "step_text": step_text
                    })
                
                # Add expected result
                expected_result = str(row.get(column_mapping.get("Test Case Expected Results"), "")).strip()
                if pd.notna(expected_result) and expected_result != "":
                    current_test_case.expected_results.append(expected_result)
                    
                # Check for additional attributes
                for attribute in ["Priority", "Complexity", "Automated", "Regression", "Type"]:
                    if attribute in df.columns:
                        attr_value = row.get(attribute)
                        if pd.notna(attr_value) and attr_value != "":
                            if attribute == "Priority":
                                current_test_case.priority = str(attr_value).strip()
                            elif attribute == "Complexity":
                                current_test_case.complexity = str(attr_value).strip()
                            elif attribute == "Automated":
                                current_test_case.automated = str(attr_value).strip()
                            elif attribute == "Regression":
                                current_test_case.regression = str(attr_value).strip()
                            elif attribute == "Type":
                                current_test_case.test_type = str(attr_value).strip()
            
            # Add the last test case if exists
            if current_test_case is not None:
                test_cases.append(current_test_case)
                
            return test_cases
                
        except Exception as e:
            self.logger.error(f"Error extracting test cases from Excel: {str(e)}")
            return []
    
    def _map_columns(self, actual_columns, required_columns):
        """Map actual column names to required column names"""
        column_mapping = {}
        actual_columns_lower = {col.lower(): col for col in actual_columns}
        
        for req_col in required_columns:
            req_col_lower = req_col.lower()
            
            # Try exact match
            if req_col in actual_columns:
                column_mapping[req_col] = req_col
                continue
                
            # Try lowercase match
            if req_col_lower in actual_columns_lower:
                column_mapping[req_col] = actual_columns_lower[req_col_lower]
                continue
                
            # Try contains match
            for actual_col_lower, actual_col in actual_columns_lower.items():
                if req_col_lower in actual_col_lower or actual_col_lower in req_col_lower:
                    column_mapping[req_col] = actual_col
                    break
                    
        return column_mapping
