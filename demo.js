const assert = require('assert')
const Transaction = require('./transaction')
const { metadataRpc } = require('./metadata.json')

const transaction = new Transaction();

const { privateKey, publicKey, address } = {
    privateKey: '0xdbc1eb1b2e1fe95a19719bd23eecd5e1e001cdf8ef7b93b59a2c8849ed08a00a',
    publicKey: '0xa25e012ea0578255ec6bf3b00795a22fefe40b08b5492b06a3620a3659beb6ed',
    address: '3FzQNQvzUvB7uU9qwSTDFZpLY8occHeFasiHRMmZi9HMvd5Z',
}

const txData = {
    era_period: 64,
    block_number: 2085768,
    block_hash: '0x47570c391ad781eccc5a790ab208c9cec1b5d838c87d9f3d5078d013fad3884f',
    genesis_hash: '0xf73467c6544aa68df2ee546b135f955c46b90fa627e9b5d7935f41061bb8a5a9',
    transaction_version: 1,
    chain_name: 'Dock Mainnet',
    spec_name: 'dock-main-runtime',
    spec_version: 15,
    metadata: metadataRpc, // here put the metadata rather than compressed_metadata, because here result base from ksm-build
    from: address,
    to: '3EUmSxQh6t7EvzFdxiNTWrDRqb8sDhrgugm4e5dZGutPXKuu',
    amount: 12,
    nonce: 7,
};

const unsignedTx = {
    address: '3FzQNQvzUvB7uU9qwSTDFZpLY8occHeFasiHRMmZi9HMvd5Z',
    blockHash: '0x47570c391ad781eccc5a790ab208c9cec1b5d838c87d9f3d5078d013fad3884f',
    blockNumber: '0x001fd388',
    era: '0x8500',
    genesisHash: '0xf73467c6544aa68df2ee546b135f955c46b90fa627e9b5d7935f41061bb8a5a9',
    method: '0x0703ff5f875d7031c12cf454347290fa9cd92a9f5b4e4f11e8dd010da229fba626ec6a30',
    nonce: '0x00000007',
    signedExtensions: [
        'CheckSpecVersion',
        'CheckTxVersion',
        'CheckGenesis',
        'CheckMortality',
        'CheckNonce',
        'CheckWeight',
        'ChargeTransactionPayment',
        'OnlyMigrator',
    ],
    specVersion: '0x0000000f',
    tip: '0x00000000000000000000000000000000',
    transactionVersion: '0x00000001',
    version: 4,
};

const snData = {
    chain_name: txData.chain_name,
    spec_name: txData.spec_name,
    spec_version: txData.spec_version,
    unsigned_tx: null,
    signing_payload: null,
    metadata: metadataRpc,
};

const rpcData = {
    chainName: txData.chain_name,
    specName: txData.spec_name,
    specVersion: txData.spec_version,
    metadataRpc,
};

const signingPayload = '0x900703ff5f875d7031c12cf454347290fa9cd92a9f5b4e4f11e8dd010da229fba626ec6a3085001c000f00000001000000f73467c6544aa68df2ee546b135f955c46b90fa627e9b5d7935f41061bb8a5a947570c391ad781eccc5a790ab208c9cec1b5d838c87d9f3d5078d013fad3884f';
const signedRawTx = '0x2d0284ffa25e012ea0578255ec6bf3b00795a22fefe40b08b5492b06a3620a3659beb6ed007fe492b9315fa902bfe3e371d1d82bc35fc2fe616ac51d46237b032a15652325cb1c9917e53d92db80ecef455cf556ee583e86182760435095ac390e4bb3e10f85001c000703ff5f875d7031c12cf454347290fa9cd92a9f5b4e4f11e8dd010da229fba626ec6a30';
const txHash = '0xd39f831ee1919ee688bcdbc4714d772b5d7d4807045d31c7de3555efd44d5a6c';

// build transaction
const tx = transaction.build(txData);
console.log(tx.unsignedTx === JSON.stringify(unsignedTx));
console.log(tx.signingPayload === signingPayload);

// sign a transaction
snData.unsigned_tx = tx.unsignedTx;
snData.signing_payload = tx.signingPayload;
const signedTx = transaction.sign(snData, [privateKey]);
console.log(signedTx.txHash === txHash);
console.log(signedTx.serialized === signedRawTx);

// decode a serialized transaction
const txDeserialized = Transaction.decodeTx(signedRawTx, rpcData);
const expectResult = {
    address,
    eraPeriod: 64,
    metadataRpc,
    method: {
        args: {
            dest: '3EUmSxQh6t7EvzFdxiNTWrDRqb8sDhrgugm4e5dZGutPXKuu',
            value: 12,
        },
        name: 'transferKeepAlive',
        pallet: 'balances',
    },
    nonce: 7,
    tip: 0,
};
// console.log(txDeserialized);
assert.deepStrictEqual(txDeserialized, expectResult, 'decode fn is not ok');
console.log();
console.log('Transaction.decode done');
