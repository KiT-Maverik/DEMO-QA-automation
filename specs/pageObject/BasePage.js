class BasePage {

    open(path, trigger) {
        browser.url(path);
        browser.waitForVisible(trigger);
    }}

export default BasePage;