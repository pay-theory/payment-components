/* global localStorage */
import common from './common'

export default async(
    apiKey,
    clientKey,
    amount,
    styles = {
        default: {},
        success: {},
        error: {},
    },
    tags = {},
    host = common.transactionEndpoint
) => {
    let formed = false
    let identity = false
    let framed
    const handleInialized = () => {
        framed.transact = true
    }
    return {
        mount: async(element = 'pay-theory-credit-card') => {
            if (formed) {
                framed = common.processElement(formed, element, styles)
            }
            else {
                const handleState = state => {
                    const processedElements = [
                        { type: 'zip', frame: framed },
                        { type: 'expiration', frame: framed },
                        { type: 'cvv', frame: framed },
                        { type: 'number', frame: framed }
                    ]

                    let errors = []

                    const validElements = []
                    const undefinedElements = []
                    const errorElements = []
                    let error = false

                    processedElements.forEach(element => {

                        const stateType = stateMap[element.type] ?
                            stateMap[element.type] :
                            element.type

                        const stated = state[stateType]

                        const invalidElement = invalidate(stated)

                        const frameValidationStep = typeof invalidElement === 'undefined' ? invalidElement : !invalidElement

                        if (typeof frameValidationStep === 'undefined') {
                            undefinedElements.push(stateType)
                        }
                        else {
                            switch (frameValidationStep) {
                            case true:
                                {
                                    validElements.push(stateType)
                                    break
                                }
                            default:
                                {
                                    errorElements.push(stateType)
                                    error = stated.errorMessages[0]
                                    break
                                }
                            }
                        }
                    })


                    if (validElements.length === processedElements.length) {
                        framed.valid = true
                        framed.error = false
                    }
                    else if (error) {
                        framed.valid = false
                        framed.error = error
                    }
                    else {
                        framed.error = false
                    }
                }

                const handleFormed = finalForm => {
                    framed = common.processElement(finalForm, element, styles)
                }

                common.appendFinix(formed, handleState, handleFormed)
            }
        },

        initTransaction: common.generateInitialization(handleInialized, host, clientKey, apiKey),

        readyObserver: cb => common.handleMessage(message => message.type === 'credit-card-ready', message => cb(message.ready)),

        transactedObserver: cb => common.handleMessage(
            message => message.type === 'tokenized',
            common.generateTransacted(cb, host, clientKey, apiKey, amount)),

        errorObserver: cb => common.handleMessage(message => message.type === 'error', message => cb(message.error)),

        validObserver: cb => common.handleMessage(message => message.type === 'credit-card-valid', message => cb(message.valid)),
    }
}
