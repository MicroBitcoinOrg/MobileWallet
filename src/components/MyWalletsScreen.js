import React from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import MyWalletItem from './MyWalletItem';
import NavbarButton from './NavbarButton';

import store from 'react-native-simple-store';



export default class MyWalletsScreen extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      wallets: []
    }

    const willFocusSubscription = this.props.navigation.addListener(
      'willFocus',
      payload => {

        store.get('wallets').then((res) => {

          if (res == null || res.length == 0) {

            store.save('wallets', [])
            this.props.navigation.replace('RestoreWallet');
            return

          }

          this.setState({
            wallets: res
          })

        })

      }
    )

  }

  static navigationOptions = {
    headerLeft: null,
    gesturesEnabled: false,
  }

  componentDidMount() {

    // store.delete('wallets')
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress)
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress)
  }

  openWallet = (wallet) => {

    if(wallet['password'] != '') {
      this.props.navigation.navigate('openPasswordWallet', {"wallet": wallet})
      return
    } else {
      this.props.navigation.navigate('MyWalletDetails', {"wallet": wallet})
      return
    }
    
  }

  handleBackPress = () => true

  render() {
    const { navigation } = this.props


    return(
      <View style={styles.container}>

        <View style={styles.labelContainer}>
          <View style={styles.label}>
            <Text style={styles.labelText}>MY <Text style={{fontWeight: 'bold'}}>{'wallets'.toUpperCase()}</Text></Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("RestoreWallet")}
              style={styles.labelAddButton}>
              <Icon name="circle-with-plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView>
          {
            this.state.wallets.map(wallet => (
              <TouchableOpacity
                activeOpacity={0.9}
                key={wallet.id}
                onPress={() => this.openWallet(wallet)}>
                <MyWalletItem wallet={wallet} />
              </TouchableOpacity>
            ))

          }
        </ScrollView>

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
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 36,
    paddingBottom: 36,
    paddingRight: 24,
    paddingLeft: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.33,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000672',
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 16,
    paddingRight: 32,
    paddingLeft: 32,
  },
  labelText: {
    paddingRight: 8,
    color: '#ffffff',
    fontSize: 20,
  },
})
