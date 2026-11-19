import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
  Headers as FallbackHeaders,
  Request as FallbackRequest,
  Response as FallbackResponse,
  fetch as fallbackFetch,
  DOMException as FallbackDOMException,
} from '../src/polyfill.js';

const rejection = async promise => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected rejection');
};

// Actual exported compatibility implementations, not the browser's native fetch.
// Only platform XHR/FileReader and realm capabilities are substituted.
describe('shipped fallback Headers/Request/Response/fetch behavior', () => {
  afterEach(() => sinon.restore());
  it('keeps native browser identities when their implementations exist', async () => {
    const before = {
      fetch: window.fetch,
      Headers: window.Headers,
      Request: window.Request,
      Response: window.Response,
      endsWith: String.prototype.endsWith,
    };
    await import('../src/polyfill.js');
    expect(window.fetch).to.equal(before.fetch);
    expect(window.Headers).to.equal(before.Headers);
    expect(window.Request).to.equal(before.Request);
    expect(window.Response).to.equal(before.Response);
    expect(String.prototype.endsWith).to.equal(before.endsWith);
    expect(fallbackFetch.polyfill).to.equal(true);
    expect(FallbackDOMException).to.equal(window.DOMException);
  });
  it('normalizes header names/values and combines repeated entries', () => {
    const headers = new FallbackHeaders([
      ['X-Test', 'first'],
      ['x-test', 2],
      [123, false],
    ]);
    expect(headers.get('X-TEST')).to.equal('first, 2');
    expect(headers.get(123)).to.equal('false');
    expect(headers.get('missing')).to.equal(null);
    expect(headers.has('missing')).to.equal(false);
    headers.set('X-Test', 0);
    expect(headers.get('x-test')).to.equal('0');
    headers.delete('X-Test');
    expect(headers.has('x-test')).to.equal(false);
  });
  for (const name of ['', 'bad name', 'bad:header', '\n'])
    it(`rejects invalid header name ${JSON.stringify(name)}`, () =>
      expect(() => new FallbackHeaders({ [name]: 'value' })).to.throw(
        TypeError,
        'Invalid character in header field name',
      ));
  it('copies headers without sharing mutations and supports all iterators', () => {
    const original = new FallbackHeaders({ a: '1', b: '2' });
    const copy = new FallbackHeaders(original);
    copy.set('a', 'changed');
    expect(original.get('a')).to.equal('1');
    expect([...original.keys()]).to.deep.equal(['a', 'b']);
    expect([...original.values()]).to.deep.equal(['1', '2']);
    expect([...original.entries()]).to.deep.equal([
      ['a', '1'],
      ['b', '2'],
    ]);
    expect([...original]).to.deep.equal([
      ['a', '1'],
      ['b', '2'],
    ]);
    const iterator = original.keys();
    expect(iterator.next()).to.deep.equal({ value: 'a', done: false });
    iterator.next();
    expect(iterator.next()).to.deep.equal({ value: undefined, done: true });
    const context = [];
    original.forEach(function (value, name, source) {
      this.push([name, value, source === original]);
    }, context);
    expect(context).to.deep.equal([
      ['a', '1', true],
      ['b', '2', true],
    ]);
  });
  it('response defaults and explicit metadata preserve exact public fields', async () => {
    const empty = new FallbackResponse();
    expect(empty).to.include({
      status: 200,
      ok: true,
      statusText: '',
      url: '',
      type: 'default',
      bodyUsed: false,
    });
    expect(await empty.text()).to.equal('');
    expect(empty.bodyUsed).to.equal(true);
    const response = new FallbackResponse('body', {
      status: 404,
      statusText: 42,
      url: '/resource',
      headers: { custom: 'yes' },
    });
    expect(response).to.include({ status: 404, ok: false, statusText: '42', url: '/resource' });
    expect(response.headers.get('custom')).to.equal('yes');
    expect(response.headers.get('content-type')).to.equal('text/plain;charset=UTF-8');
    const clone = response.clone();
    expect(await clone.text()).to.equal('body');
    expect(response.bodyUsed).to.equal(false);
    clone.headers.set('custom', 'changed');
    expect(response.headers.get('custom')).to.equal('yes');
    expect(await response.text()).to.equal('body');
    expect((await rejection(response.text())).message).to.equal('Already read');
  });
  it('checks success bounds and constructor invocation', () => {
    expect(() => FallbackResponse('body')).to.throw(TypeError, 'new');
    expect(() => FallbackRequest('/')).to.throw(TypeError, 'new');
    for (const [status, ok] of [
      [199, false],
      [200, true],
      [299, true],
      [300, false],
      [500, false],
    ])
      expect(new FallbackResponse(null, { status }).ok).to.equal(ok);
    const failed = FallbackResponse.error();
    expect(failed).to.include({ status: 0, type: 'error', ok: false });
  });
  for (const status of [301, 302, 303, 307, 308])
    it(`redirect preserves supported status ${status}`, () => {
      const response = FallbackResponse.redirect('/next', status);
      expect(response.status).to.equal(status);
      expect(response.headers.get('location')).to.equal('/next');
    });
  for (const status of [200, 304, undefined])
    it(`redirect rejects unsupported status ${String(status)}`, () =>
      expect(() => FallbackResponse.redirect('/next', status)).to.throw(
        RangeError,
        'Invalid status code',
      ));
  it('text/JSON/plain-object/search-params bodies and preexisting content type', async () => {
    expect(await new FallbackResponse('{"ok":true,"count":0}').json()).to.deep.equal({
      ok: true,
      count: 0,
    });
    expect(await new FallbackResponse({ arbitrary: true }).text()).to.equal('[object Object]');
    expect(await new FallbackResponse(0).text()).to.equal('');
    const params = new FallbackResponse(new URLSearchParams({ a: 'space value', b: '0' }));
    expect(params.headers.get('content-type')).to.equal(
      'application/x-www-form-urlencoded;charset=UTF-8',
    );
    expect(await params.text()).to.equal('a=space+value&b=0');
    const explicit = new FallbackResponse('text', { headers: { 'content-type': 'custom/type' } });
    expect(explicit.headers.get('content-type')).to.equal('custom/type');
    expect(await rejection(new FallbackResponse('not json').json())).to.be.instanceOf(SyntaxError);
  });
  it('Blob body reads through real FileReader with type preserved', async () => {
    const blob = new Blob(['hello'], { type: 'text/custom' });
    const response = new FallbackResponse(blob);
    expect(response.headers.get('content-type')).to.equal('text/custom');
    expect(await response.blob()).to.equal(blob);
    expect((await rejection(response.blob())).message).to.equal('Already read');
    expect(await new FallbackResponse(blob).text()).to.equal('hello');
    const data = await new FallbackResponse('AB').arrayBuffer();
    expect([...new Uint8Array(data)]).to.deep.equal([65, 66]);
    const plain = new FallbackResponse('text');
    expect(await (await plain.blob()).text()).to.equal('text');
  });
  it('reports FileReader failures through the actual body reader promise', async () => {
    const marker = new Error('synthetic reader failure');
    sinon.stub(window, 'FileReader').value(
      class {
        readAsText() {
          this.error = marker;
          queueMicrotask(() => this.onerror());
        }
        readAsArrayBuffer() {
          this.error = marker;
          queueMicrotask(() => this.onerror());
        }
      },
    );
    expect(await rejection(new FallbackResponse(new Blob(['x'])).text())).to.equal(marker);
    expect(await rejection(new FallbackResponse('x').arrayBuffer())).to.equal(marker);
  });
  it('FormData bodies explicitly reject unsupported text/blob reads', () => {
    const form = new FormData();
    form.append('a', 'b');
    expect(() => new FallbackResponse(form).text()).to.throw(
      'could not read FormData body as text',
    );
    expect(() => new FallbackResponse(form).blob()).to.throw(
      'could not read FormData body as blob',
    );
  });
  it('decodes URL-encoded form bodies, repeats and plus/unicode syntax', async () => {
    const result = await new FallbackResponse(
      ' first+name=Ada+Lovelace&x=1&x=2&&encoded=%E2%9C%93&a=b=c ',
    ).formData();
    expect([...result.entries()]).to.deep.equal([
      ['first name', 'Ada Lovelace'],
      ['x', '1'],
      ['x', '2'],
      ['encoded', '✓'],
      ['a', 'b=c'],
    ]);
    expect(await rejection(new FallbackResponse('a=%E0%A4%A').formData())).to.be.instanceOf(
      URIError,
    );
  });
  it('characterizes existing typed-buffer construction defect rather than changing it', () => {
    for (const body of [new ArrayBuffer(2), new Uint8Array([65]), new DataView(new ArrayBuffer(2))])
      expect(() => new FallbackResponse(body)).to.throw(TypeError);
  });
  it('creates POST/custom-method requests and characterizes explicit headers defect', async () => {
    const request = new FallbackRequest('/resource', {
      method: 'post',
      body: 'text',
      credentials: 'include',
      mode: 'cors',
    });
    expect(request).to.include({
      url: '/resource',
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      referrer: null,
    });
    expect(request.headers.get('content-type')).to.equal('text/plain;charset=UTF-8');
    expect(await request.text()).to.equal('text');
    expect(
      () => new FallbackRequest('/resource', { method: 'POST', headers: { test: 'yes' } }),
    ).to.throw(TypeError);
    const custom = new FallbackRequest('/resource', { method: 'custom', body: false });
    expect(custom.method).to.equal('custom');
    expect(await custom.text()).to.equal('');
    expect(
      new FallbackRequest('/resource', { method: 'OPTIONS', credentials: 'omit' }).credentials,
    ).to.equal('omit');
  });
  it('characterizes GET/HEAD cache and clone defects with exact exception classes', () => {
    for (const method of ['GET', 'HEAD']) {
      expect(() => new FallbackRequest('/resource', { method })).to.throw(
        ReferenceError,
        'options',
      );
      expect(() => new FallbackRequest('/resource', { method, body: 'forbidden' })).to.throw(
        TypeError,
        'Body not allowed for GET or HEAD requests',
      );
    }
    const request = new FallbackRequest('/resource', { method: 'POST', body: 'text' });
    expect(() => request.clone()).to.throw(ReferenceError, 'body');
    request.bodyUsed = true;
    expect(() => request.clone()).to.throw(TypeError, 'Already read');
  });
  it('already-aborted input rejects with AbortError even though setup currently continues', async () => {
    const controller = new AbortController();
    controller.abort();
    const requests = [];
    sinon.stub(window, 'XMLHttpRequest').value(
      class {
        constructor() {
          requests.push(this);
          this.send = sinon.spy();
        }
        open() {}
      },
    );
    const failure = await rejection(
      fallbackFetch('/resource', { method: 'POST', signal: controller.signal }),
    );
    expect(failure.name).to.equal('AbortError');
    expect(failure.message).to.equal('Aborted');
    expect(requests).to.have.length(1);
    expect(requests[0].send.called).to.equal(false);
  });
  it('characterizes fetch failing before transport send without replacing its implementation', async () => {
    const requests = [];
    sinon.stub(window, 'XMLHttpRequest').value(
      class {
        constructor() {
          requests.push(this);
          this.send = sinon.spy();
        }
        open(...args) {
          this.opened = args;
        }
      },
    );
    const failure = await rejection(fallbackFetch('/resource', { method: 'POST' }));
    expect(failure).to.be.instanceOf(TypeError);
    expect(requests).to.have.length(1);
    expect(requests[0].opened).to.deep.equal(['POST', '/resource', true]);
    expect(requests[0].send.called).to.equal(false);
    expect(await rejection(fallbackFetch('/resource'))).to.be.instanceOf(ReferenceError);
  });
});

describe('conditional fallback installation in isolated browser realms', () => {
  let frame;
  afterEach(() => {
    frame?.remove();
    frame = undefined;
  });
  const realm = async setup => {
    frame = document.createElement('iframe');
    document.body.append(frame);
    await new Promise(resolve => {
      if (frame.contentDocument.readyState === 'complete') resolve();
      else frame.addEventListener('load', resolve, { once: true });
    });
    const child = frame.contentWindow;
    // The standard source instrumenter writes to this same-origin collector map.
    // No counters/maps are synthesized, remapped or incremented by the fixture.
    child.__coverage__ = window.__coverage__;
    setup(child);
    const module = await child.eval(
      `import(${JSON.stringify(new URL('../src/polyfill.js', import.meta.url).href)})`,
    );
    return { child, module };
  };
  it('installs missing fetch classes and exercises actual endsWith fallback boundaries', async () => {
    const nativeFetch = window.fetch,
      nativeEndsWith = String.prototype.endsWith;
    const { child, module } = await realm(child => {
      delete child.fetch;
      delete child.String.prototype.endsWith;
    });
    expect(child.fetch).to.equal(module.fetch);
    expect(child.Headers).to.equal(module.Headers);
    expect(child.Request).to.equal(module.Request);
    expect(child.Response).to.equal(module.Response);
    const invoke = (text, term, position) =>
      child.String.prototype.endsWith.call(text, term, position);
    for (const position of [undefined, Infinity, NaN, 3.5, 100])
      expect(invoke('example', 'ple', position)).to.equal(true);
    expect(invoke('example', 'amp', 5)).to.equal(true);
    expect(invoke('example', 'ex', 2)).to.equal(true);
    expect(invoke('example', 'bad', 3)).to.equal(false);
    expect(invoke('example', 'le', 4)).to.equal(false);
    expect(window.fetch).to.equal(nativeFetch);
    expect(String.prototype.endsWith).to.equal(nativeEndsWith);
  });
  it('installs DOMException fallback only in an unsupported realm and preserves its error metadata', async () => {
    const native = window.DOMException;
    const { module } = await realm(child => {
      child.DOMException = undefined;
    });
    const exception = new module.DOMException('message', 'AbortError');
    expect(exception).to.include({ message: 'message', name: 'AbortError' });
    expect(exception.stack).to.be.a('string');
    expect(window.DOMException).to.equal(native);
  });
  it('uses the window fallback and noniterable header iterator on older capability profiles', async () => {
    const { module } = await realm(child => {
      child.globalThis = undefined;
      delete child.Symbol;
      delete child.ArrayBuffer;
      delete child.FileReader;
      delete child.FormData;
      delete child.URLSearchParams;
    });
    const headers = new module.Headers({ test: 'value' });
    const iterator = headers.keys();
    expect(iterator.next()).to.deep.equal({ value: 'test', done: false });
    expect(iterator.next().done).to.equal(true);
    const response = new module.Response('legacy');
    expect(await response.text()).to.equal('legacy');
    expect(response.blob).to.equal(undefined);
    expect(response.formData).to.equal(undefined);
  });
  it('executes old ArrayBuffer helper fallbacks while characterizing the remaining construction defect', async () => {
    const { child, module } = await realm(child => {
      child.ArrayBuffer.isView = undefined;
      child.ArrayBuffer.prototype.slice = undefined;
    });
    expect(() => new module.Response(new child.ArrayBuffer(2))).to.throw();
    expect(() => new module.Response(new child.Uint8Array([65, 66]))).to.throw();
    expect(await new module.Response({ ordinary: true }).text()).to.equal('[object Object]');
  });
  it('handles a realm where Blob construction fails without changing the parent platform', async () => {
    const { module } = await realm(child => {
      child.Blob = class {
        constructor() {
          throw new Error('unsupported Blob');
        }
      };
    });
    const response = new module.Response('text');
    expect(await response.text()).to.equal('text');
    expect(response.blob).to.equal(undefined);
    expect(new Blob(['parent']).size).to.equal(6);
  });
});
