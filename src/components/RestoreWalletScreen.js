import React from 'react'
import {
  Platform,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native'

import Logo from '../assets/icon.png'

/**
 * RestoreWalletScreen
 * 
 * Can be used for both:
 * - first launch of app, or
 * - add wallet (from MyWallets)
 */
export default class RestoreWalletScreen extends React.Component {

  static navigationOptions = () => {

    return {
      headerLeft: Platform.OS === 'android' ? <View /> : '',
      headerRight: (
        <View></View>
      )
    }

  }

  render() {

      return(
        <View style={styles.container}>

          <View style={styles.imgLogoContainer}>
            <Image source={Logo} style={styles.imgLogo} />
          </View>

          <View style={styles.txtInfoContainer}>
            <Text style={styles.txtInfo}>Create a new wallet or</Text>
            <Text style={styles.txtInfo}>import an existing one</Text>
          </View>

          

          <View style={styles.btnContainer}>
            <TouchableOpacity
              style={styles.btnCreate}
              onPress={() => this.props.navigation.navigate('CreateWallet')}>
              <Text style={styles.btnTextCreate}>CREATE WALLET</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnImport}
              onPress={() => this.props.navigation.navigate('ImportWallet')}>
              <Text style={styles.btnTextImport}>IMPORT WALLET</Text>
            </TouchableOpacity>
          </View>

        </View>
      )
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  imgLogoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 96
  },
  imgLogo: {
    resizeMode: 'contain',
    height: 180
  },
  txtInfoContainer: {
    flex: 1
  },
  txtInfo: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#505659'
  },
  txtSelected: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold'
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 64,
    bottom: 0
  },
  btnCreate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000672'
  },
  btnImport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2'
  },
  btnTextCreate: {
    fontSize: 14,
    color: '#ffffff'
  },
  btnTextImport: {
    fontSize: 14,
    color: '#505659'
  }
});
