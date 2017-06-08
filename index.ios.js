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

class PickerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      slot: null,
    };
  }

  render() {
    const renderer = this.props.renderer || ((slot) => (<Text>{slot}</Text>));
    return renderer(this.state.slot);
  }
}

class InfinitePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentItem: props.initialSlot || 0,
      bufferSize: 50,
    };

    this._panelHeight = props.height / props.panelsToShow;
    this._panY = new Animated.Value(this.centerItemToOffset(this.state.currentItem));

    this._panelPos = range(0, this.state.bufferSize).map(idx => (
      new Animated.Value(0)
    ));
    this._panels = new Array(this.bufferSize);
  }

  componentDidMount() {
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
        if (this._panelPos[idx]._value != pos) {
          this._panelPos[idx].setValue(pos);
          if (this._panels[idx]) {
            this._panels[idx].setState({ slot: eachItem });
          }
        }
      });
      const callback = this.props.onValueChange;
      if (callback) {
        callback(item);
      }
    };
    updatePanels(this._panY._value);

    this._panY.addListener(ev => updatePanels(ev.value));
  }

  get selectedValue() {
    const offset = this._panY._value + this._panY._offset;
    const item = this.offsetToCenterItem(offset);
    return item;
  }

  centerItemToOffset(item) {
    return -1 * this.itemToPos(item - parseInt(this.props.panelsToShow / 2));
  }

  itemToPos(item) {
    const pos = item * this._panelHeight;
    return pos;
  }

  posToItem(pos) {
    const item = pos / this._panelHeight;
    return item;
  }

  offsetToCenterItem(pos) {
    const item = parseInt(-pos / this._panelHeight + parseInt(this.props.panelsToShow / 2));
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
          const target = round(currPos, this._panelHeight);
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
        const vy = gestureState.vy;
        const target = round(currPos + vy * Math.abs(vy) * 300, this._panelHeight);
        Animated.timing(this._panY, {
            toValue: target - this._panY._offset,
            easing: Easing.out(Easing.poly(5)),
            duration: 750,
          }).start();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      // Returns whether this component should block native components from becoming the JS
      // responder. Returns true by default. Is currently only supported on android.
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    });
  }

  render() {
    return (
      <View style={[
        {
          height: this.props.height,
          width: this.props.width,
          overflow: 'hidden',
        },
        this.props.style || {},
      ]} {...this._panResponder.panHandlers}>
        <Animated.View style={{
          position: 'absolute',
          top: this._panY,
        }}>
            { range(0, this.state.bufferSize).map(idx => (
                <Animated.View key={idx} style={{
                  flex: 1,
                  flexDirection: 'row',
                  height: this._panelHeight,
                  alignItems: 'center',
                  borderTopWidth: 1,
                  borderColor: '#cccccc',
                  position: 'absolute',
                  backgroundColor: 'red',
                  top: this._panelPos[idx],
                  width: this.props.width,

                }}>
                  <PickerPanel ref={e => {
                    this._panels[idx] = e;
                  }} renderer={this.props.panelRenderer}/>
                </Animated.View>
             ))
            }
        </Animated.View>
      </View>
    );
  }
}

InfinitePicker.defaultProps = {
  width: 360,
  height: 400,
  panelsToShow: 5,
};

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

  render() {
    return (
        <View style={ styles.container }>
          <InfinitePicker
            style={{
              borderWidth: 1,
              borderColor: 'gray',
            }}
            height={300}
            panelsToShow={5}
            initialSlot={100}
            onValueChange={this.onChange.bind(this)}
            panelRenderer={(i) => (<Text>Item = {i}</Text>)}/>
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
