import { Keyring } from '@polkadot/api';
import { getSpecTypes } from '@polkadot/types-known';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { hexToU8a } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types';
import { EXTRINSIC_VERSION } from '@polkadot/types/extrinsic/v4/Extrinsic';
import { construct, decode, methods } from '@substrate/txwrapper-polkadot';
import { createMetadata } from '@substrate/txwrapper-core'
import { ChainProperties, ss58Format } from './constants.js';
import dockTypes from './dock_types.json';

const {
    signedTx: createSignedTx,
    txHash: getTxHash,
    signingPayload:createSigningPayload
} = construct;

const registryDock = {};
function getRegistryDock(chainName, specName, specVersion, metadata) {
    if (registryDock[specVersion]) {
        return registryDock[specVersion];
    }

    createMetadata.clear();

    const registry = new TypeRegistry();
    registry.setChainProperties(
        registry.createType(
            'ChainProperties',
            ChainProperties,
        ),
    );
    registry.setKnownTypes({
        dockTypes,
    })
    registry.register(getSpecTypes(registry, chainName, specName, specVersion));
    registry.setMetadata(createMetadata(registry, metadata));
    registryDock[specVersion] = registry;

    return registryDock[specVersion];
}

export default class Transaction {
    constructor(network = ss58Format) {
        this.network = network
    }

    build(txData) {
        const {
            era_period: eraPeriod,
            tip,
            block_number: blockNumber, // e.g. 2516018
            block_hash: blockHash,
            genesis_hash: genesisHash,
            transaction_version: transactionVersion,
            chain_name: chainName,
            spec_name: specName,
            spec_version: specVersion,
            metadata: metadataRpc,
            from: address,
            to: dest,
            amount: value,
            nonce,
        } = txData;

        const registry = getRegistryDock(chainName, specName, specVersion, metadataRpc);

        const unsignedTx = methods.balances.transfer({
            value,
            dest,
        }, {
            address,
            blockHash,
            blockNumber,
            eraPeriod,
            genesisHash,
            metadataRpc,
            nonce,
            specVersion,
            tip,
            transactionVersion,
        }, {
            metadataRpc,
            registry,
        });

        // restore when hbSign
        // delete unsignedTx.metadataRpc;

        this.unsignedTx = unsignedTx;
        this.signingPayload = createSigningPayload(unsignedTx, { registry });

        return this;
    }

    async sign(snData, privateKeys) {
        const {
            chain_name: chainName,
            spec_name: specName,
            spec_version: specVersion,
            unsigned_tx: unsignedTx,
            signing_payload: signingPayload,
            metadata,
        } = snData;


        // get keypair = require(privateKey
        const registry = getRegistryDock(chainName, specName, specVersion, metadata);

        await cryptoWaitReady();

        const keyring = new Keyring({ type: 'sr25519' });
        keyring.setSS58Format(this.network);
        const seed = hexToU8a(privateKeys[0]);
        const keypair = keyring.addFromSeed(seed);

        const { signature } = registry.createType('ExtrinsicPayload', signingPayload, { version: EXTRINSIC_VERSION }).sign(keypair);

        // raw_tx
        const serialized = createSignedTx(unsignedTx, signature, { metadataRpc: metadata, registry });

        this.serialized = serialized;
        this.txHash = getTxHash(serialized);

        return this;
    }

    static decodeTx(signedRaw, rpcData) {
        const { chainName, specName, specVersion, metadataRpc } = rpcData;

        const registry = getRegistryDock(chainName, specName, specVersion, metadataRpc);

        const tx = decode(signedRaw, { metadataRpc, registry });

        return tx;
    }
}
