/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Animated,
  AppRegistry,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View
} from 'react-native';

const round = (x, base) => {
  let sign = 1;
  if (x < 0) {
    x = Math.abs(x);
    sign = -1;
  }
  const mod = x % base;
  const lower = x - mod;
  const upper = lower + base;
  if (x - lower < upper - x) {
    return lower * sign;
  } else {
    return upper * sign;
  }
}

const range = (start, end, interval=1) => {
    let ret = [];
    for (let i = start; i < end; i += interval) {
        ret.push(i);
    }
    return ret;
}

class InfinitePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentVal: 100,
      interval: 1,
      bufferSize: 50,
    };

    this.config = {
      width: 360,
      height: 400,
      itemsToShow: 5,
    };
    this.config.itemHeight = this.config.height / this.config.itemsToShow;
    this._panY = new Animated.Value(
        -(this.state.currentVal - parseInt(this.config.itemsToShow / 2)) * this.config.itemHeight);
  }

  posToVal(pos) {
    const val = parseInt(-pos / this.config.itemHeight + parseInt(this.config.itemsToShow / 2));
    console.log('posToVal', pos, val);
    return val;
  }

  setCurrentVal() {
    const val = this.posToVal(this._panY._value + this._panY._offset);
    this.setState({
      currentVal: val
    });
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!

        this._panY.flattenOffset();
        // gestureState.d{x,y} will be set to zero now
        this._panY.setOffset(this._panY._value);
        this._panY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, {dy: this._panY}]),
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded

        const spring = () => {
          const currVal = this._panY._value + this._panY._offset;
          const target = round(currVal, this.config.itemHeight);
          Animated.spring(this._panY, {
            toValue: target - this._panY._offset
          }).start(this.setCurrentVal.bind(this));
        }

        let velocity = 0;
        if (gestureState.vy < 0.5 && gestureState.vy > -0.5) {
          spring();
          return;
        }
        if (gestureState.vy > 0) {
          velocity = 1;
        } else if (gestureState.vy < 0) {
          velocity = -1;
        }

        const currVal = this._panY._value + this._panY._offset;
        const target = round(currVal + gestureState.vy * 300, this.config.itemHeight);
        Animated.timing(this._panY, {
            toValue: target - this._panY._offset,
          easing: Easing.out(Easing.poly(5)),
          duration: 750,
            }).start(this.setCurrentVal.bind(this));
        const targetVal = this.posToVal(target);
        let newBufferSize;
        if (this.state.currentVal + this.state.bufferSize < targetVal) {
          newBufferSize = (targetVal - this.state.currentVal) * 2
        }
        if (this.state.currentVal - this.state.bufferSize > targetVal) {
          newBufferSize = (this.state.currentVal - targetVal) * 2;
        }
        if (newBufferSize) {
          console.log('new buffer size', newBufferSize);
          this.setState({
            bufferSize: newBufferSize,
          });
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    });
  }

  render() {
    return (
      <View style={{
        height: this.config.height,
        width: this.config.width,
        borderWidth: 1,
        borderColor: 'gray',
        overflow: 'hidden',
      }} {...this._panResponder.panHandlers}>
        <Animated.View style={{
          position: 'absolute',
          top: this._panY,
        }}>
            { range(this.state.currentVal - this.state.bufferSize,
              this.state.currentVal + this.state.bufferSize,
              this.state.interval).map(v => (
                <View key={v} style={{
                  flex: 1,
                  flexDirection: 'row',
                  height: this.config.itemHeight,
                  alignItems: 'center',
                  borderTopWidth: 1,
                  borderColor: '#cccccc',
                  position: 'absolute',
                  backgroundColor: 'red',
                  top: v * this.config.itemHeight,
                  width: this.config.width,

                }}>
                  <Text>{v}</Text>
                </View>
             ))
            }
        </Animated.View>
      </View>
    );
  }
}

export default class demo extends Component {
  render() {
    return (
        <View style={ styles.container }>
          <InfinitePicker/>
        </View>
        )
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

AppRegistry.registerComponent('demo', () => demo);
