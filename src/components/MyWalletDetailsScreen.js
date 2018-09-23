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
import { getAddressBalance, getHistory, getTransactionVerbose } from '../utils/ElectrumAPI'
import store from 'react-native-simple-store'


export default class MyWalletDetailsScreen extends React.Component {

  constructor(props) {

    super(props)

    this.isCancelled = false
    this.state = {

      updatingBalance: true,
      loading: false,
      isConnected: false,
      balance: null,
      transactions: null,
      wallet: this.props.navigation.getParam('wallet', null),
      password: this.props.navigation.getParam('password', null)

    }

    const willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      payload => {

        NetInfo.isConnected.fetch().then(isConnected => {
          this.setState({isConnected: isConnected})
        });

        handleFirstConnectivityChange = (isConnected) => {
      
          this.setState({isConnected: isConnected})

        }

        NetInfo.isConnected.addEventListener(

          'connectionChange',
          handleFirstConnectivityChange

        )

        store.get('wallets').then((res) => {
          
          for (var i = 0; i < res.length; i++) {
            
            if(res[i].id == this.state.wallet.id) {

              this.setState({wallet: res[i]})
              break

            }

          }

        })

      }
    )

  }

  static navigationOptions = ({ navigation }) => {

    const { params = {} } = navigation.state

    return {
      headerRight: (
        <Icon name="trash" size={18} style={{paddingRight: 10}} onPress={() => params.removeWallet()} color="#000672" />
      )
    }

  }

  removeWallet = () => {

    Alert.alert(
      "Remove wallet", "Are you sure?",
      [
          {text: 'No'},
          {text: 'Yes', onPress: () => {

            store.get('wallets').then((res) => {
      
              for (var i = 0; i < res.length; i++) {
                
                if(res[i].id == this.state.wallet.id) {

                  res.splice(i, 1)
                  break

                }

              }

              store.save('wallets', res)
              this.props.navigation.navigate('MyWallets')

            })

          }}
        ],
        { cancelable: false })

  }

  componentDidMount() {

    this.props.navigation.setParams({ removeWallet: this.removeWallet })

    if (this.state.wallet != null) {

      this.getTransactions()
      this.updateBalance()
      this.updateWallet()

    }

  }

  componentWillUnmount() {

      this.isCancelled = true
      clearInterval(this.sub)
      NetInfo.isConnected.removeEventListener(

        'connectionChange',
        handleFirstConnectivityChange

      );

  }

  updateWallet = async() => {


    this.sub = setInterval(() => {

      if (this.state.isConnected) {

        this.updateTransactions()
        this.updateBalance()

      }

    }, 30000)

  }

  updateBalance = async() => {

    this.setState({updatingBalance: true})
    var promises = []
    var balance = 0

    for (var i = 0; i < this.state.wallet.addresses.length; i++) {

      getAddressBalance(this.state.wallet.addresses[i].address).then((res) => {

        if(res.error == null) {

          balance += res.result.confirmed
          !this.isCancelled && this.setState({balance: balance})

        }

      })

    }

    this.setState({updatingBalance: false})

  }

  updateTransactions = async() => {

    var transactions = this.state.transactions

    for (var j = this.state.wallet.addresses.length - 1; j >= 0; j--) {

      let index = j

      if (!this.isCancelled) {

        let history = await getHistory(this.state.wallet.addresses[j].address, 0)

        if (history.error != null) {

          continue

        }

        for (var i = 0; i < history.result.history.length; i++) {

          if (transactions[this.state.wallet.addresses[j].address] == null) {

            transactions[this.state.wallet.addresses[j].address] = []

          }

          var haveTrans = false

          for (var k = 0; k < transactions[this.state.wallet.addresses[j].address].length; k++) {

            if (transactions[this.state.wallet.addresses[j].address][k].txid == history.result.history[i].data.txid) {

              haveTrans = true
              break

            }

          }

          // alert(address)

          if (!haveTrans) {

            this.createTransaction(history.result.history[i].data.txid, this.state.wallet.addresses[j].address).then(([transactionInfo, saveTrans]) => {

                transactions[this.state.wallet.addresses[index].address].unshift(transactionInfo)

                if(saveTrans) {

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

              })

          }

        }

      }

    }

  }

  getTransactions = async() => {

    var transactions = {}

    for (var j = this.state.wallet.addresses.length - 1; j >= 0; j--) {

        if (!this.isCancelled) {

          let index = j
          let history = await getHistory(this.state.wallet.addresses[j].address, 0)

          if (history.error != null) {

            if (this.state.wallet.addresses[j].transactions.length > 0) {

              transactions[this.state.wallet.addresses[j].address] = this.state.wallet.addresses[j].transactions

            }
            
            !this.isCancelled && this.setState({'transactions': transactions})
            continue
          
          }

          if (history.result.history.length > 0) {

            transactions[this.state.wallet.addresses[j].address] = []

          }

          for (var i = 0; i < history.result.history.length; i++) {

            var pushedFromStorage = false

            for (var k = 0; k < this.state.wallet.addresses[j].transactions.length; k++) {

              if (this.state.wallet.addresses[j].transactions[k].txid == history.result.history[i].data.txid && this.state.wallet.addresses[j].transactions[k].timestamp != "Mempool") {

                transactions[this.state.wallet.addresses[j].address].push(this.state.wallet.addresses[j].transactions[k])
                pushedFromStorage = true
                break

              }

            }

            if (pushedFromStorage) {

              !this.isCancelled && this.setState({'transactions': transactions})
              continue

            }

            await this.createTransaction(history.result.history[i].data.txid, this.state.wallet.addresses[index].address).then(([transactionInfo, saveTrans]) => {

              // alert(JSON.stringify(transactionInfo))

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

            })

          }

        }

    }

    !this.isCancelled && this.setState({'transactions': transactions})

  }

  createTransaction = async(tx, address) => {

    let transaction = await getTransactionVerbose(tx)

    if (transaction.error != null) {

      return

    }

    var transactionInfo = {}
    var saveTrans = true

    transactionInfo.txid = transaction.result.txid
    transactionInfo.amount = 0
    transactionInfo.link = 'https://microbitcoinorg.github.io/explorer/#/tx/' + transactionInfo.txid
    transactionInfo.timestamp = transaction.result.time

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

    for (var k = 0; k < transaction.result.vin.length; k++) {

      if (transaction.result.vin[k].txid != null) {

        let kIndex = k

          promises.push(getTransactionVerbose(transaction.result.vin[k].txid).then((verbose) => {

              if (address == verbose.result.vout[transaction.result.vin[kIndex].vout].scriptPubKey.addresses[0]) {

                  transactionInfo.amount += verbose.result.vout[transaction.result.vin[kIndex].vout].value
                  transactionInfo.type = 'Sent'

              }

          }))
      }

    }

    return Promise.all(promises).then((res, save) => {

        res = transactionInfo
        save = saveTrans
              
        if (res.amount == 0) {

          res.type = 'Received'

          for (var k = 0; k < transaction.result.vout.length; k++) {

            if (transaction.result.vout[k].scriptPubKey.addresses != null && address == transaction.result.vout[k].scriptPubKey.addresses[0]) {

              res.amount += transaction.result.vout[k].value

            }

          }

        } else {

          for (var k = 0; k < transaction.result.vout.length; k++) {

            if (transaction.result.vout[k].scriptPubKey.addresses != null && address == transaction.result.vout[k].scriptPubKey.addresses[0]) {

              res.amount -= transaction.result.vout[k].value

            }

          }

        }

        return Promise.all([res, save])

      })

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

    const { password, wallet, balance, transactions, isConnected, updatingBalance, loading } = this.state
    
    if (transactions != null) {
      return(
        <View style={styles.container}>
          {loading && 
            <Loader loading={true} />
          }
          <View style={styles.versionContainer}>
            <Text style={{"fontSize": 14, "textAlign": "center", "color": "black"}}>Alpha release 0.1</Text>
          </View>
          <View style={styles.balanceContainer}>
          <TouchableOpacity onPress={() => this.updateBalance()}><Text style={styles.balanceText}>{`${balance/10000} MBC`}</Text></TouchableOpacity>
            
            <Text style={styles.balanceSubText}>{wallet.title}</Text>
            <View style={[styles.status, isConnected ? styles.statusOnline : styles.statusOffline]}></View>
          </View>
          <ScrollView>
            {Object.keys(transactions).length == 0 ? <View style={styles.noHistoryContainer}><Text style={styles.labelText}>Wallet history is empty</Text></View> : <View></View>}
            {
              Object.keys(transactions).map(key => (
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
              ))
            }
          </ScrollView>
          <View style={styles.navbar}>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate('WalletReceive', {'wallet': wallet, 'password': password})}
              style={styles.navbarIconButton}>
              <NavbarButton label='Receive' icon='login' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate('MyWallets')} style={styles.navbarIconButton}>
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
    } else {
      return (<View style={styles.container}>
                <View style={styles.versionContainer}>
                  <Text style={{"fontSize": 14, "textAlign": "center", "color": "black"}}>Alpha release 0.1</Text>
                </View>
                <View style={styles.balanceContainer}>
                  <ActivityIndicator style={styles.balanceLoading} size="small" color="#fff" />
                  <Text style={styles.balanceSubText}>{wallet.title}</Text>
                  <View style={[styles.status, isConnected ? styles.statusOnline : styles.statusOffline]}></View>
                </View>
                <ScrollView>
                  <View style={styles.noHistoryContainer}>
                    <ActivityIndicator size="large" color="#000672" />
                  </View>
                </ScrollView>
                <View style={styles.navbar}>
                  <TouchableOpacity
                    onPress={() => this.props.navigation.navigate('WalletReceive', {'wallet': wallet, 'password': password})}
                    style={styles.navbarIconButton}>
                    <NavbarButton label='Receive' icon='login' />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => this.props.navigation.navigate('MyWallets')} style={styles.navbarIconButton}>
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
