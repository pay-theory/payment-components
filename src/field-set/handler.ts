import common from '../common'
import {ElementTypes, transactingWebComponentIds} from "../common/data";
import payTheoryHostedFieldTransactional, {
    IncomingFieldState
} from "../components/pay-theory-hosted-field-transactional";

type relayMessage = {
    type: string,
    value: string | object,
    element: ElementTypes| "card-autofill" | "address-autofill"
}

//relays state to the hosted fields to tokenize the instrument
const verifyRelay = (fields: string[], message: relayMessage) => {
    fields.forEach((field) => {
        if (document.getElementsByName(field)[0]) {
            common.postMessageToHostedField(field, message)
        }
    });
};

const autofillHandler = (message: relayMessage) => {
    if (message.element === "card-autofill") {
        const cardFields = [
            "card-name-iframe",
            "card-cvv-iframe",
            "card-exp-iframe"
        ];
        verifyRelay(cardFields, message);
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
}

//Relay messages from hosted fields to the transacting element for autofill and transacting
export const relayHandler = (message: relayMessage) => {
    if (message.element === "card-autofill" || message.element === "address-autofill") {
        autofillHandler(message)
    } else {
        const fieldType = common.isFieldType(message.element)
        if (fieldType) common.postMessageToHostedField(common.hostedFieldMap[fieldType], message)
    }
};

//Handles state messages and sets state on the web components
export const stateUpdater = (message: {
    element: ElementTypes,
    state: IncomingFieldState
    type: string
}) => {
    transactingWebComponentIds.forEach((id) => {
      let element = document.getElementById(id) as payTheoryHostedFieldTransactional
        if (element) {
            let state = message.state
            element.state = {
                ...state,
                element: message.element,
            }
        }
    })
}


export const hostedErrorHandler = (message: {
    type: string,
    error: string
    field: ElementTypes
}) => {
    transactingWebComponentIds.forEach((id) => {
        let element = document.getElementById(id) as payTheoryHostedFieldTransactional
        if (element && element.initialized) {
            element.initialized = false
            element.resetToken()
        }
    })
    common.handleError(message.error)
}
