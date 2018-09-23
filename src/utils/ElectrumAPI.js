/**
 * API for ElectrumX Servers
 */

const api =  { main: ['https://volbil.com/mbc/api'], test: ['https://volbil.com/mbc/api/test', 'http://13.250.238.150:1234'] };

const methods = {
    getHistory: 'blockchain.address.history',
    getAddressBalance: 'blockchain.address.get_balance',
    getAddressHistory: 'blockchain.address.get_history',
    getAddressMempool: 'blockchain.address.get_mempool',
    getAddressUtxo: 'blockchain.address.get_utxo',
    getAddressUtxoAmount: 'blockchain.address.get_utxo_amount',
    getAddressInfo: 'blockchain.address.info',
    getHeader: 'blockchain.block.get_header',
    getHeaderRange: 'blockchain.block.get_header_range',
    getHeaderInfo: 'blockchain.block.get_header_info',
    transactionBroadcast: 'blockchain.transaction.broadcast',
    getTransaction: 'blockchain.transaction.get',
    getTransactionVerbose: 'blockchain.transaction.get_verbose',
    getEstimateSmartFee: 'blockchain.estimatesmartfee',
    getInfo: 'getinfo'
};

const headers = {
    'Accept': 'application/json, text/plain, */*',  // It can be used to overcome cors errors
    'Content-Type': 'application/json'
};

createRequest = (object) => {

	var requestLink = api.main[0] + "/?method=" + object.method;

	if(object.params != null) {
		object.params.forEach(function(param){
			requestLink += "&params[]=" + param;
		});
	}

	return requestLink
}

sendRequest = async(object) => {

    return fetch(createRequest(object), {headers: headers})
        .then(res => {
            if(res.status == 200) {
                return res.json()
            } else {
                return {"error": "Server status error"}
            }
        })
        .catch((error) => {

          return {"error": error}

        })

}

// Export functions

export const getHistory = async(address, pagination) => {
    return await sendRequest({method: methods.getHistory, params: [address, pagination]})
}

export const getAddressBalance = async(address) => {
    return await sendRequest({method: methods.getAddressBalance, params: [address]})
}

export const getAddressHistory = (address) => {
    return sendRequest({method: methods.getAddressHistory, params: [address]});
}

export const getAddressMempool = (address) => {
    return sendRequest({method: methods.getAddressMempool, params: [address]});
}

export const getAddressUtxo = (address) => {
    return sendRequest({method: methods.getAddressUtxo, params: [address]});
}

export const getAddressUtxoAmount = (address, amount) => {
    return sendRequest({method: methods.getAddressUtxoAmount, params: [address, amount]});
}

export const getAddressInfo = (address) => {
    return sendRequest({method: methods.getAddressInfo, params: [address]});
}

export const getHeader = (height) => {
    return sendRequest({method: methods.getHeader, params: [height]});
}

export const getHeaderRange = (height, range) => {
    return sendRequest({method: methods.getHeaderRange, params: [height, range]});
}

export const getHeaderInfo = (hash) => {
    return sendRequest({method: methods.getHeaderInfo, params: [hash]});
}

export const transactionBroadcast = (transaction) => {
    return sendRequest({method: methods.transactionBroadcast, params: [transaction]});
}

export const getTransaction = (transaction) => {
    return sendRequest({method: methods.getTransaction, params: [transaction]});
}

export const getTransactionVerbose = (transaction) => {
    return sendRequest({method: methods.getTransactionVerbose, params: [transaction]});
}

export const getEstimateSmartFee = () => {
    return sendRequest({method: methods.getEstimateSmartFee});
}

export const getInfo = () => {
    return sendRequest({method: methods.getInfo});
}