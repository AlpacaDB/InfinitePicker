/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Animated,
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';
import InfinitePicker from './picker';

const range = (start, end, interval=1) => {
  let ret = [];
  for (let i = start; i < end; i += interval) {
    ret.push(i);
  }
  return ret;
};

const unsignedMod = (x, y) => {
  const z = x % y;
  if (z < 0) {
    return z + y;
  }
  return z;
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      current: 0,
    };

    this._pickerPanels = 50;

    this.viewportAnim = range(0, this._pickerPanels).map(idx => (
      new Animated.Value(0)
    ));
  }

  onChange(slot, visibles) {
    this.setState({
      current: slot,
    });
    for (let item of visibles) {
      this.viewportAnim[unsignedMod(item.slot, this._pickerPanels)].setValue(item.viewportPos);
    }
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
          <Animated.Text style={{
            opacity: this.viewportAnim[unsignedMod(slot, this._pickerPanels)].interpolate({
              inputRange: [-3, 0, 3],
              outputRange: [0, 1, 0],
            }),
          }}>Slot = {slot}</Animated.Text>
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
