"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  buildDeck,
  buildGraniteForm,
  buildTalusGeometry,
  embedBase,
} from "../../lib/granite-geometry.mjs";
import {
  graniteForms,
  outdoorsLift,
  talusSpots,
} from "../../lib/valley-layout.mjs";
import { createGraniteMaterial } from "../../lib/valley-materials.mjs";
import { renderedSurfaceHeight } from "../../lib/terrain-geometry.mjs";
import { applyTriplanar } from "../../lib/triplanar.mjs";
import usePbrSet from "./usePbrSet";

export default function GraniteValley() {
  const talusRef = useRef(null);
  const granite = usePbrSet("granite");
  const assets = useMemo(() => {
    const heightAt = (x, z) =>
      renderedSurfaceHeight("trail", x, z) - outdoorsLift;
    return {
      // Photographed granite over the procedural weathering: the scan gives
      // crystal grain and fractures, the procedural pass keeps streaks.
      material: applyTriplanar(createGraniteMaterial(), {
        ...granite,
        scale: 0.16,
        strength: 0.9,
        normalStrength: 1.4,
      }),
      forms: graniteForms.map((form) =>
        embedBase(buildGraniteForm(form), heightAt),
      ),
      talus: buildTalusGeometry(),
      deck: buildDeck(heightAt),
      spots: talusSpots().map((spot) => ({
        ...spot,
        y: heightAt(spot.x, spot.z) - 0.06,
      })),
    };
  }, [granite]);
  useLayoutEffect(() => {
    if (!talusRef.current) return;
    const object = new THREE.Object3D();
    assets.spots.forEach((spot, index) => {
      object.position.set(spot.x, spot.y, spot.z);
      object.rotation.set(0, spot.turn, 0);
      object.scale.setScalar(spot.scale);
      object.updateMatrix();
      talusRef.current.setMatrixAt(index, object.matrix);
    });
    talusRef.current.instanceMatrix.needsUpdate = true;
    talusRef.current.computeBoundingSphere();
  }, [assets]);
  useEffect(
    () => () => {
      assets.material.dispose();
      assets.forms.forEach((geometry) => geometry.dispose());
      assets.talus.dispose();
      assets.deck.dispose();
    },
    [assets],
  );
  return (
    <group>
      {assets.forms.map((geometry, index) => (
        <mesh
          key={graniteForms[index].seed}
          geometry={geometry}
          material={assets.material}
          castShadow
          receiveShadow
        />
      ))}
      <mesh
        geometry={assets.deck}
        material={assets.material}
        receiveShadow
        castShadow
      />
      {assets.spots.length > 0 && (
        <instancedMesh
          ref={talusRef}
          args={[assets.talus, assets.material, assets.spots.length]}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
}
