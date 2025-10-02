export const asteroidData = {
  asteroids: [
    {
      id: "2023_dw",
      name: "2023 DW",
      diameter: 50,
      mass: 1.5e11,
      velocity: 25000,
      composition: "stony" as const,
      density: 3000,
      description: "Small Near-Earth Asteroid"
    },
    {
      id: "apophis",
      name: "99942 Apophis",
      diameter: 370,
      mass: 6.1e13,
      velocity: 30700,
      composition: "stony" as const,
      density: 3200,
      description: "Potentially Hazardous Asteroid"
    },
    {
      id: "bennu",
      name: "101955 Bennu",
      diameter: 490,
      mass: 7.8e13,
      velocity: 28000,
      composition: "carbonaceous" as const,
      density: 1190,
      description: "Carbon-rich Near-Earth Asteroid"
    },
    {
      id: "1950_da",
      name: "29075 (1950 DA)",
      diameter: 1300,
      mass: 3e15,
      velocity: 15000,
      composition: "stony" as const,
      density: 3000,
      description: "Large Potentially Hazardous Asteroid"
    },
    {
      id: "tunguska",
      name: "Tunguska Event",
      diameter: 60,
      mass: 2e11,
      velocity: 27000,
      composition: "stony" as const,
      density: 3000,
      description: "1908 Tunguska-sized impactor"
    },
    {
      id: "chelyabinsk",
      name: "Chelyabinsk Meteor",
      diameter: 20,
      mass: 1.3e10,
      velocity: 19000,
      composition: "stony" as const,
      density: 3300,
      description: "2013 Chelyabinsk meteor"
    },
    {
      id: "chicxulub",
      name: "Chicxulub Impactor",
      diameter: 10000,
      mass: 1.0e18,
      velocity: 20000,
      composition: "carbonaceous" as const,
      density: 2000,
      description: "Dinosaur extinction event (~66 million years ago)"
    },
    {
      id: "vredefort",
      name: "Vredefort Impactor",
      diameter: 15000,
      mass: 4.5e18,
      velocity: 25000,
      composition: "stony" as const,
      density: 3000,
      description: "Largest verified impact on Earth (~2 billion years ago)"
    }
  ]
};