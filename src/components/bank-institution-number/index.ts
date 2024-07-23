import PayTheoryHostedField from '../pay-theory-hosted-field';
import { BANK_INSTITUTION_NUMBER } from '../../common/data';

class BankInstitutionNumberFrame extends PayTheoryHostedField {
  constructor() {
    super();
    this.setFields(['institution-number']);
    this.setFieldName('institution-number');
  }
}

window.customElements.define(BANK_INSTITUTION_NUMBER, BankInstitutionNumberFrame);
