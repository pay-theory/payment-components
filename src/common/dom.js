import * as message from './message'
import * as data from './data'
export const findTransactingElement = (element, cv) => {
    return element === false ?
        (cv.type === 'credit-card' || cv.type === 'card-number') ?
        cv.frame :
        false :
        element
}

export const findField = (type) => (element, cv) => {
    return element === false ?
        (cv.type === type) ?
        cv.frame :
        false :
        element
}

export const findCVV = findField('card-cvv')
export const findExp = findField('card-exp')
export const findAccountNumber = findField('account-number')
export const findBankCode = findField('routing-number')
export const findAccountType = findField('account-type')
export const findAccountName = findField('account-name')
export const findZip = findField('billing-zip')

export const addFrame = (
    container,
    element,
    frameType = 'pay-theory-credit-card-tag-frame',
    env
) => {
    const tagFrame = document.createElement(frameType)
    tagFrame.env = env
    tagFrame.ready = true
    tagFrame.setAttribute('id', `${element}-tag-frame`)
    container.appendChild(tagFrame)
    return tagFrame
}

const processContainer = (container, elements, processed, type, tagType) => {
    let error = false
    const contained = document.getElementById(`${elements[type]}-tag-frame`)
    if (contained === null) {
        const frame = addFrame(
            container,
            elements[type],
            type === 'credit-card' ?
            `pay-theory-credit-card-tag-frame` :
            `pay-theory-${tagType ? `${tagType}-` : ''}${type}-tag-frame`)
        processed.push({ type, frame })
    }
    else {
        error = `${elements[type]} is already mounted`
    }
    return error
}

const findElementError = (elements, type) => {
    let element = elements[type]
    return typeof element === 'undefined' ? `unknown type ${type}` : typeof element !== 'string' ? 'invalid element' : false
}

export const processElements = (elements, state, fieldTypes, tagType) => {
    let processed = []
    fieldTypes.forEach(type => {
        let error = findElementError(elements, type)

        const container = document.getElementById(elements[type])
        if (container && error === false) {
            error = processContainer(container, elements, processed, type, tagType)
        }
        if (error) {
            return message.handleError(error)
        } else {
            state[type] = data.initialState
        }
    })
    return processed
}

export const isHidden = element => {
    if (element === false) return true

    let elem = element;
    let elements = [elem]

    for (; elem && elem !== document; elem = elem.parentNode) {
        elements.push(elem);
    }

    const displayNone = (hidden, cv) => {
        const style = window.getComputedStyle(cv)
        const result = style.display === 'none'
        return hidden ? hidden : result
    }

    return elements.reduce(displayNone, false)
}
