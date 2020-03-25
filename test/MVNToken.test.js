const { expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { dependencies } = require('./helpers/dependencies');

const { expect } = require('chai');

const MVNToken = artifacts.require('MVNTokenMock');
const MVNTokenRoles = artifacts.require('MVNTokenRoles');

contract('MVNToken', ([_, funder, owner, minter, feeCollector, seizer, staker, spender, treasury, other]) => {

    beforeEach(async () => {
        const { erc1820Registry, roleRegistry } = await dependencies(funder, owner);

        this.erc1820Registry = erc1820Registry;
        this.roleRegistry = roleRegistry;
    });

    context('during deployment', () => {

        it('does not revert', async () => {
            const mvnTokenRoles = await MVNTokenRoles['new']();
            await MVNToken.link('MVNTokenRoles', mvnTokenRoles.address);
            await MVNToken["new"]();
        });

    });

    context('during initialization', () => {

        beforeEach(async () => {
            const mvnTokenRoles = await MVNTokenRoles['new']();
            await MVNToken.link('MVNTokenRoles', mvnTokenRoles.address);
            this.contract = await MVNToken["new"]();
        });

        describe('when contract has already been initialized', () => {

            beforeEach(async () => {
                await this.contract['initialize_v1'](this.erc1820Registry.address, this.roleRegistry.address);
            });

            it('reverts', async () => {
                await expectRevert(this.contract['initialize_v1'](this.erc1820Registry.address, this.roleRegistry.address),
                    'Contract instance has already been initialized'
                );
            });

        });

    });
    
    context('after initialization', () => {

        beforeEach(async () => {
            const mvnTokenRoles = await MVNTokenRoles['new']();
            await MVNToken.link('MVNTokenRoles', mvnTokenRoles.address);
            this.contract = await MVNToken["new"]();

            await this.roleRegistry['addRole'](this.contract.address, feeCollector, "FeeCollector", { from: owner });
            await this.roleRegistry['addRole'](this.contract.address, minter, "Minter", { from: owner });
            await this.roleRegistry['addRole'](this.contract.address, seizer, "Seizer", { from: owner });
            await this.roleRegistry['addRole'](this.contract.address, staker, "Staker", { from: owner });
            
            await this.contract['initialize_v1'](this.erc1820Registry.address, this.roleRegistry.address);
        });
        
        describe('initially', () => {

            it('pre-sets correct version number', async () => {
                expect(await this.contract['version']()).to.be.bignumber.equal('1');
            });
            
            it('doesn\'t pre-set stakes', async () => {
                expect(await this.contract['stakeOf'](spender)).to.be.bignumber.equal('0');
            });
            
        });
        
        describe('minting tokens', () => {
           
            it('reverts when minting from non-minters\'s account', async () => {
                await expectRevert(this.contract['mint'](spender, 42, { from: other }),
                    'MVNTokenRoles: caller does not have the Minter role');
            });
            
        });

        describe('burning tokens', () => {

            beforeEach(async () => {
                await this.contract['mint'](spender, 42, { from: minter });
                await this.contract['increaseStake'](spender, 21, { from: staker })
            });
            
            it('reverts when non-staked balance if not enough', async () => {
                await expectRevert(this.contract['burn'](42, '0x', { from: spender }),
                    'MVNToken: amount exceeds non-staked balance');
            });
            
        });
        
        describe('seizing tokens', () => {
            
            beforeEach(async () => {
                await this.contract['mint'](spender, 42, { from: minter });
            });
            
            it('decreases account balance', async () => {
                await this.contract['seizeFrom'](spender, 21, 'Because of test', { from: seizer });
                expect(await this.contract['balanceOf'](spender)).to.be.bignumber.equal('21');
            });

            it('emits SeizeFrom event', async () => {
                const { logs } = await this.contract['seizeFrom'](spender, 21, 'Because of test', { from: seizer });
                await expectEvent.inLogs(logs, 'SeizeFrom', {
                    account: spender,
                    amount: '21',
                    reason: 'Because of test'
                });
            });
            
            it('reverts when seizing from non-seizer\'s account', async () => {
                await expectRevert(this.contract['seizeFrom'](spender, 21, 'Because of test', { from: other }),
                    'MVNTokenRoles: caller does not have the Seizer role');
            });
            
        });
        
        describe('collecting fees', () => {

            beforeEach(async () => {
                await this.contract['mint'](spender, 42, { from: minter });
            });
            
            it('moves tokens to treasury account', async () => {
                await this.contract['collectFee'](spender, treasury, 42, 'Because of test', { from: feeCollector });
                
                expect(await this.contract['balanceOf'](spender)).to.be.bignumber.equal('0');
                expect(await this.contract['balanceOf'](treasury)).to.be.bignumber.equal('42');
            });
            
            it('emits FeeCollected event', async () => {
                const { logs } = await this.contract['collectFee'](spender, treasury, 42, 'Because of test', { from: feeCollector });
                await expectEvent.inLogs(logs, 'FeeCollected', {
                    from: spender,
                    to: treasury,
                    amount: '42',
                    reason: 'Because of test'
                });
            });
            
            it('reverts when from is the zero address', async () => {
                await expectRevert(this.contract['collectFee'](ZERO_ADDRESS, treasury, 21, 'Because of test', { from: feeCollector }),
                    'MVNToken: from is the zero address');
            });

            it('reverts when to is the zero address', async () => {
                await expectRevert(this.contract['collectFee'](spender, ZERO_ADDRESS, 21, 'Because of test', { from: feeCollector }),
                    'MVNToken: to is the zero address');
            });
            
            it('reverts when collectiong from non-collector\'s account', async () => {
                await expectRevert(this.contract['collectFee'](spender, treasury, 21, 'Because of test', { from: other }),
                    'MVNTokenRoles: caller does not have the FeeCollector role');
            });
            
        });
        
        describe('checking stake', () => {
           
            it ('reverts when checking for the zero address', async () => {
                await expectRevert(this.contract['stakeOf'](ZERO_ADDRESS),
                    'MVNToken: account is the zero address');
            })
            
        });
        
        describe('increasing stake', () => {

            beforeEach(async () => {
                await this.contract['mint'](spender, 42, { from: minter });
                await this.contract['increaseStake'](spender, 20, { from: staker });
            });
            
            it('increases stake', async () => {
                await this.contract['increaseStake'](spender, 17, { from: staker });
                expect(await this.contract['stakeOf'](spender)).to.be.bignumber.equal('37');
            });
            
            it('emits StakeIncreased event', async () => {
                const { logs } = await this.contract['increaseStake'](spender, 17, { from: staker });
                await expectEvent.inLogs(logs, 'StakeIncreased', {
                    account: spender,
                    amount: '17'
                });
            });
            
            it('reverts when stake exceeds balance', async () => {
                await expectRevert(this.contract['increaseStake'](spender, 39, { from: staker }),
                    'MVNToken: stake exceeds balance');
            });

            it('reverts when increasing stake for the zero address', async () => {
                await expectRevert(this.contract['increaseStake'](ZERO_ADDRESS, 42, { from: staker }),
                    'MVNToken: account is the zero address');
            });

            it('reverts when increasing stake from non-staker\'s account', async () => {
                await expectRevert(this.contract['increaseStake'](spender, 1, { from: other }),
                    'MVNTokenRoles: caller does not have the Staker role');
            });
        });
        
        describe('decreasing stake', () => {
            
            beforeEach(async () => {
                await this.contract['mint'](spender, 42, { from: minter });
                await this.contract['increaseStake'](spender, 21, { from: staker });
            });

            it('decreases stake', async () => {
                await this.contract['decreaseStake'](spender, 17, 0, { from: staker });
                expect(await this.contract['stakeOf'](spender)).to.be.bignumber.equal('4');
            });

            it('emits StakeDecreased event', async () => {
                const { logs } = await this.contract['decreaseStake'](spender, 17, 4, { from: staker });
                await expectEvent.inLogs(logs, 'StakeDecreased', {
                    account: spender,
                    releasedAmount: '17',
                    burntAmount: '4'
                });
            });
            
            it('burns specified amount of tokens when part of a stake should be burned', async () => {
                await this.contract['decreaseStake'](spender, 17, 4, { from: staker });
                expect(await this.contract['balanceOf'](spender)).to.be.bignumber.equal('38');
            });

            it('burns all tokens when part of a stake should be burned and this part exceeds balance', async () => {
                await this.contract['seizeFrom'](spender, 40, 'Because of test', { from: seizer });
                await this.contract['decreaseStake'](spender, 17, 4, { from: staker });
                expect(await this.contract['balanceOf'](spender)).to.be.bignumber.equal('0');
            });
            
            it('reverts when decreasing stake for the zero address', async () => {
                await expectRevert(this.contract['decreaseStake'](ZERO_ADDRESS, 42, 0, { from: staker }),
                    'MVNToken: account is the zero address');
            });

            it('reverts when decreasing stake from non-staker\'s account', async () => {
                await expectRevert(this.contract['decreaseStake'](spender, 1, 0, { from: other }),
                    'MVNTokenRoles: caller does not have the Staker role');
            });
        });
        
        describe('moving tokens', () => {

            beforeEach(async () => {
                await this.contract['mint'](spender, 42, { from: minter });
                await this.contract['increaseStake'](spender, 21, { from: staker });
            });
            
            it('reverts when amount exceeds non-staked balance', async () => {
                await expectRevert(this.contract['move'](spender, spender, other, 22, '0x', '0x'),
                    'MVNToken: amount exceeds non-staked balance')
            });
            
            describe('if some tokens has been previously seized', () => {

                beforeEach(async () => {
                    await this.contract['seizeFrom'](spender, 30, 'Because of test', { from: seizer });
                });
                
                it('also reverts when amount exceeds non-staked balance', async () => {
                    await expectRevert(this.contract['move'](spender, spender, other, 12, '0x', '0x'),
                        'MVNToken: amount exceeds non-staked balance')
                });
                
            });
            
        });
        
    });
    
});