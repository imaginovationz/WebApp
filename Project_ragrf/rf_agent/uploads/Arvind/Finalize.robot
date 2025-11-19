*** Settings ***
Documentation     WARNING! This is a library File.
Library           XML
Library           String

*** Variables ***

*** Keywords ***
Finalize Test
    [Documentation]    Performs the Actions to clean up the Test
     ${Source}=    SeleniumLibrary.Get Source
    Log    ${Source}
    Close All Browsers
