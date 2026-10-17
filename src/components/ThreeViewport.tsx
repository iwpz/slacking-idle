import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { COMBAT_ZONES, TIER_META } from '../data/gameData';
import { GameState, PlayerClass, Tier } from '../types/game';

interface ThreeViewportProps {
  gameState: GameState;
  combatPulseRef: React.MutableRefObject<{
    warriorAttackPulse: number;
    hunterAttackPulse: number;
    mageAttackPulse: number;
    enemyHitPulse: number;
    gatherPulse: number;
    craftPulse: number;
  }>;
}

// Pre-allocated math objects at module scope (Zero GC in requestAnimationFrame)
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 1.2, 0);
const _tempColor = new THREE.Color();
const _dummyObj = new THREE.Object3D();

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.68)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.30)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGroundTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#24302c';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 2;
  for (let r = 40; r <= 250; r += 35) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.lineTo(256 + Math.cos(a) * 256, 256 + Math.sin(a) * 256);
    ctx.stroke();
  }

  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle =
      Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(x, y, 3, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  gameState,
  combatPulseRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(gameState);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1614);
    scene.fog = new THREE.FogExp2(0x0b1614, 0.017);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      180
    );
    camera.position.set(0, 14, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isHeadless ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const shadowTex = createContactShadowTexture();
    const groundTex = createGroundTexture(maxAnisotropy);

    // 3-Point Balanced Studio Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.7);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3d6, 2.25);
    keyLight.position.set(14, 24, 16);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    const d = 20;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 60;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
    rimLight.position.set(-16, 12, -14);
    scene.add(rimLight);

    const addContactShadow = (parent: THREE.Group, radius: number) => {
      const mat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.58,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(radius * 2, radius * 2),
        mat
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02;
      parent.add(mesh);
    };

    // =========================================================================
    // 1. REALM ISLAND TERRAIN & NATURAL PERIMETER
    // =========================================================================
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.08,
    });
    const mainIsland = new THREE.Mesh(
      new THREE.CylinderGeometry(24, 21, 2.4, 48),
      groundMat
    );
    mainIsland.position.y = -1.2;
    mainIsland.receiveShadow = true;
    scene.add(mainIsland);

    // Elevated central combat dais
    const arenaDaisMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.4,
    });
    const arenaDais = new THREE.Mesh(
      new THREE.CylinderGeometry(5.8, 6.3, 0.36, 48),
      arenaDaisMat
    );
    arenaDais.position.set(0, 0.18, -3.2);
    arenaDais.receiveShadow = true;
    arenaDais.castShadow = true;
    scene.add(arenaDais);

    const arenaRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const arenaRing = new THREE.Mesh(
      new THREE.RingGeometry(5.1, 5.48, 48),
      arenaRingMat
    );
    arenaRing.rotation.x = -Math.PI / 2;
    arenaRing.position.set(0, 0.37, -3.2);
    scene.add(arenaRing);

    const arenaInnerRuneRing = new THREE.Mesh(
      new THREE.RingGeometry(3.4, 3.55, 36),
      arenaRingMat
    );
    arenaInnerRuneRing.rotation.x = -Math.PI / 2;
    arenaInnerRuneRing.position.set(0, 0.368, -3.2);
    scene.add(arenaInnerRuneRing);

    // Perimeter Trees & Rocks
    const treeCount = 38;
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 1.4, 7);
    trunkGeo.translate(0, 0.7, 0);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.9,
      metalness: 0.05,
    });
    const instancedTrunks = new THREE.InstancedMesh(
      trunkGeo,
      trunkMat,
      treeCount
    );
    instancedTrunks.castShadow = true;
    instancedTrunks.receiveShadow = true;

    const canopyGeo = new THREE.ConeGeometry(0.95, 2.4, 7);
    canopyGeo.translate(0, 2.1, 0);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.65,
      metalness: 0.1,
    });
    const instancedCanopies = new THREE.InstancedMesh(
      canopyGeo,
      canopyMat,
      treeCount
    );
    instancedCanopies.castShadow = true;
    instancedCanopies.receiveShadow = true;

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
      const radius = 15.8 + (Math.random() - 0.5) * 4.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.85 + Math.random() * 0.45;
      _dummyObj.position.set(x, 0, z);
      _dummyObj.rotation.set(0, Math.random() * Math.PI * 2, 0);
      _dummyObj.scale.setScalar(scale);
      _dummyObj.updateMatrix();
      instancedTrunks.setMatrixAt(i, _dummyObj.matrix);
      instancedCanopies.setMatrixAt(i, _dummyObj.matrix);

      _tempColor.setHSL(
        0.38 + (Math.random() - 0.5) * 0.06,
        0.5,
        0.26 + Math.random() * 0.1
      );
      instancedCanopies.setColorAt(i, _tempColor);
    }
    instancedTrunks.instanceMatrix.needsUpdate = true;
    instancedCanopies.instanceMatrix.needsUpdate = true;
    if (instancedCanopies.instanceColor)
      instancedCanopies.instanceColor.needsUpdate = true;
    instancedTrunks.computeBoundingSphere();
    instancedCanopies.computeBoundingSphere();
    scene.add(instancedTrunks);
    scene.add(instancedCanopies);

    const rockCount = 34;
    const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
    rockGeo.translate(0, 0.45, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.82,
      metalness: 0.15,
    });
    const instancedRocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    instancedRocks.castShadow = true;
    instancedRocks.receiveShadow = true;
    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2 + 0.08;
      const radius = 13.8 + (Math.random() - 0.5) * 4.8;
      _dummyObj.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      _dummyObj.rotation.set(
        Math.random() * 0.4,
        Math.random() * Math.PI * 2,
        Math.random() * 0.4
      );
      _dummyObj.scale.set(
        0.7 + Math.random() * 0.8,
        0.6 + Math.random() * 0.9,
        0.7 + Math.random() * 0.8
      );
      _dummyObj.updateMatrix();
      instancedRocks.setMatrixAt(i, _dummyObj.matrix);
    }
    instancedRocks.instanceMatrix.needsUpdate = true;
    instancedRocks.computeBoundingSphere();
    scene.add(instancedRocks);

    // =========================================================================
    // 1B. 8 BESPOKE COMBAT ZONE ARENA ENVIRONMENTS (Following the 8 Zone Names!)
    // =========================================================================
    const zoneSceneryGroups: Record<Tier, THREE.Group> = {} as Record<
      Tier,
      THREE.Group
    >;
    const zoneAnimatedObjects: {
      mesh: THREE.Object3D;
      rotSpeedY?: number;
      rotSpeedZ?: number;
      bobSpeed?: number;
      baseY?: number;
    }[] = [];

    for (let z = 1 as Tier; z <= 8; z = (z + 1) as Tier) {
      const zGroup = new THREE.Group();
      zGroup.position.set(0, 0.36, -3.2);
      zGroup.visible = z === 1;
      scene.add(zGroup);
      zoneSceneryGroups[z] = zGroup;

      if (z === 1) {
        // Zone 1: 微风草甸 (Whispering Meadow) - Ancient Mossy Stone Arch, Standing Emerald Stones & Blooming Flowers
        const stoneMat = new THREE.MeshStandardMaterial({
          color: 0x64748b,
          roughness: 0.78,
        });
        const mossMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          roughness: 0.6,
        });
        const flowerMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xfde047,
          emissiveIntensity: 0.5,
        });

        // North Archway behind arena
        const leftPillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 3.2, 0.65),
          stoneMat
        );
        leftPillar.position.set(-2.2, 1.6, -4.8);
        leftPillar.castShadow = true;
        const rightPillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 3.2, 0.65),
          stoneMat
        );
        rightPillar.position.set(2.2, 1.6, -4.8);
        rightPillar.castShadow = true;
        const archBeam = new THREE.Mesh(
          new THREE.BoxGeometry(5.4, 0.6, 0.8),
          stoneMat
        );
        archBeam.position.set(0, 3.3, -4.8);
        archBeam.castShadow = true;
        const mossCap = new THREE.Mesh(
          new THREE.BoxGeometry(5.5, 0.22, 0.85),
          mossMat
        );
        mossCap.position.set(0, 3.65, -4.8);
        zGroup.add(leftPillar, rightPillar, archBeam, mossCap);

        // Standing Emerald Runestones & Meadow Flowers around rim
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 1.4 - Math.PI * 1.2;
          const r = 5.2;
          const monolith = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.45, 0),
            mossMat
          );
          monolith.position.set(Math.cos(ang) * r, 0.9, Math.sin(ang) * r);
          monolith.scale.set(0.8, 2.2, 0.8);
          zGroup.add(monolith);

          const flower = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.22, 0),
            flowerMat
          );
          flower.position.set(
            Math.cos(ang + 0.2) * (r - 0.5),
            0.25,
            Math.sin(ang + 0.2) * (r - 0.5)
          );
          zGroup.add(flower);
        }
      } else if (z === 2) {
        // Zone 2: 铜幕幽林 (Copperveil Woods) - Gnarled Deadwood Totems, Giant Glowing Amber Mushrooms & Copper Lanterns
        const deadwoodMat = new THREE.MeshStandardMaterial({
          color: 0x451a03,
          roughness: 0.9,
        });
        const shroomCapMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.85,
          roughness: 0.3,
        });
        const shroomStemMat = new THREE.MeshStandardMaterial({
          color: 0xfef3c7,
          roughness: 0.7,
        });

        for (let i = 0; i < 6; i++) {
          const ang = (i / 5) * Math.PI * 1.3 - Math.PI * 1.15;
          const r = 5.15;
          const x = Math.cos(ang) * r;
          const zPos = Math.sin(ang) * r;

          // Twisted Deadwood Spire
          const totem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.38, 3.0, 6),
            deadwoodMat
          );
          totem.position.set(x, 1.5, zPos);
          totem.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.14;
          zGroup.add(totem);

          // Glowing Giant Mushroom cluster
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.18, 0.7, 8),
            shroomStemMat
          );
          stem.position.set(x * 0.88, 0.35, zPos * 0.88);
          const cap = new THREE.Mesh(
            new THREE.SphereGeometry(
              0.48,
              12,
              8,
              0,
              Math.PI * 2,
              0,
              Math.PI * 0.55
            ),
            shroomCapMat
          );
          cap.position.set(x * 0.88, 0.65, zPos * 0.88);
          zGroup.add(stem, cap);
        }
      } else if (z === 3) {
        // Zone 3: 铁炉深窟 (Ironforge Caverns) - Dwarven Obsidian Pillars, Molten Lava Braziers & Rotating Forge Gears
        const obsidianMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.75,
          roughness: 0.3,
        });
        const brassMat = new THREE.MeshStandardMaterial({
          color: 0xd97706,
          metalness: 0.85,
          roughness: 0.25,
        });
        const magmaMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 1.5,
        });

        for (let i = 0; i < 4; i++) {
          const ang = (i / 3) * Math.PI * 1.1 - Math.PI * 1.05;
          const r = 5.2;
          const x = Math.cos(ang) * r;
          const zPos = Math.sin(ang) * r;

          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.55, 2.6, 6),
            obsidianMat
          );
          pillar.position.set(x, 1.3, zPos);
          const lavaBowl = new THREE.Mesh(
            new THREE.SphereGeometry(0.42, 12, 10),
            magmaMat
          );
          lavaBowl.position.set(x, 2.75, zPos);
          zGroup.add(pillar, lavaBowl);
        }

        // Giant Rotating Dwarven Gear behind arena
        const gearRing = new THREE.Mesh(
          new THREE.TorusGeometry(2.1, 0.26, 8, 16),
          brassMat
        );
        gearRing.position.set(0, 2.4, -5.0);
        zGroup.add(gearRing);
        zoneAnimatedObjects.push({ mesh: gearRing, rotSpeedZ: 0.6 });
      } else if (z === 4) {
        // Zone 4: 秘银冰峰 (Mithril Frostpeaks) - Translucent Glacial Ice Spires & Floating Frost Crystals
        const iceMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.4,
          roughness: 0.1,
          metalness: 0.15,
          transmission: 0.65,
          thickness: 1.2,
          clearcoat: 1.0,
        });

        for (let i = 0; i < 7; i++) {
          const ang = (i / 6) * Math.PI * 1.4 - Math.PI * 1.2;
          const r = 5.1;
          const h = 2.2 + (i % 3) * 0.9;
          const spire = new THREE.Mesh(
            new THREE.ConeGeometry(0.55, h, 5),
            iceMat
          );
          spire.position.set(Math.cos(ang) * r, h * 0.5, Math.sin(ang) * r);
          spire.rotation.z = (i - 3) * 0.08;
          zGroup.add(spire);
        }

        const frostStar = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.85, 0),
          iceMat
        );
        frostStar.position.set(0, 3.2, -4.8);
        zGroup.add(frostStar);
        zoneAnimatedObjects.push({
          mesh: frostStar,
          rotSpeedY: 1.2,
          bobSpeed: 2.0,
          baseY: 3.2,
        });
      } else if (z === 5) {
        // Zone 5: 精金深渊 (Adamantite Abyss) - Bioluminescent Abyssal Monoliths & Eldritch Void Crystals
        const abyssStoneMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.4,
          metalness: 0.6,
        });
        const bioTealMat = new THREE.MeshStandardMaterial({
          color: 0x14b8a6,
          emissive: 0x0d9488,
          emissiveIntensity: 1.3,
        });

        for (let i = 0; i < 6; i++) {
          const ang = (i / 5) * Math.PI * 1.35 - Math.PI * 1.18;
          const r = 5.2;
          const obelisk = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 3.2, 0.5),
            abyssStoneMat
          );
          obelisk.position.set(Math.cos(ang) * r, 1.6, Math.sin(ang) * r);
          obelisk.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.18;
          zGroup.add(obelisk);

          const orb = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.32, 0),
            bioTealMat
          );
          const baseY = 3.5 + (i % 2) * 0.3;
          orb.position.set(Math.cos(ang) * r, baseY, Math.sin(ang) * r);
          zGroup.add(orb);
          zoneAnimatedObjects.push({
            mesh: orb,
            rotSpeedY: 1.8,
            bobSpeed: 2.5,
            baseY,
          });
        }
      } else if (z === 6) {
        // Zone 6: 符文天城 (Runic Sky-Citadel) - Marble Celestial Pillars & Giant Rotating Arcane Astrolabe Rings
        const marbleMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.25,
          metalness: 0.2,
        });
        const runeGoldMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xd97706,
          emissiveIntensity: 0.6,
          metalness: 0.9,
          roughness: 0.15,
        });
        const arcaneVioletMat = new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x9333ea,
          emissiveIntensity: 1.2,
        });

        for (let i = 0; i < 6; i++) {
          const ang = (i / 5) * Math.PI * 1.3 - Math.PI * 1.15;
          const r = 5.25;
          const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.38, 3.0, 12),
            marbleMat
          );
          col.position.set(Math.cos(ang) * r, 1.5, Math.sin(ang) * r);
          const cap = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.25, 0.85),
            runeGoldMat
          );
          cap.position.set(Math.cos(ang) * r, 3.05, Math.sin(ang) * r);
          zGroup.add(col, cap);
        }

        const astroOuter = new THREE.Mesh(
          new THREE.TorusGeometry(2.3, 0.08, 10, 36),
          runeGoldMat
        );
        astroOuter.position.set(0, 2.8, -4.9);
        const astroInner = new THREE.Mesh(
          new THREE.TorusGeometry(1.6, 0.07, 10, 32),
          arcaneVioletMat
        );
        astroInner.position.set(0, 2.8, -4.9);
        zGroup.add(astroOuter, astroInner);
        zoneAnimatedObjects.push({
          mesh: astroOuter,
          rotSpeedZ: 0.8,
          rotSpeedY: 0.4,
        });
        zoneAnimatedObjects.push({
          mesh: astroInner,
          rotSpeedZ: -1.2,
          rotSpeedY: -0.7,
        });
      } else if (z === 7) {
        // Zone 7: 龙骨火山 (Dragonbone Caldera) - Giant Curved Dragon Ribcage Bones & Volcanic Hellfire Vents
        const boneMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          roughness: 0.55,
          metalness: 0.1,
        });
        const lavaGlowMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xdc2626,
          emissiveIntensity: 1.6,
        });

        for (let i = 0; i < 6; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const pairIdx = Math.floor(i / 2);
          const rib = new THREE.Mesh(
            new THREE.TorusGeometry(2.8, 0.22, 8, 20, Math.PI * 0.55),
            boneMat
          );
          rib.position.set(side * 2.6, 0.2, -1.8 - pairIdx * 1.4);
          rib.rotation.z = side === -1 ? Math.PI * 0.15 : Math.PI * 0.3;
          zGroup.add(rib);
        }

        const lavaPool = new THREE.Mesh(
          new THREE.RingGeometry(4.2, 4.9, 32),
          lavaGlowMat
        );
        lavaPool.rotation.x = -Math.PI / 2;
        lavaPool.position.set(0, 0.03, 0);
        zGroup.add(lavaPool);
      } else if (z === 8) {
        // Zone 8: 星界虚空圣殿 (Astral Void Sanctum) - Cosmic Star-Gate Portal, Orbiting Nebula Rings & Dimensional Pylons
        const astralPinkMat = new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: 1.5,
        });
        const cosmicGoldMat = new THREE.MeshStandardMaterial({
          color: 0xfde047,
          emissive: 0xeab308,
          emissiveIntensity: 1.1,
          metalness: 0.9,
          roughness: 0.1,
        });

        const stargateRing1 = new THREE.Mesh(
          new THREE.TorusGeometry(2.8, 0.11, 12, 48),
          astralPinkMat
        );
        stargateRing1.position.set(0, 2.9, -4.8);
        const stargateRing2 = new THREE.Mesh(
          new THREE.TorusGeometry(2.1, 0.08, 12, 48),
          cosmicGoldMat
        );
        stargateRing2.position.set(0, 2.9, -4.8);
        zGroup.add(stargateRing1, stargateRing2);
        zoneAnimatedObjects.push({
          mesh: stargateRing1,
          rotSpeedZ: 1.1,
          rotSpeedY: 0.5,
        });
        zoneAnimatedObjects.push({
          mesh: stargateRing2,
          rotSpeedZ: -1.5,
          rotSpeedY: -0.9,
        });

        for (let i = 0; i < 6; i++) {
          const ang = (i / 5) * Math.PI * 1.35 - Math.PI * 1.18;
          const r = 5.2;
          const shard = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.48, 0),
            i % 2 === 0 ? astralPinkMat : cosmicGoldMat
          );
          const baseY = 1.8 + (i % 2) * 0.6;
          shard.position.set(Math.cos(ang) * r, baseY, Math.sin(ang) * r);
          shard.scale.set(0.65, 2.4, 0.65);
          zGroup.add(shard);
          zoneAnimatedObjects.push({
            mesh: shard,
            rotSpeedY: 1.5,
            bobSpeed: 2.2,
            baseY,
          });
        }
      }
    }

    // =========================================================================
    // 2. REFINED 3-HERO ADVENTURING SQUAD MODELS
    // - Hero group has rotation.y = Math.PI / 2, so in Hero Local Space:
    //   +Z = Forward (toward monsters on the right)
    //   +Y = Straight Up (Vertical)
    //   +X = Hero's Left Side | -X = Hero's Right Side
    // =========================================================================
    const sharedDarkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.65,
      roughness: 0.4,
    });
    const sharedLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.75,
      metalness: 0.1,
    });
    const sharedGoldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
      metalness: 0.9,
      roughness: 0.2,
    });
    const sharedSkinMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      roughness: 0.5,
      metalness: 0.05,
    });
    const eyeDarkMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const torsoShape = new THREE.Shape();
    torsoShape.moveTo(-0.32, 0);
    torsoShape.lineTo(0.32, 0);
    torsoShape.lineTo(0.4, 0.72);
    torsoShape.lineTo(-0.4, 0.72);
    torsoShape.closePath();
    const sharedTorsoGeo = new THREE.ExtrudeGeometry(torsoShape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    sharedTorsoGeo.center();

    // -------------------------------------------------------------------------
    // 2A. WARRIOR (Heavy Vanguard Knight: Plumed Greathelm, Cape, Tower Shield & Runic Greatsword)
    // -------------------------------------------------------------------------
    const buildWarriorHero = (baseX: number, baseZ: number, scale: number) => {
      const group = new THREE.Group();
      group.position.set(baseX, 0.36, baseZ);
      group.rotation.y = Math.PI / 2;
      group.scale.setScalar(scale);
      addContactShadow(group, 1.05);

      const armorMat = new THREE.MeshPhysicalMaterial({
        color: 0xd97706,
        metalness: 0.85,
        roughness: 0.2,
        clearcoat: 0.5,
      });
      const weaponMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        metalness: 0.9,
        roughness: 0.14,
        clearcoat: 0.6,
      });
      const capeMat = new THREE.MeshStandardMaterial({
        color: 0xb91c1c,
        roughness: 0.7,
        side: THREE.DoubleSide,
      });

      // Armored Greaves & Knee Guards
      const bootGeo = new THREE.CapsuleGeometry(0.14, 0.34, 4, 8);
      const leftLeg = new THREE.Mesh(bootGeo, sharedDarkMetalMat);
      leftLeg.position.set(-0.19, 0.32, 0);
      leftLeg.castShadow = true;
      const rightLeg = new THREE.Mesh(bootGeo, sharedDarkMetalMat);
      rightLeg.position.set(0.19, 0.32, 0);
      rightLeg.castShadow = true;
      const kneeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.12);
      const leftKnee = new THREE.Mesh(kneeGeo, sharedGoldTrimMat);
      leftKnee.position.set(-0.19, 0.42, 0.12);
      const rightKnee = new THREE.Mesh(kneeGeo, sharedGoldTrimMat);
      rightKnee.position.set(0.19, 0.42, 0.12);
      group.add(leftLeg, rightLeg, leftKnee, rightKnee);

      // Torso Cuirass + Gold Waist Belt + Chest Emblem
      const torsoMesh = new THREE.Mesh(sharedTorsoGeo, armorMat);
      torsoMesh.position.set(0, 0.95, 0);
      torsoMesh.castShadow = true;
      const beltMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.74, 0.14, 0.42),
        sharedGoldTrimMat
      );
      beltMesh.position.set(0, 0.64, 0);
      const chestCrest = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14, 0),
        sharedGoldTrimMat
      );
      chestCrest.position.set(0, 1.02, 0.22);
      group.add(torsoMesh, beltMesh, chestCrest);

      // Flowing Crimson Battle Cape on Back (-Z)
      const capeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 1.08, 0.05),
        capeMat
      );
      capeMesh.position.set(0, 0.76, -0.24);
      capeMesh.rotation.x = 0.18;
      group.add(capeMesh);

      // Multi-layered Lion Pauldrons
      const pauldronGeo = new THREE.SphereGeometry(
        0.26,
        14,
        10,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.65
      );
      const leftPauldron = new THREE.Mesh(pauldronGeo, armorMat);
      leftPauldron.position.set(-0.48, 1.24, 0);
      leftPauldron.rotation.z = 0.35;
      const rightPauldron = new THREE.Mesh(pauldronGeo, armorMat);
      rightPauldron.position.set(0.48, 1.24, 0);
      rightPauldron.rotation.z = -0.35;
      const pauldronRimGeo = new THREE.TorusGeometry(0.24, 0.035, 6, 16);
      const leftRim = new THREE.Mesh(pauldronRimGeo, sharedGoldTrimMat);
      leftRim.position.set(-0.48, 1.18, 0);
      leftRim.rotation.x = Math.PI / 2;
      const rightRim = new THREE.Mesh(pauldronRimGeo, sharedGoldTrimMat);
      rightRim.position.set(0.48, 1.18, 0);
      rightRim.rotation.x = Math.PI / 2;
      group.add(leftPauldron, rightPauldron, leftRim, rightRim);

      // Knight Greathelm with Visor Slit & Sweeping Crimson Plume
      const helmBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.27, 0.42, 12),
        armorMat
      );
      helmBase.position.set(0, 1.56, 0);
      const helmCrown = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.18, 12),
        sharedGoldTrimMat
      );
      helmCrown.position.set(0, 1.84, 0);
      const visorSlit = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.06, 0.12),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: 1.5,
        })
      );
      visorSlit.position.set(0, 1.58, 0.22);
      const plumeCrest = new THREE.Mesh(
        new THREE.TorusGeometry(0.26, 0.075, 8, 16, Math.PI * 0.85),
        capeMat
      );
      plumeCrest.rotation.y = Math.PI / 2;
      plumeCrest.position.set(0, 1.88, -0.05);
      group.add(helmBase, helmCrown, visorSlit, plumeCrest);

      // Left Arm: Ornate Tower Shield with Golden Cross
      const shieldGroup = new THREE.Group();
      shieldGroup.position.set(0.52, 0.92, 0.25);
      shieldGroup.rotation.y = 0.25;
      const shieldPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.88, 0.62),
        armorMat
      );
      const shieldBorder = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.94, 0.68),
        sharedGoldTrimMat
      );
      shieldBorder.position.x = -0.01;
      const shieldCrossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.72, 0.1),
        sharedGoldTrimMat
      );
      const shieldCrossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.1, 0.46),
        sharedGoldTrimMat
      );
      shieldGroup.add(shieldPlate, shieldBorder, shieldCrossV, shieldCrossH);
      group.add(shieldGroup);

      // Right Arm (-X): Runic Greatsword
      const weaponArmPivot = new THREE.Group();
      weaponArmPivot.position.set(-0.52, 1.12, 0.12);

      const pommel = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.08, 0),
        sharedGoldTrimMat
      );
      pommel.position.y = -0.18;
      const hilt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.055, 0.34, 8),
        sharedLeatherMat
      );
      const crossguard = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.09, 0.12),
        sharedGoldTrimMat
      );
      crossguard.position.y = 0.18;
      const blade = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 1.42, 4),
        weaponMat
      );
      blade.position.y = 0.88;
      blade.scale.set(1, 1, 0.32);
      const bladeRuneCore = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.95, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
      );
      bladeRuneCore.position.y = 0.68;
      weaponArmPivot.add(pommel, hilt, crossguard, blade, bladeRuneCore);
      weaponArmPivot.rotation.x = Math.PI / 4;
      group.add(weaponArmPivot);

      scene.add(group);
      return {
        group,
        armorMat,
        weaponMat,
        weaponArmPivot,
        baseX,
        baseZ,
      };
    };

    // -------------------------------------------------------------------------
    // 2B. HUNTER (Sylvan Dragon-Stalker Ranger: Quiver, Hood, Cloak & VERTICAL Bow with Dynamic Draw!)
    // -------------------------------------------------------------------------
    const buildHunterHero = (baseX: number, baseZ: number, scale: number) => {
      const group = new THREE.Group();
      group.position.set(baseX, 0.36, baseZ);
      group.rotation.y = Math.PI / 2;
      group.scale.setScalar(scale);
      addContactShadow(group, 0.95);

      const armorMat = new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        metalness: 0.28,
        roughness: 0.5,
        clearcoat: 0.2,
      });
      const weaponMat = new THREE.MeshPhysicalMaterial({
        color: 0x34d399,
        metalness: 0.75,
        roughness: 0.2,
        clearcoat: 0.5,
      });
      const cloakMat = new THREE.MeshStandardMaterial({
        color: 0x064e3b,
        roughness: 0.75,
        side: THREE.DoubleSide,
      });

      // Agile Leather Boots
      const bootGeo = new THREE.CapsuleGeometry(0.12, 0.32, 4, 8);
      const leftLeg = new THREE.Mesh(bootGeo, sharedLeatherMat);
      leftLeg.position.set(-0.17, 0.3, 0);
      leftLeg.castShadow = true;
      const rightLeg = new THREE.Mesh(bootGeo, sharedLeatherMat);
      rightLeg.position.set(0.17, 0.3, 0);
      rightLeg.castShadow = true;
      group.add(leftLeg, rightLeg);

      // Ranger Leather Tunic + Diagonal Quiver Strap
      const torsoMesh = new THREE.Mesh(sharedTorsoGeo, armorMat);
      torsoMesh.position.set(0, 0.92, 0);
      torsoMesh.castShadow = true;
      const chestStrap = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.09, 0.4),
        sharedLeatherMat
      );
      chestStrap.position.set(0, 0.95, 0);
      chestStrap.rotation.z = 0.55;
      group.add(torsoMesh, chestStrap);

      // Woodland Cloak & Back Quiver filled with Feathered Arrows
      const cloakMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 1.05, 8, 1, true, Math.PI * 0.6, Math.PI * 0.8),
        cloakMat
      );
      cloakMesh.position.set(0, 0.82, -0.12);
      group.add(cloakMesh);

      const quiverGroup = new THREE.Group();
      quiverGroup.position.set(-0.18, 1.05, -0.26);
      quiverGroup.rotation.z = -0.32;
      const quiverTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.09, 0.62, 10),
        sharedLeatherMat
      );
      quiverGroup.add(quiverTube);
      for (let a = 0; a < 3; a++) {
        const qArrow = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6),
          sharedGoldTrimMat
        );
        qArrow.position.set((a - 1) * 0.04, 0.35, 0);
        const qFeather = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.12, 4),
          new THREE.MeshBasicMaterial({ color: 0x34d399 })
        );
        qFeather.position.set((a - 1) * 0.04, 0.48, 0);
        quiverGroup.add(qArrow, qFeather);
      }
      group.add(quiverGroup);

      // Asymmetric Ranger Shoulder Guards
      const pauldronGeo = new THREE.SphereGeometry(
        0.21,
        12,
        10,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.6
      );
      const leftPauldron = new THREE.Mesh(pauldronGeo, armorMat);
      leftPauldron.position.set(-0.42, 1.2, 0);
      leftPauldron.rotation.z = 0.35;
      const rightPauldron = new THREE.Mesh(pauldronGeo, sharedLeatherMat);
      rightPauldron.position.set(0.42, 1.2, 0);
      rightPauldron.rotation.z = -0.35;
      group.add(leftPauldron, rightPauldron);

      // Head + Face Mask + Hood + Hawk Feather
      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.23, 14, 14),
        sharedSkinMat
      );
      headMesh.position.set(0, 1.5, 0);
      const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 8, 8),
        eyeDarkMat
      );
      leftEye.position.set(-0.08, 1.53, 0.21);
      const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 8, 8),
        eyeDarkMat
      );
      rightEye.position.set(0.08, 1.53, 0.21);
      const rangerMask = new THREE.Mesh(
        new THREE.CylinderGeometry(0.235, 0.22, 0.16, 12),
        cloakMat
      );
      rangerMask.position.set(0, 1.43, 0.02);
      const hood = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.44, 10),
        armorMat
      );
      hood.position.set(0, 1.7, -0.02);
      hood.rotation.x = -0.15;
      const featherPlume = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.38, 4),
        sharedGoldTrimMat
      );
      featherPlume.position.set(0.2, 1.78, -0.08);
      featherPlume.rotation.x = -0.45;
      featherPlume.rotation.z = -0.25;
      group.add(headMesh, leftEye, rightEye, rangerMask, hood, featherPlume);

      // =====================================================================
      // VERTICAL BOW IN FRONT OF HUNTER:
      // - Bow Wood Apex curves FORWARD (+Z, toward the enemy)
      // - Bowstring is on the BACK side (Z = 0 -> drawn back to -Z toward Hunter's chest!)
      // - Strictly vertical along the Y axis (Top Tip at +Y, Bottom Tip at -Y)
      // =====================================================================
      const bowHolderGroup = new THREE.Group();
      // Positioned in front of the Hunter's torso (+Z = 0.36) at chest/shoulder height (Y = 1.12)
      bowHolderGroup.position.set(0.12, 1.12, 0.36);

      // Left Arm extending forward (+Z) to grip the front of the bow wood (at Z = +0.56)
      const leftBowArm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.075, 0.48, 4, 8),
        sharedLeatherMat
      );
      leftBowArm.rotation.x = Math.PI / 2;
      leftBowArm.position.set(0.16, -0.02, 0.24);
      bowHolderGroup.add(leftBowArm);

      // Transform TorusGeometry(0.60, 0.046, 10, 28, Math.PI) directly in geometry space:
      // 1) rotateZ(PI/2): puts u=0 at (0, +0.60, 0) [Top Tip], u=PI at (0, -0.60, 0) [Bottom Tip], u=PI/2 at (-0.60, 0, 0)
      // 2) rotateY(PI/2): keeps Top/Bottom tips at (0, ±0.60, 0) and moves the Bow Wood Apex to (0, 0, +0.60) [Forward toward enemy!]
      const verticalBowGeo = new THREE.TorusGeometry(0.6, 0.046, 10, 28, Math.PI);
      verticalBowGeo.rotateZ(Math.PI / 2);
      verticalBowGeo.rotateY(Math.PI / 2);
      const bowArc = new THREE.Mesh(verticalBowGeo, weaponMat);
      bowHolderGroup.add(bowArc);

      // Gold Recurve Tips at Top (+Y, Z=0) & Bottom (-Y, Z=0) + Leather Central Grip at Front Apex (Z = +0.60)
      const bowGrip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.24, 10),
        sharedGoldTrimMat
      );
      bowGrip.position.set(0, 0, 0.6);
      const topTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.16, 6),
        sharedGoldTrimMat
      );
      topTip.position.set(0, 0.62, 0);
      const botTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.16, 6),
        sharedGoldTrimMat
      );
      botTip.rotation.x = Math.PI;
      botTip.position.set(0, -0.62, 0);
      bowHolderGroup.add(bowGrip, topTip, botTip);

      // Dynamic 2-Segment Vertical Bowstring on the Hunter's side (Z = 0, pulled back to negative Z!)
      const stringMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      const upperString = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6),
        stringMat
      );
      const lowerString = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6),
        stringMat
      );
      bowHolderGroup.add(upperString, lowerString);

      // Nocked Arrow + Right Draw Hand (Fletching at string Z=drawZ, Arrowhead extending forward past the bow wood at Z=+0.60!)
      const nockedArrowGroup = new THREE.Group();
      const nockedShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.96, 6),
        sharedGoldTrimMat
      );
      nockedShaft.rotation.x = Math.PI / 2;
      nockedShaft.position.z = 0.48;
      const nockedHead = new THREE.Mesh(
        new THREE.ConeGeometry(0.065, 0.22, 6),
        new THREE.MeshBasicMaterial({ color: 0x34d399 })
      );
      nockedHead.rotation.x = Math.PI / 2;
      nockedHead.position.z = 1.02;
      const nockedFeather = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.14),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      nockedFeather.position.z = 0.06;
      const drawHand = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 8, 8),
        sharedSkinMat
      );
      drawHand.position.set(-0.06, 0, -0.02);
      nockedArrowGroup.add(nockedShaft, nockedHead, nockedFeather, drawHand);
      bowHolderGroup.add(nockedArrowGroup);

      group.add(bowHolderGroup);
      scene.add(group);

      return {
        group,
        armorMat,
        weaponMat,
        bowHolderGroup,
        upperString,
        lowerString,
        nockedArrowGroup,
        baseX,
        baseZ,
      };
    };

    // -------------------------------------------------------------------------
    // 2C. MAGE (Astral Archmage: Spire Hat, Halo, Floating Grimoire & Orbiting Crystal Staff)
    // -------------------------------------------------------------------------
    const buildMageHero = (baseX: number, baseZ: number, scale: number) => {
      const group = new THREE.Group();
      group.position.set(baseX, 0.36, baseZ);
      group.rotation.y = Math.PI / 2;
      group.scale.setScalar(scale);
      addContactShadow(group, 1.0);

      const armorMat = new THREE.MeshPhysicalMaterial({
        color: 0xa855f7,
        metalness: 0.25,
        roughness: 0.45,
        clearcoat: 0.35,
      });
      const weaponMat = new THREE.MeshPhysicalMaterial({
        color: 0xc084fc,
        metalness: 0.85,
        roughness: 0.15,
        clearcoat: 0.6,
      });
      const arcaneGlowMat = new THREE.MeshStandardMaterial({
        color: 0xe879f9,
        emissive: 0xc084fc,
        emissiveIntensity: 1.8,
      });

      // Layered Archmage Robe Skirt + Gold Rune Sash
      const robeSkirt = new THREE.Mesh(
        new THREE.ConeGeometry(0.46, 0.78, 12),
        armorMat
      );
      robeSkirt.position.set(0, 0.42, 0);
      robeSkirt.castShadow = true;
      const robeGoldHem = new THREE.Mesh(
        new THREE.TorusGeometry(0.44, 0.035, 8, 24),
        sharedGoldTrimMat
      );
      robeGoldHem.rotation.x = Math.PI / 2;
      robeGoldHem.position.set(0, 0.08, 0);
      const torsoMesh = new THREE.Mesh(sharedTorsoGeo, armorMat);
      torsoMesh.position.set(0, 0.95, 0);
      torsoMesh.castShadow = true;
      const runeSash = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.72, 0.04),
        sharedGoldTrimMat
      );
      runeSash.position.set(0, 0.48, 0.22);
      runeSash.rotation.x = -0.18;
      group.add(robeSkirt, robeGoldHem, torsoMesh, runeSash);

      // Levitating Arcane Shoulder Crystals & Mantle
      const leftCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 0),
        arcaneGlowMat
      );
      leftCrystal.position.set(-0.52, 1.32, 0);
      const rightCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 0),
        arcaneGlowMat
      );
      rightCrystal.position.set(0.52, 1.32, 0);
      group.add(leftCrystal, rightCrystal);

      // Head + Glowing Arcane Eyes + Archmage Spire Hat + Floating Golden Halo
      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.23, 14, 14),
        sharedSkinMat
      );
      headMesh.position.set(0, 1.5, 0);
      const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 8, 8),
        arcaneGlowMat
      );
      leftEye.position.set(-0.08, 1.52, 0.21);
      const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 8, 8),
        arcaneGlowMat
      );
      rightEye.position.set(0.08, 1.52, 0.21);

      const hatBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.46, 0.04, 20),
        armorMat
      );
      hatBrim.position.set(0, 1.66, 0);
      const hatBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.27, 0.09, 16),
        sharedGoldTrimMat
      );
      hatBand.position.set(0, 1.71, 0);
      const hatCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.62, 14),
        armorMat
      );
      hatCone.position.set(0, 2.0, -0.04);
      hatCone.rotation.x = -0.18;

      const mageHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.025, 8, 24),
        sharedGoldTrimMat
      );
      mageHalo.position.set(0, 1.62, -0.22);
      group.add(
        headMesh,
        leftEye,
        rightEye,
        hatBrim,
        hatBand,
        hatCone,
        mageHalo
      );

      // Left Side: Floating Open Grimoire (Spellbook)
      const grimoireGroup = new THREE.Group();
      grimoireGroup.position.set(0.48, 1.08, 0.35);
      const bookCoverL = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.04, 0.3),
        armorMat
      );
      bookCoverL.position.x = -0.1;
      bookCoverL.rotation.z = 0.3;
      const bookCoverR = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.04, 0.3),
        armorMat
      );
      bookCoverR.position.x = 0.1;
      bookCoverR.rotation.z = -0.3;
      const bookPages = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.05, 0.26),
        new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
      );
      bookPages.position.y = 0.03;
      grimoireGroup.add(bookCoverL, bookCoverR, bookPages);
      group.add(grimoireGroup);

      // Right Side: Ornate Archmage Staff with Orbiting Crystal Ring
      const weaponArmPivot = new THREE.Group();
      weaponArmPivot.position.set(-0.48, 1.1, 0.15);

      const staffShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 1.62, 10),
        sharedGoldTrimMat
      );
      staffShaft.position.y = 0.54;
      const staffCrownOuter = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.038, 8, 20),
        weaponMat
      );
      staffCrownOuter.position.y = 1.42;
      const staffCrownInner = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.025, 8, 16),
        sharedGoldTrimMat
      );
      staffCrownInner.position.y = 1.42;
      staffCrownInner.rotation.y = Math.PI / 2;
      const staffOrb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14, 1),
        arcaneGlowMat
      );
      staffOrb.position.y = 1.42;

      weaponArmPivot.add(
        staffShaft,
        staffCrownOuter,
        staffCrownInner,
        staffOrb
      );
      weaponArmPivot.rotation.x = Math.PI / 6;
      group.add(weaponArmPivot);

      scene.add(group);
      return {
        group,
        armorMat,
        weaponMat,
        weaponArmPivot,
        staffOrb,
        staffCrownInner,
        grimoireGroup,
        mageHalo,
        leftCrystal,
        rightCrystal,
        baseX,
        baseZ,
      };
    };

    const warriorHero = buildWarriorHero(-1.25, -3.2, 1.02);
    const hunterHero = buildHunterHero(-2.65, -1.85, 0.94);
    const mageHero = buildMageHero(-2.65, -4.55, 0.94);

    // =========================================================================
    // 2D. COMBAT ATTACK PROJECTILES & SLASH EFFECTS
    // =========================================================================
    // 1. Warrior Melee Cleave Arc
    const warriorSlashMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const warriorSlashMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.75, 24, 1, -Math.PI * 0.45, Math.PI * 0.9),
      warriorSlashMat
    );
    warriorSlashMesh.rotation.x = -Math.PI / 2;
    warriorSlashMesh.position.set(0.6, 1.1, -3.2);
    scene.add(warriorSlashMesh);

    // 2. Hunter 3D Arrow Projectile (Strictly pointing toward +X along flight path)
    const hunterArrowGroup = new THREE.Group();
    hunterArrowGroup.rotation.order = 'YZX';
    const arrowShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 1.15, 8),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.4 })
    );
    arrowShaft.rotation.z = -Math.PI / 2;

    // Prominent forward-pointing arrowhead at +X (rotation.z = -Math.PI/2 sends Cone +Y tip to +X)
    const arrowHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.42, 4),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    arrowHead.rotation.z = -Math.PI / 2;
    arrowHead.rotation.x = Math.PI / 4;
    arrowHead.position.x = 0.72;

    // Crossed flat fletching feathers at tail (-X), narrow in front and flaring toward back
    const featherMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
    });
    const featherFinH = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.015, 0.14),
      featherMat
    );
    featherFinH.position.x = -0.48;
    const featherFinV = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.14, 0.015),
      featherMat
    );
    featherFinV.position.x = -0.48;

    hunterArrowGroup.add(arrowShaft, arrowHead, featherFinH, featherFinV);
    hunterArrowGroup.visible = false;
    scene.add(hunterArrowGroup);

    // 3. Mage 3D Arcane Projectile Orb + AOE Explosion Nova Ring
    const mageOrbGroup = new THREE.Group();
    const orbCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 1),
      new THREE.MeshBasicMaterial({ color: 0xe879f9 })
    );
    const orbAura = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 14, 14),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.58,
      })
    );
    mageOrbGroup.add(orbCore, orbAura);
    mageOrbGroup.visible = false;
    scene.add(mageOrbGroup);

    const mageNovaMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const mageNovaRing = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 2.3, 32),
      mageNovaMat
    );
    mageNovaRing.rotation.x = -Math.PI / 2;
    mageNovaRing.position.set(1.9, 0.45, -3.2);
    scene.add(mageNovaRing);

    // =========================================================================
    // 3. REFINED ZONE-SPECIFIC MONSTER PACKS & BOSSES (8 Distinct Archetypes!)
    // =========================================================================
    const monsterCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.35,
      transmission: 0.38,
      thickness: 1.0,
      clearcoat: 1.0,
    });
    const monsterArmorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.78,
    });
    const monsterEyeMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 1.8,
    });
    const monsterGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.5,
    });

    const buildMonsterSlot = (baseX: number, baseZ: number) => {
      const grp = new THREE.Group();
      grp.position.set(baseX, 0.36, baseZ);
      grp.rotation.y = -Math.PI / 2; // Facing -X (toward the 3-Hero Squad)
      addContactShadow(grp, 1.18);

      const animGroup = new THREE.Group();
      grp.add(animGroup);

      // Boss Crown (Visible on Stage 10 Boss or Pack Leader)
      const bossCrown = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.34, 0.065, 36, 8, 2, 3),
        sharedGoldTrimMat
      );
      bossCrown.position.set(0, 2.15, 0);
      bossCrown.rotation.x = Math.PI / 2;
      animGroup.add(bossCrown);

      const zoneBodies: Record<Tier, THREE.Group> = {} as Record<
        Tier,
        THREE.Group
      >;
      const wingGroups: THREE.Object3D[] = [];
      const spinGroups: THREE.Object3D[] = [];

      // --- Zone 1: 翡翠森林史莱姆 (Emerald Slime with Inner Nucleus & Droplets) ---
      const z1 = new THREE.Group();
      const slimeDome = new THREE.Mesh(
        new THREE.SphereGeometry(
          0.88,
          20,
          16,
          0,
          Math.PI * 2,
          0,
          Math.PI * 0.68
        ),
        monsterCoreMat
      );
      slimeDome.position.y = 0.15;
      slimeDome.scale.set(1.05, 0.95, 1.05);
      const slimeNucleus = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        sharedGoldTrimMat
      );
      slimeNucleus.position.set(0, 0.55, 0);
      spinGroups.push(slimeNucleus);
      const sEyeL = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 10, 10),
        monsterEyeMat
      );
      sEyeL.position.set(-0.26, 0.65, 0.72);
      const sEyeR = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 10, 10),
        monsterEyeMat
      );
      sEyeR.position.set(0.26, 0.65, 0.72);
      z1.add(slimeDome, slimeNucleus, sEyeL, sEyeR);
      zoneBodies[1] = z1;
      animGroup.add(z1);

      // --- Zone 2: 重甲枯木树精 (Armored Treant with Bark Torso, Antler Branches & Amber Eyes) ---
      const z2 = new THREE.Group();
      const treantTrunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.72, 1.45, 7),
        trunkMat
      );
      treantTrunk.position.y = 0.75;
      const treantBarkPlate = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.62, 0),
        monsterCoreMat
      );
      treantBarkPlate.position.set(0, 1.05, 0.15);
      const tBranchL = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.95, 5),
        trunkMat
      );
      tBranchL.position.set(-0.62, 1.55, 0);
      tBranchL.rotation.z = 0.55;
      const tBranchR = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.95, 5),
        trunkMat
      );
      tBranchR.position.set(0.62, 1.55, 0);
      tBranchR.rotation.z = -0.55;
      const tEyeL = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        monsterEyeMat
      );
      tEyeL.position.set(-0.22, 1.15, 0.68);
      const tEyeR = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        monsterEyeMat
      );
      tEyeR.position.set(0.22, 1.15, 0.68);
      z2.add(
        treantTrunk,
        treantBarkPlate,
        tBranchL,
        tBranchR,
        tEyeL,
        tEyeR
      );
      zoneBodies[2] = z2;
      animGroup.add(z2);

      // --- Zone 3: 黑曜石机械魔像 (Obsidian Golem with Furnace Core & Piston Fists) ---
      const z3 = new THREE.Group();
      const golemChest = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 1.1, 0.85),
        monsterArmorMat
      );
      golemChest.position.y = 1.05;
      const golemCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.38, 1),
        monsterGlowMat
      );
      golemCore.position.set(0, 1.05, 0.35);
      const gFistL = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.75, 0.45),
        monsterCoreMat
      );
      gFistL.position.set(-0.85, 0.85, 0.2);
      const gFistR = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.75, 0.45),
        monsterCoreMat
      );
      gFistR.position.set(0.85, 0.85, 0.2);
      const gVisor = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.12, 0.2),
        monsterEyeMat
      );
      gVisor.position.set(0, 1.42, 0.42);
      z3.add(golemChest, golemCore, gFistL, gFistR, gVisor);
      zoneBodies[3] = z3;
      animGroup.add(z3);

      // --- Zone 4: 极寒秘银飞龙 (Frostscale Wyvern with Articulated Wings & Horned Head) ---
      const z4 = new THREE.Group();
      const wyvernBody = new THREE.Mesh(
        new THREE.ConeGeometry(0.58, 1.45, 6),
        monsterCoreMat
      );
      wyvernBody.position.y = 1.05;
      wyvernBody.rotation.x = Math.PI * 0.15;
      const wyvernHead = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.65, 5),
        monsterCoreMat
      );
      wyvernHead.position.set(0, 1.58, 0.42);
      wyvernHead.rotation.x = Math.PI * 0.45;
      const wWingL = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.08, 0.65),
        monsterCoreMat
      );
      wWingL.position.set(-0.78, 1.32, -0.1);
      wWingL.rotation.z = 0.35;
      const wWingR = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.08, 0.65),
        monsterCoreMat
      );
      wWingR.position.set(0.78, 1.32, -0.1);
      wWingR.rotation.z = -0.35;
      wingGroups.push(wWingL, wWingR);
      const wEyeL = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        monsterEyeMat
      );
      wEyeL.position.set(-0.16, 1.65, 0.55);
      const wEyeR = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        monsterEyeMat
      );
      wEyeR.position.set(0.16, 1.65, 0.55);
      z4.add(wyvernBody, wyvernHead, wWingL, wWingR, wEyeL, wEyeR);
      zoneBodies[4] = z4;
      animGroup.add(z4);

      // --- Zone 5: 深渊蚀骨巨兽 (Abyssal Behemoth with Dorsal Spines & Multi-Eyes) ---
      const z5 = new THREE.Group();
      const abyssShell = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.84, 1),
        monsterArmorMat
      );
      abyssShell.position.y = 0.98;
      const abyssMaw = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.12, 8, 16),
        monsterCoreMat
      );
      abyssMaw.position.set(0, 0.95, 0.68);
      for (let e = 0; e < 4; e++) {
        const aEye = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          monsterEyeMat
        );
        aEye.position.set((e - 1.5) * 0.22, 1.38 + (e % 2) * 0.12, 0.65);
        z5.add(aEye);
      }
      const dorsalL = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.85, 5),
        monsterCoreMat
      );
      dorsalL.position.set(-0.55, 1.55, -0.2);
      dorsalL.rotation.z = 0.4;
      const dorsalR = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.85, 5),
        monsterCoreMat
      );
      dorsalR.position.set(0.55, 1.55, -0.2);
      dorsalR.rotation.z = -0.4;
      z5.add(abyssShell, abyssMaw, dorsalL, dorsalR);
      zoneBodies[5] = z5;
      animGroup.add(z5);

      // --- Zone 6: 奥术符文裁决者 (Runic Arbiter with Interlocking Gyro Rings) ---
      const z6 = new THREE.Group();
      const arbiterCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.58, 0),
        monsterCoreMat
      );
      arbiterCore.position.y = 1.15;
      const gyro1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.06, 8, 24),
        sharedGoldTrimMat
      );
      gyro1.position.y = 1.15;
      const gyro2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.76, 0.05, 8, 24),
        monsterArmorMat
      );
      gyro2.position.y = 1.15;
      gyro2.rotation.x = Math.PI / 3;
      spinGroups.push(arbiterCore, gyro1, gyro2);
      z6.add(arbiterCore, gyro1, gyro2);
      zoneBodies[6] = z6;
      animGroup.add(z6);

      // --- Zone 7: 炼狱骸骨炎龙 (Hellfire Dread-Drake with Curved Horns & Magma Wings) ---
      const z7 = new THREE.Group();
      const drakeChest = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.78, 0),
        monsterArmorMat
      );
      drakeChest.position.y = 1.05;
      const drakeHeart = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 12, 12),
        monsterGlowMat
      );
      drakeHeart.position.set(0, 1.05, 0.35);
      const hornL = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.85, 6),
        sharedGoldTrimMat
      );
      hornL.position.set(-0.45, 1.72, 0.2);
      hornL.rotation.z = 0.45;
      const hornR = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.85, 6),
        sharedGoldTrimMat
      );
      hornR.position.set(0.45, 1.72, 0.2);
      hornR.rotation.z = -0.45;
      const dWingL = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 1.45, 4),
        monsterCoreMat
      );
      dWingL.position.set(-0.95, 1.35, -0.15);
      dWingL.rotation.z = 0.85;
      const dWingR = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 1.45, 4),
        monsterCoreMat
      );
      dWingR.position.set(0.95, 1.35, -0.15);
      dWingR.rotation.z = -0.85;
      wingGroups.push(dWingL, dWingR);
      z7.add(drakeChest, drakeHeart, hornL, hornR, dWingL, dWingR);
      zoneBodies[7] = z7;
      animGroup.add(z7);

      // --- Zone 8: 星界炽天使统御者 (Astral 6-Winged Seraph Archon) ---
      const z8 = new THREE.Group();
      const seraphCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 1),
        monsterEyeMat
      );
      seraphCore.position.y = 1.22;
      const seraphHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.98, 0.055, 10, 32),
        sharedGoldTrimMat
      );
      seraphHalo.position.y = 1.22;
      spinGroups.push(seraphCore, seraphHalo);
      for (let w = 0; w < 6; w++) {
        const ang = (w / 6) * Math.PI * 2;
        const wing = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 1.15, 4),
          monsterCoreMat
        );
        wing.position.set(
          Math.cos(ang) * 0.75,
          1.22 + Math.sin(ang) * 0.75,
          -0.15
        );
        wing.rotation.z = ang - Math.PI / 2;
        z8.add(wing);
      }
      z8.add(seraphCore, seraphHalo);
      zoneBodies[8] = z8;
      animGroup.add(z8);

      scene.add(grp);
      return {
        grp,
        animGroup,
        bossCrown,
        zoneBodies,
        wingGroups,
        spinGroups,
        baseX,
        baseZ,
      };
    };

    // 5 Monster Pack Slots on the right side of the Combat Arena
    const monsterPackSlots = [
      buildMonsterSlot(1.75, -3.2), // Center Lead / Boss Slot (#0)
      buildMonsterSlot(2.15, -1.95), // Front-Left Mob (#1)
      buildMonsterSlot(2.15, -4.45), // Front-Right Mob (#2)
      buildMonsterSlot(3.05, -2.55), // Back-Left Mob (#3)
      buildMonsterSlot(3.05, -3.85), // Back-Right Mob (#4)
    ];

    // =========================================================================
    // 4. GATHERING STATIONS (Left & Front-Left Quadrant)
    // =========================================================================
    const miningGroup = new THREE.Group();
    miningGroup.position.set(-7.2, 0, 2.5);
    addContactShadow(miningGroup, 2.2);

    const mineBaseRock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.35, 0),
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.85,
        metalness: 0.2,
      })
    );
    mineBaseRock.position.y = 0.75;
    mineBaseRock.scale.set(1.3, 0.9, 1.1);
    mineBaseRock.castShadow = true;
    miningGroup.add(mineBaseRock);

    const oreCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      metalness: 0.75,
      roughness: 0.15,
      clearcoat: 0.8,
    });
    for (let c = 0; c < 4; c++) {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.42 + c * 0.08, 0),
        oreCrystalMat
      );
      crystal.position.set(
        (c - 1.5) * 0.45,
        1.15 + (c % 2) * 0.25,
        0.25 + (c % 2) * 0.2
      );
      crystal.rotation.set(c * 0.3, c * 0.6, (c - 1.5) * 0.25);
      crystal.scale.set(0.7, 1.8, 0.7);
      crystal.castShadow = true;
      miningGroup.add(crystal);
    }

    const pickaxePivot = new THREE.Group();
    pickaxePivot.position.set(1.25, 1.1, 0.6);
    const pickHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8),
      trunkMat
    );
    pickHandle.position.y = 0.5;
    const pickHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.85, 4),
      warriorHero.weaponMat
    );
    pickHead.position.y = 1.05;
    pickHead.rotation.z = Math.PI / 2;
    pickaxePivot.add(pickHandle, pickHead);
    miningGroup.add(pickaxePivot);
    scene.add(miningGroup);

    const loggingGroup = new THREE.Group();
    loggingGroup.position.set(-4.2, 0, 6.2);
    addContactShadow(loggingGroup, 2.0);

    const heroTreeTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.55, 2.2, 10),
      trunkMat
    );
    heroTreeTrunk.position.y = 1.1;
    heroTreeTrunk.castShadow = true;
    loggingGroup.add(heroTreeTrunk);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.6,
      metalness: 0.1,
    });
    for (let l = 0; l < 3; l++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.45 - l * 0.32, 1.5, 9),
        foliageMat
      );
      cone.position.y = 2.1 + l * 0.85;
      cone.castShadow = true;
      loggingGroup.add(cone);
    }

    const axePivot = new THREE.Group();
    axePivot.position.set(1.05, 0.9, 0.5);
    const axeHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8),
      trunkMat
    );
    axeHandle.position.y = 0.45;
    const axeBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.28, 0.08),
      warriorHero.weaponMat
    );
    axeBlade.position.set(-0.18, 0.9, 0);
    axePivot.add(axeHandle, axeBlade);
    loggingGroup.add(axePivot);
    scene.add(loggingGroup);

    const fishingGroup = new THREE.Group();
    fishingGroup.position.set(0, 0, 7.2);
    addContactShadow(fishingGroup, 2.6);

    const pondRim = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.28, 12, 32),
      rockMat
    );
    pondRim.rotation.x = Math.PI / 2;
    pondRim.position.y = 0.14;
    pondRim.receiveShadow = true;
    fishingGroup.add(pondRim);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.12,
      metalness: 0.15,
      transmission: 0.65,
      thickness: 0.8,
      clearcoat: 1.0,
    });
    const waterDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.02, 32),
      waterMat
    );
    waterDisc.rotation.x = -Math.PI / 2;
    waterDisc.position.y = 0.18;
    fishingGroup.add(waterDisc);

    const pierDeck = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.14, 1.8),
      trunkMat
    );
    pierDeck.position.set(0, 0.42, -1.5);
    pierDeck.castShadow = true;
    fishingGroup.add(pierDeck);

    const bobberMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xf43f5e,
        emissiveIntensity: 0.5,
      })
    );
    bobberMesh.position.set(0, 0.25, 0.3);
    fishingGroup.add(bobberMesh);
    scene.add(fishingGroup);

    // =========================================================================
    // 5. CRAFTING WORKSHOPS (Right & Front-Right Quadrant)
    // =========================================================================
    const smithingGroup = new THREE.Group();
    smithingGroup.position.set(6.8, 0, 2.5);
    addContactShadow(smithingGroup, 2.2);

    const furnaceBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.15, 1.8, 8),
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.75,
        metalness: 0.35,
      })
    );
    furnaceBody.position.set(-0.6, 0.9, -0.4);
    furnaceBody.castShadow = true;
    smithingGroup.add(furnaceBody);

    const furnaceCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xf97316,
        emissiveIntensity: 1.5,
      })
    );
    furnaceCore.position.set(-0.4, 0.65, 0.25);
    smithingGroup.add(furnaceCore);

    const anvilBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.55, 0.5),
      monsterArmorMat
    );
    anvilBase.position.set(0.75, 0.28, 0.4);
    anvilBase.castShadow = true;
    const anvilHorn = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.6, 4),
      monsterArmorMat
    );
    anvilHorn.rotation.z = -Math.PI / 2;
    anvilHorn.position.set(1.22, 0.44, 0.4);
    smithingGroup.add(anvilBase, anvilHorn);

    const hammerPivot = new THREE.Group();
    hammerPivot.position.set(0.75, 1.05, 0.4);
    const hShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8),
      trunkMat
    );
    hShaft.position.y = 0.32;
    const hHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.22, 0.22),
      warriorHero.weaponMat
    );
    hHead.position.y = 0.68;
    hammerPivot.add(hShaft, hHead);
    smithingGroup.add(hammerPivot);
    scene.add(smithingGroup);

    const artisanGroup = new THREE.Group();
    artisanGroup.position.set(4.5, 0, 6.0);
    addContactShadow(artisanGroup, 2.1);

    const cauldronMesh = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.75,
        16,
        12,
        0,
        Math.PI * 2,
        0.35,
        Math.PI * 0.65
      ),
      monsterArmorMat
    );
    cauldronMesh.position.set(0, 0.65, 0);
    cauldronMesh.castShadow = true;
    artisanGroup.add(cauldronMesh);

    const soupGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.68, 20),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xf43f5e,
        emissiveIntensity: 0.9,
      })
    );
    soupGlow.rotation.x = -Math.PI / 2;
    soupGlow.position.set(0, 0.88, 0);
    artisanGroup.add(soupGlow);

    const loomWheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.06, 8, 20),
      trunkMat
    );
    loomWheel.position.set(1.35, 0.85, -0.3);
    loomWheel.castShadow = true;
    artisanGroup.add(loomWheel);

    scene.add(artisanGroup);

    // =========================================================================
    // 5B. ENDGAME WONDER: MONUMENT OF ETERNAL SLACKING (摸鱼创世神碑, 3 Stages)
    // =========================================================================
    const monumentGroup = new THREE.Group();
    monumentGroup.position.set(0, 0, 2.2);
    scene.add(monumentGroup);

    // Stage 1: Octagonal Golden Slacking Foundation
    const monStage1 = new THREE.Group();
    const monBase1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 2.2, 0.45, 8),
      sharedGoldTrimMat
    );
    monBase1.position.y = 0.22;
    const monBase2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.65, 0.4, 8),
      sharedDarkMetalMat
    );
    monBase2.position.y = 0.62;
    monStage1.add(monBase1, monBase2);
    monumentGroup.add(monStage1);

    // Stage 2: Towering Astral Perpetual Obelisk & Star Rings
    const monStage2 = new THREE.Group();
    const monObelisk = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 4.2, 4),
      sharedGoldTrimMat
    );
    monObelisk.position.y = 2.8;
    const monRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.06, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    monRing1.position.y = 2.8;
    const monRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.05, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    monRing2.position.y = 2.8;
    monStage2.add(monObelisk, monRing1, monRing2);
    monumentGroup.add(monStage2);

    // Stage 3: Crown of Eternal Slacking + Skyward Astral Pillar of Light!
    const monStage3 = new THREE.Group();
    const monCrown = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.68, 1),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    monCrown.position.y = 5.4;
    const monSkyBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.85, 28, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      })
    );
    monSkyBeam.position.y = 14;
    monStage3.add(monCrown, monSkyBeam);
    monumentGroup.add(monStage3);

    renderer.compile(scene, camera);

    // Interactive Pointer Orbit Offset
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let orbitYaw = 0;
    let orbitPitch = 0;
    let zoomDistMultiplier = 1.0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      orbitYaw -= dx * 0.005;
      orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.004, -0.35, 0.45);
    };
    const onPointerUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      zoomDistMultiplier = THREE.MathUtils.clamp(
        zoomDistMultiplier + e.deltaY * 0.0008,
        0.65,
        1.45
      );
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // =========================================================================
    // 6. ANIMATION LOOP
    // =========================================================================
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;
      const pulses = combatPulseRef.current;

      pulses.warriorAttackPulse = THREE.MathUtils.damp(
        pulses.warriorAttackPulse,
        0,
        7.5,
        dt
      );
      pulses.hunterAttackPulse = THREE.MathUtils.damp(
        pulses.hunterAttackPulse,
        0,
        8.5,
        dt
      );
      pulses.mageAttackPulse = THREE.MathUtils.damp(
        pulses.mageAttackPulse,
        0,
        7.0,
        dt
      );
      pulses.enemyHitPulse = THREE.MathUtils.damp(
        pulses.enemyHitPulse,
        0,
        10,
        dt
      );
      pulses.gatherPulse = THREE.MathUtils.damp(pulses.gatherPulse, 0, 8, dt);
      pulses.craftPulse = THREE.MathUtils.damp(pulses.craftPulse, 0, 8, dt);

      const curZone = st.combat.currentZone;
      const zInfo = COMBAT_ZONES[curZone - 1];

      // Progressive Visibility of Recruited Heroes & Unlocked Stations
      const hunterUnlocked = Boolean(st.progression?.unlockedHeroes?.hunter);
      const mageUnlocked = Boolean(st.progression?.unlockedHeroes?.mage);
      hunterHero.group.visible = hunterUnlocked;
      mageHero.group.visible = mageUnlocked;

      loggingGroup.visible = Boolean(st.progression?.loggingLineUnlocked);
      fishingGroup.visible = Boolean(st.progression?.fishingLineUnlocked);
      smithingGroup.visible = Boolean(st.progression?.craftingUnlocked);
      artisanGroup.visible = Boolean(
        st.progression?.loggingLineUnlocked ||
          st.progression?.foragingLineUnlocked
      );

      // Endgame Monument Visibility & Animation
      const mStage = st.progression?.monumentStage || 0;
      monStage1.visible = mStage >= 1;
      monStage2.visible = mStage >= 2;
      monStage3.visible = mStage >= 3;
      if (mStage >= 2) {
        monRing1.rotation.x = elapsed * 1.4;
        monRing1.rotation.y = elapsed * 0.9;
        monRing2.rotation.y = -elapsed * 1.6;
        monRing2.rotation.z = elapsed * 1.1;
      }
      if (mStage >= 3) {
        monCrown.rotation.y = elapsed * 2.2;
        monCrown.position.y = 5.4 + Math.sin(elapsed * 3.0) * 0.18;
      }

      // 1. Update Active Zone Scenery & Ground/Atmosphere Theme
      for (let z = 1 as Tier; z <= 8; z = (z + 1) as Tier) {
        zoneSceneryGroups[z].visible = z === curZone;
      }
      for (const animItem of zoneAnimatedObjects) {
        if (animItem.rotSpeedY) {
          animItem.mesh.rotation.y = elapsed * animItem.rotSpeedY;
        }
        if (animItem.rotSpeedZ) {
          animItem.mesh.rotation.z = elapsed * animItem.rotSpeedZ;
        }
        if (animItem.bobSpeed && animItem.baseY !== undefined) {
          animItem.mesh.position.y =
            animItem.baseY + Math.sin(elapsed * animItem.bobSpeed) * 0.16;
        }
      }

      _tempColor.setHex(zInfo.fogHex);
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(_tempColor, 1 - Math.exp(-3 * dt));
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(_tempColor, 1 - Math.exp(-3 * dt));
      }

      _tempColor.setHex(zInfo.groundHex);
      groundMat.color.lerp(_tempColor, 1 - Math.exp(-4 * dt));

      _tempColor.setHex(zInfo.accentHex);
      monsterCoreMat.color.lerp(_tempColor, 1 - Math.exp(-5 * dt));
      arenaRingMat.color.lerp(_tempColor, 1 - Math.exp(-5 * dt));
      arenaRingMat.emissive.lerp(_tempColor, 1 - Math.exp(-5 * dt));

      // Update Squad Equipment Colors
      const squadPairs = [
        { hero: warriorHero, loadout: st.classLoadouts.warrior },
        { hero: hunterHero, loadout: st.classLoadouts.hunter },
        { hero: mageHero, loadout: st.classLoadouts.mage },
      ];
      for (const item of squadPairs) {
        if (item.loadout.armor) {
          _tempColor.set(item.loadout.armor.colorHex);
          item.hero.armorMat.color.lerp(_tempColor, 1 - Math.exp(-6 * dt));
        }
        if (item.loadout.weapon) {
          _tempColor.set(item.loadout.weapon.colorHex);
          item.hero.weaponMat.color.lerp(_tempColor, 1 - Math.exp(-6 * dt));
        }
      }

      // 2. WARRIOR ANIMATION: Lunges forward to melee cleave with Greatsword!
      const wPulse = pulses.warriorAttackPulse;
      const wLunge = Math.sin(wPulse * Math.PI) * 1.45;
      warriorHero.group.position.x = warriorHero.baseX + wLunge;
      warriorHero.group.position.y =
        0.36 + Math.abs(Math.sin(elapsed * 3.2)) * 0.05;
      warriorHero.weaponArmPivot.rotation.x =
        Math.PI / 4 + Math.sin(wPulse * Math.PI) * 1.55;
      warriorSlashMat.opacity = wPulse * 0.85;
      warriorSlashMesh.scale.setScalar(0.8 + (1 - wPulse) * 0.55);

      // 3. HUNTER ANIMATION: Holds Bow Strictly VERTICAL & Dynamically Draws Bowstring + Nocked Arrow!
      const hPulse = pulses.hunterAttackPulse;
      hunterHero.group.position.x = hunterHero.baseX; // Stationary ranged archer
      hunterHero.group.position.y =
        0.36 + Math.abs(Math.sin(elapsed * 3.2 + 2.0)) * 0.04;

      const rawDraw = st.combat.isFighting ? st.combat.hunterAttackTimer : 0.35;
      const drawProgress = hPulse > 0.25 ? 0 : Math.min(1, rawDraw * 1.15);
      const drawZ = -drawProgress * 0.42;

      const halfLen = Math.hypot(0.6, drawZ);
      const stringTiltAngle = Math.atan2(-drawZ, 0.6);
      hunterHero.upperString.position.set(0, 0.3, drawZ * 0.5);
      hunterHero.upperString.scale.set(1, halfLen / 0.62, 1);
      hunterHero.upperString.rotation.x = stringTiltAngle;

      hunterHero.lowerString.position.set(0, -0.3, drawZ * 0.5);
      hunterHero.lowerString.scale.set(1, halfLen / 0.62, 1);
      hunterHero.lowerString.rotation.x = -stringTiltAngle;

      hunterHero.nockedArrowGroup.visible = hunterUnlocked && hPulse <= 0.35;
      hunterHero.nockedArrowGroup.position.set(0, 0, drawZ);

      if (hunterUnlocked && hPulse > 0.04) {
        hunterArrowGroup.visible = true;
        const tProj = 1 - hPulse;
        const x0 = hunterHero.baseX + 0.65;
        const y0 = 1.42;
        const z0 = hunterHero.baseZ;
        const x1 = 1.85;
        const y1 = 1.32;
        const z1 = -3.2;

        hunterArrowGroup.position.set(
          THREE.MathUtils.lerp(x0, x1, tProj),
          THREE.MathUtils.lerp(y0, y1, tProj) +
            Math.sin(tProj * Math.PI) * 0.32,
          THREE.MathUtils.lerp(z0, z1, tProj)
        );

        const vx = x1 - x0;
        const vz = z1 - z0;
        const vy = y1 - y0 + Math.cos(tProj * Math.PI) * Math.PI * 0.32;
        hunterArrowGroup.rotation.y = Math.atan2(-vz, vx);
        hunterArrowGroup.rotation.z = Math.atan2(vy, Math.hypot(vx, vz));
      } else {
        hunterArrowGroup.visible = false;
      }

      // 4. MAGE ANIMATION: Stays ranged, levitates Grimoire & Crystals, raises Staff & fires Arcane Projectile!
      const mPulse = pulses.mageAttackPulse;
      mageHero.group.position.x = mageHero.baseX;
      mageHero.group.position.y =
        0.36 + Math.abs(Math.sin(elapsed * 3.2 + 4.0)) * 0.05;
      mageHero.weaponArmPivot.rotation.x =
        Math.PI / 6 - Math.sin(mPulse * Math.PI) * 0.55;
      mageHero.staffOrb.rotation.y = elapsed * 3.5;
      mageHero.staffCrownInner.rotation.z = elapsed * 2.5;
      mageHero.mageHalo.rotation.z = elapsed * 1.2;
      mageHero.grimoireGroup.position.y =
        1.08 + Math.sin(elapsed * 3.0) * 0.06;
      mageHero.leftCrystal.position.y =
        1.32 + Math.sin(elapsed * 2.6) * 0.06;
      mageHero.rightCrystal.position.y =
        1.32 + Math.cos(elapsed * 2.6) * 0.06;

      if (mageUnlocked && mPulse > 0.04) {
        mageOrbGroup.visible = true;
        const tProj = 1 - mPulse;
        mageOrbGroup.position.set(
          THREE.MathUtils.lerp(mageHero.baseX + 0.5, 2.1, tProj),
          1.55 + Math.sin(tProj * Math.PI) * 0.65,
          THREE.MathUtils.lerp(mageHero.baseZ, -3.2, tProj)
        );
        mageOrbGroup.rotation.y = elapsed * 8;
        mageOrbGroup.rotation.x = elapsed * 6;

        mageNovaMat.opacity = Math.sin(mPulse * Math.PI) * 0.78;
        mageNovaRing.scale.setScalar(0.5 + tProj * 1.45);
      } else {
        mageOrbGroup.visible = false;
        mageNovaMat.opacity = 0;
      }

      // Update Mining Crystal Color to match Active Gathering Tier
      const mineTierColor = TIER_META[st.activeGatheringTier || 1].threeColor;
      _tempColor.setHex(mineTierColor);
      oreCrystalMat.color.lerp(_tempColor, 1 - Math.exp(-5 * dt));
      oreCrystalMat.emissive.lerp(_tempColor, 1 - Math.exp(-5 * dt));

      // 5. Update Zone-Specific Monster Pack (Stages 1-9) vs Boss (Stage 10)
      const isBoss = st.combat.stageInZone === 10;
      const aliveCount = Math.max(1, st.combat.enemiesAlive || 1);

      for (let i = 0; i < monsterPackSlots.length; i++) {
        const slot = monsterPackSlots[i];
        const isVisible = isBoss ? i === 0 : i < aliveCount;
        slot.grp.visible = isVisible;

        if (isVisible) {
          for (let z = 1 as Tier; z <= 8; z = (z + 1) as Tier) {
            slot.zoneBodies[z].visible = z === curZone;
          }

          const baseScale = isBoss ? 1.38 : 0.74;
          const hitSquash = 1 - pulses.enemyHitPulse * 0.2;
          slot.grp.scale.set(
            baseScale * (1 + pulses.enemyHitPulse * 0.14),
            baseScale * hitSquash,
            baseScale * (1 + pulses.enemyHitPulse * 0.14)
          );
          slot.grp.position.x = slot.baseX + pulses.enemyHitPulse * 0.32;
          slot.animGroup.position.y =
            Math.sin(elapsed * 2.8 + i * 1.3) * 0.09;

          slot.bossCrown.visible = isBoss || i === 0;
          slot.bossCrown.rotation.z = elapsed * 1.5;

          for (let wIdx = 0; wIdx < slot.wingGroups.length; wIdx++) {
            const wObj = slot.wingGroups[wIdx];
            const sideSign = wIdx % 2 === 0 ? 1 : -1;
            wObj.rotation.y =
              sideSign * Math.sin(elapsed * 5.2 + i) * 0.28;
          }
          for (const spObj of slot.spinGroups) {
            spObj.rotation.y = elapsed * 1.8;
            spObj.rotation.z = elapsed * 1.1;
          }
        }
      }

      // Gathering & Crafting Station Animations
      const anyMiningActive = Object.values(st.activities.mining.tiers).some(
        (n) => n.isRunning || n.npcHired
      );
      pickaxePivot.rotation.z = anyMiningActive
        ? Math.sin(elapsed * 6.5) * 0.65
        : 0.2;

      const anyLoggingActive = Object.values(st.activities.logging.tiers).some(
        (n) => n.isRunning || n.npcHired
      );
      axePivot.rotation.z = anyLoggingActive
        ? Math.sin(elapsed * 6.0) * 0.6
        : 0.15;

      bobberMesh.position.y = 0.22 + Math.sin(elapsed * 3.8) * 0.08;

      const anySmithActive =
        st.equipmentForge.isCrafting ||
        Object.values(st.activities.smithing.tiers).some(
          (n) => n.isRunning || n.npcHired
        );
      hammerPivot.rotation.z = anySmithActive
        ? Math.abs(Math.sin(elapsed * 7.5)) * 0.85
        : 0.1;

      loomWheel.rotation.z = elapsed * 2.2;

      // Smooth Camera Presets
      const focus = st.cameraFocus;
      if (focus === 'combat') {
        _camTargetPos.set(0, 6.4, 5.8);
        _camLookTarget.set(0.2, 1.3, -3.2);
      } else if (focus === 'gathering') {
        _camTargetPos.set(-8.5, 7.5, 11.5);
        _camLookTarget.set(-4.2, 1.0, 4.8);
      } else if (focus === 'crafting') {
        _camTargetPos.set(8.5, 7.5, 11.5);
        _camLookTarget.set(5.2, 1.0, 4.2);
      } else {
        _camTargetPos.set(0, 11.5, 16.5);
        _camLookTarget.set(0, 0.8, 1.2);
      }

      const offsetVec = _camTargetPos.clone().sub(_camLookTarget);
      offsetVec.multiplyScalar(zoomDistMultiplier);
      offsetVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitYaw);
      offsetVec.y = Math.max(2.2, offsetVec.y + orbitPitch * 8);

      const finalCamPos = _camLookTarget.clone().add(offsetVec);
      const dampFactor = 1 - Math.exp(-5.5 * dt);
      camera.position.lerp(finalCamPos, dampFactor);
      _currentLookAt.lerp(_camLookTarget, dampFactor);
      camera.lookAt(_currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [combatPulseRef]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0"
      aria-label="3D Game Realm Viewport"
    />
  );
};
