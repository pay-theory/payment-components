import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import MessengerChannel from '../src/messenger/messenger-channel.ts';
import * as types from '../src/messenger/constants.ts';
import { sendAsyncPostMessage } from '../src/common/message.ts';
import { fixture, data } from './support/real-fields-fixture.js';

describe('actual native-channel adversarial and pending-response contracts [packet E]', () => {
  let subject, peer, sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { subject?.disconnect(); peer?.close(); sandbox.restore(); });
  const connect = async (ack = {}) => {
    const iframe = { contentWindow: { postMessage(message, origin, ports) {
      expect(origin).to.equal('*'); // Existing handshake transport contract; no origin behavior changed.
      peer = ports[0];
      peer.postMessage({ type: types.PT_MESSENGER_CONNECTION_ACK, messageId: message.messageId, success: true, ...ack });
    } } };
    subject = new MessengerChannel(iframe); await subject.connect();
  };
  it('characterizes negative handshake acknowledgment currently establishing a channel', async () => {
    await connect({ success: false, error: 'synthetic-negative-ack' });
    expect(subject.connected).to.equal(true); expect(subject.pendingMessages.size).to.equal(0);
  });
  it('characterizes a correlated wrong handshake type resolving initialization without connection', async () => {
    await connect({ type: 'unexpected:ack' });
    expect(subject.connected).to.equal(false);
    expect((await subject.sendMessage(types.PT_MESSENGER_RESEND_INVOICE_EMAIL).catch(error => error)).message).to.equal('Channel not connected');
  });
  it('ignores uncorrelated, primitive and malformed messages; explicitly exposes null destructuring failure', async () => {
    await connect();
    for (const value of [1, 'invalid', {}, { messageId: 'foreign', type: 'unknown' }]) expect(() => subject.handleMessage({ data: value })).not.to.throw();
    for (const value of [null, undefined]) expect(() => subject.handleMessage({ data: value })).to.throw(TypeError);
    expect(subject.pendingMessages.size).to.equal(0);
  });
  it('ignores a late response after timeout and never resolves the next request with a stale ID', async () => {
    await connect(); const received = []; peer.onmessage = event => received.push(event.data);
    const clock = sandbox.useFakeTimers(); const expired = subject.sendMessage(types.PT_MESSENGER_WALLET_TRANSACTION).catch(error => error);
    await clock.tickAsync(30000); expect((await expired).message).to.match(/^Message timeout:/);
    expect(subject.pendingMessages.size).to.equal(0);
    await clock.tickAsync(0);
    const stale = received[0];
    subject.handleMessage({ data: { messageId: stale.messageId, type: 'unexpected' } });
    expect(subject.pendingMessages.size).to.equal(0);
    clock.restore();
    peer.onmessage = event => {
      peer.postMessage({ type: 'unvalidated:response-type', messageId: event.data.messageId, body: { n: 0, f: false } });
      peer.postMessage({ type: 'duplicate', messageId: event.data.messageId, body: 'must-not-overwrite' });
    };
    const result = await subject.sendMessage(types.PT_MESSENGER_RESEND_INVOICE_EMAIL);
    expect(result).to.include({ type: 'unvalidated:response-type' }); expect(result.body).to.deep.equal({ n: 0, f: false });
    expect(subject.pendingMessages.size).to.equal(0);
  });
  it('characterizes synchronous port serialization failure retaining the pending entry until disconnect', async () => {
    await connect();
    sandbox.stub(subject.port, 'postMessage').throws(new DOMException('Synthetic transfer failure', 'DataCloneError'));
    const result = await subject.sendMessage(types.PT_MESSENGER_WALLET_TRANSACTION).catch(error => error);
    expect(result.name).to.equal('DataCloneError'); expect(subject.pendingMessages.size).to.equal(1);
    subject.disconnect(); expect(subject.pendingMessages.size).to.equal(0);
  });
  it('bounds a missing iframe-window handshake with its real five-second deadline', async () => {
    const clock = sandbox.useFakeTimers(); subject = new MessengerChannel({ contentWindow: null });
    const result = subject.connect().catch(error => error); await clock.tickAsync(5000);
    expect((await result).message).to.match(/^Message timeout:/); expect(subject.pendingMessages.size).to.equal(0);
  });
});

describe('common native postMessage helper has a distinct no-deadline contract', () => {
  let f; beforeEach(() => { f = fixture(); }); afterEach(() => f.cleanup());
  it('stays pending without a reply and settles when the controlled real peer is released', async () => {
    const element = f.mount(data.CARD_NUMBER); const [iframe] = await f.prepare(element, {}, true);
    let settled = false;
    const pending = sendAsyncPostMessage({ type: 'pt-static:connection_token', async: true }, iframe).then(value => { settled = true; return value; });
    const clock = f.sandbox.useFakeTimers(); await clock.tickAsync(300000); expect(settled).to.equal(false);
    clock.restore(); await f.command(iframe, 'release');
    expect(await pending).to.deep.equal({ type: 'pt-static:connected', element: 'card-number' });
  });
});
