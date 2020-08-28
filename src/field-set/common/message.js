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

export const errorTypeMessage = message => message.type === 'error'

export const tokenizedTypeMessage = message => message.type === 'tokenized'

export const readyTypeMessage = message => message.type.endsWith('-ready')

export const combinedCCReadyTypeMessage = message => message.type === 'credit-card-ready'

export const combinedCCTypeMessage = message => message.type === 'credit-card-valid'
