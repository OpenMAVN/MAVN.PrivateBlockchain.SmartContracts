const { expectRevert, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { dependencies } = require('./helpers/dependencies');

const { expect } = require('chai');

const CustomerRegistry = artifacts.require('CustomerRegistry');
const CustomerRegistryRoles = artifacts.require('CustomerRegistryRoles');

contract('CustomerRegistry', ([_, funder, owner, registrar, customer, other]) => {

    beforeEach(async () => {
        const { mvnToken, erc1820Registry, roleRegistry } = await dependencies(funder, owner);

        this.mvnToken = mvnToken;
        this.erc1820Registry = erc1820Registry;
        this.roleRegistry = roleRegistry;
    });

    context('during deployment', () => {

        it('does not revert', async () => {
            const customerRegistryRoles = await CustomerRegistryRoles['new']();
            await CustomerRegistry.link('CustomerRegistryRoles', customerRegistryRoles.address);
            await CustomerRegistry["new"]();
        });

    });

    context('during initialization', () => {

        beforeEach(async () => {
            const customerRegistryRoles = await CustomerRegistryRoles['new']();
            await CustomerRegistry.link('CustomerRegistryRoles', customerRegistryRoles.address);
            this.contract = await CustomerRegistry["new"]();
        });

        describe('when contract has already been initialized', () => {

            beforeEach(async () => {
                await this.contract['initialize_v1'](this.roleRegistry.address);
            });

            it('reverts', async () => {
                await expectRevert(this.contract['initialize_v1'](this.roleRegistry.address),
                    'Contract instance has already been initialized'
                );
            });

        });

    });
    
    context('after initialization', () => {

        const customerId = 'f7c9d576-3ada-4dca-94f3-cae0b201dbfe';
        const customerAddress = '0xf97b5d65Da6b0468b90D531ddae2a69843e6797d';
        
        beforeEach(async () => {
            const customerRegistryRoles = await CustomerRegistryRoles['new']();
            await CustomerRegistry.link('CustomerRegistryRoles', customerRegistryRoles.address);
            this.contract = await CustomerRegistry["new"]();

            await this.contract['initialize_v1'](this.roleRegistry.address);
            
            await this.roleRegistry['addRole'](this.contract.address, registrar, 'Registrar', { from: owner});
        });
        
        describe('initially', () => {

            it('pre-sets correct version number', async () => {
                expect(await this.contract['version']()).to.be.bignumber.equal('1');
            });

            it ('doesn\'t pre-set customers count', async () => {
                expect(await this.contract['customersCount']()).to.be.bignumber.equal('0');
            });
            
            it('doesn\'t pre-set customers', async () => {
                const { customerAddress, customerId } = await this.contract['getCustomer'](0);
                
                expect(customerAddress).to.equal(ZERO_ADDRESS);
                expect(customerId).to.equal('');
            });
            
            describe('registering customers', () => {

                it('adds customer to the registry', async () => {
                    await this.contract['registerCustomer'](customerId, customerAddress, { from: registrar });

                    expect(await this.contract['isCustomer'](customerAddress)).to.equal(true);

                    expect(await this.contract['addressOf'](customerId)).to.equal(customerAddress);
                    expect(await this.contract['idOf'](customerAddress)).to.equal(customerId);
                    expect(await this.contract['indexOf'](customerId)).to.be.bignumber.equal('0');

                    const customer = await this.contract['getCustomer'](0);

                    expect(customer.customerAddress).to.equal(customerAddress);
                    expect(customer.customerId).to.equal(customerId);
                });
                
                it('increases customers count', async () => {
                    await this.contract['registerCustomer'](customerId, customerAddress, { from: registrar });
                    expect(await this.contract['customersCount']()).to.be.bignumber.equal('1');
                });

                it('emits CustomerRegistered event', async () => {
                    const { logs } = await this.contract['registerCustomer'](customerId, customerAddress, { from: registrar });
                    expectEvent.inLogs(logs, 'CustomerRegistered', {
                        customerId: customerId,
                        customerIdIndex: web3.utils.keccak256(customerId),
                        customerAddress: customerAddress
                    });
                });
                
                it('reverts when registering customer with the zero address', async () => {
                    await expectRevert(this.contract['registerCustomer'](customerId, ZERO_ADDRESS, { from: registrar }),
                        'CustomerRegistry: customer address is the zero address');
                });

                it('reverts when registering customer with an invalid identifier', async () => {
                    await expectRevert(this.contract['registerCustomer']('f7c9d576', customerAddress, { from: registrar }),
                        'CustomerRegistry: customer id is invalid');
                });

                it('reverts when registering customer with an address that is already taken', async () => {
                    await this.contract['registerCustomer'](customerId, customerAddress, { from: registrar });
                    await expectRevert(this.contract['registerCustomer']('a8c9d576-3ada-4dca-94f3-cae0b201dbed', customerAddress, { from: registrar }),
                        'CustomerRegistry: customer address is already taken');
                });

                it('reverts when registering customer with an identifier that is already taken', async () => {
                    await this.contract['registerCustomer'](customerId, customerAddress, { from: registrar });
                    await expectRevert(this.contract['registerCustomer'](customerId, '0xe97b5d65da6b0468b90d531ddae2a69843e6797d', { from: registrar }),
                        'CustomerRegistry: customer id is already taken');
                });
                
                it('reverts when registering customer from non-registrar account', async () => {
                    await expectRevert(this.contract['registerCustomer'](customerId, customerAddress, { from: other }),
                        'CustomerRegistryRoles: caller does not have the Registrar role');
                });
                
            });
            
        });
        
        describe('with registered customers', () => {
            
            const newCustomerAddress = '0xe97B5d65Da6B0468b90D531ddAE2a69843E6797d';
            
            beforeEach(async () => {
                await this.contract['registerCustomer'](customerId, customerAddress, { from: registrar });
            });
            
            describe('updating customer', () => {

                it ('updates customer', async () => {
                    await this.contract['updateCustomer'](customerId, newCustomerAddress, { from: registrar });

                    expect(await this.contract['isCustomer'](customerAddress)).to.equal(false);
                    expect(await this.contract['isCustomer'](newCustomerAddress)).to.equal(true);

                    expect(await this.contract['addressOf'](customerId)).to.equal(newCustomerAddress);
                    expect(await this.contract['idOf'](newCustomerAddress)).to.equal(customerId);
                    expect(await this.contract['indexOf'](customerId)).to.be.bignumber.equal('0');

                    const customer = await this.contract['getCustomer'](0);

                    expect(customer.customerAddress).to.equal(newCustomerAddress);
                    expect(customer.customerId).to.equal(customerId);
                });
                
                it('emits CustomerUpdated event', async () => {
                    const { logs } = await this.contract['updateCustomer'](customerId, newCustomerAddress, { from: registrar });
                    expectEvent.inLogs(logs, 'CustomerUpdated', {
                        customerId: customerId,
                        customerIdIndex: web3.utils.keccak256(customerId),
                        previousCustomerAddress: customerAddress,
                        newCustomerAddress: newCustomerAddress
                    });
                });
                
                it('reverts when customer with the specified identifier is not registered', async () => {
                    await expectRevert(this.contract['updateCustomer']('a8c9d576-3ada-4dca-94f3-cae0b201dbed', newCustomerAddress, { from: registrar }),
                        'CustomerRegistry: customer is not registered');
                });
                
                it('reverts when new customer address is the zero address', async () => {
                    await expectRevert(this.contract['updateCustomer'](customerId, ZERO_ADDRESS, { from: registrar }),
                        'CustomerRegistry: new (updated) customer address is the zero address');
                });

                it('reverts when customer identifier is invalid', async () => {
                    await expectRevert(this.contract['updateCustomer']('f7c9d576', customerAddress, { from: registrar }),
                        'CustomerRegistry: customer id is invalid');
                });
                
            });
            
        });
    });
    
});