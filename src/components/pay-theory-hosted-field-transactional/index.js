import PayTheoryHostedField from '../pay-theory-hosted-field'
import common from '../../common'



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

  get tokenize() {
    return this.tokenizing
  }

  set tokenize(_tokenizing) {
    const amount = _tokenizing
    if (amount === false) {
      this.tokenizing = false
    }
    else if (!this.isValidAmount(amount)) {
      common.handleError('amount must be a positive integer')
    }
    else if (this.tokenizing !== _tokenizing) {
      this.tokenizing = _tokenizing
      this.form.submit(common.getFinixEnv(), this.application, this.generateTokenizeCallback(amount))
    }
  }

  get transact() {
    return this.transacting
  }

  set transact(_transacting) {
    const amount = _transacting
    if (amount === false) {
      this.transacting = false
    }
    else if (!this.isValidAmount(_transacting)) {
      common.handleError('amount must be a positive integer')
    }
    else if (this.transacting !== _transacting) {
      this.transacting = _transacting
      this.form.submit(common.getFinixEnv(), this.application, this.generateTransactCallback(amount))
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

  get cash() {
    return this.cashed
  }

  set cash(_cash) {
    if (this.cashed !== _cash) {
      this.cashed = _cash
      if (_cash) {
        common.postMessageToHostedField('cash-name-iframe', {
          type: 'pt-static:cash-detail',
          data: _cash
        })
      }
    }
  }
}


export default PayTheoryHostedFieldTransactional
