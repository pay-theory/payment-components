import * as data from './data'
import * as message from './message'
export const findTransactingElement = (element, cv) => {
    return element === false ?
        (cv.type === 'credit-card' || cv.type === 'number') ?
        cv.frame :
        false :
        element
}

export const findCVV = (element, cv) => {
    return element === false ?
        (cv.type === 'cvv') ?
        cv.frame :
        false :
        element
}

export const findExp = (element, cv) => {
    return element === false ?
        (cv.type === 'exp') ?
        cv.frame :
        false :
        element
}

export const findCardName = (element, cv) => {
    return element === false ?
        (cv.type === 'name') ?
        cv.frame :
        false :
        element
}

export const findAccountNumber = (element, cv) => {
    return element === false ?
        (cv.type === 'account-number') ?
        cv.frame :
        false :
        element
}

export const findBankCode = (element, cv) => {
    return element === false ?
        (cv.type === 'routing-number') ?
        cv.frame :
        false :
        element
}

export const findAccountType = (element, cv) => {
    return element === false ?
        (cv.type === 'account-type') ?
        cv.frame :
        false :
        element
}

export const findAccountName = (element, cv) => {
    return element === false ?
        (cv.type === 'account-name') ?
        cv.frame :
        false :
        element
}

export const findLine1 = (element, cv) => {
    return element === false ?
        (cv.type === 'address-1') ?
        cv.frame :
        false :
        element
}

export const findLine2 = (element, cv) => {
    return element === false ?
        (cv.type === 'address-2') ?
        cv.frame :
        false :
        element
}

export const findCity = (element, cv) => {
    return element === false ?
        (cv.type === 'city') ?
        cv.frame :
        false :
        element
}

export const findState = (element, cv) => {
    return element === false ?
        (cv.type === 'state') ?
        cv.frame :
        false :
        element
}

export const findZip = (element, cv) => {
    return element === false ?
        (cv.type === 'zip') ?
        cv.frame :
        false :
        element
}

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

export const processAchElements = (elements, styles, env) => {
    let processed = []
    data.achFieldTypes.forEach(type => {
        let error = findElementError(elements, type)

        const container = document.getElementById(elements[type])
        if (container && error === false) {
            error = processAchContainer(container, elements, processed, styles, type, env)
        }
        if (error) {
            return message.handleError(error)
        }
    })
    return processed
}

const processAchContainer = (container, elements, processed, styles, type, env) => {
    let error = false
    const contained = document.getElementById(`${elements[type]}-tag-frame`)
    if (contained === null) {
        const frame = addFrame(
            container,
            elements[type],
            styles,
            `pay-theory-ach-${type}-tag-frame`,
            env)

        processed.push({ type, frame })
    }
    else {
        error = `${elements[type]} is already mounted`
    }
    return error
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
