"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Box, Rod, Rods } from "./ScenePrimitives";
import {
  Sign,
  StreetLamp,
  BotanicalPlant,
  Bench,
  PavedWalks,
} from "./StreetFurniture";
import PaperPendant from "./PaperPendant";
import { useRoomTexture } from "./RoomMaterials";
import { WoodFloor, LoungeChair, RecordCrate } from "./ListeningFurniture";
import { Lake, Grove } from "./Landscape";
import { surfaceHeight } from "../../lib/world-layout.mjs";
import { shows } from "../../json/personal";
import CinemaSeat from "./CinemaSeat";
import CinemaScreen from "./CinemaScreen";
import CinemaGarden from "./CinemaGarden";
import {
  cinemaOrigin,
  cinemaScreen,
  cinemaSeats,
  listeningSeat,
  facingYaw,
  entertainmentPaths,
} from "../../lib/entertainment-layout.mjs";

function Turntable({ onOpen, animate }) {
  const record = useRef(),
    wood = useRoomTexture("walnut", 1);
  useFrame((_, dt) => {
    if (animate && record.current)
      record.current.rotation.y += Math.min(dt, 0.05) * 0.3;
  });
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onOpen("music");
      }}
    >
      <Box
        position={[0, 0.05, 0]}
        size={[1.28, 0.13, 0.94]}
        radius={0.035}
        color="#c7b39d"
        map={wood}
        roughness={0.65}
      />
      <Box
        position={[0, 0.125, 0]}
        size={[1.22, 0.025, 0.87]}
        radius={0.02}
        color="#343d46"
        metalness={0.55}
        roughness={0.35}
      />
      <group position={[-0.13, 0.165, 0]} ref={record}>
        <mesh>
          <cylinderGeometry args={[0.39, 0.39, 0.025, 64]} />
          <meshStandardMaterial
            color="#151b25"
            metalness={0.35}
            roughness={0.33}
          />
        </mesh>
        {[0.18, 0.23, 0.28, 0.33, 0.36].map((r) => (
          <mesh key={r} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <torusGeometry args={[r, 0.0015, 4, 64]} />
            <meshStandardMaterial color="#43505f" roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.017, 0]}>
          <cylinderGeometry args={[0.115, 0.115, 0.004, 32]} />
          <meshStandardMaterial color="#668f7b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.025, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.03, 12]} />
          <meshStandardMaterial color="#d6dce1" metalness={0.8} />
        </mesh>
      </group>
      <mesh position={[0.46, 0.17, -0.27]}>
        <cylinderGeometry args={[0.055, 0.055, 0.09, 24]} />
        <meshStandardMaterial color="#7b858c" metalness={0.8} roughness={0.2} />
      </mesh>
      <Rods
        color="#bcc2c7"
        segments={[
          { from: [0.46, 0.24, -0.27], to: [0.38, 0.24, 0.15], radius: 0.012 },
          { from: [0.38, 0.24, 0.15], to: [0.2, 0.215, 0.26], radius: 0.012 },
        ]}
      />
      <Box
        position={[0.19, 0.21, 0.28]}
        size={[0.045, 0.035, 0.1]}
        color="#87939e"
        radius={0.008}
      />
      <mesh position={[-0.5, 0.15, 0.32]}>
        <cylinderGeometry args={[0.032, 0.032, 0.027, 20]} />
        <meshStandardMaterial color="#b2bdc8" metalness={0.8} />
      </mesh>
    </group>
  );
}
function Speaker({ position }) {
  const fabric = useRoomTexture("fabric", 5);
  return (
    <group position={position}>
      <Box size={[0.47, 0.72, 0.39]} color="#282f38" radius={0.045} />
      <Box
        position={[0, 0, 0.202]}
        size={[0.41, 0.65, 0.008]}
        color="#4b545d"
        map={fabric}
        bumpMap={fabric}
        bumpScale={0.002}
        radius={0.02}
      />
      {[
        [-0.13, 0.11],
        [0.18, 0.055],
      ].map(([y, r], i) => (
        <group key={i} position={[0, y, 0.211]}>
          <mesh>
            <circleGeometry args={[r, 36]} />
            <meshStandardMaterial color="#111b26" roughness={0.52} />
          </mesh>
          <mesh>
            <torusGeometry args={[r, 0.009, 10, 36]} />
            <meshStandardMaterial
              color="#7495a8"
              metalness={0.6}
              roughness={0.28}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
function Piano({ position }) {
  const keys = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < 36; i++) {
      o.position.set((i - 17.5) * 0.064, 0, 0);
      o.updateMatrix();
      keys.current.setMatrixAt(i, o.matrix);
    }
    keys.current.instanceMatrix.needsUpdate = true;
    keys.current.computeBoundingSphere();
  }, []);
  return (
    <group position={position} rotation={[0, -0.2, 0]}>
      <Box size={[2.5, 0.16, 0.6]} color="#202d3b" radius={0.035} />
      <instancedMesh
        ref={keys}
        position={[0, 0.1, 0.075]}
        args={[undefined, undefined, 36]}
        castShadow
      >
        <boxGeometry args={[0.059, 0.065, 0.4]} />
        <meshStandardMaterial color="#d5dbde" roughness={0.36} />
      </instancedMesh>
      {Array.from({ length: 25 }, (_, i) =>
        i % 7 !== 2 && i % 7 !== 6 ? (
          <Box
            key={i}
            position={[(i - 12) * 0.091, 0.16, -0.02]}
            size={[0.035, 0.075, 0.22]}
            color="#151d27"
            radius={0.006}
          />
        ) : null,
      )}
      <Rods
        color="#526272"
        segments={[
          { from: [-1, -0.06, 0], to: [0.75, -0.85, 0], radius: 0.025 },
          { from: [1, -0.06, 0], to: [-0.75, -0.85, 0], radius: 0.025 },
        ]}
      />
    </group>
  );
}
function Fireplace({ animate }) {
  const flame = useRef(),
    time = useRef(0);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    if (animate) time.current += Math.min(dt, 0.05);
    uniforms.uTime.value = time.current;
  });
  return (
    <group position={[3.7, 0, -1.7]}>
      <mesh position={[0, 1.1, 0]} scale={[1, 1.4, 0.75]} castShadow>
        <sphereGeometry args={[0.5, 32, 24]} />
        <meshStandardMaterial
          color="#333b43"
          roughness={0.7}
          metalness={0.25}
        />
      </mesh>
      <Rod
        from={[0, 1.55, 0]}
        to={[0, 4.2, 0]}
        radius={0.065}
        color="#404952"
      />
      <mesh position={[0, 1.07, 0.345]}>
        <planeGeometry args={[0.55, 0.66]} />
        <meshStandardMaterial
          color="#421b1b"
          emissive="#bc4a25"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh ref={flame} position={[0, 1.05, 0.36]}>
        <planeGeometry args={[0.54, 0.64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          toneMapped={false}
          uniforms={uniforms}
          vertexShader="varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
          fragmentShader="varying vec2 vUv;uniform float uTime;void main(){vec2 p=vUv;float x=p.x-.5+sin(p.y*11.-uTime*2.3)*.05;float w=(1.-p.y)*.38;float a=(1.-smoothstep(w*.6,w,abs(x)))*smoothstep(1.,.3,p.y);vec3 c=mix(vec3(1.,.23,.04),vec3(1.,.72,.28),1.-p.y);gl_FragColor=vec4(c,a);}"
        />
      </mesh>

      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[
            0.75 + (i % 2) * 0.2,
            0.12 + Math.floor(i / 2) * 0.19,
            0.12,
          ]}
          rotation={[Math.PI / 2, 0, 0.1]}
          castShadow
        >
          <cylinderGeometry args={[0.09, 0.1, 0.7, 18]} />
          <meshStandardMaterial color="#8b705c" roughness={0.94} />
        </mesh>
      ))}
    </group>
  );
}
function ListeningHouse({ detailed, animate, night, onOpen, onHover, onCue }) {
  const wood = useRoomTexture("walnut", 1),
    fabric = useRoomTexture("fabric", 8),
    roof = useRef(),
    root = useRef(),
    center = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!roof.current) return;
    root.current.getWorldPosition(center);
    const a = THREE.MathUtils.smoothstep(
      camera.position.distanceTo(center),
      13,
      25,
    );
    roof.current.traverse((o) => {
      if (o.isMesh) {
        o.material.transparent = true;
        o.material.opacity = a;
        o.material.depthWrite = a > 0.98;
        o.castShadow = a > 0.98;
        o.visible = a > 0.02;
      }
    });
  });
  return (
    <group ref={root}>
      <Box
        position={[0, 0.05, 0]}
        size={[10, 0.14, 7.5]}
        color="#493c35"
        roughness={0.68}
        radius={0.02}
      />
      <WoodFloor />
      <Box
        position={[0, 0.3, -3.65]}
        size={[10, 0.4, 0.08]}
        color="#2e4052"
        radius={0.01}
      />
      <mesh position={[0, 2, -3.59]}>
        <planeGeometry args={[9.7, 3.5]} />
        <meshPhysicalMaterial
          color="#56839f"
          roughness={0.18}
          metalness={0.45}
          transparent
          opacity={0.11}
          depthWrite={false}
        />
      </mesh>
      {[-4.9, -2.5, 0, 2.5, 4.9].map((x) => (
        <Rod
          key={x}
          from={[x, 0.15, -3.48]}
          to={[x, 4, -3.48]}
          radius={0.026}
          color="#1f2c3b"
        />
      ))}
      <Box
        position={[-4.95, 2, 0]}
        size={[0.1, 3.9, 7.5]}
        color="#465063"
        map={wood}
        radius={0.015}
      />
      <group ref={roof}>
        <Box
          position={[0, 4.1, 0]}
          size={[10.6, 0.2, 8.2]}
          color="#3a4b62"
          metalness={0.25}
          roughness={0.6}
          radius={0.025}
        />
      </group>
      <mesh
        position={[0, 3.96, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[10, 7.5]} />
        <meshStandardMaterial color="#c6b39b" map={wood} roughness={0.78} />
      </mesh>
      <Rods
        color="#405161"
        segments={[-4.85, 4.85].map((x) => ({
          from: [x, 0.15, 3.65],
          to: [x, 4.1, 3.65],
          radius: 0.035,
        }))}
      />
      <Sign
        title="Side B"
        subtitle="THE LISTENING HOUSE"
        accent="#8ac8a5"
        position={[-3.25, 3.3, 3.7]}
        size={[2.3, 0.75]}
      />
      {detailed ? (
        <>
          <Box
            position={[-2, 0.55, -2.6]}
            size={[4.4, 0.79, 0.8]}
            color="#c6b29a"
            map={wood}
            radius={0.035}
          />
          {[-3.2, -2, -0.8].map((x) => (
            <Box
              key={x}
              position={[x, 0.53, -2.18]}
              size={[1.15, 0.63, 0.018]}
              color="#d3bba0"
              map={wood}
              radius={0.005}
            />
          ))}
          <group position={[-2, 1, -2.55]}>
            <Turntable animate={animate} onOpen={onOpen} />
          </group>
          <Speaker position={[-3.65, 1.32, -2.6]} />
          <Speaker position={[-0.35, 1.32, -2.6]} />
          <Sign
            title="v4 / an idea in sound"
            subtitle="MADE BY SRI"
            accent="#8ac8a5"
            position={[-2, 0.53, -2.155]}
            size={[1.03, 0.24]}
          />
          <Box
            position={[-1, 0.17, 1]}
            size={[5, 0.045, 3.1]}
            color="#343e4f"
            map={fabric}
            bumpMap={fabric}
            bumpScale={0.002}
            radius={0.025}
          />
          <LoungeChair
            position={listeningSeat.position}
            rotation={[
              0,
              facingYaw(listeningSeat.position, listeningSeat.target),
              0,
            ]}
          />
          <RecordCrate position={[-4.1, 0.15, 2.75]} onOpen={onOpen} />
          <group
            position={[-0.3, 0.75, 1]}
            onClick={(e) => {
              e.stopPropagation();
              onOpen("music");
            }}
          >
            <Box
              size={[1.8, 0.08, 1.1]}
              color="#d2b89b"
              map={wood}
              radius={0.05}
            />
            <Rods
              color="#5c646a"
              segments={[-0.65, 0.65].map((x) => ({
                from: [x, -0.06, 0],
                to: [x, -0.55, 0],
                radius: 0.026,
              }))}
            />
            <Box
              position={[-0.26, 0.06, 0]}
              size={[0.43, 0.04, 0.44]}
              color="#708681"
              radius={0.008}
            />
          </group>
          <Piano position={[1.65, 0.99, 1.8]} />
          <Fireplace animate={animate} />
          <BotanicalPlant
            animate={animate}
            position={[3.75, 0.15, -3]}
            scale={1.3}
          />
          <BotanicalPlant
            animate={animate}
            position={[-4.45, 0.15, -1]}
            scale={1.4}
          />
          <BotanicalPlant
            animate={animate}
            position={[3.7, 0.15, 3]}
            scale={0.8}
          />
          {[
            [-2.8, 4, 0],
            [0.6, 4, -1.4],
            [2.8, 4, 2],
          ].map((p, i) => (
            <PaperPendant
              key={i}
              position={p}
              {...{ night, animate, onHover, onCue }}
            />
          ))}
        </>
      ) : (
        <>
          <Box
            position={[-2, 0.7, -2.6]}
            size={[4.4, 1.1, 0.8]}
            color="#726459"
            radius={0.02}
          />
          <Box
            position={[-3, 0.7, 1.35]}
            size={[1.5, 1.2, 1.65]}
            color="#677384"
            radius={0.12}
          />
        </>
      )}
    </group>
  );
}
function Cinema({ channel, onChannelChange, onHover, night }) {
  return (
    <group position={cinemaOrigin}>
      <Box
        position={[0, 0.06, 1.5]}
        size={[6.2, 0.12, 6]}
        color="#4b4b58"
        radius={0.04}
      />
      <Box
        position={[0, 1.6, -0.58]}
        size={[5.05, 3.2, 0.2]}
        color="#202b39"
        radius={0.045}
      />
      <Box
        position={[0, 2, -0.38]}
        size={[4.78, 2.48, 0.06]}
        color="#111923"
        radius={0.035}
        metalness={0.55}
        roughness={0.3}
      />
      <CinemaScreen
        channel={channel}
        position={cinemaScreen}
        onNext={() => onChannelChange((channel + 1) % shows.length)}
        onHover={onHover}
      />
      <Box
        position={[0, 0.57, -0.18]}
        size={[3.8, 0.18, 0.2]}
        color="#27313d"
        radius={0.04}
      />
      <Box
        position={[0, 3.6, 0.1]}
        size={[5.65, 0.12, 2.0]}
        color="#625062"
        radius={0.02}
      />
      <Rods
        color="#475465"
        segments={[-2.65, 2.65].map((x) => ({
          from: [x, 0.12, 0.5],
          to: [x, 3.58, 0.5],
          radius: 0.035,
        }))}
      />
      {cinemaSeats.map((seat, i) => (
        <CinemaSeat key={i} {...seat} />
      ))}
      <CinemaGarden night={night} />
    </group>
  );
}
export default function AfterHours({
  detailed,
  animate,
  night,
  onContentOpen,
  onHover,
  onCue,
  channel,
  onChannelChange,
}) {
  return (
    <group>
      <PavedWalks biome="entertainment" paths={entertainmentPaths} />
      <Box
        position={[0, 0.075, 4.02]}
        size={[2, 0.05, 0.65]}
        color="#879099"
        radius={0.015}
      />
      <Box
        position={[12.05, 0.035, 2.3]}
        size={[0.6, 0.07, 1.4]}
        color="#747c86"
        radius={0.015}
      />
      <Lake animate={animate} position={[-2, -0.08, -11]} />
      <Grove biome="entertainment" detailed={detailed} />
      {detailed &&
        Array.from({ length: 12 }, (_, i) => {
          const x = -2 + Math.sin(i * 2.4) * 8,
            z = -11 + Math.cos(i * 2.4) * 8;
          return (
            <group
              key={i}
              position={[x, surfaceHeight("entertainment", x, z), z]}
            >
              <BotanicalPlant
                wild
                animate={animate}
                scale={0.8 + (i % 3) * 0.17}
              />
            </group>
          );
        })}
      <ListeningHouse
        detailed={detailed}
        animate={animate}
        night={night}
        onOpen={onContentOpen}
        onHover={onHover}
        onCue={onCue}
      />
      <Cinema
        channel={channel}
        onChannelChange={onChannelChange}
        onHover={onHover}
        night={night}
      />
      {[
        [-5.5, 0, 5.5],
        [3.6, 0, 5.5],
        [11.8, 0, 5.5],
      ].map((p, i) => (
        <StreetLamp key={i} position={p} night={night} />
      ))}
      <Bench position={[5.5, 0, 5.5]} />
    </group>
  );
}
