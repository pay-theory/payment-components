export const defaultStyles = {
  default: {},
  success: {},
  error: {},
};
export const SURCHARGE = 'merchant_fee';
export const INTERCHANGE = 'merchant_fee';
export const MERCHANT_FEE = 'merchant_fee';
export const SERVICE_FEE = 'service_fee';
export const defaultFeeMode = SURCHARGE;

// Call to action constants for the hosted checkout and button
export const PAY = 'PAY';
export const BOOK = 'BOOK';
export const DONATE = 'DONATE';
export const CHECKOUT = 'CHECKOUT';
// export type CALL_TO_ACTION = typeof PAY | typeof BOOK | typeof DONATE | typeof CHECKOUT;

export const CTA_TYPES = [PAY, BOOK, DONATE];

// Available Payment Method Constants for the hosted checkout
export const ALL = 'ALL';
export const NOT_CASH = 'NOT_CASH';
export const NOT_CARD = 'NOT_CARD';
export const NOT_ACH = 'NOT_ACH';
export const ONLY_CASH = 'ONLY_CASH';
export const ONLY_CARD = 'ONLY_CARD';
export const ONLY_ACH = 'ONLY_ACH';

// Color constants for the button
export const WHITE = 'white';
export const BLACK = 'black';
export const GREY = 'grey';
export const PURPLE = 'purple';

export const PAYMENT_METHOD_CONFIGS = [
  ALL,
  NOT_CASH,
  NOT_CARD,
  NOT_ACH,
  ONLY_CASH,
  ONLY_CARD,
  ONLY_ACH,
];

export const initialState: {
  isDirty: boolean;
  isFocused: boolean;
  errorMessages: string[];
} = {
  isDirty: false,
  isFocused: false,
  errorMessages: [],
};

export const initialCardState: Partial<Record<ElementTypes, typeof initialState>> = {
  'card-number': initialState,
  'card-exp': initialState,
  'card-cvv': initialState,
  'card-name': initialState,
  'billing-line1': initialState,
  'billing-line2': initialState,
  'billing-city': initialState,
  'billing-state': initialState,
  'billing-zip': initialState,
};

export const initialBankState: Partial<Record<ElementTypes, typeof initialState>> = {
  'account-number': initialState,
  'account-type': initialState,
  'account-name': initialState,
  'routing-number': initialState,
  'institution-number': initialState,
  'transit-number': initialState,
};

export const initialCashState: Partial<Record<ElementTypes, typeof initialState>> = {
  'cash-name': initialState,
  'cash-contact': initialState,
};

export const defaultElementIds = {
  // Card Element Ids
  'credit-card': 'pay-theory-credit-card',
  number: 'pay-theory-credit-card-number',
  exp: 'pay-theory-credit-card-exp',
  cvv: 'pay-theory-credit-card-cvv',
  'account-name': 'pay-theory-credit-card-account-name',
  'address-1': 'pay-theory-credit-card-address-1',
  'address-2': 'pay-theory-credit-card-address-2',
  city: 'pay-theory-credit-card-city',
  state: 'pay-theory-credit-card-state',
  zip: 'pay-theory-credit-card-zip',
  // ACH Element Ids
  'account-number': 'pay-theory-ach-account-number',
  'ach-name': 'pay-theory-ach-account-name',
  'routing-number': 'pay-theory-ach-routing-number',
  'account-type': 'pay-theory-ach-account-type',
  // EFT Element Ids
  'bank-account-number': 'pay-theory-bank-account-number',
  'bank-account-name': 'pay-theory-bank-account-name',
  'bank-account-type': 'pay-theory-bank-account-type',
  'bank-institution-number': 'pay-theory-bank-institution-number',
  'bank-transit-number': 'pay-theory-bank-transit-number',
  // Cash Element Ids
  'cash-name': 'pay-theory-cash-name',
  'cash-contact': 'pay-theory-cash-contact',
  // Card Present Element Id
  'card-present': 'pay-theory-card-present',
};

export interface achElementIds {
  'account-number': string;
  'account-name': string;
  'routing-number': string;
  'account-type': string;
}

export interface cardElementIds {
  'credit-card': string;
  'card-number': string;
  'card-exp': string;
  'card-cvv': string;
  'card-name': string;
  'billing-line1': string;
  'billing-line2': string;
  'billing-city': string;
  'billing-state': string;
  'billing-zip': string;
}

export interface cashElementIds {
  'cash-name': string;
  'cash-contact': string;
}

export interface eftElementIds {
  'account-number': string;
  'account-name': string;
  'account-type': string;
  'institution-number': string;
  'transit-number': string;
}

export type ElementTypes =
  | keyof achElementIds
  | keyof cardElementIds
  | keyof cashElementIds
  | keyof eftElementIds;

export const checkoutButtonField = 'pay-theory-checkout-button';
export const checkoutQRField = 'pay-theory-checkout-qr';
export const payTheoryOverlay = 'pay-theory-overlay';

export const achFieldTypes: {
  transacting: (keyof achElementIds)[];
  siblings: (keyof achElementIds)[];
} = {
  transacting: ['account-number'],
  siblings: ['account-name', 'account-type', 'routing-number'],
};

export const eftFieldTypes: {
  transacting: (keyof eftElementIds)[];
  siblings: (keyof eftElementIds)[];
} = {
  transacting: ['account-number'],
  siblings: ['account-name', 'account-type', 'institution-number', 'transit-number'],
};

export const cashFieldTypes: {
  transacting: (keyof cashElementIds)[];
  siblings: (keyof cashElementIds)[];
} = {
  transacting: ['cash-name'],
  siblings: ['cash-contact'],
};

// export const cardPresentFieldTypes: {
//   transacting: 'card-present'[];
//   siblings: string[];
// } = {
//   transacting: ['card-present'],
//   siblings: [],
// };

export const cardFieldTypes: {
  transacting: (keyof cardElementIds)[];
  siblings: (keyof cardElementIds)[];
} = {
  transacting: ['credit-card', 'card-number'],
  siblings: [
    'card-cvv',
    'card-exp',
    'card-name',
    'billing-line1',
    'billing-line2',
    'billing-city',
    'billing-state',
    'billing-zip',
  ],
};

export const BANK_IFRAME = 'account-number-iframe';
export const CARD_IFRAME = 'card-number-iframe';
export const CASH_IFRAME = 'cash-name-iframe';
export type TransactingType = 'card' | 'bank' | 'cash';

export const hostedFieldMap: Record<TransactingType, string> = {
  cash: CASH_IFRAME,
  card: CARD_IFRAME,
  bank: BANK_IFRAME,
};

const isCardField = (string: ElementTypes) => {
  return (
    cardFieldTypes.transacting.includes(string as keyof cardElementIds) ||
    cardFieldTypes.siblings.includes(string as keyof cardElementIds)
  );
};
const isCashField = (string: ElementTypes) => {
  return (
    cashFieldTypes.transacting.includes(string as keyof cashElementIds) ||
    cashFieldTypes.siblings.includes(string as keyof cashElementIds)
  );
};

const isBankField = (string: ElementTypes) => {
  return (
    achFieldTypes.transacting.includes(string as keyof achElementIds) ||
    achFieldTypes.siblings.includes(string as keyof achElementIds) ||
    eftFieldTypes.transacting.includes(string as keyof eftElementIds) ||
    eftFieldTypes.siblings.includes(string as keyof eftElementIds)
  );
};

const isFieldType = (type: ElementTypes): TransactingType | false => {
  if (isCardField(type)) return 'card';
  if (isCashField(type)) return 'cash';
  if (isBankField(type)) return 'bank';
  return false;
};

export { isCardField, isBankField, isCashField, isFieldType };

// ID's for the custom web components
// Bank Element Ids
export const BANK_ACCOUNT_NAME = 'pay-theory-bank-account-name-tag-frame';
export const BANK_ACCOUNT_NUMBER = 'pay-theory-bank-account-number-tag-frame';
export const BANK_ACCOUNT_TYPE = 'pay-theory-bank-account-type-tag-frame';
export const BANK_ROUTING_NUMBER = 'pay-theory-bank-routing-number-tag-frame';
export const BANK_INSTITUTION_NUMBER = 'pay-theory-bank-institution-number-tag-frame';
export const BANK_TRANSIT_NUMBER = 'pay-theory-bank-transit-number-tag-frame';

// Cash Element Ids
export const CASH_CONTACT = 'pay-theory-cash-contact-tag-frame';
export const CASH_NAME = 'pay-theory-cash-name-tag-frame';

// Card Element Ids
export const COMBINED_CARD = 'pay-theory-credit-card-tag-frame';
export const CARD_NAME = 'pay-theory-credit-card-card-name-tag-frame';
export const CARD_BILLING_LINE1 = 'pay-theory-credit-card-billing-line1-tag-frame';
export const CARD_BILLING_LINE2 = 'pay-theory-credit-card-billing-line2-tag-frame';
export const CARD_BILLING_CITY = 'pay-theory-credit-card-billing-city-tag-frame';
export const CARD_BILLING_STATE = 'pay-theory-credit-card-billing-state-tag-frame';
export const CARD_BILLING_ZIP = 'pay-theory-credit-card-billing-zip-tag-frame';
export const CARD_CVV = 'pay-theory-credit-card-card-cvv-tag-frame';
export const CARD_EXP = 'pay-theory-credit-card-card-exp-tag-frame';
export const CARD_NUMBER = 'pay-theory-credit-card-card-number-tag-frame';

export const transactingWebComponentIds = [
  BANK_ACCOUNT_NUMBER,
  CASH_NAME,
  COMBINED_CARD,
  CARD_NUMBER,
];
export const achWebComponentIds = [
  BANK_ACCOUNT_NAME,
  BANK_ACCOUNT_NUMBER,
  BANK_ACCOUNT_TYPE,
  BANK_ROUTING_NUMBER,
];
export const eftWebComponentIds = [
  BANK_ACCOUNT_NUMBER,
  BANK_ACCOUNT_NAME,
  BANK_ACCOUNT_TYPE,
  BANK_INSTITUTION_NUMBER,
  BANK_TRANSIT_NUMBER,
];
export const cashWebComponentIds = [CASH_CONTACT, CASH_NAME];
export const cardWebComponentIds = [
  COMBINED_CARD,
  CARD_NAME,
  CARD_BILLING_LINE1,
  CARD_BILLING_LINE2,
  CARD_BILLING_CITY,
  CARD_BILLING_STATE,
  CARD_BILLING_ZIP,
  CARD_CVV,
  CARD_EXP,
  CARD_NUMBER,
];

export type webComponentIds =
  | (typeof achWebComponentIds)[number]
  | (typeof cashWebComponentIds)[number]
  | (typeof cardWebComponentIds)[number]
  | (typeof eftWebComponentIds)[number];

export const webComponentMap: Record<ElementTypes, webComponentIds> = {
  'account-name': BANK_ACCOUNT_NAME,
  'account-number': BANK_ACCOUNT_NUMBER,
  'account-type': BANK_ACCOUNT_TYPE,
  'routing-number': BANK_ROUTING_NUMBER,
  'institution-number': BANK_INSTITUTION_NUMBER,
  'transit-number': BANK_TRANSIT_NUMBER,
  'cash-contact': CASH_CONTACT,
  'cash-name': CASH_NAME,
  'card-cvv': CARD_CVV,
  'card-exp': CARD_EXP,
  'card-name': CARD_NAME,
  'card-number': CARD_NUMBER,
  'billing-line1': CARD_BILLING_LINE1,
  'billing-line2': CARD_BILLING_LINE2,
  'billing-city': CARD_BILLING_CITY,
  'billing-state': CARD_BILLING_STATE,
  'billing-zip': CARD_BILLING_ZIP,
  'credit-card': COMBINED_CARD,
};

export const transactingWebComponentMap: Record<
  TransactingType,
  {
    ids: (typeof transactingWebComponentIds)[number][];
    defaultState: typeof initialCardState | typeof initialBankState | typeof initialCashState;
  }
> = {
  bank: {
    ids: [BANK_ACCOUNT_NUMBER],
    defaultState: initialBankState,
  },
  cash: {
    ids: [CASH_NAME],
    defaultState: initialCashState,
  },
  card: {
    ids: [COMBINED_CARD, CARD_NUMBER],
    defaultState: initialCardState,
  },
};
