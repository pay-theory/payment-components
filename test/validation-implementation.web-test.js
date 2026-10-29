import { expect } from '@open-wc/testing';
import * as valid from '../src/field-set/validation.ts';
import common from '../src/common/index.ts';
import '../src/components/credit-card/index.ts';
import '../src/components/credit-card-number/index.ts';
import '../src/components/credit-card-exp/index.ts';
import '../src/components/credit-card-cvv/index.ts';
import '../src/components/bank-account-number/index.ts';
import '../src/components/bank-account-name/index.ts';
import '../src/components/bank-account-type/index.ts';
import '../src/components/bank-routing-number/index.ts';
import '../src/components/bank-institution-number/index.ts';
import '../src/components/bank-transit-number/index.ts';
import '../src/components/cash-name/index.ts';
import '../src/components/cash-contact/index.ts';

// These are actual production validators and registered custom elements. Financial
// oddities are explicitly characterized, not presented as desired validation policy.
const error = message => ({ type: 'ERROR', error: `INVALID_PARAM: ${message}` });
const fresh = changes => ({
  amount: 100,
  payorInfo: {},
  metadata: {},
  feeMode: 'merchant_fee',
  payTheoryData: {},
  ...changes,
});
const transaction = changes => valid.validTransactionParams(fresh(changes));
const field = type => {
  const element = document.createElement(common.webComponentMap[type]);
  element.id = `pay-theory-${type === 'card-number' ? 'credit-card-number' : type}-tag-frame`;
  return element;
};
const initial = changes => {
  const args = {
    key: 'test-api-key',
    context: undefined,
    mode: undefined,
    metadata: {},
    styles: {},
    amount: undefined,
    country: 'USA',
    ...changes,
  };
  return valid.checkInitialParams(
    args.key,
    args.context,
    args.mode,
    args.metadata,
    args.styles,
    args.amount,
    args.country,
  );
};

describe('actual validation decision tables (VA01–VA14)', () => {
  afterEach(() =>
    document.querySelectorAll('[data-validation-fixture]').forEach(node => node.remove()),
  );
  for (const value of [undefined, null, false, 0, '', {}, []]) {
    it(`VA01 rejects invalid API key ${JSON.stringify(value)}`, () =>
      expect(valid.checkApiKey(value)).to.deep.equal(
        error('API Key is required and must be a string'),
      ));
  }
  for (const value of ['test-api-key', 'test-new-api-key', 'test-old-api-key']) {
    it(`VA01 accepts current and migration API key ${value}`, () =>
      expect(valid.checkApiKey(value)).to.equal(undefined));
  }
  for (const value of ['other-api-key', 'test-prod-key', 'test', 'test-new-prod-key', 'test-old']) {
    it(`VA01 rejects mismatched partner/stage ${value}`, () =>
      expect(valid.checkApiKey(value)).to.deep.equal(
        error('Valid API Key not found. Please provide a valid API Key'),
      ));
  }
  it('VA01 rejects both or neither credential modes before later validation', () => {
    expect(initial({ key: undefined })).to.deep.equal(
      error('Provide either apiKey or checkoutContext.'),
    );
    expect(initial({ context: { invoiceId: 'invoice' } })).to.deep.equal(
      error('Provide either apiKey or checkoutContext (not both).'),
    );
    expect(initial()).to.equal(null);
  });
  for (const selector of ['invoiceId', 'linkId', 'recurringHash', 'sessionId']) {
    it(`VA02 accepts exactly ${selector}, including unrelated properties`, () => {
      expect(initial({ key: undefined, context: { [selector]: 'id', extra: true } })).to.equal(
        null,
      );
    });
  }
  for (const context of [
    {},
    [],
    { invoiceId: '' },
    { invoiceId: 1 },
    { invoiceId: 'i', linkId: 'l' },
    { invoiceId: 'i', linkId: 'l', sessionId: 's' },
  ]) {
    it(`VA02 rejects selector shape ${JSON.stringify(context)}`, () =>
      expect(initial({ key: undefined, context })).to.deep.equal(
        error(
          'Must provide exactly one of checkoutContext.invoiceId, checkoutContext.linkId, checkoutContext.recurringHash, or checkoutContext.sessionId',
        ),
      ));
  }
  it('VA02 falsey/malformed contexts do not activate checkout mode', () => {
    for (const context of [null, undefined, false, '', 42])
      expect(initial({ key: undefined, context })).to.deep.equal(
        error('Provide either apiKey or checkoutContext.'),
      );
  });
  for (const [changes, message] of [
    [
      { mode: 'invalid' },
      "Fee Mode should be either 'merchant_fee' or 'service_fee' which are also available as constants at window.paytheory.MERCHANT_FEE and window.paytheory.SERVICE_FEE",
    ],
    [{ metadata: null }, 'Metadata should be a JSON Object.'],
    [
      { styles: false },
      'Styles should be a JSON Object.\n      An example of the object is at https://docs.paytheory.com/docs/sdk/javascript/hosted_fields#styles-object',
    ],
    [{ country: '' }, 'Country is required and must be a string'],
    [
      { country: 'GBR' },
      'You must pass in a supported country. Contact Pay Theory for more information.',
    ],
  ])
    it(`VA03/04 initial validation ${message.split('.')[0]}`, () =>
      expect(initial(changes)).to.deep.equal(error(message)));
  it('VA03/04 initial defaults, accepted modes, arrays and countries preserve existing acceptance', () => {
    for (const mode of ['merchant_fee', 'service_fee', undefined, '', false])
      expect(initial({ mode })).to.equal(null);
    for (const country of ['USA', 'CAN'])
      expect(initial({ country, metadata: [], styles: [] })).to.equal(null);
    expect(initial({ key: 'wrong-api', metadata: null })).to.deep.equal(
      error('Valid API Key not found. Please provide a valid API Key'),
    );
    expect(initial({ amount: -1 })).to.equal(null); // existing initial validator checks integer, not positivity
  });
  for (const amount of [undefined, null, false, '', '100', 0, NaN])
    it(`VA03 amount type/truthiness ${String(amount)}`, () =>
      expect(valid.isValidAmount(amount)).to.deep.equal(
        error('amount must be a positive integer'),
      ));
  for (const amount of [1.5, Infinity, -Infinity])
    it(`VA03 noninteger ${amount}`, () =>
      expect(valid.isValidAmount(amount)).to.deep.equal(error('amount cannot have a decimal')));
  it('VA03 distinct transaction positivity and integer checks remain visible', () => {
    expect(valid.isValidAmount(-1)).to.equal(null);
    expect(valid.isvalidTransactParams(-1, {}, {})).to.deep.equal(
      error('amount must be a positive integer'),
    );
    expect(valid.isvalidTransactParams(1.5, {}, {})).to.equal(null);
    expect(transaction({ amount: 1.5 })).to.deep.equal(error('amount cannot have a decimal'));
    expect(initial({ amount: 0 }).type).to.equal('ERROR');
  });
  for (const [amount, payor, metadata, missing] of [
    [0, null, null, 'amount metadata payorInfo '],
    [1, {}, null, 'metadata '],
    [1, null, {}, 'payorInfo '],
    [undefined, {}, {}, 'amount '],
  ]) {
    it(`VA14 missing required fields ${missing}`, () =>
      expect(valid.isvalidTransactParams(amount, payor, metadata)).to.deep.equal(
        error('Some required fields are missing or invalid: ' + missing),
      ));
  }
  it('VA14 tokenize required fields are evaluated independently', () => {
    expect(valid.isValidTokenizeParams({}, {})).to.equal(null);
    expect(valid.isValidTokenizeParams(null, null)).to.deep.equal(
      error('Some required fields are missing or invalid: metadata payorInfo '),
    );
    expect(valid.isValidTokenizeParams({}, null).error).to.include('metadata');
    expect(valid.isValidTokenizeParams(null, {}).error).to.include('payorInfo');
  });
  for (const fee of [undefined, null, 0, 10, 0.5, Infinity])
    it(`VA03 characterizes accepted fee ${String(fee)}`, () =>
      expect(valid.isValidFeeAmount(fee)).to.equal(null));
  for (const fee of [-1, NaN, '1', false, {}, []])
    it(`VA03 rejects fee ${String(fee)}`, () =>
      expect(valid.isValidFeeAmount(fee)).to.deep.equal(error('fee must be a positive integer')));
  it('VA03 transaction fee mode permits only declared values', () => {
    for (const mode of ['merchant_fee', 'service_fee'])
      expect(valid.isValidFeeMode(mode)).to.equal(null);
    expect(valid.isValidFeeMode(undefined)).to.deep.equal(
      error('feeMode must be either MERCHANT_FEE or SERVICE_FEE'),
    );
  });
  it('VA05 combined and separated card decisions use real production elements', () => {
    const number = field('card-number'),
      exp = field('card-exp'),
      cvv = field('card-cvv'),
      combined = field('credit-card');
    expect(valid.findCardError([], [])).to.equal(false);
    expect(valid.findCardError([exp], [])).to.equal(
      'missing credit card entry field required for payments',
    );
    expect(valid.findCardError([number], [number])).to.equal(
      'missing credit card expiration field required for payments',
    );
    expect(valid.findCardError([number, exp], [number])).to.equal(
      'missing CVV field required for payments',
    );
    expect(valid.findCardError([number, exp, cvv], [number])).to.equal(false);
    expect(valid.findCardError([combined, exp], [combined])).to.equal(
      'expiration is not allowed when using combined credit card',
    );
    expect(valid.findCardError([combined, cvv], [combined])).to.equal(
      'CVV is not allowed when using combined credit card',
    );
    expect(valid.findCardError([combined], [combined])).to.equal(false);
    const conflict = document.createElement('div');
    conflict.dataset.validationFixture = '';
    conflict.id = 'pay-theory-credit-card';
    document.body.append(conflict);
    expect(valid.findCardNumberError([number, exp, cvv])).to.equal(
      'credit card element is not allowed when using credit card number',
    );
    conflict.id = 'pay-theory-credit-card-number';
    expect(valid.findCombinedCardError([combined])).to.equal(
      'credit card number is not allowed when using combined credit card',
    );
  });
  for (const [name, validator, types] of [
    [
      'ACH',
      valid.findAchError,
      ['account-name', 'account-number', 'account-type', 'routing-number'],
    ],
    [
      'EFT',
      valid.findEftError,
      ['account-name', 'account-number', 'account-type', 'institution-number', 'transit-number'],
    ],
  ]) {
    it(`VA06 ${name} complete and absent layouts`, () => {
      expect(validator([])).to.equal(false);
      expect(validator(types.map(field))).to.equal(false);
    });
    for (const missing of types)
      it(`VA06 characterizes ${name} missing ${missing}: forEach return is currently discarded`, () =>
        expect(validator(types.filter(type => type !== missing).map(field))).to.equal(false));
  }
  it('VA06 cash missing-field precedence and complete layouts', () => {
    expect(valid.findCashError([])).to.equal(false);
    expect(valid.findCashError([field('cash-name')])).to.equal(
      'missing Cash Contact info field required for payments',
    );
    expect(valid.findCashError([field('cash-contact')])).to.equal(
      'missing Cash name field required for payments',
    );
    expect(valid.findCashError([field('cash-contact'), field('cash-name')])).to.equal(false);
  });
  for (const [info, message] of [
    [null, 'payor_info is not an object'],
    [
      { same_as_billing: true, given_name: 'A' },
      'if payor_info is same_as_billing, only the following keys are allowed: same_as_billing, email, phone',
    ],
    [{ email: 1 }, 'payor_info.email is not a string'],
    [{ email: 'invalid' }, 'payor_info.email is not a valid email'],
    [{ phone: 1 }, 'payor_info.phone is not a string'],
    [{ phone: '1234' }, 'payor_info.phone is not a valid phone number'],
    [{ phone: '1234567890123456' }, 'payor_info.phone is not a valid phone number'],
  ])
    it(`VA07 rejects ${JSON.stringify(info)}`, () =>
      expect(valid.isValidPayorInfo(info)).to.deep.equal(error(message)));
  for (const info of [
    {},
    { same_as_billing: true, email: 'A@EXAMPLE.COM', phone: '+1 (234) 567-8901' },
    { same_as_billing: false, given_name: 'Ada' },
    { phone: '12345' },
    { phone: '123456789012345' },
    { email: '', phone: '' },
  ])
    it(`VA07 accepts ${JSON.stringify(info)}`, () =>
      expect(valid.isValidPayorInfo(info)).to.equal(null));
  it('VA07 formatting clones input, normalizes phone and characterizes shallow empty-string nullification', () => {
    const input = { email: '', phone: '+1 (234) 567-8901', address: { line1: '' }, extras: [''] };
    const before = structuredClone(input),
      result = valid.formatPayorObject(input);
    expect(input).to.deep.equal(before);
    expect(result).to.not.equal(input);
    expect(result).to.deep.equal({
      email: null,
      phone: '12345678901',
      address: { line1: '' },
      extras: [''],
    });
    expect(valid.formatPayorObject({ phone: '' })).to.deep.equal({ phone: null });
  });
  it('VA08 payor ID/details exclusivity and type errors', () => {
    expect(valid.isValidPayorDetails({}, 'id')).to.equal(null);
    expect(valid.isValidPayorDetails({}, undefined)).to.equal(null);
    expect(valid.isValidPayorDetails({ given_name: 'A' }, undefined)).to.equal(null);
    expect(valid.isValidPayorDetails({}, 1)).to.deep.equal(error('payorId must be a string'));
    expect(valid.isValidPayorDetails({ given_name: 'A' }, 'id')).to.deep.equal(
      error('Unable to process when both payorId and payorInfo are provided'),
    );
    expect(() => valid.isValidPayorDetails(null, 'id')).to.throw(TypeError);
  });
  for (const [data, message] of [
    [{ invoice_id: 1 }, 'invoiceId must be a string'],
    [{ recurring_id: 1 }, 'recurringId must be a string'],
    [{ invoice_id: 'i', recurring_id: 'r' }, 'invoiceId and recurringId cannot both be present'],
  ])
    it(`VA09 rejects ${JSON.stringify(data)}`, () =>
      expect(valid.isValidInvoiceAndRecurringId(data)).to.deep.equal(error(message)));
  for (const data of [
    {},
    { invoice_id: 'i' },
    { recurring_id: 'r' },
    { invoice_id: '', recurring_id: '' },
  ])
    it(`VA09 accepts ${JSON.stringify(data)}`, () =>
      expect(valid.isValidInvoiceAndRecurringId(data)).to.equal(null));
  for (const [billing, message] of [
    [true, 'billingInfo must be an object'],
    [{ address: 'x' }, 'billingInfo.address must be an object'],
    [{ address: {} }, 'billingInfo.address.postal_code is required when passing in billingInfo'],
  ])
    it(`VA10 rejects ${JSON.stringify(billing)}`, () =>
      expect(valid.isValidBillingInfo(billing)).to.deep.equal(error(message)));
  for (const billing of [
    undefined,
    null,
    false,
    0,
    '',
    {},
    [],
    { address: { postal_code: '45202' } },
  ])
    it(`VA10 characterizes accepted ${JSON.stringify(billing)}`, () =>
      expect(valid.isValidBillingInfo(billing)).to.equal(null));
  const l3Fields = [
    ['tax_amt', 'tax_amt', 'number'],
    ['frght_amt', 'freight_amt', 'number'],
    ['duty_amt', 'duty_amt', 'number'],
    ['discnt_amt', 'discount_amt', 'number'],
    ['purch_idfr', 'ship_from_zip', 'string'],
    ['order_num', 'order_num', 'string'],
    ['dest_postal_code', 'dest_postal_code', 'string'],
  ];
  for (const [key, label, type] of l3Fields) {
    it(`VA11 rejects invalid truthy ${key} with exact legacy label`, () =>
      expect(
        transaction({ level3DataSummary: { [key]: type === 'number' ? 'bad' : 42 } }),
      ).to.deep.equal(error(`l3DataSummary.${label} must be a ${type}`)));
    it(`VA11 accepts valid and falsey ${key}`, () => {
      for (const value of [type === 'number' ? 12 : 'x', 0, false, '', null, undefined])
        expect(transaction({ level3DataSummary: { [key]: value } })).to.equal(null);
    });
  }
  for (const [summary, message] of [
    [42, 'l3DataSummary must be an object'],
    [{ prod_desc: 'x' }, 'l3DataSummary.prod_desc must be an array'],
    [{ prod_desc: [1] }, 'l3DataSummary.prod_desc must be an array of strings'],
    [{ tax_ind: 1 }, 'l3DataSummary.tax_ind must be a string'],
    [
      { tax_ind: 'BAD' },
      'l3DataSummary.tax_ind must be one of the following: TAX_AMOUNT_PROVIDED, NOT_TAXABLE, NO_TAX_INFO_PROVIDED',
    ],
  ])
    it(`VA11 rejects ${JSON.stringify(summary)}`, () =>
      expect(transaction({ level3DataSummary: summary })).to.deep.equal(error(message)));
  for (const summary of [
    undefined,
    null,
    {},
    { prod_desc: [] },
    { prod_desc: ['a', 'b'] },
    ...['TAX_AMOUNT_PROVIDED', 'NOT_TAXABLE', 'NO_TAX_INFO_PROVIDED'].map(tax_ind => ({ tax_ind })),
  ])
    it(`VA11 accepts ${JSON.stringify(summary)}`, () =>
      expect(transaction({ level3DataSummary: summary })).to.equal(null));
  it('VA11 characterizes noniterable object product descriptions throwing rather than returning an error', () =>
    expect(() => transaction({ level3DataSummary: { prod_desc: {} } })).to.throw(TypeError));
  for (const healthExpenseType of [
    undefined,
    null,
    'HEALTHCARE',
    'RX',
    'VISION',
    'CLINICAL',
    'COPAY',
    'DENTAL',
    'TRANSIT',
  ])
    it(`VA12 accepts ${String(healthExpenseType)}`, () =>
      expect(transaction({ healthExpenseType })).to.equal(null));
  for (const healthExpenseType of [false, 1, '', {}])
    it(`VA12 rejects type ${String(healthExpenseType)}`, () =>
      expect(transaction({ healthExpenseType })).to.deep.equal(
        error('healthExpenseType must be a string'),
      ));
  it('VA12 rejects wrong casing without silently coercing', () =>
    expect(transaction({ healthExpenseType: 'healthcare' })).to.deep.equal(
      error(
        'healthExpenseType must be one of the following: HEALTHCARE, RX, VISION, CLINICAL, COPAY, DENTAL, TRANSIT',
      ),
    ));
  it('VA13 hosted checkout enums and payment name', () => {
    for (const cta of ['PAY', 'BOOK', 'DONATE', undefined])
      for (const method of [
        'ALL',
        'NOT_CASH',
        'NOT_CARD',
        'NOT_ACH',
        'ONLY_CASH',
        'ONLY_CARD',
        'ONLY_ACH',
        undefined,
      ])
        expect(valid.validateHostedCheckoutParams(cta, method, 'Payment')).to.equal(null);
    expect(valid.validateHostedCheckoutParams('bad', undefined, 'Payment')).to.deep.equal(
      error('callToAction must be one of PAY, BOOK, DONATE'),
    );
    expect(valid.validateHostedCheckoutParams(undefined, 'bad', 'Payment')).to.deep.equal(
      error(
        'acceptedPaymentMethods must be one of ALL, NOT_CASH, NOT_CARD, NOT_ACH, ONLY_CASH, ONLY_CARD, ONLY_ACH',
      ),
    );
    for (const name of ['', undefined, null, 0, false, {}])
      expect(valid.validateHostedCheckoutParams(undefined, undefined, name)).to.deep.equal(
        error('paymentName must be a string'),
      );
  });
  for (const size of [undefined, null, 0, false, '', '128', NaN])
    it(`VA13 QR rejects ${String(size)}`, () =>
      expect(valid.validQRSize(size)).to.deep.equal(error('size must be a number')));
  for (const size of [-1, 0.5, 127, 128, 300, 301, Infinity])
    it(`VA13 QR validator itself accepts ${size}; clamping is caller behavior`, () =>
      expect(valid.validQRSize(size)).to.equal(null));
  it('VA14 full pipeline returns its first exact error without mutating input', () => {
    const input = fresh({ amount: 0, feeMode: 'invalid', payTheoryData: { fee: -1 } });
    const before = structuredClone(input);
    expect(valid.validTransactionParams(input)).to.deep.equal(
      error('Some required fields are missing or invalid: amount '),
    );
    expect(input).to.deep.equal(before);
    expect(transaction({ payorInfo: { email: 'bad' }, feeMode: 'bad' })).to.deep.equal(
      error('payor_info.email is not a valid email'),
    );
    expect(
      transaction({ payorInfo: { email: 'ok@example.com' }, payTheoryData: { payor_id: 'id' } }),
    ).to.deep.equal(error('Unable to process when both payorId and payorInfo are provided'));
    expect(transaction({ feeMode: 'bad' })).to.deep.equal(
      error('feeMode must be either MERCHANT_FEE or SERVICE_FEE'),
    );
    expect(transaction({ payTheoryData: { invoice_id: 2 } })).to.deep.equal(
      error('invoiceId must be a string'),
    );
    expect(transaction({ payTheoryData: { billing_info: true } })).to.deep.equal(
      error('billingInfo must be an object'),
    );
    expect(transaction({ level3DataSummary: 1 })).to.deep.equal(
      error('l3DataSummary must be an object'),
    );
    expect(transaction({ healthExpenseType: 1 })).to.deep.equal(
      error('healthExpenseType must be a string'),
    );
    expect(transaction({ payTheoryData: { fee: -1 } })).to.deep.equal(
      error('fee must be a positive integer'),
    );
    expect(transaction()).to.equal(null);
    expect(transaction({ payorInfo: undefined })).to.equal(null); // actual pipeline default
  });
});
