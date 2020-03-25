const Azure = require("@azure/storage-blob");
const fs = require('fs').promises;
require('dotenv').config();

function getMetadataFiles(networkId) {
    return [
        `.openzeppelin/project.json`,
        `.openzeppelin/dev-${networkId}.json`
    ]
}

async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
}

async function getOrCreateContainer() {

    const account = process.env.AZURE_STORAGE_ACCOUNT;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const skc = new Azure.SharedKeyCredential(account, accountKey);
    const pipeline = Azure.StorageURL.newPipeline(skc);

    const serviceURL = new Azure.ServiceURL(`https://${account}.blob.core.windows.net`, pipeline);
    
    const containerName = 'falcon-os';
    
    let marker;
    let containerExists;

    do {
        const listContainersResponse = await serviceURL.listContainersSegment(Azure.Aborter.none, marker);

        marker = listContainersResponse.nextMarker;

        for (const container of listContainersResponse.containerItems) {
            if (container.name === containerName) {
                containerExists = true;
                break;
            }
        }

    } while (marker);
    
    const containerURL = Azure.ContainerURL.fromServiceURL(serviceURL, containerName);
    
    if (!containerExists) {
        console.log(`Creating container '${containerName}'`);
        await containerURL.create(Azure.Aborter.none);
    }

    return containerURL;
}

async function uploadFile(containerURL, path, environment) {
    const content = await fs.readFile(path);
    const blobURL = Azure.BlockBlobURL.fromContainerURL(containerURL, `${environment}/${path}`);
    await blobURL.upload(Azure.Aborter.none, content, content.length);
}

async function downloadFileIfExists(containerURL, path, environment) {
    const blobName = `${environment}/${path}`;

    let marker;
    let blobExists;
    
    do {

        const listBlobsResponse = await containerURL.listBlobFlatSegment(Azure.Aborter.none, marker);
        
        for(const blob of listBlobsResponse.segment.blobItems) {
            if (blob.name === `${environment}/${path}`) {
                blobExists = true;
                break;
            }
        }
        
    } while(marker);
    
    if (blobExists) {
        const blobURL = Azure.BlobURL.fromContainerURL(containerURL, blobName);
        const response = await blobURL.download(Azure.Aborter.none, 0);
        const content = await streamToString(response.readableStreamBody);

        await fs.writeFile(path, content);
    }
}

async function fetch(environment, networkId) {
    const containerURL = await getOrCreateContainer();
    const metadataFiles = getMetadataFiles(networkId);

    await fs.mkdir('./.openzeppelin', { recursive: true });
    
    for (let i = 0; i < metadataFiles.length; i++) {
        await downloadFileIfExists(containerURL, metadataFiles[i], environment);
    }
}

async function push(environment, networkId) {
    const containerURL = await getOrCreateContainer();
    const metadataFiles = getMetadataFiles(networkId);

    for (let i = 0; i < metadataFiles.length; i++) {
        await uploadFile(containerURL, metadataFiles[i], environment);
    }
}

module.exports = {
    fetch,
    push
};