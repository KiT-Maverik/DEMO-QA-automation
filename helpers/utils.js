import reporter from "wdio-allure-reporter";
import _ from 'lodash';

const acc = {};


function safeHook(context, callback, force = false, counter = 0) {
    let hookSuite = _.camelCase(context.test.parent.title),
        hookType = context.test.title,
        errAddress = 'hookErrors.' + hookSuite;

    if (errorHound(context) && !force) return;

    try {
        callback.call(context);
        if (counter > 0) {
            _.unset(acc, errAddress);
            let currentTestReport;
            (hookType === "\"before all\" hook") ? currentTestReport = '' :
                currentTestReport = 'Test: ' + context.currentTest.title;
            console.log("\t|| INFORMATION\n\t|| Hook passed on retry (counter: " + counter + ")");
            console.log("\t|| Hook type: " + hookType + ". Suite: " + hookSuite + ". " + currentTestReport);
        }
    } catch (e) {
        if (counter < browser.options.mochaOpts.retries) {
            browser.reload();
            safeHook(context, callback, force, counter + 1);
            return;
        }
        (hookType === "\"before all\" hook") ? e.testStepTitle = "'Before all' hook failed" :
            e.testStepTitle = hookType + " failed at \"" + context.currentTest.title + "\".";
        _.set(acc, errAddress, e);
        (e.type === 'RuntimeError' && e.message === 'timeout') ?
            console.log("\t|| INFORMATION\n\t|| Screenshot not saved, " +
                "because Runtime (timeout) error appears in " + e.testStepTitle) :
            _.set(acc, "screenshots." + hookSuite, browser.saveScreenshot());
    }
}

function init(context, callback, skip = false) {
    let errAddress = errorHound(context);
    callback.call(context);

    if (skip === true) {
        console.log("SKIPPED: " + context.test.title);
        context.skip();
    }

    if (errAddress) {
        let screenshotImage = _.get(acc, "screenshots." + errAddress, false);
        if (screenshotImage) {
            _.unset(acc, "screenshots." + errAddress);
            reporter.createAttachment('Screenshot', screenshotImage, 'image/png');
        }
        reporter.createStep(_.get(acc, 'hookErrors.' + errAddress + ".testStepTitle", "Test step is missing"), undefined, undefined, 'failed');
        context.retries(0);
        throw _.get(acc, 'hookErrors.' + errAddress);
    }
}

function testStep(testStepTitle, callback) {
    try {
        callback();
        reporter.createStep(testStepTitle);
    } catch (e) {
        (e.type === 'RuntimeError' && e.message === 'timeout') ?
            console.log("\t|| INFORMATION\n\t|| Screenshot not saved, " +
                "because Runtime (timeout) error appears in " + testStepTitle) :
            reporter.createAttachment('Screenshot', browser.saveScreenshot(), 'image/png');
        reporter.createStep(testStepTitle, undefined, undefined, 'failed');
        throw e;
    }
}

function errorHound(context) {
    for (let i = 1; i < 10; i++) {
        let suspect = _.camelCase(_.get(context, 'test' + '.parent'.repeat(i) + '.title', false));
        if (!suspect) {
            return false;
        }
        if (_.has(acc.hookErrors, suspect)) {
            return suspect;
        }
    }
    return false;
}

function hierarchyBuilder(reverse = false) {
    let hierarchy = [];
    for (let i = 1; i < 10; i++) {
        let candidate = _.get(this, 'test' + '.parent'.repeat(i) + '.title', false);
        if (candidate) {
            if (!reverse) {
                hierarchy.unshift(candidate);
            } else if (reverse) {
                hierarchy.push(candidate);
            }
        }
        if (!candidate) {
            break;
        }
    }
    return hierarchy;
}

export {
    acc, safeHook, init, testStep, hierarchyBuilder
}

// TODO retries logic