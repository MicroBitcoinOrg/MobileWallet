import React from 'react'
import {
  Platform,
  Alert,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Text,
  View
} from 'react-native'

import store from 'react-native-simple-store'
import { generateWallet, generateMnemonic } from '../utils/Wallets'
/**
 * CreateWalletScreen
 *
 * - generate mnemonic phrase (18 words)
 * - confirm will ask to "Set a password"
 */
export default class CreateWalletScreen extends React.Component {
  constructor(props) {

    super(props)

    this.createInProcess = false
    this.state = {
      words: '',
      walletName: ''
    }

  }

  // Align title image to center on Android
  static navigationOptions = {
    headerRight: Platform.OS === 'android' ? <View /> : ''
  }

  componentDidMount() {
    this.setState({ words: generateMnemonic() })
  }

  onConfirm = () => {

    if (!this.createInProcess) {
      
      this.createInProcess = true

      if(this.state.walletName == '') {

        Alert.alert('You must type wallet name!')
        this.createInProcess = false

      } else if(this.state.walletName.length < 4) {

        Alert.alert('Wallet name must be longer than 3 characters!')
        this.createInProcess = false

      } else {

        this.props.navigation.navigate('SetPassword', {"words": this.state.words, "walletName": this.state.walletName})

      }

    }

  }

  render() {
    const { words } = this.state;
    return(
      <View style={styles.container}>

        <View style={styles.txtTop}>
          <Text style={styles.txtInfo}>Please carefully write down this phrase:</Text>
        </View>

        <View style={styles.wordsContainer}>
          <Text selectable style={styles.words}>
            {words}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput style={styles.inputPhrase}
            placeholder = {"Type your wallet name"}
            onChangeText={(text) => this.setState({walletName: text})}
            editable = {true}
            underlineColorAndroid='transparent'
            maxLength = {35}
          />
        </View>

        <View>
          <Text style={styles.txtInfo}>Keep your backup phrase secure.</Text>
        </View>

        <View style={styles.btnConfirmContainer}>
          <TouchableOpacity style={styles.btnConfirm} onPress={this.onConfirm}>
            <Text style={styles.btnConfirmText}>I HAVE SECURED IT</Text>
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
    marginBottom: 16
  },
  txtInfo: {
    fontSize: 14,
    color: '#505659'
  },
  wordsContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.33,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginTop: 5,
    marginBottom: 5,
    padding: 24,
    borderRadius: 16,
    minWidth: 256,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.33,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  inputPhrase: {
    flex: 1,
    minWidth: 256,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 32,
    color: '#000672',
  },
  words: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 32,
    color: '#000672',
  },
  word: {
    marginRight: 4,
    marginLeft: 4,
    color: '#000672',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacing: {
    flex: 1
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