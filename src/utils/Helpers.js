'use strict'

import { WORDLIST } from '../utils/WordList_EN';
import store from 'react-native-simple-store';

var bip39 = require('bip39');
var BigInteger = require('big-integer');
var HDKey = require('hdkey');
var createHash = require('create-hash');
var bs58check = require('bs58check');
var aes256 = require('aes256');
var coinjs = require('coinjs');

const networkPrefix = {main: [0x1A, 0x33], test: [0x47, 0x49]};

export function validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic)
}

export function getSeed(mnemonic) {
    return bip39.mnemonicToSeed(mnemonic);
}

export function getHDKey(seed) {
    return HDKey.fromMasterSeed(seed);
}

export function getPublicKey(keyPair) {
    return keyPair.publicKey;
}

export function getPrivateKey(keyPair) {
    return keyPair.privateKey;
}

export function getPublicExtendedKey(keyPair) {
    return keyPair.publicExtendedKey;
}

export function getPrivateExtendedKey(keyPair) {
    return keyPair.privateExtendedKey;
}

export function fromPublicKeyToAddress(publicKey) {
    const sha256Encoding = createHash('sha256').update(publicKey).digest();
    const rmd160Encoding = createHash('rmd160').update(sha256Encoding).digest();

    var buffer = Buffer.allocUnsafe(21);
    buffer.writeUInt8(networkPrefix.main[0], 0);
    rmd160Encoding.copy(buffer, 1);

    const address = bs58check.encode(buffer);

    return address;
}

export function encryptData(data, key) {
    if(key) {
        return aes256.encrypt(key, data);
    }

    return data;
}

export function decryptData(data, key) {
    if(key) {
        return aes256.decrypt(key, data);
    }

    return data;
}

export async function generateWallet(mnemonic, title, id, password) {
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

        wallet['password'] = encryptData(password, password);
        wallet['mnemonicPhrase'] = encryptData(wallet['mnemonicPhrase'], password);

    }

    wallet['settings'] = settings;
    var internal = await generateAddress(0, wallet['mnemonicPhrase'], password, 1);
    var external = await generateAddress(0, wallet['mnemonicPhrase'], password, 0);
    wallet['addresses'] = {"internal": {}, "external": {}};
    wallet['addresses']['currentInternal'] = internal.address;
    wallet['addresses']['currentExternal'] = external.address;
    wallet['addresses']['internal'][internal.address] = internal.data;
    wallet['addresses']['external'][external.address] = external.data;

    return wallet;
}

export async function generateAddress(range, mnemonic, password, chain) {
    const seed = getSeed(decryptData(mnemonic, password));
    const hdKey = getHDKey(seed).derive("m/44'/0'/0'/" + chain);
    var returnObj;

    const hdWallet = coinjs.hd(hdKey.privateExtendedKey);

    if (Array.isArray(range)) {
        returnObj = [];

        for (let i = range[0]; i < range[1]; i++) {
            var address = {};
            var data = hdWallet.derive(i);

            address['privateKey'] = encryptData(data.keys.wif, password);
            address['used'] = false;
            returnObj.push({"address": data.keys.address, "data": address});
        }

    } else {
        returnObj = {};
        var address = {};
        var data = hdWallet.derive(range);

        address['privateKey'] = encryptData(data.keys.wif, password);
        address['used'] = false;
        returnObj = {"address": data.keys.address, "data": address};
    }

    return returnObj;
}

export async function generateNextAddress(wallet, password, chain) {
    var k = 0;
    var addresses = (chain == 0 ? Object.keys(wallet.addresses.external) : Object.keys(wallet.addresses.internal));
    while (true) {
        var address = await generateAddress(k, wallet['mnemonicPhrase'], password, chain);

        if (!(addresses.includes(address.address))) {
            return address;
        }

        k++;
    }
}

export function generateMnemonic() {

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

export async function checkAddresses(addresses, ecl) {
    let returnObj = [];
    let promises = [];

    for (let i = 0; i < addresses.length; i++) {
        promises.push(ecl.blockchainAddress_subscribe(addresses[i].address).then((result) => {
           console.log('result:', result)
            if (result != null) {
                returnObj.push(addresses[i]);
            } 
        }))
    }

    await Promise.all(promises);

    return returnObj;
}

export async function findAddresses(wallet, password, ecl, chain) {
    var k = 0;
    var checkMore = true;
    let addresses;

    while (checkMore) {
        checkMore = false;

        addresses = await generateAddress([1+k, 21+k], wallet['mnemonicPhrase'], password, chain);
        addresses = await checkAddresses(addresses, ecl);

        if (addresses.length > 0) {
            k = k + 20;
            checkMore = true;
        }

        var res = await store.get('wallets');

        for (var i = 0; i < res.length; i++) {
            if(res[i].id == wallet.id) {
                for (var j = 0; j < addresses.length; j++) {
                    if(chain == 0) {
                        res[i]['addresses']['currentExternal'] = addresses[j].address;
                        res[i]['addresses']['external'][addresses[j].address] = addresses[j].data;
                    } else {
                        res[i]['addresses']['currentInternal'] = addresses[j].address;
                        res[i]['addresses']['internal'][addresses[j].address] = addresses[j].data;
                    }
                }

                break;
            }
        }

        store.save('wallets', res);
    }
}

export async function saveWallet(wallet) {
    store.get('wallets').then((res) => {
      for (var i = 0; i < res.length; i++) {
        if(res[i].id == wallet.id) {
          console.log("FOUND WALLET!")
          res[i] = wallet;
          break;
        }
      }
      store.save('wallets', res);
    })  
}