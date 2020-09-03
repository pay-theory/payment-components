import { html, fixture, expect, assert } from '@open-wc/testing';
import { aTimeout } from '@open-wc/testing-helpers'
import sinon from 'sinon';

import * as common from './common'
import createCreditCardFields from '../src/field-set/split'

describe('createCreditCardFields', () => {

    it('renders finix iframes', async() => {

        const fixed = await fixture(html `<div>
        <div id="pay-theory-credit-card-cvv" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-expiration" />
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-zip" />
        </div>`);

        const creditCard = await createCreditCardFields(common.api, common.client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number')

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(200)

        const cvvTag = await document.getElementById('pay-theory-cvv-field-container');
        await expect(cvvTag).to.be.ok;

        const expTag = await document.getElementById('pay-theory-expiration-field-container');
        await expect(expTag).to.be.ok;

        const numberTag = await document.getElementById('pay-theory-number-field-container');
        await expect(numberTag).to.be.ok;

        const zipTag = await document.getElementById('pay-theory-zip-field-container');
        await expect(zipTag).to.be.ok;

        const nameTag = await document.getElementById('pay-theory-name-field-container');
        await expect(nameTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

        const fwZip = await document.getElementById('field-wrapper-address-postal_code').childElementCount;
        await expect(fwZip).to.be.ok;

        const fwName = await document.getElementById('field-wrapper-name').childElementCount;
        await expect(fwName).to.be.ok;
    });

    it('renders finix iframes with custom element names', async() => {

        const fixed = await fixture(html `<div>
        <div id="pay-theory-credit-card-cvv-custom" />
        <div id="pay-theory-credit-card-account-name-custom" />
        <div id="pay-theory-credit-card-expiration-custom" />
        <div id="pay-theory-credit-card-number-custom" />
        <div id="pay-theory-credit-card-zip-custom" />
        </div>`);

        const creditCard = await createCreditCardFields(common.api, common.client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number-custom')

        await expect(ccTag).to.be.ok;

        await creditCard.mount({
            'account-name': "pay-theory-credit-card-account-name-custom",
            cvv: "pay-theory-credit-card-cvv-custom",
            expiration: "pay-theory-credit-card-expiration-custom",
            number: "pay-theory-credit-card-number-custom",
            zip: "pay-theory-credit-card-zip-custom"
        });

        await aTimeout(200)

        const cvvTag = await document.getElementById('pay-theory-cvv-field-container');
        await expect(cvvTag).to.be.ok;

        const expTag = await document.getElementById('pay-theory-expiration-field-container');
        await expect(expTag).to.be.ok;

        const numberTag = await document.getElementById('pay-theory-number-field-container');
        await expect(numberTag).to.be.ok;

        const zipTag = await document.getElementById('pay-theory-zip-field-container');
        await expect(zipTag).to.be.ok;

        const nameTag = await document.getElementById('pay-theory-name-field-container');
        await expect(nameTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

        const fwZip = await document.getElementById('field-wrapper-address-postal_code').childElementCount;
        await expect(fwZip).to.be.ok;

        const fwName = await document.getElementById('field-wrapper-name').childElementCount;
        await expect(fwName).to.be.ok;
    });

    it('renders finix iframes with custom element names leaving one out', async() => {

        const fixed = await fixture(html `<div>
        <div id="pay-theory-credit-card-cvv-custom" />
        <div id="pay-theory-credit-card-expiration-custom" />
        <div id="pay-theory-credit-card-number-custom" />
        <div id="pay-theory-credit-card-zip-custom" />
        </div>`);

        const creditCard = await createCreditCardFields(common.api, common.client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number-custom')

        await expect(ccTag).to.be.ok;

        await creditCard.mount({
            cvv: "pay-theory-credit-card-cvv-custom",
            expiration: "pay-theory-credit-card-expiration-custom",
            number: "pay-theory-credit-card-number-custom",
            zip: "pay-theory-credit-card-zip-custom"
        });

        await aTimeout(200)

        const cvvTag = await document.getElementById('pay-theory-cvv-field-container');
        await expect(cvvTag).to.be.ok;

        const expTag = await document.getElementById('pay-theory-expiration-field-container');
        await expect(expTag).to.be.ok;

        const numberTag = await document.getElementById('pay-theory-number-field-container');
        await expect(numberTag).to.be.ok;

        const zipTag = await document.getElementById('pay-theory-zip-field-container');
        await expect(zipTag).to.be.ok;

        const fwNum = await document.getElementById('field-wrapper-number').childElementCount;
        await expect(fwNum).to.be.ok;

        const fwExp = await document.getElementById('field-wrapper-expiration_date').childElementCount;
        await expect(fwExp).to.be.ok;

        const fwCvv = await document.getElementById('field-wrapper-security_code').childElementCount;
        await expect(fwCvv).to.be.ok;

        const fwZip = await document.getElementById('field-wrapper-address-postal_code').childElementCount;
        await expect(fwZip).to.be.ok;
    });

    it('initTransaction sets transct to true', async() => {
        const fixed = await fixture(html `<div>
        <div id="pay-theory-credit-card-cvv" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-expiration" />
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-zip" />
        </div>`);

        const creditCard = await createCreditCardFields(common.api, common.client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number')

        await expect(ccTag).to.be.ok;

        await creditCard.mount();

        await aTimeout(200);

        const ccTagFrame = await document.getElementById('pay-theory-credit-card-number-tag-frame')

        await expect(ccTagFrame.transact).to.not.be;

        await creditCard.initTransaction();

        await expect(ccTagFrame.transact).to.be.ok;

    })

    it('readyObserver triggers on ready message from mount', async() => {
        const fixed = await fixture(html `<div>
        <div id="pay-theory-credit-card-cvv" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-expiration" />
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-zip" />
        </div>`);

        const creditCard = await createCreditCardFields(common.api, common.client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number')

        await expect(ccTag).to.be.ok;

        const spy = sinon.spy()

        await creditCard.readyObserver(spy)

        await assert(spy.notCalled)

        await creditCard.mount();

        await aTimeout(200)

        await assert(spy.called)
    })

    it('readyObserver triggers on ready message from mount leaving out name', async() => {
        const fixed = await fixture(html `<div>
            <div id="pay-theory-credit-card-cvv" />
            <div id="pay-theory-credit-card-expiration" />
            <div id="pay-theory-credit-card-number" />
            <div id="pay-theory-credit-card-zip" />
            </div>`);

        const creditCard = await createCreditCardFields(common.api, common.client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number')

        await expect(ccTag).to.be.ok;

        const spy = sinon.spy()

        await creditCard.readyObserver(spy)

        await assert(spy.notCalled)

        await creditCard.mount({
            cvv: "pay-theory-credit-card-cvv",
            expiration: "pay-theory-credit-card-expiration",
            number: "pay-theory-credit-card-number",
            zip: "pay-theory-credit-card-zip"
        });

        await aTimeout(200);

        await assert(spy.called)
    })

    // it('transactedObserver runs on tokenized message', async() => {

    //     const fixed = await fixture(html `<div>
    //     <div id="pay-theory-credit-card-cvv" />
    //     <div id="pay-theory-credit-card-account-name" />
    //     <div id="pay-theory-credit-card-expiration" />
    //     <div id="pay-theory-credit-card-number" />
    //     <div id="pay-theory-credit-card-zip" />
    //     </div>`);

    //     const creditCard = await createCreditCardFields(api, client, 2500)

    //     const ccTag = await document.getElementById('pay-theory-credit-card-cvv');

    //     await expect(ccTag).to.be.ok;

    //     await aTimeout(200);

    //     const spy = sinon.spy()

    //     await creditCard.transactedObserver(spy)

    //     await assert(spy.notCalled)

    //     window.postMessage({
    //             type: 'tokenized',
    //             tokenized: {
    //                 data: {
    //                     id: 'testId'
    //                 }
    //             },
    //         },
    //         window.location.origin,
    //     );

    //     await aTimeout(300);

    //     await assert(spy.calledWith(MOCK_JSON))
    // });

    it('errorObserver triggers on error message', async() => {

        const creditCard = await createCreditCardFields(common.api, common.client, 2500);

        const spy = sinon.spy()

        await creditCard.errorObserver(spy)

        assert(spy.notCalled)

        window.postMessage({
                type: 'error',
                error: 'test',
            },
            window.location.origin,
        );

        await aTimeout(1);

        assert(spy.called)
    })

    it('validObserver triggers on valid message', async() => {
        const fixed = await fixture(html `<div>
        <div id="pay-theory-credit-card-cvv" />
        <div id="pay-theory-credit-card-account-name" />
        <div id="pay-theory-credit-card-expiration" />
        <div id="pay-theory-credit-card-number" />
        <div id="pay-theory-credit-card-zip" />
        </div>`);

        const creditCard = await createCreditCardFields(common.api, common.client, 2500)

        const ccTag = await document.getElementById('pay-theory-credit-card-number')

        await expect(ccTag).to.be.ok;
        console.log(creditCard.mount)

        creditCard.mount();

        await aTimeout(100);

        const spy = sinon.spy();

        await creditCard.validObserver(spy)

        assert(spy.notCalled)

        await window.postMessage({
                type: 'name-valid',
                valid: true,
            },
            window.location.origin,
        );

        await window.postMessage({
                type: 'cvv-valid',
                valid: true,
            },
            window.location.origin,
        );

        await window.postMessage({
                type: 'expiration-valid',
                valid: true,
            },
            window.location.origin,
        );

        await window.postMessage({
                type: 'number-valid',
                valid: true,
            },
            window.location.origin,
        );

        await window.postMessage({
                type: 'zip-valid',
                valid: true,
            },
            window.location.origin,
        );

        await aTimeout(1)

        assert(spy.called)
    })
});
