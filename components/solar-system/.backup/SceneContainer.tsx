"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { SceneControlsProps } from "../types";

interface SceneContainerProps {
  children: React.ReactNode;
  controls?: SceneControlsProps;
  className?: string;
}

const SceneContainer: React.FC<SceneContainerProps> = ({
  children,
  controls = {},
  className = "",
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{
          position: [0, 5, 10],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{ antialias: true }}
        shadows
      >
        <color attach="background" args={["#000"]} />
        <fog attach="fog" args={["#000", 20, 40]} />
        {children}
      </Canvas>
    </div>
  );
};

export default SceneContainer;
