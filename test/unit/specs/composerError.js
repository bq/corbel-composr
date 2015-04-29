'use strict';

var chai = require('chai'),
    expect = chai.expect,
    ComposerError = require('../../../src/lib/composerError.js');

describe('when ComposerError is fired', function() {

    it('has expected params', function() {

        try {
            throw new ComposerError('expected:error', {
                status: 555
            });
        } catch (ex) {
            expect(ex.name).to.be.equal('ComposerError');
            expect(ex.message).to.be.equal('expected:error');
            expect(ex.status).to.be.equal(555);
            // expect(ex.stack).to.be.equal();
            expect(ex instanceof Error).to.be.equal(true);
            expect(ex instanceof ComposerError).to.be.equal(true);
        }

    });

});
