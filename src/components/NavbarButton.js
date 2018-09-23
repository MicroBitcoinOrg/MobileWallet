import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

export default class NavbarButton extends React.Component {
  render() {
    const {icon, label} = this.props;
    return(
      <View style={styles.navbarIcons}>
        <Icon name={`${icon}`} size={28} color='#ffffff' />
        <Text style={styles.navbarIconText}>{`${label}`}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  navbarIcons: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navbarIcon: {
    alignItems: 'center'
  },
  navbarIconText: {
    fontSize: 12,
    color: '#ffffff',
  },
});
