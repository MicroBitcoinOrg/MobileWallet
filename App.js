import './shim'
import React from 'react'
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation'
import { YellowBox } from 'react-native'
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
  WalletSettingsScreen
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
}, {
  initialRouteName: 'MyWallets',
  navigationOptions: {
    headerTitle: <Header />,
  }
})
const ElectrumCli = require('electrum-client')
const sleep = (ms) => new Promise((resolve,_) => setTimeout(() => resolve(), ms))

export default class App extends React.Component {

  constructor(props) {

    super(props)

    global.ecl = new ElectrumCli(7403, '13.57.248.201', 'tcp')
    global.version = "1.0"

  }

  componentDidMount() {

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

  render() {
    return(
      <RootStack />
    )
  }
}
