const deployment = require(`../.openzeppelin/dev-${artifacts.options.network_id}.json`);
const argv = require("yargs").argv;

const RoleRegistry = artifacts.require('RoleRegistry');

const supportedRoles = [
    'Bridge',
    'FeeCollector',
    'Linker',
    'Manager',
    'Minter',
    'Registrar',
    'Seizer',
    'Staker'
];

module.exports = async function(done) {

    try {

        const contractName = argv['contract-name'];
        const account = argv['account'];
        const role = argv['role'];

        if(!supportedRoles.includes(role)) {
            // noinspection ExceptionCaughtLocallyJS
            throw `Unsupported role ${role}`;
        }
        
        const contractAddress = deployment.proxies[`falcon-os/${contractName}`][0].address;
        const roleRegistryAddress = deployment.proxies[`falcon-os/RoleRegistry`][0].address;

        console.log(`${contractName} at ${contractAddress}. Adding role '${role}' to ${account}.`);
        
        const roleRegistry = await RoleRegistry.at(roleRegistryAddress);
        
        if (!await roleRegistry.isInRole(contractAddress, account, role)) {
            await roleRegistry.addRole(contractAddress, account, role);
            console.log(`${contractName} at ${contractAddress}. Role '${role}' has been added to ${account}.`);
        } else {
            console.log(`${contractName} at ${contractAddress}. ${account} already has '${role}' role.`);
        }
        
        done();

    } catch(error) {
        done(error);
    }

};