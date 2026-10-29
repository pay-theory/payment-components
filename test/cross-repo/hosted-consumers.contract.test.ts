import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMessengerHarness, sdkWalletContractFixture } from '@/test/messengerContractHarness';
import { useMessenger } from '@/hooks/action/useMessenger/useMessenger';
import { useButton } from '@/hooks/action/useButton';
import { generateQrCheckoutUrl } from '@/components/CheckoutQr/utils';
import * as M from '@/constants/messageTypes';
const binding = vi.hoisted(() => ({ harness: null as any }));
vi.mock('@/components/providers', () => ({ useCommunication: () => binding.harness.communication, useSecurity: () => binding.harness.security }));
vi.mock('@/hooks/field', () => ({ useTokenFromUrl: () => ({ token: 'synthetic-token', origin: 'https://merchant.invalid', style: {}, checkoutDetails: { amount: 1000 } }) }));
const corpus = JSON.parse(readFileSync(path.join(process.env.CONTRACT_EVIDENCE_DIR!, 'socket-wire-messages.json'), 'utf8'));
const rows = (type: string) => corpus.filter((row: any) => row.type === type);
let h: ReturnType<typeof createMessengerHarness>;
beforeEach(() => {
  h = createMessengerHarness(); binding.harness = h;
  vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('Actual producer control replies through actual hosted consumer callbacks', () => {
  it.each(rows('host_token'))('$case initializes and reconnects without changing token/key values', async wire => {
    h.socket.send.mockResolvedValue(wire);
    const { result } = renderHook(() => useMessenger());
    await act(async () => { expect(await result.current.__testHandlers!.sendHostToken('synthetic-token')).toBe(true); });
    expect(h.security.setServerPublicKey).toHaveBeenCalledExactlyOnceWith(wire.body.publicKey);
    expect(h.postMessage.sendMessage).toHaveBeenCalledExactlyOnceWith({ type: M.PT_MESSENGER_READY });
    h.postMessage.sendMessage.mockClear();
    await act(async () => { expect(await result.current.__testHandlers!.sendHostToken('new-token', 'reconnect')).toBe(true); });
    expect(h.postMessage.sendMessage).toHaveBeenCalledExactlyOnceWith({ type: M.PT_MESSENGER_RECONNECT_TOKEN_SUCCESS, success: true, messageId: 'reconnect' }, 'reconnect');
  });
  it.each(rows('apple_merchant_validation'))('$case preserves the real merchant session under the SDK envelope', async wire => {
    h.socket.send.mockResolvedValue(wire); renderHook(() => useMessenger());
    await act(async () => { await h.emit(M.PT_MESSENGER_MERCHANT_VALIDATION); });
    expect(h.postMessage.sendMessage).toHaveBeenCalledExactlyOnceWith({ type: M.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
      messageId: 'request-id', body: { success: true, session: wire.body.apple_pay_session_obj } }, 'request-id');
  });
  it.each(rows('resend_invoice_email_success'))('$case remains a correlated successful resend result', async wire => {
    renderHook(() => useMessenger());
    await act(async () => { await h.connections[0]!(); });
    h.socket.send.mockClear(); h.postMessage.sendMessage.mockClear(); h.socket.send.mockResolvedValue(wire);
    await act(async () => { await h.emit(M.PT_MESSENGER_RESEND_INVOICE_EMAIL); });
    expect(h.postMessage.sendMessage).toHaveBeenCalledExactlyOnceWith({ type: M.PT_MESSENGER_RESEND_INVOICE_EMAIL_SUCCESS,
      messageId: 'request-id', success: true }, 'request-id');
  });
  it.each(corpus.filter((row: any) => row.case.startsWith('wallet-')))('$case remains a completed SDK wallet transaction', async wire => {
    renderHook(() => useMessenger());
    await act(async () => { await h.connections[0]!(); });
    h.socket.send.mockClear(); h.postMessage.sendMessage.mockClear(); h.socket.send.mockResolvedValue(wire);
    await act(async () => { await h.emit(M.PT_MESSENGER_WALLET_TRANSACTION, sdkWalletContractFixture(wire.case.slice(7)).wire); });
    expect(h.postMessage.sendMessage).toHaveBeenCalledExactlyOnceWith({ type: M.PT_MESSENGER_TRANSFER_COMPLETE,
      messageId: 'request-id', body: { transaction: wire.body } }, 'request-id');
    expect(typeof h.socket.send.mock.calls[0]![0].encoded.digital_wallet_payload).toBe('string');
  });
  it.each(rows('hosted_checkout'))('$case preserves encoded sessionId in the actual button callback and QR URL builder', async wire => {
    h.socket.send.mockResolvedValue(wire);
    const { result } = renderHook(() => useButton());
    await act(async () => { await h.connections[0]!(); });
    expect(result.current.buttonState.sessionReady).toBe(true);
    expect(h.postMessage.sendMessage).toHaveBeenCalledExactlyOnceWith({ type: M.PT_STATIC_BUTTON_READY, sessionId: wire.body.sessionId });
    const url = generateQrCheckoutUrl({ sessionId: wire.body.sessionId, partner: 'synthetic', stage: 'dev' });
    expect(url).toContain(`sessionId=${wire.body.sessionId}`);
    expect(JSON.parse(Buffer.from(decodeURIComponent(wire.body.sessionId), 'base64').toString())).toEqual({ merchant_uid: 'merchant', session_id: 'session' });
  });
  it.each(['error', 'unknown'])('characterizes the existing Apple %s reply gap without manufacturing correlated success', async mode => {
    const wire = mode === 'error' ? corpus.find((row: any) => row.case === 'transfer-transport-False')
      : { type: 'synthetic-unknown-reply', body: {} };
    h.socket.send.mockResolvedValue(wire); renderHook(() => useMessenger());
    await act(async () => { await h.emit(M.PT_MESSENGER_MERCHANT_VALIDATION); });
    expect(h.socket.send).toHaveBeenCalledOnce();
    expect(h.postMessage.sendMessage).not.toHaveBeenCalled();
    // The hook completes without a reply. Native SDK timeout behavior is checked
    // by the browser suite; this is not a fabricated full-stack timeout result.
  });
  it('uses an actual socket error envelope to reject reconnect without a false READY', async () => {
    h.socket.send.mockResolvedValue(corpus.find((row: any) => row.case === 'transfer-transport-False'));
    const { result } = renderHook(() => useMessenger());
    await act(async () => { expect(await result.current.__testHandlers!.sendHostToken('expired', 'renew')).toBe(false); });
    expect(h.postMessage.sendMessage).toHaveBeenCalledExactlyOnceWith({ type: M.PT_MESSENGER_RECONNECT_TOKEN_SUCCESS,
      success: false, messageId: 'renew' }, 'renew');
    expect(h.security.setServerPublicKey).not.toHaveBeenCalled();
  });

});
