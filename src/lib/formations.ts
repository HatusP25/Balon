export type Role = "GK" | "DF" | "MF" | "FW";

export interface FormationSlot {
  x: number; // 0-100, % from left
  y: number; // 0-100, % from top (0 = opponent goal end; 100 = our goal end)
  role: Role;
}

export interface Formation {
  id: string;
  label: string;
  slots: FormationSlot[];
}

// Y conventions: GK ~92, DF ~70, MF ~45, FW ~20
export const FORMATIONS: Formation[] = [
  {
    id: "3-3-2",
    label: "3-3-2",
    slots: [
      { x: 50, y: 92, role: "GK" },
      { x: 20, y: 70, role: "DF" },
      { x: 50, y: 70, role: "DF" },
      { x: 80, y: 70, role: "DF" },
      { x: 25, y: 45, role: "MF" },
      { x: 50, y: 45, role: "MF" },
      { x: 75, y: 45, role: "MF" },
      { x: 35, y: 20, role: "FW" },
      { x: 65, y: 20, role: "FW" },
    ],
  },
  {
    id: "3-2-3",
    label: "3-2-3",
    slots: [
      { x: 50, y: 92, role: "GK" },
      { x: 20, y: 70, role: "DF" },
      { x: 50, y: 70, role: "DF" },
      { x: 80, y: 70, role: "DF" },
      { x: 35, y: 45, role: "MF" },
      { x: 65, y: 45, role: "MF" },
      { x: 20, y: 20, role: "FW" },
      { x: 50, y: 20, role: "FW" },
      { x: 80, y: 20, role: "FW" },
    ],
  },
  {
    id: "4-3-1",
    label: "4-3-1",
    slots: [
      { x: 50, y: 92, role: "GK" },
      { x: 15, y: 70, role: "DF" },
      { x: 38, y: 70, role: "DF" },
      { x: 62, y: 70, role: "DF" },
      { x: 85, y: 70, role: "DF" },
      { x: 25, y: 45, role: "MF" },
      { x: 50, y: 45, role: "MF" },
      { x: 75, y: 45, role: "MF" },
      { x: 50, y: 20, role: "FW" },
    ],
  },
  {
    id: "2-3-3",
    label: "2-3-3",
    slots: [
      { x: 50, y: 92, role: "GK" },
      { x: 35, y: 70, role: "DF" },
      { x: 65, y: 70, role: "DF" },
      { x: 25, y: 45, role: "MF" },
      { x: 50, y: 45, role: "MF" },
      { x: 75, y: 45, role: "MF" },
      { x: 20, y: 20, role: "FW" },
      { x: 50, y: 20, role: "FW" },
      { x: 80, y: 20, role: "FW" },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    slots: [],
  },
];

export function listFormations(): Formation[] {
  return FORMATIONS;
}

export function getFormation(id: string): Formation | undefined {
  return FORMATIONS.find((f) => f.id === id);
}
