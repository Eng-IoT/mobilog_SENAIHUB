"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCw } from "lucide-react";
import {
  ACESFilmicToneMapping, Box3, CanvasTexture, Color, CylinderGeometry,
  DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial, PCFSoftShadowMap,
  PerspectiveCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
  type BufferGeometry, type Material,
} from "three";
import { createFurnitureModel } from "@/lib/furniture-model";
import { TYPES, type FurnitureType } from "@/lib/production";
import FurnitureArt from "./furniture-art";

function woodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#c69b6a";
  ctx.fillRect(0, 0, 512, 512);
  for (let line = 0; line < 280; line++) {
    const y = line * 1.86;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${line % 3 ? "109,70,35" : "255,224,174"},${0.06 + (line % 7) * 0.013})`;
    ctx.lineWidth = line % 9 === 0 ? 2 : 0.65;
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 12) ctx.lineTo(x, y + Math.sin(x / 55 + line * 0.72) * (1 + line % 6));
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export default function Furniture3D({ type }: { type: FurnitureType }) {
  const mount = useRef<HTMLDivElement>(null);
  const motion = useRef(false);
  const redraw = useRef<(() => void) | null>(null);
  const [rotating, setRotating] = useState(false);
  const [available, setAvailable] = useState(true);
  const label = TYPES.find(item => item.value === type)?.label.toLowerCase() || "móvel";

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let renderer: WebGLRenderer;
    try { renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { setAvailable(false); return; }

    let frame = 0, previous = 0, lastDraw = 0, disposed = false;
    const textures: CanvasTexture[] = [];
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, 0.1, 50);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(new Color("#f3efe8"), 0);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    element.appendChild(canvas);

    const texture = woodTexture();
    if (texture) { texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); textures.push(texture); }
    const wood = new MeshStandardMaterial({ map: texture, color: texture ? "#ffffff" : "#b88b58", roughness: 0.57 });
    const edge = new MeshStandardMaterial({ map: texture, color: "#af8b65", roughness: 0.65 });
    const hardware = new MeshStandardMaterial({ color: "#404b57", metalness: 0.72, roughness: 0.3 });
    const model = createFurnitureModel(type, wood, edge, hardware);
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    model.position.sub(center);
    const radius = Math.sqrt(size.x ** 2 + size.y ** 2 + size.z ** 2) / 2;
    model.rotation.y = -0.35;
    scene.add(model);

    const baseRadius = Math.hypot(size.x, size.z) * 0.57;
    const baseMaterial = new MeshStandardMaterial({ color: "#e7e0d5", roughness: 0.95 });
    const base = new Mesh(new CylinderGeometry(baseRadius, baseRadius, 0.055, 80), baseMaterial);
    base.position.y = -size.y / 2 - 0.04;
    base.receiveShadow = true;
    scene.add(base);
    scene.add(new HemisphereLight("#fff8ed", "#778ba0", 2.5));
    const key = new DirectionalLight("#fff1da", 3.2);
    key.position.set(3, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4; key.shadow.camera.right = 4;
    key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.normalBias = 0.035;
    key.shadow.bias = -0.0002;
    scene.add(key);
    const fill = new DirectionalLight("#dceaff", 1.4);
    fill.position.set(-4, 3, -3);
    scene.add(fill);

    const render = () => { if (!disposed) renderer.render(scene, camera); };
    const resize = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const vertical = camera.fov * Math.PI / 360;
      const limitingFov = Math.min(vertical, Math.atan(Math.tan(vertical) * camera.aspect));
      const distance = radius * 1.14 / Math.sin(limitingFov);
      camera.position.set(distance * 0.46, distance * 0.3, distance * 0.835);
      camera.lookAt(0, -0.02, 0);
      camera.updateProjectionMatrix();
      render();
    };
    // One revolution per minute; no React state updates on animation frames.
    const animate = (time: number) => {
      frame = 0;
      if (disposed || document.hidden || !motion.current) return;
      if (!lastDraw || time - lastDraw >= 1000 / 30) {
        if (previous) model.rotation.y += Math.min((time - previous) / 1000, 0.1) * Math.PI / 30;
        previous = time; lastDraw = time; render();
      }
      frame = requestAnimationFrame(animate);
    };
    const syncMotion = () => {
      cancelAnimationFrame(frame); frame = 0; previous = 0; lastDraw = 0;
      render();
      if (motion.current && !document.hidden && !disposed) frame = requestAnimationFrame(animate);
    };
    redraw.current = syncMotion;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => { motion.current = !reduced.matches; setRotating(motion.current); syncMotion(); };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    document.addEventListener("visibilitychange", syncMotion);
    reduced.addEventListener("change", applyPreference);
    const contextLost = (event: Event) => { event.preventDefault(); motion.current = false; cancelAnimationFrame(frame); setAvailable(false); };
    canvas.addEventListener("webglcontextlost", contextLost);
    resize(); applyPreference();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      redraw.current = null;
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncMotion);
      reduced.removeEventListener("change", applyPreference);
      canvas.removeEventListener("webglcontextlost", contextLost);
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>([wood, edge, hardware, baseMaterial]);
      scene.traverse(object => {
        if (object instanceof Mesh) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textures.forEach(item => item.dispose());
      key.shadow.map?.dispose();
      renderer.dispose(); renderer.forceContextLoss();
      canvas.remove();
    };
  }, [type]);

  return <div className={"furniture-viewer " + (!available ? "viewer-fallback" : "")}>
    <div ref={mount} className="furniture-canvas" role="img" aria-label={`Modelo ilustrativo em 3D de ${label}${rotating && available ? ", girando lentamente" : ""}`}/>
    {!available && <div className="furniture-fallback"><FurnitureArt type={type} large/><p>Visualização ilustrativa · 3D indisponível neste aparelho</p></div>}
    <div className="viewer-caption"><span><RotateCw size={15}/>{available ? "MODELO 3D ILUSTRATIVO" : "MODELO ILUSTRATIVO"}</span>{available && <button type="button" onClick={() => { motion.current = !motion.current; setRotating(motion.current); redraw.current?.(); }} aria-pressed={!rotating}>{rotating ? <Pause size={16}/> : <Play size={16}/>}<span>{rotating ? "Pausar rotação" : "Girar móvel"}</span></button>}</div>
  </div>;
}
