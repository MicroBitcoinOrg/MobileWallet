import React from 'react'
import {
  Image,
  StyleSheet,
  View,
} from 'react-native'

export default class Header extends React.Component {
  render() {
    return (
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logoTitle}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoTitle: {
    width: 300,
    height: 32,
    resizeMode: 'contain',
  },
})
