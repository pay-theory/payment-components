import * as messaging from './message'
import * as network from './network'

export const errorObserver = cb => messaging.handleMessage(messaging.errorTypeMessage, message => cb(message.error))

export const transactedObserver = (host, clientKey, apiKey, amount) =>
    cb => messaging.handleMessage(
        messaging.tokenizedTypeMessage,
        network.generateTransacted(cb, host, clientKey, apiKey, amount))