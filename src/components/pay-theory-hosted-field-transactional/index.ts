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

type ConnectedMessage = {
    type: 'pt-static:connected',
    element: ElementTypes
}

type ReadyResponse = {
    type: 'READY',
    element: ElementTypes
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

    // Used to track if the element is ready to communicate with the transacting iframe
    protected _isReady: boolean = false
    protected _readyPort: MessagePort | undefined

    // Used to track if the socket is connected
    protected _isConnected: boolean = false

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
    protected _removeFeeListener: () => void = () => {}

    // Used for backwards compatibility with feeMode
    protected _feeMode: typeof common.SERVICE_FEE | typeof common.MERCHANT_FEE | undefined

    protected _fee: number | undefined;

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
        this.handleFeeMessage = this.handleFeeMessage.bind(this)
        this._fieldTypes = props.fieldTypes
        this._requiredValidFields = props.requiredValidFields
        this._transactingIFrameId = props.transactingIFrameId
        this._stateGroup = props.stateGroup
        this._transactingType = props.transactingType
    }

    async sendTokenAsync(type: `pt-static:connection_token` | `pt-static:reset_host`): Promise<ErrorResponse | ReadyResponse> {
        const ptToken = await common.fetchPtToken(this._apiKey!)
        if (ptToken) {
            this._challengeOptions = ptToken['challengeOptions']
            const transactingIFrame = document.getElementById(this._transactingIFrameId) as HTMLIFrameElement
            if (transactingIFrame) {
                const message: AsyncMessage = {
                    type: type,
                    data: {
                        token: ptToken['pt-token'],
                        origin: ptToken['origin'],
                        fields: this._processedElements
                    },
                    async: true
                }
                let response = await sendAsyncPostMessage<ErrorMessage | ConnectedMessage>(message, transactingIFrame)
                if(response.type === ERROR_STEP) {
                    return handleTypedError(ErrorType.NO_TOKEN, 'Unable validate connection token')
                }

                // Mark it as ready if it is the transacting element
                if(!this._isReady) {
                    this._isReady = true
                    this.sendReadyMessage()
                }

                this._isConnected = true

                return {
                    type: 'READY',
                    element: response.element
                }
            } else {
                return handleTypedError(ErrorType.NO_TOKEN, 'Unable to find transacting iframe')
            }
        } else {
            return handleTypedError(ErrorType.NO_TOKEN, 'Unable to fetch pt-token')
        }
    }

    async resetToken() {
        return this.sendTokenAsync(`pt-static:reset_host`)
    }

    async sendPtToken() {
        return this.sendTokenAsync(`pt-static:connection_token`)
    }

    handleFeeMessage(message: {
        type: string;
        body: {
            fee: number;
            payment_type: string;
        };
        field: ElementTypes;
    }) {
        if(this._fieldTypes.includes(message.field)) {
            this._fee = message.body.fee
            this.sendStateMessage()
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

        this._removeFeeListener = common.handleHostedFieldMessage((event: {
            type: any,
        }) => event.type === 'pt-static:calculated_fee', this.handleFeeMessage)

        await super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._removeEventListeners();
        this._removeHostTokenListener();
        this._removeFeeListener();
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
        const newState: Partial<StateObject> = {
            ...this._stateGroup,
            service_fee: {
                amount: this._amount,
                card_fee: undefined,
                ach_fee: undefined,
            }
        }

        if(this._fee !== undefined && this._transactingType !== 'cash') {
            newState.service_fee[`${this._transactingType}_fee`] = this._fee
        }

        // Loop through all the other transacting elements and add their state to the state group or use the default state
        for(let [key, value] of Object.entries(transactingWebComponentMap)) {
            if (key !== this._transactingType) {
                let transactingTypesState = value.ids.reduce((acc: any, id: string) => {
                    let element = document.getElementById(id) as PayTheoryHostedFieldTransactional
                    if (element) {
                        // Check for service fee and add it to the state group
                        if(element.fee && element.transactingType !== 'cash') {
                            newState.service_fee[`${element.transactingType}_fee`] = element.fee
                        }
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

            if(this._readyPort) {
                this._readyPort.postMessage({
                        type: 'pay-theory:ready-channel',
                        data: true
                })
            }
        }
    }

    set apiKey(value: string) {
      this._apiKey = value
    }

    set readyPort(value: MessagePort) {
        this._readyPort = value
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

    get connected() {
        return this._isConnected
    }

    set connected(value: boolean) {
        this._isConnected = value
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
            const fieldsToCheck = [...this._processedElements]
            // Make sure we are checking the state for all the fields in the combined card field
            if(fieldsToCheck.includes('credit-card')) {
                fieldsToCheck.push('card-number')
                fieldsToCheck.push('card-exp')
                fieldsToCheck.push('card-cvv')
            }
            let calculatedValid = this._requiredValidFields.reduce((acc, curr) => {
                if(fieldsToCheck.includes(curr)) {
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

    get fee() {
        return this._fee
    }

    set fee(value: number | undefined) {
        this._fee = value
    }

    get transactingType() {
        return this._transactingType
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
