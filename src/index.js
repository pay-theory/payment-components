import './components/credit-card';
import './components/credit-card-account-name';
import './components/credit-card-cvv';
import './components/credit-card-expiration';
import './components/credit-card-number';
import './components/credit-card-zip';
import 'regenerator-runtime';
import './style.css';

const fields = {
  CREDIT_CARD_NAME: 'pay-theory-credit-card-account-name',
  CREDIT_CARD_CVV: 'pay-theory-credit-card-cvv',
  CREDIT_CARD_EXPIRATION: 'pay-theory-credit-card-expiration',
  CREDIT_CARD_NUMBER: 'pay-theory-credit-card-number',
  CREDIT_CARD_ZIP: 'pay-theory-credit-card-zip',
}

const fieldTypes = ['cvv', 'account-name', 'expiration', 'number', 'zip'];

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

const transactionEndpoint = (() => {

  switch (process.env.BUILD_ENV) {
  case 'prod':
    {
      return `https://tags.api.paytheory.com`
    }
  case 'stage':
    {
      return `https://demo.tags.api.paytheorystudy.com`
    }
  default:
    {
      return `https://dev.tags.api.paytheorystudy.com`
    }
  }
})()

let identity = false;

// const initializeForm = () => {
//     return window.PaymentForm.card((state, binInformation) => {
//         if (binInformation) {
//             const badge = binInformation.cardBrand
//             const badger = document.createElement('div')
//             badger.setAttribute(
//                 'class',
//                 `pay-theory-card-badge pay-theory-card-${badge}`
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
  frameType = 'pay-theory-credit-card-tag-frame',
) => {
  const tagFrame = document.createElement(frameType);
  tagFrame.styles = styles;
  tagFrame.form = form;
  tagFrame.setAttribute('ready', true);
  tagFrame.setAttribute('id', `${element}-tag-frame`);
  container.appendChild(tagFrame);
  return tagFrame
};

const processElements = (form, elements, styles) => {
  let processed = []
  fieldTypes.forEach(type => {
    if (typeof elements[type] !== 'string') throw new Error('invalid element')
    const container = document.getElementById(elements[type])
    if (container) {
      const contained = document.getElementById(`${elements[type]}-tag-frame`)
      if (contained === null) {
        const frame = addFrame(form, container, elements[type], styles, `pay-theory-credit-card-${type}-tag-frame`)
        processed.push({ type: type, frame: frame })
        console.log(`${elements[type]} is now mounted`);
      }
      else {
        throw new Error(`${elements[type]} is already mounted`);
      }
    }
    else {
      console.log(`${elements[type]} is not available in dom`);
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
      addFrame(form, container, element, styles);
      console.log(`${element} is now mounted`);
    }
    else {
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
    mount: async(element = 'pay-theory-credit-card') => {
      if (formed) {
        processElement(formed, element, styles);
        return
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
              badger.setAttribute('class', `pay-theory-card-badge pay-theory-card-${badge}`);
              const badged = document.getElementById('pay-theory-badge-wrapper');
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
          return
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

const stateMap = {
  'account-name': 'name',
  'cvv': 'security_code',
  'expiration': 'expiration_date',
  'zip': 'address.postal_code'
}

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
  let validName = false;
  let validNumber = false;
  let validCVV = false;
  let validExpiration = false;
  let validZip = false;
  let formed = false;
  let isValid = false;
  let isReady = false;
  let processedElements = []
  return {
    mount: async(
      elements = {
        'account-name': fields.CREDIT_CARD_NAME,
        number: fields.CREDIT_CARD_NUMBER,
        cvv: fields.CREDIT_CARD_CVV,
        expiration: fields.CREDIT_CARD_EXPIRATION,
        zip: fields.CREDIT_CARD_ZIP,
      },
    ) => {
      if (formed) {
        processedElements = processElements(formed, elements, styles);
        return
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
              badger.setAttribute('class', `pay-theory-card-badge pay-theory-card-${badge}`);
              const badged = document.getElementById('pay-theory-badge-wrapper');
              if (badged !== null) {
                badged.innerHTML = '';
                badged.appendChild(badger);
              }
            }

            if (state) {
              let errors = []



              processedElements.forEach(element => {
                let stateType = ''

                if (stateMap[element.type]) {
                  stateType = stateMap[element.type]
                }
                else {
                  stateType = element.type
                }

                const stated = state[stateType]
                const invalidElement = invalidate(stated)
                if (element.frame.field === element.type) {
                  element.frame.valid = typeof invalidElement === 'undefined' ? invalidElement : !invalidElement

                  if (invalidElement) {
                    errors.push(stated.errorMessages[0])
                    element.frame.error = stated.errorMessages[0]
                  }
                  else {
                    element.frame.error = false
                  }
                }
              })
            }
          });
          processedElements = processElements(formed, elements, styles);
          return
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

        if (!processedElements.map(element => element.type).includes(`${readyType}`)) return

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

        if (!processedElements.map(element => element.type).includes(`${validType}`)) return

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

        const validating = (validCVV && validNumber && validExpiration && validZip)

        console.log('sdk validating', validating, validCVV, validNumber, validExpiration, validZip)

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
