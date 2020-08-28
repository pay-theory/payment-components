/* global localStorage */
import common from './common'

export default async(
    apiKey,
    clientKey,
    amount,
    styles = common.defaultStyles,
    tags = common.defaultTags,
    host = common.transactionEndpoint
) => {
    let formed = false
    let identity = false
    let framed
    const handleInialized = () => {
        framed.transact = true
    }
    const establishElement = (forming, element) => {
        framed = common.processElement(forming, element, styles)
    }

    const stateHandler = element => state => {
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

            const [stateType, stated, invalidElement] = common.stateMapping(element.type, state)

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

    const mount = async(element = 'pay-theory-credit-card') => {
        const handleState = stateHandler(element)

        const handleFormed = finalForm => {
            console.log('establish element')
            establishElement(finalForm, element)
        }
        if (formed) {
            console.log('already formed establishing elements')
            establishElement(formed, element)
        }
        else {
            console.log('appending finix')
            common.appendFinix(formed, handleState, handleFormed)
        }
    }

    const initTransaction = common.generateInitialization(handleInialized, host, clientKey, apiKey)

    const readyObserver = cb => common.handleMessage(common.combinedCCReadyTypeMessage, message => cb(message.ready))

    const validObserver = cb => common.handleMessage(common.combinedCCTypeMessage, message => cb(message.valid))

    return common.generateReturn(mount, initTransaction, readyObserver, validObserver, { host, clientKey, apiKey, amount })
}
