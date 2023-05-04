import PayTheoryHostedFieldTransactional from '../pay-theory-hosted-field-transactional'
import {ACH_ACCOUNT_NUMBER, ACH_IFRAME, achFieldTypes, initialAchState} from "../../common/data";

class ACHAccountNumberFrame extends PayTheoryHostedFieldTransactional {

  constructor() {
    let transactingFieldTypes = achFieldTypes.transacting
    let siblingFieldTypes = achFieldTypes.siblings
    super({
      fieldTypes: [...transactingFieldTypes, ...siblingFieldTypes],
      requiredValidFields: ['account-number', 'account-name', 'account-type', 'routing-number'],
      transactingIFrameId: ACH_IFRAME,
      stateGroup: initialAchState,
      transactingType: 'ach'
    })
    this.setFields(['account-number'])
    this.setFieldName('account-number')
  }

}

window.customElements.define(ACH_ACCOUNT_NUMBER, ACHAccountNumberFrame);
