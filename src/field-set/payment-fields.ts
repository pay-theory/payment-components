import common from '../common';
import type {
  Metadata,
  PayorInfo,
  PaymentFeeMode,
  PaymentFieldElementIds,
  PlaceholderObject,
  StyleObject,
} from '../paytheory-sdk';
import { defaultElementIds } from '../common/data';
import payTheoryFields from './payment-fields-v2';
import { transact } from './actions';

/** Builds the backwards-compatible controller used by the legacy creation APIs. */
export default async (
  apiKey: string,
  _legacyClientId: string | undefined, // Retained positionally for backwards compatibility.
  styles: StyleObject = common.defaultStyles,
  sessionMetadata: Metadata = {},
  fee_mode: PaymentFeeMode = common.defaultFeeMode,
) => {
  const mount = async (
    props: {
      placeholders?: PlaceholderObject;
      elements?: PaymentFieldElementIds;
      session?: string;
    } = {},
  ) => {
    const { placeholders, elements = defaultElementIds, session } = props;
    await payTheoryFields({
      apiKey: apiKey,
      styles: styles,
      metadata: sessionMetadata,
      placeholders: placeholders,
      elementIds: elements,
      session: session,
      feeMode: fee_mode,
    });
  };

  const initTransaction = (amount: number, payorInfo: PayorInfo, confirmation = false) => {
    console.warn('initTransaction is deprecated. Please use transact instead.');
    //Passing in the session metadata from create because those used to be the only metadata that were passed in
    transact({ amount, payorInfo, confirmation, feeMode: fee_mode }).catch(error => {
      console.error(error);
    });
  };

  return common.generateReturn(mount, initTransaction);
};
