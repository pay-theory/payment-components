import * as data from './data'
import * as dom from './dom'
import * as message from './message'
import * as network from './network'
import * as observe from './observe'
import * as format from './format'

const common = { ...data, ...dom, ...message, ...network, ...observe, ...format }

export default common
