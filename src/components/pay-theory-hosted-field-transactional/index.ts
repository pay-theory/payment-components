// @ts-ignore
import PayTheoryHostedField from '../pay-theory-hosted-field'
import common from '../../common'
import {
    ACH_IFRAME,
    CARD_IFRAME,
    CASH_IFRAME,
    defaultFeeMode,
    ElementTypes,
    TransactingType,
    transactingWebComponentMap
} from "../../common/data";
import {handleTypedError, sendAsyncPostMessage, AsyncMessage} from "../../common/message";
import {
    CashBarcodeMessage,
    ConfirmationMessage, ERROR_STEP,
    ErrorMessage,
    FailedTransactionMessage,
    PayTheoryDataObject,
    SuccessfulTransactionMessage,
    TokenizedPaymentMethodMessage
} from "../../common/format";
import {
    BillingInfo,
    ErrorResponse,
    ErrorType,
    FieldState,
    PayorInfo,
    StateObject
} from "../../common/pay_theory_types";

export interface IncomingFieldState extends FieldState {
    element?: ElementTypes
    isConnected?: boolean
}

export type TransactDataObject = {
    amount: number,
    payorInfo: PayorInfo,
    payTheoryData: PayTheoryDataObject,
    metadata?: {[keys: string | number]: string | number | boolean },
    fee_mode?: typeof common.MERCHANT_FEE | typeof common.SERVICE_FEE,
    confirmation?: boolean
}

export type TokenizeDataObject = {
    payorInfo?: PayorInfo,
    metadata?: {[keys: string | number]: string | number | boolean },
    payorId?: string,
    billingInfo?: BillingInfo,
}

type ConstructorProps = {
    fieldTypes: Array<ElementTypes>,
    requiredValidFields: Array<ElementTypes>,
    transactingIFrameId: typeof CARD_IFRAME | typeof ACH_IFRAME | typeof CASH_IFRAME,
    stateGroup: Partial<StateObject>,
    transactingType: TransactingType
}



class PayTheoryHostedFieldTransactional extends PayTheoryHostedField {
    // Used to fetch the pt-token attribute to initialize the hosted field
    protected _apiKey: string | undefined
    protected _challengeOptions: object | undefined

    // Used to track the metadata that is passed in for a session
    protected _metadata: { [key: string | number]: string | number | boolean } | undefined

    // Used to track if the transact or tokenize function has been called, and we are awaiting a response
    protected _initialized: boolean = false
    protected _completed: boolean = false

    // Used to track if the element was the one that was used when transact was called
    protected _isTransactingElement: boolean = false

    // Used to track if the element is ready to be
    protected _isReady: boolean = false
    protected _readyChannel: MessagePort | undefined

    // List of fields that are a part of this group used to transact for this transactional element
    protected _fieldTypes: Array<ElementTypes>

    // Used to track what elements are being used for the transaction
    protected _processedElements: Partial<Array<ElementTypes>> = []

    // Used to track the state of the elements that are being used for the transaction of this transactional element
    protected _stateGroup: Partial<StateObject>

    // Used to track the error message for the element
    protected _error: string | undefined

    // Used to track if the transactional element is valid
    protected _requiredValidFields: Array<ElementTypes>
    protected _isValid: boolean = false

    // Help to track the transacting type of the transactional element
    protected _transactingIFrameId: typeof CARD_IFRAME | typeof ACH_IFRAME | typeof CASH_IFRAME
    protected _transactingType: TransactingType

    // Function used to remove event listeners
    protected _removeEventListeners: () => void = () => {}
    protected _removeHostTokenListener: () => void = () => {}
    protected _removeReadyListener: () => void = () => {}

    // Used for backwards compatibility with feeMode
    protected _feeMode: typeof common.SERVICE_FEE | typeof common.MERCHANT_FEE | undefined

    constructor(props: ConstructorProps) {
        super()
        this.createToken = this.createToken.bind(this)
        this.transact = this.transact.bind(this)
        this.resetToken = this.resetToken.bind(this)
        this.capture = this.capture.bind(this)
        this.cancel = this.cancel.bind(this)
        this.tokenize = this.tokenize.bind(this)
        this.sendValidMessage = this.sendValidMessage.bind(this)
        this.sendStateMessage = this.sendStateMessage.bind(this)
        this.sendValidMessage = this.sendValidMessage.bind(this)
        this.sendPtToken = this.sendPtToken.bind(this)
        this._fieldTypes = props.fieldTypes
        this._requiredValidFields = props.requiredValidFields
        this._transactingIFrameId = props.transactingIFrameId
        this._stateGroup = props.stateGroup
        this._transactingType = props.transactingType
    }

    resetToken = async() => {
        this._isTransactingElement = false
        const ptToken = await common.fetchPtToken(this._apiKey!)
        if (ptToken) {
            const transactingIFrame = document.getElementById(this._transactingIFrameId) as HTMLIFrameElement
            if (transactingIFrame) {
                transactingIFrame.contentWindow!.postMessage({
                    type: `pt-static:reset_host`,
                    token: ptToken['pt-token'],
                    origin: ptToken['origin'],
                    fields: this._processedElements
                }, common.hostedFieldsEndpoint)
                // Return true because it successfully sent the reset token message
                return true
            } else {
                // Return false because it failed to find the transacting iframe
                return false
            }
        } else {
            // Return false because it failed to fetch the pt-token
            return false
        }
    }

    async sendPtToken() {
        const ptToken = await common.fetchPtToken(this._apiKey!)
        if (ptToken) {
            this._challengeOptions = ptToken['challengeOptions']
            const transactingIFrame = document.getElementById(this._transactingIFrameId) as HTMLIFrameElement
            if (transactingIFrame) {
                transactingIFrame.contentWindow!.postMessage({
                    type: `pt-static:connection_token`,
                    token: ptToken['pt-token'],
                    origin: ptToken['origin'],
                    fields: this._processedElements
                }, common.hostedFieldsEndpoint)
            } else {
                handleTypedError(ErrorType.NO_TOKEN, 'Unable to find transacting iframe')
            }
        } else {
            handleTypedError(ErrorType.NO_TOKEN, 'Unable to fetch pt-token')
        }
    }

    async connectedCallback() {
        // Set up a listener for the hosted field to message saying it is ready for the pt-token to be sent
        this._removeHostTokenListener = common.handleHostedFieldMessage((event: {
            type: any,
            element: ElementTypes,
        }) => {
            return event.type === 'pt-static:pt_token_ready' && this._transactingIFrameId.includes(event.element)
        }, this.sendPtToken)

        // Set up a listener for the hosted field to message saying it is connected to the socket and send a ready message
        this._removeReadyListener = common.handleHostedFieldMessage((event: {
            type: any,
            element: ElementTypes,
        }) => {
            return event.type === 'pt-static:connected' && this._transactingIFrameId.includes(event.element)
        }, () => {
            this._isReady = true
            this.sendReadyMessage()
        })

        await super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._removeEventListeners();
        this._removeHostTokenListener();
        this._removeReadyListener();
    }

    async transact(data: TransactDataObject, element: PayTheoryHostedFieldTransactional) {
        data.fee_mode = data.fee_mode || this._feeMode || defaultFeeMode
        data.metadata = data.metadata || this._metadata
        this._isTransactingElement = true
        let response = await common.sendTransactingMessage(element, data.payTheoryData.billing_info)
        if (response.type === ERROR_STEP) {
            this._isTransactingElement = false
            return response
        }
        let message: AsyncMessage = {
            type: 'pt-static:payment-detail',
            data: data,
            async: true
        }
        const transactingIFrame = document.getElementById(this._transactingIFrameId) as HTMLIFrameElement
        return sendAsyncPostMessage<ConfirmationMessage | SuccessfulTransactionMessage | FailedTransactionMessage | CashBarcodeMessage | ErrorMessage>(message, transactingIFrame)
    }

    capture() {
        let message: AsyncMessage =  {
            type: 'pt-static:confirm',
            async: true
        }
        const transactingIFrame = document.getElementById(this._transactingIFrameId) as HTMLIFrameElement
        return sendAsyncPostMessage<SuccessfulTransactionMessage | FailedTransactionMessage | ErrorMessage>(message, transactingIFrame)
    }


    async cancel(): Promise<true | ErrorResponse> {
        const transactingIFrame = document.getElementById(this._transactingIFrameId) as HTMLIFrameElement
        if (transactingIFrame) {
            transactingIFrame.contentWindow!.postMessage({
                type: `pt-static:cancel`
            }, common.hostedFieldsEndpoint)
            let result = await this.resetToken()
            if (result) {
                this._isTransactingElement = false
                this.initialized = false
                // Successfully sent the cancel message and reset the token
                return true
            } else {
                // Successfully sent the cancel message but failed to reset the token
                return handleTypedError(ErrorType.CANCEL_FAILED, 'Failed to reset token')
            }
        } else {
            // Failed to find the transacting iframe to send the cancel message
            return handleTypedError(ErrorType.CANCEL_FAILED, 'Failed to find transacting iframe')
        }
    }

    async tokenize(data: TokenizeDataObject, element: PayTheoryHostedFieldTransactional): Promise<TokenizedPaymentMethodMessage | ErrorMessage> {
        this._isTransactingElement = true
        this._initialized = true
        let response = await common.sendTransactingMessage(element, data.billingInfo)
        if (response.type === ERROR_STEP) {
            this._isTransactingElement = false
            return response
        }
        let message: AsyncMessage =  {
            type: 'pt-static:tokenize-detail',
            data: data,
            async: true
        }
        const transactingIFrame = document.getElementById(this._transactingIFrameId) as HTMLIFrameElement
        return sendAsyncPostMessage<TokenizedPaymentMethodMessage | ErrorMessage>(message, transactingIFrame)
    }

    sendStateMessage() {
        // Make a copy of the state group
        const newState = {
            ...this._stateGroup
        }
        // Loop through all the other transacting elements and add their state to the state group or use the default state
        for(let [key, value] of Object.entries(transactingWebComponentMap)) {
            if (key !== this._transactingType) {
                let transactingTypesState = value.ids.reduce((acc: any, id: string) => {
                    let element = document.getElementById(id) as PayTheoryHostedFieldTransactional
                    if (element) {
                        return element.stateGroup
                    } else {
                        return acc
                    }
                }, value.defaultState)
                Object.assign(newState, transactingTypesState)
            }
        }
        // Send the state message
        window.postMessage({
                type: 'pay-theory:state',
                data: newState
            },
            window.location.origin,
        );
    }

    sendValidMessage() {
        // If element is valid include it in the valid string
        let valid: string = this._isValid ? this._transactingType : ""
        // Check to see if all other transacting elements are valid
        for(let [key, value] of Object.entries(transactingWebComponentMap)) {
            if(key !== this._transactingType) {
                value.ids.forEach((id: string) => {
                    let element = document.getElementById(id) as PayTheoryHostedFieldTransactional
                    if (element && element?.valid) {
                        // If other transacting elements are valid include them in the valid string
                        valid = valid + ' ' + element._transactingType
                    }
                })
            }
        }
        // Send the updated valid string
        window.postMessage({
                type: 'pay-theory:valid',
                data: valid
            },
            window.location.origin,
        )
    }

    sendReadyMessage() {
        let sendReadyMessage = true
        // Check to see if all other transacting elements are ready
        for(let [key, value] of Object.entries(transactingWebComponentMap)) {
            if (key !== this._transactingType) {
                value.ids.forEach((id: string) => {
                    let element = document.getElementById(id) as PayTheoryHostedFieldTransactional
                    if (element && !element?.ready) {
                        sendReadyMessage = false
                    }
                })
            }

        }
        // If all other transacting elements are ready, send the ready message
        if (sendReadyMessage) {
            window.postMessage({
                    type: 'pay-theory:ready',
                    data: true
                },
                window.location.origin,
            )

            if(this._readyChannel) {
                window.postMessage({
                        type: 'pay-theory:ready-channel',
                        data: true
                }, window.location.origin, [this._readyChannel])
            }
        }
    }

    set apiKey(value: string) {
      this._apiKey = value
    }

    set metadata(value: { [key: string | number]: string | number | boolean } | undefined) {
        this._metadata = value
    }

    get initialized() {
        return this._initialized
    }

    set initialized(value: boolean) {
        this._initialized = value
    }

    set processedElements(value: Partial<Array<ElementTypes>>) {
        this._processedElements = value
    }

    get ready() {
        return this._isReady
    }

    get stateGroup() {
        return this._stateGroup
    }

    set state(value: IncomingFieldState | undefined) {
        // Check to see if the state object has an element property and if it is in the state group
        if (value && value.element && value.element in this._stateGroup) {
            // Update the state group with the new state
            this._stateGroup[value.element] = value
            this.sendStateMessage()

            // Check to see if the field has error messages and if so set the error message or clear it if the field is dirty
            const invalid = value.errorMessages.length > 0
            if (value.isDirty && invalid) {
                this.error = value.errorMessages[0]
            } else if (value.isDirty) {
                this.error = ""
            }

            // Check for update to field validity and if there is an update, update the isValid property and send the valid message
            let calculatedValid = this._requiredValidFields.reduce((acc, curr) => {
                if(this._processedElements.includes(curr)) {
                    return acc && this._stateGroup[curr]!.isDirty && this._stateGroup[curr]!.errorMessages.length === 0
                } else {
                    return acc
                }
            }, true)
            if(this._isValid !== calculatedValid) {
                this._isValid = calculatedValid
                this.sendValidMessage()
            }
        }
    }

    get error() {
        return this._error;
    }

    set error(value) {
        if (this._error !== value) {
            this._error = value;
            window.postMessage({
                    type: 'pt:error',
                    error: value,
                },
                window.location.origin,
            );
        }
    }

    get fieldTypes() {
        return this._fieldTypes
    }

    set removeEventListeners(value: () => void) {
        this._removeEventListeners = value
    }

    set feeMode(value: typeof common.SERVICE_FEE | typeof common.MERCHANT_FEE | undefined) {
        this._feeMode = value
    }

    get feeMode() {
        return this._feeMode
    }

    get valid() {
        return this._isValid
    }

    get complete() {
        return this._completed
    }

    set complete(value: boolean) {
        this._completed = value
    }
}

export default PayTheoryHostedFieldTransactional
