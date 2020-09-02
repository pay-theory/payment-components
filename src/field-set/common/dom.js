import * as data from './data'
import * as network from './network'

export const findTransactingElement = (element, cv) => element.type === 'number' ? element.frame : cv

export const addFrame = (
    container,
    element,
    styles,
    frameType = 'pay-theory-credit-card-tag-frame',
) => {
    const tagFrame = document.createElement(frameType)
    tagFrame.styles = styles
    tagFrame.setAttribute('ready', true)
    tagFrame.setAttribute('id', `${element}-tag-frame`)
    container.appendChild(tagFrame)
    return tagFrame
}

export const processElements = (elements, styles) => {
    let processed = []
    data.fieldTypes.forEach(type => {
        if (elements[type] && typeof elements[type] !== 'string') { throw new Error('invalid element') }
        const container = document.getElementById(elements[type])
        if (container) {
            const contained = document.getElementById(`${elements[type]}-tag-frame`)
            if (contained === null) {
                const frame = addFrame(
                    container,
                    elements[type],
                    styles,
                    type === 'credit-card' ?
                    `pay-theory-credit-card-tag-frame` :
                    `pay-theory-credit-card-${type}-tag-frame`)
                processed.push({ type, frame })
            }
            else {
                throw new Error(`${elements[type]} is already mounted`)
            }
        }
        else {
            /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
            console.warn(`${elements[type]} is not available in dom`)
        }

    })
    return processed
}

export const appendFinix = (formed, handleState, handleFormed) => {
    const script = document.createElement('script')
    // eslint-disable-next-line scanjs-rules/assign_to_src
    script.src = 'https://forms.finixpymnts.com/finix.js'
    script.addEventListener('load', () => {

        formed = window.PaymentForm.card((state, binInformation) => {
            if (binInformation) {
                const badge = binInformation.cardBrand
                const badger = document.createElement('div')
                badger.setAttribute('class', `paytheory-card-badge paytheory-card-${badge}`)
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

export const stateMapping = (elementType, state) => {
    // find the finix data element (number,security_code etc)
    const stateType = data.stateMap[elementType] ?
        data.stateMap[elementType] :
        elementType

    // extract the finix state for state type
    // use reduce in case there are combined elements
    const [stated, invalidElement] = stateType.split('|').reduce(([cStated, cInvalid], typed) => {
        const stated = state[stateType]

        // validate finix state
        const invalid = network.invalidate(stated)
        if (cInvalid) {
            return [cStated, cInvalid]
        }
        else {
            return [stated, invalid]
        }
    }, ['', false])

    // return the finix data element, state for that element, and validation
    return [stateType, stated, invalidElement]
}
