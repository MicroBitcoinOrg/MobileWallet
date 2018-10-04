import React from 'react'
import {
  Alert,
  Clipboard,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native'
import QRCode from 'react-native-qrcode'
import NavbarButton from './NavbarButton'
import store from 'react-native-simple-store'
import Loader from './Loader'
import helpers from '../utils/Helpers';

export default class ReceiveScreen extends React.Component {
  
  constructor(props) {

    super(props);
    this.walletUtils = this.props.navigation.getParam('walletUtils', null);
    this.state = {
      loading: false,
      wallet: this.walletUtils.wallet
    }
    
  }

  generateNewAddress = () => {
    this.setState({loading: true})
    store.get("wallets").then((res) => {

      let address = helpers.generateNextAddress(this.walletUtils.wallet, this.walletUtils.password, 0);
      this.walletUtils.wallet.addresses.external[address.address] = address.data;
      this.walletUtils.wallet.addresses.currentExternal = address.address;
      
      for (var i = 0; i < res.length; i++) {
        if(res[i].id == this.walletUtils.wallet.id) {
          res[i] = this.walletUtils.wallet;
          break;
        }
      }

      store.save('wallets', res);
      this.setState({wallet: this.walletUtils.wallet});
      this.setState({loading: false});

    });
  }

  static navigationOptions = () => {

    return {
      headerRight: (
        <View></View>
      )
    }

  }

  render() {

    const { wallet, loading } = this.state

    return(
      <View style={styles.container}>
        {this.state.loading && 
          <Loader loading={true} />
        }
        <ScrollView>
        <View style={styles.innerContainer}>
          <View style={styles.qrContainer}>
            <Text style={styles.txtTitle}>Receive</Text>
            <QRCode
              value={"microbitcoin:" + wallet.addresses.currentExternal}
              size={240}
              bgColor='#000672'
              fgColor='white'
            />
            <Text selectable style={styles.txtAddress}>{wallet.addresses.currentExternal}</Text>
          </View>
        </View>
        <View style={styles.spacing}>
          {
            Object.keys(wallet.addresses.external).map((address, i) => (
              <TouchableOpacity key={i}>
                <MyWalletAddress address={address} />
              </TouchableOpacity>
            ))
          }
        </View>
        </ScrollView>

        <View style={styles.navbar}>
          <TouchableOpacity
            onPress={this.generateNewAddress} style={styles.navbarIconButton}>
            <NavbarButton label='New address' icon='plus' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.props.navigation.goBack()} style={styles.btnBack}>
            <NavbarButton label='Back' icon='back' />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}

class MyWalletAddress extends React.Component {

  render() {
    const { address } = this.props
    return(
      <View style={styles.addressContainer}>
        <Text selectable style={styles.address}>{address}</Text>
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
    paddingTop: 36,
    paddingBottom: 36,
    paddingRight: 16,
    paddingLeft: 16,
    backgroundColor: '#000672',
    alignItems: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.1 },
    shadowOpacity: 0.33,
    shadowRadius: 0,
    elevation: 1,
    zIndex: 10,
  },
  address: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    color: '#000672',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.33,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  txtTitle: {
    marginBottom: 24,
    fontSize: 24,
    fontWeight: 'bold',
  },
  txtAddress: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navbarIconButton: {
    flex: 1,
    opacity: 0.66,
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
  spacing: {
    marginTop: 10
  }
})