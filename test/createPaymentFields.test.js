import { html, fixture, expect, assert } from '@open-wc/testing';
import { aTimeout } from '@open-wc/testing-helpers'
import sinon from 'sinon';

import * as common from './common'
import createPaymentFields from '../src/field-set/payment-fields'
import * as data from '../src/common/data'


describe('createPaymentFields', () => {
    let error;

    beforeEach(() => {
        let stub = sinon.stub(window, 'fetch'); //add stub
        stub.onCall(0).returns(common.jsonOk(common.MOCK_JSON));
        stub.onCall(1).returns(common.jsonOk(common.MOCK_JSON));
        stub.onCall(2).returns(common.jsonOk(common.MOCK_JSON));
        stub.onCall(3).returns(common.jsonOk(common.MOCK_JSON));

        error = undefined;
        window.onerror = (e) => error = e;
    });

    afterEach(() => {
        window.fetch.restore(); //remove stub
        data.removeAll()
    });

    it('renders finix iFrames', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client, {});

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const tfTag = await document.getElementById('pay-theory-credit-card-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-field-container');
        await expect(fcTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;
    });

    it('renders finix iframes with an additional account name and zip field', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-zip" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const tfTag = await document.getElementById('pay-theory-credit-card-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-field-container');
        await expect(fcTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

        const fwName = await document.getElementById('field-wrapper-name').childElementCount;
        await expect(fwName).to.be.ok;

        const fwZip = await document.getElementById('field-wrapper-address-postal_code').childElementCount;
        await expect(fwZip).to.be.ok;
    });

    it('renders finix iframes with all fields split out', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-exp" />
        <div id="pay-theory-credit-card-cvv" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-zip" />
        <div id="pay-theory-credit-card-address-1" />
        <div id="pay-theory-credit-card-address-2" />
        <div id="pay-theory-credit-card-city" />
        <div id="pay-theory-credit-card-state" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card-number');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const tfTag = await document.getElementById('pay-theory-credit-card-number-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-exp-tag-frame');
        await expect(fcTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCVV = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCVV).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

        const fwName = await document.getElementById('field-wrapper-name').childElementCount;
        await expect(fwName).to.be.ok;

        const fwLineOne = await document.getElementById('field-wrapper-address-address_line1').childElementCount;
        await expect(fwLineOne).to.be.ok;

        const fwLineTwo = await document.getElementById('field-wrapper-address-address_line2').childElementCount;
        await expect(fwLineTwo).to.be.ok;

        const fwState = await document.getElementById('field-wrapper-address-region').childElementCount;
        await expect(fwState).to.be.ok;

        const fwZip = await document.getElementById('field-wrapper-address-postal_code').childElementCount;
        await expect(fwZip).to.be.ok;
    });

    it('renders finix iframes with custom element id', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card-custom" />`);

        const creditCard = await createPaymentFields(common.api, common.client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card-custom');

        await expect(ccTag).to.be.ok;

        await creditCard.mount({
            'credit-card': 'pay-theory-credit-card-custom',
            'number': '',
            'exp': '',
            'cvv': '',
            'account-name': '',
            'address-1': '',
            'address-2': '',
            city: '',
            state: '',
            zip: '',
        });

        await aTimeout(300);

        const tfTag = await document.getElementById('pay-theory-credit-card-custom-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-field-container');
        await expect(fcTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

    });

    it('initTransaction sets transact to true', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

        await expect(ccTagFrame.transact).to.not.be;

        await creditCard.initTransaction(2500)

        await expect(ccTagFrame.transact).to.be;
    });

    it('initTransaction sets toeknize to true with verification step and cancel', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

        await expect(ccTagFrame.toeknize).to.not.be;

        await creditCard.initTransaction(2500, {}, true)

        await expect(ccTagFrame.toeknize).to.be;

        await creditCard.cancel()

        await expect(ccTagFrame.tokenize).not.to.be;
    });

    it('initTransaction sets capture to true with verification step and confirm', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

        await expect(ccTagFrame.toeknize).to.not.be;

        await creditCard.initTransaction(2500, {}, true)

        await expect(ccTagFrame.toeknize).to.be;

        await expect(ccTagFrame.capture).not.to.be;

        await creditCard.confirm()

        await expect(ccTagFrame.capture).to.be;
    });

    it('readyObserver triggers on ready message from mount', async() => {
        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client, 2500);

        const spy = sinon.spy()

        await creditCard.readyObserver(spy);

        await aTimeout(100);

        await assert(spy.notCalled)

        await creditCard.mount();

        await aTimeout(200);

        await assert(spy.called)
    });

    it('transactedObserver runs on transact message', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(200);

        const spy = sinon.spy()

        await creditCard.transactedObserver(spy)

        window.postMessage({
                type: 'pt:transact',
                transact: { amount: 210, currency: 'USD', finixToken: {} }
            },
            window.location.origin,
        );

        await aTimeout(500)

        await assert(spy.called)
    });

    it('tokenizeObserver runs on tokenize message', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(200);

        const spy = sinon.spy()

        await creditCard.tokenizeObserver(spy)

        await assert(spy.notCalled)

        window.postMessage({
                type: 'pt:tokenize',
                tokenize: { amount: 1000, currency: 'USD', finixToken: {} }
            },
            window.location.origin,
        );

        await aTimeout(300)

        await assert(spy.called)
    });

    it('captureObserver runs on capture message', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(200);

        const spy = sinon.spy()

        await creditCard.captureObserver(spy)

        await assert(spy.notCalled)

        window.postMessage({
                type: 'pt:capture',
            },
            window.location.origin,
        );

        await aTimeout(300)

        await assert(spy.called)
    });

    it('errorObserver triggers on error message', async() => {

        const creditCard = await createPaymentFields(common.api, common.client, 2500);

        let testError;

        const errored = () => testError = true;

        await creditCard.errorObserver(errored);

        expect(testError).to.not.be.ok;

        window.postMessage(
            JSON.stringify({
                type: 'pt:error',
                error: 'test',
            }),
            window.location.origin,
        );

        await aTimeout(100);

        expect(testError).to.be.ok;
    })

    it('validObserver triggers on valid message combined element', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-zip" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        const spy = sinon.spy();

        await creditCard.validObserver(spy);

        assert(spy.notCalled)

        window.postMessage({
                type: 'pt:credit-card:valid',
                valid: true,
            },
            window.location.origin,
        );

        await aTimeout(1);

        assert(spy.calledOnce)

        window.postMessage({
                type: 'pt:account-name:valid',
                valid: false,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:zip:valid',
                valid: false,
            },
            window.location.origin,
        );

        await aTimeout(1);

        assert(spy.calledTwice)


        window.postMessage({
                type: 'pt:account-name:valid',
                valid: true,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:zip:valid',
                valid: true,
            },
            window.location.origin,
        );

        await aTimeout(1);

        assert(spy.calledThrice)


    })

    it('validObserver triggers on valid message seperate elements', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-exp" />
        <div id="pay-theory-credit-card-cvv" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-zip" />
        <div id="pay-theory-credit-card-address-1" />
        <div id="pay-theory-credit-card-address-2" />
        <div id="pay-theory-credit-card-city" />
        <div id="pay-theory-credit-card-state" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card-number');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        const spy = sinon.spy();

        await creditCard.validObserver(spy);

        assert(spy.notCalled)

        window.postMessage({
                type: 'pt:number:valid',
                valid: true,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:exp:valid',
                valid: true,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:cvv:valid',
                valid: true,
            },
            window.location.origin,
        );

        await aTimeout(1);

        assert(spy.calledOnce)

        window.postMessage({
                type: 'pt:account-name:valid',
                valid: false,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:zip:valid',
                valid: false,
            },
            window.location.origin,
        );
        window.postMessage({
                type: 'pt:address-1:valid',
                valid: false,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:address-2:valid',
                valid: false,
            },
            window.location.origin,
        );
        window.postMessage({
                type: 'pt:state:valid',
                valid: false,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:city:valid',
                valid: false,
            },
            window.location.origin,
        );

        await aTimeout(1);

        assert(spy.calledTwice)


        window.postMessage({
                type: 'pt:account-name:valid',
                valid: true,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:zip:valid',
                valid: true,
            },
            window.location.origin,
        );
        window.postMessage({
                type: 'pt:address-1:valid',
                valid: true,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:address-2:valid',
                valid: true,
            },
            window.location.origin,
        );
        window.postMessage({
                type: 'pt:state:valid',
                valid: true,
            },
            window.location.origin,
        );

        window.postMessage({
                type: 'pt:city:valid',
                valid: true,
            },
            window.location.origin,
        );

        await aTimeout(1);

        assert(spy.calledThrice)


    })

});


describe('createPaymentFields Errors:', () => {
    let error;

    beforeEach(() => {
        let stub = sinon.stub(window, 'fetch'); //add stub
        stub.onCall(0).returns(common.jsonOk(common.MOCK_JSON_FAIL));
        stub.onCall(1).returns(common.jsonOk(common.MOCK_JSON_FAIL));
        stub.onCall(2).returns(common.jsonOk(common.MOCK_JSON_FAIL));
        stub.onCall(3).returns(common.jsonOk(common.MOCK_JSON_FAIL));

        error = undefined;
        window.onerror = (e) => error = e;
    });

    afterEach(() => {
        window.fetch.restore(); //remove stub
    });

    it('errors when you try and mount twice', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        const tfTag = await document.getElementById('pay-theory-credit-card-tag-frame');
        await expect(tfTag).to.be.ok;

        const fcTag = await document.getElementById('pay-theory-credit-card-field-container');
        await expect(fcTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

        let mountError

        await expect(mountError).to.not.be;

        try {
            await creditCard.mount();
        }
        catch (err) {
            mountError = err
        }

        await expect(mountError).to.be;
    });

    it('errors when you try and mount seperate without credit card expiration', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-cvv" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card-number');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        let mountError

        await expect(mountError).to.not.be;

        try {
            await creditCard.mount();
        }
        catch (err) {
            mountError = err
        }

        await expect(mountError).to.be;
    });

    it('errors when you try and mount seperate without credit card cvv', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-exp" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card-number');

        await expect(ccTag).to.be.ok;

        await aTimeout(300);

        let mountError

        await expect(mountError).to.not.be;

        try {
            await creditCard.mount();
        }
        catch (err) {
            mountError = err
        }

        await expect(mountError).to.be;
    });

    it('errors when you try and mount combined with additional credit card cvv', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card" />
        <div id="pay-theory-credit-card-cvv" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await aTimeout(300);

        let mountError

        await expect(mountError).to.not.be;

        try {
            await creditCard.mount();
        }
        catch (err) {
            mountError = err
        }

        await expect(mountError).to.be;
    });

    it('errors when you try and mount combined with additional credit card exp', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card" />
        <div id="pay-theory-credit-card-exp" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await aTimeout(300);

        let mountError

        await expect(mountError).to.not.be;

        try {
            await creditCard.mount();
        }
        catch (err) {
            mountError = err
        }

        await expect(mountError).to.be;
    });

    it('errors when you try and mount combined with additional credit card number', async() => {

        const fixed = await fixture(html `
        <div id="pay-theory-credit-card" />
        <div id="pay-theory-credit-card-number" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await aTimeout(300);

        let mountError

        await expect(mountError).to.not.be;

        try {
            await creditCard.mount();
        }
        catch (err) {
            mountError = err
        }

        await expect(mountError).to.be;
    });

    it('cannot render finix frames', async() => {

        const fixed = await fixture(html ` <div id="not-the-div-youre-looking-for" />`);

        const creditCard = await createPaymentFields(common.api, common.client, 2500)

        const wrongDiv = await document.getElementById('not-the-div-youre-looking-for');

        await expect(wrongDiv).to.be.ok;

        await creditCard.mount()

        await aTimeout(200)

        await expect(error).to.be.ok;
    });

    it('initTransaction throws error with negative value', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

        await expect(ccTagFrame.transact).to.not.be;

        let negError

        await expect(negError).not.to.be;

        try {
            await creditCard.initTransaction(-2500)
        }
        catch (err) {
            negError = err
        }

        await expect(negError).to.be;
    });

    it('initTransaction throws error with decimal in the value', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        await expect(error).to.not.be;

        const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

        await expect(ccTagFrame.transact).to.not.be;

        let negError

        await expect(negError).not.to.be;

        try {
            await creditCard.initTransaction(2500.23)
        }
        catch (err) {
            negError = err
        }

        await expect(negError).to.be;
    });

    it('throws unknown type error if undefined in elements', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card-custom" />`);

        const creditCard = await createPaymentFields(common.api, common.client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card-custom');

        await expect(ccTag).to.be.ok;

        let unknownError;

        expect(unknownError).not.to.be;

        try {
            await creditCard.mount({
                'credit-card': 'pay-theory-credit-card-custom',
                'number': '',
                'exp': '',
                'cvv': '',
                'account-name': '',
                'address-1': '',
                'address-2': '',
                city: '',
                state: '',
            });
        }
        catch (err) {
            unknownError = err
        }

        expect(unknownError).to.be;

    });

    it('throws invalid element error if not a string in elements', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card-custom" />`);

        const creditCard = await createPaymentFields(common.api, common.client, 2500);

        const ccTag = await document.getElementById('pay-theory-credit-card-custom');

        await expect(ccTag).to.be.ok;

        let unknownError;

        expect(unknownError).not.to.be;

        try {
            await creditCard.mount({
                'credit-card': 'pay-theory-credit-card-custom',
                'number': '',
                'exp': '',
                'cvv': '',
                'account-name': '',
                'address-1': '',
                'address-2': '',
                city: '',
                state: '',
                zip: {}
            });
        }
        catch (err) {
            unknownError = err
        }

        expect(unknownError).to.be;

    });

    it('tokenizeObserver doesnt run callback on tokenize message if token state is error', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(200);

        const spy = sinon.spy()

        await creditCard.tokenizeObserver(spy)

        await expect(error).not.to.be.ok;

        await assert(spy.notCalled)

        window.postMessage({
                type: 'pt:tokenize',
            },
            window.location.origin,
        );

        await aTimeout(300)

        await assert(spy.notCalled)

    });
});

describe('createPaymentFields with prod environment', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        process.env.BUILD_ENV = 'prod';
    });

    afterEach(() => {
        process.env = OLD_ENV; // restore old env
    });

    it('initTransaction sets transact to true', async() => {

        const fixed = await fixture(html ` <div id="pay-theory-credit-card" />`);

        const creditCard = await createPaymentFields(common.api, common.client);

        const ccTag = await document.getElementById('pay-theory-credit-card');

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(300);

        const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

        await expect(ccTagFrame.transact).to.not.be;

        await creditCard.initTransaction(2500)

        await expect(ccTagFrame.transact).to.be;
    });

});
