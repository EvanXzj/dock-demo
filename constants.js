const ss58Format = 21;
const ChainProperties = {
    ss58Format: ss58Format,
    tokenDecimals: 6,
    tokenSymbol: 'DCK',
};

const GENESIS_HASH = '0xf73467c6544aa68df2ee546b135f955c46b90fa627e9b5d7935f41061bb8a5a9';
const CHAIN_NAME = 'Dock Mainnet';
const SPEC_NAME = 'dock-main-runtime';
const SPEC_VERSION = 15;

module.exports = {
    ss58Format,
    ChainProperties,
    GENESIS_HASH,
    CHAIN_NAME,
    SPEC_NAME,
    SPEC_VERSION
}
