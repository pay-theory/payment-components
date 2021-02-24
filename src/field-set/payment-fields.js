import common from '../common'

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

    if (typeof apiKey !== 'string') {
        console.error('Api key should be a string beginning with pt-')
    }
    else if (!apiKey.startsWith('pt-')) {
        console.error('Api key should be a string beginning with pt-')
    }

    if (typeof fee_mode !== 'string') {
        console.error(`Fee Mode should be either 'surcharge' or 'service_fee' which are also available as constants at window.paytheory.SURCHARGE and window.paytheory.SERVICE_FEE`)
    }

    if (typeof tags !== 'object') {
        console.error(`Tags should be a JSON Object`)
    }

    if (typeof styles !== 'object') {
        console.error(`Styles should be a JSON Object. An example of the object is at https://github.com/pay-theory/payment-components`)
    }

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
        'account-type': false
    }

    const isCallingType = type => Object.keys(validTypes).includes(type)

    //Lets the alid observer check that all fields are set to valid before sending a message
    const hasValidCard = types =>
        (types['card-number'] && types['card-cvv'] && types['card-exp'])

    const hasValidStreetAddress = types =>
        (types['billing-line1'] && types['billing-line2'])

    const hasValidAddress = types =>
        (hasValidStreetAddress(types) && types['billing-city'] && types['billing-state'] && types['billing-zip'])

    const hasValidDetails = types =>
        (types['card-name'] && hasValidAddress(types))

    const hasValidAccount = types =>
        (types['account-number'] && types['account-type'] && types['account-name'] && types['routing-number'])


    //Checkes the dom for elements and returns errors if there are missing elements or conflicting elements
    const findCardNumberError = processedElements => {
        let error = false
        if (processedElements.reduce(common.findExp, false) === false) {
            error = 'missing credit card expiration field required for payments'
        }

        if (processedElements.reduce(common.findCVV, false) === false) {
            error = 'missing credit card CVV field required for payments'
        }

        if (document.getElementById(`pay-theory-credit-card`)) {
            error = 'credit card element is not allowed when using credit card number'
        }
        return error
    }

    const findCombinedCardError = processedElements => {
        let error = false
        if (processedElements.reduce(common.findExp, false)) {
            error = 'expiration is not allowed when using combined credit card'
        }

        if (processedElements.reduce(common.findCVV, false)) {
            error = 'cvv is not allowed when using combined credit card'
        }

        if (document.getElementById(`pay-theory-credit-card-number`)) {
            error = 'credit card number is not allowed when using combined credit card'
        }
        return error
    }

    const findAchError = (processedElements) => {
        let error = false
        if (processedElements.length === 0) {
            return error
        }

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
            error = 'missing ACH routing number field required for payments'
        }

        return error
    }

    const findCardError = (transacting, processedElements) => {
        let error = false
        if (processedElements.length === 0) {
            return error
        }

        if (transacting === false) {
            error = 'missing credit card entry field required for payments'
        }
        else if (transacting.id === 'pay-theory-credit-card-number-tag-frame') {
            error = findCardNumberError(processedElements)
        }
        else {
            error = findCombinedCardError(processedElements)
        }
        return error
    }


    let isValid = false

    let processedCardElements = []
    let processedACHElements = []

    let transacting = {}

    let achReady = {}
    let cardReady = {}

    let isReady = false

    let achInitialized = false
    let ccInitialized = false

    let cardToken = await common.getData(`${common.transactionEndpoint(env)}/pt-token`, apiKey)
    let achToken = await common.getData(`${common.transactionEndpoint(env)}/pt-token`, apiKey)

    const resetHostToken = async() => {
        if (common.getTransactingElement() === 'pay-theory-ach-account-number-tag-frame') {
            let token = await common.getData(`${common.transactionEndpoint(env)}/pt-token`, apiKey)
            document.getElementsByName(`account-number-iframe`)[0]
                .contentWindow.postMessage({
                        type: `pt-static:cancel`,
                        token: token['pt-token']
                    },
                    common.hostedFieldsEndpoint(env)
                );

        }
        else if (common.getTransactingElement()) {
            let token = await common.getData(`${common.transactionEndpoint(env)}/pt-token`, apiKey)
            document.getElementsByName(`card-number-iframe`)[0]
                .contentWindow.postMessage({
                        type: `pt-static:cancel`,
                        token: token['pt-token']
                    },
                    common.hostedFieldsEndpoint(env)
                );
        }
    }

    window.addEventListener("beforeunload", () => { common.removeReady() })

    const establishElements = (elements, env) => {
        return common.processElements(elements, styles, env)
    }

    //Sets the ready objects based on the processed fields 
    const setReady = (array, type) => {
        array.forEach(f => {
            if (f.type === 'credit-card') {
                cardReady['card-number'] = false
                cardReady['card-exp'] = false
                cardReady['card-cvv'] = false
            }
            else {
                let field = common.stateMap[f.type] ? common.stateMap[f.type] : f.type
                if (type === 'card') cardReady[field] = false
                if (type === 'ach') achReady[field] = false
            }
        })
    }

    //Updates the fields to show when all have received ready messages
    const updateReady = type => {
        if (typeof achReady[type] !== 'undefined') achReady[type] = true
        if (typeof cardReady[type] !== 'undefined') cardReady[type] = true
    }

    //Verifies that all fields are mounted on the dom
    const verifyReady = obj => {
        return Object.keys(obj).reduce((acc, val) => {
            return acc ?
                (obj[val] === false) ?
                false :
                true :
                acc
        }, true)
    }

    //relays state to the hosted fields to tokenize the instrument
    const verifyRelay = (fields, message) => {
        fields.forEach((field) => {
            if (document.getElementsByName(field)[0]) {
                document
                    .getElementsByName(field)[0]
                    .contentWindow.postMessage(
                        message,
                        common.hostedFieldsEndpoint(env)
                    );
            }
        });
    };

    const mount = async(
        elements = {
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
        },
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
            'number': elements.number,
            'exp': elements.exp,
            'cvv': elements.cvv,
            'name': elements['account-name'],
            'address-1': elements['address-1'],
            'address-2': elements['address-2'],
            city: elements.city,
            state: elements.state,
            zip: elements.zip,
        }

        processedCardElements = establishElements(cardElements, env)
        processedACHElements = common.processAchElements(achElements, styles, env)

        setReady(processedACHElements, 'ach')
        setReady(processedCardElements, 'card')

        transacting.card = processedCardElements.reduce(common.findTransactingElement, false)
        transacting.ach = processedACHElements.reduce(common.findAccountNumber, false)

        //Relays messages from hosted fields to the transacting element for autofill and transacting
        const relayHandler = (message) => {
            if (message.element.startsWith("card") || message.element.startsWith('billing')) {
                if (message.element === "card-autofill") {
                    const cardFields = [
                    "card-name-iframe",
                    "card-cvv-iframe",
                    "card-exp-iframe"
                ];
                    verifyRelay(cardFields, message);
                }
                else {
                    document
                        .getElementsByName(`card-number-iframe`)[0]
                        .contentWindow.postMessage(
                            message,
                            common.hostedFieldsEndpoint(env)
                        );
                }
            }
            else if (message.element === "address-autofill") {
                const addressFields = [
                "billing-line2-iframe",
                "billing-city-iframe",
                "billing-state-iframe",
                "billing-zip-iframe"
            ];
                verifyRelay(addressFields, message);
            }
            else {
                document
                    .getElementsByName(`account-number-iframe`)[0]
                    .contentWindow.postMessage(
                        message,
                        common.hostedFieldsEndpoint(env)
                    );
            }
        };

        const removeRelay = common.handleHostedFieldMessage(common.relayTypeMessage, relayHandler, env)

        //sends styles to hosted fields when they are set up
        const setupHandler = (message) => {
            document.getElementsByName(`${message.element}-iframe`)[0].contentWindow.postMessage({
                    type: "pt:setup",
                    style: styles.default ? styles : common.defaultStyles
                },
                common.hostedFieldsEndpoint(env),
            );
            if (message.element === 'account-number') {
                document.getElementsByName(`account-number-iframe`)[0]
                    .contentWindow.postMessage({
                            type: `pt-static:elements`,
                            elements: JSON.parse(JSON.stringify(processedACHElements))
                        },
                        common.hostedFieldsEndpoint(env)
                    );
            }
            else if (message.element === 'card-number') {
                document.getElementsByName(`card-number-iframe`)[0]
                    .contentWindow.postMessage({
                            type: `pt-static:elements`,
                            elements: JSON.parse(JSON.stringify(processedCardElements))
                        },
                        common.hostedFieldsEndpoint(env)
                    );
            }
        }

        const removeSetup = common.handleHostedFieldMessage(common.hostedReadyTypeMessage, setupHandler, env)

        // //Sends a message to the transacting element letting it know that all other fields have connected to the websocket so that it can fetch the host token
        // const connectionHandler = message => {
        //     updateReady(message.element)
        //     if (verifyReady(achReady) && processedACHElements.length > 0) {
        //         document.getElementsByName(`account-number-iframe`)[0]
        //             .contentWindow.postMessage({
        //                     type: `pt-static:connected`,
        //                 },
        //                 common.hostedFieldsEndpoint(env)
        //             );
        //     }
        //     if (verifyReady(cardReady) && processedCardElements.length > 0) {
        //         document.getElementsByName(`card-number-iframe`)[0]
        //             .contentWindow.postMessage({
        //                     type: `pt-static:connected`,
        //                 },
        //                 common.hostedFieldsEndpoint(env)
        //             );
        //     }
        // }

        // const removeConnection = common.handleHostedFieldMessage(common.connectionTypeMessage, connectionHandler, env)

        //Handles state messages and sets state on the web components 
        const stateUpdater = (message) => {
            let element
            switch (message.element) {
            case 'account-name':
                {
                    element = processedACHElements.reduce(common.findAccountName, false)
                    break
                }
            case 'account-number':
                {
                    element = processedACHElements.reduce(common.findAccountNumber, false)
                    break
                }
            case 'account-type':
                {
                    element = processedACHElements.reduce(common.findAccountType, false)
                    break
                }
            case 'routing-number':
                {
                    element = processedACHElements.reduce(common.findBankCode, false)
                    break
                }
            case 'card-number':
                {
                    element = processedCardElements.reduce(common.findTransactingElement, false)
                    break
                }
            case 'card-cvv':
                {
                    let result = processedCardElements.reduce(common.findTransactingElement, false)
                    if (result.field === 'credit-card') {
                        element = result
                    }
                    else {
                        element = processedCardElements.reduce(common.findCVV, false)
                    }
                    break
                }
            case 'card-exp':
                {
                    let result = processedCardElements.reduce(common.findTransactingElement, false)
                    if (result.field === 'credit-card') {
                        element = result
                    }
                    else {
                        element = processedCardElements.reduce(common.findExp, false)
                    }
                    break
                }
            case 'card-name':
                {
                    element = processedCardElements.reduce(common.findCardName, false)
                    break
                }
            case 'billing-line1':
                {
                    element = processedCardElements.reduce(common.findLine1, false)
                    break
                }
            case 'billing-line2':
                {
                    element = processedCardElements.reduce(common.findLine2, false)
                    break
                }
            case 'billing-city':
                {
                    element = processedCardElements.reduce(common.findCity, false)
                    break
                }
            case 'billing-state':
                {
                    element = processedCardElements.reduce(common.findState, false)
                    break
                }
            case 'billing-zip':
                {
                    element = processedCardElements.reduce(common.findZip, false)
                    break
                }
            }

            let state = message.state
            state.element = message.element
            element.state = state

        }

        const removeState = common.handleHostedFieldMessage(common.stateTypeMessage, stateUpdater, env)

        //Recieves a pt-instrument and assigns it to the proper transacting element
        const instrumentHandler = message => {
            common.setInstrument(message.instrument)
            if (message.field === 'card-number') {
                transacting.card.instrument = message.instrument
            }
            else {
                transacting.ach.instrument = message.instrument
            }
        }

        const removeInstrument = common.handleHostedFieldMessage(common.instrumentTypeMessage, instrumentHandler, env)

        const hostedErrorHandler = message => {
            common.removeInitialize()
            common.handleError(message.error)
            resetHostToken()
        }

        const removeHostedError = common.handleHostedFieldMessage(common.socketErrorTypeMessage, hostedErrorHandler, env)

        //Recieves an idempotency and assigns it to the transacting element
        const idempotencyHandler = message => {
            common.setIdempotency(message.payment)
            document.getElementById(common.getTransactingElement()).idempotent = message.payment
        }

        const removeIdempotency = common.handleHostedFieldMessage(common.idempotencyTypeMessage, idempotencyHandler, env)

        //Recieves a transfer and assigns it to the transacting element
        const transferCompleteHandler = message => {
            document.getElementById(common.getTransactingElement()).transfer = message.transfer
        }

        const removeTransferComplete = common.handleHostedFieldMessage(common.transferCompleteTypeMessage, transferCompleteHandler, env)

        if (processedACHElements.length === 0 && processedCardElements.length === 0) {
            return common.handleError('There are no PayTheory fields')
        }

        //Initializes Card elements if they are found on the dom
        if (processedCardElements.length > 0) {
            ccInitialized = true

            let error = findCardError(transacting.card, processedCardElements)
            if (error) {
                return common.handleError(error)
            }

            processedCardElements.forEach(processed => {
                const json = JSON.stringify({ token: cardToken['pt-token'], origin: cardToken.origin })
                processed.frame.token = encodeURI(json)
            })

            if (achInitialized || processedACHElements.length === 0) {
                window.postMessage({
                        type: `pay-theory:ready`,
                        ready: true
                    },
                    window.location.origin,
                )
            }

        }

        //Initializes ACH elements if they are found on the dom
        if (processedACHElements.length > 0) {
            achInitialized = true
            let error = findAchError(processedACHElements)
            if (error) {
                return common.handleError(error)
            }

            processedACHElements.forEach(processed => {
                const json = JSON.stringify({ token: achToken['pt-token'], origin: achToken.origin })
                processed.frame.token = encodeURI(json)
            })
            if (ccInitialized || processedCardElements.length === 0) {
                window.postMessage({
                        type: `pay-theory:ready`,
                        ready: true
                    },
                    window.location.origin,
                )
            }
        }

        //returns a funciton that removes any event handlers that were put on the window during the mount function
        return () => {
            removeRelay()
            removeSetup()
            // removeConnection()
            removeState()
            removeInstrument()
            removeIdempotency()
            removeTransferComplete()
            removeHostedError()
        }
    }

    const handleInitialized = (amount, buyerOptions, confirmation) => {

        const action = confirmation ? 'tokenize' : 'transact'
        common.setBuyer(buyerOptions)



        if (common.isHidden(transacting.card) === false && (isValid === 'card' || isValid === 'both')) {
            const framed = transacting.card.frame ? transacting.card.frame : transacting.card
            common.setTransactingElement(framed)
            framed.amount = amount
            framed.action = action
            framed.resetToken = resetHostToken
        }

        if (common.isHidden(transacting.ach) === false && (isValid === 'ach' || isValid === 'both')) {
            const framed = transacting.ach.frame ? transacting.ach.frame : transacting.ach
            common.setTransactingElement(framed)
            framed.amount = amount
            framed.action = action
            framed.resetToken = resetHostToken
        }
    }

    const initTransaction = common.generateInitialization(handleInitialized, cardToken ? cardToken.challengeOptions : achToken.challengeOptions, env)

    const confirm = () => {

        let transactor = {}

        if (common.getTransactingElement() === 'pay-theory-ach-account-number-tag-frame') {
            transactor = transacting.ach.frame ? transacting.ach.frame : transacting.ach
        }
        else if (common.getTransactingElement()) {
            transactor = transacting.card.frame ? transacting.card.frame : transacting.card
        }

        transactor.capture = true
    }

    const cancel = async() => {
        if (common.getTransactingElement() === 'pay-theory-ach-account-number-tag-frame') {
            let transactor = transacting.ach.frame ? transacting.ach.frame : transacting.ach
            common.removeIdentity()
            common.removeToken()
            common.removeInitialize()
            transactor.instrument = 'cancel'
        }
        else if (common.getTransactingElement()) {
            let transactor = transacting.card.frame ? transacting.card.frame : transacting.card
            common.removeIdentity()
            common.removeToken()
            common.removeInitialize()
            transactor.instrument = 'cancel'
        }
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
                let card = processedCardElements.reduce(common.findTransactingElement, false)
                let transactingCard = card ? card.field : false
                let creditCardTransacting = transactingCard === 'credit-card' ? ['card-exp', 'card-number', 'card-cvv'].includes(`${validType}`) : false
                return message.type.endsWith(':valid') && (processedCardElements.map(element => common.stateMap[element.type]).includes(`${validType}`) || processedACHElements.map(element => element.type).includes(`${validType}`) || creditCardTransacting)
            }
            return false
        },
        message => {
            const type = message.type.split(':')[1]
            let validating = false



            if (typeof validTypes[type] !== 'undefined') {

                validTypes[type] = message.valid

                const validatingCard = hasValidCard(validTypes)

                const validatingDetails = hasValidDetails(validTypes)

                const validAch = hasValidAccount(validTypes)

                validating = (validatingCard && validatingDetails && validAch) ? 'both' : (validatingCard && validatingDetails) ? 'card' : validAch ? 'ach' : false

                if (isCallingType(type) && isValid !== validating) {
                    isValid = validating
                    cb(isValid)
                }
            }
        })

    const host = common.transactionEndpoint(env)

    return common.generateReturn(
        mount,
        initTransaction,
        confirm,
        cancel,
        readyObserver,
        validObserver, {
            host,
            apiKey,
            fee_mode
        },
        tags)
}
