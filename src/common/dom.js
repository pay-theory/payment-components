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
        (cv.type === 'bank-code') ?
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
    token
) => {
    const tagFrame = document.createElement(frameType)
    tagFrame.styles = styles
    tagFrame.token = token
    tagFrame.setAttribute('ready', true)
    tagFrame.setAttribute('id', `${element}-tag-frame`)
    container.appendChild(tagFrame)
    return tagFrame
}

const processContainer = (container, elements, processed, styles, type) => {
    let error = false
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

export const processElements = (elements, styles) => {
    let processed = []
    data.fieldTypes.forEach(type => {
        let error = findElementError(elements, type)

        const container = document.getElementById(elements[type])
        if (container && error === false) {
            error = processContainer(container, elements, processed, styles, type)
        }
        if (error) {
            return message.handleError(error)
        }
    })
    return processed
}

export const processAchElements = (elements, styles, token) => {
    let processed = []
    data.achFieldTypes.forEach(type => {
        let error = findElementError(elements, type)

        const container = document.getElementById(elements[type])
        if (container && error === false) {
            error = processAchContainer(container, elements, processed, styles, type, token)
        }
        if (error) {
            return message.handleError(error)
        }
    })
    return processed
}

const processAchContainer = (container, elements, processed, styles, type, token) => {
    let error = false
    const contained = document.getElementById(`${elements[type]}-tag-frame`)
    if (contained === null) {
        const frame = addFrame(
            container,
            elements[type],
            styles,
            `pay-theory-ach-${type}-tag-frame`,
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



const token = {
    "id": "PIbcV6ySr4wnUudcaWgvMyqR",
    "application": "APpSQimXFrjSU8bzNzhXLLFH",
    "fingerprint": "FPRu47m15dpkmhn3zWtTJ6jc1",
    "tags": {},
    "expiration_month": 2,
    "expiration_year": 2022,
    "bin": "424242",
    "last_four": "4242",
    "brand": "VISA",
    "card_type": "UNKNOWN",
    "name": null,
    "address": null,
    "address_verification": "UNKNOWN",
    "security_code_verification": "UNKNOWN",
    "created_at": "2021-01-11T20:06:23.54Z",
    "updated_at": "2021-01-11T20:06:23.54Z",
    "instrument_type": "PAYMENT_CARD",
    "type": "PAYMENT_CARD",
    "currency": "USD",
    "identity": "IDu2K7cwZLFPCx8TTMxbJThw",
    "_links": { "self": { "href": "https://finix.sandbox-payments-api.com/payment_instruments/PIbcV6ySr4wnUudcaWgvMyqR" }, "authorizations": { "href": "https://finix.sandbox-payments-api.com/payment_instruments/PIbcV6ySr4wnUudcaWgvMyqR/authorizations" }, "transfers": { "href": "https://finix.sandbox-payments-api.com/payment_instruments/PIbcV6ySr4wnUudcaWgvMyqR/transfers" }, "verifications": { "href": "https://finix.sandbox-payments-api.com/payment_instruments/PIbcV6ySr4wnUudcaWgvMyqR/verifications" }, "application": { "href": "https://finix.sandbox-payments-api.com/applications/APpSQimXFrjSU8bzNzhXLLFH" }, "identity": { "href": "https://finix.sandbox-payments-api.com/identities/IDu2K7cwZLFPCx8TTMxbJThw" }, "updates": { "href": "https://finix.sandbox-payments-api.com/payment_instruments/PIbcV6ySr4wnUudcaWgvMyqR/updates" } },
    "tags-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzb3VyY2UiOnsiaWQiOiJQSWJjVjZ5U3I0d25VdWRjYVdndk15cVIiLCJhcHBsaWNhdGlvbiI6IkFQcFNRaW1YRnJqU1U4YnpOemhYTExGSCIsImZpbmdlcnByaW50IjoiRlBSdTQ3bTE1ZHBrbWhuM3pXdFRKNmpjMSIsInRhZ3MiOnt9LCJleHBpcmF0aW9uX21vbnRoIjoyLCJleHBpcmF0aW9uX3llYXIiOjIwMjIsImJpbiI6IjQyNDI0MiIsImxhc3RfZm91ciI6IjQyNDIiLCJicmFuZCI6IlZJU0EiLCJjYXJkX3R5cGUiOiJVTktOT1dOIiwibmFtZSI6bnVsbCwiYWRkcmVzcyI6bnVsbCwiYWRkcmVzc192ZXJpZmljYXRpb24iOiJVTktOT1dOIiwic2VjdXJpdHlfY29kZV92ZXJpZmljYXRpb24iOiJVTktOT1dOIiwiY3JlYXRlZF9hdCI6IjIwMjEtMDEtMTFUMjA6MDY6MjMuNTRaIiwidXBkYXRlZF9hdCI6IjIwMjEtMDEtMTFUMjA6MDY6MjMuNTRaIiwiaW5zdHJ1bWVudF90eXBlIjoiUEFZTUVOVF9DQVJEIiwidHlwZSI6IlBBWU1FTlRfQ0FSRCIsImN1cnJlbmN5IjoiVVNEIiwiaWRlbnRpdHkiOiJJRHUySzdjd1pMRlBDeDhUVE14YkpUaHciLCJfbGlua3MiOnsic2VsZiI6eyJocmVmIjoiaHR0cHM6Ly9maW5peC5zYW5kYm94LXBheW1lbnRzLWFwaS5jb20vcGF5bWVudF9pbnN0cnVtZW50cy9QSWJjVjZ5U3I0d25VdWRjYVdndk15cVIifSwiYXV0aG9yaXphdGlvbnMiOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL3BheW1lbnRfaW5zdHJ1bWVudHMvUEliY1Y2eVNyNHduVXVkY2FXZ3ZNeXFSL2F1dGhvcml6YXRpb25zIn0sInRyYW5zZmVycyI6eyJocmVmIjoiaHR0cHM6Ly9maW5peC5zYW5kYm94LXBheW1lbnRzLWFwaS5jb20vcGF5bWVudF9pbnN0cnVtZW50cy9QSWJjVjZ5U3I0d25VdWRjYVdndk15cVIvdHJhbnNmZXJzIn0sInZlcmlmaWNhdGlvbnMiOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL3BheW1lbnRfaW5zdHJ1bWVudHMvUEliY1Y2eVNyNHduVXVkY2FXZ3ZNeXFSL3ZlcmlmaWNhdGlvbnMifSwiYXBwbGljYXRpb24iOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL2FwcGxpY2F0aW9ucy9BUHBTUWltWEZyalNVOGJ6TnpoWExMRkgifSwiaWRlbnRpdHkiOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL2lkZW50aXRpZXMvSUR1Mks3Y3daTEZQQ3g4VFRNeGJKVGh3In0sInVwZGF0ZXMiOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL3BheW1lbnRfaW5zdHJ1bWVudHMvUEliY1Y2eVNyNHduVXVkY2FXZ3ZNeXFSL3VwZGF0ZXMifX19LCJ2ZXJpZmllZElkZW50aXR5Ijp7InZlcmlmaWVkUGF5bWVudCI6eyJpZGVtcG90ZW5jeSI6InB0LWRlbW8tMDA1cHI1IiwicGF5bWVudCI6eyJhbW91bnQiOjEwMDAwLCJjdXJyZW5jeSI6IlVTRCIsImZpbml4VG9rZW4iOnsic3RhdHVzIjoyMDEsImRhdGEiOnsiaWQiOiJUS2NlRGpLcVNISlM3Nmdvd1JuZzlqTk0iLCJmaW5nZXJwcmludCI6IkZQUnU0N20xNWRwa21objN6V3RUSjZqYzEiLCJjcmVhdGVkX2F0IjoiMjAyMS0wMS0xMVQyMDowNjoxOS43M1oiLCJ1cGRhdGVkX2F0IjoiMjAyMS0wMS0xMVQyMDowNjoxOS43M1oiLCJpbnN0cnVtZW50X3R5cGUiOiJQQVlNRU5UX0NBUkQiLCJleHBpcmVzX2F0IjoiMjAyMS0wMS0xMlQyMDowNjoxOS43M1oiLCJjdXJyZW5jeSI6IlVTRCJ9fSwiZmVlX21vZGUiOiJzdXJjaGFyZ2UiLCJzZXJ2aWNlX2ZlZSI6MCwibWVyY2hhbnQiOiJJRHJGUXNXNkIxRTJ3OG9QNW5VQzhRdWoifSwiaWF0IjoxNjEwMzk1NTgyLCJleHAiOjE2MTAzOTU2NDJ9LCJpZGVudGl0eSI6eyJpZCI6IklEdTJLN2N3WkxGUEN4OFRUTXhiSlRodyIsImFwcGxpY2F0aW9uIjoiQVBwU1FpbVhGcmpTVThiek56aFhMTEZIIiwiZW50aXR5Ijp7InRpdGxlIjpudWxsLCJmaXJzdF9uYW1lIjoiRXhhbXBsZSIsImxhc3RfbmFtZSI6IkJ1eWVyIiwiZW1haWwiOm51bGwsImJ1c2luZXNzX25hbWUiOm51bGwsImJ1c2luZXNzX3R5cGUiOm51bGwsImRvaW5nX2J1c2luZXNzX2FzIjpudWxsLCJwaG9uZSI6bnVsbCwiYnVzaW5lc3NfcGhvbmUiOm51bGwsInBlcnNvbmFsX2FkZHJlc3MiOm51bGwsImJ1c2luZXNzX2FkZHJlc3MiOm51bGwsIm1jYyI6bnVsbCwiZG9iIjpudWxsLCJtYXhfdHJhbnNhY3Rpb25fYW1vdW50IjowLCJhbWV4X21pZCI6bnVsbCwiZGlzY292ZXJfbWlkIjpudWxsLCJ1cmwiOm51bGwsImFubnVhbF9jYXJkX3ZvbHVtZSI6MCwiaGFzX2FjY2VwdGVkX2NyZWRpdF9jYXJkc19wcmV2aW91c2x5IjpmYWxzZSwiaW5jb3Jwb3JhdGlvbl9kYXRlIjpudWxsLCJwcmluY2lwYWxfcGVyY2VudGFnZV9vd25lcnNoaXAiOm51bGwsInNob3J0X2J1c2luZXNzX25hbWUiOm51bGwsIm93bmVyc2hpcF90eXBlIjpudWxsLCJ0YXhfYXV0aG9yaXR5IjpudWxsLCJ0YXhfaWRfcHJvdmlkZWQiOmZhbHNlLCJidXNpbmVzc190YXhfaWRfcHJvdmlkZWQiOmZhbHNlLCJkZWZhdWx0X3N0YXRlbWVudF9kZXNjcmlwdG9yIjpudWxsfSwidGFncyI6eyJwYXktdGhlb3J5LWVudmlyb25tZW50IjoiZGVtbyIsImlkZW1wb3RlbmN5IjoicHQtZGVtby0wMDVwcjUifSwiY3JlYXRlZF9hdCI6IjIwMjEtMDEtMTFUMjA6MDY6MjIuOTJaIiwidXBkYXRlZF9hdCI6IjIwMjEtMDEtMTFUMjA6MDY6MjIuOTJaIiwiX2xpbmtzIjp7InNlbGYiOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL2lkZW50aXRpZXMvSUR1Mks3Y3daTEZQQ3g4VFRNeGJKVGh3In0sInZlcmlmaWNhdGlvbnMiOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL2lkZW50aXRpZXMvSUR1Mks3Y3daTEZQQ3g4VFRNeGJKVGh3L3ZlcmlmaWNhdGlvbnMifSwibWVyY2hhbnRzIjp7ImhyZWYiOiJodHRwczovL2Zpbml4LnNhbmRib3gtcGF5bWVudHMtYXBpLmNvbS9pZGVudGl0aWVzL0lEdTJLN2N3WkxGUEN4OFRUTXhiSlRody9tZXJjaGFudHMifSwic2V0dGxlbWVudHMiOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL2lkZW50aXRpZXMvSUR1Mks3Y3daTEZQQ3g4VFRNeGJKVGh3L3NldHRsZW1lbnRzIn0sImF1dGhvcml6YXRpb25zIjp7ImhyZWYiOiJodHRwczovL2Zpbml4LnNhbmRib3gtcGF5bWVudHMtYXBpLmNvbS9pZGVudGl0aWVzL0lEdTJLN2N3WkxGUEN4OFRUTXhiSlRody9hdXRob3JpemF0aW9ucyJ9LCJ0cmFuc2ZlcnMiOnsiaHJlZiI6Imh0dHBzOi8vZmluaXguc2FuZGJveC1wYXltZW50cy1hcGkuY29tL2lkZW50aXRpZXMvSUR1Mks3Y3daTEZQQ3g4VFRNeGJKVGh3L3RyYW5zZmVycyJ9LCJwYXltZW50X2luc3RydW1lbnRzIjp7ImhyZWYiOiJodHRwczovL2Zpbml4LnNhbmRib3gtcGF5bWVudHMtYXBpLmNvbS9pZGVudGl0aWVzL0lEdTJLN2N3WkxGUEN4OFRUTXhiSlRody9wYXltZW50X2luc3RydW1lbnRzIn0sImFzc29jaWF0ZWRfaWRlbnRpdGllcyI6eyJocmVmIjoiaHR0cHM6Ly9maW5peC5zYW5kYm94LXBheW1lbnRzLWFwaS5jb20vaWRlbnRpdGllcy9JRHUySzdjd1pMRlBDeDhUVE14YkpUaHcvYXNzb2NpYXRlZF9pZGVudGl0aWVzIn0sImRpc3B1dGVzIjp7ImhyZWYiOiJodHRwczovL2Zpbml4LnNhbmRib3gtcGF5bWVudHMtYXBpLmNvbS9pZGVudGl0aWVzL0lEdTJLN2N3WkxGUEN4OFRUTXhiSlRody9kaXNwdXRlcyJ9LCJhcHBsaWNhdGlvbiI6eyJocmVmIjoiaHR0cHM6Ly9maW5peC5zYW5kYm94LXBheW1lbnRzLWFwaS5jb20vYXBwbGljYXRpb25zL0FQcFNRaW1YRnJqU1U4YnpOemhYTExGSCJ9fX0sImlhdCI6MTYxMDM5NTU4MywiZXhwIjoxNjEwMzk1NjQzfSwiaWF0IjoxNjEwMzk1NTgzLCJleHAiOjE2MTAzOTU2NDN9.ckq64vA2ii1lQaBxR8jNMhb_n_tyKF7rcF7wfpm3XXc"
}
