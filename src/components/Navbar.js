import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import NavbarButton from './NavbarButton';

export default class Navbar extends React.Component {
  render() {
    return(
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => this.props.navigation.navigate('WalletReceive')}
          style={this.props.navbarSelected === 'receive' ? styles.navbarIconButtonSelected : styles.navbarIconButton}>
          <NavbarButton label='Receive' icon='login' />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.props.navigation.navigate('MyWallets')}
          style={this.props.navbarSelected === 'myWallets' ? styles.navbarIconButtonSelected : styles.navbarIconButton}>
          <NavbarButton label='Wallets' icon='wallet' />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.props.navigation.navigate('WalletSend')}
          style={this.props.navbarSelected === 'send' ? styles.navbarIconButtonSelected : styles.navbarIconButton}>
          <NavbarButton label='Send' icon='log-out' />
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000672',
    height: 64,
  },
  navbarIconButton: {
    flex: 1,
    opacity: 0.66,
  },
  navbarIconButtonSelected: {
    flex: 1,
    opacity: 1.0,
  },
});
