"use client";
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector2 } from 'three';
import { windDirection, windStrength, advanceWind } from '../../lib/wind-field.mjs';

export default function useWindField(animate, weather) {
  const field = useMemo(() => ({
    uWindTime: { value: 0 },
    uWindStrength: { value: windStrength(weather?.wind) },
    uWindDirection: { value: new Vector2(...windDirection(weather?.windDirection)) },
  }), []);
  const state = useRef({ time: 0, strength: field.uWindStrength.value,
    angle: Math.atan2(field.uWindDirection.value.x, field.uWindDirection.value.y) });
  useFrame((_, delta) => {
    // Pause freezes phase and weather transitions; resume cannot fast-forward.
    advanceWind(state.current, delta, weather?.wind, weather?.windDirection,
      animate && !document.hidden);
    field.uWindTime.value = state.current.time;
    field.uWindStrength.value = state.current.strength;
    field.uWindDirection.value.set(Math.sin(state.current.angle), Math.cos(state.current.angle));
  }, -1);
  return field;
}
