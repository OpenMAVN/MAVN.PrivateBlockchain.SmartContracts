const { fetch } = require("./deployment-metadata");
const argv = require("yargs").argv;

module.exports = async function(done) {

    try {
        await fetch(argv.environment, artifacts.options.network_id);
        done();    
    } catch(error) {
        done(error);
    }

};