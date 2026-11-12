import sinon from 'sinon';
import '../../src/components/credit-card/index.ts';
import '../../src/components/credit-card-number/index.ts';
import '../../src/components/credit-card-cvv/index.ts';
import '../../src/components/credit-card-exp/index.ts';
import '../../src/components/credit-card-account-name/index.ts';
import '../../src/components/credit-card-address-1/index.ts';
import '../../src/components/credit-card-address-2/index.ts';
import '../../src/components/credit-card-city/index.ts';
import '../../src/components/credit-card-region/index.ts';
import '../../src/components/credit-card-zip/index.ts';
import '../../src/components/bank-account-name/index.ts';
import '../../src/components/bank-account-number/index.ts';
import '../../src/components/bank-account-type/index.ts';
import '../../src/components/bank-routing-number/index.ts';
import '../../src/components/bank-institution-number/index.ts';
import '../../src/components/bank-transit-number/index.ts';
import '../../src/components/cash-contact/index.ts';
import '../../src/components/cash-name/index.ts';
import '../../src/components/card-present/index.js';
import { hostedFieldsEndpoint } from '../../src/common/network.ts';
import * as data from '../../src/common/data.ts';

export { data, hostedFieldsEndpoint };
export function fixture() {
  const sandbox = sinon.createSandbox();
  const channels = [];
  const NativeMessageChannel = window.MessageChannel;
  sandbox.stub(window, 'MessageChannel').value(new Proxy(NativeMessageChannel, { construct(target, args) { const channel = Reflect.construct(target, args); channels.push(channel); return channel; } }));
  const root = document.createElement('section');
  document.body.append(root);
  const loaded = new Set();
  const ledger = [];
  const events = [];
  const waiters = new Set();
  const pending = new Map();
  let sequence = 0;
  const listener = event => {
    events.push(event.data);
    queueMicrotask(() => {
      for (const waiter of [...waiters]) if (waiter.predicate()) { waiters.delete(waiter); clearTimeout(waiter.timeout); waiter.resolve(); }
    });
    for (const waiter of [...waiters]) if (waiter.predicate()) { waiters.delete(waiter); clearTimeout(waiter.timeout); waiter.resolve(); }
    if (event.origin !== hostedFieldsEndpoint) return;
    if (![...root.querySelectorAll('iframe')].some(frame => frame.contentWindow === event.source)) return;
    if (event.data?.__hostedFixture === 'loaded') loaded.add(event.source);
    if (event.data?.__hostedFixture === 'received') {
      ledger.push(event.data);
      event.source.postMessage({ __hostedFixtureLedgerAck: event.data.receipt }, hostedFieldsEndpoint);
    }
    if (event.data?.__hostedFixture === 'ack') {
      const resolve = pending.get(event.data.id);
      if (resolve) { pending.delete(event.data.id); resolve(); }
    }
    for (const waiter of [...waiters]) if (waiter.predicate()) { waiters.delete(waiter); clearTimeout(waiter.timeout); waiter.resolve(); }
  };
  window.addEventListener('message', listener);
  const installedListeners = sandbox.spy(window, 'addEventListener');
  const wait = predicate => {
    if (predicate()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, timeout: setTimeout(() => { waiters.delete(waiter); reject(new Error('Hosted fixture condition was not met')); }, 5000) };
      waiters.add(waiter);
    });
  };
  const command = async (iframe, action, options = {}) => {
    await wait(() => loaded.has(iframe.contentWindow));
    const id = ++sequence;
    const ack = new Promise(resolve => pending.set(id, resolve));
    iframe.contentWindow.postMessage({ __hostedFixtureCommand: true, id, action, ...options }, hostedFieldsEndpoint);
    await ack;
  };
  const fetch = sandbox.stub(window, 'fetch').callsFake(async () => ({ json: async () => ({ 'pt-token': 'synthetic-fixture-token', origin: 'https://merchant.invalid', challengeOptions: { test: true } }) }));
  const mount = (name = data.COMBINED_CARD, props = {}) => {
    const element = document.createElement(name);
    element.setAttribute('name', name);
    element.country = 'USA';
    element.apiKey = 'test-api-synthetic';
    element.session = 'synthetic-session';
    Object.assign(element, props);
    if (element.field === 'credit-card') element.processedElements = ['credit-card', 'billing-zip'];
    else if (element.field === 'account-number') element.processedElements = element.fieldTypes;
    else if (element.field === 'cash-name') element.processedElements = ['cash-contact', 'cash-name'];
    root.append(element);
    return element;
  };
  const prepare = async (element, replies = {}, held = false) => {
    const iframes = [...element.querySelectorAll('iframe')];
    await Promise.all(iframes.map(frame => command(frame, 'configure', { replies, held })));
    return iframes;
  };
  return {
    root, sandbox, fetch, ledger, events, wait, command, mount, prepare,
    async announce(element) { const frames = await prepare(element); await command(frames[0], 'announce'); await wait(() => element.ready); },
    cleanup() {
      root.remove();
      for (const call of installedListeners.getCalls()) window.removeEventListener(...call.args);
      for (const channel of channels) { channel.port1.close(); channel.port2.close(); }
      window.removeEventListener('message', listener);
      for (const waiter of waiters) clearTimeout(waiter.timeout);
      waiters.clear();
      pending.clear();
      sandbox.restore();
    },
  };
}
