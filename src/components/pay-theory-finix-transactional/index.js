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

  generateTokenizeCallback = (tokenAmount) => {
    const amount = tokenAmount
    return (err, finixToken) => {
      finixToken.bin = this.bin
      if (err) {
        this.error = err
      }
      else {
        const tokenize = { amount, currency: 'USD', finixToken }
        window.postMessage({
            type: 'pt:tokenize',
            tokenize
          },
          window.location.origin,
        )
      }
    }
  }

  generateTransactCallback = (amount) => (err, res) => {
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

  get tokenize() {
    return this.tokenizing
  }

  set tokenize(_tokenizing) {
    const amount = _tokenizing
    if (amount === false) {
      this.tokenizing = amount
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
    const valid_amount = Number.isInteger(parseInt(_transacting))
    const amount = parseInt(_transacting)
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
