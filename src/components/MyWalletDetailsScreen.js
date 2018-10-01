import React from 'react'
import {
  Button,
  ActivityIndicator,
  Platform,
  BackHandler,
  NetInfo,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  Linking,
  View
} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import NavbarButton from './NavbarButton'
import Loader from './Loader'
import store from 'react-native-simple-store'
// const ecl = new ElectrumCli(7403, '13.250.238.150', 'tcp') // 13.57.248.201:7403
const sleep = (ms) => new Promise((resolve,_) => setTimeout(() => resolve(), ms))

export default class MyWalletDetailsScreen extends React.Component {

  constructor(props) {

    super(props)

    this.isCancelled = false
    this.state = {

      loading: false,
      updatingBalance: false,
      isConnected: false,
      balance: null,
      transactions: null,
      addressQueue: [],
      wallet: this.props.navigation.getParam('wallet', null),
      password: this.props.navigation.getParam('password', null)

    }

    const willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      payload => {

        this.props.navigation.setParams({navigateToSettings: this.navigateToSettings})
        this.isCancelled = false

        if (this.state.wallet != null) {

          this.updateWallet()

        }

        NetInfo.isConnected.fetch().then(isConnected => {
          !this.isCancelled && this.setState({isConnected: isConnected})
        });

        handleFirstConnectivityChange = (isConnected) => {
      
          !this.isCancelled && this.setState({isConnected: isConnected})

        }

        NetInfo.isConnected.addEventListener(

          'connectionChange',
          handleFirstConnectivityChange

        )

        store.get('wallets').then((res) => {
          
          for (var i = 0; i < res.length; i++) {
            
            if(res[i].id == this.state.wallet.id) {

              !this.isCancelled && this.setState({wallet: res[i]})
              break

            }

          }

        })

      }
    )

    const willBlurSubscription = this.props.navigation.addListener(
      'willBlur',
      payload => {

        this.isCancelled = true
        clearInterval(this.sub)
        NetInfo.isConnected.removeEventListener(

          'connectionChange',
          handleFirstConnectivityChange

        );

      }
    )

  }

  static navigationOptions = ({ navigation }) => {

    const { params = {} } = navigation.state

    return {
      headerRight: (<Icon name="dots-three-horizontal" size={18} style={{paddingRight: 10}} onPress={() => params.navigateToSettings()} color="#000672" />)
    }

  }

  navigateToSettings = () => {

    this.componentWillUnmount()
    this.props.navigation.navigate("WalletSettings", {wallet: this.state.wallet, password: this.state.password})

  }

  updateWallet = async() => {

    // global.ecl.close()
    try {

      await global.ecl.connect()
      global.ecl.subscribe.on('blockchain.address.subscribe', (res) => { this.updateTransactions(res[0]) })

    } catch (e) {

      console.log(e)

    }

    if (this.state.transactions == null) {

      await this.getTransactions()

    } else {

      for (var i = 0; i < this.state.wallet.addresses.length; i++) {
        
        await global.ecl.blockchainAddress_subscribe(this.state.wallet.addresses[i].address)
      
      }

    }

    this.updateBalance()
    this.sub = setInterval(() => {

      if (this.state.isConnected) {

        this.updateBalance()

      }

    }, 30000)

    while(!this.isCancelled){

        await sleep(10000)
        const ver = await global.ecl.server_version()

    }

  }

  updateBalance = async() => {

    !this.isCancelled && this.setState({updatingBalance: true})

    var promises = []
    var balance = 0

    for (var i = 0; i < this.state.wallet.addresses.length; i++) {

      try{

        balance += (await global.ecl.blockchainAddress_getBalance(this.state.wallet.addresses[i].address)).confirmed
        
      } catch (e) {

        console.log(e)

      }

      !this.isCancelled && this.setState({balance: balance})

    }

    !this.isCancelled && this.setState({updatingBalance: false})

  }

  updateTransactions = async(address) => {

    for (var i = 0; i < this.state.addressQueue.length; i++) {

      if (this.state.addressQueue[i] == address) return

    }

    var addressQueue = this.state.addressQueue
    addressQueue.push(address)
    !this.isCancelled && this.setState({addressQueue: addressQueue})

    var transactions = this.state.transactions
    var index = null

    for (var i = 0; i < this.state.wallet.addresses.length; i++) {

      if (this.state.wallet.addresses[i].address == address) {

        index = i
        break

      }

    }

    if (!this.isCancelled) {

      var history

      try {
        
        history = await global.ecl.blockchainAddress_history(address, 0)

      
      } catch (e) {

        return

      }

      for (var i = 0; i < history.history.length; i++) {

        if (i == this.state.wallet.settings.historyCount-1) {

          break

        }

        if (transactions[address] == null) {

          transactions[address] = []

        }

        var haveTrans = false

        for (var k = 0; k < transactions[address].length; k++) {

          if (transactions[address][k].txid == history.history[i].data.txid) {

            haveTrans = true
            break

          }

        }

        if (!haveTrans) {

          // alert(history.history[i].data.txid)
          let res = await this.createTransaction(history.history[i].data.txid, address)
          let transactionInfo = res[0]
          let saveTrans = res[1]

          transactions[address].unshift(transactionInfo)

          if(saveTrans) {

            store.get('wallets').then((res) => {
          
              for (var i = 0; i < res.length; i++) {
                
                if (res[i].id == this.state.wallet.id) {
                  
                  res[i].addresses[index].transactions = transactions[address]
                  this.state.wallet.addresses[index].transactions = transactions[address]
                  break

                }

              }
              store.save('wallets', res)
            })

          }

          var addressQueue = this.state.addressQueue

          for (var i = 0; i < addressQueue.length; i++) {

            if (addressQueue[i] == address) {

              addressQueue.splice(i, 1)
              !this.isCancelled && this.setState({addressQueue: addressQueue})

            }

          }

          if (this.state.wallet.settings.historyCount != null && transactions[address].length > this.state.wallet.settings.historyCount) {

            transactions[address] = transactions[address].slice(0, this.state.wallet.settings.historyCount);
            console.log("HERE:", transactions[address].slice(0, this.state.wallet.settings.historyCount))

          }

          !this.isCancelled && this.setState({'transactions': transactions})

            

        }

      }

    }

  }

  getTransactions = async() => {

    var transactions = {}

    for (var j = this.state.wallet.addresses.length - 1; j >= 0; j--) {

        if (!this.isCancelled) {
          alert(global.ecl.status)
          if (!global.ecl.status) {

            if (this.state.wallet.addresses[j].transactions.length > 0) {

              transactions[this.state.wallet.addresses[j].address] = this.state.wallet.addresses[j].transactions

            }
            
            !this.isCancelled && this.setState({'transactions': transactions})
            continue

          }

          let index = j

          try {

            global.ecl.blockchainAddress_subscribe(this.state.wallet.addresses[j].address)

          } catch (e) {

            console.log(e)

          }

          var history

          try {

            history = await global.ecl.blockchainAddress_history(this.state.wallet.addresses[j].address, 0)

          } catch (e) {

            if (this.state.wallet.addresses[j].transactions.length > 0) {

              transactions[this.state.wallet.addresses[j].address] = this.state.wallet.addresses[j].transactions

            }
            
            !this.isCancelled && this.setState({'transactions': transactions})
            continue

          }
          // alert(JSON.stringify(history))

          if (history.history.length > 0) {

            transactions[this.state.wallet.addresses[j].address] = []

          }

          for (var i = 0; i < history.history.length; i++) {

            if (this.state.wallet.settings.historyCount != null && transactions[this.state.wallet.addresses[index].address].length == this.state.wallet.settings.historyCount) {

              break

            }

            var pushedFromStorage = false

            for (var k = 0; k < this.state.wallet.addresses[j].transactions.length; k++) {

              if (this.state.wallet.addresses[j].transactions[k].txid == history.history[i].data.txid && this.state.wallet.addresses[j].transactions[k].timestamp != "Mempool") {

                transactions[this.state.wallet.addresses[j].address].push(this.state.wallet.addresses[j].transactions[k])
                pushedFromStorage = true
                break

              }

            }

            if (pushedFromStorage) {

              !this.isCancelled && this.setState({'transactions': transactions})
              continue

            }

            let res = await this.createTransaction(history.history[i].data.txid, this.state.wallet.addresses[index].address)
            let transactionInfo = res[0]
            let saveTrans = res[1]

            transactions[this.state.wallet.addresses[index].address].push(transactionInfo)

            if (saveTrans) {

              store.get('wallets').then((res) => {
            
                for (var i = 0; i < res.length; i++) {
                  
                  if (res[i].id == this.state.wallet.id) {
                    
                    res[i].addresses[index].transactions = transactions[this.state.wallet.addresses[index].address]
                    this.state.wallet.addresses[index].transactions = transactions[this.state.wallet.addresses[index].address]
                    break

                  }

                }
                store.save('wallets', res)
              })

            }

            !this.isCancelled && this.setState({'transactions': transactions})

          }

        }

    }

    !this.isCancelled && this.setState({'transactions': transactions})

  }

  createTransaction = async(tx, address) => {

    var transaction = null
    
    try {

      transaction = await global.ecl.blockchainTransaction_getVerbose(tx)

    } catch (e) {

      return

    }

    var transactionInfo = {}
    var saveTrans = true

    transactionInfo.txid = transaction.txid
    transactionInfo.amount = 0
    transactionInfo.link = 'https://microbitcoinorg.github.io/explorer/#/tx/' + transactionInfo.txid
    transactionInfo.timestamp = transaction.time

    if (transactionInfo.timestamp != null) {

      var date = new Date(transactionInfo.timestamp * 1000);
      transactionInfo.date = date.toLocaleDateString('en-GB', {  
                                  day : 'numeric',
                                  month : 'short',
                                  year : 'numeric'
                                })
    } else {

      saveTrans = false
      transactionInfo.date = "Mempool"

    }

    var promises = []

    for (var k = 0; k < transaction.vin.length; k++) {

      if (transaction.vin[k].txid != null) {

        let kIndex = k

          promises.push(global.ecl.blockchainTransaction_getVerbose(transaction.vin[k].txid).then((verbose) => {

              if (address == verbose.vout[transaction.vin[kIndex].vout].scriptPubKey.addresses[0]) {

                  transactionInfo.amount += verbose.vout[transaction.vin[kIndex].vout].value
                  transactionInfo.type = 'Sent'

              }

          }))
      }

    }

    let res = await Promise.all(promises)
          
    if (transactionInfo.amount == 0) {

      transactionInfo.type = 'Received'

      for (var k = 0; k < transaction.vout.length; k++) {

        if (transaction.vout[k].scriptPubKey.addresses != null && address == transaction.vout[k].scriptPubKey.addresses[0]) {

          transactionInfo.amount += transaction.vout[k].value

        }

      }

    } else {

      for (var k = 0; k < transaction.vout.length; k++) {

        if (transaction.vout[k].scriptPubKey.addresses != null && address == transaction.vout[k].scriptPubKey.addresses[0]) {

          transactionInfo.amount -= transaction.vout[k].value

        }

      }

    }

    return [transactionInfo, saveTrans]

  }

  openLink = (url) => {

    Linking.canOpenURL(url).then(supported => {

      if (supported) {

        Linking.openURL(url);

      } else {

        console.log("Don't know how to open URI: " + url);

      }

    });

  }

  handleFirstConnectivityChange = (connectionInfo) => {
    console.log('First change, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
    NetInfo.removeEventListener(
      'connectionChange',
      handleFirstConnectivityChange
    );
  }

  render() {

    const { password, wallet, balance, transactions, updatingBalance, isConnected, loading, ecl } = this.state
    
      return(
        <View style={styles.container}>
          {loading && 
            <Loader loading={true} />
          }
          <View style={styles.versionContainer}>
            <Text style={{"fontSize": 14, "textAlign": "center", "color": "black"}}>Beta release 1.0</Text>
          </View>
          <View style={styles.balanceContainer}>
          {transactions == null || updatingBalance ? <ActivityIndicator style={styles.balanceLoading} size="small" color="#fff" /> : <TouchableOpacity onPress={this.updateBalance}><Text style={styles.balanceText}>{`${balance/10000} MBC`}</Text></TouchableOpacity>}
            <Text style={styles.balanceSubText}>{wallet.title}</Text>
            <View style={[styles.status, isConnected ? styles.statusOnline : styles.statusOffline]}></View>
          </View>
          <ScrollView>
          {transactions == null ? <View style={styles.noHistoryContainer}><ActivityIndicator size="large" color="#000672" /></View> : <View></View>}
            {transactions != null && Object.keys(transactions).length == 0 ? <View style={styles.noHistoryContainer}><Text style={styles.labelText}>Wallet history is empty</Text></View> : <View></View>}
            {
              transactions != null ? Object.keys(transactions).map(key => (
                transactions[key].map((tx,i) => (
                <View key={tx.txid}>
                {i == 0 ? <Text style={styles.addressHeader}>{key}</Text> : <View></View>}
                <TouchableOpacity
                  key={tx.txid}
                  onPress={() => this.openLink(tx.link)}>
                  <MyWalletTransaction tx={tx} />
                </TouchableOpacity>
                </View>
                ))
              )) : <View></View>
            }
          </ScrollView>
          <View style={styles.navbar}>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate('WalletReceive', {'wallet': wallet, 'password': password})}
              style={styles.navbarIconButton}>
              <NavbarButton label='Receive' icon='login' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.props.navigation.push('MyWallets')} style={styles.navbarIconButton}>
              <NavbarButton label='Wallets' icon='wallet' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate('WalletSend', {'wallet': wallet, 'password': password})}
              style={styles.navbarIconButton}>
              <NavbarButton label='Send' icon='log-out' />
            </TouchableOpacity>
          </View>
        </View>
      )
    
  }
}

class MyWalletTransaction extends React.Component {
  render() {
    const { tx } = this.props
    return(
      <View style={styles.txContainer}>
        {tx.type === 'Sent'
          ? (<Icon name="chevron-with-circle-up" size={32} color="#cccccc" />)
          : (<Icon name="chevron-with-circle-down" size={32} color="#19e0d6" />)
        }
        <View style={styles.txTypeContainer}>
          <Text style={styles.txType}>{tx.type}</Text>
        </View>
        <View style={styles.txAmount}>
          <Text style={styles.txAmountText}>{`${tx.amount.toFixed(2)} MBC`}</Text>
          <Text style={styles.txDateText}>{`${tx.date}`}</Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  balanceContainer: {
    paddingTop: 36,
    paddingBottom: 20,
    paddingRight: 16,
    paddingLeft: 16,
    backgroundColor: '#000672',
    alignItems: 'center',
  },
  versionContainer: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 16,
    paddingLeft: 16,
    backgroundColor: 'yellow',
    alignItems: 'center',
  },
  noHistoryContainer: {
    paddingTop: 36,
    paddingBottom: 36,
    alignItems: 'center'
  },
  addressHeader: {
    backgroundColor: '#000672',
    marginTop: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 5,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    color: '#fff'
  },
  balanceLoading: {
    marginBottom: 8,
    marginTop: 8
  },
  balanceText: {
    marginBottom: 4,
    fontSize: 28,
    color: '#ffffff',
  },
  balanceSubText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.75,
  },
  txContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    marginBottom: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.1 },
    shadowOpacity: 0.33,
    shadowRadius: 0,
    elevation: 1,
    zIndex: 10,
  },
  txTypeContainer: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
  },
  txType: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000672',
  },
  txAmount: {
    flexDirection: 'column',
  },
  txAmountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000672',
  },
  txDateText: {
    textAlign: 'right',
    color: '#000672',
    opacity: 0.75,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000672',
    height: 64,
  },
  btnBack: {
    flex: 1,
  },
  navbarIconButton: {
    flex: 1,
    opacity: 0.66,
  },
  navbarIconButtonSelected: {
    flex: 1,
    opacity: 1.0,
  },
  labelText: {
    paddingRight: 8,
    color: 'grey',
    fontSize: 20,
    textAlign: 'center'
  },
  status: {
    marginTop: 10,
    width: 10,
    height: 10,
    borderRadius: 10/2
  },
  statusOnline: {
    backgroundColor: '#00d47d'
  },
  statusOffline: {
    backgroundColor: '#ff4133'
  }
})
