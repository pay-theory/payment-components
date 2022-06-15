/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/*global navigator*/
import common from '../common'
import * as valid from './validation'
import * as handler from './handler'

export default async(
    apiKey,
    legacy, // this used to be client id, left in place to preserve backwards compatibility
    styles = common.defaultStyles,
    sessionMetadata = {},
    fee_mode = common.defaultFeeMode
) => {
    
    const keyParts = apiKey.split("-")
    let environment = keyParts[0]
    let stage = keyParts[1]
    let partnerMode = ""
    if (['new','old'].includes(stage)) {
        partnerMode = stage
        stage = keyParts[2]
    }
    valid.checkCreateParams(apiKey, fee_mode, sessionMetadata, styles, environment, stage, partnerMode)

    common.removeAll(true)
    let partner_environment
    if (partnerMode === "") {
        partner_environment = `${environment}`
    } else {
        partner_environment = `${environment}-${partnerMode}`
    }
    common.setEnvironment(partner_environment)
    common.setStage(stage)

    const validTypes = {
        'card-number': false,
        'card-exp': false,
        'card-cvv': false,
        'card-name': true,
        'billing-line1': true,
        'billing-line2': true,
        'billing-city': true,
        'billing-state': true,
        'billing-zip': false,
        'account-number': false,
        'routing-number': false,
        'account-name': false,
        'account-type': false,
        'cash-name': false,
        'cash-zip': true,
        'cash-contact': false
    }

    const defaultElementIds = {
        'credit-card': common.fields.CREDIT_CARD,
        'number': common.fields.CREDIT_CARD_NUMBER,
        'exp': common.fields.CREDIT_CARD_EXP,
        'cvv': common.fields.CREDIT_CARD_CVV,
        'account-name': common.fields.CREDIT_CARD_NAME,
        'address-1': common.fields.CREDIT_CARD_ADDRESS1,
        'address-2': common.fields.CREDIT_CARD_ADDRESS2,
        city: common.fields.CREDIT_CARD_CITY,
        state: common.fields.CREDIT_CARD_STATE,
        zip: common.fields.CREDIT_CARD_ZIP,
        'account-number': common.achFields.ACCOUNT_NUMBER,
        'ach-name': common.achFields.ACCOUNT_NAME,
        'routing-number': common.achFields.BANK_CODE,
        'account-type': common.achFields.ACCOUNT_TYPE,
        'cash-name': common.cashFields.NAME,
        'cash-contact': common.cashFields.CONTACT,
        'cash-zip': common.cashFields.ZIP,
    }

    let isValid = false

    const processedElements = {
        card: [],
        ach: [],
        cash: []
    }

    let transacting = {}

    let isReady = false

    const fetchPtToken = async() => {
        for(let i = 0; i < 5; i++) {
            let token = await common.getData(`${common.transactionEndpoint()}`, apiKey)
            if (token['pt-token']) {
                return token
            }
        }
        return {}
    }

    let ptToken = {}
    ptToken.token = await fetchPtToken()
    ptToken.isUsed = false

    const resetHostToken = async() => {
        let transacting = common.getTransactingElement()
        let token = await fetchPtToken()
        common.postMessageToHostedField(common.hostedFieldMap[transacting], {
            type: `pt-static:reset_host`,
            token: token['pt-token']
        })
    }

    window.addEventListener("beforeunload", () => { common.removeReady() })

    const mountProcessedElements = async(processedArray) => {
        for (const processed of processedArray) {
            if (processed.elements.length > 0) {
                let error = processed.errorCheck(processed.elements, transacting[processed.type])
                if (error) {
                    common.handleError(error);
                }
                let token;
                if (ptToken.isUsed) {
                    token = await fetchPtToken()
                }
                else {
                    ptToken.isUsed = true
                    token = ptToken.token
                }

                processed.elements.forEach(element => {
                    if(!token['pt-token']) {
                        return common.handleError(`No pt-token found`)
                    }
                    const json = JSON.stringify({ token: token['pt-token'], origin: token.origin, styles, apiKey})
                    const encodedJson = window.btoa(json)
                    element.frame.token = encodeURI(encodedJson)
                })
            }
        }

        window.postMessage({
                type: `pay-theory:ready`,
                ready: true
            },
            window.location.origin,
        )
    }

    const mount = async(
        elements = defaultElementIds
    ) => {
        common.removeInitialize()

        const achElements = {
            'account-number': elements['account-number'],
            'account-name': elements['ach-name'],
            'routing-number': elements['routing-number'],
            'account-type': elements['account-type'],
        }

        const cardElements = {
            'credit-card': elements['credit-card'],
            'card-number': elements.number,
            'card-exp': elements.exp,
            'card-cvv': elements.cvv,
            'card-name': elements['account-name'],
            'billing-line1': elements['address-1'],
            'billing-line2': elements['address-2'],
            'billing-city': elements.city,
            'billing-state': elements.state,
            'billing-zip': elements.zip,
        }

        const cashElements = {
            'cash-name': elements['cash-name'],
            'cash-contact': elements['cash-contact'],
            'cash-zip': elements['cash-zip']
        }

        processedElements.card = common.processElements(cardElements, styles, common.fieldTypes, 'credit-card')
        processedElements.ach = common.processElements(achElements, styles, common.achFieldTypes, 'ach')
        processedElements.cash = common.processElements(cashElements, styles, common.cashFieldTypes)

        transacting.card = processedElements.card.reduce(common.findTransactingElement, false)
        transacting.ach = processedElements.ach.reduce(common.findAccountNumber, false)
        transacting.cash = processedElements.cash.reduce(common.findField('cash-name'), false)

        const removeRelay = common.handleHostedFieldMessage(common.relayTypeMessage, handler.relayHandler())

        const setupTransacting = {
            'account-number': processedElements.ach,
            'card-number': processedElements.card,
            'cash-name': processedElements.cash
        }

        const removeSetup = common.handleHostedFieldMessage(common.hostedReadyTypeMessage, handler.setupHandler(styles, setupTransacting))

        const removeSibling = common.handleHostedFieldMessage(common.siblingTypeMessage, handler.siblingHandler(processedElements))

        const removeState = common.handleHostedFieldMessage(common.stateTypeMessage, handler.stateUpdater(processedElements))

        const removeHostedError = common.handleHostedFieldMessage(common.socketErrorTypeMessage, handler.hostedErrorHandler(resetHostToken))
    
        if (processedElements.ach.length === 0 && processedElements.card.length === 0 && processedElements.cash.length === 0) {
            return common.handleError('There are no PayTheory fields')
        }

        let processed = [{
            type: 'card',
            elements: processedElements.card,
            errorCheck: valid.findCardError
        }, {
            type: 'ach',
            elements: processedElements.ach,
            errorCheck: valid.findAchError
        }, {
            type: 'cash',
            elements: processedElements.cash,
            errorCheck: valid.findCashError
        }]

        await mountProcessedElements(processed)

        //returns a function that removes any event handlers that were put on the window during the mount function
        return () => {
            removeRelay()
            removeSetup()
            removeSibling()
            removeState()
            removeHostedError()
        }
    }

    const handleInitMessage = (type, data) => {
        const options = ['card', 'cash', 'ach']

        options.forEach(option => {
            if (common.isHidden(transacting[option]) === false && isValid.includes(option)) {
                const element = transacting[option]
                common.setTransactingElement(element)
                element.resetToken = resetHostToken
                common.postMessageToHostedField(common.hostedFieldMap[element.id], {type, data})
            }
        })
    }

    const handleInitialized = (amount, customerInfo, metadata, confirmation) => {
        //validate the input param types
        if(!valid.isvalidInputParams(amount, customerInfo, metadata)) return false
        //validate the amount
        if(!valid.isValidAmount(amount)) return false

        // Add timezone to the metadata for use with sending receipts from PayTheory
        metadata['pt_payment-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
        // Define the message type and data to send to the hosted field
        const type = 'pt-static:payment-detail'
        const data = { amount, customerInfo, metadata, fee_mode, confirmation }
        handleInitMessage(type, data)
        return true
    }

    const handleRecurring = (amount, customerInfo, metadata, confirmation, recurringSettings) => {
        //validate the input param types
        if(!valid.isvalidInputParams(amount, customerInfo, metadata, recurringSettings)) return false
        //validate the amount
        if(!valid.isValidAmount(amount)) return false
        //validate the recurring settings
        if(!valid.isValidRecurringSettings(recurringSettings)) return false
        //validate the customer info
        if(!valid.isValidRecurringCustomerInfo(customerInfo)) return false

        if(recurringSettings.first_payment_date) {
            recurringSettings.first_payment_date = recurringSettings.first_payment_date.toISOString().split('T')[0]
        }

        // Add timezone to the metadata for use with sending receipts from PayTheory
        metadata['pt_payment-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
        // Define the message type and data to send to the hosted field
        const type = 'pt-static:recurring-detail'
        const data =  { amount, customerInfo, metadata, fee_mode, confirmation, recurringSettings }
        handleInitMessage(type, data)
        return true
    }


    const handleRecurringUpdate = (recurringId) => {
        //validate the input param types
        if(!valid.validate(recurringId, 'string')) return false

        // Define the message type and data to send to the hosted field
        const type = 'pt-static:recurring-update'
        const data =  { recurringId }
        handleInitMessage(type, data)
        return true
    }

    const transact = common.generateInitialization(handleInitialized, ptToken.token.challengeOptions)

    const initTransaction = (amount, customerInfo, confirmation) => {
        console.warn('initTransaction is deprecated. Please use transact instead.')
        //Passing in the session metadata from create because those used to be the only metadata that were passed in
        transact({amount, customerInfo, metadata: sessionMetadata, confirmation})
    }

    const createRecurringPayment = common.generateRecurring(handleRecurring, ptToken.token.challengeOptions)

    const updateRecurringPaymentMethod = common.updateRecurring(handleRecurringUpdate, ptToken.token.challengeOptions)

    const confirm = () => {
        const transacting = common.getTransactingElement()
        if (transacting) {
            common.postMessageToHostedField(common.hostedFieldMap[transacting], {
                    type: 'pt-static:confirm',
                    capture: true
                }
            )
        }
    }

    const cancel = async() => {
        let transacting = common.getTransactingElement()
        if (transacting) {
            common.postMessageToHostedField(common.hostedFieldMap[transacting], {
                type: `pt-static:cancel`
            })
            await resetHostToken()
        }
        common.removeInitialize()
        common.removeTransactingElement()
    }

    const isReadyStale = () => {
        if (!isNaN(parseInt(common.getReady()))) {
            return (Math.round(Date.now()) - parseInt(common.getReady()) > 10000);
        }
        return true;
    }

    const readyObserver = cb => common.handleMessage(
        common.readyTypeMessage,
        message => {
            if (message.type === 'pay-theory:ready' && (!isReady) && isReadyStale()) {
                common.setReady(Math.round(Date.now()))
                isReady = message.ready
                cb(message.ready)
            }
        })

    const validObserver = cb => common.handleMessage(
        valid.validTypeMessage(processedElements),
        message => {
            const type = message.type.split(':')[1]
            let validating = false

            if (typeof validTypes[type] === 'undefined') return


            validTypes[type] = message.valid

            const validCard = valid.hasValidCard(validTypes)

            const validAch = valid.hasValidAccount(validTypes)

            const validCash = valid.hasValidCash(validTypes)

            const validObjects = [{
                isValid: validCard,
                name: 'card'
            }, {
                isValid: validCash,
                name: 'cash'
            }, {
                isValid: validAch,
                name: 'ach'
            }]

            let validFields = validObjects.reduce((areValid, obj) => {
                if (obj.isValid) areValid.push(obj.name)
                return areValid
            }, [])
            validating = validFields.join('-')

            if (isValid !== validating) {
                isValid = validating
                cb(isValid)
            }
        })

    const cashObserver = cb => common.handleHostedFieldMessage(common.cashCompleteTypeMessage, message => {
        const options = {
            timeout: 5000,
            maximumAge: 0
        };

        function success(pos) {
            const crd = pos.coords;
            const response = message.barcode;
            response.mapUrl = `https://map.payithere.com/biller/4b8033458847fec15b9c840c5b574584/?lat=${crd.latitude}&lng=${crd.longitude}`
            cb(response)
            common.removeAll()
        }

        function error() {
            const response = message.barcode;
            cb(response)
            common.removeAll(true)
        }

        navigator.geolocation.getCurrentPosition(success, error, options);
        if (message.status === 'FAILURE') {
            document.getElementById(common.getTransactingElement()).cash = false
        }
    })

    return common.generateReturn(
            mount,
            initTransaction,
            transact,
            createRecurringPayment,
            updateRecurringPaymentMethod,
            confirm,
            cancel,
            readyObserver,
            validObserver,
            cashObserver
        )
}
