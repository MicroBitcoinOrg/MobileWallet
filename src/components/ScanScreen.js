import React from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Dimensions,
} from 'react-native'
import QRCodeScanner from 'react-native-qrcode-scanner'
import Icon from 'react-native-vector-icons/Entypo'
import NavbarButton from './NavbarButton'

export default class ScanScreen extends React.Component {

  static navigationOptions = () => {

    return {
      headerRight: (
        <View></View>
      )
    }

  }

  onSuccess(e) {
    
    if(e.data.length == 47 && e.data.substring(0, 12) == "microbitcoin") {

      this.props.navigation.navigate('WalletSend', {scannedAddress: e.data.substring(13, e.data.length)})

    } else if(e.data.length == 34) {

      this.props.navigation.navigate('WalletSend', {scannedAddress: e.data})

    }

  }
 
  render() {
    return (
      <View style={styles.container}>
      <QRCodeScanner
        onRead={this.onSuccess.bind(this)}
        cameraStyle={styles.cameraContainer}
      />
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => this.props.navigation.goBack()} style={styles.btnBack}>
          <NavbarButton label='Back' icon='back' />
        </TouchableOpacity>
      </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#f2f2f2',
  },
  cameraContainer: {
    height: Dimensions.get('window').height,
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
  centerText: {
    flex: 1,
    fontSize: 14,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
})