const deployment = require(`../.openzeppelin/dev-${artifacts.options.network_id}.json`);

module.exports = async function(done) {

    try {

        for(const proxy in deployment.proxies) {
            
            const name = proxy.substr(10);
            console.log(`${name}: ${deployment.proxies[proxy][0].address}`);
            
        }

        done();
        
    } catch(error) {
        done(error);
    }
    
};