import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import PayTheoryMessenger from '../src/messenger/pay-theory-messenger.ts';

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

      // Mock the token fetch to avoid actual API calls
      messenger.tokenManager.getToken = async () => 'mock-token';

      // Initialize the messenger (this will fail due to no server, but iframe should be created)
      try {
        await messenger.initialize();
      } catch (e) {
        // Expected to fail
      }

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

      // Mock the token fetch
      messenger.tokenManager.getToken = async () => 'mock-token';

      // Initialize (will fail but should add listeners)
      try {
        await messenger.initialize();
      } catch (e) {
        // Expected to fail
      }

      // Destroy the messenger
      messenger.destroy();

      // Check that removeEventListener was called for message events
      expect(removeEventListenerSpy.calledWith('message')).to.be.true;

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

      // Mock the token fetch
      messenger.tokenManager.getToken = async () => 'mock-token';

      // Try to initialize (will fail but state should change)
      try {
        await messenger.initialize();
      } catch (e) {
        // Expected to fail
      }

      // Destroy the messenger
      messenger.destroy();

      // Check that state is reset to IDLE
      expect(messenger.getState()).to.equal('IDLE');
    });

    it('should clear event listeners map on destroy', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      // Add some event listeners
      const callback1 = () => {};
      const callback2 = () => {};
      messenger.on('test-event', callback1);
      messenger.on('another-event', callback2);

      // Verify listeners are added
      expect(messenger.eventListeners.size).to.equal(2);

      // Destroy the messenger
      messenger.destroy();

      // Check that event listeners map is cleared
      expect(messenger.eventListeners.size).to.equal(0);
    });

    it('should handle multiple destroy calls gracefully', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key' });

      // Mock the token fetch
      messenger.tokenManager.getToken = async () => 'mock-token';

      // Initialize
      try {
        await messenger.initialize();
      } catch (e) {
        // Expected to fail
      }

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
      messenger.on('iframe_unloaded', unloadedSpy);

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

      // Mock token fetch
      messenger.tokenManager.getToken = async () => 'mock-token';

      // Try to initialize - this should add message listener
      try {
        await messenger.initialize();
      } catch (e) {
        // Expected to fail, but listener should be added
      }

      // During initialization, a message listener should be added
      // (it may be removed if initialization completes, but during the process it should exist)
      // Since our mock fails, the listener should still be there or cleaned up

      // Destroy should clean up any remaining listeners
      const initialListenerCount = messenger.globalEventListeners.length;
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

      // Mock token fetch with a delay
      let tokenCallCount = 0;
      messenger.tokenManager.getToken = async () => {
        tokenCallCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'mock-token';
      };

      // Start multiple initializations
      const init1 = messenger.initialize();
      const init2 = messenger.initialize();
      const init3 = messenger.initialize();

      // All should return the same promise
      expect(init1).to.equal(init2);
      expect(init2).to.equal(init3);

      // Wait for all to complete
      try {
        await Promise.all([init1, init2, init3]);
      } catch (e) {
        // Expected to fail
      }

      // Token should only be fetched once
      expect(tokenCallCount).to.equal(1);
    });

    it('should prevent concurrent token refresh', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key-refresh' });

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

      // All should return the same promise
      expect(refresh1).to.equal(refresh2);
      expect(refresh2).to.equal(refresh3);

      // Wait for all to complete
      await Promise.all([refresh1, refresh2, refresh3]);

      // Token refresh should only be called once
      expect(refreshCallCount).to.equal(1);
    });

    it('should handle ensureConnected during initialization', async () => {
      messenger = new PayTheoryMessenger({ apiKey: 'test-api-key-ensure' });

      // Mock token fetch with a delay
      messenger.tokenManager.getToken = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'mock-token';
      };

      // Start initialization
      const initPromise = messenger.initialize();

      // Immediately call ensureConnected (should wait for initialization)
      const ensurePromise = messenger.ensureConnected();

      // They should return the same promise
      expect(initPromise).to.equal(ensurePromise);

      try {
        await Promise.all([initPromise, ensurePromise]);
      } catch (e) {
        // Expected to fail
      }
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
});
