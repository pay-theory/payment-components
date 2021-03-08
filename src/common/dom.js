import * as message from './message'
export const findTransactingElement = (element, cv) => {
    return element === false ?
        (cv.type === 'credit-card' || cv.type === 'number') ?
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
export const findCardName = findField('card-name')
export const findAccountNumber = findField('account-number')
export const findBankCode = findField('routing-number')
export const findAccountType = findField('account-type')
export const findAccountName = findField('account-name')
export const findLine1 = findField('billing-line1')
export const findLine2 = findField('billing-line2')
export const findCity = findField('billing-city')
export const findState = findField('billing-state')
export const findZip = findField('billing-zip')
export const findCashName = findField('cash-name')
export const findCashContact = findField('cash-contact')
export const findCashZip = findField('cash-zip')

export const addFrame = (
    container,
    element,
    styles,
    frameType = 'pay-theory-credit-card-tag-frame',
    env
) => {
    const tagFrame = document.createElement(frameType)
    tagFrame.styles = styles
    tagFrame.env = env
    tagFrame.ready = true
    tagFrame.setAttribute('id', `${element}-tag-frame`)
    container.appendChild(tagFrame)
    return tagFrame
}

const processContainer = (container, elements, processed, styles, type, env, tagType) => {
    let error = false
    const contained = document.getElementById(`${elements[type]}-tag-frame`)
    if (contained === null) {
        const frame = addFrame(
            container,
            elements[type],
            styles,
            type === 'credit-card' ?
            `pay-theory-credit-card-tag-frame` :
            `pay-theory-${tagType ? `${tagType}-` : ''}${type}-tag-frame`,
            env)
        processed.push({ type, frame })
    }
    else {
        error = `${elements[type]} is already mounted`
    }
    return error
}

const findElementError = (elements, type) => {
    let error = false
    if (elements[type] && typeof elements[type] !== 'string') {
        error = 'invalid element'
    }
    else if (typeof elements[type] === 'undefined') {
        error = `'unknown type ${type}`
    }
    return error
}

export const processElements = (elements, styles, env, fieldTypes, tagType) => {
    let processed = []
    fieldTypes.forEach(type => {
        let error = findElementError(elements, type)

        const container = document.getElementById(elements[type])
        if (container && error === false) {
            error = processContainer(container, elements, processed, styles, type, env, tagType)
        }
        if (error) {
            return message.handleError(error)
        }
    })
    return processed
}

export const isHidden = element => {
    if (element === false) return true

    var style = window.getComputedStyle(element);
    if (style.display === 'none') {
        return true
    }

    var elem = element;
    var parents = []

    for (; elem && elem !== document; elem = elem.parentNode) {
        parents.push(elem);
    }

    const displayNone = (hidden, cv) => {
        var style = window.getComputedStyle(cv)
        const result = style.display === 'none'
        return hidden ? hidden : result
    }

    return parents.reduce(displayNone, false)
}
