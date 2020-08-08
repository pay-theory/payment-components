import { processElements, invalidate, postData } from './util'

const fields = {
    CREDIT_CARD_NAME: 'paytheory-credit-card-name',
    CREDIT_CARD_CVV: 'paytheory-credit-card-cvv',
    CREDIT_CARD_EXPIRATION: 'paytheory-credit-card-expiration',
    CREDIT_CARD_NUMBER: 'paytheory-credit-card-number',
    CREDIT_CARD_ZIP: 'paytheory-credit-card-zip',
}

const transactionEndpoint = `https://${process.env.BUILD_ENV}.tags.api.paytheorystudy.com`;

let identity = false;

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

                console.log('validating sdk', validType, validCVV, validNumber, validExpiration, validName, validZip)

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
}
