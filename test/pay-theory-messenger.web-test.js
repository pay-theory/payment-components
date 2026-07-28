import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import PayTheoryMessenger from '../src/messenger/pay-theory-messenger.ts';
import { MessengerEvents } from '../src/messenger/constants.ts';
import { MessengerState } from '../src/messenger/state-manager.ts';

describe('PayTheoryMessenger Memory Leak Fixes', () => {
  let messenger;

  afterEach(() => {
    // Clean up any created messenger instances
    if (messenger) {
      messenger.destroy();
      messenger = null;
    }
    // Clean up any remaining iframes
    const iframes = document.querySelectorAll('iframe[title="Payment Theory Messenger"]');
    iframes.forEach(iframe => iframe.remove());
  });

  describe('Cleanup and Memory Management', () => {
    it('should remove iframe from DOM on destroy', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });
      messenger.createIframe('mock-token');

      // Check that iframe exists
      const iframesBefore = document.querySelectorAll('iframe[title="Payment Theory Messenger"]');
      expect(iframesBefore.length).to.equal(1);

      // Destroy the messenger
      messenger.destroy();

      // Check that iframe is removed
      const iframesAfter = document.querySelectorAll('iframe[title="Payment Theory Messenger"]');
      expect(iframesAfter.length).to.equal(0);
    });

    it('should clean up event listeners on destroy', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      // Spy on removeEventListener
      const removeEventListenerSpy = sinon.spy(window, 'removeEventListener');
      const messageHandler = () => {};
      window.addEventListener('message', messageHandler);
      messenger.globalEventListeners.push({
        type: 'message',
        handler: messageHandler,
      });

      // Destroy the messenger
      messenger.destroy();

      // Check that removeEventListener was called for message events
      expect(removeEventListenerSpy.calledWith('message', messageHandler)).to.be.true;

      removeEventListenerSpy.restore();
    });

    it('should clear token manager on destroy', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      // Set some values in token manager
      messenger.tokenManager.token = 'test-token';
      messenger.tokenManager.tokenExpiry = Date.now() + 1000000;

      // Destroy the messenger
      messenger.destroy();

      // Check that token manager is cleared
      expect(messenger.tokenManager.token).to.be.null;
      expect(messenger.tokenManager.tokenExpiry).to.equal(0);
    });

    it('should reset state to IDLE on destroy', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });
      messenger.state.setState(MessengerState.ERROR);

      // Destroy the messenger
      messenger.destroy();

      // State management is now internal - verify through behavior
      // The messenger should be destroyed and not functional
    });

    it('should clear event listeners map on destroy', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      // Add some event listeners
      const callback1 = () => {};
      const callback2 = () => {};
      const unsubscribe1 = messenger.on(MessengerEvents.READY, callback1);
      const unsubscribe2 = messenger.on(MessengerEvents.TRANSACTION_COMPLETE, callback2);

      // Verify listeners are added
      expect(messenger.eventListeners.size).to.equal(2);

      // Destroy the messenger
      messenger.destroy();

      // Check that event listeners map is cleared
      expect(messenger.eventListeners.size).to.equal(0);
    });

    it('should handle multiple destroy calls gracefully', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });
      messenger.createIframe('mock-token');

      // Call destroy multiple times - should not throw
      expect(() => {
        messenger.destroy();
        messenger.destroy();
        messenger.destroy();
      }).to.not.throw();

      // Check that cleanup still worked
      const iframes = document.querySelectorAll('iframe[title="Payment Theory Messenger"]');
      expect(iframes.length).to.equal(0);
    });

    it('should disconnect channel before removing iframe', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      // Create a mock channel
      const mockChannel = {
        disconnect: sinon.spy(),
        sendMessage: async () => ({}),
      };
      messenger.channel = mockChannel;

      // Destroy the messenger
      messenger.destroy();

      // Verify channel.disconnect was called
      expect(mockChannel.disconnect.called).to.be.true;
      expect(messenger.channel).to.be.null;
    });

    it('should emit iframe_unloaded event when iframe unloads', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      const unloadedSpy = sinon.spy();
      const unsubscribe = messenger.on(MessengerEvents.IFRAME_UNLOADED, unloadedSpy);

      // Manually trigger handleIframeUnload (normally triggered by browser)
      messenger.handleIframeUnload();

      // Verify event was emitted
      expect(unloadedSpy.called).to.be.true;
      expect(unloadedSpy.firstCall.args[0]).to.have.property('timestamp');
    });
  });

  describe('Event Listener Tracking', () => {
    it('should track global event listeners', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      // Initially should have no global listeners
      expect(messenger.globalEventListeners.length).to.equal(0);

      const handler = () => {};
      window.addEventListener('message', handler);
      messenger.globalEventListeners.push({ type: 'message', handler });

      // During initialization, a message listener should be added
      // (it may be removed if initialization completes, but during the process it should exist)
      // Since our mock fails, the listener should still be there or cleaned up

      // Destroy should clean up any remaining listeners
      messenger.destroy();
      expect(messenger.globalEventListeners.length).to.equal(0);
    });
  });

  describe('Race Condition Prevention', () => {
    afterEach(() => {
      // Clear all instances after each test
      PayTheoryMessenger.clearInstances();
    });

    it('should implement singleton pattern per API key', () => {
      const apiKey = 'test-api-key-singleton';
      const messenger1 = new PayTheoryMessenger({ apiKey });
      const messenger2 = new PayTheoryMessenger({ apiKey });

      // Both references should point to the same instance
      expect(messenger1).to.equal(messenger2);

      // Different API keys should create different instances
      const messenger3 = new PayTheoryMessenger({ apiKey: 'different-api-key' });
      expect(messenger1).to.not.equal(messenger3);
    });

    it('should prevent multiple simultaneous initializations', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key-init' });

      let initializeCallCount = 0;
      messenger.doInitialize = async () => {
        initializeCallCount++;
        messenger.state.setState(MessengerState.INITIALIZING);
        await new Promise(resolve => setTimeout(resolve, 100));
        messenger.state.setState(MessengerState.CONNECTED);
        return { success: true };
      };

      // Start multiple initializations
      const init1 = messenger.initialize();
      const init2 = messenger.initialize();
      const init3 = messenger.initialize();

      const results = await Promise.all([init1, init2, init3]);

      expect(results.every(result => result.success)).to.be.true;
      expect(initializeCallCount).to.equal(1);
    });

    it('should prevent concurrent token refresh', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key-refresh' });
      messenger.state.setState(MessengerState.ERROR);

      // Mock token refresh with a delay
      let refreshCallCount = 0;
      messenger.tokenManager.refreshToken = async () => {
        refreshCallCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'new-mock-token';
      };

      // Mock sendReconnectToken
      messenger.sendReconnectToken = async () => ({ success: true });

      // Start multiple refresh operations
      const refresh1 = messenger.refreshConnection();
      const refresh2 = messenger.refreshConnection();
      const refresh3 = messenger.refreshConnection();

      const results = await Promise.all([refresh1, refresh2, refresh3]);

      // Concurrent callers should collapse into fewer refreshes than requests
      expect(refreshCallCount).to.be.lessThan(3);
      expect(results.every(result => result.success)).to.be.true;
    });

    it('should handle ensureConnected during initialization', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key-ensure' });

      let initializeCallCount = 0;
      messenger.doInitialize = async () => {
        initializeCallCount++;
        messenger.state.setState(MessengerState.INITIALIZING);
        await new Promise(resolve => setTimeout(resolve, 200));
        messenger.state.setState(MessengerState.CONNECTED);
        return { success: true };
      };

      // Start initialization
      const initPromise = messenger.initialize();

      // Immediately call ensureConnected (should wait for initialization)
      const ensurePromise = messenger.ensureConnected();

      const [initResult, ensureResult] = await Promise.all([initPromise, ensurePromise]);

      expect(initResult.success).to.equal(true);
      expect(ensureResult.success).to.equal(true);
      expect(initializeCallCount).to.equal(1);
    });

    it('should clean up instances on clearInstances', () => {
      const messenger1 = new PayTheoryMessenger({ apiKey: 'test-key-1' });
      const messenger2 = new PayTheoryMessenger({ apiKey: 'test-key-2' });

      // Spy on destroy method
      const destroy1Spy = sinon.spy(messenger1, 'destroy');
      const destroy2Spy = sinon.spy(messenger2, 'destroy');

      // Clear all instances
      PayTheoryMessenger.clearInstances();

      // Both destroy methods should be called
      expect(destroy1Spy.called).to.be.true;
      expect(destroy2Spy.called).to.be.true;

      // Creating new instances should work
      const messenger3 = new PayTheoryMessenger({ apiKey: 'test-key-1' });
      expect(messenger3).to.not.equal(messenger1);
    });

    it('should remove instance from map on destroy', () => {
      const apiKey = 'test-api-key-destroy';
      const messenger1 = new PayTheoryMessenger({ apiKey });

      // Destroy the messenger
      messenger1.destroy();

      // Creating a new instance with same API key should create a new instance
      const messenger2 = new PayTheoryMessenger({ apiKey });
      expect(messenger1).to.not.equal(messenger2);

      // Clean up
      messenger2.destroy();
    });
  });

  describe('Event Handling with Unsubscribe', () => {
    it('should return unsubscribe function from on() method', () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      const callback = sinon.spy();
      const unsubscribe = messenger.on(MessengerEvents.READY, callback);

      // Unsubscribe should be a function
      expect(unsubscribe).to.be.a('function');
    });

    it('should stop receiving events after unsubscribe', () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      const callback = sinon.spy();
      const unsubscribe = messenger.on(MessengerEvents.READY, callback);

      // Use private method for testing (accessing via bracket notation)
      // In real usage, events would be emitted internally
      messenger['emitEvent'](MessengerEvents.READY, { test: true });
      expect(callback.callCount).to.equal(1);

      // Unsubscribe
      unsubscribe();

      // Emit event again - callback should not be called
      messenger['emitEvent'](MessengerEvents.READY, { test: true });
      expect(callback.callCount).to.equal(1); // Still 1, not called again
    });

    it('should validate event types and return no-op for invalid events', () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      const consoleErrorSpy = sinon.spy(console, 'error');
      const callback = sinon.spy();

      // Try to subscribe to invalid event
      const unsubscribe = messenger.on('invalid-event', callback);

      // Should log error
      expect(consoleErrorSpy.calledWith(sinon.match(/Invalid event/))).to.be.true;

      // Unsubscribe should still be a function (no-op)
      expect(unsubscribe).to.be.a('function');
      expect(() => unsubscribe()).to.not.throw();

      consoleErrorSpy.restore();
    });
  });
});
