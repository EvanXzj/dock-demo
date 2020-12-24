const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { hexToU8a } = require('@polkadot/util');

const DockTypes = require('./dock_types.json')

const { privateKey, publicKey, address } = {
    privateKey: '0xdbc1eb1b2e1fe95a19719bd23eecd5e1e001cdf8ef7b93b59a2c8849ed08a00a',
    publicKey: '',
    address: '5DWfqRYDTq8JUtwgNZQ5wQf2GFp8FfNkJhk4D7jtgXQdSpLo',
}

const destAddress = '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL'
const amount = 600;
const ss58Format = 42;
const endpoint = 'ws://localhost:9944';

async function asyncFunction() {
    const api = await ApiPromise.create({
        provider: new WsProvider(endpoint),
        types: DockTypes,
    });

    const keyring = new Keyring({ type: 'sr25519' });
    keyring.setSS58Format(ss58Format);
    const seed = hexToU8a(privateKey);
    const keypair = keyring.addFromSeed(seed);
    console.log(keypair.address);
    const transfer = api.tx.balances.transfer(destAddress, amount);

    const hash = await transfer.signAndSend(keypair);
    console.log(hash);
}

(async () => {
    try {
        await asyncFunction()
    } catch(err) {
        console.error('Something bad')
    }
})()
