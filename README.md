This project is a sandbox intended to be used as playground for dark minds.
Sith's are welcomed.

#TECH
* WebdriverIO
* Mocha
* Allure
* Chai

#SUITES
###Dummy
Dummy test suite contains proto-tests. All of them are built on assert.isTrue(true) template. Tests are written in a way to trigger all framework major capabilities.

Usage:
* Framework health check
* Research and development

Scripts:
* npm test -- --dummy           => initiate test set execution
* npm test -- --dummy --kill    => initiate test set execution, and fail 'Unstable' test suite
###Example
This test set contains actual tests addressed against 'example.org' site.

Scripts:
* npm test => initiate test set execution

#TESTING MODES
Testing mode is a set of properties. With it framework behavior can be changed to perfectly reach specific goal. All modes properties can be found in configuration file.
### General
* Description: fast test execution and failed tests information gathering.
* Script: npm test -- --general
### Retest
* Description: slow execution of tests failed in 'general' mode.
* Script: npm test -- --retest
> NOTE: dummy test suite can be executed in 'general' mode.

#HUMAN-READABLE REPORTS
We have 'Allure-2' in da house, so you can generate pretty reports for your tests

Scripts:
* npm run report    => generate test report
* npm run wrep      => for those, who struggling 'Windows'. 