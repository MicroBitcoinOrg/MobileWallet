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
  View,
  AppState
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import NavbarButton from './NavbarButton';
import Loader from './Loader';
import WalletUtils from '../utils/WalletUtils';
import store from 'react-native-simple-store';

export default class MyWalletDetailsScreen extends React.Component {

  constructor(props) {
    super(props)
    this.state = {

      updatingBalance: false,
      loading: false,
      isConnected: false,
      walletUtils: new WalletUtils(this.props.navigation.getParam('wallet', null), this.props.navigation.getParam('password', null), global.ecl),
      appState: AppState.currentState

    }

    this.state.walletUtils.subscribeToAddresses();
    this.state.walletUtils.checkHistory();
    this.state.isCancelled = false;
    
    const willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      payload => {
        this.props.navigation.setParams({navigateToSettings: this.navigateToSettings})
        this.props.navigation.setParams({goBack: this.goBack})
        this.interval = setInterval(() => this.updateWallet(), 2000);
        this.isCancelled = false

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
        AppState.addEventListener('change', this.handleAppStateChange);
      }
    )

    const willBlurSubscription = this.props.navigation.addListener(
      'willBlur',
      payload => {
        this.isCancelled = true
        clearInterval(this.interval);

        NetInfo.isConnected.removeEventListener(

          'connectionChange',
          handleFirstConnectivityChange

        );
        AppState.removeEventListener('change', this.handleAppStateChange);
      }
    )

  }

  updateWallet() {
    if(!this.isCancelled) this.setState({walletUtils: this.state.walletUtils});
  }

  async updateBalance() {
    if(!this.isCancelled) this.setState({updatingBalance: true});
    await this.state.walletUtils.updateBalance();
    if(!this.isCancelled) this.setState({walletUtils: this.state.walletUtils});
    if(!this.isCancelled) this.setState({updatingBalance: false});
  }

  static navigationOptions = ({ navigation }) => {
    const { params = {} } = navigation.state
    return {
      headerRight: (<Icon name="dots-three-vertical" size={18} style={{paddingRight: 10}} onPress={() => params.navigateToSettings()} color="#000672" />)
    }
  }

  goBack = () => {
    this.props.navigation.push("MyWallets")
  }

  navigateToSettings = () => {
    this.props.navigation.navigate("WalletSettings", {walletUtils: this.state.walletUtils})
  }


  openLink = (url) => {
    url = "https://microbitcoinorg.github.io/explorer/#/tx/" + url;
    Linking.canOpenURL(url).then(supported => {

      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }

    });
  }

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.setState({walletUtils: new WalletUtils(this.state.walletUtils.wallet, this.state.walletUtils.password, global.ecl)});
      this.state.walletUtils.subscribeToAddresses();
      this.state.walletUtils.checkHistory();
    }
    if (!this.isCancelled) this.setState({appState: nextAppState});
  }

  handleFirstConnectivityChange = (connectionInfo) => {
    console.log('First change, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
    NetInfo.removeEventListener(
      'connectionChange',
      handleFirstConnectivityChange
    );
  }

  render() {

    const { walletUtils, isConnected, loading, updatingBalance } = this.state
    
      return(
        <View style={styles.container}>
          {loading && 
            <Loader loading={true} />
          }
          <View style={styles.balanceContainer}>
            {updatingBalance ? <ActivityIndicator size="small" color="#fff" style={styles.balanceLoading} /> : <TouchableOpacity onPress={() => this.updateBalance()}><Text style={styles.balanceText}>{`${walletUtils.wallet.balance/10000} MBC`}</Text></TouchableOpacity>}
            <Text>
              <Icon name="controller-record" size={14} color={isConnected ? '#00d47d' : '#ff4133'} />
              <Text style={styles.balanceSubText}> {walletUtils.wallet.title}</Text>
            </Text>
          </View>
          <ScrollView>
          {walletUtils.wallet.transactions == null ? <View style={styles.noHistoryContainer}><ActivityIndicator size="large" color="#000672" /></View> : null}
            {walletUtils.wallet.transactions != null && Object.keys(walletUtils.wallet.transactions).length == 0 && walletUtils.wallet.mempool.length == 0 ? <View style={styles.noHistoryContainer}><Text style={styles.labelText}>Wallet history is empty</Text></View> : null}
            {walletUtils.wallet.mempool.length > 0 ? <Text style={styles.addressHeader}>Unconfirmed transactions</Text> : null}
            {
              walletUtils.wallet.mempool.map((tx) => (
                <TouchableOpacity
                  key={tx['hash']}
                  onPress={() => this.openLink(tx['hash'])}>
                  <MyWalletTransaction tx={tx} />
                </TouchableOpacity>
              ))
            }

            {Object.keys(walletUtils.wallet.transactions).length > 0 ? <Text style={styles.addressHeader}>Confirmed transactions</Text> : null}
            {
              walletUtils.wallet.transactions != null ? Object.keys(walletUtils.wallet.transactions).reverse().slice(0, walletUtils.wallet.settings.historyCount).map((tx) => (
                <TouchableOpacity
                  key={walletUtils.wallet.transactions[tx]['hash']}
                  onPress={() => this.openLink(walletUtils.wallet.transactions[tx]['hash'])}>
                  <MyWalletTransaction tx={walletUtils.wallet.transactions[tx]} />
                </TouchableOpacity>
              )) : null
            }
          </ScrollView>
          <View style={styles.navbar}>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate('WalletReceive', {'walletUtils': walletUtils})}
              style={styles.navbarIconButton}>
              <NavbarButton label='Receive' icon='login' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate('MyWallets')} style={styles.navbarIconButton}>
              <NavbarButton label='Wallets' icon='wallet' />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => this.props.navigation.navigate('WalletSend', {'walletUtils': walletUtils})}
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
          <Text style={styles.txAmountText}>{tx.type === 'Sent' ? "-" : "+"}{`${tx.amount.toFixed(2)} MBC`}</Text>
          <Text style={styles.txDateText}>{tx.date != null ? tx.date : "Mempool"}</Text>
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
    paddingTop: 26,
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
    opacity: 0.75
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
    borderRadius: 10/2,
    backgroundColor: '#ff4133'
  },
  statusOnline: {
    backgroundColor: '#00d47d'
  },
  statusOffline: {
    backgroundColor: '#ff4133'
  }
})
