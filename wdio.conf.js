const shell = require('shelljs');
const fs = require('fs');
const _ = require('lodash');

let mode, browserMode, modeSettings;

browserMode = {
    visual: ['window-size=1366,805', 'autoplay-policy=no-user-gesture-required', 'disable-infobars'],
    headless: ['window-size=1350,717', 'autoplay-policy=no-user-gesture-required', 'headless']
};

modeSettings = {
    general: {
        specs: ['./specs/tests/**/*.js'],
        maxInstances: 5,
        retries: 2,
        message: "> TESTING MODE: general"
    },
    retest: {
        specs: undefined,
        maxInstances: 1,
        grep: undefined,
        retries: 1,
        message: "> TESTING MODE: retest",
    },
    dummy: {
        specs: ['./specs/suites/dummy/*.js'],
        message: "> INFORMATION: running dummy test suite"
    }
};

exports.config = {

    specs: ['./specs/tests/**/*.js'],

    // Specs to exclude.
    exclude: [],

    suites: {
        payment: [""]
    },

    baseUrl: 'http://example.org',

    services: ['selenium-standalone'],
    capabilities: [{
        maxInstances: 5,
        browserName: 'chrome',
        chromeOptions: {
            args: []
        }
    }],

    sync: true,
    logLevel: 'silent',
    coloredLogs: true,
    deprecationWarnings: false,
    bail: 0,
    waitforTimeout: 20000,
    connectionRetryTimeout: 30000,
    connectionRetryCount: 3,

    framework: 'mocha',
    mochaOpts: {
        timeout: 160000,
        compilers: ['js:babel-register'],
        retries: 2,
        grep: ""
    },

    reporters: ['allure'],
    reporterOptions: {
        allure: {
            outputDir: './allure/allure-results',
            disableWebdriverStepsReporting: true,
            disableWebdriverScreenshotsReporting: true,
        }
    },

    // HOOKS
    onPrepare: function (config, capabilities) {
        separator();

        // Verifying if "failed-tests" directory exists.
        if (!fs.existsSync("./failed-tests")) {
            fs.mkdirSync("./failed-tests");
            console.log("'Failed tests' directory created.");
        }

        // Setting up testing mode
        if (process.argv.includes("--general")) mode = 'general';
        if (process.argv.includes("--retest")) mode = 'retest';

        config.specs = _.get(modeSettings, mode + ".specs", false) || config.specs;
        if (process.argv.includes("--dummy")) config.specs = _.get(modeSettings, "dummy.specs", false) || (console.log("> INFORMATION: Invalid dummy specs set"), process.exit(1));
        if (mode === 'retest') config.specs = statusParser("specs");
        capabilities[0].maxInstances = _.get(modeSettings, mode + ".maxInstances", false) || capabilities[0].maxInstances;

        console.log(_.get(modeSettings, mode + ".message", ""));
        if (process.argv.includes("--dummy")) console.log(_.get(modeSettings, "dummy.message", "> WARNING: missing dummy mode message."));

        // Setting up browser capabilities
        const visual = process.argv.includes("--visual");
        capabilities[0].chromeOptions.args = (visual ? browserMode.visual : browserMode.headless);
        console.log(`> HEADLESS MODE: ` + (visual ? 'disabled' : 'enabled'));

        // Setting up Allure report custom properties
        if (!fs.existsSync('./allure/allure-results/')) shell.mkdir('./allure/allure-results/');
        shell.cp('./allure/categories.json', './allure/allure-results/categories.json');
        shell.cp('./allure/allure.properties', './allure/allure-results/allure.properties');
        shell.cp('-R', './allure/history', './allure/allure-results/history');

        separator(false, true);
    },

    beforeSession: function (config, capabilities, specs) {

        // Setting up testing mode
        if (process.argv.includes("--general")) mode = 'general';
        if (process.argv.includes("--retest")) {
            mode = 'retest';
            config.mochaOpts.grep = statusParser("titles");
        }

        config.mochaOpts.retries = _.get(modeSettings, mode + ".retries", false) || config.mochaOpts.retries;
    },

    afterTest: function (test) {
        let aggregatorFilePath = "./failed-tests/" + test.fullTitle.replace(/[*?"<>:\/\\|]/g, "-") + ".json";

        // Hooks for passed tests
        if (test.passed) {
            // Test run status reporting
            console.log('PASSED: ' + test.title);

            // Removing false test failure records (if any)
            if (fs.existsSync(aggregatorFilePath)) {
                fs.unlinkSync(aggregatorFilePath);
                console.log("\t|| INFORMATION\n\t|| Failed test record removed, since test passed on retry (" + test.title + ").");
            }
        }

        // Hooks for failed tests
        else if (!test.passed) {
            // Test run status reporting
            if (test.err === undefined) {
                console.log('RETRY: ' + test.title);
            } else if (test.err.message) {
                console.log('FAILED: ' + test.title);
                console.log('\t|| Error type: ' + test.err.type);
                console.log('\t|| Error message: ' + test.err.message);
            }

            // Saving failed test info into a file
            if (process.argv.includes("--general")) {
                if (!fs.existsSync(aggregatorFilePath)) {
                    let failedTestData = {title: "", spec: ""};
                    failedTestData.title = test.title;
                    failedTestData.spec = test.file;
                    fs.writeFileSync(aggregatorFilePath, JSON.stringify(failedTestData));
                    console.log("\t|| Failed test record saved (" + test.title + ")");
                } else if (fs.existsSync(aggregatorFilePath)) {
                    console.log("\t|| Failed test record already exist (" + test.title + ")");
                }
            }
        }

    },

    onComplete: function (exitCode, config, capabilities) {
        separator();

        // Creating failed tests report
        if (process.argv.includes("--general")) {
            let ftDirContent = fs.readdirSync('./failed-tests/', 'utf8'),
                statusInfo = {titles: [], specs: []};

            if (ftDirContent.length) {
                for (let i = 0; i < ftDirContent.length; i++) {
                    let ftRecord = JSON.parse(fs.readFileSync('./failed-tests/' + ftDirContent[i], 'utf8'));
                    statusInfo.titles.push(ftRecord.title);
                    statusInfo.specs.push(ftRecord.spec);
                }

                statusInfo.titles = [...new Set(statusInfo.titles)];
                statusInfo.specs = [...new Set(statusInfo.specs)];
                statusInfo = JSON.stringify(statusInfo);

                shell.rm('./failed-tests/*');

            } else if (!ftDirContent.length) {
                statusInfo = JSON.stringify({allPassed: true});
                console.log("> INFORMATION: looks like all tests passed.\nCONGRATZ!");
            }

            fs.writeFileSync('./statusReport.json', statusInfo, (err) => {
                if (err) {
                    // Preventing failed tests information loosing
                    console.log(err);
                    console.log("Error writing file 'statusReport.json'.\nStatus information is published below:");
                    console.log(statusInfo);
                }
            });
        }
    }
};

function separator(prefix = false, postfix = false) {
    if (prefix) console.log("");
    console.log("=======================================================");
    if (postfix) console.log("");
}

function statusParser(key) { //Failed tests reports parser. Currently used only in 'retest' mode.
    try {
        let statusReport = JSON.parse(fs.readFileSync('./statusReport.json', 'utf8'));

        if (!!statusReport.allPassed) {
            console.log("No failed tests.\nRetest session terminated.\n");
            process.exit(0);
        }

        statusReport.titles = statusReport.titles.join("|");

        let info = _.get(statusReport, key, false);
        if (!info) throw "Wrong key in statusParser";
        return info;
    } catch (err) {
        separator(true);
        console.log("Failed getting test run status info.\nCheck if 'statusReport.json' file exists.\nRetest session failed.\n");
        console.log(err);
        process.exit(1);
    }
}
