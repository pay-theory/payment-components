import { processElement, invalidate, postData } from './util'

const transactionEndpoint = `https://${process.env.BUILD_ENV}.tags.api.paytheorystudy.com`;

let identity = false;

export default async(
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
}
