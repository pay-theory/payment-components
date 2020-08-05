import './components/credit-card';
import './components/credit-card-account-name';
import './components/credit-card-cvv';
import './components/credit-card-expiration';
import './components/credit-card-number';
import './components/credit-card-zip';
import 'regenerator-runtime';
import './style.css';

const fields = {
  CREDIT_CARD_NAME: 'paytheory-credit-card-account-name',
  CREDIT_CARD_CVV: 'paytheory-credit-card-cvv',
  CREDIT_CARD_EXPIRATION: 'paytheory-credit-card-expiration',
  CREDIT_CARD_NUMBER: 'paytheory-credit-card-number',
  CREDIT_CARD_ZIP: 'paytheory-credit-card-zip',
}

async function postData(url = '', apiKey, data = {}) {
  const options = {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  };
  /* global fetch */
  const response = await fetch(url, options);
  return await response.json();
}

const transactionEndpoint = `https://${process.env.BUILD_ENV}.tags.api.paytheorystudy.com`;

let identity = false;

// const initializeForm = () => {
//     return window.PaymentForm.card((state, binInformation) => {
//         if (binInformation) {
//             const badge = binInformation.cardBrand
//             const badger = document.createElement('div')
//             badger.setAttribute(
//                 'class',
//                 `paytheory-card-badge paytheory-card-${badge}`
//             )
//             const badged = document.getElementById('badge-wrapper')
//             if (badged !== null) {
//                 badged.innerHTML = ''
//                 badged.appendChild(badger)
//             }
//         }
//         if (state) {
//             const num = invalidate(state.number)
//             const code = invalidate(state.security_code)

//             const invalid = num
//                 ? state.number.errorMessages[0]
//                 : code
//                 ? state.security_code.errorMessages[0]
//                 : false

//             this.error = invalid
//             this.valid = this.error // if there is an error
//                 ? false // valid is false
//                 : typeof code === 'undefined' || typeof num === 'undefined' // otherwise if any values are undefined
//                 ? undefined // valid is undefined
//                 : typeof code === 'undefined' // otherwise if code is defined
//                 ? !num // otherwise valid is nums validation
//                 : !code // valid is codes validation
//         }
//     })
// }

const addFrame = (
  form,
  container,
  element,
  styles,
  frameType = 'paytheory-credit-card-tag-frame',
) => {
  const tagFrame = document.createElement(frameType);
  tagFrame.styles = styles;
  tagFrame.form = form;
  tagFrame.setAttribute('ready', true);
  tagFrame.setAttribute('id', `${element}-tag-frame`);
  container.appendChild(tagFrame);
};

const processElements = (form, elements, styles) => {
  let processed = []
  elements.forEach(element => {
    if (typeof element !== 'string') throw new Error('invalid element')
    const container = document.getElementById(element)
    if (container) {
      const contained = document.getElementById(`${element}-tag-frame`)
      if (contained === null) {
        addFrame(form, container, element, styles, `${element}-tag-frame`)
        processed.push(element)
      }
      else {
        console.log(`${element} is already mounted`, contained);
        throw new Error(`${element} is already mounted`);
      }
    }
    else {
      console.log(`${element} is not available in dom`);
    }
  })
  return processed
}

const processElement = (form, element, styles) => {
  if (typeof element !== 'string') throw new Error('invalid element');
  const container = document.getElementById(element);
  if (container) {
    const contained = document.getElementById(`${element}-tag-frame`);
    if (contained === null) {
      addFrame(form, container, element, styles, `${element}-tag-frame`);

      console.log('frame added', `${element}-tag-frame`);
    }
    else {
      console.log(`${element} is already mounted`, contained);
      throw new Error(`${element} is already mounted`);
    }
  }
  else {
    throw new Error(`${element} is not available in dom`);
  }
};

const createCreditCard = async(
  apiKey,
  clientKey,
  amount,
  styles = {
    default: {},
    success: {},
    error: {},
  },
  tags = {},
) => {
  let formed = false;
  return {
    mount: (element = 'paytheory-credit-card') => {
      if (formed) {
        processElement(formed, element, styles);
      }
      else {
        const script = document.createElement('script');
        // eslint-disable-next-line scanjs-rules/assign_to_src
        script.src = 'https://forms.finixpymnts.com/finix.js';
        script.addEventListener('load', function () {
          formed = window.PaymentForm.card((state, binInformation) => {
            if (binInformation) {
              const badge = binInformation.cardBrand;
              const badger = document.createElement('div');
              badger.setAttribute('class', `paytheory-card-badge paytheory-card-${badge}`);
              const badged = document.getElementById('badge-wrapper');
              if (badged !== null) {
                badged.innerHTML = '';
                badged.appendChild(badger);
              }
            }

            if (state) {
              const num = invalidate(state.number);
              const date = invalidate(state.expiration_date);
              const code = invalidate(state.security_code);

              const invalid = num ?
                state.number.errorMessages[0] :
                code ?
                state.security_code.errorMessages[0] :
                date ?
                state.expiration_date.errorMessages[0] :
                false;

              this.error = invalid;
              this.valid = this.error // if there is an error
                ?
                false // valid is false
                :
                typeof code === 'undefined' ||
                typeof date === 'undefined' ||
                typeof num === 'undefined' // otherwise if any values are undefined
                ?
                undefined // valid is undefined
                :
                typeof date === 'undefined' // otherwise if date is defined
                ?
                typeof code === 'undefined' // otherwise if code is defined
                :
                !num // otherwise valid is nums validation
                ?
                !date // valid is codes validation
                :
                !date; // valid is dates validation
            }
          });
          processElement(formed, element, styles);
        });
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    },

    initTransaction: async(buyerOptions = {}) => {
      if (buyerOptions) {
        identity = await postData(
          `${transactionEndpoint}/${clientKey}/identity`,
          apiKey,
          typeof buyerOptions === 'object' ? buyerOptions : {},
        );
      }

      window.postMessage({
          type: `transact`,
          transact: true,
        },
        window.location.origin,
      );
    },
    readyObserver: readyCallback => {
      window.addEventListener('message', event => {
        if (![window.location.origin].includes(event.origin)) {
          return;
        }
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (message.type === 'ready') {
          readyCallback(message.ready);
        }
      });
    },
    transactedObserver: transactedCallback => {
      window.addEventListener('message', async event => {
        if (![window.location.origin].includes(event.origin)) {
          return;
        }
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (message.type === 'tokenized') {
          console.log('tokenized');
          const instrument = await postData(
            `${transactionEndpoint}/${clientKey}/instrument`,
            apiKey, {
              token: message.tokenized.data.id,
              type: 'TOKEN',
              identity: identity.id,
            },
          );

          const authorization = await postData(
            `${transactionEndpoint}/${clientKey}/authorize`,
            apiKey, {
              source: instrument.id,
              amount,
              currency: 'USD',
              tags: tags,
            },
          );

          transactedCallback({
            last_four: instrument.last_four,
            brand: instrument.brand,
            ...authorization,
          });
        }
      });
    },
    errorObserver: errorCallback => {
      window.addEventListener('message', event => {
        if (![window.location.origin].includes(event.origin)) {
          return;
        }
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (message.type === 'error') {
          errorCallback(message.error);
        }
      });
    },
    validObserver: validCallback => {
      window.addEventListener('message', event => {
        if (![window.location.origin].includes(event.origin)) {
          return;
        }
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (message.type === 'valid') {
          validCallback(message.valid);
        }
      });
    },
  };
};

const invalidate = _t => (_t.isDirty ? _t.errorMessages.length > 0 : undefined);

const createCreditCardFields = async(
  apiKey,
  clientKey,
  amount,
  styles = {
    default: {},
    success: {},
    error: {},
  },
  tags = {},
) => {
  let readyNumber = false;
  let readyName = true;
  let readyCVV = true;
  let readyExpiration = true;
  let readyZip = true;
  let validName = true;
  let validNumber = false;
  let validCVV = true;
  let validExpiration = true;
  let validZip = true;
  let formed = false;
  let isValid = false;
  let isReady = false;
  let processed = []
  return {
    mount: (
      elements = [
        fields.CREDIT_CARD_NAME,
        fields.CREDIT_CARD_NUMBER,
        fields.CREDIT_CARD_CVV,
        fields.CREDIT_CARD_EXPIRATION,
        fields.CREDIT_CARD_ZIP,
      ],
    ) => {
      if (formed) {
        processed = processElements(formed, elements, styles);
      }
      else {
        const script = document.createElement('script');
        // eslint-disable-next-line scanjs-rules/assign_to_src
        script.src = 'https://forms.finixpymnts.com/finix.js';
        script.addEventListener('load', function () {
          formed = window.PaymentForm.card((state, binInformation) => {
            if (binInformation) {
              const badge = binInformation.cardBrand;
              const badger = document.createElement('div');
              badger.setAttribute('class', `paytheory-card-badge paytheory-card-${badge}`);
              const badged = document.getElementById('badge-wrapper');
              if (badged !== null) {
                badged.innerHTML = '';
                badged.appendChild(badger);
              }
            }

            if (state) {
              const num = invalidate(state.number);
              const code = invalidate(state.security_code);

              const invalid = num ?
                state.number.errorMessages[0] :
                code ?
                state.security_code.errorMessages[0] :
                false;

              this.error = invalid;
              this.valid = this.error // if there is an error
                ?
                false // valid is false
                :
                typeof code === 'undefined' || typeof num === 'undefined' // otherwise if any values are undefined
                ?
                undefined // valid is undefined
                :
                typeof code === 'undefined' // otherwise if code is defined
                ?
                !num // otherwise valid is nums validation
                :
                !code; // valid is codes validation
            }
          });
          processed = processElements(formed, elements, styles);
        });
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    },

    initTransaction: async(buyerOptions = {}) => {
      if (buyerOptions) {
        identity = await postData(
          `${transactionEndpoint}/${clientKey}/identity`,
          apiKey,
          typeof buyerOptions === 'object' ? buyerOptions : {},
        );
      }

      window.postMessage({
          type: `transact`,
          transact: true,
        },
        window.location.origin,
      );
    },
    readyObserver: readyCallback => {
      window.addEventListener('message', event => {
        if (![window.location.origin].includes(event.origin)) {
          return;
        }
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        let calling = false

        if (!message.type.endsWith('-ready')) return

        const readyType = message.type.split('-')[0]

        if (!processed.includes(`paytheory-credit-card-${readyType}`)) return

        switch (readyType) {
        case 'name':
          {
            readyName = message.ready;
            calling = true;
            break;
          }
        case 'cvv':
          {
            readyCVV = message.ready;
            calling = true;
            break;
          }
        case 'number':
          {
            readyNumber = message.ready;
            calling = true;
            break;
          }
        case 'expiration':
          {
            readyExpiration = message.ready;
            calling = true;
            break;
          }
        case 'zip':
          {
            readyZip = message.ready;
            calling = true;
            break;
          }
        default:
          {
            break;
          }
        }
        const readying = (readyCVV && readyNumber && readyExpiration && readyName && readyZip)
        if (isReady != readying) {
          isReady = readying
          if (calling) {
            readyCallback(isReady);
          }
        }
      });
    },
    transactedObserver: transactedCallback => {
      window.addEventListener('message', async event => {
        if (![window.location.origin].includes(event.origin)) {
          return;
        }
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (message.type === 'tokenized') {
          console.log('tokenized');
          const instrument = await postData(
            `${transactionEndpoint}/${clientKey}/instrument`,
            apiKey, {
              token: message.tokenized.data.id,
              type: 'TOKEN',
              identity: identity.id,
            },
          );

          const authorization = await postData(
            `${transactionEndpoint}/${clientKey}/authorize`,
            apiKey, {
              source: instrument.id,
              amount,
              currency: 'USD',
              tags: tags,
            },
          );

          transactedCallback({
            last_four: instrument.last_four,
            brand: instrument.brand,
            ...authorization,
          });
        }
      });
    },
    errorObserver: errorCallback => {
      window.addEventListener('message', event => {
        if (![window.location.origin].includes(event.origin)) {
          return;
        }
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (message.type === 'error') {
          errorCallback(message.error);
        }
      });
    },
    validObserver: validCallback => {
      window.addEventListener('message', event => {
        if (![window.location.origin].includes(event.origin)) {
          return;
        }
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (!message.type.endsWith('-valid')) return

        const validType = message.type.split('-')[0]

        if (!processed.includes(`paytheory-credit-card-${validType}`)) return

        let calling = false;

        switch (validType) {
        case 'name':
          {
            validName = message.valid;
            calling = true;
            break;
          }
        case 'cvv':
          {
            validCVV = message.valid;
            calling = true;
            break;
          }
        case 'number':
          {
            validNumber = message.valid;
            calling = true;
            break;
          }
        case 'expiration':
          {
            validExpiration = message.valid;
            calling = true;
            break;
          }
        case 'zip':
          {
            validZip = message.valid;
            calling = true;
            break;
          }
        default:
          {
            break;
          }
        }

        const validating = (validCVV && validNumber && validExpiration && validName && validZip)
        if (isValid != validating) {
          isValid = validating
          if (calling) {
            validCallback(isValid);
          }
        }

      });
    },
  };
};

window.paytheory = {
  createCreditCard,
  createCreditCardFields,
};

export default window.paytheory;
