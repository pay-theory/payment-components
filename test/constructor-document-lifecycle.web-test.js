import { expect } from '@open-wc/testing';

// Each case owns a fresh document/registry/module graph. The synthetic readyState
// property is scoped to that document; the production constructor is unmodified.
describe('actual constructor document timing and shared cleanup characterization [FC03/05/06/08]', () => {
  let frame, win, channels, listeners;
  beforeEach(async () => {
    frame = document.createElement('iframe');
    const loaded = new Promise(resolve => { frame.onload = resolve; });
    frame.src = new URL('./support/constructor-document.html', import.meta.url).href; document.body.append(frame); await loaded;
    win = frame.contentWindow; win.process = { env: { NODE_ENV: 'test', ENV: 'test', STAGE: 'api' } };
    win.__coverage__ = window.__coverage__;
    channels = []; listeners = [];
    const NativeChannel = win.MessageChannel;
    win.MessageChannel = new Proxy(NativeChannel, { construct(target, args) { const channel = Reflect.construct(target, args); channels.push(channel); return channel; } });
    const add = win.addEventListener.bind(win);
    win.addEventListener = (type, listener, options) => { listeners.push([type, listener, options]); add(type, listener, options); };
    await win.eval(`import(${JSON.stringify(new URL('../src/index.ts', import.meta.url).href)})`);
  });
  afterEach(() => { for (const [type, listener, options] of listeners) win.removeEventListener(type, listener, options); for (const channel of channels) { channel.port1.close(); channel.port2.close(); } frame.remove(); });
  const checkpoint = () => new Promise(resolve => { const channel = new MessageChannel(); channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolve(); }; channel.port2.postMessage('checkpoint'); });
  it('initializes an already-complete fresh document immediately', async () => {
    Object.defineProperty(win.document, 'readyState', { configurable: true, get: () => 'complete' });
    expect(await win.paytheory.payTheoryFields({ apiKey: 'test-api-synthetic' })).to.deep.equal({ type: 'ERROR', error: 'NO_FIELDS: There are no PayTheory fields on the DOM to mount' });
  });
  it('waits for DOMContentLoaded in a loading document then performs real validation', async () => {
    Object.defineProperty(win.document, 'readyState', { configurable: true, get: () => 'loading' });
    let settled = false; const promise = win.paytheory.payTheoryFields({}).then(result => { settled = true; return result; });
    await checkpoint(); expect(settled).to.equal(false);
    win.document.dispatchEvent(new win.Event('DOMContentLoaded'));
    expect(await promise).to.deep.equal({ type: 'ERROR', error: 'INVALID_PARAM: Provide either apiKey or checkoutContext.' });
  });
  it('characterizes interactive initialization remaining pending after the real DOMContentLoaded deadline', async () => {
    Object.defineProperty(win.document, 'readyState', { configurable: true, get: () => 'interactive' });
    let settled = false; win.paytheory.payTheoryFields({}).then(() => { settled = true; });
    await checkpoint(); expect(settled).to.equal(false);
    // A second synthetic event demonstrates what the existing listener waits for;
    // browsers do not promise a second event after this constructor call.
    win.document.dispatchEvent(new win.Event('DOMContentLoaded')); await checkpoint(); expect(settled).to.equal(true);
  });
  it('captures listener installation before a no-fields error and fixture-owned disposal', async () => {
    Object.defineProperty(win.document, 'readyState', { configurable: true, get: () => 'complete' });
    const before = listeners.filter(row => row[0] === 'message').length;
    await win.paytheory.payTheoryFields({ apiKey: 'test-api-synthetic' });
    expect(listeners.filter(row => row[0] === 'message').length - before).to.equal(3);
  });
  it('characterizes shared group relay cleanup when one actual transactional element disconnects', async () => {
    Object.defineProperty(win.document, 'readyState', { configurable: true, get: () => 'complete' });
    for (const id of ['pay-theory-credit-card', 'pay-theory-cash-name', 'pay-theory-cash-contact']) { const div = win.document.createElement('div'); div.id = id; win.document.body.append(div); }
    // No readiness response is invented. Mount side effects are synchronous, and
    // the real constructor's channel is closed by fixture teardown.
    win.paytheory.payTheoryFields({ apiKey: 'test-api-synthetic', session: 'same-origin-empty-host-session' });
    const card = win.document.getElementsByName('pay-theory-credit-card-tag-frame')[0];
    const cash = win.document.getElementsByName('pay-theory-cash-name-tag-frame')[0];
    expect(card).not.to.equal(undefined); expect(cash).not.to.equal(undefined);
    const removals = []; const remove = win.removeEventListener.bind(win);
    win.removeEventListener = (type, listener, options) => { removals.push([type, listener]); remove(type, listener, options); };
    card.remove();
    const count = removals.filter(row => row[0] === 'message').length; expect(count).to.equal(6);
    cash.remove();
    expect(removals.filter(row => row[0] === 'message').length).to.equal(12);
    expect(card._session).not.to.equal('same-origin-empty-host-session'); // A local merchant host does not match the configured hosted checkout.
  });
});
