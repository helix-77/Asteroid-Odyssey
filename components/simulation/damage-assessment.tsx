"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Building, Zap } from "lucide-react";
import type { ImpactResults } from "@/lib/types";

interface DamageAssessmentProps {
  impactResults: ImpactResults | null;
  targetLocation: { lat: number; lng: number; name: string };
}

export function DamageAssessment({
  impactResults,
  targetLocation,
}: DamageAssessmentProps) {
  if (!impactResults) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Damage Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Run an impact simulation to see damage assessment
          </div>
        </CardContent>
      </Card>
    );
  }

  const damageZones = [
    {
      name: "Total Destruction",
      radius: impactResults.crater.diameter / 2000, // km
      description: "Complete vaporization and crater formation",
      color: "bg-red-600",
      casualties: Math.floor(impactResults.casualties.immediate * 0.4),
    },
    {
      name: "Severe Damage",
      radius: impactResults.effects.airblastRadius / 2, // km
      description: "Buildings destroyed, fires, severe injuries",
      color: "bg-orange-600",
      casualties: Math.floor(impactResults.casualties.immediate * 0.35),
    },
    {
      name: "Moderate Damage",
      radius: impactResults.effects.airblastRadius, // km
      description: "Structural damage, broken windows, injuries",
      color: "bg-yellow-600",
      casualties: Math.floor(impactResults.casualties.immediate * 0.2),
    },
    {
      name: "Light Damage",
      radius: impactResults.effects.airblastRadius * 2, // km
      description: "Minor structural damage, debris",
      color: "bg-blue-600",
      casualties: Math.floor(impactResults.casualties.immediate * 0.05),
    },
  ];

  const infrastructureImpact = {
    power: Math.min(95, (impactResults.tntEquivalent / 1000) * 80),
    water: Math.min(90, (impactResults.tntEquivalent / 1000) * 70),
    transport: Math.min(98, (impactResults.tntEquivalent / 1000) * 90),
    communications: Math.min(85, (impactResults.tntEquivalent / 1000) * 60),
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Damage Assessment - {targetLocation.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Impact */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-red-600" />
              <span className="font-medium">Casualties</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {impactResults.casualties.immediate.toLocaleString()}
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Affected Area</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.PI *
                Math.pow(impactResults.effects.airblastRadius, 2).toFixed(
                  0
                )}{" "}
              km²
            </div>
          </div>
        </div>

        {/* Damage Zones */}
        <div className="space-y-3">
          <h4 className="font-semibold">Damage Zones</h4>
          {damageZones.map((zone, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{zone.name}</span>
                <Badge className={zone.color}>
                  {zone.radius.toFixed(1)} km radius
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {zone.description}
              </p>
              <div className="text-sm">
                Estimated casualties: {zone.casualties.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Infrastructure Impact */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Infrastructure Impact
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Power Grid</span>
                <span>{infrastructureImpact.power.toFixed(0)}% disrupted</span>
              </div>
              <Progress value={infrastructureImpact.power} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Water Supply</span>
                <span>{infrastructureImpact.water.toFixed(0)}% disrupted</span>
              </div>
              <Progress value={infrastructureImpact.water} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Transportation</span>
                <span>
                  {infrastructureImpact.transport.toFixed(0)}% disrupted
                </span>
              </div>
              <Progress
                value={infrastructureImpact.transport}
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Communications</span>
                <span>
                  {infrastructureImpact.communications.toFixed(0)}% disrupted
                </span>
              </div>
              <Progress
                value={infrastructureImpact.communications}
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Recovery Timeline */}
        <div className="space-y-2">
          <h4 className="font-semibold">Estimated Recovery</h4>
          <div className="text-sm space-y-1">
            <div>Emergency response: 24-48 hours</div>
            <div>Basic services: 1-3 months</div>
            <div>Infrastructure rebuild: 2-5 years</div>
            <div>Full recovery: 10-20 years</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
