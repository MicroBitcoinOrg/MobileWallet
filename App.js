import './shim'
import React from 'react'
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation'
import { YellowBox, AppRegistry, AppState } from 'react-native'
import store from 'react-native-simple-store'

YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader', 'Class RCTCxxModule']);

import {
  Header,
  RestoreWalletScreen,
  CreateWalletScreen,
  ImportWalletScreen,
  SetPasswordScreen,
  MyWalletsScreen,
  MyWalletDetailsScreen,
  WalletReceiveScreen,
  WalletSendScreen,
  ScanScreen,
  openPasswordWalletScreen,
  WalletSettingsScreen,
  ImportKeyScreen
} from './src/components/'


const RootStack = createStackNavigator({
  RestoreWallet: RestoreWalletScreen,
  CreateWallet: CreateWalletScreen,
  ImportWallet: ImportWalletScreen,
  SetPassword: SetPasswordScreen,
  MyWallets: MyWalletsScreen,
  MyWalletDetails: MyWalletDetailsScreen,
  WalletReceive: WalletReceiveScreen,
  WalletSend: WalletSendScreen,
  Scan: ScanScreen,
  openPasswordWallet: openPasswordWalletScreen,
  WalletSettings: WalletSettingsScreen,
  ImportKey: ImportKeyScreen
}, {
  initialRouteName: 'MyWallets',
  navigationOptions: {
    headerTitle: <Header />,
  }
})

var ElectrumCli = require('electrum-client')

export default class App extends React.Component {

  constructor(props) {

    super(props)

    this.state = {
      appState: AppState.currentState
    };
    this.pingInterval = null;

    global.port = 7403;
    global.ip = "13.57.248.201";
    global.ecl = new ElectrumCli(global.port, global.ip, 'tcp');
    global.version = "1.2";

    global.ecl.connect().then(() => this.ping)
  }

  ping() {
    this.pingInterval = setInterval(function() {
      if (global.ecl.status) {
        global.ecl.server_version();
      } else {
        global.ecl.connect();
      }
    }, 4000);
  }


  componentDidMount() {
    // AppState.addEventListener('change', this.handleAppStateChange);
    this.ping();
    store.get("wallets").then((wallets) => {
      if (wallets != null) {
          for (var i = 0; i < wallets.length; i++) {
            if (!("settings" in wallets[i])) {
              wallets[i]['settings'] = {'historyCount': '20'}
            }
          }

          store.save('wallets', wallets)
      }
    })
  }

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.ping();
    } else {
      clearInterval(this.pingInterval);
      global.ecl.close();
    }
    this.setState({appState: nextAppState});
  }

  render() {
    return(
      <RootStack />
    )
  }
}