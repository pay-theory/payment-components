import * as data from './data'
import * as dom from './dom'
import * as message from './message'
import * as network from './network'
import * as observe from './observe'

const generateReturn = (mount, initTransaction, readyObserver, validObserver, sdk) => {
    return {
        mount,

        initTransaction,

        readyObserver,

        transactedObserver: observe.transactedObserver(sdk.host, sdk.clientKey, sdk.apiKey, sdk.amount),

        errorObserver: observe.errorObserver,

        validObserver,
    }
}
const common = { generateReturn, ...data, ...dom, ...message, ...network, ...observe }

export default common
