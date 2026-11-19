import { expect } from '@open-wc/testing';
import qrCode from '../src/field-set/payment-qr.ts';
import '../src/components/pay-theory-checkout-qr/index.ts';
import { fixture, data, hostedFieldsEndpoint } from './support/real-fields-fixture.js';
import { errorObserver } from '../src/common/observe.ts';

const details = { amount: 100, paymentName: 'Synthetic invoice', callToAction: 'PAY', acceptedPaymentMethods: 'ALL' };
describe('actual QR constructor and registered element contracts', () => {
  let f;
  beforeEach(() => { f = fixture(); }); afterEach(() => f.cleanup());
  const container = () => { const div = document.createElement('div'); div.id = data.checkoutQRField; f.root.append(div); return div; };
  for (const [size, expected] of [[127, 128], [128, 128], [300, 300], [301, 300], [-5, 128], [150.5, 150.5], [undefined, 128]]) it(`clamps ${size} to ${expected}, forwards exact payload and callbacks`, async () => {
    const div = container(); const ready = f.sandbox.spy(), success = f.sandbox.spy(), error = f.sandbox.spy();
    const result = await qrCode({ apiKey: 'test-api-synthetic', size, checkoutDetails: details, onReady: ready, onSuccess: success, onError: error });
    expect(result).to.equal(undefined);
    const element = div.firstElementChild; const frames = await f.prepare(element); const frame = frames[0];
    const payload = JSON.parse(atob(decodeURI(new URL(frame.src).searchParams.get('token'))));
    expect(payload.token).to.equal('synthetic-fixture-token'); expect(payload.size).to.equal(expected);
    expect(payload.checkoutDetails).to.include({ amount: 100, paymentName: 'Synthetic invoice', feeMode: 'merchant_fee' });
    expect(frame.width).to.equal(`${expected}px`); expect(frame.height).to.equal(`${expected}px`);
    await f.command(frame, 'emit', { message: { type: 'pt-static:qr-ready' } }); expect(ready.calledOnceWithExactly(true)).to.equal(true);
    const transaction = { status: 'SUCCEEDED', id: 'qr-payment', amount: 100, metadata: { n: 0, f: false } };
    await f.command(frame, 'emit', { message: { type: 'pt-static:qr-checkout-success', data: transaction } });
    expect(success.calledOnceWithExactly(transaction)).to.equal(true);
    await f.command(frame, 'emit', { message: { type: 'pt:error', error: 'synthetic-qr' } });
    expect(error.calledOnce).to.equal(true); expect(error.firstCall.args[0]).to.deep.equal({ type: 'pt:error', error: 'synthetic-qr' });
    element.size = 180; expect(frame.width).to.equal('180px'); expect(frame.height).to.equal('180px');
    element.remove();
    window.dispatchEvent(new MessageEvent('message', { origin: hostedFieldsEndpoint, data: { type: 'pt-static:qr-ready' } }));
    expect(ready.calledOnce).to.equal(true);
  });
  for (const [label, changes] of [['invalid amount', { checkoutDetails: { ...details, amount: -1 } }], ['invalid option', { checkoutDetails: { ...details, callToAction: 'unsupported' } }], ['zero size', { size: 0 }], ['nonnumeric size', { size: '128' }], ['NaN size', { size: NaN }]]) it(`rejects ${label} before token transport`, async () => {
    container();
    expect(await qrCode({ apiKey: 'test-api-synthetic', checkoutDetails: details, ...changes })).to.equal(false);
    expect(f.fetch.called).to.equal(false);
  });
  it('allows absent callbacks and explicit service-fee mode without inventing events', async () => {
    const div = container(); await qrCode({ apiKey: 'test-api-synthetic', checkoutDetails: { ...details, feeMode: 'service_fee' } });
    const element = div.firstElementChild; const [frame] = await f.prepare(element);
    expect(JSON.parse(atob(decodeURI(new URL(frame.src).searchParams.get('token')))).checkoutDetails.feeMode).to.equal('service_fee');
    await f.command(frame, 'emit', { message: { type: 'pt-static:qr-ready' } });
    element.onReady = undefined; element.onSuccess = undefined; element.onError = undefined;
    // No callback is emitted here: a subscribed undefined callback is a preexisting
    // consumer configuration hazard, not a reason to synthesize a successful event.
    element.remove();
  });
  it('characterizes missing token error after mounting the real QR element', async () => {
    const div = container(); const clock = f.sandbox.useFakeTimers(); f.fetch.callsFake(async () => ({ json: async () => ({}) }));
    const pending = qrCode({ apiKey: 'test-api-synthetic', checkoutDetails: details }); await clock.runAllAsync();
    expect(await pending).to.deep.equal({ type: 'ERROR', error: 'NO_TOKEN: No pt-token found' });
    expect(div.firstElementChild.localName).to.equal(data.checkoutQRField); expect(div.querySelector('iframe')).to.equal(null);
  });
  it('characterizes fetch rejection and missing container without silently changing return unions', async () => {
    const clock = f.sandbox.useFakeTimers(); f.fetch.rejects(new Error('offline synthetic'));
    const failed = qrCode({ apiKey: 'test-api-synthetic', checkoutDetails: details }).catch(error => error); await clock.runAllAsync();
    expect(await failed).to.be.instanceOf(Error);
    f.fetch.callsFake(async () => ({ json: async () => ({ 'pt-token': 'synthetic-fixture-token', origin: location.origin }) }));
    const missing = await qrCode({ apiKey: 'test-api-synthetic', checkoutDetails: details }).catch(error => error);
    expect(missing).to.be.instanceOf(TypeError);
  });
  it('characterizes the validation-failure error-observer leak using actual observer delivery', async () => {
    container(); const onError = f.sandbox.spy();
    expect(await qrCode({ apiKey: 'test-api-synthetic', checkoutDetails: { ...details, amount: -1 }, onError })).to.equal(false);
    const done = new Promise(resolve => { const remove = errorObserver(error => { if (error === 'later-synthetic-error') { remove(); resolve(); } }); });
    window.postMessage({ type: 'pt:error', error: 'later-synthetic-error' }, location.origin); await done;
    expect(onError.getCalls().some(call => call.args[0] === 'later-synthetic-error')).to.equal(true);
  });
  it('guards explicit early teardown of a never-connected registered QR element', () => {
    const detached = document.createElement(data.checkoutQRField);
    expect(() => detached.disconnectedCallback()).not.to.throw();
    expect(detached.isConnected).to.equal(false);
  });
  it('defines real QR frame without size and characterizes repeated token appends', async () => {
    const element = document.createElement(data.checkoutQRField); f.root.append(element);
    element.token = 'synthetic'; let frames = await f.prepare(element); expect(frames[0].getAttribute('height')).to.equal(null);
    element.token = 'synthetic-two'; frames = await f.prepare(element); expect(frames).to.have.length(2);
    expect(new URL(frames[1].src).searchParams.get('token')).to.equal('synthetic-two');
  });
});
