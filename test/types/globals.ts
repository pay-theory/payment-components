export {};

const consumeBrowserGlobals = async () => {
  await window.paytheory.payTheoryFields({
    apiKey: 'partner-api-key',
    styles: {
      default: {},
      error: {
        color: '#d9534f',
        '::placeholder': {
          color: 'rgba(0, 0, 0, 0.4)',
        },
      },
    },
  });

  await window.paytheory.payTheoryFields({
    checkoutContext: { linkId: 'link-id' },
  });

  window.paytheory.button({
    apiKey: 'partner-api-key',
    checkoutDetails: {
      amount: 2500,
      paymentName: 'Registration fee',
      acceptedPaymentMethods: window.paytheory.ALL,
      callToAction: window.paytheory.PAY,
    },
    style: {
      color: window.paytheory.PURPLE,
      callToAction: window.paytheory.PAY,
      height: 48,
      pill: true,
    },
  });

  const messenger = new window.PayTheoryMessenger({ apiKey: 'partner-api-key' });

  messenger.on('transaction_complete', event => {
    event.transaction.transaction_id;
  });

  messenger.on('transaction_error', event => {
    event.error;
  });

  // @ts-expect-error Only documented Messenger events are accepted.
  messenger.on('internal_connection_state', () => undefined);
};

void consumeBrowserGlobals;
