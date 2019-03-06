import {generateNextAddress, saveWallet, decryptData, findAddresses} from './Helpers';

var coinjs = require('coinjs');

export class WalletUtils {
  
	constructor(wallet, password, ecl) {
		this.wallet = wallet;
		this.ecl = ecl;
		this.hashes = [];
		this.mempoolHashes = [];
		this.password = password;
		this.mempoolChecking = false;
		for (var key in this.wallet.transactions) this.hashes.push(this.wallet.transactions[key].hash);
		
		for (var i = 0; i < this.wallet.mempool.length; i++) {
			this.mempoolHashes.push(this.wallet.mempool[i].hash);
		}

		if (this.wallet.mempool.length > 0) {
			this.checkMempool();
		}


	}

	onlyUnique(value, index, self) { 
	    return self.indexOf(value) === index;
	}

  	createTransaction(inputs, recipients) {
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

	signTransaction(text, wif) {
	    try { 
	        var t = coinjs.transaction();
	        var tx = t.deserialize(text);
	        var signed = tx.sign(wif, 1);
	        return signed;
	    } catch(e) {
	        return null;
	    }
	}

	async sendTransation(recieveAddress, amount, fee) {
		var inputs = [],
		  	outputs = [],
		  	usedAddresses = [],
		  	outputsAmount = 0;

		for (var address in this.wallet.addresses.external) {
			var balance = null;

			try {
				balance = await this.ecl.blockchainAddress_balance(address);
				console.log("Balance: "+JSON.stringify(balance));
			} catch (e) {
				console.log(e);
			}

			if (balance != null && balance.confirmed > 0) {
				try {
					let utxo = await this.ecl.blockchainAddress_utxo(address, balance.confirmed);

					usedAddresses.push(address);
					for (var k = 0; k < utxo.length; k++) {
						inputs.push({"tx_hash": utxo[k].tx_hash, "tx_pos": utxo[k].tx_pos, "script": utxo[k].script});
						outputsAmount += utxo[k].value/10000;

						if (outputsAmount-amount-fee > 0) {
							break;
						}
					}
				} catch (e) {
					console.log(e);
				}
			} else {
				continue;
			}

			if (outputsAmount-amount-fee > 0) {
				break;
			}

		}

		if (outputsAmount-amount-fee <= 0) {
			for (var address in this.wallet.addresses.internal) {
				var balance = null;

				try {
					balance = await this.ecl.blockchainAddress_balance(address);
					console.log("Balance: "+JSON.stringify(balance));
				} catch (e) {
					console.log(e);
				}

				if (balance != null && balance.confirmed > 0) {
					try {
						let utxo = await this.ecl.blockchainAddress_utxo(address, balance.confirmed);
						console.log("utxo: "+JSON.stringify(utxo));
						usedAddresses.push(address);
						for (var k = 0; k < utxo.length; k++) {
							inputs.push({"tx_hash": utxo[k].tx_hash, "tx_pos": utxo[k].tx_pos, "script": utxo[k].script});
							outputsAmount += utxo[k].value/10000;

							if (outputsAmount-amount-fee > 0) {
								break;
							}
						}
					} catch (e) {
						console.log(e);
					}
				} else {
					continue;
				}

				if (outputsAmount-amount-fee > 0) {
					break;
				}
			}
		}

		if (outputsAmount == 0 && outputsAmount-amount-fee < 0) {
			return {error: "Output amount error"};
		}

		outputs.push({"address": recieveAddress, "amount": amount});

		if (outputsAmount-amount-fee > 0) {
			if (this.wallet.addresses.currentExternal != null) {
				outputs.push({"address": this.wallet.addresses.currentExternal, "amount": (outputsAmount-amount-fee).toFixed(4).toString()});
			} else {
				return {error: "Current address error"};
			}
		}

		let tx = this.createTransaction(inputs, outputs).serialize()

		if (tx != null) {
			for (var i = 0; i < usedAddresses.length; i++) {
				if (this.wallet.addresses.external[usedAddresses[i]] !== undefined) {
					tx = this.signTransaction(tx, decryptData(this.wallet.addresses.external[usedAddresses[i]].privateKey, this.password))
				} else {
					tx = this.signTransaction(tx, decryptData(this.wallet.addresses.internal[usedAddresses[i]].privateKey, this.password))
				}
				
			}
		}

		try {
			let broadcast = await this.ecl.blockchainTransaction_send(tx)
			/*
			let address = await generateNextAddress(this.wallet, this.password, 1);
			this.wallet.addresses.internal[address.address] = address.data;
          	this.wallet.addresses.currentInternal = address.address;
			saveWallet(this.wallet);
			*/
			return broadcast;
		} catch (e) {
			return {error: e.message}
		}

	}

	async subscribeToAddresses() {
		this.ecl.subscribe.on('blockchain.address.subscribe', (res) => { this.checkHistory(res[0]) });
		for (var address in this.wallet.addresses.external) {
			this.ecl.blockchainAddress_subscribe(address);
		}

		for (var address in this.wallet.addresses.internal) {
			this.ecl.blockchainAddress_subscribe(address);
		}
	}

	async addTransaction(transactionHash, isMempool) {
		if(transactionHash == null) return null;

		let transactionVerbose = await this.ecl.blockchainTransaction_fullVerbose(transactionHash);

		var transaction = {};
		transaction.hash = transactionHash;
		transaction.amount = 0;
		var promises = [];

		for (var k = 0; k < transactionVerbose.vin.length; k++) {
			if (transactionVerbose.vin[k].scriptPubKey.addresses == null) {
				continue;
			} 

			if (Object.keys(this.wallet.addresses.internal)
			      	 .includes(transactionVerbose.vin[k].scriptPubKey.addresses[0]) ||
			      	 Object.keys(this.wallet.addresses.external)
			      	 .includes(transactionVerbose.vin[k].scriptPubKey.addresses[0]) ) {
				transaction.amount += transactionVerbose.vin[k].value;
				transaction.type = 'Sent';
			}
		}

		if (transaction.amount == 0) {
			transaction.type = 'Received';

			for (var k = 0; k < transactionVerbose.vout.length; k++) {
				if (transactionVerbose.vout[k].scriptPubKey.addresses != null && Object
						.keys(this.wallet.addresses.external).includes(transactionVerbose.vout[k].scriptPubKey.addresses[0])) {
					transaction.amount += transactionVerbose.vout[k].value;
				}
			}
		} else {
			for (var k = 0; k < transactionVerbose.vout.length; k++) {
				if (transactionVerbose.vout[k].scriptPubKey.addresses != null && (Object
						.keys(this.wallet.addresses.external)
						.includes(transactionVerbose.vout[k].scriptPubKey.addresses[0]) || Object
						.keys(this.wallet.addresses.internal)
						.includes(transactionVerbose.vout[k].scriptPubKey.addresses[0]))) {
					transaction.amount -= transactionVerbose.vout[k].value;
				}
			}

			if (transaction.amount < 0) {
				transaction.type = 'Received';
				transaction.amount = transaction.amount * (-1)
			}
		}

		if (!isMempool && transactionVerbose.time != null) {
			transaction.date = new Date(transactionVerbose.time * 1000)
							.toLocaleDateString('en-GB', {  
		                      day : 'numeric',
		                      month : 'short',
		                      year : 'numeric'
		                    });
		    this.wallet.transactions[transactionVerbose.time] = transaction;
			return transaction;
		} else {
			transaction.date = null;
			this.wallet.mempool.push(transaction);
			
			if (!this.mempoolChecking) {
				this.checkMempool();
			}
			
			return null;
		}

	}

	async checkHistory(checkAddress = null) {
		var promises = [];
		var allHistory = [];

		if(checkAddress == null) {
			for (let address in this.wallet.addresses.internal) {
				promises.push(this.ecl.blockchainAddress_history(address).then((history) => {
					allHistory.push.apply(allHistory, history);
					console.log(history)
				}))
			}

			for (let address in this.wallet.addresses.external) {
				promises.push(this.ecl.blockchainAddress_history(address).then((history) => {
					allHistory.push.apply(allHistory, history);
					console.log("Load history of " + address);
					console.log(history)
				}))
			}

			await Promise.all(promises);
			allHistory = allHistory.filter( this.onlyUnique );
		} else {
			await this.ecl.blockchainAddress_history(checkAddress).then((history) => {
				allHistory.push.apply(allHistory, history);
			})
		}
		
		promises = [];
		
		for (var i = 0; i < allHistory.length; i++) {
			if (!this.mempoolHashes.includes(allHistory[i].tx_hash)) {
				if (allHistory[i].fee !== undefined) {
					this.mempoolHashes.push(allHistory[i].tx_hash);
					await this.addTransaction(allHistory[i].tx_hash, true);
				} else if(!this.hashes.includes(allHistory[i].tx_hash)) {
					this.hashes.push(allHistory[i].tx_hash);
					promises.push(this.addTransaction(allHistory[i].tx_hash, false));
				}
			}
			
		}

		await Promise.all(promises);
		await this.updateBalance();
	}

	async checkMempool() {
		const sleep = (ms) => new Promise((resolve,_) => setTimeout(() => resolve(), ms))
		this.mempoolChecking = true;

		while (this.wallet.mempool.length != 0) {
			for (var i = 0; i < this.wallet.mempool.length; i++) {
				let tx = await this.ecl.blockchainTransaction_verbose(this.wallet.mempool[i].hash);

				if (tx.time !== undefined) {
					this.wallet.mempool[i].date = new Date(tx.time * 1000)
							.toLocaleDateString('en-GB', {  
		                      day : 'numeric',
		                      month : 'short',
		                      year : 'numeric'
		                    });
					this.wallet.transactions[tx.time] = this.wallet.mempool[i];
					this.wallet.mempool.splice(i, 1);
					saveWallet(this.wallet);
					this.updateBalance();
				}
			}

			await sleep(3000);
		}

		this.mempoolChecking = false; 
	}

	async estimateFee() {
		return ((await this.ecl.blockchainEstimateSmartfee()).feerate/10000).toString()
	}

	async updateBalance() {
	    var promises = [];
	    var balance = 0;

	    for (var address in this.wallet.addresses.external) {
	    	try{
	        	balance += (await this.ecl.blockchainAddress_balance(address)).confirmed
	    	} catch (e) { }
	    }

	    for (var address in this.wallet.addresses.internal) {
	      try{
	        balance += (await this.ecl.blockchainAddress_balance(address)).confirmed
	      } catch (e) { }

	    }

	    // for (var timestamp in this.wallet.transactions) {
	    // 	if (this.wallet.transactions[timestamp].type == "Sent") {
	    // 		balance -= Number(this.wallet.transactions[timestamp].amount);
	    // 		console.log(balance + " [" + this.wallet.transactions[timestamp].amount + "]")
	    // 	} else {
	    // 		balance += Number(this.wallet.transactions[timestamp].amount);
	    // 		console.log(balance + " [" + this.wallet.transactions[timestamp].amount + "]")
	    // 	}
	    // }

	    // alert(balance)

	    this.wallet.balance = balance.toFixed(4);
	    await saveWallet(this.wallet);
  	}

}

module.exports = WalletUtils