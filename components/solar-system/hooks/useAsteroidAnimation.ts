import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface AnimationConfig {
  rotationSpeed?: number;
  wobbleAmount?: number;
  wobbleSpeed?: number;
  pulseAmount?: number;
  pulseSpeed?: number;
}

export function useAsteroidAnimation(
  ref: React.RefObject<THREE.Mesh>,
  config: AnimationConfig = {}
) {
  const {
    rotationSpeed = 0.5,
    wobbleAmount = 0.1,
    wobbleSpeed = 1,
    pulseAmount = 0.05,
    pulseSpeed = 2,
  } = config;

  const initialScale = useRef<THREE.Vector3 | null>(null);
  const time = useRef(Math.random() * 100);

  useEffect(() => {
    if (ref.current) {
      initialScale.current = ref.current.scale.clone();
    }
  }, []);

  useFrame((_, delta) => {
    if (ref.current && initialScale.current) {
      // Update time
      time.current += delta;

      // Rotation
      ref.current.rotation.y += delta * rotationSpeed;
      ref.current.rotation.x += delta * rotationSpeed * 0.3;

      // Wobble effect
      ref.current.position.y +=
        Math.sin(time.current * wobbleSpeed) * wobbleAmount * delta;

      // Pulse effect
      const pulse = Math.sin(time.current * pulseSpeed) * pulseAmount + 1;
      ref.current.scale.copy(initialScale.current).multiplyScalar(pulse);
    }
  });

  return {
    reset: () => {
      if (ref.current && initialScale.current) {
        ref.current.scale.copy(initialScale.current);
        ref.current.rotation.set(0, 0, 0);
      }
    },
  };
}
