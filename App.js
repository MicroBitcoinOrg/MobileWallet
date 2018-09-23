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
  openPasswordWalletScreen
} from './src/components/'


/**
 * Routes
 * 
 * TODO: Replace bottom Navbar with BottomTabNavigator
 */
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
}, {
  initialRouteName: 'MyWallets',
  navigationOptions: {
    headerTitle: <Header />,
  }
})

export default class App extends React.Component {

  constructor(props) {

    super(props)

    store.get("currentAppVersion").then((ver) => {

      if(ver == null) {

        store.save("currentAppVersion", "0.1")

      }

    })

    store.get("prevAppVersion").then((ver) => {

      if(ver == null) {

        store.save("prevAppVersion", "-")

      }

    })

  }

  render() {
    return(
      <RootStack />
    )
  }
}
