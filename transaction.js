const { Keyring } = require('@polkadot/api');
const { hexToU8a } = require('@polkadot/util');
const { TRANSACTION_VERSION } = require('@polkadot/types/extrinsic/v4/Extrinsic');
const { createSignedTx, createSigningPayload, decode, getRegistry, getTxHash, methods } = require('@substrate/txwrapper');
const { createMetadata } = require('@substrate/txwrapper/lib/util/metadata');

const ssFormat = 42;
const chainProperties = {
    ss58Format: ssFormat,
    tokenDecimals: 6,
    tokenSymbol: 'DCK',
};
const registryDock = {};
function getRegistryDock(chainName, specName, specVersion, metadata) {
    if (registryDock[specVersion]) {
        return registryDock[specVersion];
    }

    // when node upgrade, registry + metadata is new,
    // then clear memory metadata = require(sdk,
    // and add new registry(along with metadata, it's a type, so small) to memory = require(code.
    createMetadata.clear();
    registryDock[specVersion] = getRegistry(chainName, specName, specVersion, metadata);

    return registryDock[specVersion];
}

class Transaction {
    constructor(network = ssFormat) {
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
        registry.register({ Address: 'AccountId' });
        registry.register({ LookupSource: 'AccountId' });
        registry.register({ EpochNo: 'u32' });
        registry.register({ SlotNo: 'u64' });
        registry.register({ Balance: 'u64' });
        registry.setChainProperties(
            registry.createType(
                'ChainProperties',
                chainProperties,
            ),
        );

        const unsignedTx = methods.balances.transferKeepAlive({
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
        delete unsignedTx.metadataRpc;

        this.unsignedTx = JSON.stringify(unsignedTx);
        this.signingPayload = createSigningPayload(unsignedTx, { registry });

        return this;
    }

    sign(snData, privateKeys) {
        const {
            chain_name: chainName,
            spec_name: specName,
            spec_version: specVersion,
            unsigned_tx: unsignedTx,
            signing_payload: signingPayload,
            metadata,
        } = snData;

        // add since deleted = require(hbBuild
        const unsignedTxParse = JSON.parse(unsignedTx);
        unsignedTxParse.metadataRpc = metadata;

        // get keypair = require(privateKey
        const registry = getRegistryDock(chainName, specName, specVersion, metadata);
        registry.setChainProperties(
            registry.createType(
                'ChainProperties',
                chainProperties,
            ),
        );

        const keyring = new Keyring();
        keyring.setSS58Format(this.network);
        const seed = hexToU8a(privateKeys[0]);
        const keypair = keyring.addFromSeed(seed);

        const { signature } = registry.createType('ExtrinsicPayload', signingPayload, { version: TRANSACTION_VERSION }).sign(keypair);

        // raw_tx
        const serialized = createSignedTx(unsignedTxParse, signature, { metadataRpc: metadata, registry });

        this.serialized = serialized;
        this.txHash = getTxHash(serialized);

        return this;
    }

    static decodeTx(signedRaw, rpcData) {
        const { chainName, specName, specVersion, metadataRpc } = rpcData;

        const registry = getRegistryDock(chainName, specName, specVersion, metadataRpc);
        // registry.register('EpochNo')
        registry.setChainProperties(
            registry.createType(
                'ChainProperties',
                chainProperties,
            ),
        );

        const tx = decode(signedRaw, { metadataRpc, registry });

        return tx;
    }
}

module.exports = Transaction
