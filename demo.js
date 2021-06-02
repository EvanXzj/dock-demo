import { cryptoWaitReady } from '@polkadot/util-crypto';
import Transaction from './transaction.js';
import {GENESIS_HASH, CHAIN_NAME, SPEC_NAME, SPEC_VERSION} from './constants.js'

import data from './mainnet_metadata.json'
const metadataRpc = data.metadataRpc
import {diff} from 'deep-object-diff'

const BLOCK_HASH = '0x01b1f8381d9ee1b1714ff07afc3e9421d39120546f15441953ae5952c01f0cdb';
const BLOCK_NUMBER = 2378965;
const ERA_PERIOD = 128;

const transaction = new Transaction();

const {privateKey, publicKey, address} = {
    privateKey: '0xdbc1eb1b2e1fe95a19719bd23eecd5e1e001cdf8ef7b93b59a2c8849ed08a00a',
    publicKey: '0xa25e012ea0578255ec6bf3b00795a22fefe40b08b5492b06a3620a3659beb6ed',
    address: '3FzQNQvzUvB7uU9qwSTDFZpLY8occHeFasiHRMmZi9HMvd5Z',
}

const destAddress = '3EUmSxQh6t7EvzFdxiNTWrDRqb8sDhrgugm4e5dZGutPXKuu'
const amount = 505;
const nonce = 0;

async function main() {
    await cryptoWaitReady();
    const txData = {
        era_period: ERA_PERIOD,
        block_number: BLOCK_NUMBER,
        block_hash: BLOCK_HASH,
        genesis_hash: GENESIS_HASH,
        transaction_version: 1,
        chain_name: CHAIN_NAME,
        spec_name: SPEC_NAME,
        spec_version: SPEC_VERSION,
        metadata: metadataRpc, // here put the metadata rather than compressed_metadata, because here result base from ksm-build
        from: address,
        to: destAddress,
        amount,
        nonce: nonce,
        tip: 0
    };

    const unsignedTx = {
        address,
        blockHash: BLOCK_HASH,
        blockNumber: '0x001fd388',
        era: '0x8500',
        genesisHash: GENESIS_HASH,
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
    // console.log(tx.unsignedTx === JSON.stringify(unsignedTx));
    // console.log(tx.signingPayload === signingPayload);

    // sign a transaction
    snData.unsigned_tx = tx.unsignedTx;
    snData.signing_payload = tx.signingPayload;
    const signedTx = await transaction.sign(snData, [privateKey]);
    // console.log(signedTx.txHash === txHash);
    // console.log(signedTx.serialized === signedRawTx);

    // decode a serialized transaction
    // const txDeserialized = Transaction.decodeTx(signedRawTx, rpcData);
    const txDeserialized = Transaction.decodeTx(signedTx.serialized, rpcData);
    delete txDeserialized.metadataRpc
    const expectResult = {
        address,
        eraPeriod: ERA_PERIOD,
        // metadataRpc,
        method: {
            args: {
                dest: destAddress,
                value: amount,
            },
            name: 'transfer',
            pallet: 'balances',
        },
        nonce: nonce,
        tip: 0,
    };

    // console.log(txDeserialized);
    // Txn to broadcast with sidecar
    console.log(signedTx.serialized);
    console.log(diff(txDeserialized, expectResult));
    // assert.deepStrictEqual(txDeserialized, expectResult, 'decode fn is not ok');
    console.log();
    console.log('Transaction.decode done');
}


(async () => {
    try {
        await main()
    } catch (err) {
        console.error('Error');
        console.error(err);
    }
})()
