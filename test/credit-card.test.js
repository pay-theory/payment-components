import { html, fixture, expect, assert } from '@open-wc/testing';
import { aTimeout } from '@open-wc/testing-helpers'
import sinon from 'sinon';

import * as common from './common'
import '../src/components/credit-card'

describe('credit-card', () => {

    it('getters and setters work', async() => {

        const fixed = await fixture(html ` <pay-theory-credit-card-tag-frame/>`);

        expect(fixed.ready).to.be;

        fixed.valid = true;

        expect(fixed.valid).to.be;

        fixed.error = 'error'

        expect(fixed.error).to.equal('error')

        fixed.styles = 'style boy'

        expect(fixed.styles).to.equal('style boy')


    });

})
