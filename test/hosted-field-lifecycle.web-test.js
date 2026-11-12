import { expect } from '@open-wc/testing';
import { fixture, data, hostedFieldsEndpoint } from './support/real-fields-fixture.js';
import { handleHostedFieldMessage } from '../src/common/message.ts';

describe('real hosted element lifecycle, readiness, state and cleanup [HF01-HF12/HF18]', () => {
  let f;
  beforeEach(() => { f = fixture(); });
  afterEach(() => f.cleanup());
  for (const [name, country, fields] of [
    [data.COMBINED_CARD, 'USA', ['card-number', 'card-exp', 'card-cvv']],
    [data.BANK_ACCOUNT_NUMBER, 'USA', ['account-number']],
    [data.BANK_ACCOUNT_NUMBER, 'CAN', ['account-number']],
    [data.CASH_NAME, 'USA', ['cash-name']],
  ]) it(`mounts actual ${name}/${country} with encoded configuration and native frames [HF01/04]`, async () => {
    const element = f.mount(name, { country, amount: 125, styles: { default: { color: 'blue' } }, placeholders: { accountNumber: 'Synthetic' } });
    const frames = await f.prepare(element);
    expect(element.field).to.equal(name === data.COMBINED_CARD ? 'credit-card' : fields[0]);
    expect(frames.map(frame => frame.name)).to.deep.equal(fields.map(field => `${field}-iframe`));
    for (const frame of frames) {
      expect(new URL(frame.src).origin).to.equal(hostedFieldsEndpoint);
      const config = JSON.parse(atob(decodeURI(new URL(frame.src).searchParams.get('token'))));
      expect(config).to.deep.equal({ origin: location.origin, styles: { default: { color: 'blue' } }, placeholders: { accountNumber: 'Synthetic' }, amount: 125, country });
    }
    await f.command(frames[0], 'announce');
    await f.wait(() => element.ready);
    expect(element.connected).to.equal(true);
    expect(f.fetch.calledOnce).to.equal(true);
    expect(f.fetch.firstCall.args[1].headers).to.include({ 'x-api-key': 'test-api-synthetic', 'x-session-key': 'synthetic-session' });
    const connection = f.ledger.find(row => row.message.type === 'pt-static:connection_token');
    expect(connection.message.data).to.deep.equal({ token: 'synthetic-fixture-token', origin: 'https://merchant.invalid', fields: element._processedElements });
    expect(connection.message.async).to.equal(true);
  });
  it('preserves empty versus default styles/placeholders and missing container behavior [HF02]', () => {
    const element = f.mount(data.CARD_NUMBER, { styles: undefined, placeholders: undefined });
    expect(JSON.parse(atob(decodeURI(element.createToken())))).to.deep.include({ styles: { default: {}, success: {}, error: {} }, placeholders: {} });
    element.styles = {};
    element.placeholders = {};
    expect(JSON.parse(atob(decodeURI(element.createToken()))).styles).to.deep.equal({});
    element.appendElement(document.createElement('span'));
    expect(element.querySelector('span')).not.to.equal(null);
    element.querySelector('.framed').remove();
    expect(() => element.appendElement(document.createElement('span'))).not.to.throw();
  });
  it('ignores unrelated/wrong-origin readiness and accepts a genuine hosted-origin peer [HF03]', async () => {
    const element = f.mount(); const frames = await f.prepare(element);
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://attacker.invalid', data: { type: 'pt-static:pt_token_ready', element: 'card-number' } }));
    await f.command(frames[0], 'emit', { message: { type: 'pt-static:pt_token_ready', element: 'cash-name' } });
    expect(f.fetch.called).to.equal(false);
    await f.command(frames[0], 'announce'); await f.wait(() => element.ready);
    expect(f.fetch.calledOnce).to.equal(true);
  });
  for (const key of ['invoiceId', 'linkId', 'recurringHash', 'sessionId']) it(`uses checkout ${key} without API credential headers [HF04]`, async () => {
    const element = f.mount(data.CARD_NUMBER, { checkoutContext: { [key]: 'a b/&' } });
    await f.prepare(element); const result = await element.sendPtToken();
    expect(result).to.deep.equal({ type: 'READY', element: 'card-number' });
    const [url, options] = f.fetch.firstCall.args;
    expect(new URL(url).searchParams.values().next().value).to.equal('a b/&');
    expect(options.headers).not.to.have.property('x-api-key');
    expect(options.headers).to.deep.equal(key === 'sessionId' ? {} : { 'x-session-key': 'synthetic-session' });
  });
  it('normalizes missing token, thrown fetch, absent iframe and negative peer as NO_TOKEN without readiness [HF05]', async () => {
    const element = f.mount(data.CARD_NUMBER); const frames = await f.prepare(element);
    await f.command(frames[0], 'configure', { replies: { 'pt-static:connection_token': { type: 'pt-static:error', error: 'synthetic' } } });
    expect((await element.sendPtToken()).error).to.equal('NO_TOKEN: Unable validate connection token');
    expect(element.ready).to.equal(false);
    frames[0].remove();
    expect((await element.sendPtToken()).error).to.equal('NO_TOKEN: Unable to find transacting iframe');
    f.fetch.callsFake(async () => { throw new Error('offline'); });
    const clock = f.sandbox.useFakeTimers(); const failed = element.sendPtToken(); await clock.runAllAsync();
    expect((await failed).error).to.equal('NO_TOKEN: Unable to fetch pt-token');
    f.fetch.callsFake(async () => ({ json: async () => ({}) }));
    const missing = element.sendPtToken(); await clock.runAllAsync();
    expect((await missing).error).to.equal('NO_TOKEN: Unable to fetch pt-token');
    expect(element.connected).to.equal(false);
  });
  it('readies once per element, resets with a second token and preserves READY port shape [HF06/07]', async () => {
    const card = f.mount(); const bank = f.mount(data.BANK_ACCOUNT_NUMBER);
    await f.prepare(card); await f.prepare(bank);
    const channel = new MessageChannel(); card.readyPort = channel.port2;
    const portResult = new Promise(resolve => { channel.port1.onmessage = ({ data: value }) => { channel.port1.close(); channel.port2.close(); resolve(value); }; });
    await card.sendPtToken();
    expect(f.events.filter(event => event?.type === 'pay-theory:ready')).to.have.length(0);
    await bank.sendPtToken();
    card.sendReadyMessage();
    expect(await portResult).to.deep.equal({ type: 'pay-theory:ready-channel', data: true });
    const before = f.events.filter(event => event?.type === 'pay-theory:ready').length;
    expect((await card.resetToken()).type).to.equal('READY');
    expect(f.ledger.filter(row => row.message.type === 'pt-static:reset_host')).to.have.length(1);
    expect(f.events.filter(event => event?.type === 'pay-theory:ready')).to.have.length(before);
    expect(card.connected).to.equal(true);
  });
  it('amount sends only after ready and fee reconnect resets before update [HF08/09]', async () => {
    const element = f.mount(data.CARD_NUMBER, { amount: 100 }); const frames = await f.prepare(element);
    element.amount = 101;
    expect(f.ledger).to.have.length(0);
    await element.sendPtToken(); element.amount = 0;
    await f.wait(() => f.ledger.some(row => row.message.type === 'pt-static:update-amount'));
    expect(f.ledger.at(-1).message).to.deep.equal({ type: 'pt-static:update-amount', amount: 0 });
    const previous = f.ledger.length;
    await element.handleFeeCalcReconnect({ field: 'cash-name' });
    expect(f.ledger.length).to.equal(previous);
    await element.handleFeeCalcReconnect({ field: 'card-number' });
    await f.wait(() => f.ledger.filter(row => row.message.type === 'pt-static:update-amount').length === 2);
    expect(f.ledger.slice(-2).map(row => row.message.type)).to.deep.equal(['pt-static:reset_host', 'pt-static:update-amount']);
    await f.command(frames[0], 'configure', { replies: { 'pt-static:reset_host': { type: 'pt-static:error' } } });
    await element.handleFeeCalcReconnect({ field: 'card-number' });
    expect(f.ledger.at(-1).message.type).to.equal('pt-static:reset_host');
  });
  it('processes own and unrelated fees, including zero and bank/ACH legacy aliases [HF08/12]', async () => {
    const card = f.mount(); const bank = f.mount(data.BANK_ACCOUNT_NUMBER); const cash = f.mount(data.CASH_NAME);
    await f.prepare(card); await f.prepare(bank); await f.prepare(cash);
    card.handleFeeMessage({ field: 'account-number', body: { fee: 9 } }); expect(card.fee).to.equal(undefined);
    bank.handleFeeMessage({ field: 'account-number', body: { fee: 0 } });
    await f.wait(() => f.events.some(event => event?.type === 'pay-theory:state'));
    expect(f.events.filter(event => event?.type === 'pay-theory:state').at(-1).data.service_fee).to.include({ bank_fee: 0, ach_fee: 0 });
    card.sendStateMessage();
    await f.wait(() => f.events.some(event => event?.type === 'pay-theory:state' && event.data.service_fee.card_fee === undefined && event.data.service_fee.bank_fee === undefined));
    // Existing sibling collection uses a truthy check: zero is preserved for
    // the owning bank element but omitted when another group publishes state.
    const siblingZero = f.events.filter(event => event?.type === 'pay-theory:state' && event.data.service_fee.bank_fee === undefined).at(-1).data.service_fee;
    expect(siblingZero.ach_fee).to.equal(undefined);
    card.fee = 4; bank.fee = 7; cash.fee = 8;
    card.sendStateMessage();
    await f.wait(() => f.events.some(event => event?.type === 'pay-theory:state' && event.data.service_fee.card_fee === 4 && event.data.service_fee.bank_fee === 7));
    const state = f.events.filter(event => event?.type === 'pay-theory:state' && event.data.service_fee.card_fee === 4 && event.data.service_fee.bank_fee === 7).at(-1).data;
    expect(state.service_fee).to.include({ card_fee: 4, bank_fee: 7, ach_fee: 7 });
    expect(state.service_fee).not.to.have.property('cash_fee');
    expect(card.feeMode).to.equal(undefined); card.feeMode = 'service_fee'; expect(card.feeMode).to.equal('service_fee');
    expect(card.complete).to.equal(false); card.complete = true; expect(card.complete).to.equal(true);
  });
  for (const [name, country] of [[data.COMBINED_CARD, 'USA'], [data.BANK_ACCOUNT_NUMBER, 'USA'], [data.BANK_ACCOUNT_NUMBER, 'CAN'], [data.CASH_NAME, 'USA']]) it(`updates dirty/error/valid state for ${name}/${country} [HF10/11/12]`, async () => {
    const element = f.mount(name, { country }); await f.prepare(element);
    element.state = undefined;
    element.state = { element: 'unknown', isDirty: true, errorMessages: [] };
    const state = (field, dirty, errors) => { element.state = { element: field, isDirty: dirty, errorMessages: errors, isConnected: true }; };
    const required = element._requiredValidFields;
    element.processedElements = element.field === 'credit-card' ? ['credit-card', 'billing-zip'] : required;
    for (const field of required) state(field, true, ['Invalid synthetic field']);
    expect(element.valid).to.equal(false); expect(element.error).to.equal('Invalid synthetic field');
    for (const field of required) state(field, true, []);
    expect(element.valid).to.equal(true); expect(element.error).to.equal('');
    state(required[0], false, []); expect(element.valid).to.equal(false);
    state(required[0], true, []); expect(element.valid).to.equal(true);
    element.sendValidMessage();
    await f.wait(() => f.events.some(event => event?.type === 'pay-theory:valid'));
    const latest = f.events.filter(event => event?.type === 'pay-theory:valid').at(-1).data;
    expect(latest).to.equal(element.transactingType === 'bank' ? 'bank ach' : element.transactingType);
    expect(element.stateGroup[required[0]].isDirty).to.equal(true);
  });
  it('uses the actual hosted listener, then removes host-token/fee/reconnect/group listeners [HF18]', async () => {
    const element = f.mount(data.CARD_NUMBER); const frames = await f.prepare(element);
    let groupCleaned = 0; element.removeEventListeners = () => groupCleaned++;
    const remove = handleHostedFieldMessage(message => message.type === 'fixture-proof', () => {}); remove();
    await f.command(frames[0], 'emit', { message: { type: 'pt-static:calculated_fee', field: 'card-number', body: { fee: 3 } } });
    expect(element.fee).to.equal(3);
    element.remove(); expect(groupCleaned).to.equal(1);
    window.dispatchEvent(new MessageEvent('message', { origin: hostedFieldsEndpoint, data: { type: 'pt-static:calculated_fee', field: 'card-number', body: { fee: 9 } } }));
    expect(element.fee).to.equal(3);
    f.root.append(element); await f.prepare(element); expect(element.fee).to.equal(3);
  });
});
