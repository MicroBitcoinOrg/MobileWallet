import './shim'
import React from 'react'
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation'
import { YellowBox, AppRegistry, AppState, NetInfo } from 'react-native'
import store from 'react-native-simple-store'
import DeviceInfo from 'react-native-device-info'

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

const ElectrumCli = require('electrum-client')

export default class App extends React.Component {

  constructor(props) {

    super(props)
    this.pingInterval = null;

    this.state = {
      appState: AppState.currentState
    }

    global.port = 7403;
    global.ip = "13.57.248.201";
    global.ecl = new ElectrumCli(global.port, global.ip, 'tcp');
    global.version = DeviceInfo.getVersion();
    global.build = DeviceInfo.getBuildNumber();
    global.connectionStatus = false;

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

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      global.ecl = new ElectrumCli(global.port, global.ip, 'tcp');
      global.ecl.connect();
    }
    this.setState({appState: nextAppState});
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange);
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);

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

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  handleConnectivityChange = isConnected => {
    if (isConnected) {
       global.connectionStatus = isConnected;
    } else {
       global.connectionStatus = isConnected;
    }
  }

  render() {
    return(
      <RootStack />
    )
  }
}