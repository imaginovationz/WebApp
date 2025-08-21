# queries.py

# Options table queries
GET_ALL_OPTIONS = "SELECT id, options FROM options"
GET_OPTION_BY_ID = "SELECT id, options FROM options WHERE id = ?"
UPDATE_OPTION = """
    UPDATE options
    SET options = ?
    WHERE id = ? AND options = ?
"""

# QEInitiatives_Summary table queries
GET_ALL_INITIATIVES = "SELECT * FROM QEInitiatives_Summary"

UPDATE_INITIATIVE = """
    UPDATE QEInitiatives_Summary
    SET IniName = ?, InitiativeDescription = ?, InitiativeStatus = ?, InitiativeCommentary = ?,CumulativeROI = ?
    WHERE InitiativeID = ?
"""
