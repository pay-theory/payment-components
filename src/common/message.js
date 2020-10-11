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

export const handleMessage = (validTarget, handleMessage) => {
    window.addEventListener('message', generateWindowListener(validTarget, handleMessage))
}

export const errorTypeMessage = message => message.type === 'pt:error'

export const tokenizeTypeMessage = message => message.type === 'pt:tokenize'

export const captureTypeMessage = message => message.type === 'pt:capture'

export const transactedTypeMessage = message => message.type === 'pt:transact'

export const readyTypeMessage = message => message.type.endsWith(':ready')

export const combinedCCReadyTypeMessage = message => message.type === 'pt:credit-card:ready'

export const combinedCCTypeMessage = message => message.type === 'pt:credit-card:valid'

export const handleError = error => {
    window.postMessage({
            type: 'pt:error',
            throws: true,
            error,
        },
        window.location.origin,
    );
}
