import { hostedFieldsEndpoint } from './network'
const generateWindowListener = (validTarget, handleMessage) => {
    return event => {
        if ([window.location.origin].includes(event.origin)) {
            const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
            if (validTarget(message)) {
                handleMessage(message)
            }
        }
    }
}

const generateiFrameWindowListener = (validTarget, handleMessage) => {
    return event => {
        if (event.origin === hostedFieldsEndpoint) {
            const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
            if (validTarget(message)) {
                handleMessage(message)
            }
        }
    }
}

export const handleMessage = (validTarget, handleMessage) => {
    window.addEventListener('message', generateWindowListener(validTarget, handleMessage))
}

export const handleHostedFieldMessage = (validTarget, handleMessage) => {
    window.addEventListener('message', generateiFrameWindowListener(validTarget, handleMessage))
}

export const errorTypeMessage = message => typeof message.type === 'string' && message.type === 'pt:error'

export const tokenizeTypeMessage = message => typeof message.type === 'string' && message.type === 'pt:tokenize'

export const captureTypeMessage = message => typeof message.type === 'string' && message.type === 'pt:capture'

export const transactedTypeMessage = message => typeof message.type === 'string' && message.type === 'pt:transact'

export const readyTypeMessage = message => typeof message.type === 'string' && message.type.endsWith(':ready')

export const combinedCCReadyTypeMessage = message => typeof message.type === 'string' && message.type === 'pt:credit-card:ready'

export const combinedCCTypeMessage = message => typeof message.type === 'string' && message.type === 'pt:credit-card:valid'

export const hostedReadyTypeMessage = message => typeof message.type === 'string' && message.type.endsWith(':ready') && message.type.startsWith('pt-static:')

export const stateTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:state'

export const relayTypeMessage = message => typeof message.type === 'string' && message.type === 'pt-static:relay'

export const handleError = error => {
    window.postMessage({
            type: 'pt:error',
            throws: true,
            error,
        },
        window.location.origin,
    );
}
