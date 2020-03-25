const { expectRevert, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const RoleRegistry = artifacts.require('RoleRegistry');

contract('RoleRegistry', ([_, owner, authorized, otherAuthorized, other]) => {

    const resource = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const role = "Mocker";
    
    const invalidRoles = [
        '',
        'ThisRoleNameIsLongerThen32Symbols'
    ];
    
    context('during deployment', () => {
    
        it('does not revert', async () => {
            await RoleRegistry["new"]();
        });
        
    });
    
    context('during initialization', () => {

        beforeEach(async () => {
            this.contract = await RoleRegistry["new"]();
        });
        
        describe('when parameters are valid', () => {
    
            beforeEach(async () => {
                await this.contract['initialize_v1'](owner);
            });
            
            it('should set correct owner', async () => {
                expect(await this.contract['owner']()).to.equal(owner);
            });
    
            it('should set correct version', async () => {
                expect(await this.contract['version']()).to.be.bignumber.equal('1');
            });
            
        });

        describe('when contract has already been initialized', () => {
    
            beforeEach(async () => {
                await this.contract['initialize_v1'](owner);
            });
            
            it('reverts', async () => {
                await expectRevert(this.contract['initialize_v1'](ZERO_ADDRESS),
                    'Contract instance has already been initialized'
                );
            })
            
        });

        describe('when owner is the zero address', () => {

            it('reverts', async () => {
                await expectRevert(this.contract['initialize_v1'](ZERO_ADDRESS),
                    'RoleRegistry: owner is the zero address'
                );
            })

        });

    });
    
    context('after initialization', () => {

        beforeEach(async () => {
            this.contract = await RoleRegistry["new"]();
            await this.contract['initialize_v1'](owner);
        });

        context('initially', () => {
            
            it('doesn\'t pre-assign roles', async () => {
                expect(await this.contract['isInRole'](resource, authorized, role)).to.equal(false);
                expect(await this.contract['isInRole'](resource, otherAuthorized, role)).to.equal(false);
                expect(await this.contract['isInRole'](resource, other, role)).to.equal(false);
            });

            it('pre-assigns owner', async () => {
                expect(await this.contract['isOwner'](owner)).to.equal(true);
            });
            
            describe('adding roles', () => {

                it('adds roles to a single account', async () => {
                    await this.contract['addRole'](resource, authorized, role, { from: owner });

                    expect(await this.contract['isInRole'](resource, authorized, role)).to.equal(true);
                    expect(await this.contract['isInRole'](resource, other, role)).to.equal(false);
                });

                it('emits RoleAdded event', async () => {
                    const { logs } = await this.contract['addRole'](resource, authorized, role, { from: owner });

                    await expectEvent.inLogs(logs, 'RoleAdded', {
                        resource: resource,
                        account: authorized,
                        role: role
                    });
                });

                it('reverts when adding roles to an already assigned account', async () => {
                    await this.contract['addRole'](resource, authorized, role, { from: owner });

                    await expectRevert(this.contract['addRole'](resource, authorized, role, { from: owner }),
                        'Roles: account already has role'
                    );
                });

                it('reverts when adding roles to the zero account', async () => {
                    await expectRevert(this.contract['addRole'](resource, ZERO_ADDRESS, role, { from: owner }),
                        'Roles: account is the zero address');
                });

                it('reverts when adding roles to the zero resource', async () => {
                    await expectRevert(this.contract['addRole'](ZERO_ADDRESS, authorized, role, { from: owner }),
                        'RoleRegistry: resource is the zero address');
                });

                it('reverts when adding invalid role', async () => {
                    for (let i = 0; i < invalidRoles.length; ++i) {
                        await expectRevert(this.contract['addRole'](resource, authorized, invalidRoles[i], { from: owner }),
                            'RoleRegistry: role is invalid');
                    }
                });

            });

            describe('checking ownership', () => {

                it('reverts when checking for the zero address', async () => {
                    await expectRevert(this.contract['isOwner'](ZERO_ADDRESS),
                        'RoleRegistry: account is the zero address');
                });
                
            });
            
            describe('renouncing ownership', () => {
               
                it('reverts', async () => {
                    await expectRevert(this.contract['renounceOwnership'](),
                        'RoleRegistry: ownership can not be renounced');
                })
                
            });
            
        });

        context('with added roles', () => {

            beforeEach(async () => {
                await this.contract['addRole'](resource, authorized, role, { from: owner });
                await this.contract['addRole'](resource, otherAuthorized, role, { from: owner });
            });

            describe('checking roles', () => {

                it('reverts when checking for the zero resource', async () => {
                    await expectRevert(this.contract['isInRole'](ZERO_ADDRESS, authorized, role),
                        'RoleRegistry: resource is the zero address');
                });

                it('reverts when checking invalid role', async () => {

                    for (let i = 0; i < invalidRoles.length; ++i) {
                        await expectRevert(this.contract['isInRole'](resource, authorized, invalidRoles[i]),
                            'RoleRegistry: role is invalid');
                    }
                });
                
            });
            
            describe('removing roles',  () => {

                it('removes a single role', async () => {
                    await this.contract['removeRole'](resource, authorized, role, { from: owner });

                    expect(await this.contract['isInRole'](resource, authorized, role)).to.equal(false);
                    expect(await this.contract['isInRole'](resource, otherAuthorized, role)).to.equal(true);
                });

                it('emits RoleRemoved event', async () => {
                    const { logs } = await this.contract['removeRole'](resource, authorized, role, { from: owner });;

                    await expectEvent.inLogs(logs, 'RoleRemoved', {
                        resource: resource,
                        account: authorized,
                        role: role
                    });
                });

                it('reverts when removing unassigned roles', async () => {
                    await expectRevert(this.contract['removeRole'](resource, other, role, { from: owner }),
                        'Roles: account does not have role');
                });

                it('reverts when removing roles from the zero account', async () => {
                    await expectRevert(this.contract['removeRole'](resource, ZERO_ADDRESS, role, { from: owner }),
                        'Roles: account is the zero address');
                });

                it('reverts when removing roles from the zero resource', async () => {
                    await expectRevert(this.contract['removeRole'](ZERO_ADDRESS, authorized, role, { from: owner }),
                        'RoleRegistry: resource is the zero address');
                });

                it('reverts when removing invalid role', async () => {

                    for (let i = 0; i < invalidRoles.length; ++i) {
                        await expectRevert(this.contract['removeRole'](resource, authorized, invalidRoles[i], { from: owner }),
                            'RoleRegistry: role is invalid');
                    }
                    
                });
                
            });
            
            describe('renouncing roles', () => {

                it('removes a single role', async () => {
                    await this.contract['renounceRole'](resource, role, { from: authorized });

                    expect(await this.contract['isInRole'](resource, authorized, role)).to.equal(false);
                    expect(await this.contract['isInRole'](resource, otherAuthorized, role)).to.equal(true);
                });
                
            });

        });
        
    });

});