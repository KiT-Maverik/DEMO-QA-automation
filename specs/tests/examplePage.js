import data from '../data.json';
import BasePage from '../pageObject/BasePage';
import MainPage from '../pageObject/MainPage';
import {assert} from 'chai';
import reporter from 'wdio-allure-reporter';
import {testStep, safeHook, init} from '../../helpers/utils';

let main = new MainPage();

describe('Example page', () => {
    before(function () {
        safeHook(this, function () {
            main.open(data.url.example, main.elements.header);
        });
    });

    beforeEach(function () {
        safeHook(this, function () {
            reporter.feature('Example page');
        }, true);
    });

    describe('Content', () => {

        beforeEach(function () {
            safeHook(this, function () {
                reporter.story('Content');
            }, true);
        });

        it('Page content verification', function () {
            init(this, function () {
                reporter.severity('minor');
                reporter.testId(999);
                reporter.issue("BOOM-3721");
                reporter.addDescription("This is sample description.");
            });

            testStep('Verifying top block content', () => {
                let headerText = browser.getText(main.elements.header),
                    descText = browser.getText(main.elements.description);

                assert.equal(headerText, data.exampleContent.header, 'Header text mismatch');
                assert.equal(descText, data.exampleContent.description, 'Description text mismatch');
            });

            testStep('Verifying link properties', () => {
                let linkText = browser.getText(main.elements.link),
                    linkDestination = browser.getAttribute(main.elements.link, "href");

                assert.equal(linkText, data.exampleContent.linkText, 'Link text mismatch');
                assert.equal(linkDestination, data.properties.link.destination, 'Wrong link destination');
            });
        });

        it('Page style verification [minimized]', function () {
            init(this, function () {
                reporter.severity('high');
                reporter.testId(999);
                reporter.issue("BOOM-3789");
                reporter.addDescription("This is sample description.");
            });

            let width, margin, padding, backgroundColor, borderRadius;

            testStep('Scaling viewport', () => {
                browser.setViewportSize({
                    width: 650,
                    height: 500
                });
            });

            testStep('Recording style state', () => {
                width = browser.getCssProperty(main.elements.div, "width").value;
                margin = browser.getCssProperty(main.elements.div, "margin").value;
                padding = browser.getCssProperty(main.elements.div, "padding").value;
                backgroundColor = browser.getCssProperty(main.elements.div, "background-color").value;
                borderRadius = browser.getCssProperty(main.elements.div, "border-radius").value;
            });

            testStep('Verifying style state', () => {
                assert.equal(width, data.properties.div.maximized.width, 'Unexpected div width');
                assert.equal(margin, data.properties.div.maximized.margin, 'Wrong div margin');
                assert.equal(padding, data.properties.div.maximized.padding, 'Incorrect div padding');
                assert.equal(backgroundColor, data.properties.div.maximized.backgroundColor, 'Bo-o-oring background color');
                assert.equal(borderRadius, data.properties.div.maximized.borderRadius, 'This radius is as wrong, as your code!');


            });
        });


        it('Page style verification [full scale]', function () {
            init(this, function () {
                reporter.severity('critical');
                reporter.testId(999);
                reporter.issue("BOOM-3289");
                reporter.addDescription("This is sample description.");
            });

            let width, margin, padding, backgroundColor, borderRadius;

            testStep('Scaling viewport', () => {
                browser.setViewportSize({
                    width: 1358,
                    height: 674
                });
            });

            testStep('Recording style state', () => {
                width = browser.getCssProperty(main.elements.div, "width").value;
                margin = browser.getCssProperty(main.elements.div, "margin").value;
                padding = browser.getCssProperty(main.elements.div, "padding").value;
                backgroundColor = browser.getCssProperty(main.elements.div, "background-color").value;
                borderRadius = browser.getCssProperty(main.elements.div, "border-radius").value;
            });

            testStep('Verifying style state', () => {
                assert.equal(width, data.properties.div.minimized.width, 'Unexpected div width');
                assert.equal(margin, data.properties.div.minimized.margin, 'Wrong div margin');
                assert.equal(padding, data.properties.div.minimized.padding, 'Incorrect div padding');
                assert.equal(backgroundColor, data.properties.div.minimized.backgroundColor, 'Bo-o-oring background color');
                assert.equal(borderRadius, data.properties.div.minimized.borderRadius, 'This radius is as wrong, as your code!');


            });
        });
    });

    describe('Navigation', () => {
        beforeEach(function () {
            safeHook(this, function () {
                reporter.story('Navigation');
            }, true);
        });

        it('Running vicious experiments on innocent link', function () {
            init(this, function () {
                reporter.severity('normal');
                reporter.testId(999);
                reporter.issue("BOOM-3777");
                reporter.addDescription("This is sample description.");
            });

            testStep('Verifying link properties', () => {
                assert.isTrue(browser.isVisibleWithinViewport(main.elements.link));

                let linkDestination = browser.getAttribute(main.elements.link, "href");
                assert.equal(linkDestination, data.properties.link.destination, 'Wrong link destination');
            });

            testStep('Verifying link logic', () => {
                browser.click(main.elements.link);
                browser.waitForVisible(main.elements.destinationTrigger);

                let currentURL = browser.getUrl();
                assert.equal(currentURL, data.url.iana, "Displacement detected!");
            });
        });
    });
});