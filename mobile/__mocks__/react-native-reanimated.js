/**
 * Reanimated under Jest.
 *
 * The library's own `mock.js` re-imports the real index, which loads the native module
 * and throws "Cannot read properties of undefined (reading 'loadUnpackers')" -- so the
 * shipped mock cannot be used here. Without one, any screen that gains an entering
 * animation fails its own test the moment it imports the library, which turns "add a
 * fade to Home" into "Home has no tests".
 *
 * This renders the animated views as plain ones and makes every animation a no-op. The
 * builders are chainable because the app calls `.duration(600).delay(120)` on them.
 */
const React = require('react')
const { View, Text, ScrollView, Image } = require('react-native')

/** `FadeInDown.duration(600).delay(60)` — every method returns the builder. */
const builder = () => {
  const self = {}
  const chain = () => self
  for (const method of ['duration', 'delay', 'springify', 'damping', 'stiffness', 'withInitialValues', 'randomDelay', 'reduceMotion', 'easing', 'build']) {
    self[method] = chain
  }
  return self
}

const entering = new Proxy({}, { get: () => builder() })

const Animated = {
  View,
  Text,
  ScrollView,
  Image,
  createAnimatedComponent: (Component) => Component,
}

module.exports = {
  __esModule: true,
  default: Animated,
  ...entering,
  FadeIn: builder(),
  FadeInDown: builder(),
  FadeInLeft: builder(),
  FadeInRight: builder(),
  FadeInUp: builder(),
  FadeOut: builder(),
  ZoomIn: builder(),
  SlideInRight: builder(),
  Layout: builder(),
  Easing: new Proxy({}, { get: () => () => 0 }),
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  useSharedValue: (initial) => ({ value: initial }),
  useAnimatedStyle: (factory) => {
    try {
      return factory()
    } catch {
      return {}
    }
  },
  useAnimatedProps: (factory) => {
    try {
      return factory()
    } catch {
      return {}
    }
  },
  withTiming: (toValue) => toValue,
  withSpring: (toValue) => toValue,
  withDelay: (_delay, value) => value,
  withSequence: (...values) => values[values.length - 1],
  runOnJS: (fn) => fn,
  interpolate: (value) => value,
  cancelAnimation: () => {},
}
