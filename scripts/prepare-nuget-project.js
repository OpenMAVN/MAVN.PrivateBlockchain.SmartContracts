const argv = require('yargs').argv;
const fs = require('fs').promises;

module.exports = async function(done) {

    try {
        
        const config = require(`../generator_configs/${argv.contract}.js`);

        const contract = artifacts.require(argv.contract);
        const nugetAbi = [];

        for(const element of contract.abi) {

            switch (element.type) {
                case "function":
                    if (config.functions.includes(element.name)) {

                        if (element.outputs.length === 1 && element.outputs[0].name === "") {
                            element.outputs[0].name = "result";
                        }

                        nugetAbi.push(element);

                    }

                    break;
                case "event":
                    if (config.events.includes(element.name)) {

                        nugetAbi.push(element);

                    }
                    break;

            }

        }

        const projectName = `Lykke.PrivateBlockchain.${argv.contract}`;
        const projectDir  = `./build/nugets/${projectName}`;
        const nugetAbiPath = `${projectDir}/${argv.contract}.abi`;
        const projectFilePath = `${projectDir}/${projectName}.csproj`;
        const generatorConfigPath = `${projectDir}/Nethereum.Generator.json`;

        let projFile = (await fs
            .readFile(`./generator_configs/project-template.csproj`, { encoding: 'utf-8' }))
            .replace("$CONTRACT_NAME", argv["contract"])
            .replace("$VERSION", argv["package-version"]);

        await fs.mkdir(projectDir, { recursive: true });

        await fs.writeFile(projectFilePath, projFile);

        await fs.writeFile(generatorConfigPath, JSON.stringify({
            "ABIConfigurations": [{
                "ContractName": argv["contract"],
                "ABI": null,
                "ABIFile": `${argv["contract"]}.abi`,
                "ByteCode": null,
                "BinFile": null,
                "BaseNamespace": `Lykke.PrivateBlockchain`,
                "CQSNamespace": `Definitions`,
                "DTONamespace": `DTOs`,
                "ServiceNamespace": `Services`,
                "CodeGenLanguage": `CSharp`,
                "BaseOutputPath": null
            }]
        }));

        await fs.writeFile(nugetAbiPath, JSON.stringify(nugetAbi));

        done();
        
    } catch(error) {
        done(error);
    }

};