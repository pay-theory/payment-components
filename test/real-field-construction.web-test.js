import { expect } from '@open-wc/testing';
import { fixture, data } from './support/real-fields-fixture.js';
import payTheoryFields, { generateUUID } from '../src/field-set/payment-fields-v2.ts';
import legacyCreate from '../src/field-set/payment-fields.ts';
import * as dom from '../src/common/dom.ts';
import { hostedFieldsEndpoint } from '../src/common/network.ts';

const key = 'test-api-synthetic';
const completeCard = ['number', 'exp', 'cvv', 'zip', 'account-name', 'address-1', 'address-2', 'city', 'state'];
const completeAch = ['account-number', 'ach-name', 'routing-number', 'account-type'];
const completeEft = ['bank-account-number', 'bank-account-name', 'bank-account-type', 'bank-institution-number', 'bank-transit-number'];

describe('real current and legacy field constructors [FC01-FC09]', () => {
  let f;
  beforeEach(() => { f = fixture(); });
  afterEach(() => f.cleanup());
  const containers = (keys, custom = false) => {
    const ids = custom ? Object.fromEntries(Object.entries(data.defaultElementIds).map(([name, value]) => [name, `${value}-custom`])) : data.defaultElementIds;
    for (const name of keys) { const container = document.createElement('div'); container.id = ids[name]; f.root.append(container); }
    return ids;
  };
  const ready = async () => {
    const elements = [...f.root.querySelectorAll('[name]')].filter(element => typeof element.sendPtToken === 'function');
    for (const element of elements) await f.prepare(element);
    for (const element of elements) await element.sendPtToken();
    return elements;
  };
  for (const [label, keys, country] of [
    ['combined card', ['credit-card', 'zip'], 'USA'],
    ['separate card', completeCard, 'USA'],
    ['ACH', completeAch, 'USA'],
    ['EFT', completeEft, 'CAN'],
    ['cash', ['cash-name', 'cash-contact'], 'USA'],
    ['card/ACH/cash', [...completeCard, ...completeAch, 'cash-name', 'cash-contact'], 'USA'],
    ['card/EFT/cash', [...completeCard, ...completeEft, 'cash-name', 'cash-contact'], 'CAN'],
  ]) it(`mounts ${label}, configures real elements and resolves one native ready channel [FC01/02/07]`, async () => {
    const ids = containers(keys, !label.includes('card') || label === 'combined card');
    const resultPromise = payTheoryFields({ apiKey: key, amount: 150, country, elementIds: ids, metadata: { retained: true }, placeholders: { custom: 'value' }, feeMode: 'service_fee', styles: {} });
    const elements = await ready();
    expect(await resultPromise).to.deep.equal({ type: 'READY', body: true });
    expect(elements.length).to.be.greaterThan(0);
    const sessions = new Set(elements.map(element => element._session)); expect(sessions.size).to.equal(1);
    for (const element of elements) {
      expect(element.amount).to.equal(150); expect(element._metadata).to.deep.equal({ retained: true });
      expect(element.feeMode).to.equal('service_fee'); expect(element._country).to.equal(country);
      expect(element._processedElements).to.include(element.field);
      expect(element._session).to.match(/^[0-9a-f-]{36}$/);
    }
    for (const name of keys) expect(document.getElementById(ids[name]).children.length).to.equal(1);
  });
  it('returns exact no-fields and first initial-parameter errors without fetch [FC03/04]', async () => {
    expect(await payTheoryFields({ apiKey: key })).to.deep.equal({ type: 'ERROR', error: 'NO_FIELDS: There are no PayTheory fields on the DOM to mount' });
    expect((await payTheoryFields({ apiKey: key, checkoutContext: { invoiceId: 'id' } })).error).to.equal('INVALID_PARAM: Provide either apiKey or checkoutContext (not both).');
    expect((await payTheoryFields({})).error).to.equal('INVALID_PARAM: Provide either apiKey or checkoutContext.');
    expect(f.fetch.called).to.equal(false);
  });
  for (const [keys, message] of [
    [['exp'], 'missing credit card entry field required for payments'],
    [['number'], 'missing credit card expiration field required for payments'],
    [['number', 'exp'], 'missing CVV field required for payments'],
    [['credit-card', 'exp'], 'expiration is not allowed when using combined credit card'],
    [['credit-card', 'cvv'], 'CVV is not allowed when using combined credit card'],
    [['credit-card', 'number'], 'credit card number is not allowed when using combined credit card'],
  ]) it(`preserves incomplete/conflicting layout error ${keys.join('+')} [FC03]`, async () => {
    containers(keys);
    expect(await payTheoryFields({ apiKey: key })).to.deep.equal({ type: 'ERROR', error: `FIELD_ERROR: ${message}` });
    expect(f.fetch.called).to.equal(false);
  });
  it('characterizes partial mount when ACH succeeds before card layout fails [FC04]', async () => {
    containers([...completeAch, 'number']);
    const result = await payTheoryFields({ apiKey: key }); expect(result.type).to.equal('ERROR');
    expect(document.getElementById(data.defaultElementIds['account-number']).children).to.have.length(1);
    expect(document.getElementById(data.defaultElementIds.number).children).to.have.length(0);
  });
  for (const selector of ['invoiceId', 'linkId', 'recurringHash', 'sessionId']) it(`constructs checkout ${selector} and forwards exact token selector [FC04]`, async () => {
    containers(['credit-card']); const promise = payTheoryFields({ checkoutContext: { [selector]: 'ctx+&' } }); const elements = await ready();
    expect(await promise).to.deep.equal({ type: 'READY', body: true }); expect(elements[0]._checkoutContext).to.deep.equal({ [selector]: 'ctx+&' });
    expect(new URL(f.fetch.firstCall.args[0]).searchParams.values().next().value).to.equal('ctx+&');
  });
  it('characterizes custom separate-card IDs being misclassified by the hardcoded validator [FC04]', async () => {
    const ids = containers(completeCard, true);
    const result = await payTheoryFields({ apiKey: key, elementIds: ids });
    expect(result).to.deep.equal({ type: 'ERROR', error: 'FIELD_ERROR: expiration is not allowed when using combined credit card' });
    expect(f.fetch.called).to.equal(false);
  });
  it('does not reuse a session outside the configured hosted-checkout host [FC05]', async () => {
    containers(['credit-card']); const promise = payTheoryFields({ apiKey: key, session: 'supplied-session' }); const [element] = await ready(); await promise;
    expect(element._session).not.to.equal('supplied-session'); expect(element._session).to.match(/^[0-9a-f-]{36}$/);
    const uuid = f.sandbox.stub(crypto, 'randomUUID').returns('platform-uuid'); expect(generateUUID()).to.equal('platform-uuid'); uuid.restore();
    f.sandbox.stub(crypto, 'randomUUID').value(undefined); f.sandbox.stub(Math, 'random').returns(0.5);
    expect(generateUUID()).to.equal('88888888-8888-4888-8888-888888888888');
  });
  it('supports the actual legacy controller mount and deprecated transaction entry [FC09]', async () => {
    containers(['credit-card']);
    const controller = await legacyCreate(key, 'ignored-client', {}, { legacy: true }, 'merchant_fee');
    expect(controller).to.have.property('mount'); expect(controller).to.have.property('initTransaction');
    const promise = controller.mount({ session: 'legacy-session' }); await ready(); expect(await promise).to.equal(undefined);
    const warn = f.sandbox.stub(console, 'warn'); controller.initTransaction(-1, {}, true); expect(warn.calledOnce).to.equal(true);
    expect(warn.firstCall.args[0]).to.match(/deprecated/);
  });
  it('real DOM discovery distinguishes hidden, duplicate and missing transacting elements', async () => {
    expect(dom.isHidden(undefined)).to.equal(true);
    const first = f.mount(data.CARD_NUMBER); const second = f.mount(data.BANK_ACCOUNT_NUMBER); await f.prepare(first); await f.prepare(second);
    expect(dom.findTransactingElement()).to.equal(second); // Current duplicate path reports but keeps map-order bank first.
    second.style.display = 'none'; expect(dom.findTransactingElement()).to.equal(first);
    f.root.style.display = 'none'; expect(dom.findTransactingElement()).to.equal(false);
    f.root.style.display = ''; first.remove(); second.remove();
    const container = document.createElement('div'); container.id = 'already-mounted'; f.root.append(container);
    const child = document.createElement('div'); child.id = 'already-mounted-tag-frame'; f.root.append(child);
    const result = dom.processElements({ 'card-number': 'already-mounted' }, { transacting: ['card-number'], siblings: [] });
    expect(result.transacting).to.have.length(0);
    expect(hostedFieldsEndpoint).to.match(/^https:/);
  });
});
