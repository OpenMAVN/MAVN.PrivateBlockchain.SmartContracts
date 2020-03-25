const { expectRevert, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { dependencies } = require('./helpers/dependencies');

const { expect } = require('chai');

const RoleRegistryClient = artifacts.require('RoleRegistryClient');

contract('RoleRegistry', ([_, funder, owner]) => {

    beforeEach(async () => {
        const { mvnToken, erc1820Registry, roleRegistry } = await dependencies(funder, owner);

        this.mvnToken = mvnToken;
        this.erc1820Registry = erc1820Registry;
        this.roleRegistry = roleRegistry;
    });
    
    context('during deployment', () => {

        it('does not revert', async () => {
            await RoleRegistryClient["new"]();
        });

    });

    context('during initialization', () => {

        beforeEach(async () => {
            this.contract = await RoleRegistryClient["new"]();
        });

        describe('when parameters are valid', () => {

            beforeEach(async () => {
                await this.contract['initialize_v1'](this.roleRegistry.address);
            });

            it('should set correct role registry', async () => {
                expect(await this.contract['roleRegistry']()).to.equal(this.roleRegistry.address);
            });
            
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

        describe('when role registry is the zero address', () => {

            it('reverts', async () => {
                await expectRevert(this.contract['initialize_v1'](ZERO_ADDRESS),
                    'RoleRegistryClient: roleRegistry is the zero address'
                );
            })

        });
        
    });
    
});