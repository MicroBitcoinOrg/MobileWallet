import React from 'react'
import {
  Button,
  Alert,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import QRCode from 'react-native-qrcode'
import NavbarButton from './NavbarButton'
import Loader from './Loader'

export default class SendScreen extends React.Component {

  constructor(props) {

    super(props)
    this.walletUtils = this.props.navigation.getParam('walletUtils', null);
    this.state = {
      loading: false,
      rAddress: '',
      rAmount: '',
      rFees: '',
      smartFee: '0.000',
      wallet: this.walletUtils.wallet
    }

    const willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      payload => {

        this.setState({rAddress: this.props.navigation.getParam('scannedAddress', '')})
        this.walletUtils.estimateFee().then((res) => {
          this.setState({smartFee: res})
        })

      }
    )
  }

  onConfirm = () => {

    if (this.state.rAddress == '') {

      Alert.alert('Send Transaction', "The address field is empty")
      return

    } else if (this.state.rAmount == '') {

      Alert.alert('Send Transaction', "The amount field is empty")
      return

    } else if (this.state.rFees == '') {

      Alert.alert('Send Transaction', "The fees field is empty")
      return

    }

    Alert.alert(
      'Send Transaction',
      `Please confirm the transaction.\n\nRecipient:\n${this.state.rAddress}\n\nAmount: ${this.state.rAmount}\n\nFee: ${this.state.rFees}`,
      [
        {text: 'Back', onPress: () => false},
        {text: 'Send', onPress: () => {

          this.sendTransaction()

        }},
      ],
      { cancelable: false }
    )

  }

  sendTransaction = async() => {

    this.setState({loading: true})
    let tx = await this.walletUtils.sendTransation(this.state.rAddress.split(' ').join(''), this.state.rAmount, this.state.rFees)
    console.log("TX:", tx)

    this.setState({loading: false})

    setTimeout(() => {

      if(typeof tx  === 'string') {

        Alert.alert('Send Transaction', 'Success!')

      } else {

        Alert.alert('Send Transaction', 'Error sending transaction!')
        
      }

      this.props.navigation.navigate("MyWalletDetails")

    }, 1000);

  }

  static navigationOptions = () => {

    return {
      headerRight: (
        <View></View>
      )
    }

  }

  processAddress = (address) => {

    if(address.length == 34 && !address.includes(" ")) {

      const first = 5

      address = address.slice(0, first)
        + " " + address.slice(first, first+4)
        + " " + address.slice(first+4, first+8)
        + " " + address.slice(first+8, first+12)
        + " " + address.slice(first+12, first+16)
        + " " + address.slice(first+16, first+20)
        + " " + address.slice(first+20, first+24)
        + " " + address.slice(first+24, address.length)

        this.setState({rAddress: address})

    } else if(address.includes(" ")) {

      this.setState({rAddress: address.split(' ').join('')})

    } else {

      this.setState({rAddress: address})

    }

  }

  render() {
    return(
      <View style={styles.container}>
      {this.state.loading && 
        <Loader loading={true} />
      }
      <ScrollView>
        <View style={styles.innerContainer}>
          <View style={styles.txtTop}>
            <Text style={styles.txtInfo}>Verify recipient and enter payment details:</Text>
          </View>

          <View style={styles.sendContainer}>
              <Icon name="minus" size={36} style={{textAlign: 'center'}} color="#19e0d6" />
              <Text style={styles.inputLabel}>Recipient address (MBC)</Text>
              <TextInput
                onChangeText={(rAddress) => this.processAddress(rAddress)}
                value={this.state.rAddress}
                multiline = {true}
                numberOfLines = {2}
                placeholder='BkQD9 G6Kw 1Pnq js1N vx4b eyeZ Lt1D jSsyY'
                style={styles.inputText}
              />
              <TouchableOpacity onPress={() => this.props.navigation.navigate('Scan')}>
                <View style={{ alignItems: 'center'}}>
                  <QRCode
                  value={"MBC"}
                  size={40}
                  bgColor='#000672'
                  fgColor='white'/>
                </View>
              </TouchableOpacity>

              <Icon name="minus" size={36} style={{textAlign: 'center'}} color="#19e0d6" />
              <Text style={styles.inputLabel}>Amount (MBC)</Text>
              <TextInput
                onChangeText={(rAmount) => this.setState({rAmount})}
                value={this.state.rAmount}
                placeholder='0.1234'
                style={styles.inputText}
              />

              <Icon name="minus" size={36} style={{textAlign: 'center'}} color="#19e0d6" />
              <Text style={styles.inputLabel}>Fees (MBC)</Text>
              <TextInput
                onChangeText={(rFees) => this.setState({rFees})}
                value={this.state.rFees}
                placeholder='0.001'
                defaultValue='0.001'
                style={styles.inputText}
              />
              <TouchableOpacity onPress={() => this.setState({rFees: this.state.smartFee})}>
                <Text style={styles.estimateFeeLabel}>Estimate fee <Text style={{fontWeight: '800'}}>{this.state.smartFee}</Text></Text>
              </TouchableOpacity>
          </View>

          <View style={styles.btnConfirmContainer}>
            <TouchableOpacity style={styles.btnConfirm} onPress={this.onConfirm}>
              <Text style={styles.btnConfirmText}>SEND MICROBITCOIN</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
        <View style={styles.navbar}>
          <TouchableOpacity
            onPress={() => this.props.navigation.goBack()} style={styles.btnBack}>
            <NavbarButton label='Back' icon='back' />
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
    justifyContent: 'space-between',
    backgroundColor: '#f2f2f2',
  },
  innerContainer: {
    flex: 1,
    padding: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  },
  estimateFeeLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: 'green',
    marginBottom: 10
  },
  inputText: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color:'#000672',
  },
  txtTop: {
    alignItems: 'center',
    marginBottom: 16,
  },
  txtInfo: {
    fontSize: 14,
    color: '#505659',
  },
  sendContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 24,
    paddingLeft: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.33,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10
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
    paddingTop: 32,
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
})