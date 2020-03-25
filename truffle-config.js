require('dotenv').config();

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    production: {
      provider: function() {
        return new HDWalletProvider(process.env.QUORUM_PRIVATE_KEY, process.env.QUORUM_NODE);
      },
      network_id: process.env.QUORUM_NETWORK_ID,
      gasPrice: 0,
      type: 'quorum'
    },
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      settings: {
        evmVersion: 'byzantium'
      },
      version: '0.5.12'
    }
  }
};
