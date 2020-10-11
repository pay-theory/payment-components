/* global HTMLElement */
import PayTheoryFinixFrame from '../pay-theory-finix'
import { handleError } from '../../common'
const FINIX_ENV = process.env.BUILD_ENV === 'prod' ? 'live' : 'sandbox'

class PayTheoryFinixTransactionalFrame extends PayTheoryFinixFrame {

  defineFields(form, styles) {
    super.defineFields(form, styles)
    const badgeElement = document.createElement('span')
    badgeElement.setAttribute('id', 'pay-theory-badge-wrapper')
    this.appendElement(badgeElement)
  }

  get tokenize() {
    return this.tokenizing
  }

  set tokenize(_tokenizing) {
    if (_tokenizing === false) {
      this.tokenizing = false
    }
    else {
      const valid_amount = _tokenizing % 1 === 0 && _tokenizing >= 1
      const amount = _tokenizing
      if (!valid_amount) {
        return handleError('amount must be a positive integer')
      }
      if (this.tokenizing !== _tokenizing) {
        this.tokenizing = _tokenizing
        this.form.submit(FINIX_ENV, this.application, (err, res) => {
          if (err) {
            this.error = err
          }
          else {
            const tokenize = { amount: amount, currency: 'USD', finixToken: { bin: this.bin, ...res } }
            window.postMessage({
                type: 'pt:tokenize',
                tokenize
              },
              window.location.origin,
            )
          }
        })
      }
    }
  }

  get capture() {
    return this.capturing
  }

  set capture(_capturing) {
    window.postMessage({
        type: 'pt:capture',
        capture: true
      },
      window.location.origin,
    )
  }

  get transact() {
    return this.transacting
  }

  set transact(_transacting) {
    const valid_amount = Number.isInteger(parseInt(_transacting))
    const amount = parseInt(_transacting)
    if (!valid_amount) {
      return handleError('amount must be a positive integer')
    }
    if (this.transacting !== _transacting) {
      this.transacting = _transacting
      this.form.submit(FINIX_ENV, this.application, (err, res) => {
        if (err) {
          this.error = err
        }
        else {
          const transact = { amount: amount, currency: 'USD', finixToken: { bin: this.bin, ...res } }
          window.postMessage({
              type: 'pt:transact',
              transact
            },
            window.location.origin,
          )
        }
      })
    }
  }

  get amount() {
    return this.amounting
  }

  set amount(_amounting) {
    if (this.amounting !== _amounting) {
      this.amounting = _amounting
    }
  }
}


export default PayTheoryFinixTransactionalFrame
