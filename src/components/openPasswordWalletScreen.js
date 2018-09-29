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

import store from 'react-native-simple-store'
import { decryptData } from '../utils/Wallets'

export default class openPasswordWalletScreen extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      password: "",
      wallet: this.props.navigation.getParam('wallet', null),
      ecl: this.props.navigation.getParam('ecl', null)
    }

    const willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      payload => {

        this.state.password = ""

      }
    )

  }

  static navigationOptions = {
    headerRight: Platform.OS === 'android' ? <View /> : ''
  }

  decrypt = () => {

    if(this.state.password.length < 4) {

      Alert.alert('Your password must contain a minimum of 4 characters.')
      return

    } else {

      if(decryptData(this.state.wallet['password'], this.state.password) != this.state.password) {

        Alert.alert('Invalid password!')
        return

      } else {

        this.props.navigation.push('MyWalletDetails', {"wallet": this.state.wallet, "password": this.state.password, "ecl": this.state.ecl})
        return
        
      }

    }

  }

  render() {

    return(
      <View style={styles.container}>

        <View style={styles.txtTop}>
          <Text style={styles.txtInfo}>Please type a password to unlock wallet:</Text>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            autoFocus = {true}
            secureTextEntry={true}
            onChangeText={(password) => this.setState({password: password})}
            value={this.state.password}
            maxLength={32}
            placeholder='Enter password...'
            underlineColorAndroid='transparent'
            style={styles.inputPassword}
          />
        </View>

        <View style={styles.spacing}>
        </View>

        <View style={styles.btnConfirmContainer}>
          <TouchableOpacity
            style={styles.btnConfirm}
            onPress={this.decrypt}>
            <Text style={styles.btnConfirmText}>OPEN WALLET</Text>
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
    paddingTop: 36,
    paddingBottom: 36,
    paddingRight: 24,
    paddingLeft: 24,
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
    padding: 24,
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
