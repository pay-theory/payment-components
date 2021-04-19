/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import common from '../common'
import * as valid from './validation'
import * as handler from './handler'

export default async(
    apiKey,
    legacy, // this used to be client id, left in place to preserve backwards compatibility
    styles = common.defaultStyles,
    tags = common.defaultTags,
    fee_mode = common.defaultFeeMode,
    env = common.defaultEnvironment
) => {
    common.removeAll()
    common.setEnvironment(env)

    valid.checkCreateParams(apiKey, fee_mode, tags, styles, env)

    const validTypes = {
        'card-number': false,
        'card-exp': false,
        'card-cvv': false,
        'card-name': true,
        'billing-line1': true,
        'billing-line2': true,
        'billing-city': true,
        'billing-state': true,
        'billing-zip': true,
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
        return await common.getData(`${common.transactionEndpoint(env)}/pt-token`, apiKey)
    }

    let ptToken = {}
    ptToken.token = await fetchPtToken()
    ptToken.isUsed = false

    const resetHostToken = async() => {
        let transacting = common.getTransactingElement()
        let token = await fetchPtToken()
        common.postMessageToHostedField(common.hostedFieldMap[transacting], env, {
            type: `pt-static:cancel`,
            token: token['pt-token']
        })
    }

    window.addEventListener("beforeunload", () => { common.removeReady() })

    const mountProcessedElements = async(processedArray) => {
        processedArray.forEach(async(processed) => {
            if (processed.elements.length > 0) {
                let error = processed.errorCheck(processed.elements, transacting[processed.type])
                if (error) {
                    return common.handleError(error, true)
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
                    const json = JSON.stringify({ token: token['pt-token'], origin: token.origin, styles })
                    const encodedJson = window.btoa(json)
                    element.frame.token = encodeURI(encodedJson)
                })
            }
        })

        window.postMessage({
                type: `pay-theory:ready`,
                ready: true
            },
            window.location.origin,
        )
    }

    const mount = async(
        elements = defaultElementIds,
        env = common.getEnvironment()
    ) => {
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

        processedElements.card = common.processElements(cardElements, styles, env, common.fieldTypes, 'credit-card')
        processedElements.ach = common.processElements(achElements, styles, env, common.achFieldTypes, 'ach')
        processedElements.cash = common.processElements(cashElements, styles, env, common.cashFieldTypes)

        transacting.card = processedElements.card.reduce(common.findTransactingElement, false)
        transacting.ach = processedElements.ach.reduce(common.findAccountNumber, false)
        transacting.cash = processedElements.cash.reduce(common.findField('cash-name'), false)

        const removeRelay = common.handleHostedFieldMessage(common.relayTypeMessage, handler.relayHandler(env), env)

        const setupTransacting = {
            'account-number': processedElements.ach,
            'card-number': processedElements.card,
            'cash-name': processedElements.cash
        }

        const removeSetup = common.handleHostedFieldMessage(common.hostedReadyTypeMessage, handler.setupHandler(env, styles, setupTransacting), env)

        const removeSibling = common.handleHostedFieldMessage(common.siblingTypeMessage, handler.siblingHandler(env, processedElements), env)

        const removeState = common.handleHostedFieldMessage(common.stateTypeMessage, handler.stateUpdater(processedElements), env)

        const removeInstrument = common.handleHostedFieldMessage(common.instrumentTypeMessage, handler.instrumentHandler(transacting), env)

        const removeHostedError = common.handleHostedFieldMessage(common.socketErrorTypeMessage, handler.hostedErrorHandler(resetHostToken), env)

        const removeIdempotency = common.handleHostedFieldMessage(common.idempotencyTypeMessage, handler.idempotencyHandler, env)

        const removeTransferComplete = common.handleHostedFieldMessage(common.transferCompleteTypeMessage, handler.transferCompleteHandler, env)

        if (processedElements.ach.length === 0 && processedElements.card.length === 0 && processedElements.cash.length === 0) {
            return common.handleError('There are no PayTheory fields', true)
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

        mountProcessedElements(processed)

        //returns a funciton that removes any event handlers that were put on the window during the mount function
        return () => {
            removeRelay()
            removeSetup()
            removeSibling()
            removeState()
            removeInstrument()
            removeIdempotency()
            removeTransferComplete()
            removeHostedError()
        }
    }

    let initializeActions = (amount, action, buyerOptions, framed) => {
        common.setTransactingElement(framed)
        if (framed.id.includes('cash')) {
            framed.resetToken = resetHostToken
            framed.cash = { amount, buyerOptions, tags }
        }
        else {
            framed.amount = amount
            framed.action = action
            framed.resetToken = resetHostToken
        }
    }

    const handleInitialized = (amount, buyerOptions, confirmation) => {

        const action = confirmation ? 'tokenize' : 'transact'
        common.setBuyer(buyerOptions)
        const options = ['card', 'cash', 'ach']

        if (isValid === false) return false

        options.forEach(option => {
            if (common.isHidden(transacting[option]) === false && isValid.includes(option)) {
                initializeActions(amount, action, buyerOptions, transacting[option])
            }
        })
    }

    const initTransaction = common.generateInitialization(handleInitialized, ptToken.token.challengeOptions, env)

    const confirm = () => {
        if (common.getTransactingElement()) {
            window.postMessage({
                    type: 'pt:capture',
                    capture: true
                },
                window.location.origin,
            )
        }
    }

    const cancel = async() => {
        common.removeIdentity()
        common.removeToken()
        common.removeInitialize()
        document.getElementById(common.getTransactingElement()).instrument = 'cancel'
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
        cb(message.data)
        if (message.status === 'FAILURE') {
            document.getElementById(common.getTransactingElement()).cash = false
        }
    }, env)

    const host = common.transactionEndpoint(env)
    const sdk = {
        host,
        apiKey,
        fee_mode
    }
    return common.generateReturn({
            mount,
            initTransaction,
            confirm,
            cancel,
            readyObserver,
            validObserver,
            cashObserver,
            sdk
        },
        tags)
}
