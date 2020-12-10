/* global HTMLElement */
import PayTheoryFinixFrame from '../pay-theory-finix'
import { handleError } from '../../common/message'
const FINIX_ENV = process.env.BUILD_ENV === 'prod' ? 'live' : 'sandbox'



class PayTheoryFinixTransactionalFrame extends PayTheoryFinixFrame {

  defineFields(form, styles) {
    super.defineFields(form, styles)
    const badgeElement = document.createElement('span')
    badgeElement.setAttribute('id', 'pay-theory-badge-wrapper')
    this.appendElement(badgeElement)
  }

  isValidAmount(amount) {
    return amount % 1 === 0 && amount >= 1
  }

  generateTokenizeCallback(tokenAmount) {
    const amount = tokenAmount
    return (err, token) => {
      const finixToken = token
      finixToken.bin = this.bin
      const message = {
        type: 'pt:tokenize',
        tokenize: { amount, currency: 'USD', finixToken }
      }
      if (err) {
        this.error = err
      }
      else {
        window.postMessage(
          message,
          window.location.origin
        )
      }
    }
  }

  generateTransactCallback(amount) {
    return (err, res) => {
      if (err) {
        this.error = err
      }
      else {
        const transact = { amount, currency: 'USD', finixToken: { bin: this.bin, ...res } }
        window.postMessage({
            type: 'pt:transact',
            transact
          },
          window.location.origin,
        )
      }
    }
  }

  get tokenize() {
    return this.tokenizing
  }

  set tokenize(_tokenizing) {
    const amount = _tokenizing
    if (amount === false) {
      this.tokenizing = false
    }
    else if (!this.isValidAmount(amount)) {
      return handleError('amount must be a positive integer')
    }
    else if (this.tokenizing !== _tokenizing) {
      this.tokenizing = _tokenizing
      this.form.submit(FINIX_ENV, this.application, this.generateTokenizeCallback(amount))
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
    const valid_amount = this.isValidAmount(_transacting)
    const amount = _transacting
    if (amount === false) {
      this.transacting = false
    }
    if (!valid_amount) {
      return handleError('amount must be a positive integer')
    }
    if (this.transacting !== _transacting) {
      this.transacting = _transacting
      this.form.submit(FINIX_ENV, this.application, this.generateTransactCallback(amount))
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
