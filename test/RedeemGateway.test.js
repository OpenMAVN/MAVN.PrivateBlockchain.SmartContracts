const { expectRevert, constants, singletons } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { dependencies } = require('./helpers/dependencies');

const { expect } = require('chai');

const RedeemGateway = artifacts.require('RedeemGatewayMock');
const RedeemGatewayRoles = artifacts.require('RedeemGatewayRoles');

contract('RedeemGateway', ([_, funder, owner, minter, manager, spender, other]) => {

    const receivedTransferId = '0x42';
    const nonReceivedTransferId = '0x43';
    
    beforeEach(async () => {
        const { mvnToken, erc1820Registry, roleRegistry } = await dependencies(funder, owner);
       
        this.mvnToken = mvnToken;
        this.erc1820Registry = erc1820Registry;
        this.roleRegistry = roleRegistry;
    });

    context('during deployment', () => {

        it('does not revert', async () => {
            const redeemGatewayRoles = await RedeemGatewayRoles['new']();
            await RedeemGateway.link('RedeemGatewayRoles', redeemGatewayRoles.address);
            await RedeemGateway["new"]();
        });
        
    });

    context('during initialization', () => {
        
        beforeEach(async () => {
            const redeemGatewayRoles = await RedeemGatewayRoles['new']();
            await RedeemGateway.link('RedeemGatewayRoles', redeemGatewayRoles.address);
            this.contract = await RedeemGateway["new"]();
        });
        
        describe('when contract has already been initialized', () => {

            beforeEach(async () => {
                await this.contract['initialize_v1'](this.mvnToken.address, this.erc1820Registry.address, this.roleRegistry.address);
            });
            
            it('reverts', async () => {
                await expectRevert(this.contract['initialize_v1'](this.mvnToken.address, this.erc1820Registry.address, this.roleRegistry.address),
                    'Contract instance has already been initialized'
                );
            });
            
        });

    });
    
    context('after initialization', () => {
        
        beforeEach(async () => {
            const redeemGatewayRoles = await RedeemGatewayRoles['new']();
            await RedeemGateway.link('RedeemGatewayRoles', redeemGatewayRoles.address);
            this.contract = await RedeemGateway["new"]();
            await this.contract['initialize_v1'](this.mvnToken.address, this.erc1820Registry.address, this.roleRegistry.address);

            await this.roleRegistry['addRole'](this.mvnToken.address, minter, "Minter", { from: owner });
            await this.roleRegistry['addRole'](this.contract.address, manager, "Manager", { from: owner });
            
            await this.mvnToken['mint'](spender, 1000, { from: minter });
        });

        describe('initially', () => {
           
            it ('doesn\'t pre-set transfers count', async () => {
                expect(await this.contract['transfersCount']()).to.be.bignumber.equal('0');
            });

            it ('doesn\'t pre-mark transfer as received', async () => {
                expect(await this.contract['isReceived'](receivedTransferId)).to.equal(false);
            });

            it ('doesn\'t pre-mark transfer as accepted', async () => {
                expect(await this.contract['isAccepted'](receivedTransferId)).to.equal(false);
            });

            it ('doesn\'t pre-mark transfer as rejected', async () => {
                expect(await this.contract['isRejected'](receivedTransferId)).to.equal(false);
            });
            
        });
        
        describe('when receiving tokens', () => {

            beforeEach(async () => {
                await this.mvnToken['send'](this.contract.address, 42, receivedTransferId, { from: spender });
            });

            it('increases transfers count', async () => {
                expect(await this.contract['transfersCount']()).to.be.bignumber.equal('1');
            });

            it('marks transfer as received', async () => {
                expect(await this.contract['isReceived'](receivedTransferId)).to.equal(true);
            });

            it ('doesn\'t pre-mark transfer as accepted', async () => {
                expect(await this.contract['isAccepted'](receivedTransferId)).to.equal(false);
            });

            it ('doesn\'t pre-mark transfer as rejected', async () => {
                expect(await this.contract['isRejected'](receivedTransferId)).to.equal(false);
            });

            it('reverts when internal id is empty', async () => {
                await expectRevert(this.mvnToken['send'](this.contract.address, 42, '0x', { from: spender }),
                    'RedeemGateway: internal transfer id is empty')
            });

            it('reverts when transfer with ther same internal id has already been received', async () => {
                await expectRevert(this.mvnToken['send'](this.contract.address, 42, receivedTransferId, { from: spender }),
                    'RedeemGateway: transfer has already been received')
            });

            it('reverts when transfer with ther same internal id has already been accepted', async () => {
                await this.contract['acceptTransfer'](receivedTransferId, { from: manager });
                await expectRevert(this.mvnToken['send'](this.contract.address, 42, receivedTransferId, { from: spender }),
                    'RedeemGateway: transfer has already been accepted')
            });

            it('reverts when transfer with ther same internal id has already been rejected', async () => {
                await this.contract['rejectTransfer'](receivedTransferId, { from: manager });
                await expectRevert(this.mvnToken['send'](this.contract.address, 42, receivedTransferId, { from: spender }),
                    'RedeemGateway: transfer has already been rejected')
            });
        });

        describe('when tokens received', () => {

            beforeEach(async () => {
                await this.mvnToken['send'](this.contract.address, 42, receivedTransferId, { from: spender });
            });
            
            describe('initially', () => {
               
                it('returns valid transfer by it\'s number', async () => {
                    const { internalTransferId, from, amount } = await this.contract['getTransfer'](0);
                    
                    expect(internalTransferId).to.equal(receivedTransferId);
                    expect(from).to.equal(spender);
                    expect(amount).to.be.bignumber.equal('42');
                });
                
            });
            
            describe('accepting transfer', () => {

                it('reverts when caller is not manager', async () => {
                    await expectRevert(this.contract['acceptTransfer'](receivedTransferId, { from: other }),
                        'RedeemGatewayRoles: caller does not have the Manager role');
                });
                
                it('reverts when internal transfer id is empty', async () => {
                    await expectRevert(this.contract['acceptTransfer']('0x', { from: manager }),
                        'RedeemGateway: internal transfer id is empty');
                });
                
                it('reverts when transfer has not been received', async () => {
                    await expectRevert(this.contract['acceptTransfer'](nonReceivedTransferId, { from: manager }),
                        'RedeemGateway: transfer has not been received');
                });

                it('reverts when transfer has already been accepted', async () => {
                    await this.contract['acceptTransfer'](receivedTransferId, { from: manager });
                    await expectRevert(this.contract['acceptTransfer'](receivedTransferId, { from: manager }),
                        'RedeemGateway: transfer has already been accepted');
                });

                it('reverts when transfer has already been rejected', async () => {
                    await this.contract['rejectTransfer'](receivedTransferId, { from: manager });
                    await expectRevert(this.contract['acceptTransfer'](receivedTransferId, { from: manager }),
                        'RedeemGateway: transfer has already been rejected');
                });
                
                it('marks transfer as accepted', async () => {
                    await this.contract['acceptTransfer'](receivedTransferId, { from: manager });
                    expect(await this.contract['isAccepted'](receivedTransferId)).to.equal(true);
                });
                
                it ('doesn\'t mark transfer as rejected', async () => {
                    await this.contract['acceptTransfer'](receivedTransferId, { from: manager });
                    expect(await this.contract['isRejected'](receivedTransferId)).to.equal(false);
                });
                
                it ('burns tokens', async () => {
                    
                });
                
            });
            
            describe('rejecting transfer', () => {

                it('reverts when caller is not manager', async () => {
                    await expectRevert(this.contract['rejectTransfer'](receivedTransferId, { from: other }),
                        'RedeemGatewayRoles: caller does not have the Manager role');
                });
                
                it('reverts when internal transfer id is empty', async () => {
                    await expectRevert(this.contract['rejectTransfer']('0x', { from: manager }),
                        'RedeemGateway: internal transfer id is empty');
                });
                
                it('reverts when transfer has not been received', async () => {
                    await expectRevert(this.contract['rejectTransfer'](nonReceivedTransferId, { from: manager }),
                        'RedeemGateway: transfer has not been received');
                });

                it('reverts when transfer has already been accepted', async () => {
                    await this.contract['acceptTransfer'](receivedTransferId, { from: manager });
                    await expectRevert(this.contract['rejectTransfer'](receivedTransferId, { from: manager }),
                        'RedeemGateway: transfer has already been accepted');
                });

                it('reverts when transfer has already been rejected', async () => {
                    await this.contract['rejectTransfer'](receivedTransferId, { from: manager });
                    await expectRevert(this.contract['rejectTransfer'](receivedTransferId, { from: manager }),
                        'RedeemGateway: transfer has already been rejected');
                });

                it('marks transfer as rejected', async () => {
                    await this.contract['rejectTransfer'](receivedTransferId, { from: manager });
                    expect(await this.contract['isRejected'](receivedTransferId)).to.equal(true);
                });

                it ('doesn\'t mark transfer as acccepted', async () => {
                    await this.contract['rejectTransfer'](receivedTransferId, { from: manager });
                    expect(await this.contract['isAccepted'](receivedTransferId)).to.equal(false);
                });

                it ('returns tokens', async () => {

                });
                
            });
            
        });
        
    });
    
});