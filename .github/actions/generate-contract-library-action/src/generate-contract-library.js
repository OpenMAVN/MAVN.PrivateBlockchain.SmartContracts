const core = require('@actions/core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {

    try {

        const contract  = core.getInput('contract');
        const functions = core.getInput('functions');
        const events    = core.getInput('events');
        const version   = core.getInput('version');

        const abi     = await prepareABI(contract, functions, events);
        const project = await generateCSharpProject(contract, abi);

        await generateCSharpProjectCode(project);
        await buildAndPack(project, version);

    } catch (error) {
        core.setFailed(error.message);
    }

}

async function prepareABI(contract, functions, events) {

    const sourceMetadataDir = 'build/contracts';
    const sourceMetadataFile = path.join(sourceMetadataDir, `${contract}.json`);

    if (!fs.existsSync(sourceMetadataFile)) {
        throw `${sourceMetadataFile} does not exist`;
    }

    const sourceData = await fs.promises.readFile(sourceMetadataFile);
    const sourceABI = JSON.parse(sourceData).abi;
    const targetABI = [];

    for (let i = 0; i < sourceABI.length; i++) {
        
        const element = sourceABI[i];
        
        switch (element.type) {
            case 'function':
                if (functions.includes(element.name)) {
                    if (element.outputs.length === 1 && element.outputs[0].name === "") {
                        element.outputs[0].name = "result";
                    }
                    
                    targetABI.push(element);
                }
                break;
            case 'event':
                if (events.includes(element.name)) {
                    targetABI.push(element);
                }
        }
    }
    
    return targetABI;
}

async function generateCSharpProject(contract, abi) {

    const generatorConfig = {
        'ABIConfigurations': [{
            'ContractName': contract,
            'ABI': null,
            'ABIFile': 'contract.abi',
            'ByteCode': null,
            'BinFile': null,
            'BaseNamespace': 'MAVN.PrivateBlockchain',
            'CQSNamespace': 'Definitions',
            'DTONamespace': 'DTOs',
            'ServiceNamespace': 'Services',
            'CodeGenLanguage': 'CSharp',
            'BaseOutputPath': null
        }]
    };
    
    const projectName = `MAVN.PrivateBlockchain.${contract}`;
    const workingDir = path.join('build/libraries', projectName);
    const abiFile = path.join(workingDir, "contract.abi");
    const generatorConfigFile = path.join(workingDir, 'Nethereum.Generator.json');
    const class1File = path.join(workingDir, 'Class1.cs');

    await fs.promises.mkdir(workingDir, { recursive: true })
    await fs.promises.writeFile(abiFile, JSON.stringify(abi));
    await fs.promises.writeFile(generatorConfigFile, JSON.stringify(generatorConfig));

    execSync('dotnet new classlib --force', { cwd: workingDir })
    execSync('dotnet add package Nethereum.Web3 --version 3.7.1', { cwd: workingDir })

    await fs.promises.unlink(class1File);
    
    return workingDir;
}

async function generateCSharpProjectCode(project) {
    
    const toolsDir = 'build/tools';
    const toolName = 'Nethereum.Generator.Console';
    const toolPath = path.join(toolsDir, toolName);

    if(!fs.existsSync(toolPath)) {
        execSync(`dotnet tool install ${toolName} --tool-path ${toolsDir}`);
    }
    
    execSync(`${toolPath} generate from-project --projectPath ${project}`);
    
}

async function buildAndPack(project, version) {
    execSync(`dotnet restore`, { cwd: project });
    execSync(`dotnet build --configuration Release --no-restore /p:Version=${version}`, { cwd: project });
    execSync(`dotnet pack  --configuration Release --no-build --output ../../nugets --include-symbols --include-source /p:SymbolPackageFormat=snupkg /p:Version=${version}`, { cwd: project });
}

module.exports = run;