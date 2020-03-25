const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { dependencies } = require('./helpers/dependencies');

const { expect } = require('chai');

const BasicRedeemGateway = artifacts.require('BasicRedeemGateway');
const RedeemGatewayRoles = artifacts.require('RedeemGatewayRoles');

contract('BasicRedeemGateway', ([_, funder, owner, minter, manager, spender, other]) => {

    const receivedTransfer = {
        campaignId: "CampaignA",
        invoiceId: "Invoice1",
        transferId: "Transfer1"
    };

    const receivedTransferData = web3.eth.abi.encodeParameters(
        ['string', 'string', 'string'],
        [receivedTransfer.campaignId, receivedTransfer.invoiceId, receivedTransfer.transferId]
    );
    
    beforeEach(async () => {
        const { mvnToken, erc1820Registry, roleRegistry } = await dependencies(funder, owner);

        this.mvnToken = mvnToken;
        this.erc1820Registry = erc1820Registry;
        this.roleRegistry = roleRegistry;
    });

    context('during deployment', () => {

        it('does not revert', async () => {
            const redeemGatewayRoles = await RedeemGatewayRoles['new']();
            await BasicRedeemGateway.link('RedeemGatewayRoles', redeemGatewayRoles.address);
            await BasicRedeemGateway["new"]();
        });

    });

    context('during initialization', () => {

        beforeEach(async () => {
            const redeemGatewayRoles = await RedeemGatewayRoles['new']();
            await BasicRedeemGateway.link('RedeemGatewayRoles', redeemGatewayRoles.address);
            this.contract = await BasicRedeemGateway["new"]();
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
            await BasicRedeemGateway.link('RedeemGatewayRoles', redeemGatewayRoles.address);
            this.contract = await BasicRedeemGateway["new"]();

            await this.contract['initialize_v1'](this.mvnToken.address, this.erc1820Registry.address, this.roleRegistry.address);
            
            await this.roleRegistry['addRole'](this.mvnToken.address, minter, "Minter", { from: owner });
            await this.roleRegistry['addRole'](this.contract.address, manager, "Manager", { from: owner });
            await this.mvnToken['mint'](spender, 1000, { from: minter });
        });

        describe('initially', () => {

            it('pre-sets correct version number', async () => {
                expect(await this.contract['version']()).to.be.bignumber.equal('1');
            });
            
            it ('doesn\'t pre-set transfers count', async () => {
                expect(await this.contract['transfersCount']()).to.be.bignumber.equal('0');
            });

            it ('doesn\'t pre-mark transfer as received', async () => {
                expect(await this.contract['isReceived'](
                    receivedTransfer.campaignId,
                    receivedTransfer.invoiceId,
                    receivedTransfer.transferId
                )).to.equal(false);
            });

            it ('doesn\'t pre-mark transfer as accepted', async () => {
                expect(await this.contract['isAccepted'](
                    receivedTransfer.campaignId,
                    receivedTransfer.invoiceId,
                    receivedTransfer.transferId
                )).to.equal(false);
            });

            it ('doesn\'t pre-mark transfer as rejected', async () => {
                expect(await this.contract['isRejected'](
                    receivedTransfer.campaignId,
                    receivedTransfer.invoiceId,
                    receivedTransfer.transferId
                )).to.equal(false);
            });

        });

        describe('when receiving tokens', () => {

            beforeEach(async () => {
                await this.mvnToken['send'](this.contract.address, 42, receivedTransferData, { from: spender });
            });

            it('increases transfers count', async () => {
                expect(await this.contract['transfersCount']()).to.be.bignumber.equal('1');
            });

            it('marks transfer as received', async () => {
                expect(await this.contract['isReceived'](
                    receivedTransfer.campaignId,
                    receivedTransfer.invoiceId,
                    receivedTransfer.transferId
                )).to.equal(true);
            });

            it('saves transfer to the registry', async () => {
                const transfer = await this.contract['getTransfer'](0);
                
                expect(transfer.from).to.equal(spender);
                expect(transfer.amount).to.be.bignumber.equal('42');
                expect(transfer.campaignId).to.equal(receivedTransfer.campaignId);
                expect(transfer.invoiceId).to.equal(receivedTransfer.invoiceId);
                expect(transfer.transferId).to.equal(receivedTransfer.transferId);
            });
            
            it ('doesn\'t pre-mark transfer as accepted', async () => {
                expect(await this.contract['isAccepted'](
                    receivedTransfer.campaignId,
                    receivedTransfer.invoiceId,
                    receivedTransfer.transferId
                )).to.equal(false);
            });

            it ('doesn\'t pre-mark transfer as rejected', async () => {
                expect(await this.contract['isRejected'](
                    receivedTransfer.campaignId,
                    receivedTransfer.invoiceId,
                    receivedTransfer.transferId
                )).to.equal(false);
            });

            it('reverts when from is the zero address', async () => {
                await expectRevert(this.mvnToken['mint'](this.contract.address, 42, { from: minter }),
                    'BasicRedeemGateway: from is the zero address');
            });
            
            it('reverts when transfer with ther same internal id has already been received', async () => {
                await expectRevert(this.mvnToken['send'](this.contract.address, 42, receivedTransferData, { from: spender }),
                    'RedeemGateway: transfer has already been received')
            });
            
        });

        describe('when tokens received', () => {

            beforeEach(async () => {
                await this.mvnToken['send'](this.contract.address, 42, receivedTransferData, { from: spender });
            });
            
            describe('accepting transfer', () => {
                
                it('marks transfer as accepted', async () => {
                    await this.contract['acceptTransfer'](
                        receivedTransfer.campaignId,
                        receivedTransfer.invoiceId,
                        receivedTransfer.transferId,
                        { from: manager }
                    );
                    
                    expect(await this.contract['isAccepted'](
                        receivedTransfer.campaignId,
                        receivedTransfer.invoiceId,
                        receivedTransfer.transferId
                    )).to.equal(true);
                });
                
                it('emits TransferAccepted event', async () => {
                    const { logs } = await this.contract['acceptTransfer'](
                        receivedTransfer.campaignId,
                        receivedTransfer.invoiceId,
                        receivedTransfer.transferId,
                        { from: manager }
                    );

                    await expectEvent.inLogs(logs, 'TransferAccepted', {
                        campaignId: receivedTransfer.campaignId,
                        invoiceId: receivedTransfer.invoiceId,
                        transferId: receivedTransfer.transferId
                    });
                });
                
                it('reverts when accepting transfer from non-manager account', async () => {
                    await expectRevert(this.contract['acceptTransfer'](
                            receivedTransfer.campaignId,
                            receivedTransfer.invoiceId,
                            receivedTransfer.transferId, 
                            { from: other }
                        ),
                        'RedeemGatewayRoles: caller does not have the Manager role');
                });
                
            });

            describe('rejecting transfer', () => {

                it('marks transfer as rejected', async () => {
                    await this.contract['rejectTransfer'](
                        receivedTransfer.campaignId,
                        receivedTransfer.invoiceId,
                        receivedTransfer.transferId,
                        { from: manager }
                    );

                    expect(await this.contract['isRejected'](
                        receivedTransfer.campaignId,
                        receivedTransfer.invoiceId,
                        receivedTransfer.transferId
                    )).to.equal(true);
                });

                it('emits TransferRejected event', async () => {
                    const { logs } = await this.contract['rejectTransfer'](
                        receivedTransfer.campaignId,
                        receivedTransfer.invoiceId,
                        receivedTransfer.transferId,
                        { from: manager }
                    );

                    await expectEvent.inLogs(logs, 'TransferRejected', {
                        campaignId: receivedTransfer.campaignId,
                        invoiceId: receivedTransfer.invoiceId,
                        transferId: receivedTransfer.transferId
                    });
                });

                it('reverts when rejecting transfer from non-manager account', async () => {
                    await expectRevert(this.contract['rejectTransfer'](
                            receivedTransfer.campaignId,
                            receivedTransfer.invoiceId,
                            receivedTransfer.transferId,
                            { from: other }
                        ),
                        'RedeemGatewayRoles: caller does not have the Manager role');
                });
                
            });
            
        });
        
    });
    
});