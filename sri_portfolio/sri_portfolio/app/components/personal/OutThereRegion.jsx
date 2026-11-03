"use client";
import { Suspense } from "react";
import AuthoredOutThere from "./AuthoredOutThere";
import TrailCamp from "./TrailCamp";
import CampClearing from "./CampClearing";
import { outThereCamp, outThereStop } from "../../lib/out-there-site.mjs";
import { campsite } from "../../lib/valley-layout.mjs";
const level = () => 0;
export default function OutThereRegion({
  animate,
  detailed,
  night,
  stop,
  onJournalOpen,
  wind,
}) {
  const camp = outThereCamp;
  return (
    <group>
      <AuthoredOutThere
        embedded
        animate={animate}
        night={night}
        focus={outThereStop(stop)?.target || null}
        onJournalOpen={onJournalOpen}
        wind={wind}
        reflectLake={stop==="lake"}
      />
      <CampClearing />
      <group position={[camp.x - campsite.x, camp.y, camp.z - campsite.z]}>
        <Suspense fallback={null}>
          <TrailCamp
            campOnly
            ground={level}
            {...{ animate, night, detailed }}
          />
        </Suspense>
      </group>
    </group>
  );
}
