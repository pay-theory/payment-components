import common from '../common'

//relays state to the hosted fields to tokenize the instrument
const verifyRelay = (fields, message, env) => {
    fields.forEach((field) => {
        if (document.getElementsByName(field)[0]) {
            common.postMessageToHostedField(field, env, message)
        }
    });
};

const autofillHandler = (message, env) => {
    if (message.element === "card-autofill") {
        const cardFields = [
                    "card-name-iframe",
                    "card-cvv-iframe",
                    "card-exp-iframe"
                ];
        verifyRelay(cardFields, message, env);
    }
    else if (message.element === "address-autofill") {
        const addressFields = [
                "billing-line2-iframe",
                "billing-city-iframe",
                "billing-state-iframe",
                "billing-zip-iframe"
            ];
        verifyRelay(addressFields, message, env);
    }
}

//Relays messages from hosted fields to the transacting element for autofill and transacting
export const relayHandler = env => message => {
    if (message.element.endsWith("autofill")) {
        autofillHandler(message, env)
    }
    else {
        const fieldType = common.isFieldType(message.element)
        common.postMessageToHostedField(common.hostedFieldMap[fieldType], env, message)
    }
};


//sends styles to hosted fields when they are set up
export const setupHandler = (env, styles, setupTransacting) => (message) => {
    common.postMessageToHostedField(`${message.element}-iframe`, env, {
        type: "pt:setup",
        style: styles.default ? styles : common.defaultStyles
    })

    if (setupTransacting[message.element]) {
        common.postMessageToHostedField(`${message.element}-iframe`, env, {
            type: `pt-static:elements`,
            elements: JSON.parse(JSON.stringify(setupTransacting[message.element]))
        })
    }
}

const sendConnectedMessage = (message, field, env) => {
    common.postMessageToHostedField(`${field}-iframe`, env, {
        type: `pt-static:connected`,
        hostToken: message.hostToken,
        sessionKey: message.sessionKey
    })
}

//Sends a message to the sibling fields letting them know that the transactional field has fetched the the host-token
export const siblingHandler = (env, elements) => message => {
    if (message.field === 'card-number') {
        elements.card.forEach(field => {
            if (field.type !== 'credit-card') {
                sendConnectedMessage(message, field.type, env)
            }
            else {
                sendConnectedMessage(message, 'card-cvv', env)
                sendConnectedMessage(message, 'card-exp', env)
            }

        })
    }
    else if (message.field === 'account-number') {
        elements.ach.forEach(field => {
            sendConnectedMessage(message, field.type)
        })
    }
    else if (message.field === 'cash-name') {
        elements.cash.forEach(field => {
            sendConnectedMessage(message, field.type)
        })
    }
}


const combinedCardStateUpdater = (element, elementArray) => {
    let result = elementArray.reduce(common.findTransactingElement, false)
    if (result.field === 'credit-card') {
        return result
    }
    else {
        return elementArray.reduce(common.findField(element), false)
    }
}

//Handles state messages and sets state on the web components 
export const stateUpdater = elements => (message) => {
    let element = {}
    if (common.combinedCardTypes.includes(message.element)) {
        element = combinedCardStateUpdater(message.element, elements.card)
    }
    else {
        let ach = elements.ach.reduce(common.findField(message.element), false)
        let card = elements.card.reduce(common.findField(message.element), false)
        let cash = elements.cash.reduce(common.findField(message.element), false)
        element = ach ? ach : card ? card : cash
    }

    let state = message.state
    state.element = message.element
    element.state = state
}


export const instrumentHandler = transacting => message => {
    common.setInstrument(message.instrument)
    const type = common.isFieldType(message.field)
    transacting[type].instrument = message.instrument
}


export const hostedErrorHandler = resetHostToken => message => {
    common.removeInitialize()
    common.handleError(message.error)
    resetHostToken()
}

export const idempotencyHandler = message => {
    common.setIdempotency(message.payment)
    document.getElementById(common.getTransactingElement()).idempotent = message.payment
}

export const transferCompleteHandler = message => {
    document.getElementById(common.getTransactingElement()).transfer = message.transfer
}
