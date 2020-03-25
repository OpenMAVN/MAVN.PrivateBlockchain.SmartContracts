const { scripts, files, ConfigManager } = require('@openzeppelin/cli');
const { ProjectFile, NetworkFile } = files;
const fs = require('fs');

const { add, bump, create, init, push } = scripts;

const latestVersion = '1.1.0';


async function deployDependencies(networkName, from) {
    
    let erc1820Registry;
    
    switch (networkName) {
        case 'development':
            
            const erc1820 = require('erc1820');
            erc1820Registry = erc1820.generateDeployTx().contractAddr;
            await erc1820.deploy(web3);
            
            break;
        case 'production':
            
            erc1820Registry = '0x182085C0842e892308C04785C074E6a2D5aB0a84';
            
            if ((await web3.eth.getCode(erc1820Registry)) === '0x') {
                await web3.eth.sendSignedTransaction('0xf90a338080830c35008080b909e5608060405234801561001057600080fd5b506109c5806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a5576000357c010000000000000000000000000000000000000000000000000000000090048063a41e7d5111610078578063a41e7d51146101d4578063aabbb8ca1461020a578063b705676514610236578063f712f3e814610280576100a5565b806329965a1d146100aa5780633d584063146100e25780635df8122f1461012457806365ba36c114610152575b600080fd5b6100e0600480360360608110156100c057600080fd5b50600160a060020a038135811691602081013591604090910135166102b6565b005b610108600480360360208110156100f857600080fd5b5035600160a060020a0316610570565b60408051600160a060020a039092168252519081900360200190f35b6100e06004803603604081101561013a57600080fd5b50600160a060020a03813581169160200135166105bc565b6101c26004803603602081101561016857600080fd5b81019060208101813564010000000081111561018357600080fd5b82018360208201111561019557600080fd5b803590602001918460018302840111640100000000831117156101b757600080fd5b5090925090506106b3565b60408051918252519081900360200190f35b6100e0600480360360408110156101ea57600080fd5b508035600160a060020a03169060200135600160e060020a0319166106ee565b6101086004803603604081101561022057600080fd5b50600160a060020a038135169060200135610778565b61026c6004803603604081101561024c57600080fd5b508035600160a060020a03169060200135600160e060020a0319166107ef565b604080519115158252519081900360200190f35b61026c6004803603604081101561029657600080fd5b508035600160a060020a03169060200135600160e060020a0319166108aa565b6000600160a060020a038416156102cd57836102cf565b335b9050336102db82610570565b600160a060020a031614610339576040805160e560020a62461bcd02815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b6103428361092a565b15610397576040805160e560020a62461bcd02815260206004820152601a60248201527f4d757374206e6f7420626520616e204552433136352068617368000000000000604482015290519081900360640190fd5b600160a060020a038216158015906103b85750600160a060020a0382163314155b156104ff5760405160200180807f455243313832305f4143434550545f4d4147494300000000000000000000000081525060140190506040516020818303038152906040528051906020012082600160a060020a031663249cb3fa85846040518363ffffffff167c01000000000000000000000000000000000000000000000000000000000281526004018083815260200182600160a060020a0316600160a060020a031681526020019250505060206040518083038186803b15801561047e57600080fd5b505afa158015610492573d6000803e3d6000fd5b505050506040513d60208110156104a857600080fd5b5051146104ff576040805160e560020a62461bcd02815260206004820181905260248201527f446f6573206e6f7420696d706c656d656e742074686520696e74657266616365604482015290519081900360640190fd5b600160a060020a03818116600081815260208181526040808320888452909152808220805473ffffffffffffffffffffffffffffffffffffffff19169487169485179055518692917f93baa6efbd2244243bfee6ce4cfdd1d04fc4c0e9a786abd3a41313bd352db15391a450505050565b600160a060020a03818116600090815260016020526040812054909116151561059a5750806105b7565b50600160a060020a03808216600090815260016020526040902054165b919050565b336105c683610570565b600160a060020a031614610624576040805160e560020a62461bcd02815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b81600160a060020a031681600160a060020a0316146106435780610646565b60005b600160a060020a03838116600081815260016020526040808220805473ffffffffffffffffffffffffffffffffffffffff19169585169590951790945592519184169290917f605c2dbf762e5f7d60a546d42e7205dcb1b011ebc62a61736a57c9089d3a43509190a35050565b600082826040516020018083838082843780830192505050925050506040516020818303038152906040528051906020012090505b92915050565b6106f882826107ef565b610703576000610705565b815b600160a060020a03928316600081815260208181526040808320600160e060020a031996909616808452958252808320805473ffffffffffffffffffffffffffffffffffffffff19169590971694909417909555908152600284528181209281529190925220805460ff19166001179055565b600080600160a060020a038416156107905783610792565b335b905061079d8361092a565b156107c357826107ad82826108aa565b6107b85760006107ba565b815b925050506106e8565b600160a060020a0390811660009081526020818152604080832086845290915290205416905092915050565b6000808061081d857f01ffc9a70000000000000000000000000000000000000000000000000000000061094c565b909250905081158061082d575080155b1561083d576000925050506106e8565b61084f85600160e060020a031961094c565b909250905081158061086057508015155b15610870576000925050506106e8565b61087a858561094c565b909250905060018214801561088f5750806001145b1561089f576001925050506106e8565b506000949350505050565b600160a060020a0382166000908152600260209081526040808320600160e060020a03198516845290915281205460ff1615156108f2576108eb83836107ef565b90506106e8565b50600160a060020a03808316600081815260208181526040808320600160e060020a0319871684529091529020549091161492915050565b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff161590565b6040517f01ffc9a7000000000000000000000000000000000000000000000000000000008082526004820183905260009182919060208160248189617530fa90519096909550935050505056fea165627a7a723058200ea2c016adde02f511fdeb408e1e5d1188cc55df873ca414a450bef53431eb9100291ba01820182018201820182018201820182018201820182018201820182018201820a01820182018201820182018201820182018201820182018201820182018201820');
            }
            
            break;
        default:
            throw(`Unsupported network: ${networkName}`)
    }
    
    return {
        erc1820Registry
    };
}

async function deploy(options, erc1820Registry) {

    console.log(`Deploying falcon-os v${latestVersion}`);
    
    await init({ name: 'falcon-os', version: latestVersion });

    console.log('Adding contracts to the project');

    add({
        contractsData: [
            { name: 'BasicRedeemGateway', alias: 'RealEstateRedeemGateway' },
            { name: 'CustomerRegistry', alias: 'CustomerRegistry' },
            { name: 'MVNGateway', alias: 'MVNGateway' },
            { name: 'MVNToken', alias: 'MVNToken' },
            { name: 'HospitalityRedeemGateway', alias: 'HospitalityRedeemGateway' },
            { name: 'RoleRegistry', alias:'RoleRegistry' },
            { name: 'BasicRedeemGateway', alias:'MVNVoucherRedeemGateway' }
        ]
    });

    console.log('Pushing logic smart contracts');
    await push(options);

    console.log('Creating real estate redeem gateway');
    const realEstateRedeemGateway = await create(Object.assign({ contractAlias: 'RealEstateRedeemGateway' }, options));

    console.log('Creating customer registry');
    const customerRegistry = await create(Object.assign({ contractAlias: 'CustomerRegistry' }, options));

    console.log('Creating MVN gateway');
    const mvnGateway = await create(Object.assign({ contractAlias: 'MVNGateway' }, options));

    console.log('Creating MVN token');
    const mvnToken = await create(Object.assign({ contractAlias: 'MVNToken' }, options));

    console.log('Creating hospitality redeem gateway');
    const hospitalityRedeemGateway = await create(Object.assign({ contractAlias: 'HospitalityRedeemGateway' }, options));

    console.log('Creating role registry');
    const roleRegistry = await create(Object.assign({ contractAlias: 'RoleRegistry' }, options));

    console.log('Creating MVN voucher redeem gateway');
    const mvnVoucherRedeemGatewayRedeemGateway = await create(Object.assign({ contractAlias: 'MVNVoucherRedeemGateway' }, options));
    
    // RealEstateRedeemGateway initialization
    console.log('Initializing real estate redeem gateway');
    const RealEstateRedeemGateway = artifacts.require('BasicRedeemGateway');
    const realEstateRedeemGatewayInstance = await RealEstateRedeemGateway.at(realEstateRedeemGateway.address);
    await realEstateRedeemGatewayInstance['initialize_v1'](mvnToken.address, erc1820Registry, roleRegistry.address);

    // CustomerRegistry initialization
    console.log('Initializing customer registry');
    const CustomerRegistry = artifacts.require('CustomerRegistry');
    const customerRegistryInstance = await CustomerRegistry.at(customerRegistry.address);
    await customerRegistryInstance['initialize_v1'](roleRegistry.address);

    // MVNGateway initialization
    console.log('Initializing MVN gateway');
    const MVNGateway = artifacts.require('MVNGateway');
    const mvnGatewayInstance = await MVNGateway.at(mvnGateway.address);
    await mvnGatewayInstance['initialize_v1'](mvnToken.address, erc1820Registry, roleRegistry.address)

    // MVNToken initialization
    console.log('Initializing MVN token');
    const MVNToken = artifacts.require('MVNToken');
    const mvnTokenInstance = await MVNToken.at(mvnToken.address);
    await mvnTokenInstance['initialize_v1'](erc1820Registry, roleRegistry.address);

    // HospitalityRedeemGateway initialization
    console.log('Initializing hospitality redeem gateway');
    const HospitalityRedeemGateway = artifacts.require('HospitalityRedeemGateway');
    const hospitalityRedeemGatewayInstance = await HospitalityRedeemGateway.at(hospitalityRedeemGateway.address);
    await hospitalityRedeemGatewayInstance['initialize_v1'](mvnToken.address, erc1820Registry, roleRegistry.address);

    // RoleRegistry initialization
    console.log('Initializing role registry');
    const RoleRegistry = artifacts.require('RoleRegistry');
    const roleRegistryInstance = await RoleRegistry.at(roleRegistry.address);
    await roleRegistryInstance['initialize_v1'](options.txParams.from);

    // MVNVoucherRedeemGateway initialization
    console.log('Initializing MVN voucher redeem gateway');
    const MVNVoucherRedeemGateway = artifacts.require('BasicRedeemGateway');
    const mvnVoucherRedeemGatewayInstance = await MVNVoucherRedeemGateway.at(mvnVoucherRedeemGatewayRedeemGateway.address);
    await mvnVoucherRedeemGatewayInstance['initialize_v1'](mvnToken.address, erc1820Registry, roleRegistry.address);
    
    // Assigning FeeCollector role to the MVNGateway
    console.log('Assigning FeeCollector role to the MVNGateway');
    await roleRegistryInstance['addRole'](mvnToken.address, mvnGateway.address, 'FeeCollector');
    
    console.log(`falcon-os v${latestVersion} has been deployed`)
}

const upgrades = {
    '1.0.0': {
        '1.1.0': async function(deployment, options, erc1820Registry) {
            
            const mvnToken = deployment.getProxies({ contract: 'MVNToken'})[0].address;
            const roleRegistry = deployment.getProxies({ contract: 'RoleRegistry'})[0].address;
            
            console.log('Adding contracts to the project');
            add({
                contractsData: [
                    { name: 'BasicRedeemGateway', alias: 'MVNVoucherRedeemGateway' }
                ]
            });

            await bump({ version: latestVersion});
            
            console.log('Pushing logic smart contracts');
            await push(options);
            
            console.log('Creating MVN voucher redeem gateway');
            const namashiVoucherRedeemGateway = await create(Object.assign({ contractAlias: 'MVNVoucherRedeemGateway' }, options));
            
            console.log('Initializing MVN voucher redeem gateway');
            const MVNVoucherRedeemGateway = artifacts.require('BasicRedeemGateway');
            const namashiVoucherRedeemGatewayInstance = await MVNVoucherRedeemGateway.at(namashiVoucherRedeemGateway.address);
            await namashiVoucherRedeemGatewayInstance['initialize_v1'](mvnToken, erc1820Registry, roleRegistry);
        }
    }
};

module.exports = async function(done) {

    try {

        fs.mkdirSync('./.openzeppelin', { recursive: true });
        
        const from = (await web3.eth.getAccounts())[0];
        const networkName = artifacts.options.network;

        const { network, txParams } = await ConfigManager.initNetworkConfiguration({ network: networkName, from: from });
        const { erc1820Registry } = await deployDependencies(networkName, from);
        
        const options = { network, txParams };
        const project = new ProjectFile();
        const deployment = new NetworkFile(project, network);

        if (!project.exists()) {
            await deploy(options, erc1820Registry);
        } else {

            const currentVersion = project.version;

            if (currentVersion !== latestVersion) {
                
                const upgrade = upgrades[currentVersion][latestVersion];

                if (upgrade) {
                    console.log(`Upgrading falson-os from v${currentVersion} to v${latestVersion}`);
                    await upgrade(deployment, options, erc1820Registry);
                    console.log(`falson os has been upgraded to v${latestVersion}`);
                } else {
                    console.log(`Can not upgrade falson-os from v${currentVersion} to v${latestVersion}`);
                }
                
            } else {
                console.log(`falson-os is up to date`);
            }
            
        }

        done();
        
    } catch(error) {
        done(error);
    }

};