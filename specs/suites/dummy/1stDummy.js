import {assert} from 'chai';
import reporter from "wdio-allure-reporter";
import {safeHook, init, testStep} from '../../../helpers/utils';

describe('1st dummy test suite', () => {
    let stableCheck = () => assert.isTrue(true, 'This step should succeed.');

    describe('Stable tests', () => {

        beforeEach(function () {
            safeHook(this, function () {
                reporter.feature('Dummy Tests');
                reporter.story('Stable');
            }, true);
        });

        it('1stStableTest', function () {

            init(this, function () {
                reporter.severity('critical');
                reporter.testId(999);
                reporter.issue("BOOM-3789");
                reporter.addDescription("This is 1st stable test.");
            });

            testStep('1stStep', () => {
                stableCheck();
            });

            testStep('2ndStep', () => {
                stableCheck();
            });

            testStep('3rdStep', () => {
                stableCheck();
            });
        });

        it('2ndStableTest', function () {
            init(this, function () {
                reporter.severity('blocker');
                reporter.testId(999);
                reporter.issue("BOOM-3789");
                reporter.addDescription("This is 2nd stable test.");
            });

            testStep('1stStep', () => {
                stableCheck();
            });

            testStep('2ndStep', () => {
                stableCheck();
            });
        });

        it('1stSkippedTest', function () {
            init(this, function () {
                reporter.severity('trivial');
                reporter.testId(999);
                reporter.issue("BOOM-3789");
                reporter.addDescription("This test case intended to be skipped.");
            }, true);

            testStep('1stStep', () => {
                assert.isTrue(false, 'Test case was not skipped.');
            });
        });
    });

    describe('Unstable tests', () => {
        let successCriteria = true,
            killHook = false,
            unstableCheck = () => assert.isTrue(successCriteria, 'This step may fail.');
        
        (process.argv.includes("--kill")) && (successCriteria = false);

        beforeEach(function () {
            safeHook(this, function () {
                reporter.feature('Dummy Tests');
                reporter.story('Unstable');
            }, true);
        });

        beforeEach(function () {
            safeHook(this, function () {
                assert.isFalse(killHook, '\'Before each\' has been killed.');
            });
        });

        afterEach(function () {
            safeHook(this, function () {
                if (this.currentTest.title === "2ndUnstableTest" && this.currentTest.state === "failed") killHook = true;
            });
        });

        it('1stUnstableTest', function () {
            init(this, function () {
                reporter.severity('minor');
                reporter.testId(999);
                reporter.issue("BOOM-3789");
                reporter.addDescription("This is 1st unstable test.");
            });

            testStep('1stStep', () => {
                unstableCheck();
            });

            testStep('2ndStep', () => {
                stableCheck();
            });

            testStep('3rdStep', () => {
                stableCheck();
            });
        });

        it('2ndUnstableTest', function () {
            init(this, function () {
                reporter.severity('normal');
                reporter.testId(999);
                reporter.issue("BOOM-3789");
                reporter.addDescription("This is 2nd unstable test.");
            });

            testStep('1stStep', () => {
                stableCheck();
            });

            testStep('2ndStep', () => {
                unstableCheck();
            });
        });

        it('3rdUnstableTest', function () {
            init(this, function () {
                reporter.severity('normal');
                reporter.testId(999);
                reporter.issue("BOOM-3789");
                reporter.addDescription("This is 3rd unstable test. Failure may happen on \"Before each\" stage.");
            });

            testStep('1stStep', () => {
                stableCheck();
            });
        });

        it('4thUnstableTest', function () {
            init(this, function () {
                reporter.severity('trivial');
                reporter.testId(999);
                reporter.issue("BOOM-3789");
                reporter.addDescription("This is 3rd unstable test. This TC will not be reported by mocha if 3rdUnstableTest \"Before each\" fails.");
            });

            testStep('1stStep', () => {
                assert.isTrue(successCriteria, 'This step should succeed.');
            });
        });
    });
});
