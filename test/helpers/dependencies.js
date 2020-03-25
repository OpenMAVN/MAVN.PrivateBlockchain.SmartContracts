const { singletons } = require('@openzeppelin/test-helpers');

const MVNToken = artifacts.require('MVNToken');
const MVNTokenRoles = artifacts.require('MVNTokenRoles');
const RoleRegistry = artifacts.require('RoleRegistry');

async function dependencies(funder, owner) {

    const mvnTokenRoles = await MVNTokenRoles['new']();

    await MVNToken.link('MVNTokenRoles', mvnTokenRoles.address);
    
    const mvnToken = await MVNToken['new']();
    const erc1820Registry = await singletons.ERC1820Registry(funder);
    const roleRegistry = await RoleRegistry['new']();

    await mvnToken['initialize_v1'](erc1820Registry.address, roleRegistry.address);
    await roleRegistry['initialize_v1'](owner);
    
    return {
        mvnToken: mvnToken,
        erc1820Registry: erc1820Registry,
        roleRegistry: roleRegistry
    }
}

module.exports = {
    dependencies
};