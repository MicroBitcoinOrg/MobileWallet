var coinjs = require('coinjs')

import { getAddressBalance, getAddressUtxoAmount, transactionBroadcast } from '../utils/ElectrumAPI'
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

export var processTransaction = async(wallet, password, recieveAddress, amount, fee) => {

  var inputs = [],
      outputs = [],
      usedAddresses = [],
      outputsAmount = 0

  for (var i = 0; i < wallet.addresses.length; i++) {

    let balance = await getAddressBalance(wallet.addresses[i].address)
    console.log("Balance: "+JSON.stringify(balance))
    let utxo = null

    if (balance.result != null && balance.result.confirmed > 0) {

      let utxo = await getAddressUtxoAmount(wallet.addresses[i].address, balance.result.confirmed)
      console.log("utxo: "+JSON.stringify(utxo))

      if (utxo.error == null) {

        usedAddresses.push(i)

        for (var k = 0; k < utxo.result.length; k++) {
          
          inputs.push({"tx_hash": utxo.result[k].tx_hash, "tx_pos": utxo.result[k].tx_pos, "script": utxo.result[k].script})
          outputsAmount += utxo.result[k].value/10000

        }

      }

    } else {

      continue

    }

  }

  if (outputsAmount == 0 && outputsAmount-amount-fee < 0) {

    return {"error": "Output amount error"}

  }

  outputs.push({"address":recieveAddress, "amount": amount})

  if (outputsAmount-amount-fee != 0 && wallet.addresses[wallet.addresses.length-1].address != null) {

    outputs.push({"address": wallet.addresses[wallet.addresses.length-1].address, "amount": (outputsAmount-amount-fee).toString()})

  }

  // console.log("outputs: "+JSON.stringify(outputs))

  let tx = createTransaction(inputs, outputs).serialize()
  // console.log("first tx: "+tx)

  if (tx != null) {

    for (var i = 0; i < usedAddresses.length; i++) {
      
      tx = signTransaction(tx, decryptData(wallet.addresses[usedAddresses[i]].privateKey, password))

    }

  }

  console.log(tx)

  return transactionBroadcast(tx)

}