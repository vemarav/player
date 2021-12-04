import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, Linking, StatusBar, Dimensions, ViewStyle} from 'react-native';
import Video from 'react-native-video';
import {GestureHandlerRootView, GestureDetector, Gesture} from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  useValue,
} from 'react-native-reanimated';
import SystemSetting from 'react-native-system-setting';

import ReText from './retext';
import Colors from './colors';
import Icons from '../assets/icons';
import {getTime, getValue} from './utils';

const AnimatedVideo = Animated.createAnimatedComponent(Video);
const AnimatedSlider = Animated.createAnimatedComponent(Slider);

enum Swipe {
  HORIZONTAL = 2,
  VERTICAL = 4,
}

const Player = () => {
  const videoRef: React.Ref<Video> = useRef(null);
  const before = useSharedValue({
    scale: 1,
    translate: {x: 0, y: 0},
    volume: 0,
    brightness: 0,
  });

  const scale = useSharedValue(1);
  const zoomText = useDerivedValue(() => `${Math.round(scale.value * 100)}%`);

  const volume = useSharedValue(0);
  const volumeText = useDerivedValue(() => `${Math.round(volume.value * 30)}`);

  const brightness = useSharedValue(0);
  const brightnessText = useDerivedValue(() => `${Math.round(brightness.value * 30)}`);

  const progress: Animated.Value<number> = useValue(0);

  const [isZoom, setZoom] = useState(false);
  const [swipe, setSwipe] = useState<Swipe>();
  const [isPaused, setPaused] = useState(false);
  const [uri, setUri] = React.useState('No Uri');
  const [isVolume, setIsVolume] = useState(false);
  const [info, setInfo] = useState({duration: 0});
  const [isControls, setControls] = useState(false);
  const [isBrightness, setIsBrightness] = useState(false);

  const [dimensions, setDimensions] = useState(Dimensions.get('screen'));

  const videoStyles = useAnimatedStyle<Animated.AnimatedStyleProp<ViewStyle>>(() => {
    return {
      transform: [{scale: scale.value}],
    };
  });

  useEffect(() => {
    const linkingSub = Linking.addEventListener('url', ({url}) => setUri(url));

    const dimensionSub = Dimensions.addEventListener('change', ({screen}) => {
      setDimensions(screen);
    });

    (async () => {
      volume.value = await SystemSetting.getVolume('music');
      brightness.value = await SystemSetting.getAppBrightness();
    })();

    return () => {
      dimensionSub?.remove();
      linkingSub?.remove();
    };
  });

  const tap = Gesture.Tap()
    .numberOfTaps(1)
    .onStart(() => setControls(!isControls));

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => setPaused(!isPaused));

  const pan = Gesture.Pan()
    .activeOffsetX([0, 20])
    .activeOffsetY([0, 20])
    .maxPointers(1)
    .onBegin(({x, y}) => {
      console.log('begin **************************************');
      setSwipe(undefined);
      setIsVolume(false);
      setIsBrightness(false);
      before.value.translate = {x, y};
      before.value.volume = volume.value;
      before.value.brightness = brightness.value;
    })
    .onUpdate(({x, y}) => {
      switch (swipe) {
        case Swipe.HORIZONTAL: {
          const dx = x - before.value.translate.x;
          const change = dx / dimensions.width;
          console.log({change});
        }
        case Swipe.VERTICAL: {
          const dy = before.value.translate.y - y;
          const change = (dy / dimensions.height) * 4;
          if (isVolume) {
            const _volume = before.value.volume + change;
            volume.value = _volume > 1 ? 1 : _volume < 0 ? 0 : _volume;
            SystemSetting.setVolume(volume.value);
          } else if (isBrightness) {
            const _brightness = before.value.brightness + change;
            brightness.value = _brightness > 1 ? 1 : _brightness < 0 ? 0 : _brightness;
            SystemSetting.setAppBrightness(brightness.value);
          }
          break;
        }
        default: {
          const dx = Math.abs(before.value.translate.x - x);
          const dy = Math.abs(before.value.translate.y - y);
          if (dx > 30 && dy < 30) setSwipe(Swipe.HORIZONTAL);
          if (dy > 30 && dx < 30) {
            setSwipe(Swipe.VERTICAL);
            x > dimensions.width / 2 ? setIsVolume(true) : setIsBrightness(true);
          }
        }
      }
    })
    .onEnd(() => {
      setSwipe(undefined);
      setIsVolume(false);
      setIsBrightness(false);
      console.log('end ==================================');
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => (before.value.scale = getValue(scale)))
    .onUpdate(event => {
      if (!isZoom) setZoom(true);
      const _scale = before.value.scale + event.scale - 1;
      if (_scale > 1.5) scale.value = 1.5;
      else if (_scale < 0.5) scale.value = 0.5;
      else scale.value = _scale;
    })
    .onEnd(() => setZoom(false));

  const updateSliderProgress = ({currentTime}: {currentTime: number}) => {
    progress.setValue(currentTime / info.duration);
  };

  const onSliding = (value: number) => {
    progress.setValue(value);
    videoRef.current?.seek(value * info.duration, 0);
  };

  const onSlidingStart = () => setPaused(true);
  const onSlidingEnd = () => setPaused(false);

  const gestures = Gesture.Race(doubleTap, pan, pinch, tap);
  const size = {width: dimensions.width, height: dimensions.height};

  const Status = () => {
    switch (true) {
      case isZoom:
        return (
          <View style={styles.iconContainer}>
            <ReText text={zoomText} style={styles.text} />
          </View>
        );
      case isVolume:
        return (
          <View style={styles.iconContainer}>
            <Icons.VolumeUp {...styles.icon} />
            <ReText text={volumeText} style={styles.text} />
          </View>
        );
      case isBrightness:
        return (
          <View style={styles.iconContainer}>
            <Icons.Brightness {...styles.icon} />
            <ReText text={brightnessText} style={styles.text} />
          </View>
        );
      case isPaused && isControls:
        return (
          <View style={styles.iconContainer}>
            <Icons.Pause {...styles.icon} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar hidden />
      <GestureHandlerRootView>
        <GestureDetector gesture={gestures}>
          <View style={[styles.overlay]}>
            <AnimatedVideo
              repeat
              fullscreen
              ref={videoRef}
              paused={isPaused}
              onLoad={setInfo}
              resizeMode={'contain'}
              onProgress={updateSliderProgress}
              source={require('../assets/video.mp4')}
              style={[styles.video, size, videoStyles]}
            />
            <View style={[styles.iconHolder, size]}>
              <Status />
            </View>
          </View>
        </GestureDetector>
        <View style={styles.sliderContainer}>
          {isControls ? (
            <AnimatedSlider
              value={progress}
              style={styles.slider}
              thumbTintColor={Colors.white}
              minimumTrackTintColor={Colors.white}
              maximumTrackTintColor={Colors.white}
              onSlidingStart={onSlidingStart}
              onSlidingComplete={onSlidingEnd}
              onValueChange={onSliding}
            />
          ) : null}
        </View>
      </GestureHandlerRootView>
    </>
  );
};

export default Player;

const styles = StyleSheet.create({
  video: {
    zIndex: 0,
    width: Dimensions.get('screen').width,
    height: Dimensions.get('screen').height,
    backgroundColor: Colors.black,
    transform: [{scale: 1}],
  },
  overlay: {
    backgroundColor: Colors.black,
  },
  sliderContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingTop: 10,
    paddingBottom: 60,
    // backgroundColor: 'red',
  },
  slider: {
    height: 30,
  },
  iconHolder: {
    position: 'absolute',
    top: 0,
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 150,
    height: 100,
    borderRadius: 10,
    backgroundColor: Colors.blackAlpha(60),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  icon: {
    width: 48,
    height: 48,
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 5,
  },
});
