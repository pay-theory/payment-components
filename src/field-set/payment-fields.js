import common from './common'

export default async(
    apiKey,
    clientKey,
    styles = common.defaultStyles,
    tags = common.defaultTags,
    host = common.transactionEndpoint
) => {
    let setReady = false

    let readyCard = false
    let readyName = true
    let readyZip = true

    let validName = true
    let validCard = false
    let validZip = true

    let formed = false

    let isValid = false
    let isReady = false

    let processedElements = []
    let transactingElement

    const handleInialized = (amount) => {
        if (transactingElement.frame) {
            transactingElement.frame.amount = true
            transactingElement.frame.transact = true
        }
        else {
            transactingElement.amount = true
            transactingElement.transact = true
        }
    }

    const establishElements = (forming, elements) => {
        processedElements = common.processElements(forming, elements, styles)
        transactingElement = processedElements.reduce(common.findTransactingElement)
    }

    const stateHandler = elements => state => {
        let errors = []
        elements.forEach(element => {

            const [, stated, invalidElement] = common.stateMapping(element.type, state)

            if (element.frame.field === element.type) {
                element.frame.valid = typeof invalidElement === 'undefined' ? invalidElement : !invalidElement

                if (invalidElement) {
                    errors.push(stated.errorMessages[0])
                    element.frame.error = stated.errorMessages[0]
                }
                else {
                    element.frame.error = false
                }
            }
        })
    }

    const mount = async(
        elements = {
            'account-name': common.fields.CREDIT_CARD_NAME,
            'credit-card': common.fields.CREDIT_CARD,
            zip: common.fields.CREDIT_CARD_ZIP,
        },
    ) => {
        const handleState = stateHandler(processedElements)

        const handleFormed = finalForm => {
            establishElements(finalForm, elements)
        }
        if (formed) {
            establishElements(formed, elements)
        }
        else {
            common.appendFinix(formed, handleState, handleFormed)
        }
    }

    const initTransaction = common.generateInitialization(handleInialized, host, clientKey, apiKey)

    const readyObserver = cb => common.handleMessage(
        common.readyTypeMessage,
        message => {
            let calling = false

            if (!message.type.endsWith('-ready')) { return }

            if (!setReady) {
                processedElements.forEach(element => {
                    switch (element.type) {
                    case 'name':
                        {
                            readyName = false
                            setReady = true
                            break
                        }
                    case 'credit-card':
                        {
                            readyCard = false
                            setReady = true
                            break
                        }
                    case 'zip':
                        {
                            readyZip = false
                            setReady = true
                            break
                        }
                    default:
                        {
                            break
                        }
                    }
                })
            }

            const readyType = message.type.split('-')[0]

            if (!processedElements.map(element => element.type).includes(`${readyType}`)) { return }

            switch (readyType) {
            case 'name':
                {
                    readyName = message.ready
                    calling = true
                    break
                }
            case 'credi-card':
                {
                    readyCard = message.ready
                    calling = true
                    break
                }
            case 'zip':
                {
                    readyZip = message.ready
                    calling = true
                    break
                }
            default:
                {
                    break
                }
            }
            const readying = (readyCard && readyName && readyZip)
            if (isReady !== readying) {
                isReady = readying
                if (calling) {
                    cb(isReady)
                }
            }
        })

    const validObserver = cb => common.handleMessage(
        message => {
            const validType = message.type.split('-')[0]
            return message.type.endsWith('-valid') && processedElements.map(element => element.type).includes(`${validType}`)
        },
        message => {
            const validType = message.type.split('-')[0]
            let calling = false
            console.log('valid', validType, message.valid)
            switch (validType) {
            case 'name':
                {
                    validName = message.valid
                    calling = true
                    break
                }
            case 'credit-card':
                {
                    validCard = message.valid
                    calling = true
                    break
                }
            case 'zip':
                {
                    validZip = message.valid
                    calling = true
                    break
                }
            default:
                {
                    break
                }
            }

            const validating = (validCard && validZip && validName)

            if (isValid !== validating) {
                isValid = validating
                if (calling) {
                    cb(isValid)
                }
            }
        })

    return common.generateReturn(mount, initTransaction, readyObserver, validObserver, { host, clientKey, apiKey })
}
