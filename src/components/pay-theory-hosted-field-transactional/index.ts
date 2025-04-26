/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */

import PayTheoryHostedField from '../pay-theory-hosted-field';
import common from '../../common';
import {
  achFieldTypes,
  BANK_IFRAME,
  CARD_IFRAME,
  cardFieldTypes,
  CASH_IFRAME,
  cashFieldTypes,
  defaultFeeMode,
  eftFieldTypes,
  ElementTypes,
  TransactingType,
  transactingWebComponentMap,
} from '../../common/data';
import {
  AsyncMessage,
  handleTypedError,
  postMessageToHostedField,
  sendAsyncPostMessage,
} from '../../common/message';
import {
  CashBarcodeMessage,
  ConfirmationMessage,
  ERROR_STEP,
  ErrorMessage,
  FailedTransactionMessage,
  PayTheoryDataObject,
  SuccessfulTransactionMessage,
  TokenizedPaymentMethodMessage,
} from '../../common/format';
import {
  BillingInfo,
  ErrorResponse,
  ErrorType,
  FieldState,
  PayorInfo,
  ResponseMessageTypes,
  StateObject,
} from '../../common/pay_theory_types';

export interface IncomingFieldState extends FieldState {
  element?: ElementTypes;
  isConnected?: boolean;
}

export interface TransactDataObject {
  amount: number;
  payorInfo: PayorInfo;
  payTheoryData: PayTheoryDataObject;
  metadata?: Record<string | number, string | number | boolean>;
  fee_mode?: typeof common.MERCHANT_FEE | typeof common.SERVICE_FEE;
  confirmation?: boolean;
}

export interface TokenizeDataObject {
  payorInfo?: PayorInfo;
  metadata?: Record<string | number, string | number | boolean>;
  payorId?: string;
  billingInfo?: BillingInfo;
  skipValidation?: boolean;
}

interface ConstructorProps {
  transactingIFrameId: typeof CARD_IFRAME | typeof BANK_IFRAME | typeof CASH_IFRAME;
  stateGroup: Partial<StateObject>;
  transactingType: TransactingType;
}

interface ConnectedMessage {
  type: 'pt-static:connected';
  element: ElementTypes;
}

interface ReadyResponse {
  type: 'READY';
  element: ElementTypes;
}

class PayTheoryHostedFieldTransactional extends PayTheoryHostedField {
  // Used to fetch the pt-token attribute to initialize the hosted field
  protected _apiKey: string | undefined;
  protected _challengeOptions: object | undefined;
  protected _session: string | undefined;

  // Used to track the metadata that is passed in for a session
  protected _metadata: Record<string | number, string | number | boolean> | undefined;

  // Used to track if the transact or tokenize function has been called, and we are awaiting a response
  protected _initialized = false;
  protected _completed = false;

  // Used to track if the element was the one that was used when transact was called
  protected _isTransactingElement = false;

  // Used to track if the element is ready to communicate with the transacting iframe
  protected _isReady = false;
  protected _readyPort: MessagePort | undefined;

  // Used to track if the socket is connected
  protected _isConnected = false;

  // List of fields that are a part of this group used to transact for this transactional element
  protected _fieldTypes: ElementTypes[];

  // Used to track what elements are being used for the transaction
  protected _processedElements: Partial<ElementTypes[]> = [];

  // Used to track the state of the elements that are being used for the transaction of this transactional element
  protected _stateGroup: Partial<StateObject>;

  // Used to track the error message for the element
  protected _error: string | undefined;

  // Used to track if the transactional element is valid
  protected _requiredValidFields: ElementTypes[];
  protected _isValid = false;

  // Help to track the transacting type of the transactional element
  protected _transactingIFrameId: typeof CARD_IFRAME | typeof BANK_IFRAME | typeof CASH_IFRAME;
  protected _transactingType: TransactingType;

  // Function used to remove event listeners
  protected _removeEventListeners: (() => void) | undefined;
  protected _removeHostTokenListener: (() => void) | undefined;
  protected _removeFeeListener: (() => void) | undefined;
  protected _removeFeeCalcReconnect: (() => void) | undefined;

  // Used for backwards compatibility with feeMode
  protected _feeMode: typeof common.SERVICE_FEE | typeof common.MERCHANT_FEE | undefined;

  protected _fee: number | undefined;

  constructor(props: ConstructorProps) {
    super();
    this.transact = this.transact.bind(this) as () => Promise<
      | ConfirmationMessage
      | SuccessfulTransactionMessage
      | FailedTransactionMessage
      | CashBarcodeMessage
      | ErrorMessage
    >;
    this.resetToken = this.resetToken.bind(this) as () => Promise<ErrorResponse | ReadyResponse>;
    this.capture = this.capture.bind(this) as () => Promise<
      FailedTransactionMessage | ErrorMessage
    >;
    this.cancel = this.cancel.bind(this) as () => Promise<true | ErrorResponse>;
    this.tokenize = this.tokenize.bind(this) as () => Promise<
      TokenizedPaymentMethodMessage | ErrorMessage
    >;
    this.sendValidMessage = this.sendValidMessage.bind(this) as () => void;
    this.sendStateMessage = this.sendStateMessage.bind(this) as () => void;
    this.sendValidMessage = this.sendValidMessage.bind(this) as () => void;
    this.sendPtToken = this.sendPtToken.bind(this) as () => Promise<ReadyResponse | ErrorResponse>;
    this.handleFeeMessage = this.handleFeeMessage.bind(this) as (message: {
      type: string;
      body: { fee: number; payment_type: string };
      field: ElementTypes;
    }) => void;
    this.handleFeeCalcReconnect = this.handleFeeCalcReconnect.bind(this) as (message: {
      type: string;
      field: ElementTypes;
    }) => Promise<void>;
    this._transactingIFrameId = props.transactingIFrameId;
    this._stateGroup = props.stateGroup;
    this._transactingType = props.transactingType;
  }

  async sendTokenAsync(
    type: `pt-static:connection_token` | `pt-static:reset_host`,
  ): Promise<ErrorResponse | ReadyResponse> {
    try {
      console.log(`[PT Debug] sendTokenAsync called with type: ${type}`);
      console.log(
        `[PT Debug] API Key present: ${this._apiKey ? 'YES' : 'NO'}, Session present: ${this._session ? 'YES' : 'NO'}`,
      );
      const ptToken = await common.fetchPtToken(this._apiKey ?? '', this._session);
      console.log(`[PT Debug] fetchPtToken result: ${ptToken ? 'SUCCESS' : 'FAILURE'}`);
      if (ptToken) {
        this._challengeOptions = ptToken.challengeOptions;
        const transactingIFrame = document.getElementById(this._transactingIFrameId) as
          | HTMLIFrameElement
          | undefined;
        if (transactingIFrame) {
          console.log(`[PT Debug] Found transacting iframe with id: ${this._transactingIFrameId}`);
          const message: AsyncMessage = {
            type: type,
            data: {
              token: ptToken['pt-token'],
              origin: ptToken.origin,
              fields: this._processedElements,
            },
            async: true,
          };
          console.log(`[PT Debug] Sending message to iframe: ${type} with token`);
          const response = await sendAsyncPostMessage<ErrorMessage | ConnectedMessage>(
            message,
            transactingIFrame,
          );
          console.log(`[PT Debug] Response from iframe:`, response);
          if (response.type === ERROR_STEP) {
            console.error(`[PT Debug] Error response from iframe:`, response);
            return handleTypedError(ErrorType.NO_TOKEN, 'Unable validate connection token');
          }

          // Mark it as ready if it is the transacting element
          if (!this._isReady) {
            this._isReady = true;
            this.sendReadyMessage();
          }

          this._isConnected = true;
          console.log(`[PT Debug] Connection established successfully`);

          return {
            type: 'READY',
            element: response.element,
          };
        } else {
          console.error(
            `[PT Debug] Transacting iframe not found with id: ${this._transactingIFrameId}`,
          );
          return handleTypedError(ErrorType.NO_TOKEN, 'Unable to find transacting iframe');
        }
      } else {
        console.error('[PT Debug] Failed to fetch pt-token');
        return handleTypedError(ErrorType.NO_TOKEN, 'Unable to fetch pt-token');
      }
    } catch (e) {
      console.error(`[PT Debug] Exception in sendTokenAsync:`, e);
      return handleTypedError(ErrorType.NO_TOKEN, 'Unable to fetch pt-token');
    }
  }

  async resetToken() {
    return this.sendTokenAsync(`pt-static:reset_host`);
  }

  async sendPtToken() {
    return this.sendTokenAsync(`pt-static:connection_token`);
  }

  handleFeeMessage(message: {
    type: string;
    body: {
      fee: number;
      payment_type: string;
    };
    field: ElementTypes;
  }) {
    if (this._fieldTypes.includes(message.field)) {
      this._fee = message.body.fee;
      this.sendStateMessage();
    }
  }

  async handleFeeCalcReconnect(message: { type: string; field: ElementTypes }) {
    if (this._fieldTypes.includes(message.field)) {
      const result = await this.resetToken();
      if (result.type === ResponseMessageTypes.READY) {
        postMessageToHostedField(this._transactingIFrameId, {
          type: 'pt-static:update-amount',
          amount: this._amount,
        });
      }
    }
  }

  connectedCallback() {
    console.log(`[PT Debug] connectedCallback triggered for ${this._transactingIFrameId}`);
    // Set up a listener for the hosted field to message saying it is ready for the pt-token to be sent
    this._removeHostTokenListener = common.handleHostedFieldMessage(
      (event: { type: unknown; element: ElementTypes }) => {
        const matches =
          event.type === 'pt-static:pt_token_ready' &&
          this._transactingIFrameId.includes(event.element);
        if (event.type === 'pt-static:pt_token_ready') {
          console.log(
            `[PT Debug] Received pt_token_ready event for element: ${event.element}, matches: ${matches}`,
          );
        }
        return matches;
      },
      () => {
        console.log(
          `[PT Debug] Calling sendPtToken from pt_token_ready handler for ${this._transactingIFrameId}`,
        );
        return this.sendPtToken();
      },
    );

    this._removeFeeListener = common.handleHostedFieldMessage(
      (event: { type: unknown }) => event.type === 'pt-static:calculated_fee',
      (message: {
        type: string;
        body: { fee: number; payment_type: string };
        field: ElementTypes;
      }) => {
        this.handleFeeMessage(message);
      },
    );

    this._removeFeeCalcReconnect = common.handleHostedFieldMessage(
      (event: { type: unknown }) => event.type === 'pt-static:fee_calc_reconnect',
      (message: { type: string; field: ElementTypes }) => this.handleFeeCalcReconnect(message),
    );

    super.connectedCallback();
  }

  disconnectedCallback() {
    if (this._removeEventListeners) this._removeEventListeners();
    if (this._removeHostTokenListener) this._removeHostTokenListener();
    if (this._removeFeeListener) this._removeFeeListener();
    if (this._removeFeeCalcReconnect) this._removeFeeCalcReconnect();
  }

  async transact(data: TransactDataObject, element: PayTheoryHostedFieldTransactional) {
    data.fee_mode = data.fee_mode ?? this._feeMode ?? defaultFeeMode;
    data.metadata = data.metadata ?? this._metadata;
    this._isTransactingElement = true;
    const response = await common.sendTransactingMessage(element, data.payTheoryData.billing_info);
    if (response.type === ERROR_STEP) {
      this._isTransactingElement = false;
      return response;
    }
    const message: AsyncMessage = {
      type: 'pt-static:payment-detail',
      data: data,
      async: true,
    };
    const transactingIFrame = document.getElementById(
      this._transactingIFrameId,
    ) as HTMLIFrameElement;
    return sendAsyncPostMessage<
      | ConfirmationMessage
      | SuccessfulTransactionMessage
      | FailedTransactionMessage
      | CashBarcodeMessage
      | ErrorMessage
    >(message, transactingIFrame);
  }

  capture() {
    const message: AsyncMessage = {
      type: 'pt-static:confirm',
      async: true,
    };
    const transactingIFrame = document.getElementById(
      this._transactingIFrameId,
    ) as HTMLIFrameElement;
    return sendAsyncPostMessage<
      SuccessfulTransactionMessage | FailedTransactionMessage | ErrorMessage
    >(message, transactingIFrame);
  }

  async cancel(): Promise<true | ErrorResponse> {
    const transactingIFrame = document.getElementById(this._transactingIFrameId) as
      | HTMLIFrameElement
      | undefined;
    if (transactingIFrame) {
      transactingIFrame.contentWindow.postMessage(
        {
          type: `pt-static:cancel`,
        },
        common.hostedFieldsEndpoint,
      );
      const result = await this.resetToken();
      if (result.type === ResponseMessageTypes.READY) {
        this._isTransactingElement = false;
        this.initialized = false;
        // Successfully sent the cancel message and reset the token
        return true;
      } else {
        // Successfully sent the cancel message but failed to reset the token
        return handleTypedError(ErrorType.CANCEL_FAILED, 'Failed to reset token');
      }
    } else {
      // Failed to find the transacting iframe to send the cancel message
      return handleTypedError(ErrorType.CANCEL_FAILED, 'Failed to find transacting iframe');
    }
  }

  async tokenize(
    data: TokenizeDataObject,
    element: PayTheoryHostedFieldTransactional,
  ): Promise<TokenizedPaymentMethodMessage | ErrorMessage> {
    this._isTransactingElement = true;
    this._initialized = true;
    const response = await common.sendTransactingMessage(element, data.billingInfo);
    if (response.type === ERROR_STEP) {
      this._isTransactingElement = false;
      return response;
    }
    const message: AsyncMessage = {
      type: 'pt-static:tokenize-detail',
      data: data,
      async: true,
    };
    const transactingIFrame = document.getElementById(
      this._transactingIFrameId,
    ) as HTMLIFrameElement;
    return sendAsyncPostMessage<TokenizedPaymentMethodMessage | ErrorMessage>(
      message,
      transactingIFrame,
    );
  }

  sendStateMessage() {
    // Make a copy of the state group
    const newState: Partial<StateObject> = {
      ...this._stateGroup,
      service_fee: {
        amount: this._amount,
        card_fee: undefined,
        ach_fee: undefined,
        bank_fee: undefined,
      },
    };

    if (this._fee !== undefined && this._transactingType !== 'cash') {
      newState.service_fee[`${this._transactingType}_fee`] = this._fee;
      // This is for backwards compatibility with the bank fee
      if (this._transactingType === 'bank') {
        newState.service_fee.ach_fee = this._fee;
      }
    }

    // Loop through all the other transacting elements and add their state to the state group or use the default state
    for (const [key, value] of Object.entries(transactingWebComponentMap)) {
      if (key !== this._transactingType) {
        const transactingTypesState = value.ids.reduce((acc: unknown, id: string) => {
          const element = document.getElementsByName(id);
          if (element.length > 0) {
            const transactingElement = element[0] as PayTheoryHostedFieldTransactional;
            // Check for service fee and add it to the state group
            if (transactingElement.fee && transactingElement.transactingType !== 'cash') {
              newState.service_fee[`${transactingElement.transactingType}_fee`] =
                transactingElement.fee;
              // This is for backwards compatibility with the bank fee
              if (transactingElement.transactingType === 'bank') {
                newState.service_fee.ach_fee = transactingElement.fee;
              }
            }
            return transactingElement.stateGroup;
          } else {
            return acc;
          }
        }, value.defaultState);
        Object.assign(newState, transactingTypesState);
      }
    }
    // Send the state message
    window.postMessage(
      {
        type: 'pay-theory:state',
        data: newState,
      },
      window.location.origin,
    );
  }

  sendValidMessage() {
    // If element is valid include it in the valid string
    let valid: string = this._isValid ? this._transactingType : '';
    // Check to see if all other transacting elements are valid
    for (const [key, value] of Object.entries(transactingWebComponentMap)) {
      if (key !== this._transactingType) {
        value.ids.forEach((id: string) => {
          const elements = document.getElementsByName(id);
          if (elements.length > 0) {
            const transactingElement = elements[0] as PayTheoryHostedFieldTransactional;
            if (transactingElement.valid) {
              // If other transacting elements are valid include them in the valid string
              valid = valid + ' ' + transactingElement._transactingType;
            }
          }
        });
      }
    }

    // Ensure that if we pass a valid string that includes bank that we also pass back ACH for backwards compatibility
    if (valid.includes('bank')) {
      valid = valid + ' ach';
    }

    // Send the updated valid string
    window.postMessage(
      {
        type: 'pay-theory:valid',
        data: valid,
      },
      window.location.origin,
    );
  }

  sendReadyMessage() {
    let sendReadyMessage = true;
    // Check to see if all other transacting elements are ready
    for (const [key, value] of Object.entries(transactingWebComponentMap)) {
      if (key !== this._transactingType) {
        value.ids.forEach((id: string) => {
          const element = document.getElementsByName(id);
          if (element.length > 0) {
            const transactingElement = element[0] as PayTheoryHostedFieldTransactional | undefined;
            if (!transactingElement?.ready) {
              sendReadyMessage = false;
            }
          }
        });
      }
    }
    // If all other transacting elements are ready, send the ready message
    if (sendReadyMessage) {
      window.postMessage(
        {
          type: 'pay-theory:ready',
          data: true,
        },
        window.location.origin,
      );

      if (this._readyPort) {
        this._readyPort.postMessage({
          type: 'pay-theory:ready-channel',
          data: true,
        });
      }
    }
  }

  set apiKey(value: string) {
    console.log(`[PT Debug] Setting apiKey: ${value ? 'PROVIDED' : 'EMPTY'}`);
    this._apiKey = value;
  }

  set readyPort(value: MessagePort) {
    this._readyPort = value;
  }

  set metadata(value: Record<string | number, string | number | boolean> | undefined) {
    this._metadata = value;
  }

  get initialized() {
    return this._initialized;
  }

  set initialized(value: boolean) {
    this._initialized = value;
  }

  set processedElements(value: Partial<ElementTypes[]>) {
    this._processedElements = value;
  }

  get ready() {
    return this._isReady;
  }

  get connected() {
    return this._isConnected;
  }

  set connected(value: boolean) {
    this._isConnected = value;
  }

  get stateGroup() {
    return this._stateGroup;
  }

  set state(value: IncomingFieldState | undefined) {
    // Check to see if the state object has an element property and if it is in the state group
    if (value?.element in this._stateGroup) {
      // Update the state group with the new state
      this._stateGroup[value.element] = value;
      this.sendStateMessage();

      // Check to see if the field has error messages and if so set the error message or clear it if the field is dirty
      const invalid = value.errorMessages.length > 0;
      if (value.isDirty && invalid) {
        this.error = value.errorMessages[0];
      } else if (value.isDirty) {
        this.error = '';
      }

      // Check for update to field validity and if there is an update, update the isValid property and send the valid message
      const fieldsToCheck = [...this._processedElements];
      // Make sure we are checking the state for all the fields in the combined card field
      if (fieldsToCheck.includes('credit-card')) {
        fieldsToCheck.push('card-number');
        fieldsToCheck.push('card-exp');
        fieldsToCheck.push('card-cvv');
      }
      const calculatedValid = this._requiredValidFields.reduce((acc, curr) => {
        if (fieldsToCheck.includes(curr)) {
          return (
            acc &&
            this._stateGroup[curr].isDirty &&
            this._stateGroup[curr].errorMessages.length === 0
          );
        } else {
          return acc;
        }
      }, true);
      if (this._isValid !== calculatedValid) {
        this._isValid = calculatedValid;
        this.sendValidMessage();
      }
    }
  }

  get error() {
    return this._error;
  }

  set error(value) {
    if (this._error !== value) {
      this._error = value;
      window.postMessage(
        {
          type: 'pt:error',
          error: value,
        },
        window.location.origin,
      );
    }
  }

  get fieldTypes() {
    return this._fieldTypes;
  }

  set removeEventListeners(value: () => void) {
    this._removeEventListeners = value;
  }

  set feeMode(value: typeof common.SERVICE_FEE | typeof common.MERCHANT_FEE | undefined) {
    this._feeMode = value;
  }

  get feeMode() {
    return this._feeMode;
  }

  get fee() {
    return this._fee;
  }

  set fee(value: number | undefined) {
    this._fee = value;
    // Send the state message if the fee is updated
    this.sendStateMessage();
  }

  get transactingType() {
    return this._transactingType;
  }

  get valid() {
    return this._isValid;
  }

  get complete() {
    return this._completed;
  }

  set complete(value: boolean) {
    this._completed = value;
  }

  set amount(value: number | undefined) {
    this._amount = value;
    if (this._isReady) {
      // If the element is ready, send the amount to the transacting iframe
      postMessageToHostedField(this._transactingIFrameId, {
        type: 'pt-static:update-amount',
        amount: value,
      });
    }
  }

  get amount() {
    return this._amount;
  }

  set session(value: string) {
    console.log(`[PT Debug] Setting session: ${value ? 'PROVIDED' : 'EMPTY'}`);
    this._session = value;
  }

  set country(value: string) {
    this._country = value;
    // When the country is set we should also set the required fields for the element
    switch (this._transactingIFrameId) {
      case CARD_IFRAME:
        this._fieldTypes = [...cardFieldTypes.transacting, ...cardFieldTypes.siblings];
        this._requiredValidFields = ['card-number', 'card-cvv', 'card-exp', 'billing-zip'];
        break;
      case BANK_IFRAME:
        if (value === 'CAN') {
          this._fieldTypes = [...eftFieldTypes.transacting, ...eftFieldTypes.siblings];
          this._requiredValidFields = [
            'account-number',
            'account-name',
            'account-type',
            'institution-number',
            'transit-number',
          ];
        } else {
          this._fieldTypes = [...achFieldTypes.transacting, ...achFieldTypes.siblings];
          this._requiredValidFields = [
            'account-number',
            'account-name',
            'account-type',
            'routing-number',
          ];
        }
        break;
      case CASH_IFRAME:
        this._fieldTypes = [...cashFieldTypes.transacting, ...cashFieldTypes.siblings];
        this._requiredValidFields = ['cash-name', 'cash-contact'];
        break;
    }
  }
}

export default PayTheoryHostedFieldTransactional;
