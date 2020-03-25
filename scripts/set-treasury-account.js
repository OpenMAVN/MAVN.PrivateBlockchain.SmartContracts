const deployment = require(`../.openzeppelin/dev-${artifacts.options.network_id}.json`);
const argv = require("yargs").argv;

const MVNGateway = artifacts.require('MVNGateway');

module.exports = async function(done) {
    
    try {

        const treasuryAccount = argv['account'];

        const contractAddress = deployment.proxies['falcon-os/MVNGateway'][0].address;
        
        console.log(`MVNGateway at ${contractAddress}. Setting treasury account to ${treasuryAccount}.`);

        const mvnGateway = await MVNGateway.at(contractAddress);
        const currentTreasuryAccount = await mvnGateway.treasuryAccount();
        
        if (currentTreasuryAccount.toLowerCase() !== treasuryAccount.toLowerCase()) {
            await mvnGateway.setTreasuryAccount(treasuryAccount);
            console.log(`MVNGateway at ${contractAddress}. ${treasuryAccount} has been set set as a treasury account.`)
        } else {
            console.log(`MVNGateway at ${contractAddress}. ${treasuryAccount} is already set as a treasury account.`)
        }
            
        
        done();
        
    } catch(error) {
        done(error);
    }
    
};