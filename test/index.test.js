/* eslint-disable no-unused-expressions */
import { html, fixture, expect } from '@open-wc/testing';


import * as paytheory from '../dist/index.js'


describe('fake test', () => {
    it('passes', async() => {
        const el = '';
        expect(el).to.equal('');
    });
    it('fails', async() => {
        const el = 'test';
        expect(el).to.equal('test');
    });
});
describe('createCreditCard', () => {
    it('renders finix iframes', async() => {
        const api = "pt-sandbox-75928e5d68108ca3fc418bde45dc5253";
        const client = "IDvwtJwLdkja7CMk5oR6QNDk";
        let cc;
        const paytheory = window.paytheory;
        await paytheory.createCreditCard(api, client, 2500)
            .then(creditCard => {
                cc = creditCard;
                cc.mount();
            })
        const el = await fixture(html ` <div id="paytheory-credit-card" />`);
        const ccTag = await document.getElementById('paytheory-credit-card-tag-frame');
        console.log(el)
        expect(ccTag).to.be.ok;
    });
});
