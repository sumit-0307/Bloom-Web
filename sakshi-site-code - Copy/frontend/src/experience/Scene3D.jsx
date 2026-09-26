import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { scrollStore } from "@/hooks/useScrollStore";

const BUTTERFLY_URL = "/models/butterfly.glb";
const JELLY_URLS = ["/textures/jelly_lilac.png", "/textures/jelly_azure.png", "/textures/jelly_rose.png"];
const JELLY_ASPECT = [0.335, 0.383, 0.381]; // width / height of each cutout

/* ---------- helpers ---------- */
const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// frame-rate independent smoothing
const damp = (cur, target, k, delta) => cur + (target - cur) * (1 - Math.exp(-k * delta));

/* ---------- Butterfly (animated GLB, skinned clones) ---------- */
const Butterfly = ({ gltf, norm, seed = 0 }) => {
  const pathRef = useRef();
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene);
    c.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.frustumCulled = false;
        o.material.transparent = true;
      }
    });
    return c;
  }, [gltf]);
  const mixer = useMemo(() => new THREE.AnimationMixer(clone), [clone]);

  const rand = useMemo(() => ({
    r: 1.6 + (seed % 5) * 0.35,
    hs: 0.4 + ((seed * 0.13) % 0.4),
    off: seed * 0.9,
    yOff: (seed % 3) * 0.6 - 0.4,
    scale: 0.8 + (seed % 3) * 0.14,
  }), [seed]);

  React.useEffect(() => {
    const clip = gltf.animations.find((a) => a.name === "Flying") || gltf.animations[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.timeScale = 0.85 + (seed % 4) * 0.18;
    action.time = (seed * 0.37) % clip.duration;
    action.play();
    return () => mixer.stopAllAction();
  }, [mixer, gltf, seed]);

  useFrame((state, delta) => {
    mixer.update(delta);
    const t = state.clock.elapsedTime + rand.off;
    if (pathRef.current) {
      pathRef.current.position.set(
        Math.cos(t * rand.hs) * rand.r,
        Math.sin(t * rand.hs * 1.3) * 0.6 + rand.yOff,
        Math.sin(t * rand.hs * 0.7) * 0.8
      );
      const vx = -Math.sin(t * rand.hs) * rand.hs * rand.r;
      const vz = Math.cos(t * rand.hs * 0.7) * 0.7 * rand.hs * 0.8;
      pathRef.current.rotation.y = Math.atan2(vx, vz);
      pathRef.current.rotation.z = Math.sin(t * rand.hs) * 0.25;
      pathRef.current.rotation.x = Math.sin(t * rand.hs * 1.3) * 0.12;
    }
  });

  return (
    <group ref={pathRef}>
      <group scale={norm.s * rand.scale}>
        <primitive object={clone} position={[norm.offX, norm.offY, norm.offZ]} />
      </group>
    </group>
  );
};

const Butterflies = ({ visibleRef }) => {
  const gltf = useLoader(GLTFLoader, BUTTERFLY_URL);
  const groupRef = useRef();

  const norm = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 0.85 / Math.max(size.x, size.y, size.z);
    return { s, offX: -center.x, offY: -center.y, offZ: -center.z };
  }, [gltf]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = visibleRef.current;
    const cur = groupRef.current.userData.op ?? 0;
    const next = damp(cur, target, 5, delta);
    groupRef.current.userData.op = next;
    groupRef.current.visible = next > 0.01;
    groupRef.current.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.transparent = true;
        o.material.opacity = Math.min(1, next);
      }
    });
    groupRef.current.position.y = (1 - next) * -1.5;
  });

  return (
    <group ref={groupRef} visible={false}>
      {[1, 2, 3, 4, 5, 6, 7].map((s) => (
        <Butterfly key={s} gltf={gltf} norm={norm} seed={s} />
      ))}
    </group>
  );
};

/* ---------- Jellyfish (AI-generated glowing sprites, alpha billboards) ---------- */
const SWARM = [
  { x: -3.4, y: 1.2, z: -1.8, s: 0.7, sp: 0.32 },
  { x: -2.2, y: -1.0, z: -0.6, s: 1.05, sp: 0.26 },
  { x: -0.8, y: 1.6, z: -2.2, s: 0.6, sp: 0.4 },
  { x: 0.3, y: -1.5, z: -1.0, s: 0.9, sp: 0.3 },
  { x: 1.2, y: 0.9, z: 0.3, s: 1.2, sp: 0.22 },
  { x: 2.4, y: -0.5, z: -1.8, s: 0.65, sp: 0.36 },
  { x: 3.3, y: 1.3, z: -0.9, s: 0.85, sp: 0.28 },
  { x: 3.7, y: -1.4, z: -2.4, s: 0.55, sp: 0.42 },
  { x: -1.6, y: 0.1, z: 0.6, s: 1.0, sp: 0.24 },
];

const JellyBillboard = ({ cfg, tex, aspect, seed }) => {
  const ref = useRef();
  const h = 2.5 * cfg.s;
  const w = h * aspect;
  useFrame((state) => {
    const t = state.clock.elapsedTime + seed * 2.1;
    const pulse = Math.sin(t * 1.4);
    if (ref.current) {
      ref.current.position.set(
        cfg.x + Math.sin(t * cfg.sp) * 0.5,
        cfg.y + Math.cos(t * cfg.sp * 0.8) * 0.6 + pulse * 0.06,
        cfg.z
      );
      ref.current.rotation.z = Math.sin(t * 0.35) * 0.11;
      ref.current.scale.set(w * (1 - pulse * 0.06), h * (1 + pulse * 0.07), 1);
    }
  });
  return (
    <mesh ref={ref} position={[cfg.x, cfg.y, cfg.z]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        opacity={0}
        toneMapped={false}
        alphaTest={0.01}
      />
    </mesh>
  );
};

const Jellies = ({ visibleRef }) => {
  const textures = useLoader(THREE.TextureLoader, JELLY_URLS);
  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
    });
  }, [textures]);

  const groupRef = useRef();
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = visibleRef.current;
    const cur = groupRef.current.userData.op ?? 0;
    const next = damp(cur, target, 5, delta);
    groupRef.current.userData.op = next;
    groupRef.current.visible = next > 0.01;
    groupRef.current.traverse((o) => {
      if (o.isMesh && o.material) o.material.opacity = next;
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {SWARM.map((cfg, i) => (
        <JellyBillboard
          key={i}
          cfg={cfg}
          tex={textures[i % 3]}
          aspect={JELLY_ASPECT[i % 3]}
          seed={i + 1}
        />
      ))}
    </group>
  );
};

/* ---------- Petal shower for finale ---------- */
const PetalShower = ({ activeRef }) => {
  const meshRef = useRef();
  const count = 320;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const petals = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 12,
    y: 3 + Math.random() * 7,
    z: (Math.random() - 0.5) * 6,
    vy: 0.22 + Math.random() * 0.45,
    vx: (Math.random() - 0.5) * 0.12,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.05,
    scale: 0.18 + Math.random() * 0.22,
  })), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const active = activeRef.current;
    const cur = meshRef.current.userData.op ?? 0;
    const next = damp(cur, active, 4, delta);
    meshRef.current.userData.op = next;
    meshRef.current.visible = next > 0.01;
    if (meshRef.current.material) {
      meshRef.current.material.transparent = true;
      meshRef.current.material.opacity = Math.min(1, next);
    }
    petals.forEach((p, i) => {
      p.y -= p.vy * delta * (0.6 + active);
      p.x += p.vx;
      p.rot += p.vr;
      if (p.y < -4) { p.y = 4 + Math.random() * 3; p.x = (Math.random() - 0.5) * 12; }      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rot * 0.5, p.rot * 0.3, p.rot);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} visible={false}>
      <planeGeometry args={[0.5, 0.7]} />
      <meshStandardMaterial color="#F2B33A" side={THREE.DoubleSide} transparent opacity={0} emissive="#FFCF6B" emissiveIntensity={0.35} />
    </instancedMesh>
  );
};

/* ---------- Section-driven visibility bridge ---------- */
const SceneOrchestrator = () => {
  const btfRef = useRef(0);
  const jfRef = useRef(0);
  const petalRef = useRef(0);

  useFrame(({ camera, clock }, delta) => {
    const p = scrollStore.get().progress;

    btfRef.current = smoothstep(0.32, 0.4, p) * (1 - smoothstep(0.48, 0.56, p));
    jfRef.current = smoothstep(0.48, 0.56, p) * (1 - smoothstep(0.66, 0.72, p));
    petalRef.current = smoothstep(0.8, 0.9, p);

    const targetZ = 5.5 - smoothstep(0.86, 1, p) * 1.2;
    const targetY = 0.4 + Math.sin(clock.elapsedTime * 0.2) * 0.05;
    camera.position.z = damp(camera.position.z, targetZ, 2.5, delta);
    camera.position.y = damp(camera.position.y, targetY, 3, delta);
    camera.lookAt(0, 0.4, 0);
  });

  return (
    <>
      <ambientLight intensity={0.85} color="#FDFBF7" />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#F2A68D" />
      <directionalLight position={[-3, 2, 4]} intensity={0.4} color="#DCD0FF" />
      <Suspense fallback={null}>
        <Butterflies visibleRef={btfRef} />
      </Suspense>
      <Suspense fallback={null}>
        <Jellies visibleRef={jfRef} />
      </Suspense>
      <PetalShower activeRef={petalRef} />
    </>
  );
};

const Scene3D = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5]"
      aria-hidden="true"
      data-testid="scene-3d-canvas"
    >
      <Canvas
        camera={{ position: [0, 0.4, 5.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.6]}
      >
        <SceneOrchestrator />
      </Canvas>
    </div>
  );
};

export default Scene3D;
