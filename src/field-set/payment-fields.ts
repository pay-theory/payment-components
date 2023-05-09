import common from '../common'
import {PayorInfo, PlaceholderObject, StyleObject} from "../common/pay_theory_types";
import {defaultElementIds, MERCHANT_FEE, SERVICE_FEE} from "../common/data";
import payTheoryFields from "./payment-fields-v2"
import {transact} from "./actions";

export default async(
    apiKey: string,
    legacy: undefined, // this used to be client id, left in place to preserve backwards compatibility
    styles: StyleObject = common.defaultStyles,
    sessionMetadata: { [key: string | number]: string | number | boolean } = {},
    fee_mode: typeof MERCHANT_FEE | typeof  SERVICE_FEE= common.defaultFeeMode
) => {
    const mount = async(props: {
        placeholders?: PlaceholderObject,
        elements?: typeof defaultElementIds,
        session?: string,
    } = {}) => {
        let {placeholders, elements = defaultElementIds, session} = props
        await payTheoryFields({
            apiKey: apiKey,
            styles: styles,
            metadata: sessionMetadata,
            placeholders: placeholders,
            elementIds: elements,
            session: session,
            feeMode: fee_mode
        })
    }

    const initTransaction = (amount: number, payorInfo: PayorInfo, confirmation: boolean = false) => {
        console.warn('initTransaction is deprecated. Please use transact instead.')
        //Passing in the session metadata from create because those used to be the only metadata that were passed in
        transact({amount, payorInfo, confirmation})
    }

    return common.generateReturn(mount, initTransaction)
}
