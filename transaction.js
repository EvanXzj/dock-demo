const { Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { hexToU8a } = require('@polkadot/util');
const { TypeRegistry } = require('@polkadot/types');
const { EXTRINSIC_VERSION } = require('@polkadot/types/extrinsic/v4/Extrinsic');
const { createSignedTx, createSigningPayload, decode, getRegistry, getTxHash, methods } = require('@substrate/txwrapper');
const { createMetadata } = require('@substrate/txwrapper/lib/util/metadata');
const DockTypes = require('./dock_types.json')

const ss58Format = 42;
const chainProperties = {
    ss58Format: ss58Format,
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
    // registryDock[specVersion] = getRegistry(chainName, specName, specVersion, metadata);


    const registry = new TypeRegistry();
    // const registry = getRegistry(chainName, specName, specVersion, metadata);
    // registry.setKnownTypes({ types: DockTypes });
    registry.setChainProperties(
        registry.createType(
            'ChainProperties',
            chainProperties,
        ),
    );
    const typs = {
        Address: 'AccountId', LookupSource: 'AccountId', EpochNo: 'u32', SlotNo: 'u64', Balance: 'u64', Keys: 'SessionKeys2',
        Did: "[u8;32]",
        Registry: {
            policy: 'Policy',
            add_only: 'bool'
        }
    };
    registry.register(typs);
    registry.setMetadata(createMetadata(registry, metadata));
    registryDock[specVersion] = registry;

    return registryDock[specVersion];
}

class Transaction {
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
        delete unsignedTx.metadataRpc;

        this.unsignedTx = JSON.stringify(unsignedTx);
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

        // add since deleted = require(hbBuild
        const unsignedTxParse = JSON.parse(unsignedTx);
        unsignedTxParse.metadataRpc = metadata;

        // get keypair = require(privateKey
        const registry = getRegistryDock(chainName, specName, specVersion, metadata);

        await cryptoWaitReady();

        const keyring = new Keyring({ type: 'sr25519' });
        keyring.setSS58Format(this.network);
        const seed = hexToU8a(privateKeys[0]);
        const keypair = keyring.addFromSeed(seed);

        // registry.setMetadata(createMetadata(registry, metadata));
        const { signature } = registry.createType('ExtrinsicPayload', signingPayload, { version: EXTRINSIC_VERSION }).sign(keypair);

        // raw_tx
        const serialized = createSignedTx(unsignedTxParse, signature, { metadataRpc: metadata, registry });

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

module.exports = Transaction
