import BasePage from './BasePage.js';

export default class mainPage extends BasePage {

    constructor() {
        super();

        this.elements = {
            header: 'div h1',
            description: 'div p:nth-of-type(1)',
            link: '[href]',
            div: "body > div:nth-child(1)",
            destinationTrigger: "#main_right > h1"
        }
}}