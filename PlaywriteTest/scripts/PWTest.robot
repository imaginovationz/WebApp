*** Settings ***
Library           Browser		auto_closing_level=MANUAL

*** Variables ***
${URL}     https://www.google.com
${HEADLESS}    False
${RESULTS_DIR}    ../../../../PlaywriteTest/results/

*** Test Cases ***
Open Browser And Search
    #The New Browser keyword is used to initialize a Chromium browser with the headless mode controlled by the ${HEADLESS} variable.
    New Browser    browser=chromium    headless=${HEADLESS}

	#New Context and New Page are used for Playwright to create isolated browser contexts and pages.
    New Context
    New Page

    Go To    ${URL}
    Take Screenshot    ${RESULTS_DIR}TC001_Search/step1_google_home.png
    
    #Actions like Click, Fill Text, and Press Keys are used properly for interacting with the web page
    #Accept Cookies (if visible)
    Run Keyword And Ignore Error    Click    xpath=//button[.//div[text()='Accept all'] or .//span[text()='I agree']]
    Fill Text    //*[@id="APjFqb"]    Robot Framework Playwright
    Press Keys   //*[@id="APjFqb"]    Enter
    #Wait For Elements State    //h3    visible    timeout=5s
    
    
Open Browser And Search Parallel
    New Browser    browser=chromium    headless=${HEADLESS}
    New Context
    New Page

    Go To    ${URL}
    Take Screenshot    ${RESULTS_DIR}TC001_Search/step1_google_home.png
    
    #Accept Cookies (if visible)
    Run Keyword And Ignore Error    Click    xpath=//button[.//div[text()='Accept all'] or .//span[text()='I agree']]
    Fill Text    //*[@id="APjFqb"]    Parallel  Execution with Playwright
    Press Keys   //*[@id="APjFqb"]    Enter
    #Wait For Elements State    //h3    visible    timeout=5s
    