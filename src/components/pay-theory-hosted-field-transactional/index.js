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

  generateIdempotencyCallback(idempotent) {
    const message = {
      type: 'pt:idempotent',
      idempotent: idempotent
    }
    window.postMessage(
      message,
      window.location.origin
    )
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

  get idempotencyCallback() {
    return this.idempotencyCB
  }

  set idempotencyCallback(_cb) {
    this.idempotencyCB = _cb
  }

  get captureCallback() {
    return this.captureCB
  }

  set captureCallback(_cb) {
    this.captureCB = _cb
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

  get idempotent() {
    return this.idempotency
  }

  set idempotent(_idempotency) {
    console.log(`idempotent ${JSON.stringify(_idempotency)}`)
    if (!this.idempotency) {
      this.idempotency = _idempotency
      const cbToken = {
        "first_six": _idempotency.bin.first_six,
        "last_four": _idempotency.bin.last_four,
        "brand": _idempotency.bin.brand,
        "receipt_number": _idempotency.idempotency,
        "amount": _idempotency.payment.amount,
        "service_fee": _idempotency.payment.service_fee
      }
      console.log(`idempotent callback`)
      this.idempotencyCB(cbToken)
    }
  }

  get transfer() {
    return this.transfered
  }

  set transfer(_transfered) {
    console.log(`transfer ${JSON.stringify(_transfered)}`)
    if (!this.transfered) {
      this.transfered = _transfered
      this.captureCB(_transfered)
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
