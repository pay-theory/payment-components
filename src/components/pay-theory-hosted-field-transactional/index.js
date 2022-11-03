import PayTheoryHostedField from '../pay-theory-hosted-field'

class PayTheoryHostedFieldTransactional extends PayTheoryHostedField {

  defineFields(form, styles) {
    super.defineFields(form, styles)
    const badgeElement = document.createElement('span')
    badgeElement.setAttribute('id', 'pay-theory-badge-wrapper')
    this.appendElement(badgeElement)
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

  instrumentResponse(action, amount, instrument) {
    switch (action) {
    case ('tokenize'):
      {
        this.generateTokenizeCallback(amount, instrument)
        break
      }
    case ('transact'):
      {
        this.generateTransactCallback(amount, instrument)
        break
      }
    }
  }

  get instrument() {
    return this.instrumented
  }

  set instrument(_instrumented) {
    if (!this.instrumented) {
      this.instrumented = _instrumented
      this.instrumentResponse(this.actioned, this.amounting, _instrumented)
    }
    if (_instrumented === 'cancel') {
      this.instrumented = false
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

  get resetToken() {
    return this.reset
  }

  set resetToken(_resetToken) {
    this.reset = _resetToken
  }
}


export default PayTheoryHostedFieldTransactional
