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
import Loader from './Loader';
import store from 'react-native-simple-store';
import {generateWallet, findAddresses} from '../utils/Helpers';

export default class SetPasswordScreen extends React.Component {

  constructor(props) {

    super(props)

    this.createInProcess = false
    this.state = {
      loading: false,
      password: '',
      confirmPassword: '',
      type: this.props.navigation.getParam('type', ''),
      words: this.props.navigation.getParam('words', ''),
      walletName: this.props.navigation.getParam('walletName', '')
    }

  }

  componentWillUnmount() { }

  componentDidMount() { }

  // Align title image to center on Android
  static navigationOptions = {
    headerRight: Platform.OS === 'android' ? <View /> : ''
  }

  onSave = async() => {

    if (!this.createInProcess) {
      
      this.createInProcess = true

      if(this.state.password != this.state.confirmPassword) {

        Alert.alert(
          'Set Password',
          'Your passwords do not match!',
          [
            {text: 'OK'},
          ],
          { cancelable: false }
        )
        this.createInProcess = false

      } else if(this.state.password.length < 4) {

        Alert.alert(
          'Set Password',
          'Your password must contain a minimum of 4 characters.',
          [
            {text: 'OK'},
          ],
          { cancelable: false }
        )
        this.createInProcess = false

      } else {

        this.setState({"loading": true})
        let count = await store.get("walletsCount")

        store.save('walletsCount', count == null ? 1 : count+1)

        var wallet = await generateWallet(this.state.words, this.state.walletName, count == null ? 1 : count+1, this.state.password);
        await store.push("wallets", wallet);

        if (this.state.type == "import") {
          var promises = [];
          console.log("importing...");
          promises.push(findAddresses(wallet, this.state.password, global.ecl, 0));
          promises.push(findAddresses(wallet, this.state.password, global.ecl, 1));
          await Promise.all(promises);
        }

        this.setState({"loading": false})
        this.props.navigation.replace('MyWallets')
        
      }

    }

  }

  

  render() {

    return(
      <View style={styles.container}>
        {this.state.loading && 
          <Loader loading={true} />
        }
        <View style={styles.txtTop}>
          <Text style={styles.txtInfo}>Please set a password:</Text>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            autoFocus = {true}
            secureTextEntry={true}
            onChangeText={(password) => this.setState({password: password})}
            value={this.state.password}
            maxLength={32}
            placeholder='Enter password'
            underlineColorAndroid='transparent'
            style={styles.inputPassword}
          />
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            secureTextEntry={true}
            maxLength={32}
            onChangeText={(password) => this.setState({confirmPassword: password})}
            placeholder='Confirm password'
            underlineColorAndroid='transparent'
            style={styles.inputPassword}
          />
        </View>

        <View style={styles.spacing}>
        </View>

        <View>
          <Text style={styles.txtInfo}>Keep your password secure.</Text>
        </View>

        <View style={styles.btnConfirmContainer}>
          <TouchableOpacity
            style={styles.btnConfirm}
            onPress={() => this.onSave()}>
            <Text style={styles.btnConfirmText}>SAVE PASSWORD</Text>
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
