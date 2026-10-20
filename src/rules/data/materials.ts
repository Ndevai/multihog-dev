// What things are made of (docs/df-body-engine.md §6.23). Per material: rho density kg/m³; E Young's modulus GPa (wood: along the grain, static bending); strength MPa with its kind (bending = modulus of rupture, tension, compression); compression MPa where it differs; k thermal conductivity W/(m·K); cp specific heat J/(kg·K); c measured speed of sound m/s (thin rod, or along the grain); alpha500 sound absorption coefficient of the surface at 500 Hz; resistivity Ω·m (metals). src names the source of each field: WH = Wood Handbook FPL-GTR-190 (2010), Table 5-3a, 12 % moisture, density at 12 % moisture = specific gravity (oven-dry mass, volume at 12 %) × 1.12 × 1000 kg/m³; RB = Reilly & Burstein 1975, J Biomech 8:393, human femoral cortical bone, longitudinal; raw = recalled from engineering handbooks (CRC Handbook, Engineering ToolBox, Ashby & Jones Engineering Materials 1), not checked against the page [RAW].
// Edit here; tools/check-materials.mjs checks every material against the laws in materials.ts.
export const MATERIALS_DATA = {
 "materials": {
  "oak (red)": {
   "family": "wood",
   "rho": 706,
   "E": 12.5,
   "strength": 99,
   "kind": "bending",
   "compression": 46.6,
   "k": 0.17,
   "cp": 1700,
   "c": 3850,
   "alpha500": 0.1,
   "src": {
    "rho": "WH",
    "E": "WH",
    "strength": "WH",
    "compression": "WH",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "oak (white)": {
   "family": "wood",
   "rho": 762,
   "E": 12.3,
   "strength": 105,
   "kind": "bending",
   "compression": 51.3,
   "k": 0.17,
   "cp": 1700,
   "c": 3850,
   "alpha500": 0.1,
   "src": {
    "rho": "WH",
    "E": "WH",
    "strength": "WH",
    "compression": "WH",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "pine (eastern white)": {
   "family": "wood",
   "rho": 392,
   "E": 8.5,
   "strength": 59,
   "kind": "bending",
   "compression": 33.1,
   "k": 0.11,
   "cp": 1700,
   "c": 3300,
   "alpha500": 0.1,
   "src": {
    "rho": "WH",
    "E": "WH",
    "strength": "WH",
    "compression": "WH",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "fir (Douglas)": {
   "family": "wood",
   "rho": 538,
   "E": 13.4,
   "strength": 85,
   "kind": "bending",
   "compression": 49.9,
   "k": 0.12,
   "cp": 1700,
   "c": 4800,
   "alpha500": 0.1,
   "src": {
    "rho": "WH",
    "E": "WH",
    "strength": "WH",
    "compression": "WH",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "ash (white)": {
   "family": "wood",
   "rho": 672,
   "E": 12.0,
   "strength": 103,
   "kind": "bending",
   "compression": 51.1,
   "k": 0.16,
   "cp": 1700,
   "c": 4670,
   "alpha500": 0.1,
   "src": {
    "rho": "WH",
    "E": "WH",
    "strength": "WH",
    "compression": "WH",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "elm (American)": {
   "family": "wood",
   "rho": 560,
   "E": 9.2,
   "strength": 81,
   "kind": "bending",
   "compression": 38.1,
   "k": 0.14,
   "cp": 1700,
   "c": 4120,
   "alpha500": 0.1,
   "src": {
    "rho": "WH",
    "E": "WH",
    "strength": "WH",
    "compression": "WH",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "mild steel": {
   "family": "metal",
   "rho": 7850,
   "E": 200,
   "strength": 400,
   "kind": "tension",
   "k": 50,
   "cp": 490,
   "c": 5100,
   "alpha500": 0.02,
   "resistivity": 1.43e-07,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw",
    "resistivity": "raw"
   }
  },
  "wrought iron": {
   "family": "metal",
   "rho": 7700,
   "E": 190,
   "strength": 340,
   "kind": "tension",
   "k": 59,
   "cp": 460,
   "c": 5000,
   "alpha500": 0.02,
   "resistivity": 1.2e-07,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw",
    "resistivity": "raw"
   }
  },
  "iron (pure)": {
   "family": "metal",
   "rho": 7870,
   "E": 211,
   "strength": 350,
   "kind": "tension",
   "k": 80,
   "cp": 449,
   "c": 5120,
   "alpha500": 0.02,
   "resistivity": 9.7e-08,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw",
    "resistivity": "raw"
   }
  },
  "cast iron (grey)": {
   "family": "metal",
   "rho": 7200,
   "E": 100,
   "strength": 200,
   "kind": "tension",
   "compression": 800,
   "k": 50,
   "cp": 460,
   "c": 3700,
   "alpha500": 0.02,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "compression": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "copper": {
   "family": "metal",
   "rho": 8960,
   "E": 120,
   "strength": 220,
   "kind": "tension",
   "k": 401,
   "cp": 385,
   "c": 3810,
   "alpha500": 0.02,
   "resistivity": 1.68e-08,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw",
    "resistivity": "raw"
   }
  },
  "lead": {
   "family": "metal",
   "rho": 11340,
   "E": 16,
   "strength": 18,
   "kind": "tension",
   "k": 35,
   "cp": 129,
   "c": 1210,
   "alpha500": 0.02,
   "resistivity": 2.08e-07,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw",
    "resistivity": "raw"
   }
  },
  "glass (window)": {
   "family": "ceramic",
   "rho": 2500,
   "E": 70,
   "strength": 45,
   "kind": "bending",
   "compression": 1000,
   "k": 1.0,
   "cp": 840,
   "c": 5300,
   "alpha500": 0.18,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "compression": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "brick (common clay)": {
   "family": "masonry",
   "rho": 1900,
   "E": 15,
   "strength": 20,
   "kind": "compression",
   "k": 0.7,
   "cp": 840,
   "c": 3650,
   "alpha500": 0.03,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "limestone": {
   "family": "stone",
   "rho": 2600,
   "E": 50,
   "strength": 100,
   "kind": "compression",
   "k": 1.3,
   "cp": 900,
   "c": 4300,
   "alpha500": 0.02,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "granite": {
   "family": "stone",
   "rho": 2700,
   "E": 55,
   "strength": 170,
   "kind": "compression",
   "k": 2.8,
   "cp": 790,
   "c": 5000,
   "alpha500": 0.01,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "concrete": {
   "family": "masonry",
   "rho": 2400,
   "E": 30,
   "strength": 30,
   "kind": "compression",
   "k": 1.6,
   "cp": 750,
   "c": 3600,
   "alpha500": 0.02,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "lime plaster": {
   "family": "masonry",
   "rho": 1600,
   "E": 5,
   "strength": 2,
   "kind": "compression",
   "k": 0.7,
   "cp": 840,
   "c": 1800,
   "alpha500": 0.02,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "gypsum board": {
   "family": "masonry",
   "rho": 700,
   "E": 2.5,
   "strength": 4,
   "kind": "bending",
   "k": 0.17,
   "cp": 1090,
   "c": 1900,
   "alpha500": 0.05,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "c": "raw",
    "alpha500": "raw"
   }
  },
  "hemp or manila rope": {
   "family": "fibre",
   "rho": 1000,
   "E": 3,
   "strength": 0,
   "kind": "tension",
   "k": 0.1,
   "cp": 1300,
   "alpha500": 0.3,
   "rope": "breaking load ≈ 900 lbf × C² (C = circumference, inches), the manila rule of thumb [RAW]",
   "src": {
    "rho": "raw",
    "E": "raw",
    "k": "raw",
    "cp": "raw",
    "alpha500": "raw"
   }
  },
  "wool cloth (heavy curtain)": {
   "family": "fibre",
   "rho": 300,
   "E": 0.01,
   "strength": 10,
   "kind": "tension",
   "k": 0.04,
   "cp": 1360,
   "alpha500": 0.49,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "alpha500": "raw"
   }
  },
  "leather": {
   "family": "fibre",
   "rho": 900,
   "E": 0.2,
   "strength": 25,
   "kind": "tension",
   "k": 0.16,
   "cp": 1500,
   "alpha500": 0.1,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw",
    "k": "raw",
    "cp": "raw",
    "alpha500": "raw"
   }
  },
  "bone (cortical)": {
   "family": "tissue",
   "rho": 1900,
   "E": 17.0,
   "strength": 133,
   "kind": "tension",
   "compression": 193,
   "k": 0.4,
   "cp": 1300,
   "c": 3500,
   "src": {
    "rho": "raw",
    "E": "RB",
    "strength": "RB",
    "compression": "RB",
    "k": "raw",
    "cp": "raw",
    "c": "raw"
   }
  },
  "skin": {
   "family": "tissue",
   "rho": 1100,
   "E": 0.1,
   "strength": 20,
   "kind": "tension",
   "k": 0.37,
   "cp": 3400,
   "src": {
    "rho": "raw",
    "E": "raw",
    "strength": "raw (Yamada 1970, Strength of Biological Materials: about 17–23 MPa)",
    "k": "raw",
    "cp": "raw"
   }
  }
 },
 "walls": {
  "_about": "What the Listen and Communicate barriers are made of; surface mass = density × thickness feeds the mass law (acoustics.ts).",
  "curtain or tent": {
   "material": "wool cloth (heavy curtain)",
   "thickness_m": 0.003
  },
  "wooden door": {
   "material": "oak (red)",
   "thickness_m": 0.04
  },
  "plaster wall": {
   "material": "lime plaster",
   "thickness_m": 0.025,
   "note": "lath and plaster partition, both faces about 25 mm together [ASSUMED]"
  },
  "brick wall": {
   "material": "brick (common clay)",
   "thickness_m": 0.215
  },
  "stone wall": {
   "material": "limestone",
   "thickness_m": 0.3
  }
 },
 "linings": {
  "_about": "Room linings (rooms.ts LINING): material and the thickness that heats up in a fire.",
  "concrete": {
   "material": "concrete",
   "thickness_m": 0.15
  },
  "brick": {
   "material": "brick (common clay)",
   "thickness_m": 0.2
  },
  "gypsum board": {
   "material": "gypsum board",
   "thickness_m": 0.016
  },
  "wood": {
   "material": "pine (eastern white)",
   "thickness_m": 0.02
  },
  "stone": {
   "material": "limestone",
   "thickness_m": 0.3
  },
  "lime plaster": {
   "material": "lime plaster",
   "thickness_m": 0.02
  }
 }
} as const;
