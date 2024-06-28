// eslint-disable-next-line @typescript-eslint/no-unused-vars
/* global Blob globalThis global */
/*eslint no-extend-native: ["error", { "exceptions": ["String", "Array"] }]*/
//https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
const endsIWithIsValid = (subjectString, position) =>
  typeof position !== 'number' ||
  !isFinite(position) ||
  Math.floor(position) !== position ||
  position > subjectString.length;
const endsWithResult = (lastIndex, position) => lastIndex !== -1 && lastIndex === position;
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (searchString, position) {
    var subjectString = this.toString();
    if (endsIWithIsValid(subjectString, position)) {
      position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.indexOf(searchString, position);
    return endsWithResult(lastIndex, position);
  };
}

var global =
  (typeof globalThis !== 'undefined' && globalThis) ||
  (typeof window.self !== 'undefined' && window.self) ||
  (typeof global !== 'undefined' && global);

const canBlob = () => {
  try {
    return new Blob();
  } catch (e) {
    return false;
  }
};

var support = {
  searchParams: 'URLSearchParams' in global,
  iterable: 'Symbol' in global && 'iterator' in Symbol,
  blob: 'FileReader' in global && 'Blob' in global && canBlob(),
  formData: 'FormData' in global,
  arrayBuffer: 'ArrayBuffer' in global,
};

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj);
}

if (support.arrayBuffer) {
  var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]',
  ];

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function (obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
    };
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name);
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === '') {
    throw new TypeError('Invalid character in header field name: "' + name + '"');
  }
  return name.toLowerCase();
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value;
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  var iterator = {
    next: function () {
      var value = items.shift();

      return { done: typeof value === 'undefined', value };
    },
  };

  if (support.iterable) {
    iterator[Symbol.iterator] = function () {
      return iterator;
    };
  }

  return iterator;
}

export function Headers(headers) {
  this.map = {};

  if (headers instanceof Headers) {
    headers.forEach(function (value, name) {
      this.append(name, value);
    }, this);
  } else if (Array.isArray(headers)) {
    headers.forEach(function (header) {
      this.append(header[0], header[1]);
    }, this);
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function (name) {
      this.append(name, headers[name]);
    }, this);
  }
}

Headers.prototype.append = function (name, value) {
  name = normalizeName(name);
  value = normalizeValue(value);
  var oldValue = this.map[name];
  this.map[name] = oldValue ? oldValue + ', ' + value : value;
};

Headers.prototype['delete'] = function (name) {
  delete this.map[normalizeName(name)];
};

Headers.prototype.get = function (name) {
  name = normalizeName(name);
  return this.has(name) ? this.map[name] : null;
};

Headers.prototype.has = function (name) {
  return this.map.hasOwnProperty(normalizeName(name));
};

Headers.prototype.set = function (name, value) {
  this.map[normalizeName(name)] = normalizeValue(value);
};

Headers.prototype.forEach = function (callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this);
    }
  }
};

Headers.prototype.keys = function () {
  var items = [];
  this.forEach(function (value, name) {
    items.push(name);
  });
  return iteratorFor(items);
};

Headers.prototype.values = function () {
  var items = [];
  this.forEach(function (value) {
    items.push(value);
  });
  return iteratorFor(items);
};

Headers.prototype.entries = function () {
  var items = [];
  this.forEach(function (value, name) {
    items.push([name, value]);
  });
  return iteratorFor(items);
};

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
}

function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'));
  }
  body.bodyUsed = true;
}

function fileReaderReady(reader) {
  return new Promise(function (resolve, reject) {
    reader.onload = function () {
      resolve(reader.result);
    };
    reader.onerror = function () {
      reject(reader.error);
    };
  });
}

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsArrayBuffer(blob);
  return promise;
}

function readBlobAsText(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsText(blob);
  return promise;
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf);
  var chars = new Array(view.length);

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i]);
  }
  return chars.join('');
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0);
  } else {
    var view = new Uint8Array(buf.byteLength);
    view.set(new Uint8Array(buf));
    return view.buffer;
  }
}

const buildBodyBlob = (base, body) => {
  if (support.blob && Blob.prototype.isPrototypeOf(body)) {
    base._bodyBlob = body;
  }
};

const buildBodyFormData = (base, body) => {
  if (support.formData && FormData.prototype.isPrototypeOf(body)) {
    base._bodyFormData = body;
  }
};

const buildBodyArrayBuffer = (base, body) => {
  if (support.arrayBuffer && support.blob && isDataView(body)) {
    this._bodyArrayBuffer = bufferClone(body.buffer);
    // IE 10-11 can't handle a DataView body.
    this._bodyInit = new Blob([this._bodyArrayBuffer]);
  } else if (
    support.arrayBuffer &&
    (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))
  ) {
    this._bodyArrayBuffer = bufferClone(body);
  }
};

const buildBody = (base, body) => {
  buildBodyBlob(base, body);
  buildBodyFormData(base, body);
  buildBodyArrayBuffer(base, body);

  if (!body) {
    base._bodyText = '';
  } else if (typeof body === 'string') {
    base._bodyText = body;
  } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
    base._bodyText = body.toString();
  } else {
    base._bodyText = body = Object.prototype.toString.call(body);
  }
};

const buildHeaders = (base, body) => {
  if (typeof body === 'string') {
    base.headers.set('content-type', 'text/plain;charset=UTF-8');
  } else if (base._bodyBlob && base._bodyBlob.type) {
    base.headers.set('content-type', base._bodyBlob.type);
  } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
    base.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
  }
};

function Body() {
  this.bodyUsed = false;

  this._initBody = function (body) {
    /*
          fetch-mock wraps the Response object in an ES6 Proxy to
          provide useful test harness features such as flush. However, on
          ES5 browsers without fetch or Proxy support pollyfills must be used;
          the proxy-pollyfill is unable to proxy an attribute unless it exists
          on the object before the Proxy is created. This change ensures
          Response.bodyUsed exists on the instance, while maintaining the
          semantic of setting Request.bodyUsed in the constructor before
          _initBody is called.
        */
    this.bodyUsed = this.bodyUsed;
    this._bodyInit = body;
    buildBody(this, body);

    if (!this.headers.get('content-type')) {
      buildHeaders(this, body);
    }
  };

  if (support.blob) {
    this.blob = function () {
      var rejected = consumed(this);
      if (rejected) {
        return rejected;
      }

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob);
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]));
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob');
      } else {
        return Promise.resolve(new Blob([this._bodyText]));
      }
    };

    this.arrayBuffer = function () {
      if (this._bodyArrayBuffer) {
        var isConsumed = consumed(this);
        if (isConsumed) {
          return isConsumed;
        }
        if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
          return Promise.resolve(
            this._bodyArrayBuffer.buffer.slice(
              this._bodyArrayBuffer.byteOffset,
              this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength,
            ),
          );
        } else {
          return Promise.resolve(this._bodyArrayBuffer);
        }
      } else {
        return this.blob().then(readBlobAsArrayBuffer);
      }
    };
  }

  this.text = function () {
    var rejected = consumed(this);
    if (rejected) {
      return rejected;
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob);
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text');
    } else {
      return Promise.resolve(this._bodyText);
    }
  };

  if (support.formData) {
    this.formData = function () {
      return this.text().then(decode);
    };
  }

  this.json = function () {
    return this.text().then(JSON.parse);
  };

  return this;
}

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

function normalizeMethod(method) {
  var upcased = method.toUpperCase();
  return methods.indexOf(upcased) > -1 ? upcased : method;
}

const buildRequestHeaders = (options, input) => {
  if (!options.headers) {
    return new Headers(input.headers);
  }
  return;
};

const handleInputRequest = (base, options, input) => {
  if (input.bodyUsed) {
    throw new TypeError('Already read');
  }
  base.url = input.url;
  base.credentials = input.credentials;
  base.headers = buildRequestHeaders(base, options, input);
  base.method = input.method;
  base.mode = input.mode;
  base.signal = input.signal;
  if (!body && input._bodyInit != null) {
    body = input._bodyInit;
    input.bodyUsed = true;
  }
};

const isInputRequest = (base, options, input) => {
  if (input instanceof Request) {
    handleInputRequest(base, options, input);
  } else {
    base.url = String(input);
  }
};

const buildRequestCredentials = (base, options) =>
  options.credentials || base.credentials || 'same-origin';

const buildRequestMethod = (base, options) =>
  normalizeMethod(options.method || base.method || 'GET');

const buildRequestMode = (base, options) => options.mode || base.mode || null;

const buildRequestSignal = (base, options) => options.signal || base.signal;

const checkForIllegalBody = (base, body) => {
  if ((base.method === 'GET' || base.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests');
  }
};

const buildBodylessOptionsUrl = base => {
  let reParamSearch = /([?&])_=[^&]*/;
  let reQueryString = /\?/;
  return reParamSearch.test(base.url)
    ? base.url.replace(reParamSearch, '$1_=' + new Date().getTime())
    : `${base.url}${(reQueryString.test(base.url) ? '&' : '?') + '_=' + new Date().getTime()}`;
};

const processBodylessOptions = (base, options) => {
  if (options.cache === 'no-store' || options.cache === 'no-cache') {
    base.url = buildBodylessOptionsUrl(base);
  }
};

const handleBodyless = base => {
  if (base.method === 'GET' || base.method === 'HEAD') {
    processBodylessOptions(base, options);
  }
};

export function Request(input, options) {
  if (!(this instanceof Request)) {
    throw new TypeError(
      'Please use the "new" operator, this DOM object constructor cannot be called as a function.',
    );
  }

  options = options || {};
  var body = options.body;

  isInputRequest(this, options, input);

  this.credentials = buildRequestCredentials(this, options);
  this.headers = buildRequestHeaders(options, input);
  this.method = buildRequestMethod(this, options);
  this.mode = buildRequestMode(this, options);
  this.signal = buildRequestSignal(this, options);
  this.referrer = null;

  checkForIllegalBody(this, body);

  this._initBody(body);

  handleBodyless(this);
}

Request.prototype.clone = function () {
  return new Request(this, { body: this._bodyInit });
};

function decode(body) {
  var form = new FormData();
  body
    .trim()
    .split('&')
    .forEach(function (bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
  return form;
}

function parseHeaders(rawHeaders) {
  var headers = new Headers();
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
  // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
  // https://github.com/github/fetch/issues/748
  // https://github.com/zloirock/core-js/issues/751
  preProcessedHeaders
    .split('\r')
    .map(function (header) {
      return header.indexOf('\n') === 0 ? header.substr(1, header.length) : header;
    })
    .forEach(function (line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
  return headers;
}

Body.call(Request.prototype);

const findOptionStatus = options => (typeof options.status === 'undefined' ? 200 : options.status);
const findOptionStatusText = options =>
  typeof options.statusText === 'undefined' ? '' : '' + options.statusText;
const findOptionOk = base => base.status >= 200 && base.status < 300;
const findOptionUrl = options => options.url || '';
export function Response(bodyInit, options = {}) {
  if (this instanceof Response) {
    this.type = 'default';
    this.status = findOptionStatus(options);
    this.ok = findOptionOk(this);
    this.statusText = findOptionStatusText(options);
    this.headers = new Headers(options.headers);
    this.url = findOptionUrl(options);
    this._initBody(bodyInit);
    return;
  }
  throw new TypeError(
    'Please use the "new" operator, this DOM object constructor cannot be called as a function.',
  );
}

Body.call(Response.prototype);

Response.prototype.clone = function () {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url,
  });
};

Response.error = function () {
  var response = new Response(null, { status: 0, statusText: '' });
  response.type = 'error';
  return response;
};

var redirectStatuses = [301, 302, 303, 307, 308];

Response.redirect = function (url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code');
  }
  const headers = { location: url };
  return new Response(null, { status, headers });
};

export var DOMException = global.DOMException;
try {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasDomException = new DOMException();
} catch (err) {
  DOMException = function (message, name) {
    this.message = message;
    this.name = name;
    var error = Error(message);
    this.stack = error.stack;
  };
  DOMException.prototype = Object.create(Error.prototype);
  DOMException.prototype.constructor = DOMException;
}

const isAbort = (request, reject) => {
  if (request.signal && request.signal.aborted) reject(new DOMException('Aborted', 'AbortError'));
};

const xhrBuildOnLoad = (xhr, resolve) => () => {
  var options = {
    status: xhr.status,
    statusText: xhr.statusText,
    headers: parseHeaders(xhr.getAllResponseHeaders() || ''),
  };
  options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
  var body = 'response' in xhr ? xhr.response : xhr.responseText;
  setTimeout(function () {
    resolve(new Response(body, options));
  }, 0);
};

const xhrBuildOnError = reject => () => {
  setTimeout(function () {
    reject(new TypeError('Network request failed'));
  }, 0);
};

const xhrBuildOnTimeout = reject => () => {
  setTimeout(function () {
    reject(new TypeError('Network request failed'));
  }, 0);
};
const xhrBuildOnAbort = reject => () => {
  setTimeout(function () {
    reject(new DOMException('Aborted', 'AbortError'));
  }, 0);
};
const xhrBuildOnReadyStateChange = (request, abortXhr, readyState) => () => {
  // DONE (success or failure)
  if (readyState === 4) {
    request.signal.removeEventListener('abort', abortXhr);
  }
};

const fixUrl = url => {
  try {
    return url === '' && global.location.href ? global.location.href : url;
  } catch (e) {
    return url;
  }
};

const findXhrCredentials = request => {
  if (request.credentials === 'include') {
    return true;
  } else if (request.credentials === 'omit') {
    return false;
  }
  return;
};

const findXhrResponseType = (request, xhr) => {
  if ('responseType' in xhr) {
    if (support.blob) {
      return 'blob';
    } else if (
      support.arrayBuffer &&
      request.headers.get('Content-Type') &&
      request.headers.get('Content-Type').indexOf('application/octet-stream') !== -1
    ) {
      return 'arraybuffer';
    }
  }
  return;
};

const findXhrRequestHeader = (init, request, xhr) => {
  if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers)) {
    Object.getOwnPropertyNames(init.headers).forEach(function (name) {
      xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
    });
  } else {
    request.headers.forEach(function (value, name) {
      xhr.setRequestHeader(name, value);
    });
  }
};

export function fetch(input, init) {
  return new Promise(function (resolve, reject) {
    var request = new Request(input, init);

    isAbort(request, reject);

    var xhr = new XMLHttpRequest();

    function abortXhr() {
      xhr.abort();
    }

    xhr.onload = xhrBuildOnLoad(xhr, resolve);

    xhr.onerror = xhrBuildOnError(reject);

    xhr.ontimeout = xhrBuildOnTimeout(reject);

    xhr.onabort = xhrBuildOnAbort(reject);

    xhr.open(request.method, fixUrl(request.url), true);

    xhr.withCredentials = findXhrCredentials(request);

    xhr.responseType = findXhrResponseType();

    findXhrRequestHeader(init, request, xhr);

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr);

      xhr.onreadystatechange = xhrBuildOnReadyStateChange(request, abortXhr, xhr.readyState);
    }

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
  });
}

fetch.polyfill = true;

if (!global.fetch) {
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}
