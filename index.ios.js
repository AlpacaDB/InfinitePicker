/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';
import InfinitePicker from './picker';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      current: 0,
    };
  }

  onChange(val) {
    this.setState({
      current: val,
    });
  }

  renderPanel(slot, { width, height }) {
    return (
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          borderTopWidth: 1,
          borderColor: '#cccccc',
          backgroundColor: '#ffcccc',
        }}>
          <Text>Slot = {slot}</Text>
        </View>
        );
  }

  render() {
    return (
        <View style={ styles.container }>
          <InfinitePicker
            style={{
              borderWidth: 1,
              borderColor: 'gray',
            }}
            height={300}
            visiblePanels={5}
            initialSlot={100}
            onValueChange={this.onChange.bind(this)}
            panelRenderer={this.renderPanel.bind(this)}/>
          <Text>SelectedValue = {this.state.current}</Text>
        </View>
        );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('demo', () => App);
