'use strict'

import { WORDLIST } from '../utils/WordList_EN';

var bip39 = require('bip39');
var BigInteger = require('big-integer');
var HDKey = require('hdkey');
var createHash = require('create-hash');
var bs58check = require('bs58check');
var aes256 = require('aes256');
var ElectrumCli = require('electrum-client');

const networkPrefix = {main: [0x1A, 0x33], test: [0x47, 0x49]};

var helpers = {

    validateMnemonic: function validateMnemonic(mnemonic) {
        return bip39.validateMnemonic(mnemonic)
    },

    getSeed: function getSeed(mnemonic) {
        return bip39.mnemonicToSeed(mnemonic);
    },

    getHDKey: function getHDKey(seed) {
        return HDKey.fromMasterSeed(seed);
    },

    getPublicKey: function getPublicKey(keyPair) {
        return keyPair.publicKey;
    },

    getPrivateKey: function getPrivateKey(keyPair) {
        return keyPair.privateKey;
    },

    getPublicExtendedKey: function getPublicExtendedKey(keyPair) {
        return keyPair.publicExtendedKey;
    },

    getPrivateExtendedKey: function getPrivateExtendedKey(keyPair) {
        return keyPair.privateExtendedKey;
    },

    fromPublicKeyToAddress: function fromPublicKeyToAddress(publicKey) {
        const sha256Encoding = createHash('sha256').update(publicKey).digest();
        const rmd160Encoding = createHash('rmd160').update(sha256Encoding).digest();

        var buffer = Buffer.allocUnsafe(21);
        buffer.writeUInt8(networkPrefix.main[0], 0);
        rmd160Encoding.copy(buffer, 1);

        const address = bs58check.encode(buffer);

        return address;
    },

    fromPrivateKeyToWIF: function fromPrivateKeyToWIF(hex) {
        for (var privateKey = [], c = 0; c < hex.length; c += 2)
            privateKey.push(parseInt(hex.substr(c, 2), 16));

        privateKey.push(0x01);
        privateKey.unshift(0x80);

        const hash = createHash('sha256').update(createHash('sha256').update(privateKey).digest()).digest();
        const checksum = hash.slice(0, 4);

        const buf = Buffer.from(privateKey);
        buf.copy(checksum);

        const wif = bs58check.encode(buf);

        return wif;
    },

    encryptData: function encryptData(data, key) {
        if(key) {
            return aes256.encrypt(key, data);
        }

        return data;
    },

    decryptData: function decryptData(data, key) {
        if(key) {
            return aes256.decrypt(key, data);
        }

        return data;
    },

    generateWallet: async function generateWallet(mnemonic, title, id, password, type, ip, port) {
        var wallet = {};
        var settings = {};
        settings['historyCount'] = '20';
        wallet['id'] = id;
        wallet['title'] = title;
        wallet['mnemonicPhrase'] = mnemonic;
        wallet['transactions'] = {};
        wallet['mempool'] = [];
        wallet['balance'] = 0;

        if (password != null) {

            wallet['password'] = helpers.encryptData(password, password);
            wallet['mnemonicPhrase'] = helpers.encryptData(wallet['mnemonicPhrase'], password);

        }

        wallet['settings'] = settings;
        var internal = helpers.generateAddress(0, wallet['mnemonicPhrase'], password, 1);
        var external = helpers.generateAddress(0, wallet['mnemonicPhrase'], password, 0);
        wallet['addresses'] = {"internal": {}, "external": {}};
        wallet['addresses']['currentInternal'] = internal.address;
        wallet['addresses']['currentExternal'] = external.address;
        wallet['addresses']['internal'][internal.address] = internal.data;
        wallet['addresses']['external'][external.address] = external.data;

        if (type == "import") {

            var ecl = new ElectrumCli(port, ip, 'tcp');

            try {

                await ecl.connect();
                
                var k = 0;
                var checkMore = true;

                while (checkMore) {
                    checkMore = false;
                    var promises = [];
                    for (var i = 1+k; i < 21+k; i++) {
                        let external = helpers.generateAddress(i, wallet['mnemonicPhrase'], password, 0);
                        let internal = helpers.generateAddress(i, wallet['mnemonicPhrase'], password, 1);
                        console.log("internal/external - " + i);
                        promises.push(ecl.blockchainAddress_history(external.address, 0).then((history) => {
                            if (history.total > 0) {
                                checkMore = true;
                                wallet['addresses']['currentExternal'] = external.address;
                                wallet['addresses']['external'][external.address] = external.data;
                            }
                        }))
                        promises.push(ecl.blockchainAddress_history(internal.address, 0).then((history) => {
                            if (history.total > 0) {
                                checkMore = true;
                                wallet['addresses']['currentInternal'] = internal.address;
                                wallet['addresses']['internal'][internal.address] = internal.data;
                            }
                        }))
                    }

                    await Promise.all(promises);

                    if (checkMore) {
                        k = k + 20;
                    }
                }

                await ecl.close();
            } catch (e) {
                console.log(e);
            }

        }

        return wallet;
    },

    generateAddress: function generateAddress(index, mnemonic, password, chain) {

        const seed = helpers.getSeed(helpers.decryptData(mnemonic, password))
        const hdKey = helpers.getHDKey(seed)
        var childKeys = hdKey.derive("m/44'/0'/0'/" + chain + "/" + index)
        var address = {};

        address['privateKey'] = helpers.fromPrivateKeyToWIF(helpers.getPrivateKey(childKeys).toString('hex'))
        address['used'] = false

        if (password != null) {
          address['privateKey'] = helpers.encryptData(address['privateKey'], password)  
        }

        return {"address": helpers.fromPublicKeyToAddress(helpers.getPublicKey(childKeys)), "data": address}

    },

    generateNextAddress: function generateNextAddress(wallet, password, chain) {
            var k = 0;
            var address = null;
            var addresses = (chain == 0 ? Object.keys(wallet.addresses.external) : Object.keys(wallet.addresses.internal));
            console.log(addresses)
            while (true) {
                address = helpers.generateAddress(k, wallet.mnemonicPhrase, password, chain);

                if (!(addresses.includes(address.address))) {
                    break;
                }

                k++;

            }
            
            return address;
    },

    generateMnemonic: function generateMnemonic() {

        let words = '';

        for(var i = 0; i < 18; i++) {
          if(i != 0) {
            words += ' ' + WORDLIST[Math.floor(Math.random() * WORDLIST.length)];
          } else {
            words += WORDLIST[Math.floor(Math.random() * WORDLIST.length)];
          }
          
        };

        return words;
    }
}

module.exports = helpers;