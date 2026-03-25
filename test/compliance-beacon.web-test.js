import { expect } from '@open-wc/testing';

import {
  buildComplianceBeaconPayload,
  findComplianceRelayTarget,
  startComplianceBeacon,
} from '../src/compliance/beacon';

const originalCrypto = globalThis.crypto;

const createDigest = values => {
  const bytes = new Uint8Array(32);
  values.forEach((value, index) => {
    bytes[index] = value;
  });
  return bytes.buffer;
};

describe('Compliance Beacon', () => {
  let activeController;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => '123e4567-e89b-42d3-a456-426614174000',
        subtle: {
          digest: async () => createDigest([1, 2, 3, 4]),
        },
      },
    });
  });

  afterEach(() => {
    if (activeController) {
      activeController.stop();
      activeController = null;
    }
  });

  after(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('builds a paired payload from correlation meta tags', async () => {
    const meta = document.createElement('meta');
    meta.name = 'pt-compliance-id';
    meta.content = '123e4567-e89b-42d3-a456-426614174001';
    meta.dataset.ptStatus = 'ok';
    meta.dataset.ptPageKey = 'route:/checkout';
    document.head.appendChild(meta);

    const script = document.createElement('script');
    script.src = '/assets/app.js#fragment';
    script.defer = true;
    document.body.appendChild(script);

    const payload = await buildComplianceBeaconPayload('client_initial', {
      documentRef: document,
      locationRef: new URL('https://merchant.example/checkout'),
    });

    expect(payload.compliance_id).to.equal('123e4567-e89b-42d3-a456-426614174001');
    expect(payload.page_key).to.equal('route:/checkout');
    expect(payload.sdk_status).to.equal('ok');
    expect(payload.origin).to.equal('https://merchant.example');
    expect(payload.scripts).to.deep.equal([
      {
        normalized_url: 'https://merchant.example/assets/app.js',
        raw_url: '/assets/app.js#fragment',
        integrity_hash: undefined,
        crossorigin: undefined,
        nonce: undefined,
        type: undefined,
        async: true,
        defer: true,
        is_inline: false,
        injection_timing: 'initial',
      },
    ]);
  });

  it('builds an unpaired payload when correlation meta is missing', async () => {
    const inlineScript = document.createElement('script');
    inlineScript.textContent = 'console.log("hello");';
    document.body.appendChild(inlineScript);

    const payload = await buildComplianceBeaconPayload('client_initial', {
      documentRef: document,
      locationRef: new URL('https://merchant.example/checkout'),
    });

    expect(payload.compliance_id).to.equal('client:123e4567-e89b-42d3-a456-426614174000');
    expect(payload.page_key).to.equal('origin:https://merchant.example');
    expect(payload).to.not.have.property('sdk_status');
    expect(payload.scripts[0]).to.include({
      normalized_url: 'inline:sha256-AQIDBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      inline_content_hash: 'sha256-AQIDBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      is_inline: true,
    });
  });

  it('marks late injected scripts in final payloads', async () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.example/late.js';
    document.body.appendChild(script);

    const lateScripts = new WeakSet([script]);
    const payload = await buildComplianceBeaconPayload('client_final', {
      documentRef: document,
      locationRef: new URL('https://merchant.example/checkout'),
      lateScripts,
    });

    expect(payload.scripts[0].injection_timing).to.equal('late');
  });

  it('finds the transacting iframe relay target', () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('name', 'card-number-iframe');
    Object.defineProperty(iframe, 'contentWindow', {
      configurable: true,
      value: {},
    });
    document.body.appendChild(iframe);

    expect(findComplianceRelayTarget(document)).to.equal(iframe);
  });

  it('posts an initial snapshot through the hosted-fields iframe when started', async () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('name', 'card-number-iframe');
    const postMessage = (...args) => {
      postMessage.calls.push(args);
    };
    postMessage.calls = [];
    Object.defineProperty(iframe, 'contentWindow', {
      configurable: true,
      value: { postMessage },
    });
    document.body.appendChild(iframe);

    activeController = startComplianceBeacon();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(postMessage.calls.length).to.equal(1);
    expect(postMessage.calls[0][0].type).to.equal('pt-static:compliance_beacon');
    expect(postMessage.calls[0][0].data.snapshot_type).to.equal('client_initial');
  });

  it('flushes a final snapshot when the document becomes hidden', async () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('name', 'card-number-iframe');
    const postMessage = (...args) => {
      postMessage.calls.push(args);
    };
    postMessage.calls = [];
    Object.defineProperty(iframe, 'contentWindow', {
      configurable: true,
      value: { postMessage },
    });
    document.body.appendChild(iframe);

    activeController = startComplianceBeacon();
    await new Promise(resolve => setTimeout(resolve, 0));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(postMessage.calls.length).to.equal(2);
    expect(postMessage.calls[1][0].data.snapshot_type).to.equal('client_final');
  });
});
