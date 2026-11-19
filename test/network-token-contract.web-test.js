import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import TokenManager from '../src/messenger/token-manager.ts';
import {
  fetchCheckoutPtToken,
  fetchPtToken,
  getData,
  transactionEndpoint,
} from '../src/common/network.ts';
import { withExponentialBackoff, delay } from '../src/common/retry-utils.ts';

describe('token service HTTP and cache contracts', () => {
  let fetchStub;
  afterEach(() => sinon.restore());
  beforeEach(() => {
    fetchStub = sinon
      .stub(window, 'fetch')
      .resolves({
        json: async () => ({ 'pt-token': 'opaque-token', origin: 'https://merchant.example' }),
      });
  });
  it('keeps API/session headers and the token response intact', async () => {
    expect(await getData('https://synthetic.invalid/token', 'key', 'session')).to.deep.equal({
      'pt-token': 'opaque-token',
      origin: 'https://merchant.example',
    });
    expect(fetchStub.firstCall.args).to.deep.equal([
      'https://synthetic.invalid/token',
      {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: { 'x-api-key': 'key', 'x-session-key': 'session' },
      },
    ]);
    expect(await fetchPtToken('key', 'session')).to.have.property('pt-token', 'opaque-token');
  });
  for (const [input, query] of [
    ['invoiceId', 'invoice_id'],
    ['linkId', 'link_id'],
    ['recurringHash', 'recurring_hash'],
    ['sessionId', 'session_id'],
  ]) {
    it(`encodes ${input} and limits session header disclosure`, async () => {
      await fetchCheckoutPtToken({ [input]: 'synthetic &/=?' }, 'session');
      const [url, options] = fetchStub.firstCall.args;
      expect(url).to.equal(
        `${transactionEndpoint}checkout-token?${query}=synthetic%20%26%2F%3D%3F`,
      );
      expect(options.headers).to.deep.equal(
        input === 'sessionId' ? {} : { 'x-session-key': 'session' },
      );
    });
  }
  for (const context of [{}, { invoiceId: 'one', linkId: 'two' }, { sessionId: '' }]) {
    it(`rejects ambiguous/empty checkout selectors ${JSON.stringify(context)} before fetch`, async () => {
      const result = await fetchCheckoutPtToken(context, 'session').catch(error => error);
      expect(result.message).to.equal(
        'Must provide exactly one of invoiceId, linkId, recurringHash, or sessionId',
      );
      expect(fetchStub.called).to.equal(false);
    });
  }
  it('shares in-flight fetches, caches valid JWTs, refreshes early, and cleans up', async () => {
    const clock = sinon.useFakeTimers({ now: 1000000 });
    const jwt = `header.${btoa(JSON.stringify({ exp: 1100 }))}.signature`;
    let resolve;
    fetchStub.returns(
      new Promise(done => {
        resolve = done;
      }),
    );
    const manager = new TokenManager({ apiKey: 'key' }, 'session');
    expect(manager.isTokenExpired()).to.equal(true);
    const first = manager.getToken();
    const second = manager.getToken();
    expect(fetchStub.callCount).to.equal(1);
    resolve({ json: async () => ({ 'pt-token': jwt }) });
    expect(await Promise.all([first, second])).to.deep.equal([jwt, jwt]);
    expect(await manager.getToken()).to.equal(jwt);
    expect(fetchStub.callCount).to.equal(1);
    await clock.tickAsync(90001);
    expect(manager.isTokenExpired()).to.equal(true);
    expect(await manager.getToken()).to.equal(jwt);
    expect(fetchStub.callCount).to.equal(2);
    manager.cleanup();
    expect(manager.isTokenExpired()).to.equal(true);
  });
  for (const token of [
    'opaque',
    'header.invalid.signature',
    `header.${btoa('{}')}.signature`,
    `header.${btoa('{"exp":"later"}')}.signature`,
  ]) {
    it(`uses a bounded fallback for malformed or legacy token ${token}`, async () => {
      const clock = sinon.useFakeTimers({ now: 1000000 });
      fetchStub.resolves({ json: async () => ({ 'pt-token': token }) });
      const manager = new TokenManager({ checkoutContext: { invoiceId: 'invoice' } }, 'session');
      expect(await manager.getToken()).to.equal(token);
      await clock.tickAsync(240001);
      expect(manager.isTokenExpired()).to.equal(true);
    });
  }
  it('retries missing tokens five times, reports failure, then permits recovery', async () => {
    const clock = sinon.useFakeTimers();
    fetchStub.resolves({ json: async () => ({ error: 'synthetic' }) });
    const manager = new TokenManager({ apiKey: 'key' }, 'session');
    const failure = manager.getToken().catch(error => error);
    await clock.runAllAsync();
    expect((await failure).message).to.equal('Token fetch failed: Token not found in response');
    expect(fetchStub.callCount).to.equal(5);
    fetchStub.resolves({ json: async () => ({ 'pt-token': 'recovered' }) });
    expect(await manager.getToken()).to.equal('recovered');
  });
});

describe('retry backoff behavior', () => {
  afterEach(() => sinon.restore());
  it('caps deterministic delays and returns the eventual successful result', async () => {
    const clock = sinon.useFakeTimers();
    const operation = sinon
      .stub()
      .onCall(0)
      .resolves(null)
      .onCall(1)
      .resolves(null)
      .onCall(2)
      .resolves('ready');
    const result = withExponentialBackoff(operation, value => value === null, {
      initialDelay: 10,
      maxDelay: 15,
      jitter: false,
    });
    await clock.tickAsync(9);
    expect(operation.callCount).to.equal(1);
    await clock.tickAsync(1);
    expect(operation.callCount).to.equal(2);
    await clock.tickAsync(15);
    expect(await result).to.equal('ready');
  });
  it('retries thrown errors with jitter and rethrows the final original failure', async () => {
    const clock = sinon.useFakeTimers();
    sinon.stub(Math, 'random').returns(0);
    const failure = new Error('offline');
    const operation = sinon.stub().rejects(failure);
    const result = withExponentialBackoff(operation, () => false, {
      maxAttempts: 2,
      initialDelay: 10,
    }).catch(error => error);
    await clock.tickAsync(4);
    expect(operation.callCount).to.equal(1);
    await clock.tickAsync(1);
    expect(await result).to.equal(failure);
    expect(operation.callCount).to.equal(2);
  });
  it('returns null on exhausted retryable results and performs no work at zero attempts', async () => {
    const operation = sinon.stub().resolves(false);
    expect(await withExponentialBackoff(operation, () => true, { maxAttempts: 1 })).to.equal(null);
    expect(await withExponentialBackoff(operation, () => true, { maxAttempts: 0 })).to.equal(null);
    expect(operation.callCount).to.equal(1);
  });
  it('delay waits until its requested deadline', async () => {
    const clock = sinon.useFakeTimers();
    let done = false;
    const result = delay(20).then(() => {
      done = true;
    });
    await clock.tickAsync(19);
    expect(done).to.equal(false);
    await clock.tickAsync(1);
    await result;
    expect(done).to.equal(true);
  });
});
