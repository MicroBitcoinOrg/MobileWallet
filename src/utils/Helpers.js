'use strict'

import { WORDLIST } from '../utils/WordList_EN';
import store from 'react-native-simple-store';

var bip39 = require('bip39');
var BigInteger = require('big-integer');
var HDKey = require('hdkey');
var createHash = require('create-hash');
var bs58check = require('bs58check');
var aes256 = require('aes256');

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

 export function fromPrivateKeyToWIF(hex) {
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
export const generateAddress = async(range, mnemonic, password, chain, seed = null) => {
    if(seed == null) {
        seed = getSeed(decryptData(mnemonic, password));
    }
    
    const hdKey = getHDKey(seed);

    if (Array.isArray(range)) {
        var returnObj = [];

        for (var i = range[0]; i < range[1]; i++) {
            var address = {};
            var childKeys = hdKey.derive("m/44'/0'/0'/" + chain + "/" + i);

            address['privateKey'] = encryptData(fromPrivateKeyToWIF(getPrivateKey(childKeys).toString('hex')), password);
            address['used'] = false;
            returnObj.push({"address": fromPublicKeyToAddress(getPublicKey(childKeys)), "data": address});
        }

        return returnObj; 
    } else {
        var returnObj;
        var address = {};
        var childKeys = hdKey.derive("m/44'/0'/0'/" + chain + "/" + range);

        address['privateKey'] = encryptData(fromPrivateKeyToWIF(getPrivateKey(childKeys).toString('hex')), password);;
        address['used'] = false;
        returnObj = {"address": fromPublicKeyToAddress(getPublicKey(childKeys)), "data": address};
        
        return returnObj;
    }
}

export async function generateNextAddress(wallet, password, chain) {
    var k = 0;
    var address = null;
    var addresses = (chain == 0 ? Object.keys(wallet.addresses.external) : Object.keys(wallet.addresses.internal));
    console.log(addresses)
    while (true) {
        address = await generateAddress(k, wallet.mnemonicPhrase, password, chain);

        if (!(addresses.includes(address.address))) {
            break;
        }

        k++;

    }
    
    return address;
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

export async function checkAddresses(phrase, password, range, chain, ecl) {
    let seed = getSeed(decryptData(phrase, password));
    let addresses = await generateAddress(range, phrase, password, chain, seed);
    let returnObj = [];

    for (var i = 0; i < addresses.length; i++) {
        let result = await ecl.blockchainAddress_subscribe(addresses[i].address);
        console.log('result:', result)
        if (result != null) {
            returnObj.push(addresses[i]);
        }
    }

    return returnObj;
}

export async function findAddresses(wallet, password, ecl, chain) {
    var k = 0;
    var checkMore = true;

    while (checkMore) {
        checkMore = false;
        var addresses = await checkAddresses(wallet['mnemonicPhrase'], password, [1+k, 21+k], chain, ecl);

        if (addresses.length > 0) {
            k = k + 20;
            checkMore = true;
        }

        for (var i = 0; i < addresses.length; i++) {
            if(chain == 0) {
                wallet['addresses']['currentExternal'] = addresses[i].address;
                wallet['addresses']['external'][addresses[i].address] = addresses[i].data;
            } else {
                wallet['addresses']['currentInternal'] = addresses[i].address;
                wallet['addresses']['internal'][addresses[i].address] = addresses[i].data;
            }
        }
    }

    saveWallet(wallet);
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