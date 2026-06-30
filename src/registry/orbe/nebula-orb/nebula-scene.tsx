'use client';

import { useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { stateEnergy, type OrbState } from '../../lib/orb-state';

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAudio;
uniform float uDistort;
varying float vNoise;
varying vec3 vNormal;
varying vec3 vViewDir;

vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main(){
  vec3 n = normalize(normal);
  float noise = snoise(position * (1.1 + uAudio * 0.6) + uTime * 0.35);
  float displacement = noise * (uDistort + uAudio * 0.9);
  vec3 displaced = position + n * displacement * 0.35;
  vNoise = noise;
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * n);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorFrom;
uniform vec3 uColorTo;
uniform float uAudio;
varying float vNoise;
varying vec3 vNormal;
varying vec3 vViewDir;

void main(){
  float fres = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.0 + uAudio * 2.0);
  vec3 base = mix(uColorFrom, uColorTo, smoothstep(-1.0, 1.0, vNoise));
  vec3 col = base + fres * (0.6 + uAudio * 0.8);
  float alpha = 0.82 + fres * 0.18;
  gl_FragColor = vec4(col, alpha);
}
`;

interface SphereProps {
  state: OrbState;
  speed: number;
  colorFrom: string;
  colorTo: string;
  levelRef?: RefObject<number>;
}

const Sphere = ({ state, speed, colorFrom, colorTo, levelRef }: SphereProps) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const smoothed = useRef(0);
  const clock = useRef(0);
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uDistort: { value: 0.32 },
      uColorFrom: { value: new THREE.Color(colorFrom) },
      uColorTo: { value: new THREE.Color(colorTo) },
    }),
    [],
  );

  useFrame((_, delta) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    if (!reduced) clock.current += delta * speed;
    const live = levelRef?.current;
    const target = typeof live === 'number' && live >= 0 ? live : reduced ? 0 : stateEnergy(state, clock.current);
    smoothed.current += (target - smoothed.current) * 0.1;
    u.uTime.value = clock.current;
    u.uAudio.value = smoothed.current;
    u.uDistort.value = 0.32 + (state === 'thinking' ? 0.18 : 0);
    u.uColorFrom.value.set(state === 'error' ? '#fb7185' : colorFrom);
    u.uColorTo.value.set(state === 'error' ? '#f43f5e' : colorTo);
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1.2, 24]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

export interface NebulaSceneProps {
  state: OrbState;
  speed: number;
  colorFrom: string;
  colorTo: string;
  levelRef?: RefObject<number>;
}

export const NebulaScene = (props: NebulaSceneProps) => (
  <Canvas camera={{ position: [0, 0, 3.4], fov: 45 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
    <Sphere {...props} />
  </Canvas>
);
