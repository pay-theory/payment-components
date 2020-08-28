import * as data from './data'

export const findTransactingElement = (element, cv) => element.type === 'number' ? element.frame : cv

export const addFrame = (
    form,
    container,
    element,
    styles,
    frameType = 'pay-theory-credit-card-tag-frame',
) => {
    const tagFrame = document.createElement(frameType)
    tagFrame.styles = styles
    tagFrame.form = form
    tagFrame.setAttribute('ready', true)
    tagFrame.setAttribute('id', `${element}-tag-frame`)
    container.appendChild(tagFrame)
    return tagFrame
}

export const processElement = (form, element, styles) => {
    if (typeof element !== 'string') { throw new Error('invalid element') }
    const container = document.getElementById(element)
    if (container) {
        const contained = document.getElementById(`${element}-tag-frame`)
        if (contained === null) {
            const framed = addFrame(form, container, element, styles)
            return framed
        }
        else {
            throw new Error(`${element} is already mounted`)
        }
    }
    else {
        throw new Error(`${element} is not available in dom`)
    }
}

export const processElements = (form, elements, styles) => {
    let processed = []
    data.fieldTypes.forEach(type => {
        if (elements[type] && typeof elements[type] !== 'string') { throw new Error('invalid element') }
        const container = document.getElementById(elements[type])
        if (container) {
            const contained = document.getElementById(`${elements[type]}-tag-frame`)
            if (contained === null) {
                const frame = addFrame(form, container, elements[type], styles, `pay-theory-credit-card-${type}-tag-frame`)
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
