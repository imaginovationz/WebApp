*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${BROWSER}        chrome
${URL}            https://www.google.com
${SEARCH_TERM}    Robot Framework Selenium

*** Test Cases ***
Open Google And Search Text
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Wait Until Element Is Visible    xpath=//*[@name="q"]    10s
    Input Text    xpath=//*[@id="APjFqb"]    ${SEARCH_TERM}
    Press Keys    xpath=//*[@id="APjFqb"]   RETURN
    Wait Until Page Contains Element    //h3    10s
    Sleep    2s
    Capture Page Screenshot
    # Keep browser open for debugging (optional)
    # Comment out the next line to leave it open
    # Close Browser
