import * as data from './data'
import * as network from './network'
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

export const addFrame = (
    container,
    element,
    styles,
    frameType = 'pay-theory-credit-card-tag-frame',
    env,
    token
) => {
    const tagFrame = document.createElement(frameType)
    tagFrame.styles = styles
    tagFrame.token = token
    tagFrame.env = env
    tagFrame.ready = true
    tagFrame.setAttribute('id', `${element}-tag-frame`)
    container.appendChild(tagFrame)
    return tagFrame
}

const processContainer = (container, elements, processed, styles, type, env) => {
    let error = false
    const contained = document.getElementById(`${elements[type]}-tag-frame`)
    if (contained === null) {
        const frame = addFrame(
            container,
            elements[type],
            styles,
            type === 'credit-card' ?
            `pay-theory-credit-card-tag-frame` :
            `pay-theory-credit-card-${type}-tag-frame`,
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

export const processElements = (elements, styles, env) => {
    let processed = []
    data.fieldTypes.forEach(type => {
        let error = findElementError(elements, type)

        const container = document.getElementById(elements[type])
        if (container && error === false) {
            error = processContainer(container, elements, processed, styles, type, env)
        }
        if (error) {
            return message.handleError(error)
        }
    })
    return processed
}

export const processAchElements = (elements, styles, token, env) => {
    let processed = []
    data.achFieldTypes.forEach(type => {
        let error = findElementError(elements, type)

        const container = document.getElementById(elements[type])
        if (container && error === false) {
            error = processAchContainer(container, elements, processed, styles, type, token, env)
        }
        if (error) {
            return message.handleError(error)
        }
    })
    return processed
}

const processAchContainer = (container, elements, processed, styles, type, token, env) => {
    let error = false
    const contained = document.getElementById(`${elements[type]}-tag-frame`)
    if (contained === null) {
        const frame = addFrame(
            container,
            elements[type],
            styles,
            `pay-theory-ach-${type}-tag-frame`,
            env,
            token)

        processed.push({ type, frame })
    }
    else {
        error = `${elements[type]} is already mounted`
    }
    return error
}

export const appendFinix = (formed, handleState, handleFormed) => {
    const script = document.createElement('script')
    // eslint-disable-next-line scanjs-rules/assign_to_src
    script.src = 'https://forms.finixpymnts.com/finix.js'
    script.addEventListener('load', () => {

        formed = window.PaymentForm.card((state, binInformation) => {
            if (binInformation) {
                data.setBin({ first_six: binInformation.bin, brand: binInformation.cardBrand })
                const badge = binInformation.cardBrand
                const badger = document.createElement('div')
                const branded = `pay-theory-card-badge pay-theory-card-${badge}`
                badger.setAttribute('class', branded)
                const badged = document.getElementById('pay-theory-badge-wrapper')
                if (badged !== null) {
                    badged.innerHTML = ''
                    badged.appendChild(badger)
                }
            }

            if (state) {
                handleState(state)
            }
        })
        handleFormed(formed)
    })
    document.getElementsByTagName('head')[0].appendChild(script)
}

const determineStateType = (elementType) =>
    data.stateMap[elementType] ?
    data.stateMap[elementType] :
    elementType

const generateStateReducer = state => {
    return ([cValid, cInvalid, cUndefined], typed) => {
        const stated = state[typed]

        // validate finix state
        const invalid = network.invalidate(stated)

        if (invalid === true) {
            cInvalid.push(stated)
        }
        else if (invalid === false) {
            cValid.push(stated)
        }
        else {
            cUndefined.push(stated)
        }

        return [cValid, cInvalid, cUndefined]
    }
}



const findStateResult = (cValid, cInvalid, cUndefined, splitLength, stateType) => {
    let result
    if (cValid.length === splitLength) {
        result = [stateType, cValid[0], false]
    }
    else if (cInvalid.length > 0) {
        result = [stateType, cInvalid[0], true]
    }
    else {
        result = [stateType, cUndefined[0], ]
    }
    return result
}

export const stateMapping = (elementType, state) => {
    // find the finix data element (number,security_code etc)
    const stateType = determineStateType(elementType)

    // extract the finix state for state type
    // use reduce in case there are combined elements
    const splitLength = stateType.split('|').length



    let result
    if (splitLength > 1) {
        const [cValid, cInvalid, cUndefined] = stateType.split('|').reduce(generateStateReducer(state), [
            [],
            [],
            []
        ])

        result = findStateResult(cValid, cInvalid, cUndefined, splitLength, stateType)
    }
    else {

        const stated = state[stateType]

        // validate finix state
        const invalid = network.invalidate(stated)

        // return the finix data element, state for that element, and validation
        result = [stateType, stated, invalid]
    }
    return result
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
