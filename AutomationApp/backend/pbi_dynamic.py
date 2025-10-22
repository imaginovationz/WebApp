# backend/pbi_dynamic.py
"""
Build Power BI report filter payloads from dynamic UI values.

We’re assuming your report model has a table/columns that can accept filters
to reflect these numbers (e.g., parameters table, or dedicated columns in
a small dimension). Adjust `TABLE`/`COL_*` to match the actual report schema.
"""

TABLE = "projects"          # Adjust to the table used inside the report model
COL_MANUAL = "manual_cost"  # Must match the column name used in the report
COL_AUTO   = "automation_cost"

def make_filters(manual_cost: float, automation_cost: float):
    """
    Return a list of Power BI filters (Basic filters w/ single value)
    that constrain the report to the dynamic values from the UI.
    """
    # Basic single-value filters will work if your report uses these fields
    # directly (or via measure logic that references these columns).
    manual_filter = {
        "$schema": "http://powerbi.com/product/schema#basic",
        "target": {"table": TABLE, "column": COL_MANUAL},
        "operator": "In",
        "values": [manual_cost],
        "filterType": 1,  # Basic
        "requireSingleSelection": True
    }
    auto_filter = {
        "$schema": "http://powerbi.com/product/schema#basic",
        "target": {"table": TABLE, "column": COL_AUTO},
        "operator": "In",
        "values": [automation_cost],
        "filterType": 1,
        "requireSingleSelection": True
    }
    return [manual_filter, auto_filter]
