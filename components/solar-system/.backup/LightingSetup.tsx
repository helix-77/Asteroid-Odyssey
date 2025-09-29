"use client";

import React from "react";

const LightingSetup: React.FC = () => {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />

      {/* Main directional light (sun) */}
      <directionalLight
        position={[10, 10, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Secondary fill light */}
      <pointLight position={[-10, -10, -10]} intensity={0.2} />

      {/* Rim light for dramatic effect */}
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />
    </>
  );
};

export default LightingSetup;
