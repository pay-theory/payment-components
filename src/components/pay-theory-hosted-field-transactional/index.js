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

  generateIdempotencyCallback(idempotent) {
    const message = {
      type: 'pt:idempotent',
      idempotent
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

  postMessageToHostedField(id, message) {
    document.getElementsByName(id)[0]
      .contentWindow.postMessage(message, `${common.hostedFieldsEndpoint()}`);
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

  get idempotent() {
    return this.idempotency
  }

  set idempotent(_idempotency) {
    let oldIdempotency = this.idempotency ? this.idempotency : {}
    if (oldIdempotency.idempotency !== _idempotency.idempotency) {
      this.idempotency = _idempotency
      if (this.reset) this.reset()
      const fee = _idempotency.fee_mode === common.SERVICE_FEE ? _idempotency.fee : 0
      const cbToken = {
        "first_six": _idempotency.first_six,
        "last_four": _idempotency.last_four,
        "brand": _idempotency.brand,
        "receipt_number": _idempotency.idempotency,
        "amount": _idempotency.amount,
        "service_fee": fee
      }
      this.idempotencyCB(cbToken)
    }
  }

  get transfer() {
    return this.transfered
  }

  set transfer(_transfered) {
    if (!this.transfered) {
      //Logic that allows another transfer to be run if the state is a failure
      if (_transfered.state !== "FAILURE") {
        this.transfered = _transfered
      }
      else {
        this.instrumented = false
        common.removeInitialize()
        if(this.reset) this.reset()
      }
      const successToken = {
        "receipt_number": _transfered.receipt_number,
        "last_four": _transfered.last_four,
        "brand": _transfered.brand,
        "created_at": _transfered.created_at,
        "amount": _transfered.amount,
        "service_fee": _transfered.service_fee,
        "state": _transfered.state,
        "tags": _transfered.tags
      }
      const failureToken = {
        "receipt_number": _transfered.receipt_number,
        "last_four": _transfered.last_four,
        "brand": _transfered.brand,
        "state": _transfered.state,
        "type": _transfered.type
      }
      const cbToken = _transfered.state === "FAILURE" ? failureToken : successToken
      this.captureCB(cbToken)
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

  get resetToken() {
    return this.reset
  }

  set resetToken(_resetToken) {
    this.reset = _resetToken
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
