'use strict'

import store from 'react-native-simple-store'
import { WORDLIST } from '../utils/WordList_EN'

var bip39 = require('bip39')
var BigInteger = require('big-integer')
var HDKey = require('hdkey')
var createHash = require('create-hash')
var bs58check = require('bs58check')
var aes256 = require('aes256')

var wallet = {}
const networkPrefix = {main: [0x1A, 0x33], test: [0x47, 0x49]}

var validateMnemonic = (mnemonic) => {
    return bip39.validateMnemonic(mnemonic)
}

var getSeed = (mnemonic) => {
    return bip39.mnemonicToSeed(mnemonic)
}

var getHDKey = (seed) => {
    return HDKey.fromMasterSeed(seed)
}

var getPublicKey = (keyPair) => {
    return keyPair.publicKey
}

var getPrivateKey = (keyPair) => {
    return keyPair.privateKey
}

var getPublicExtendedKey = (keyPair) => {
    return keyPair.publicExtendedKey
}

var getPrivateExtendedKey = (keyPair) => {
    return keyPair.privateExtendedKey
}

var fromPublicKeyToAddress = (publicKey) => {
    const sha256Encoding = createHash('sha256').update(publicKey).digest();
    const rmd160Encoding = createHash('rmd160').update(sha256Encoding).digest();

    var buffer = Buffer.allocUnsafe(21);
    buffer.writeUInt8(networkPrefix.main[0], 0);
    rmd160Encoding.copy(buffer, 1);

    const address = bs58check.encode(buffer);

    return address
}

var fromPrivateKeyToWIF = (hex) => {
    for (var privateKey = [], c = 0; c < hex.length; c += 2)
        privateKey.push(parseInt(hex.substr(c, 2), 16))

    privateKey.push(0x01)
    privateKey.unshift(0x80)

    const hash = createHash('sha256').update(createHash('sha256').update(privateKey).digest()).digest()
    const checksum = hash.slice(0, 4)

    const buf = Buffer.from(privateKey)
    buf.copy(checksum)

    const wif = bs58check.encode(buf)

    return wif
}

export var encryptData = (data, key) => {
    if(key) {
        return aes256.encrypt(key, data)
    }

    return data
}

export var decryptData = (data, key) => {
    if(key) {
        return aes256.decrypt(key, data)
    }

    return data
}

export const generateWallet = (mnemonic, title, id, password) => {

    const seed = getSeed(mnemonic)
    const hdKey = getHDKey(seed)
    const firstPair = hdKey.derive("m/44'/0'/0'/0/0")

    var address = {}

    address['address'] = fromPublicKeyToAddress(getPublicKey(firstPair))
    address['privateKey'] = fromPrivateKeyToWIF(getPrivateKey(firstPair).toString('hex'))
    
    address['transactions'] = []
    address['used'] = false

    wallet['id'] = id
    wallet['title'] = title
    wallet['mnemonicPhrase'] = mnemonic

    if (password != null) {

        wallet['password'] = encryptData(password, password);
        wallet['mnemonicPhrase'] = encryptData(wallet['mnemonicPhrase'], password)
        address['privateKey'] = encryptData(address['privateKey'], password)

    }

    wallet['addresses'] = [address]

    return wallet
}

export const generateChildWallet = (index, mnemonic, password) => {

    const seed = getSeed(mnemonic)
    const hdKey = getHDKey(seed)

    var childKeys = hdKey.derive("m/44'/0'/0'/0/"+index)

    var address = {};

    address['privateKey'] = fromPrivateKeyToWIF(getPrivateKey(childKeys).toString('hex'))
    address['address'] = fromPublicKeyToAddress(getPublicKey(childKeys))
    address['transactions'] = []
    address['used'] = false

    if (password != null) {

      address['privateKey'] = encryptData(address['privateKey'], password)  

    }

    return address

}

export const generateMnemonic = () => {

    let words = ''

    for(var i = 0; i < 18; i++) {
      if(i != 0) {
        words += ' ' + WORDLIST[Math.floor(Math.random() * WORDLIST.length)];
      } else {
        words += WORDLIST[Math.floor(Math.random() * WORDLIST.length)];
      }
      
    };

    return words
}