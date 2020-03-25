const { expectEvent, expectRevert, constants, singletons } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { dependencies } = require('./helpers/dependencies');

const { expect } = require('chai');

const MVNGateway = artifacts.require('MVNGateway');
const MVNGatewayRoles = artifacts.require('MVNGatewayRoles');
const MVNToken = artifacts.require('MVNToken');

contract('MVNGateway', ([_, funder, owner, minter, bridge, linker, manager, spender, treasury, other]) => {

    const publicAccount = '0x186A979Fb4DD8F84b3B1c609E550e6E57dEC3569';
    
    beforeEach(async () => {
        const { mvnToken, erc1820Registry, roleRegistry } = await dependencies(funder, owner);

        this.mvnToken = mvnToken;
        this.erc1820Registry = erc1820Registry;
        this.roleRegistry = roleRegistry;
    });

    context('during deployment', () => {

        it('does not revert', async () => {
            const mvnGatewayRoles = await MVNGatewayRoles['new']();
            await MVNGateway.link('MVNGatewayRoles', mvnGatewayRoles.address);
            await MVNGateway["new"]();
        });

    });

    context('during initialization', () => {

        beforeEach(async () => {
            const mvnGatewayRoles = await MVNGatewayRoles['new']();
            await MVNGateway.link('MVNGatewayRoles', mvnGatewayRoles.address);
            this.contract = await MVNGateway["new"]();
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
            const mvnGatewayRoles = await MVNGatewayRoles['new']();
            await MVNGateway.link('MVNGatewayRoles', mvnGatewayRoles.address);
            this.contract = await MVNGateway["new"]();

            await this.roleRegistry['addRole'](this.mvnToken.address, minter, "Minter", { from: owner });
            await this.roleRegistry['addRole'](this.mvnToken.address, this.contract.address, "FeeCollector", { from: owner });
            await this.roleRegistry['addRole'](this.contract.address, bridge, "Bridge", { from: owner });
            await this.roleRegistry['addRole'](this.contract.address, linker, "Linker", { from: owner });
            await this.roleRegistry['addRole'](this.contract.address, manager, "Manager", { from: owner });

            await this.mvnToken['mint'](spender, 1000, { from: minter });
            
            await this.contract['initialize_v1'](this.mvnToken.address, this.erc1820Registry.address, this.roleRegistry.address);
        });
        
        describe('initially', () => {

            it('pre-sets correct version number', async () => {
                expect(await this.contract['version']()).to.be.bignumber.equal('1');
            });
            
            it('doesn\'t pre-set treasury account', async () => {
                expect(await this.contract['treasuryAccount']()).to.equal(ZERO_ADDRESS);
            });

            it('doesn\'t pre-set transfer fee', async () => {
                expect(await this.contract['transferToPublicNetworkFee']()).to.be.bignumber.equal('0');
            });
            
            it('doesn\'t preset transfers as processed', async () => {
                expect(await this.contract['isProcessed'](0)).to.equal(false);
            });

            describe('setting treasury', () => {

                it('sets treasury', async () => {
                    await this.contract['setTreasuryAccount'](treasury, { from: owner });
                    expect(await this.contract['treasuryAccount']()).to.equal(treasury);
                });

                it('emits TreasuryAccountSet event', async () => {
                    const { logs } = await this.contract['setTreasuryAccount'](treasury, { from: owner });
                    await expectEvent.inLogs(logs, 'TreasuryAccountSet', {
                        account: treasury
                    });
                });

                it('reverts when account is the zero address', async () => {
                    await expectRevert(this.contract['setTreasuryAccount'](ZERO_ADDRESS, { from: owner }),
                        'MVNGateway: account is the zero address');
                });
                
                it('reverts when setting from non-owner account', async () => {
                    await expectRevert(this.contract['setTreasuryAccount'](treasury, { from: other }),
                        'MVNGatewayRoles: caller is not the Owner');
                });
                
            });

            describe('setting tranfer fee', () => {

                it('sets transfer fee', async () => {
                    await this.contract['setTransferToPublicNetworkFee'](42, { from: manager });
                    expect(await this.contract['transferToPublicNetworkFee']()).to.be.bignumber.equal('42');
                });

                it('emits TransferToPublicNetworkFeeSet event', async () => {
                    const { logs } = await this.contract['setTransferToPublicNetworkFee'](42, { from: manager });
                    await expectEvent.inLogs(logs, 'TransferToPublicNetworkFeeSet', {
                        amount: '42'
                    });
                });
                
                it('reverts when setting from non-manager account', async () => {
                    await expectRevert(this.contract['setTransferToPublicNetworkFee'](42, { from: other }),
                        'MVNGatewayRoles: caller does not have the Manager role');
                });
                
            });
            
            describe('receiving transfer', () => {

                it('reverts when public account is not linked', async () => {
                    await this.mvnToken['mint'](other, 42, { from: minter });
                    await expectRevert(this.mvnToken['send'](this.contract.address, 42, '0x', { from: other }),
                        'MVNGateway: public account is not linked');
                });
                
                it('reverts when from is the zero address', async () => {
                    await expectRevert(this.mvnToken['mint'](this.contract.address, 42, { from: minter }),
                        'MVNGateway: from is the zero address');
                });
                
                it('reverts when not MVN tokens received', async () => {
                    await expectRevert(this.contract['tokensReceived'](spender, spender, this.contract.address, 42, '0x', '0x', { from: other }),
                        'MVNRecipient: sender is not mvn token');
                });
                
            });

            describe('linking public account', () => {

                it('links public account to an internal account', async () => {
                    await this.contract['linkPublicAccount'](spender, publicAccount, 0, { from: linker });
                    expect(await this.contract['getPublicAccount'](spender)).to.equal(publicAccount);
                });

                it('links internal account to a public account', async () => {
                    await this.contract['linkPublicAccount'](spender, publicAccount, 0, { from: linker });
                    expect(await this.contract['getInternalAccount'](publicAccount)).to.equal(spender);
                });

                it('emits a PublicAccountLinked event', async () => {
                    const { logs } = await this.contract['linkPublicAccount'](spender, publicAccount, 0, { from: linker });
                    await expectEvent.inLogs(logs, 'PublicAccountLinked', {
                        internalAccount: spender,
                        publicAccount: publicAccount
                    });
                });
                
                describe('when fee is specified', () => {

                    beforeEach(async () => {
                        await this.contract['setTreasuryAccount'](treasury, { from: owner });
                    });
                    
                    it('collects specified fee', async () => {
                        await this.contract['linkPublicAccount'](spender, publicAccount, 42, { from: linker });
                        expect(await this.mvnToken['balanceOf'](spender)).to.be.bignumber.equal('958');
                    });
                    
                    it('emits FeeColected event with a correct reason', async () => {
                        const { tx } = await this.contract['linkPublicAccount'](spender, publicAccount, 42, { from: linker });
                        await expectEvent.inTransaction(tx, MVNToken, 'FeeCollected', {
                            from: spender,
                            to: treasury,
                            amount: '42',
                            reason: 'Fee for Ethereum account linking'
                        });
                    });
                    
                });
                
                it('reverts when internal account is the zero address', async () => {
                    await expectRevert(this.contract['linkPublicAccount'](ZERO_ADDRESS, publicAccount, 0, { from: linker }),
                        'MVNGateway: internal account is the zero address'
                    );
                });

                it('reverts when public account is the zero address', async () => {
                    await expectRevert(this.contract['linkPublicAccount'](spender, ZERO_ADDRESS, 0, { from: linker }),
                        'MVNGateway: public account is the zero address'
                    );
                });

                it('reverts when linking from non-linker\'s account', async () => {
                    await expectRevert(this.contract['linkPublicAccount'](spender, publicAccount, 0, { from: other }),
                        'MVNGatewayRoles: caller does not have the Linker role'
                    );
                });

            });
            
        });
        
        describe('with linked accounts', () => {

            beforeEach(async () => {
                await this.contract['linkPublicAccount'](spender, publicAccount, 0, { from: linker })
            });
            
            describe('getting public account', () => {
                
                it('returns public account', async () => {
                    expect(await this.contract['getPublicAccount'](spender)).to.equal(publicAccount);
                });

                it('reverts when getting for the zero address', async () => {
                    await expectRevert(this.contract['getPublicAccount'](ZERO_ADDRESS),
                        'MVNGateway: internal account is the zero address'
                    );
                });
                
            });

            describe('getting internal account', () => {

                it('returns internal account', async () => {
                    expect(await this.contract['getInternalAccount'](publicAccount)).to.equal(spender);
                });
                
                it('reverts when getting for the zero address', async () => {
                    await expectRevert(this.contract['getInternalAccount'](ZERO_ADDRESS),
                        'MVNGateway: public account is the zero address'
                    );
                });
                
            });
            
            describe('relinking public account', () => {

                const newPublicAccount = '0x3C4823bf1cb716686b11C395210eBB1c64dA081B';
                
                it('relinks public account', async () => {
                    await this.contract['linkPublicAccount'](spender, newPublicAccount, 0, { from: linker });

                    expect(await this.contract['getPublicAccount'](spender)).to.equal(newPublicAccount);
                    expect(await this.contract['getInternalAccount'](newPublicAccount)).to.equal(spender);
                    expect(await this.contract['getInternalAccount'](publicAccount)).to.equal(ZERO_ADDRESS);
                });

                it('emits PublicAccountUnlinked and PublicAccountLinked events', async () => {
                    const { logs } = await this.contract['linkPublicAccount'](spender, newPublicAccount, 0, { from: linker });
                    
                    await expectEvent.inLogs(logs, 'PublicAccountUnlinked', {
                        internalAccount: spender,
                        publicAccount: publicAccount
                    });

                    await expectEvent.inLogs(logs, 'PublicAccountLinked', {
                        internalAccount: spender,
                        publicAccount: newPublicAccount
                    });
                });
                
            });
            
            describe('unlinking public account', () => {
                
                it('unlinks public account', async () => {
                    await this.contract['unlinkPublicAccount'](spender, { from: linker });

                    expect(await this.contract['getPublicAccount'](spender)).to.equal(ZERO_ADDRESS);
                    expect(await this.contract['getInternalAccount'](publicAccount)).to.equal(ZERO_ADDRESS);
                });

                it('emits PublicAccountUnlinked event', async () => {
                    const { logs } = await this.contract['unlinkPublicAccount'](spender, { from: linker });
                    await expectEvent.inLogs(logs, 'PublicAccountUnlinked', {
                        internalAccount: spender,
                        publicAccount: publicAccount
                    });
                });
                
                it('reverts when public account is not linked', async () => {
                    await expectRevert(this.contract['unlinkPublicAccount'](other, { from: linker }),
                        'MVNGateway: public account is not linked');
                });
                
                it('reverts when called from non-linker\'s account', async () => {
                    await expectRevert(this.contract['unlinkPublicAccount'](other, { from: other }),
                        'MVNGatewayRoles: caller does not have the Linker role');
                })
                
            });

            describe('receiving transfer', () => {

                it('emits TransferredToPublicNetwork event', async () => {
                    const { tx } = await this.mvnToken['send'](this.contract.address, 42, '0x', { from: spender });
                    await expectEvent.inTransaction(tx, MVNGateway, 'TransferredToPublicNetwork', {
                        internalAccount: spender,
                        publicAccount: publicAccount,
                        internalTransferId: '0',
                        amount: '42'
                    });
                });
                
                describe('when fee is set', () => {
                    
                    beforeEach(async () => {
                        await this.contract['setTreasuryAccount'](treasury, { from: owner });
                        await this.contract['setTransferToPublicNetworkFee'](2, { from: manager });
                    });
                   
                    it('collects configured fee', async () => {
                        await this.mvnToken['send'](this.contract.address, 42, '0x', { from: spender });
                        expect(await this.mvnToken['balanceOf'](spender)).to.be.bignumber.equal('956');
                    });

                    it('emits FeeColected event with a correct reason', async () => {
                        const { tx } = await this.mvnToken['send'](this.contract.address, 42, '0x', { from: spender });
                        await expectEvent.inTransaction(tx, MVNToken, 'FeeCollected', {
                            from: spender,
                            to: treasury,
                            amount: '2',
                            reason: 'Fee for transfer to Ethereum network'
                        });
                    });
                    
                });
                
            });

            describe('transferring from public network', () => {

                beforeEach(async () => {
                    await this.mvnToken['send'](this.contract.address, 100, '0x', { from: spender });
                });

                it('sends specified amount of tokens to the specified internal account', async () => {
                    await this.contract['transferFromPublicNetwork'](publicAccount, spender, 0, 42, { from: bridge });
                    expect(await this.mvnToken['balanceOf'](spender)).to.be.bignumber.equal('942');
                });

                it('emits TransferredFromPublicNetwork event', async () => {
                    const { logs } = await this.contract['transferFromPublicNetwork'](publicAccount, spender, 0, 42, { from: bridge });
                    await expectEvent.inLogs(logs, 'TransferredFromPublicNetwork', {
                        publicAccount: publicAccount,
                        internalAccount: spender,
                        publicTransferId: '0',
                        amount: '42'
                    });
                });

                it('marks specified transfer id as processed', async () => {
                    await this.contract['transferFromPublicNetwork'](publicAccount, spender, 14, 42, { from: bridge });
                    expect(await this.contract['isProcessed'](14)).to.equal(true);
                });

                it('reverts when public account is the zero address', async () => {
                    await expectRevert(this.contract['transferFromPublicNetwork'](ZERO_ADDRESS, spender, 0, 42, { from: bridge }),
                        'MVNGateway: public account is the zero address');
                });

                it('reverts when internal account is the zero address', async () => {
                    await expectRevert(this.contract['transferFromPublicNetwork'](publicAccount, ZERO_ADDRESS, 0, 42, { from: bridge }),
                        'MVNGateway: internal account is the zero address');
                });

                it('reverts when transfer with the specified id has already been processed', async () => {
                    await this.contract['transferFromPublicNetwork'](publicAccount, spender, 14, 42, { from: bridge });
                    await expectRevert(this.contract['transferFromPublicNetwork'](publicAccount, spender, 14, 42, { from: bridge }),
                        'MVNGateway: incoming transfer has already been processed');
                });

                it('reverts when called from non-bridge account', async () => {
                    await expectRevert(this.contract['transferFromPublicNetwork'](publicAccount, spender, 0, 42, { from: other }),
                        'MVNGatewayRoles: caller does not have the Bridge role');
                });

            });
            
        });
    });
    
});