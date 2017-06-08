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
};

const range = (start, end, interval=1) => {
    let ret = [];
    for (let i = start; i < end; i += interval) {
      ret.push(i);
    }
    return ret;
  };

class InfinitePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentItem: 0,
      interval: 1,
      bufferSize: 50,
    };

    this.config = {
      width: 360,
      height: 400,
      itemsToShow: 5,
    };
    this.config.itemHeight = this.config.height / this.config.itemsToShow;
    this._panY = new Animated.Value(this.centerItemToOffset(this.state.currentItem));

    const getIdx = (x, y) => {
      const z = x % y;
      if (z < 0) {
        return z + y;
      }
      return z;
    };

    const updatePanels = offset => {
      const item = this.offsetToCenterItem(offset);
      const halfPage = parseInt(this.state.bufferSize / 2);
      range(item - halfPage, item + halfPage).map(eachItem => {
        const idx = getIdx(eachItem, this.state.bufferSize);
        const pos = this.itemToPos(eachItem);
        if (this._itemPos[idx]._value != pos) {
          this._itemPos[idx].setValue(pos);
        }
      });
    };
    this._itemPos = range(0, this.state.bufferSize).map(idx => (
      new Animated.Value(0)
    ));
    updatePanels(this._panY._value);

    this._panY.addListener(ev => updatePanels(ev.value));
  }

  centerItemToOffset(item) {
    return -1 * this.itemToPos(item - parseInt(this.config.itemsToShow / 2));
  }

  itemToPos(item) {
    const pos = item * this.config.itemHeight;
    // console.log('itemToPos', item, pos);
    return pos;
  }

  offsetToCenterItem(pos) {
    const item = parseInt(-pos / this.config.itemHeight + parseInt(this.config.itemsToShow / 2));
    return item;
  }

  //setCurrentVal() {
  //  const val = this.posToVal(this._panY._value + this._panY._offset);
  //  this.setState({
  //    currentVal: val
  //  });
  //}

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
      onPanResponderMove: Animated.event([null, { dy: this._panY }]),
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded

        const spring = () => {
          const currPos = this._panY._value + this._panY._offset;
          const target = round(currPos, this.config.itemHeight);
          Animated.spring(this._panY, {
            toValue: target - this._panY._offset,
          }).start(/*this.setCurrentVal.bind(this)*/);
        };

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

        const currPos = this._panY._value + this._panY._offset;
        const target = round(currPos + gestureState.vy * 300, this.config.itemHeight);
        Animated.timing(this._panY, {
            toValue: target - this._panY._offset,
            easing: Easing.out(Easing.poly(5)),
            duration: 750,
          }).start(/*this.setCurrentVal.bind(this)*/);
        //const targetVal = this.posToItem(target);
        //let newBufferSize;
        //if (this.state.currentItem + this.state.bufferSize < targetVal) {
        //  newBufferSize = (targetVal - this.state.currentVal) * 2
        //}
        //if (this.state.currentVal - this.state.bufferSize > targetVal) {
        //  newBufferSize = (this.state.currentVal - targetVal) * 2;
        //}
        //if (newBufferSize) {
        //  console.log('new buffer size', newBufferSize);
        //  this.setState({
        //    bufferSize: newBufferSize,
        //  });
        //}
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
            { range(0, this.state.bufferSize).map(idx => (
                <Animated.View key={idx} style={{
                  flex: 1,
                  flexDirection: 'row',
                  height: this.config.itemHeight,
                  alignItems: 'center',
                  borderTopWidth: 1,
                  borderColor: '#cccccc',
                  position: 'absolute',
                  backgroundColor: 'red',
                  top: this._itemPos[idx],
                  width: this.config.width,

                }}>
                  <Text>{idx}</Text>
                </Animated.View>
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

AppRegistry.registerComponent('demo', () => demo);
