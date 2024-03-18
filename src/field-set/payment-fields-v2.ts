/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/*global navigator*/
import common from '../common'
import * as valid from './validation'
import {achElementIds, cardElementIds, cashElementIds, MERCHANT_FEE, SERVICE_FEE} from "../common/data";
import PayTheoryHostedField from "../components/pay-theory-hosted-field";
import {processedElement} from "../common/dom";
import PayTheoryHostedFieldTransactional from "../components/pay-theory-hosted-field-transactional";
import * as handler from "./handler";
import {
    ErrorResponse,
    ErrorType,
    PayTheoryPaymentFieldsInput,
    PlaceholderObject,
    ReadyResponse,
    ResponseMessageTypes,
    StyleObject
} from "../common/pay_theory_types";

type ProcessedObject = {
    card: {
        elements: {
            transacting: processedElement<cardElementIds, PayTheoryHostedFieldTransactional>[],
            siblings: processedElement<cardElementIds, PayTheoryHostedField>[]
        },
        errorCheck: (allElements: Array<PayTheoryHostedField | PayTheoryHostedFieldTransactional>, transacting: Array<PayTheoryHostedFieldTransactional>) => string | false
    },
    ach: {
        elements: {
            transacting: processedElement<achElementIds, PayTheoryHostedFieldTransactional>[],
            siblings: processedElement<achElementIds, PayTheoryHostedField>[]
        },
        errorCheck: (allElements: Array<PayTheoryHostedField | PayTheoryHostedFieldTransactional>, transacting: Array<PayTheoryHostedFieldTransactional>) => string | false
    },
    cash: {
        elements: {
            transacting: processedElement<cashElementIds, PayTheoryHostedFieldTransactional>[],
            siblings: processedElement<cashElementIds, PayTheoryHostedField>[]
        },
        errorCheck: (allElements: Array<PayTheoryHostedField | PayTheoryHostedFieldTransactional>, transacting: Array<PayTheoryHostedFieldTransactional>) => string | false
    }
}

const mountProcessedElements = async(props: {
    processed: ProcessedObject,
    apiKey: string,
    styles: StyleObject,
    placeholders: PlaceholderObject,
    session: string | undefined,
    metadata: { [key: string | number]: string | number | boolean },
    removeEventListeners: () => void
    feeMode: typeof MERCHANT_FEE | typeof SERVICE_FEE | undefined,
    amount: number | undefined,
    port: MessagePort
}) => {
    const {processed, apiKey, styles, placeholders, session, metadata, removeEventListeners, feeMode, amount} = props
    for (const value of Object.values(processed)) {
        let transactingElements = value.elements.transacting.map((element) => element.frame)
        let siblingsElements = value.elements.siblings.map((element) => element.frame)
        let allElements = [...transactingElements, ...siblingsElements]
        if (allElements.length > 0) {
            let error = value.errorCheck(allElements, transactingElements)
            if (error) {
                return common.handleTypedError(ErrorType.FIELD_ERROR, error);
            }
            value.elements.siblings.forEach((sibling) => {
                let container = document.getElementById(sibling.containerId)
                sibling.frame.styles = styles
                sibling.frame.placeholders = placeholders
                sibling.frame.session = session
                if (container) {
                    container.appendChild(sibling.frame)
                }
            })
            value.elements.transacting.forEach((element) => {
                let container = document.getElementById(element.containerId)
                element.frame.apiKey = apiKey
                element.frame.styles = styles
                element.frame.placeholders = placeholders
                element.frame.metadata = metadata
                element.frame.removeEventListeners = removeEventListeners
                element.frame.feeMode = feeMode
                element.frame.amount = amount
                element.frame.session = session
                const processedElementTypes = value.elements.siblings.map((sibling) => sibling.type)
                const transactingElementType = value.elements.transacting.map((transacting) => transacting.type)
                element.frame.processedElements = [...processedElementTypes, ...transactingElementType]
                element.frame.readyPort = props.port
                if (container) {
                    container.appendChild(element.frame)
                }
            })
        }
    }
}

const initializeFields = async(props: PayTheoryPaymentFieldsInput, port: MessagePort) => {
        const {
            apiKey,
            styles = common.defaultStyles,
            metadata = {},
            placeholders = {},
            elementIds = common.defaultElementIds,
            session,
            feeMode,
            amount,
        } = props
        valid.checkInitialParams(apiKey, feeMode, metadata, styles, amount)
        // Map the elementIds to objects that can be passed into the processElements function
        const achElements: achElementIds = {
            'account-number': elementIds['account-number'],
            'account-name': elementIds['ach-name'],
            'routing-number': elementIds['routing-number'],
            'account-type': elementIds['account-type'],
        }

        const cardElements: cardElementIds = {
            'credit-card': elementIds['credit-card'],
            'card-number': elementIds.number,
            'card-exp': elementIds.exp,
            'card-cvv': elementIds.cvv,
            'card-name': elementIds['account-name'],
            'billing-line1': elementIds['address-1'],
            'billing-line2': elementIds['address-2'],
            'billing-city': elementIds.city,
            'billing-state': elementIds.state,
            'billing-zip': elementIds.zip,
        }

        const cashElements: cashElementIds = {
            'cash-name': elementIds['cash-name'],
            'cash-contact': elementIds['cash-contact']
        }

        const removeRelay = common.handleHostedFieldMessage(common.relayTypeMessage, handler.relayHandler)
        const removeState = common.handleHostedFieldMessage(common.hostedStateTypeMessage, handler.stateUpdater)
        const removeHostedError = common.handleHostedFieldMessage(common.socketErrorTypeMessage, handler.hostedErrorHandler)

        const removeEventListeners = () => {
            removeState()
            removeHostedError()
            removeRelay()
        }

        // Creates the web component elements, so they can be added to the dom
        const cardProcessed = common.processElements(cardElements, common.cardFieldTypes)
        const achProcessed = common.processElements(achElements, common.achFieldTypes)
        const cashProcessed = common.processElements(cashElements, common.cashFieldTypes)

        // Throw an error if there are no elements to mount
        if (cardProcessed.transacting.length === 0 &&
            cardProcessed.siblings.length === 0 &&
            cashProcessed.transacting.length === 0 &&
            cashProcessed.siblings.length === 0 &&
            achProcessed.transacting.length === 0 &&
            achProcessed.siblings.length === 0) {
            return common.handleTypedError(ErrorType.NO_FIELDS, 'There are no PayTheory fields on the DOM to mount')
        }

        const processed: ProcessedObject = {
            card: {
                elements: cardProcessed,
                errorCheck: valid.findCardError
            },
            ach: {
                elements: achProcessed,
                errorCheck: valid.findAchError
            },
            cash: {
                elements: cashProcessed,
                errorCheck: valid.findCashError
            }
        }
        // Mount the elements to the DOM
        let result =  await mountProcessedElements({
            processed,
            apiKey,
            styles,
            placeholders,
            session,
            metadata,
            removeEventListeners,
            feeMode,
            amount,
            port
        })

        if (result) {
            return result
        }
}

const payTheoryFields = async(inputParams: PayTheoryPaymentFieldsInput) => new Promise<ReadyResponse | ErrorResponse>((resolve, reject) => {
// Opening a new message channel, so we can await the response from the hosted field
    const channel = new MessageChannel()

    channel.port1.onmessage = ({data}) => {
        channel.port1.close();
        resolve({
            type: ResponseMessageTypes.READY,
            body: true
        })
    };

    if (document.readyState === 'complete') {
        initializeFields(inputParams, channel.port2)
            .then(result => {
                if(result) resolve(result)
            })
    } else {
        document.addEventListener('DOMContentLoaded', async () => {
            const result = await initializeFields(inputParams, channel.port2);
            if (result) resolve(result);
        });
    }

})

export default payTheoryFields