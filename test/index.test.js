/* eslint-disable no-unused-expressions */
import { html, fixture, expect, assert } from '@open-wc/testing';
import { aTimeout } from '@open-wc/testing-helpers'
import sinon from 'sinon'
const api = "pt-sandbox-75928e5d68108ca3fc418bde45dc5253";
const client = "IDvwtJwLdkja7CMk5oR6QNDk";


describe('createCreditCard', () => {
    let error;

    beforeEach(() => {
        error = undefined;
        window.onerror = (f) => error = f;
    });
    it('renders finix iframes', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await window.paytheory.createCreditCard(api, client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const tfTag = await document.getElementById('pay-theory-credit-card-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-field-container');
        await expect(fcTag).to.be.ok;
    });

    it('renders finix iframes with custom element id', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card-custom" />`);

        const creditCard = await window.paytheory.createCreditCard(api, client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card-custom');

        await expect(ccTag).to.be.ok;

        await creditCard.mount('pay-theory-credit-card-custom');

        await aTimeout(300);

        await expect(error).to.not.be;

        const tfTag = await document.getElementById('pay-theory-credit-card-custom-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-field-container');
        await expect(fcTag).to.be.ok;
    });

    it('cannot render finix frames', async() => {

        const fixed = await fixture(html ` <div id="not-the-div-youre-looking-for" />`);

        const creditCard = await window.paytheory.createCreditCard(api, client, 2500)

        const wrongDiv = await document.getElementById('not-the-div-youre-looking-for');

        await expect(wrongDiv).to.be.ok;

        await creditCard.mount()

        await aTimeout(200)

        await expect(error).to.be.ok;
    });

    it('readyObserver triggers on ready message from mount', async() => {
        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await window.paytheory.createCreditCard(api, client, 2500);

        let ready;

        const readied = () => ready = true;

        await creditCard.readyObserver(readied);

        await aTimeout(100);

        await expect(ready).to.not.be.ok;

        await creditCard.mount();

        await aTimeout(200);

        await expect(ready).to.be.ok;
    });

    it('errorObserver triggers on error message', async() => {

        const creditCard = await window.paytheory.createCreditCard(api, client, 2500);

        let testError;

        const errored = () => testError = true;

        await creditCard.errorObserver(errored);

        expect(testError).to.not.be.ok;

        window.postMessage({
                type: 'error',
                error: 'test',
            },
            window.location.origin,
        );

        await aTimeout(100);

        expect(testError).to.be.ok;
    })

    it('validObserver triggers on valid message', async() => {

        const creditCard = await window.paytheory.createCreditCard(api, client, 2500);

        let valid;

        const validate = () => valid = true;

        await creditCard.validObserver(validate);

        expect(valid).to.not.be.ok;

        window.postMessage({
                type: 'valid',
                error: 'test',
            },
            window.location.origin,
        );

        await aTimeout(100);

        expect(valid).to.be.ok;
    })
});

describe('createCreditCardFields', () => {
    it('renders finix iframes', async() => {

        const fixed = await fixture(html `<div>
        <div id="pay-theory-credit-card-cvv" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-expiration" />
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-zip" />
        </div>`);

        const creditCard = await window.paytheory.createCreditCardFields(api, client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number')

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(200)

        const cvvTag = await document.getElementById('pay-theory-credit-card-cvv-tag-frame');
        await expect(cvvTag).to.be.ok;

        const accountNameTag = await document.getElementById('pay-theory-credit-card-account-name-tag-frame');
        await expect(accountNameTag).to.be.ok;

        const expTag = await document.getElementById('pay-theory-credit-card-expiration-tag-frame');
        await expect(expTag).to.be.ok;

        const numberTag = await document.getElementById('pay-theory-credit-card-number-tag-frame');
        await expect(numberTag).to.be.ok;

        const zipTag = await document.getElementById('pay-theory-credit-card-zip-tag-frame');
        await expect(zipTag).to.be.ok;
    });

    it('renders finix iframes with customer element names', async() => {

        const fixed = await fixture(html `<div>
        <div id="pay-theory-credit-card-cvv-custom" />
        <div id="pay-theory-credit-card-account-name-custom" />
        <div id="pay-theory-credit-card-expiration-custom" />
        <div id="pay-theory-credit-card-number-custom" />
        <div id="pay-theory-credit-card-zip-custom" />
        </div>`);

        const creditCard = await window.paytheory.createCreditCardFields(api, client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number')

        await expect(ccTag).to.be.ok;

        await creditCard.mount({
            name: "paytheory-credit-card-account-name-custom",
            cvv: "paytheory-credit-card-cvv-custom",
            expiration: "paytheory-credit-card-expiration-custom",
            number: "paytheory-credit-card-number-custom",
            zip: "paytheory-credit-card-zip-custom"
        });

        await aTimeout(200)

        const cvvTag = await document.getElementById('pay-theory-credit-card-cvv-tag-frame');
        await expect(cvvTag).to.be.ok;

        const accountNameTag = await document.getElementById('pay-theory-credit-card-account-name-tag-frame');
        await expect(accountNameTag).to.be.ok;

        const expTag = await document.getElementById('pay-theory-credit-card-expiration-tag-frame');
        await expect(expTag).to.be.ok;

        const numberTag = await document.getElementById('pay-theory-credit-card-number-tag-frame');
        await expect(numberTag).to.be.ok;

        const zipTag = await document.getElementById('pay-theory-credit-card-zip-tag-frame');
        await expect(zipTag).to.be.ok;
    });
});
