const { expectRevert, constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { dependencies } = require('./helpers/dependencies');

const { expect } = require('chai');

const MVNRecipient = artifacts.require('MVNRecipientMock');

contract('MVNRecipient', ([_, funder, owner, other]) => {

    beforeEach(async () => {
        const { mvnToken, erc1820Registry } = await dependencies(funder, owner);

        this.mvnToken = mvnToken;
        this.erc1820Registry = erc1820Registry;
    });
    
    context('during initialization', () => {

        beforeEach(async () => {
            this.contract = await MVNRecipient["new"]();
        });

        it('reverts when mvn is the zero address', async () => {
            await expectRevert(this.contract['initialize_v1'](ZERO_ADDRESS, this.erc1820Registry.address),
                'MVNRecipient: mvn is the zero address');
        });

        it('reverts when erc1820Registry is the zero address', async () => {
            await expectRevert(this.contract['initialize_v1'](this.mvnToken.address, ZERO_ADDRESS),
                'MVNRecipient: erc1820registry is the zero address');
        });
        
        describe('when contract has already been initialized', () => {

            beforeEach(async () => {
                await this.contract['initialize_v1'](this.mvnToken.address, this.erc1820Registry.address);
            });

            it('reverts', async () => {
                await expectRevert(this.contract['initialize_v1'](this.mvnToken.address, this.erc1820Registry.address),
                    'Contract instance has already been initialized'
                );
            });

        });

    });
    
    context('after initialization', () => {

        beforeEach(async () => {
            this.contract = await MVNRecipient["new"]();
            await this.contract['initialize_v1'](this.mvnToken.address, this.erc1820Registry.address);
        });
        
        describe('checking MVN token permission', () => {
           
            it('reverts when caller is not MVN token', async () => {
               await expectRevert(this.contract['onlyMVNMock']({ from: other }),
                   'MVNRecipient: sender is not mvn token'); 
            });
            
        });
        
    });
    
});