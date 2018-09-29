var coinjs = require('coinjs')

import { decryptData } from '../utils/Wallets'


var createTransaction = (inputs, recipients) => {
    
    var tx = coinjs.transaction();
    var seq = null;
            
    for (var i = 0; i < inputs.length; i++) {

        tx.addinput(inputs[i].tx_hash, inputs[i].tx_pos, inputs[i].script, seq);
        
    }

    for (var i = 0; i < recipients.length; i++) {

        var address = recipients[i].address;
        var addressDecoded = coinjs.addressDecode(address);

        if(((address!="") && (addressDecoded.version == coinjs.pub || addressDecoded.version == coinjs.multisig || addressDecoded.type=="bech32")) && recipients[i].amount!=0){

            tx.addoutput(address, recipients[i].amount);

        } else if (((address!="") && addressDecoded.version === 42) && recipients[i].amount!=0){

            tx.addstealth(addressDecoded, recipients[i].amount);
        }

    }

    return tx
}

var signTransaction = (text, wif) => {

    try { 

        var t = coinjs.transaction();
        var tx = t.deserialize(text);
        

        var signed = tx.sign(wif, 1);
        return signed

    } catch(e) {

        console.log(e);

    }

}

export var processTransaction = async(wallet, password, recieveAddress, amount, fee, ecl) => {

  var inputs = [],
      outputs = [],
      usedAddresses = [],
      outputsAmount = 0

  for (var i = 0; i < wallet.addresses.length; i++) {

    var balance = null

    try {

      balance = await ecl.blockchainAddress_getBalance(wallet.addresses[i].address)
      console.log("Balance: "+JSON.stringify(balance))

    } catch (e) {

       console.log(e)

    }

    if (balance != null && balance.confirmed > 0) {

      try {

        let utxo = await ecl.blockchainAddress_getUtxoAmount(wallet.addresses[i].address, balance.confirmed)
        console.log("utxo: "+JSON.stringify(utxo))

        usedAddresses.push(i)

        for (var k = 0; k < utxo.length; k++) {
          
          inputs.push({"tx_hash": utxo[k].tx_hash, "tx_pos": utxo[k].tx_pos, "script": utxo[k].script})
          outputsAmount += utxo[k].value/10000

        }

      } catch (e) {

         console.log(e)

      }

    } else {

      continue

    }

  }

  if (outputsAmount == 0 && outputsAmount-amount-fee < 0) {

    return {error: "Output amount error"}

  }

  outputs.push({"address":recieveAddress, "amount": amount})

  if (outputsAmount-amount-fee != 0 && wallet.addresses[wallet.addresses.length-1].address != null) {

    outputs.push({"address": wallet.addresses[wallet.addresses.length-1].address, "amount": (outputsAmount-amount-fee).toFixed(3).toString()})

  }

  let tx = createTransaction(inputs, outputs).serialize()

  if (tx != null) {

    for (var i = 0; i < usedAddresses.length; i++) {
      
      tx = signTransaction(tx, decryptData(wallet.addresses[usedAddresses[i]].privateKey, password))

    }

  }

  console.log(tx)

  try {

    return await ecl.blockchainTransaction_broadcast(tx)

  } catch (e) {

     return {error: e.message}

  }
   
}