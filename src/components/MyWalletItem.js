import React from 'react'
import {
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import Logo from '../assets/logo_bare.png'

import { getAddressBalance } from '../utils/ElectrumAPI'
import { decryptData } from '../utils/Wallets'

export default class MyWalletItem extends React.Component {
  constructor(props) {

    super(props)

    this.state = {
      balance: 0
    }

    var promises = []
    var balance = 0

    for (var i = 0; i < props.wallet.addresses.length; i++) {

      getAddressBalance(props.wallet.addresses[i].address).then((res) => {

        if(res.error == null) {

          balance += res.result.confirmed
          this.setState({balance: balance})

        }
        

      })

    }
    
  }

  render() {
    
    const { wallet } = this.props
    const { balance } = this.state

    return(
      <View style={styles.listItem}>
        <Image source={Logo} style={styles.listItemLogo} />
        <View style={styles.listItemTextContainer}>
          <Text style={styles.listItemTextName}>{`${wallet.title}`}</Text>
          <Text style={styles.listItemTextBalance}>{`${balance/10000} MBC`}</Text>
        </View>
        {/*<Icon name='dots-three-vertical' size={20} color='#000672' style={styles.listItemIcon} />*/}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    marginBottom: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.1 },
    shadowOpacity: 0.33,
    shadowRadius: 0,
    elevation: 1,
    zIndex: 10,
  },
  listItemLogo: {
    resizeMode: 'contain',
    height: 48,
    width: 48,
    marginRight: 16,
  },
  listItemTextContainer: {
    flex: 3,
    flexDirection: 'column',
  },
  listItemTextName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000672',
    marginBottom: 1,
  },
  listItemTextBalance: {
    fontSize: 16,
    color: '#000672',
    opacity: 0.66,
  },
})
