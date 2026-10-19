import { Group, Mesh, type Material } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { FurnitureType } from "./production.ts";

// Illustrative furniture by product category. No external model or network asset.
export function createFurnitureModel(type: FurnitureType, wood: Material, edge: Material, hardware: Material) {
  const group = new Group();
  function panel(w: number, h: number, d: number, x: number, y: number, z: number, material = wood) {
    const geometry = new RoundedBoxGeometry(w, h, d, 2, Math.min(0.018, w / 5, h / 5, d / 5));
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  if (type === "mesa") {
    panel(2.6, 0.11, 1.5, 0, 1.31, 0);
    for (const x of [-1.08, 1.08]) {
      for (const z of [-0.54, 0.54]) panel(0.13, 1.25, 0.13, x, 0.625, z, edge);
      panel(0.075, 0.2, 1.13, x, 1.13, 0, edge);
    }
    for (const z of [-0.54, 0.54]) panel(2.16, 0.2, 0.075, 0, 1.13, z, edge);
  } else if (type === "banco") {
    for (const z of [-0.3, 0, 0.3]) panel(2.45, 0.105, 0.275, 0, 0.86, z);
    for (const x of [-0.94, 0.94]) {
      for (const z of [-0.28, 0.28]) panel(0.13, 0.81, 0.13, x, 0.405, z, edge);
      panel(0.12, 0.15, 0.72, x, 0.75, 0, edge);
      panel(0.11, 0.1, 0.58, x, 0.25, 0, edge);
    }
    panel(1.9, 0.13, 0.09, 0, 0.3, 0, edge);
  } else {
    const w = type === "armario" ? 1.6 : 1.7;
    const h = 2.18, d = 0.64, t = 0.065, base = 0.15;
    for (const x of [-w / 2 + 0.13, w / 2 - 0.13]) {
      for (const z of [-d / 2 + 0.11, d / 2 - 0.11]) panel(0.085, base, 0.085, x, base / 2, z, hardware);
    }
    for (const x of [-w / 2 + t / 2, w / 2 - t / 2]) panel(t, h, d, x, base + h / 2, 0);
    for (const y of [base + t / 2, base + h - t / 2]) panel(w, t, d, 0, y, 0);
    panel(w - t * 2, h - t * 2, 0.035, 0, base + h / 2, -d / 2 + 0.02, edge);
    if (type === "armario") {
      for (const side of [-1, 1]) {
        panel(w / 2 - 0.022, h - 0.055, 0.055, side * w / 4, base + h / 2, d / 2 + 0.018);
        panel(0.024, 0.27, 0.04, side * 0.075, base + h / 2, d / 2 + 0.075, hardware);
        for (const y of [-0.1, 0.1]) panel(0.024, 0.024, 0.05, side * 0.075, base + h / 2 + y, d / 2 + 0.055, hardware);
      }
    } else {
      for (const y of [0.68, 1.2, 1.72]) panel(w - t * 2, t, d - 0.025, 0, y, 0);
      panel(t, 0.46, d - 0.035, 0.19, 0.92, 0);
      panel(t, 0.46, d - 0.035, -0.32, 1.46, 0);
    }
  }
  return group;
}
