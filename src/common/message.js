import {hostedCheckoutEndpoint, hostedFieldsEndpoint} from './network'

const windowListenerHandler = (validTarget, handleMessage, event) => {
    const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    if (validTarget(message)) {
        handleMessage(message)
    }
}

const generateWindowListener = (validTarget, handleMessage) => {
    return event => {
        if ([window.location.origin].includes(event.origin)) {
            windowListenerHandler(validTarget, handleMessage, event)
        }
    }
}

const generateiFrameWindowListener = (validTarget, handleMessage) => {
    return event => {
        if (event.origin === hostedFieldsEndpoint()) {
            windowListenerHandler(validTarget, handleMessage, event)
        }
    }
}

const generateCheckoutWindowListener = (validTarget, handleMessage) => {
    return event => {
        if (event.origin === hostedCheckoutEndpoint()) {
            windowListenerHandler(validTarget, handleMessage, event)
        }
    }
}

export const handleMessage = (validTarget, handleMessage) => {
    const func = generateWindowListener(validTarget, handleMessage)
    window.addEventListener('message', func)
    return () => { window.removeEventListener('message', func) }
}

export const handleHostedFieldMessage = (validTarget, handleMessage) => {
    const func = generateiFrameWindowListener(validTarget, handleMessage)
    window.addEventListener('message', func)
    return () => { window.removeEventListener('message', func) }
}

export const handleCheckoutMessage = (validTarget, handleMessage) => {
    const func = generateCheckoutWindowListener(validTarget, handleMessage)
    window.addEventListener('message', func)
    return () => { window.removeEventListener('message', func) }
}

export const errorTypeMessage = message => typeof message.type === 'string' && message.type === 'pt:error'

export const readyTypeMessage = message => typeof message.type === 'string' && message.type.endsWith(':ready')

export const hostedReadyTypeMessage = message => typeof message.type === 'string' && message.type.endsWith(':ready') && message.type.startsWith('pt-static:')

export const stateTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:state'

export const relayTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:relay'

//passes idempotency from hosted fields to SDK
export const confirmTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:confirm'

//passes transfer-complete from hosted fields to SDK
export const completeTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:complete'

//passes confirmation-complete from hosted fields to SDK
export const confirmationCompleteTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:confirmation-complete'

//passes socket error from the hosted fields to SDK
export const socketErrorTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:error'

//passes session info to sibling fields
export const siblingTypeMessage = message => typeof message.type === 'string' && message.type === `pt-static:siblings`

//Message sent from hosted-fields with data when a cash barcode is sent back
export const cashCompleteTypeMessage = message => typeof message.type === 'string' && message.type === `pt-static:cash-complete`

//Message sent from hosted-fields with data when a card present device is activated or response is received from processor
export const cardPresentTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:card-present'

// Message sent from hosted-fields when a hosted button is clicked
export const buttonClickTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:button-click'

// Message sent from hosted-fields when a hosted button is clicked
export const buttonReadyTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:button-ready'

// Message sent from checkout page when payment is cancelled
export const checkoutCancelTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-checkout:cancel'

// Message sent from the checkout page when there is an error
export const checkoutErrorTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-checkout:error'

// Message sent from the checkout page when the payment is complete
export const checkoutCompleteTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-checkout:complete'

// Message sent from the checkout page when the barcode is received
export const checkoutBarcodeReceivedTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-checkout:barcode-received'

// Message sent from the checkout page when the barcode interaction is complete
export const checkoutBarcodeCompleteTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-checkout:barcode-complete'

// Message from the overlay when the user clicks the close button
export const overlayCancelTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-overlay:cancel'

// Message from the overlay when the user clicks the relaunch button
export const overlayRelaunchTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-overlay:relaunch'

// Message from the qr code when it is ready
export const qrCodeReadyTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:qr-ready'

// Message from the qr code when it is completes a successful transaction
export const qrCodeCompleteTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:qr-checkout-success'


export const postMessageToHostedField = (id, message) => {
    return document.getElementsByName(id) ? 
        document.getElementsByName(id)[0]
            .contentWindow.postMessage(message, hostedFieldsEndpoint()) :
        console.log('field is no longer available')
}

export const handleError = error => {
    
    window.postMessage({
            type: 'pt:error',
            throws: true,
            error,
        },
        window.location.origin,
    );
}
