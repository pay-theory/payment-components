import { expect } from '@open-wc/testing';

import {
  initialBankState,
  initialCardState,
  initialCashState,
  initialState,
} from '../src/common/data';

const expectFieldsToStartUnloaded = (state, fieldNames) => {
  for (const fieldName of fieldNames) {
    expect(state[fieldName], `${fieldName} initial state exists`).to.exist;
    expect(state[fieldName].iframeLoaded, `${fieldName} starts with iframeLoaded false`).to.equal(
      false,
    );
  }
};

describe('iframeLoaded initial state', () => {
  it('starts the shared field state with iframeLoaded false', () => {
    expect(initialState.iframeLoaded).to.equal(false);
  });

  it('starts card fields with iframeLoaded false', () => {
    expectFieldsToStartUnloaded(initialCardState, [
      'card-number',
      'card-exp',
      'card-cvv',
      'card-name',
      'billing-line1',
      'billing-line2',
      'billing-city',
      'billing-state',
      'billing-zip',
    ]);
  });

  it('starts bank fields with iframeLoaded false', () => {
    expectFieldsToStartUnloaded(initialBankState, [
      'account-number',
      'account-type',
      'account-name',
      'routing-number',
      'institution-number',
      'transit-number',
    ]);
  });

  it('starts cash fields with iframeLoaded false', () => {
    expectFieldsToStartUnloaded(initialCashState, ['cash-name', 'cash-contact']);
  });
});
