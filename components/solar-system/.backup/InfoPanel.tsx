"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { InfoPanelProps } from "../types";

const InfoPanel: React.FC<InfoPanelProps> = ({ asteroid, onClose }) => {
  if (!asteroid) return null;

  const avgDiameter =
    (asteroid.est_diameter_min_m + asteroid.est_diameter_max_m) / 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <Card className="p-4 bg-black/50 backdrop-blur-md border-white/10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">{asteroid.name}</h3>
              <p className="text-white/70 text-sm">
                ID: {asteroid.neo_reference_id}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-white/50 text-sm">Diameter</p>
                <p className="text-white font-medium">
                  {avgDiameter.toFixed(1)}m
                </p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Magnitude</p>
                <p className="text-white font-medium">
                  {asteroid.absolute_magnitude_h}
                </p>
              </div>
            </div>

            {/* Hazard Status */}
            <div>
              <Badge
                variant={
                  asteroid.is_potentially_hazardous_asteroid
                    ? "destructive"
                    : "default"
                }
                className="mb-2"
              >
                {asteroid.is_potentially_hazardous_asteroid
                  ? "Potentially Hazardous"
                  : "Non-Hazardous"}
              </Badge>
            </div>

            {/* Approach Details */}
            {asteroid.closest_approach_date && (
              <div>
                <h4 className="text-white/70 mb-2">Closest Approach</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-white/50">Date: </span>
                    <span className="text-white">
                      {new Date(
                        asteroid.closest_approach_date
                      ).toLocaleDateString()}
                    </span>
                  </p>
                  {asteroid.miss_distance_km && (
                    <p className="text-sm">
                      <span className="text-white/50">Miss Distance: </span>
                      <span className="text-white">
                        {(parseFloat(asteroid.miss_distance_km) / 1000).toFixed(
                          0
                        )}{" "}
                        km
                      </span>
                    </p>
                  )}
                  {asteroid.relative_velocity_km_s && (
                    <p className="text-sm">
                      <span className="text-white/50">Relative Velocity: </span>
                      <span className="text-white">
                        {parseFloat(asteroid.relative_velocity_km_s).toFixed(2)}{" "}
                        km/s
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default InfoPanel;
