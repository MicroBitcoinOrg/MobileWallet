import React from 'react'
import {
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  Dimensions,
  Alert,
} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import NavbarButton from './NavbarButton'
import store from 'react-native-simple-store'

export default class WalletSettingsScreen extends React.Component {

  constructor(props) {

    super(props)

    this.isCancelled = false
    this.state = {

      wallet: this.props.navigation.getParam('wallet', null),
      password: this.props.navigation.getParam('password', null)

    }

  }

  componentWillUnmount() {

      this.isCancelled = true
  }
 
  removeWallet = () => {

    Alert.alert(
      "Remove wallet", "Are you sure?",
      [
          {text: 'No'},
          {text: 'Yes', onPress: () => {

            store.get('wallets').then((res) => {
      
              for (var i = 0; i < res.length; i++) {
                
                if(res[i].id == this.state.wallet.id) {

                  res.splice(i, 1)
                  break

                }

              }

              store.save('wallets', res)
              this.props.navigation.navigate('MyWallets')

            })

          }}
        ],
        { cancelable: false })

  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView>
          <TouchableOpacity onPress={() => this.removeWallet()}>
            <SettingsItem item={{'icon':'trash', 'left': 'Remove wallet', 'right': ''}} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

class SettingsItem extends React.Component {
  render() {
    const { item } = this.props
    return(
      <View style={styles.itemContainer}>
        <Icon name={item.icon} size={32} color="#cccccc" />
        <View style={styles.itemLeftContainer}>
          <Text style={styles.itemLeft}>{item.left}</Text>
        </View>
        <View style={styles.itemRightContainer}>
          <Text style={styles.itemRight}>{item.right}</Text>
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  itemLeftContainer: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
  },
  itemLeft: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000672',
  },
  itemRightContainer: {
    flexDirection: 'column',
  },
  itemRight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000672',
  }
})