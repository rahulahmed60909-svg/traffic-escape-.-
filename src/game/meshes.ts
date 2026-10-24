import * as THREE from "three";
import { CollectibleKind, ObstacleKind } from "./types";
import { GameTextureAtlas } from "./textures";

export interface PlayerRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  torso: THREE.Mesh;
  headGroup: THREE.Group;
  scarfLeft: THREE.Mesh;
  scarfRight: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  shadow: THREE.Mesh;
  shieldAura: THREE.Mesh;
  magnetRing: THREE.Mesh;
}

const sharedGeos = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  wheel: new THREE.CylinderGeometry(0.42, 0.42, 0.28, 14),
  thinWheel: new THREE.CylinderGeometry(0.52, 0.52, 0.08, 16),
  sphere: new THREE.SphereGeometry(0.5, 14, 12),
  coin: new THREE.CylinderGeometry(0.48, 0.48, 0.13, 20),
  torus: new THREE.TorusGeometry(0.65, 0.09, 10, 24),
  magnetArch: new THREE.TorusGeometry(0.34, 0.11, 10, 18, Math.PI),
  chaiCup: new THREE.CylinderGeometry(0.36, 0.25, 0.62, 16),
  chaiTop: new THREE.CircleGeometry(0.33, 16),
  umbrellaCone: new THREE.ConeGeometry(1.35, 0.65, 8),
};

const staticMats = {
  wheelDark: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 }),
  headlight: new THREE.MeshBasicMaterial({ color: 0xfffbeb }),
  taillight: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  beaconAmber: new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
  silver: new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.5,
    roughness: 0.35,
  }),
  spokeMetal: new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.6,
    roughness: 0.3,
  }),
  busRoof: new THREE.MeshStandardMaterial({ color: 0xffb800, roughness: 0.5 }),
  cngGreen: new THREE.MeshStandardMaterial({ color: 0x008f4c, roughness: 0.4 }),
  hoodBlack: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }),
  yellowTrim: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }),
  glassBlue: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
    metalness: 0.3,
  }),
  cabinDarkGlass: new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.15,
    metalness: 0.5,
  }),
  seatRed: new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.45 }),
  goldFrame: new THREE.MeshStandardMaterial({ color: 0xffb800, roughness: 0.35 }),
  pullerShirt: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 }),
  pullerSkin: new THREE.MeshStandardMaterial({ color: 0xb97a45, roughness: 0.65 }),
  carVariants: [
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.15 }),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.15 }),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.15 }),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.15 }),
  ],
  postOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 }),
  pillarYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 }),
  coinEdge: new THREE.MeshStandardMaterial({
    color: 0xffb800,
    metalness: 0.65,
    roughness: 0.22,
    emissive: 0x78350f,
    emissiveIntensity: 0.4,
  }),
  magnetRed: new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x7f1d1d,
    roughness: 0.3,
  }),
  magnetTip: new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.8,
    roughness: 0.2,
  }),
  magnetHalo: new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65,
  }),
  clayCup: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 }),
  teaSurface: new THREE.MeshBasicMaterial({ color: 0xfde68a }),
  chaiHalo: new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.75,
  }),
  clearanceGlow: new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
  }),
};

interface CachedAtlasMaterials {
  busSides: THREE.MeshStandardMaterial[];
  busFront: THREE.MeshStandardMaterial;
  rickshawHood: THREE.MeshStandardMaterial;
  hazardLow: THREE.MeshStandardMaterial;
  overheadSign: THREE.MeshStandardMaterial;
  coinFace: THREE.MeshStandardMaterial;
}

let cachedAtlasMats: CachedAtlasMaterials | null = null;

function getAtlasMaterials(atlas: GameTextureAtlas): CachedAtlasMaterials {
  if (cachedAtlasMats) return cachedAtlasMats;
  cachedAtlasMats = {
    busSides: atlas.busSides.map(
      (tex) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 })
    ),
    busFront: new THREE.MeshStandardMaterial({ map: atlas.busFront, roughness: 0.45 }),
    rickshawHood: new THREE.MeshStandardMaterial({
      map: atlas.rickshawHood,
      roughness: 0.5,
    }),
    hazardLow: new THREE.MeshStandardMaterial({ map: atlas.hazardLow, roughness: 0.4 }),
    overheadSign: new THREE.MeshStandardMaterial({
      map: atlas.overheadSign,
      roughness: 0.4,
    }),
    coinFace: new THREE.MeshStandardMaterial({
      map: atlas.takaCoin,
      metalness: 0.45,
      roughness: 0.28,
      emissive: 0x451a03,
      emissiveIntensity: 0.3,
    }),
  };
  return cachedAtlasMats;
}

export function createSkyBackdrop(): THREE.Group {
  const skyGroup = new THREE.Group();

  // Gradient canvas sky backdrop far in distance
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#1E1B4B"); // Deep twilight indigo zenith
  grad.addColorStop(0.38, "#6D28D9"); // Royal dusk violet
  grad.addColorStop(0.68, "#F43F5E"); // Dhaka sunset crimson-coral
  grad.addColorStop(0.88, "#FB923C"); // Warm marigold horizon
  grad.addColorStop(1, "#FF9458"); // Matches scene fog seamlessly
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);

  const skyTex = new THREE.CanvasTexture(c);
  skyTex.colorSpace = THREE.SRGBColorSpace;

  const skyPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(380, 140),
    new THREE.MeshBasicMaterial({ map: skyTex, fog: false, depthWrite: false })
  );
  skyPlane.position.set(0, 52, -175);
  skyPlane.renderOrder = -2;
  skyGroup.add(skyPlane);

  // Glowing golden sun disc + soft halo
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(13, 28),
    new THREE.MeshBasicMaterial({
      color: 0xffe680,
      fog: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  sunDisc.position.set(5, 25, -172);
  sunDisc.renderOrder = -1;
  skyGroup.add(sunDisc);

  const sunHalo = new THREE.Mesh(
    new THREE.CircleGeometry(24, 28),
    new THREE.MeshBasicMaterial({
      color: 0xff9e5e,
      fog: false,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
  );
  sunHalo.position.set(5, 25, -173);
  sunHalo.renderOrder = -1;
  skyGroup.add(sunHalo);

  return skyGroup;
}

export function createPlayerRig(): PlayerRig {
  const root = new THREE.Group();

  // Ground shadow disc (stays at y = 0.03)
  const shadowGeo = new THREE.CircleGeometry(0.62, 20);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x090d16,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = 0.03;
  root.add(shadow);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc68652,
    roughness: 0.65,
  });
  const kurtaMat = new THREE.MeshStandardMaterial({
    color: 0x00a878,
    roughness: 0.45,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xffb800,
    roughness: 0.4,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0xf42a41,
    roughness: 0.4,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x14161f,
    roughness: 0.8,
  });
  const headbandMat = new THREE.MeshStandardMaterial({
    color: 0xf42a41,
    emissive: 0x450a0a,
    roughness: 0.4,
  });

  // Torso
  const torso = new THREE.Mesh(sharedGeos.box, kurtaMat);
  torso.scale.set(0.62, 0.72, 0.36);
  torso.position.y = 1.06;
  torso.castShadow = true;
  bodyPivot.add(torso);

  // Gold vest stripe / collar accent
  const trim = new THREE.Mesh(sharedGeos.box, collarMat);
  trim.scale.set(0.64, 0.12, 0.38);
  trim.position.y = 1.34;
  bodyPivot.add(trim);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.62;
  bodyPivot.add(headGroup);

  const head = new THREE.Mesh(sharedGeos.box, skinMat);
  head.scale.set(0.44, 0.44, 0.44);
  head.castShadow = true;
  headGroup.add(head);

  const hair = new THREE.Mesh(sharedGeos.box, hairMat);
  hair.scale.set(0.48, 0.22, 0.48);
  hair.position.set(0, 0.18, 0.01);
  headGroup.add(hair);

  // Red sporty headband + fluttering tails
  const band = new THREE.Mesh(sharedGeos.box, headbandMat);
  band.scale.set(0.47, 0.09, 0.47);
  band.position.set(0, 0.07, 0);
  headGroup.add(band);

  const scarfLeft = new THREE.Mesh(sharedGeos.box, headbandMat);
  scarfLeft.scale.set(0.09, 0.07, 0.45);
  scarfLeft.position.set(-0.08, 0.05, 0.38);
  headGroup.add(scarfLeft);

  const scarfRight = new THREE.Mesh(sharedGeos.box, collarMat);
  scarfRight.scale.set(0.08, 0.06, 0.38);
  scarfRight.position.set(0.08, 0.03, 0.35);
  headGroup.add(scarfRight);

  const makeArm = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.41, 1.34, 0);

    const sleeve = new THREE.Mesh(sharedGeos.box, kurtaMat);
    sleeve.scale.set(0.19, 0.24, 0.2);
    sleeve.position.y = -0.1;
    pivot.add(sleeve);

    const forearm = new THREE.Mesh(sharedGeos.box, skinMat);
    forearm.scale.set(0.16, 0.36, 0.16);
    forearm.position.y = -0.34;
    forearm.castShadow = true;
    pivot.add(forearm);

    bodyPivot.add(pivot);
    return pivot;
  };

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const makeLeg = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.17, 0.72, 0);

    const leg = new THREE.Mesh(sharedGeos.box, pantsMat);
    leg.scale.set(0.22, 0.58, 0.24);
    leg.position.y = -0.29;
    leg.castShadow = true;
    pivot.add(leg);

    const shoe = new THREE.Mesh(sharedGeos.box, shoeMat);
    shoe.scale.set(0.24, 0.16, 0.36);
    shoe.position.set(0, -0.62, -0.05);
    pivot.add(shoe);

    bodyPivot.add(pivot);
    return pivot;
  };

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0xffb800,
    transparent: true,
    opacity: 0.28,
  });
  const shieldAura = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 18, 14),
    shieldMat
  );
  shieldAura.position.y = 1.05;
  shieldAura.visible = false;
  root.add(shieldAura);

  const magnetMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
  });
  const magnetRing = new THREE.Mesh(sharedGeos.torus, magnetMat);
  magnetRing.rotation.x = Math.PI / 2;
  magnetRing.position.y = 0.95;
  magnetRing.visible = false;
  root.add(magnetRing);

  return {
    root,
    bodyPivot,
    torso,
    headGroup,
    scarfLeft,
    scarfRight,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    shadow,
    shieldAura,
    magnetRing,
  };
}

export function createObstacleMesh(
  kind: ObstacleKind,
  atlas: GameTextureAtlas,
  variantIndex: number = 0
): THREE.Group {
  const group = new THREE.Group();
  const mats = getAtlasMaterials(atlas);

  if (kind === "bus") {
    const sideMat = mats.busSides[variantIndex % mats.busSides.length];
    const materials = [
      sideMat,
      sideMat,
      staticMats.busRoof,
      staticMats.wheelDark,
      mats.busFront,
      mats.busFront,
    ];
    const body = new THREE.Mesh(sharedGeos.box, materials);
    body.scale.set(2.15, 2.55, 6.5);
    body.position.y = 1.55;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const rack = new THREE.Mesh(sharedGeos.box, staticMats.silver);
    rack.scale.set(1.65, 0.18, 4.2);
    rack.position.set(0, 2.9, -0.2);
    group.add(rack);

    [-0.74, 0.74].forEach((hx) => {
      const hl = new THREE.Mesh(sharedGeos.box, staticMats.headlight);
      hl.scale.set(0.34, 0.22, 0.08);
      hl.position.set(hx, 0.68, 3.27);
      group.add(hl);
    });

    [
      [-1.02, 2.0],
      [1.02, 2.0],
      [-1.02, -2.0],
      [1.02, -2.0],
    ].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(sharedGeos.wheel, staticMats.wheelDark);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.42, wz);
      group.add(w);
    });

    return group;
  }

  if (kind === "cng") {
    const lower = new THREE.Mesh(sharedGeos.box, staticMats.cngGreen);
    lower.scale.set(1.68, 0.88, 2.75);
    lower.position.set(0, 0.66, -0.1);
    lower.castShadow = true;
    group.add(lower);

    const nose = new THREE.Mesh(sharedGeos.box, staticMats.cngGreen);
    nose.scale.set(0.95, 0.82, 0.7);
    nose.position.set(0, 0.64, 1.35);
    group.add(nose);

    const roof = new THREE.Mesh(sharedGeos.box, staticMats.hoodBlack);
    roof.scale.set(1.62, 0.24, 2.55);
    roof.position.set(0, 1.78, -0.15);
    roof.castShadow = true;
    group.add(roof);

    const shield = new THREE.Mesh(sharedGeos.box, staticMats.glassBlue);
    shield.scale.set(1.38, 0.62, 0.1);
    shield.position.set(0, 1.38, 1.05);
    shield.rotation.x = -0.18;
    group.add(shield);

    [-0.78, 0.78].forEach((sx) => {
      const cage = new THREE.Mesh(sharedGeos.box, staticMats.silver);
      cage.scale.set(0.06, 0.65, 2.1);
      cage.position.set(sx, 1.38, -0.2);
      group.add(cage);
    });

    const lamp = new THREE.Mesh(sharedGeos.cyl, staticMats.headlight);
    lamp.rotation.x = Math.PI / 2;
    lamp.scale.set(0.32, 0.12, 0.32);
    lamp.position.set(0, 0.78, 1.72);
    group.add(lamp);

    const fender = new THREE.Mesh(sharedGeos.box, staticMats.yellowTrim);
    fender.scale.set(0.36, 0.22, 0.48);
    fender.position.set(0, 0.42, 1.62);
    group.add(fender);

    const fw = new THREE.Mesh(sharedGeos.wheel, staticMats.wheelDark);
    fw.rotation.z = Math.PI / 2;
    fw.scale.set(0.75, 0.75, 0.75);
    fw.position.set(0, 0.31, 1.62);
    group.add(fw);

    [-0.78, 0.78].forEach((wx) => {
      const rw = new THREE.Mesh(sharedGeos.wheel, staticMats.wheelDark);
      rw.rotation.z = Math.PI / 2;
      rw.scale.set(0.78, 0.78, 0.78);
      rw.position.set(wx, 0.32, -1.05);
      group.add(rw);
    });

    return group;
  }

  if (kind === "rickshaw") {
    const base = new THREE.Mesh(sharedGeos.box, staticMats.goldFrame);
    base.scale.set(1.42, 0.24, 1.35);
    base.position.set(0, 0.56, -0.55);
    group.add(base);

    const seat = new THREE.Mesh(sharedGeos.box, staticMats.seatRed);
    seat.scale.set(1.28, 0.42, 0.85);
    seat.position.set(0, 0.85, -0.68);
    group.add(seat);

    const hood = new THREE.Mesh(sharedGeos.box, mats.rickshawHood);
    hood.scale.set(1.48, 1.18, 1.08);
    hood.position.set(0, 1.48, -0.68);
    hood.castShadow = true;
    group.add(hood);

    const frameBar = new THREE.Mesh(sharedGeos.box, staticMats.goldFrame);
    frameBar.scale.set(0.12, 0.12, 1.85);
    frameBar.position.set(0, 0.56, 0.45);
    group.add(frameBar);

    const pullerTorso = new THREE.Mesh(sharedGeos.box, staticMats.pullerShirt);
    pullerTorso.scale.set(0.48, 0.62, 0.32);
    pullerTorso.position.set(0, 1.18, 0.55);
    pullerTorso.rotation.x = 0.22;
    pullerTorso.castShadow = true;
    group.add(pullerTorso);

    const pullerHead = new THREE.Mesh(sharedGeos.sphere, staticMats.pullerSkin);
    pullerHead.scale.set(0.38, 0.38, 0.38);
    pullerHead.position.set(0, 1.65, 0.62);
    group.add(pullerHead);

    [
      [-0.76, -0.65],
      [0.76, -0.65],
      [0, 1.38],
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(sharedGeos.thinWheel, staticMats.spokeMetal);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.52, wz);
      group.add(wheel);
    });

    return group;
  }

  if (kind === "car") {
    const carMat =
      staticMats.carVariants[variantIndex % staticMats.carVariants.length];

    const chassis = new THREE.Mesh(sharedGeos.box, carMat);
    chassis.scale.set(1.9, 0.64, 4.0);
    chassis.position.y = 0.58;
    chassis.castShadow = true;
    group.add(chassis);

    const cabin = new THREE.Mesh(sharedGeos.box, staticMats.cabinDarkGlass);
    cabin.scale.set(1.62, 0.54, 2.05);
    cabin.position.set(0, 1.14, -0.18);
    cabin.castShadow = true;
    group.add(cabin);

    const roofCap = new THREE.Mesh(sharedGeos.box, carMat);
    roofCap.scale.set(1.56, 0.08, 1.85);
    roofCap.position.set(0, 1.42, -0.18);
    group.add(roofCap);

    [-0.64, 0.64].forEach((lx) => {
      const hl = new THREE.Mesh(sharedGeos.box, staticMats.headlight);
      hl.scale.set(0.32, 0.16, 0.08);
      hl.position.set(lx, 0.62, 2.01);
      group.add(hl);

      const tl = new THREE.Mesh(sharedGeos.box, staticMats.taillight);
      tl.scale.set(0.32, 0.16, 0.08);
      tl.position.set(lx, 0.64, -2.01);
      group.add(tl);
    });

    [
      [-0.92, 1.22],
      [0.92, 1.22],
      [-0.92, -1.22],
      [0.92, -1.22],
    ].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(sharedGeos.wheel, staticMats.wheelDark);
      w.rotation.z = Math.PI / 2;
      w.scale.set(0.82, 0.82, 0.82);
      w.position.set(wx, 0.34, wz);
      group.add(w);
    });

    return group;
  }

  if (kind === "barrier_low") {
    [-0.92, 0.92].forEach((px) => {
      const leg = new THREE.Mesh(sharedGeos.box, staticMats.postOrange);
      leg.scale.set(0.18, 0.96, 0.18);
      leg.position.set(px, 0.48, 0);
      leg.castShadow = true;
      group.add(leg);

      const foot = new THREE.Mesh(sharedGeos.box, staticMats.wheelDark);
      foot.scale.set(0.32, 0.12, 0.68);
      foot.position.set(px, 0.06, 0);
      group.add(foot);

      const beacon = new THREE.Mesh(sharedGeos.sphere, staticMats.beaconAmber);
      beacon.scale.set(0.22, 0.22, 0.22);
      beacon.position.set(px, 1.04, 0);
      group.add(beacon);
    });

    const board = new THREE.Mesh(sharedGeos.box, mats.hazardLow);
    board.scale.set(2.22, 0.62, 0.16);
    board.position.set(0, 0.64, 0);
    board.castShadow = true;
    group.add(board);

    return group;
  }

  // kind === "barrier_high" — Overhead Checkpost / Metro Work Gate — SLIDE UNDER!
  [-1.12, 1.12].forEach((px) => {
    const pillar = new THREE.Mesh(sharedGeos.box, staticMats.pillarYellow);
    pillar.scale.set(0.16, 2.75, 0.18);
    pillar.position.set(px, 1.375, 0);
    pillar.castShadow = true;
    group.add(pillar);

    const base = new THREE.Mesh(sharedGeos.box, staticMats.wheelDark);
    base.scale.set(0.34, 0.14, 0.65);
    base.position.set(px, 0.07, 0);
    group.add(base);
  });

  // Subtle glowing ground slide lane strip for instant depth readability
  const slideStrip = new THREE.Mesh(sharedGeos.box, staticMats.clearanceGlow);
  slideStrip.scale.set(2.05, 0.03, 0.55);
  slideStrip.position.set(0, 0.02, 0);
  group.add(slideStrip);

  const overheadBoard = new THREE.Mesh(sharedGeos.box, mats.overheadSign);
  overheadBoard.scale.set(2.44, 1.36, 0.22);
  overheadBoard.position.set(0, 1.9, 0);
  overheadBoard.castShadow = true;
  group.add(overheadBoard);

  return group;
}

export function createCollectibleMesh(
  kind: CollectibleKind,
  atlas: GameTextureAtlas
): THREE.Group {
  const group = new THREE.Group();
  const mats = getAtlasMaterials(atlas);

  if (kind === "coin") {
    const coin = new THREE.Mesh(sharedGeos.coin, [
      staticMats.coinEdge,
      mats.coinFace,
      mats.coinFace,
    ]);
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 0.72;
    coin.castShadow = true;
    group.add(coin);
    return group;
  }

  if (kind === "magnet") {
    const arch = new THREE.Mesh(sharedGeos.magnetArch, staticMats.magnetRed);
    arch.position.y = 0.88;
    arch.rotation.z = Math.PI;
    group.add(arch);

    [-0.34, 0.34].forEach((tx) => {
      const tip = new THREE.Mesh(sharedGeos.box, staticMats.magnetTip);
      tip.scale.set(0.22, 0.24, 0.22);
      tip.position.set(tx, 1.0, 0);
      group.add(tip);
    });

    const halo = new THREE.Mesh(sharedGeos.torus, staticMats.magnetHalo);
    halo.rotation.x = Math.PI / 2;
    halo.scale.set(0.85, 0.85, 0.85);
    halo.position.y = 0.2;
    group.add(halo);

    return group;
  }

  // kind === "chai" — Hot Tong-er Masala Cha Cup
  const cup = new THREE.Mesh(sharedGeos.chaiCup, staticMats.clayCup);
  cup.position.y = 0.78;
  cup.castShadow = true;
  group.add(cup);

  const teaTop = new THREE.Mesh(sharedGeos.chaiTop, staticMats.teaSurface);
  teaTop.rotation.x = -Math.PI / 2;
  teaTop.position.y = 1.1;
  group.add(teaTop);

  const aura = new THREE.Mesh(sharedGeos.torus, staticMats.chaiHalo);
  aura.rotation.x = Math.PI / 2;
  aura.scale.set(0.9, 0.9, 0.9);
  aura.position.y = 0.2;
  group.add(aura);

  return group;
}

export function createRoadsideChunk(
  chunkIndex: number,
  chunkLength: number,
  atlas: GameTextureAtlas
): THREE.Group {
  const group = new THREE.Group();

  const roadGeo = new THREE.PlaneGeometry(8.6, chunkLength);
  roadGeo.rotateX(-Math.PI / 2);
  const roadMat = new THREE.MeshStandardMaterial({
    map: atlas.roadAsphalt,
    roughness: 0.88,
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.receiveShadow = true;
  group.add(road);

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.9,
  });
  const curbBlack = new THREE.MeshStandardMaterial({ color: 0x1e293b });
  const curbYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15 });

  [-1, 1].forEach((side) => {
    const sw = new THREE.Mesh(sharedGeos.box, sidewalkMat);
    sw.scale.set(9.5, 0.24, chunkLength);
    sw.position.set(side * (4.3 + 4.75), 0.12, 0);
    sw.receiveShadow = true;
    group.add(sw);

    const segments = 8;
    const segLen = chunkLength / segments;
    for (let s = 0; s < segments; s++) {
      const curb = new THREE.Mesh(
        sharedGeos.box,
        s % 2 === 0 ? curbYellow : curbBlack
      );
      curb.scale.set(0.32, 0.3, segLen);
      curb.position.set(
        side * 4.46,
        0.15,
        -chunkLength / 2 + segLen * (s + 0.5)
      );
      group.add(curb);
    }
  });

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.9,
  });
  const krishnachuraRed = new THREE.MeshStandardMaterial({
    color: 0xff3b1f,
    roughness: 0.7,
  });
  const lushGreen = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.75,
  });

  [-1, 1].forEach((side, sIdx) => {
    for (let b = 0; b < 2; b++) {
      const bz = -chunkLength / 4 + b * (chunkLength / 2);
      const facadeIdx =
        (chunkIndex * 3 + b + sIdx * 2) % atlas.buildingFacades.length;
      const signIdx = (chunkIndex * 2 + b + sIdx) % atlas.shopSigns.length;

      const bHeight = 7.5 + ((chunkIndex + b + sIdx) % 3) * 2.8;
      const bWidth = 5.4;
      const bDepth = 11.2;

      const building = new THREE.Mesh(
        sharedGeos.box,
        new THREE.MeshStandardMaterial({
          map: atlas.buildingFacades[facadeIdx],
          roughness: 0.75,
        })
      );
      building.scale.set(bWidth, bHeight, bDepth);
      building.position.set(side * 9.2, bHeight / 2 + 0.24, bz);
      group.add(building);

      const sign = new THREE.Mesh(
        sharedGeos.box,
        new THREE.MeshBasicMaterial({ map: atlas.shopSigns[signIdx] })
      );
      sign.scale.set(0.14, 1.35, 4.4);
      sign.position.set(side * (9.2 - bWidth / 2 - 0.12), 2.7, bz);
      group.add(sign);
    }

    const treeZ = side < 0 ? -5 : 5;
    const trunk = new THREE.Mesh(sharedGeos.cyl, trunkMat);
    trunk.scale.set(0.45, 2.8, 0.45);
    trunk.position.set(side * 5.35, 1.5, treeZ);
    group.add(trunk);

    const isFlameTree = (chunkIndex + sIdx) % 2 === 0;
    const canopyMat = isFlameTree ? krishnachuraRed : lushGreen;
    const canopy = new THREE.Mesh(sharedGeos.sphere, canopyMat);
    canopy.scale.set(2.9, 1.9, 2.9);
    canopy.position.set(side * 5.05, 3.35, treeZ);
    group.add(canopy);
  });

  if (chunkIndex % 2 === 0) {
    const umbrellaColors = [0xf42a41, 0x0ea5e9, 0xffb800];
    const umbMat = new THREE.MeshStandardMaterial({
      color: umbrellaColors[chunkIndex % umbrellaColors.length],
      roughness: 0.5,
    });
    const pole = new THREE.Mesh(sharedGeos.cyl, staticMats.silver);
    pole.scale.set(0.12, 2.2, 0.12);
    pole.position.set(5.45, 1.2, -3);
    group.add(pole);

    const cone = new THREE.Mesh(sharedGeos.umbrellaCone, umbMat);
    cone.position.set(5.45, 2.35, -3);
    group.add(cone);
  }

  if (chunkIndex % 2 === 1) {
    const flagColors = [0x006a4e, 0xf42a41, 0xffb800, 0x38bdf8];
    for (let f = -3; f <= 3; f++) {
      const flag = new THREE.Mesh(
        sharedGeos.box,
        new THREE.MeshBasicMaterial({
          color: flagColors[Math.abs(f) % flagColors.length],
        })
      );
      flag.scale.set(0.42, 0.48, 0.06);
      const sag = 6.2 - (9 - f * f) * 0.07;
      flag.position.set(f * 1.35, sag, 0);
      group.add(flag);
    }
  }

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.85,
  });
  const pier = new THREE.Mesh(sharedGeos.cyl, concreteMat);
  pier.scale.set(1.25, 8.2, 1.25);
  pier.position.set(-13.8, 4.1, 0);
  group.add(pier);

  const girder = new THREE.Mesh(sharedGeos.box, concreteMat);
  girder.scale.set(2.8, 0.95, chunkLength);
  girder.position.set(-13.8, 8.4, 0);
  group.add(girder);

  return group;
}

export function createMetroTrainMesh(): THREE.Group {
  const train = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
  });
  const greenStripe = new THREE.MeshBasicMaterial({ color: 0x008f4c });
  const redStripe = new THREE.MeshBasicMaterial({ color: 0xf42a41 });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  for (let car = 0; car < 3; car++) {
    const cz = car * 9.4;
    const coach = new THREE.Mesh(sharedGeos.box, bodyMat);
    coach.scale.set(2.2, 2.35, 8.9);
    coach.position.set(0, 1.25, cz);
    train.add(coach);

    const gBand = new THREE.Mesh(sharedGeos.box, greenStripe);
    gBand.scale.set(2.24, 0.26, 8.92);
    gBand.position.set(0, 0.82, cz);
    train.add(gBand);

    const rBand = new THREE.Mesh(sharedGeos.box, redStripe);
    rBand.scale.set(2.25, 0.14, 8.92);
    rBand.position.set(0, 0.62, cz);
    train.add(rBand);

    const win = new THREE.Mesh(sharedGeos.box, windowMat);
    win.scale.set(2.26, 0.65, 7.6);
    win.position.set(0, 1.52, cz);
    train.add(win);
  }

  return train;
}
