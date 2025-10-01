"use client";

import React, { useRef, useEffect, useState } from "react";

interface BasicMapProps {
  onMapClick: (lat: number, lng: number) => void;
  impactLocation: { lat: number; lng: number } | null;
  currentTime: number;
  asteroid: any;
}

export const BasicMap: React.FC<BasicMapProps> = ({ 
  onMapClick, 
  impactLocation, 
  currentTime,
  asteroid 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const rect = canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#e8f4f8"; // Ocean color
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw simple world map (rectangles for continents)
    ctx.fillStyle = "#90EE90"; // Land color

    // North America
    ctx.fillRect(dimensions.width * 0.1, dimensions.height * 0.2, dimensions.width * 0.2, dimensions.height * 0.3);
    
    // South America
    ctx.fillRect(dimensions.width * 0.2, dimensions.height * 0.5, dimensions.width * 0.1, dimensions.height * 0.3);
    
    // Europe
    ctx.fillRect(dimensions.width * 0.45, dimensions.height * 0.15, dimensions.width * 0.1, dimensions.height * 0.2);
    
    // Africa
    ctx.fillRect(dimensions.width * 0.45, dimensions.height * 0.35, dimensions.width * 0.15, dimensions.height * 0.4);
    
    // Asia
    ctx.fillRect(dimensions.width * 0.55, dimensions.height * 0.1, dimensions.width * 0.3, dimensions.height * 0.4);
    
    // Australia
    ctx.fillRect(dimensions.width * 0.7, dimensions.height * 0.6, dimensions.width * 0.15, dimensions.height * 0.2);

    // Draw borders
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(dimensions.width * 0.1, dimensions.height * 0.2, dimensions.width * 0.2, dimensions.height * 0.3);
    ctx.strokeRect(dimensions.width * 0.2, dimensions.height * 0.5, dimensions.width * 0.1, dimensions.height * 0.3);
    ctx.strokeRect(dimensions.width * 0.45, dimensions.height * 0.15, dimensions.width * 0.1, dimensions.height * 0.2);
    ctx.strokeRect(dimensions.width * 0.45, dimensions.height * 0.35, dimensions.width * 0.15, dimensions.height * 0.4);
    ctx.strokeRect(dimensions.width * 0.55, dimensions.height * 0.1, dimensions.width * 0.3, dimensions.height * 0.4);
    ctx.strokeRect(dimensions.width * 0.7, dimensions.height * 0.6, dimensions.width * 0.15, dimensions.height * 0.2);

    // Draw impact location and effects
    if (impactLocation) {
      // Convert lat/lng to canvas coordinates
      const x = ((impactLocation.lng + 180) / 360) * dimensions.width;
      const y = ((90 - impactLocation.lat) / 180) * dimensions.height;

      if (currentTime > 5 && asteroid) {
        // Draw crater
        const craterSize = Math.min(50, (asteroid.size || 100) / 100 * (currentTime / 10));
        ctx.fillStyle = "#2c2c2c";
        ctx.beginPath();
        ctx.arc(x, y, craterSize, 0, 2 * Math.PI);
        ctx.fill();

        // Draw blast radius
        const blastRadius = craterSize * 3 * (currentTime / 100);
        ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, blastRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw thermal radius
        const thermalRadius = craterSize * 5 * (currentTime / 100);
        ctx.strokeStyle = "rgba(255, 165, 0, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, thermalRadius, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        // Draw impact marker
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Add labels
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.fillText("North America", dimensions.width * 0.15, dimensions.height * 0.35);
    ctx.fillText("South America", dimensions.width * 0.22, dimensions.height * 0.65);
    ctx.fillText("Europe", dimensions.width * 0.47, dimensions.height * 0.25);
    ctx.fillText("Africa", dimensions.width * 0.48, dimensions.height * 0.55);
    ctx.fillText("Asia", dimensions.width * 0.65, dimensions.height * 0.3);
    ctx.fillText("Australia", dimensions.width * 0.72, dimensions.height * 0.7);

  }, [dimensions, impactLocation, currentTime, asteroid]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert canvas coordinates to lat/lng
    const lng = (x / dimensions.width) * 360 - 180;
    const lat = 90 - (y / dimensions.height) * 180;

    onMapClick(lat, lng);
  };

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      onClick={handleClick}
      style={{ 
        cursor: "crosshair",
        width: "100%",
        height: "100%",
        display: "block"
      }}
    />
  );
};
