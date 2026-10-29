import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebSocket } from '@/hooks/communication/useWebSocket';

const binding = vi.hoisted(() => ({ security: null }));
vi.mock('@/components/providers/SecurityProvider/SecurityProvider', () => ({ useSecurity: () => binding.security }));
const cases = JSON.parse(readFileSync(path.join(process.env.CONTRACT_EVIDENCE_DIR, 'socket-wire-messages.json'), 'utf8'));
class Transport extends EventTarget {
  readyState = WebSocket.CONNECTING;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = WebSocket.CLOSED; this.dispatchEvent(new CloseEvent('close', { code: 1000 })); });
  open() { this.readyState = WebSocket.OPEN; this.dispatchEvent(new Event('open')); }
  receive(message) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) })); }
}
beforeEach(() => {
  vi.useFakeTimers();
  binding.security = { shouldEncodeAction: vi.fn(() => true), shouldDecryptMessage: vi.fn(() => false),
    hasEncryptionBox: vi.fn(() => false), setServerPublicKey: vi.fn() };
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network forbidden'); }));
});
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('Actual socket corpus through actual hosted WebSocket request correlation', () => {
  it.each(cases)('$case preserves the complete decrypted reply and correlation', async wire => {
    const socket = new Transport();
    const unsolicited = vi.fn();
    const view = renderHook(() => useWebSocket({ webSocketFactory: () => socket, onMessage: unsolicited }));
    await act(async () => { await view.result.current.connect('wss://synthetic.invalid'); socket.open(); });
    let pending;
    act(() => { pending = view.result.current.send({ action: 'host:tokenize', messageId: wire.messageId,
      encoded: { hostToken: 'synthetic' }, publicKey: 'synthetic-client' }); });
    expect(view.result.current.getConnectionInfo().pendingRequestCount).toBe(1);
    const reply = { type: wire.type, body: wire.body, messageId: wire.messageId };
    await act(async () => { socket.receive(reply); expect(await pending).toEqual(reply); });
    expect(view.result.current.getConnectionInfo().pendingRequestCount).toBe(0);
    expect(unsolicited).not.toHaveBeenCalled();
    if (wire.type === 'host_token') expect(binding.security.setServerPublicKey).toHaveBeenCalledExactlyOnceWith(wire.body.publicKey);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
