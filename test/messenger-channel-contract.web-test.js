import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import MessengerChannel from '../src/messenger/messenger-channel.ts';
import * as types from '../src/messenger/constants.ts';

// The peer is a transport boundary, not a replacement for MessengerChannel.
// Envelopes match secure-tags-lib/src/hooks/action/useMessenger/handlers.ts.
describe('SDK MessageChannel wire contract', () => {
  let subject;
  let peer;
  let sent;
  afterEach(() => {
    subject?.disconnect();
    peer?.close();
    sinon.restore();
  });
  async function connect() {
    subject = new MessengerChannel({
      contentWindow: {
        postMessage(message, target, ports) {
          expect(target).to.equal('*');
          expect(message.type).to.equal('pt-messenger:establish_channel');
          expect(message.messageId).to.match(/^pt-messenger:establish_channel_0_\d+$/);
          peer = ports[0];
          peer.onmessage = event => sent(event.data);
          peer.postMessage({
            type: 'pt-messenger:connection_ack',
            messageId: message.messageId,
            success: true,
          });
        },
      },
    });
    await subject.connect();
  }
  it('requires connection before issuing commands', async () => {
    subject = new MessengerChannel({});
    try {
      await subject.sendMessage(types.PT_MESSENGER_MERCHANT_VALIDATION);
      throw Error('expected rejection');
    } catch (error) {
      expect(error.message).to.equal('Channel not connected');
    }
  });
  it('preserves all four command envelopes and complete correlated responses', async () => {
    await connect();
    const commands = [
      [
        types.PT_MESSENGER_MERCHANT_VALIDATION,
        undefined,
        types.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
        { body: { success: true, session: { merchantIdentifier: 'synthetic' } } },
      ],
      [
        types.PT_MESSENGER_WALLET_TRANSACTION,
        {
          wallet_type: 'APPLE_PAY',
          amount: 100,
          digital_wallet_payload: JSON.stringify({ synthetic: true }),
        },
        types.PT_MESSENGER_TRANSFER_COMPLETE,
        { body: { transaction: { status: 'SUCCEEDED', receipt_number: 'receipt' } } },
      ],
      [
        types.PT_MESSENGER_RECONNECT_TOKEN,
        { token: 'synthetic-renewed' },
        types.PT_MESSENGER_RECONNECT_TOKEN_SUCCESS,
        { success: true },
      ],
      [
        types.PT_MESSENGER_RESEND_INVOICE_EMAIL,
        undefined,
        types.PT_MESSENGER_RESEND_INVOICE_EMAIL_SUCCESS,
        { success: true },
      ],
    ];
    for (const [type, data, reply, body] of commands) {
      let expected;
      sent = message => {
        expect(message.type).to.equal(type);
        expect(message.data).to.deep.equal(data);
        expected = { type: reply, messageId: message.messageId, ...body };
        peer.postMessage({ ...expected, messageId: 'unrelated' });
        peer.postMessage(expected);
      };
      expect(await subject.sendMessage(type, data)).to.deep.equal(expected);
    }
    await subject.connect(); // idempotent; does not create a second handshake
  });
  it('matches concurrent responses by ID even when the peer replies in reverse order', async () => {
    await connect();
    const messages = [];
    sent = message => {
      messages.push(message);
      if (messages.length === 2)
        for (const item of [...messages].reverse())
          peer.postMessage({
            type: types.PT_MESSENGER_SOCKET_ERROR,
            messageId: item.messageId,
            body: { error: item.data },
          });
    };
    const [one, two] = await Promise.all([
      subject.sendMessage(types.PT_MESSENGER_WALLET_TRANSACTION, 'one'),
      subject.sendMessage(types.PT_MESSENGER_WALLET_TRANSACTION, 'two'),
    ]);
    expect(one.body).to.deep.equal({ error: 'one' });
    expect(two.body).to.deep.equal({ error: 'two' });
    expect(one.messageId).not.to.equal(two.messageId);
  });
  it('rejects pending commands on disconnect and permits a fresh connection', async () => {
    await connect();
    sent = () => {};
    const pending = subject
      .sendMessage(types.PT_MESSENGER_RESEND_INVOICE_EMAIL)
      .catch(error => error);
    subject.disconnect();
    expect((await pending).message).to.equal('Channel disconnected');
    subject.disconnect();
  });
  it('expires an unanswered handshake after exactly five seconds', async () => {
    const clock = sinon.useFakeTimers();
    subject = new MessengerChannel({ contentWindow: { postMessage() {} } });
    const pending = subject.connect().catch(error => error);
    await clock.tickAsync(4999);
    expect(subject.pendingMessages.size).to.equal(1);
    await clock.tickAsync(1);
    expect((await pending).message).to.match(/^Message timeout: pt-messenger:establish_channel/);
    expect(subject.pendingMessages.size).to.equal(0);
  });
  it('expires unanswered commands after thirty seconds and removes their correlation IDs', async () => {
    await connect();
    sent = () => {};
    const clock = sinon.useFakeTimers();
    const pending = subject
      .sendMessage(types.PT_MESSENGER_WALLET_TRANSACTION)
      .catch(error => error);
    await clock.tickAsync(30000);
    expect((await pending).message).to.match(/^Message timeout: pt-messenger:wallet_transaction/);
    expect(subject.pendingMessages.size).to.equal(0);
  });
});
