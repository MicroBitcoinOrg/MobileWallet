import React from 'react';
import {
  Platform,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import store from 'react-native-simple-store';
import {encryptData, saveWallet} from '../utils/Helpers';
var coinjs = require('coinjs');

export default class openPasswordWalletScreen extends React.Component {

  constructor(props) {

    super(props);
    this.walletUtils = this.props.navigation.getParam('walletUtils', null);
    this.state = {
      key: ""
    }

  }

  static navigationOptions = {
    headerRight: Platform.OS === 'android' ? <View /> : ''
  }

  import = () => {
    if(this.state.key != "" && this.state.key != null) {
      let address = coinjs.wif2address(this.state.key).address;
      if(this.walletUtils.wallet.addresses.external[address] == undefined) {
        Alert.alert("Import WIF key", `Is this your address?\n\n${address}`,
        [
          {text: 'No', onPress: () => false},
          {text: 'Yes', onPress: () => {
            this.walletUtils.wallet.addresses.external[address] = {"used": false, "privateKey": encryptData(this.state.key, this.walletUtils.password)};
            this.walletUtils.updateBalance();
            this.walletUtils.subscribeToAddresses();
            saveWallet(this.walletUtils.wallet);
            this.props.navigation.goBack();
          }},
        ],
        { cancelable: false });
      } else {
        Alert.alert("Import WIF key", "This WIF key already exists in your wallet!");
      }
    } else {
      Alert.alert("Import WIF key", "WIF key is empty!");
    }
    
  }

  render() {

    return(
      <View style={styles.container}>

        <View style={styles.txtTop}>
          <Text style={styles.txtInfo}>Please type a WIF key to import into wallet:</Text>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            autoFocus = {true}
            secureTextEntry={true}
            onChangeText={(key) => this.setState({key: key})}
            value={this.state.key}
            maxLength={64}
            placeholder='Enter WIF key'
            underlineColorAndroid='transparent'
            style={styles.inputPassword}
          />
        </View>

        <View style={styles.spacing}>
        </View>

        <View style={styles.btnConfirmContainer}>
          <TouchableOpacity
            style={styles.btnConfirm}
            onPress={this.import}>
            <Text style={styles.btnConfirmText}>IMPORT WIF KEY</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.btnBack}
          onPress={() => this.props.navigation.goBack()}>
          <Text style={styles.txtInfo}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f2f2',
    padding: 24,
  },
  txtTop: {
    marginBottom: 16,
  },
  txtInfo: {
    fontSize: 14,
    color: '#505659',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.33,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
    marginBottom: 15
  },
  inputPassword: {
    flex: 1,
    minWidth: 256,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 32,
    color: '#000672'
  },
  spacing: {
    flex: 1,
  },
  btnConfirmContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnConfirm: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#000672',
    margin: 18,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.33,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  btnConfirmText: {
    color: '#ffffff',
    textAlign: 'center',
  },
  btnBack: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingRight: 48,
    paddingLeft: 48,
  }
})
