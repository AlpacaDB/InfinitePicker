import React, { Component } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
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
    return renderer(this.state.slot, this.props);
  }
}

/*
 * Terminology:
 *   panel: physical view component that rotates as scrolls
 *   slot: logical item number, increasing towards bottom in screen
 *   scrollTop: absolute vertical position (scroll down -> higher value)
 *
 *
 * props:
 *   style: outer container view style
 *   width: component width
 *   height: component height
 *   visiblePanels: (default 5) number of panels visible
 *   initialSlot: (default 0) initial slot value to be selected
 *   panelRenderer (slot, {width, height}) => {}: panel rendering function
 */
export default class InfinitePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bufferSize: 50,
    };

    this._panelHeight = props.height / props.visiblePanels;
    const slot = props.initialSlot || 0;
    this._panY = new Animated.Value(this.centerSlotToScrollTop(slot));

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

    const updatePanels = scrollTop => {
      const centerSlot = this.scrollTopToCenterSlot(scrollTop);
      const halfPage = parseInt(this.state.bufferSize / 2);
      range(centerSlot - halfPage, centerSlot + halfPage).map(eachSlot => {
        const idx = getIdx(eachSlot, this.state.bufferSize);
        const pos = this.slotToPos(eachSlot);
        if (this._panelPos[idx]._value != pos) {
          this._panelPos[idx].setValue(pos);
          this._panels[idx].setState({ slot: eachSlot });
        }
      });
      const callback = this.props.onValueChange;
      if (callback) {
        callback(centerSlot);
      }
    };
    updatePanels(this._panY._value);

    this._panY.addListener(ev => updatePanels(ev.value));
  }

  get selectedValue() {
    const slot = this.scrollTopToCenterSlot(this.scrollTop);
    return slot;
  }

  get scrollTop() {
    return this._panY._value + this._panY._offset;
  }

  centerSlotToScrollTop(slot) {
    return -1 * this.slotToPos(slot - parseInt(this.props.visiblePanels / 2));
  }

  scrollTopToCenterSlot(scrollTop) {
    const slot = parseInt(-scrollTop / this._panelHeight + parseInt(this.props.visiblePanels / 2));
    return slot;
  }

  slotToPos(slot) {
    const pos = slot * this._panelHeight;
    return pos;
  }

  posToSlot(pos) {
    const slot = pos / this._panelHeight;
    return slot;
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
      onPanResponderMove: Animated.event([null, { dy: this._panY }]),
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded

        const spring = () => {
          const currPos = this.scrollTop;
          const target = round(currPos, this._panelHeight);
          Animated.spring(this._panY, {
            toValue: target - this._panY._offset,
          }).start();
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

        const currPos = this.scrollTop;
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
                  position: 'absolute',
                  top: this._panelPos[idx],
                  width: this.props.width,

                }}>
                  <PickerPanel ref={e => {
                    this._panels[idx] = e;
                  }}
                  width={this.props.width}
                  height={this._panelHeight}
                  renderer={this.props.panelRenderer}/>
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
  visiblePanels: 5,
};
