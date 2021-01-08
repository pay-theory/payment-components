/* global HTMLElement */
import PayTheoryHostedField from '../pay-theory-hosted-field'
import { handleError } from '../../common/message'
const FINIX_ENV = process.env.BUILD_ENV === 'prod' ? 'live' : 'sandbox'



class PayTheoryHostedFieldTransactional extends PayTheoryHostedField {

  defineFields(form, styles) {
    super.defineFields(form, styles)
    const badgeElement = document.createElement('span')
    badgeElement.setAttribute('id', 'pay-theory-badge-wrapper')
    this.appendElement(badgeElement)
  }

  isValidAmount(amount) {
    return amount % 1 === 0 && amount >= 1
  }

  generateTokenizeCallback(amount, token) {
    const message = {
      type: 'pt:tokenize',
      tokenize: { amount, currency: 'USD', "pt-instrument": token }
    }
    window.postMessage(
      message,
      window.location.origin
    )
  }

  generateTransactCallback(amount, token) {
    const transact = { amount, currency: 'USD', "pt-instrument": token }
    window.postMessage({
        type: 'pt:transact',
        transact
      },
      window.location.origin,
    )
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

  get instrument() {
    return this.instrumented
  }

  set instrument(_instrumented) {
    if (!this.instrumented) {
      this.instrumented = _instrumented
      switch (this.actioned) {
      case ('tokenize'):
        {
          this.generateTokenizeCallback(this.amounting, _instrumented)
          break
        }
      case ('transact'):
        {
          this.generateTransactCallback(this.amounting, _instrumented)
          break
        }
      }
    }
    if (_instrumented === 'cancel') {
      this.instrumented = false
    }
  }

  get action() {
    return this.actioned
  }

  set action(_actioned) {
    this.actioned = _actioned
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


export default PayTheoryHostedFieldTransactional
