import {hostedCheckoutEndpoint, hostedFieldsEndpoint} from './network'

interface PayTheoryEvent extends MessageEvent {
    payTheory: boolean
}
type validTargetFunc = (message: { type: any }) => boolean
type handleMessageFunc = (message: any) => void

const windowListenerHandler = (validTarget: validTargetFunc, handleMessage: handleMessageFunc, event: PayTheoryEvent) => {
    // If payTheory is not set to true on the event then ignore as it is not from one of our listeners
    if (!event.payTheory) return

    let message = event.data
    if (typeof message !== "object") {
        try {
            // Parse the message as JSON.
            // All PT messages have either an object or a stringified object as the data
            message = JSON.parse(message)
        } catch (e) {
            // Do nothing
            return
        }
    }
    if (validTarget(message)) {
        handleMessage(message)
    }
}

const generateWindowListener = (validTarget: validTargetFunc, handleMessage: handleMessageFunc) => {
    return (event: MessageEvent) => {
        if ([window.location.origin].includes(event.origin)) {
            let newEvent: PayTheoryEvent = {
                ...event,
                payTheory: true
            }
            windowListenerHandler(validTarget, handleMessage, newEvent)
        }
    }
}

const generateiFrameWindowListener = (validTarget: validTargetFunc, handleMessage: handleMessageFunc) => {
    return (event: MessageEvent) => {
        if (event.origin === hostedFieldsEndpoint) {
            let newEvent: PayTheoryEvent = {
                ...event,
                payTheory: true
            }
            windowListenerHandler(validTarget, handleMessage, newEvent)
        }
    }
}

const generateCheckoutWindowListener = (validTarget: validTargetFunc, handleMessage: handleMessageFunc) => {
    return (event: MessageEvent) => {
        if (event.origin === hostedCheckoutEndpoint) {
            let newEvent: PayTheoryEvent = {
                ...event,
                payTheory: true
            }
            windowListenerHandler(validTarget, handleMessage, newEvent)
        }
    }
}

export const handleMessage = (validTarget: validTargetFunc, handleMessage: handleMessageFunc) => {
    const func = generateWindowListener(validTarget, handleMessage)
    window.addEventListener('message', func)
    return () => { window.removeEventListener('message', func) }
}

export const handleHostedFieldMessage = (validTarget: validTargetFunc, handleMessage: handleMessageFunc) => {
    const func = generateiFrameWindowListener(validTarget, handleMessage)
    window.addEventListener('message', func)
    return () => { window.removeEventListener('message', func) }
}

export const handleCheckoutMessage = (validTarget: validTargetFunc, handleMessage: handleMessageFunc) => {
    const func = generateCheckoutWindowListener(validTarget, handleMessage)
    window.addEventListener('message', func)
    return () => { window.removeEventListener('message', func) }
}

export const errorTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt:error'

export const readyTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type.endsWith(':ready')

export const hostedReadyTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type.endsWith(':ready') && message.type.startsWith('pt-static:')

export const stateTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:state'

export const relayTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:relay'

//passes idempotency from hosted fields to SDK
export const confirmTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:confirm'

//passes transfer-complete from hosted fields to SDK
export const completeTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:complete'

//passes confirmation-complete from hosted fields to SDK
export const confirmationCompleteTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:confirmation-complete'

//passes socket error from the hosted fields to SDK
export const socketErrorTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:error'

//passes session info to sibling fields
export const siblingTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === `pt-static:siblings`

//Message sent from hosted-fields with data when a cash barcode is sent back
export const cashCompleteTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === `pt-static:cash-complete`

//Message sent from hosted-fields with data when a card present device is activated or response is received from processor
export const cardPresentTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:card-present'

// Message sent from hosted-fields when a hosted button is clicked
export const buttonClickTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:button-click'

// Message sent from hosted-fields when a hosted button is clicked
export const buttonReadyTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:button-ready'

// Message sent from checkout page when payment is cancelled
export const checkoutCancelTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-checkout:cancel'

// Message sent from the checkout page when there is an error
export const checkoutErrorTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-checkout:error'

// Message sent from the checkout page when the payment is complete
export const checkoutCompleteTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-checkout:complete'

// Message sent from the checkout page when the barcode is received
export const checkoutBarcodeReceivedTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-checkout:barcode-received'

// Message sent from the checkout page when the barcode interaction is complete
export const checkoutBarcodeCompleteTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-checkout:barcode-complete'

// Message from the overlay when the user clicks the close button
export const overlayCancelTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-overlay:cancel'

// Message from the overlay when the user clicks the relaunch button
export const overlayRelaunchTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-overlay:relaunch'

// Message from the qr code when it is ready
export const qrCodeReadyTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:qr-ready'

// Message from the qr code when it is completes a successful transaction
export const qrCodeCompleteTypeMessage = (message: { type: any }) => typeof message.type === 'string' && message.type === 'pt-static:qr-checkout-success'


export const postMessageToHostedField = (id: string, message: object, port?: ) => {
    const elements = document.getElementsByName(id)
    if (elements.length) {
        let element = elements[0] as HTMLIFrameElement
        return element?.contentWindow?.postMessage(message, hostedFieldsEndpoint)
    }
    return console.log('Hosted Field not found')
}

export const handleError = (error: string) => {
    window.postMessage({
            type: 'pt:error',
            throws: true,
            error,
        },
        window.location.origin,
    );
}
