"use client";

import React from "react";
import { OrbitControls } from "@react-three/drei";
import { SceneControlsProps } from "../types";

const CameraControls: React.FC<SceneControlsProps> = ({
  autoRotate = false,
  enableZoom = true,
  maxDistance = 20,
  minDistance = 2,
}) => {
  return (
    <OrbitControls
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      enableZoom={enableZoom}
      maxDistance={maxDistance}
      minDistance={minDistance}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
    />
  );
};

export default CameraControls;
