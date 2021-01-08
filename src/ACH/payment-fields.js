import common from '../common'

export default async(
    apiKey,
    legacy, // this used to be client id, left in place to preserve backwards compatibility
    styles = common.defaultStyles,
    tags = common.defaultTags,
    fee_mode = common.defaultFeeMode,
    host = common.transactionEndpoint
) => {
    const validTypes = {
        'account-number': false,
        'bank-code': false,
        'account-name': false,
        'account-type': false
    }

    const isCallingType = type => Object.keys(validTypes).includes(type)

    const hasValidAccount = types =>
        (types['account-number'] && types['account-type'] && types['account-name'] && types['bank-code'])

    const findAchError = (processedElements) => {
        let error = false
        if (processedElements.reduce(common.findAccountName, false) === false) {
            error = 'missing ACH account name field required for payments'
        }

        if (processedElements.reduce(common.findAccountNumber, false) === false) {
            error = 'missing ACH account number field required for payments'
        }

        if (processedElements.reduce(common.findAccountType, false) === false) {
            error = 'missing ACH account type field required for payments'
        }

        if (processedElements.reduce(common.findBankCode, false) === false) {
            error = 'missing ACH bank code field required for payments'
        }
        return error
    }

    let isValid = false

    let processedElements = []

    let transacting = {}

    let isReady = false

    window.addEventListener("beforeunload", () => { common.removeReady() })

    const establishElements = (elements, token) => {
        return common.processAchElements(elements, styles, token)
    }

    const token = await common.getData(`${common.transactionEndpoint}/pt-token`, apiKey)

    const setupHandler = (message) => {
        console.log(apiKey, 'api')
        document.getElementById(`${message.element}-iframe`).contentWindow.postMessage({
                type: "pt:setup",
                style: styles.default ? styles : common.defaultStyles
            },
            common.hostedFieldsEndpoint,
        );
    }

    const relayHandler = message => {
        document.getElementById(`account-number-iframe`).contentWindow.postMessage(message,
            common.hostedFieldsEndpoint,
        );
    }


    common.handleHostedFieldMessage(common.hostedReadyTypeMessage, setupHandler)
    common.handleHostedFieldMessage(common.relayTypeMessage, relayHandler)

    const mount = async(
        elements = {
            'account-number': common.achFields.ACCOUNT_NUMBER,
            'account-name': common.achFields.ACCOUNT_NAME,
            'bank-code': common.achFields.BANK_CODE,
            'account-type': common.achFields.ACCOUNT_TYPE,
        },
    ) => {
        processedElements = establishElements(elements, token['pt-token'])
        transacting = processedElements.reduce(common.findAccountNumber, false)
        common.setTransactingElement(transacting)

        let error = findAchError(processedElements)
        if (error) {
            return common.handleError(error)
        }

        processedElements.forEach(processed => {
            processed.frame.form = true
        })

        const instrumentHandler = message => {
            common.setInstrument(message.instrument)
            transacting.instrument = message.instrument
        }

        const stateUpdater = (message) => {
            let element
            switch (message.element) {
            case 'account-name':
                {
                    element = processedElements.reduce(common.findAccountName, false)
                    break
                }
            case 'account-number':
                {
                    element = processedElements.reduce(common.findAccountNumber, false)
                    break
                }
            case 'account-type':
                {
                    element = processedElements.reduce(common.findAccountType, false)
                    break
                }
            case 'bank-code':
                {
                    element = processedElements.reduce(common.findBankCode, false)
                    break
                }
            }
            element.state = message.state
        }

        common.handleHostedFieldMessage(common.stateTypeMessage, stateUpdater)
        common.handleHostedFieldMessage(common.instrumentTypeMessage, instrumentHandler)


        window.postMessage({
                type: `pay-theory:ready`,
                ready: true,
            },
            window.location.origin,
        )
    }

    const handleInitialized = (amount, buyerOptions, confirmation) => {

        const action = confirmation ? 'tokenize' : 'transact'
        common.setBuyer(buyerOptions)

        const framed = transacting.frame ? transacting.frame : transacting

        framed.amount = amount
        framed.action = action
    }

    const initTransaction = common.generateHostedFieldInitialization(handleInitialized)

    const confirm = () => {

        if (transacting.frame) {
            transacting.frame.capture = true
        }
        else {
            transacting.capture = true
        }
    }

    const cancel = () => {
        common.removeIdentity()
        common.removeToken()
        transacting.instrument = 'cancel'
    }

    const readyObserver = cb => common.handleMessage(
        common.readyTypeMessage,
        message => {
            if (message.type === 'pay-theory:ready' & !isReady && common.getReady() === null) {
                common.setReady(true)
                isReady = message.ready
                cb(message.ready)
            }
        })

    const validObserver = cb => common.handleMessage(
        message => {
            if (typeof message.type === 'string') {
                const validType = message.type.split(':')[1]
                return message.type.endsWith(':valid') && processedElements.map(element => element.type).includes(`${validType}`)
            }
            return false
        },
        message => {
            const type = message.type.split(':')[1]

            let validating = false



            if (typeof validTypes[type] !== 'undefined') {

                validTypes[type] = message.valid

                const validatingAccount = hasValidAccount(validTypes)

                validating = (validatingAccount)

                if (isCallingType(type) && isValid !== validating) {
                    isValid = validating
                    cb(isValid)
                }
            }
        })
    return common.generateHostedFieldsReturn(mount, initTransaction, confirm, cancel, readyObserver, validObserver, { host, apiKey, fee_mode }, tags)
}
