import * as THREE from "three";
import {
  CollectibleKind,
  FloatingCallout,
  GamePhase,
  HudSnapshot,
  LaneIndex,
  ObstacleKind,
} from "./types";
import { getGameTextures, GameTextureAtlas } from "./textures";
import {
  createCollectibleMesh,
  createMetroTrainMesh,
  createObstacleMesh,
  createPlayerRig,
  createRoadsideChunk,
  createSkyBackdrop,
  PlayerRig,
} from "./meshes";
import { soundEngine } from "./sound";

const LANE_WIDTH = 2.65;
const CHUNK_LENGTH = 28;
const NUM_CHUNKS = 7;

const GRAVITY = 33.0;
const JUMP_VELOCITY = 12.1;
const FAST_FALL_VELOCITY = -30.0;
const SLIDE_DURATION = 0.62;

interface ActiveObstacle {
  id: number;
  kind: ObstacleKind;
  lane: LaneIndex;
  z: number;
  ownSpeed: number; // oncoming traffic speed toward +Z
  halfWidth: number;
  halfLength: number;
  minY: number; // 0 for ground obstacles, 1.20 for overhead slide barriers
  maxY: number; // height top
  mesh: THREE.Group;
  soundTriggered: boolean;
  nearMissChecked: boolean;
  smashed: boolean;
  smashVel: THREE.Vector3;
  smashRot: THREE.Vector3;
}

interface ActiveCollectible {
  id: number;
  kind: CollectibleKind;
  lane: LaneIndex;
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
  magnetized: boolean;
}

interface ParticleItem {
  active: boolean;
  life: number;
  maxLife: number;
  vel: THREE.Vector3;
  mesh: THREE.Mesh;
}

interface QueuedInput {
  action: "left" | "right" | "jump" | "slide";
  expiresAt: number;
}

const ZONES = [
  { minDist: 0, name: "Dhanmondi Morning", targetSpeed: 19.5 },
  { minDist: 180, name: "Shahbagh Crossing", targetSpeed: 23.5 },
  { minDist: 420, name: "Farmgate Rush", targetSpeed: 27.5 },
  { minDist: 750, name: "Mirpur Express", targetSpeed: 31.5 },
  { minDist: 1200, name: "Motijheel Turbo!", targetSpeed: 36.0 },
];

const CRASH_LABELS: Record<ObstacleKind, string> = {
  bus: "Bumped into a Dhaka Express Bus!",
  cng: "Clipped an Emerald CNG Auto!",
  rickshaw: "Tangled with a Painted Rickshaw!",
  car: "Caught by a Dhaka Street Sedan!",
  barrier_low: "Tripped over a DMP Road Barrier! (Jump ↑)",
  barrier_high: "Bonked an Overhead Sign Gate! (Slide ↓)",
};

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onPhaseChange: (phase: GamePhase, finalHud: HudSnapshot) => void;
  onCallout: (callout: FloatingCallout) => void;
}

export class DhakaRunnerEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private atlas: GameTextureAtlas;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private player: PlayerRig;
  private chunks: THREE.Group[] = [];
  private metroTrain: THREE.Group;
  private metroZ: number = -120;

  private obstacles: ActiveObstacle[] = [];
  private collectibles: ActiveCollectible[] = [];
  private particles: ParticleItem[] = [];

  private phase: GamePhase = "menu";
  private rafId: number | null = null;
  private lastTimestamp: number = 0;
  private elapsedMenuTime: number = 0;

  // Player state
  private currentLane: LaneIndex = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private verticalVel: number = 0;
  private isJumping: boolean = false;
  private slideTimer: number = 0;
  private runCycle: number = 0;
  private squashFactor: number = 1;
  private laneBankAngle: number = 0;
  private crashAnimTimer: number = 0;

  // Input buffer
  private queuedInput: QueuedInput | null = null;

  // Run progression & scoring
  private speed: number = 18.5;
  private distance: number = 0;
  private score: number = 0;
  private highScore: number = 0;
  private coins: number = 0;
  private nearMisses: number = 0;
  private multiplier: number = 1;
  private streakPoints: number = 0;
  private currentZoneIdx: number = 0;
  private crashReason: string = "";

  // Powerups
  private magnetTimer: number = 0;
  private chaiShieldActive: boolean = false;
  private chaiTimer: number = 0;

  // Spawner & Juice
  private nextSpawnZ: number = -26;
  private entityCounter: number = 1;
  private calloutCounter: number = 1;
  private shakeIntensity: number = 0;
  private hitStopTimer: number = 0;
  private lastAmbientSoundAt: number = 0;
  private lastHudEmitAt: number = 0;
  private patternIndex: number = 0;

  constructor(
    container: HTMLElement,
    initialHighScore: number,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.highScore = initialHighScore;
    this.callbacks = callbacks;
    this.atlas = getGameTextures();

    // Scene with warm Golden-Hour Dhaka atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xff9a5a);
    this.scene.fog = new THREE.FogExp2(0xff9458, 0.0115);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(
      aspect < 0.85 ? 66 : 55,
      aspect,
      0.5,
      195
    );
    this.camera.position.set(0, 4.6, 7.6);
    this.camera.lookAt(0, 1.5, -8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(this.renderer.domElement);

    this.setupLightingAndSky();
    this.setupWorldChunks();

    this.player = createPlayerRig();
    this.scene.add(this.player.root);

    this.metroTrain = createMetroTrainMesh();
    this.metroTrain.position.set(-13.8, 8.9, this.metroZ);
    this.scene.add(this.metroTrain);

    this.initParticlePool();
    this.seedMenuTraffic();

    window.addEventListener("resize", this.handleResize);
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  private setupLightingAndSky() {
    // Warm golden hemisphere light
    const hemi = new THREE.HemisphereLight(0xffe4b5, 0x3b2f4a, 1.15);
    this.scene.add(hemi);

    // Golden-hour sun casting crisp vehicle & character shadows
    const dirLight = new THREE.DirectionalLight(0xfff0d4, 1.65);
    dirLight.position.set(16, 28, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 85;
    const d = 22;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    // Painted Golden-Hour Dhaka sunset sky backdrop + sun halo
    const skyBackdrop = createSkyBackdrop();
    this.scene.add(skyBackdrop);
  }

  private setupWorldChunks() {
    for (let i = 0; i < NUM_CHUNKS; i++) {
      const chunk = createRoadsideChunk(i, CHUNK_LENGTH, this.atlas);
      chunk.position.z = CHUNK_LENGTH * 0.5 - i * CHUNK_LENGTH;
      this.scene.add(chunk);
      this.chunks.push(chunk);
    }
  }

  private initParticlePool() {
    const pGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    for (let i = 0; i < 85; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffb800 });
      const mesh = new THREE.Mesh(pGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        active: false,
        life: 0,
        maxLife: 0.5,
        vel: new THREE.Vector3(),
        mesh,
      });
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    z: number,
    colorHex: number,
    count: number,
    spreadSpeed: number = 6
  ) {
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.maxLife = 0.32 + Math.random() * 0.28;
        p.life = p.maxLife;
        p.mesh.position.set(
          x + (Math.random() - 0.5) * 0.4,
          y + (Math.random() - 0.5) * 0.3,
          z + (Math.random() - 0.5) * 0.4
        );
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
        p.mesh.scale.setScalar(0.8 + Math.random() * 0.9);
        p.mesh.visible = true;

        p.vel.set(
          (Math.random() - 0.5) * spreadSpeed,
          Math.random() * spreadSpeed * 0.85 + 1.5,
          (Math.random() - 0.5) * spreadSpeed
        );
        spawned++;
      }
    }
  }

  private seedMenuTraffic() {
    this.clearEntities();
    // Place decorative lively vehicles in outer lanes (-1 and +1) for the animated menu backdrop
    this.createObstacle("bus", -1, -28, 7.5, 0);
    this.createObstacle("rickshaw", 1, -18, 4.0, 1);
    this.createObstacle("cng", -1, -56, 8.5, 2);
    this.createObstacle("car", 1, -46, 9.5, 1);
  }

  private clearEntities() {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];

    for (const col of this.collectibles) {
      this.scene.remove(col.mesh);
    }
    this.collectibles = [];
  }

  public setHighScore(score: number) {
    this.highScore = Math.max(this.highScore, score);
  }

  public startGame() {
    soundEngine.unlock();
    this.clearEntities();

    this.phase = "playing";
    this.currentLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.verticalVel = 0;
    this.isJumping = false;
    this.slideTimer = 0;
    this.squashFactor = 1;
    this.laneBankAngle = 0;
    this.crashAnimTimer = 0;
    this.queuedInput = null;

    this.speed = 19.0;
    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.nearMisses = 0;
    this.multiplier = 1;
    this.streakPoints = 0;
    this.currentZoneIdx = 0;
    this.crashReason = "";

    this.magnetTimer = 0;
    this.chaiShieldActive = false;
    this.chaiTimer = 0;
    this.shakeIntensity = 0;
    this.hitStopTimer = 0;
    this.patternIndex = 0;

    // Reset player transform cleanly
    this.player.root.position.set(0, 0, 0);
    this.player.root.rotation.set(0, 0, 0);
    this.player.bodyPivot.rotation.set(0, 0, 0);
    this.player.bodyPivot.position.set(0, 0, 0);
    this.player.shieldAura.visible = false;
    this.player.magnetRing.visible = false;

    // Immediate fun within the first 2 seconds: welcoming Taka coins + first low barrier & painted bus!
    for (let i = 0; i < 5; i++) {
      this.createCollectible("coin", 0, -11 - i * 2.5, 0.72);
    }
    this.createObstacle("bus", -1, -28, 4.5, 0);
    this.createObstacle("rickshaw", 1, -34, 3.0, 1);
    this.spawnCoinArcOverBarrier(0, -32);

    this.nextSpawnZ = -52;
    while (this.nextSpawnZ > -155) {
      this.spawnNextTrafficPattern();
    }

    soundEngine.setTempoFactor(1);
    soundEngine.startStreetBeat();

    const snap = this.getHudSnapshot();
    this.callbacks.onHudUpdate(snap);
    this.callbacks.onPhaseChange("playing", snap);
  }

  public pauseGame() {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    soundEngine.stopStreetBeat();
    this.callbacks.onPhaseChange("paused", this.getHudSnapshot());
  }

  public resumeGame() {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.lastTimestamp = performance.now();
    soundEngine.startStreetBeat();
    this.callbacks.onPhaseChange("playing", this.getHudSnapshot());
  }

  public returnToMenu() {
    this.phase = "menu";
    soundEngine.stopStreetBeat();
    this.currentLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.isJumping = false;
    this.slideTimer = 0;
    this.player.root.position.set(0, 0, 0);
    this.player.bodyPivot.rotation.set(0, 0, 0);
    this.player.shieldAura.visible = false;
    this.player.magnetRing.visible = false;
    this.seedMenuTraffic();
    this.callbacks.onPhaseChange("menu", this.getHudSnapshot());
  }

  public handleInput(action: "left" | "right" | "jump" | "slide") {
    soundEngine.unlock();
    if (this.phase !== "playing") return;

    if (action === "left") {
      if (this.currentLane > -1) {
        this.currentLane = (this.currentLane - 1) as LaneIndex;
        this.laneBankAngle = 0.36;
        soundEngine.playLaneSwitch(-1);
        this.spawnParticles(this.playerX, 0.15, 0, 0xe2e8f0, 5, 3.5);
      }
      return;
    }

    if (action === "right") {
      if (this.currentLane < 1) {
        this.currentLane = (this.currentLane + 1) as LaneIndex;
        this.laneBankAngle = -0.36;
        soundEngine.playLaneSwitch(1);
        this.spawnParticles(this.playerX, 0.15, 0, 0xe2e8f0, 5, 3.5);
      }
      return;
    }

    if (action === "jump") {
      if (!this.isJumping) {
        this.executeJump();
      } else {
        // Buffer jump for 190ms so pressing just before landing feels ultra-responsive!
        this.queuedInput = {
          action: "jump",
          expiresAt: performance.now() + 190,
        };
      }
      return;
    }

    if (action === "slide") {
      if (this.isJumping) {
        // Pro move: Instant Fast-Fall Slam into slide!
        this.verticalVel = FAST_FALL_VELOCITY;
        this.slideTimer = SLIDE_DURATION;
        soundEngine.playSlide(true);
      } else {
        this.slideTimer = SLIDE_DURATION;
        this.squashFactor = 0.65;
        soundEngine.playSlide(false);
        this.spawnParticles(this.playerX, 0.12, 0.2, 0xfde68a, 6, 4);
      }
    }
  }

  private executeJump() {
    this.isJumping = true;
    this.verticalVel = JUMP_VELOCITY;
    this.slideTimer = 0; // cancel slide immediately if jumping out of a slide!
    this.squashFactor = 1.28;
    soundEngine.playJump();
    this.spawnParticles(this.playerX, 0.1, 0, 0xf8fafc, 8, 4.5);
  }

  private getHudSnapshot(): HudSnapshot {
    return {
      score: Math.floor(this.score),
      highScore: Math.max(this.highScore, Math.floor(this.score)),
      coins: this.coins,
      distance: Math.floor(this.distance),
      multiplier: this.multiplier,
      speedKmh: Math.round(this.speed * 2.6),
      zoneName: ZONES[this.currentZoneIdx]?.name || "Dhaka Rush",
      nearMisses: this.nearMisses,
      magnetTimeLeft: Math.max(0, Number(this.magnetTimer.toFixed(1))),
      chaiShieldActive: this.chaiShieldActive,
      chaiTimeLeft: Math.max(0, Number(this.chaiTimer.toFixed(1))),
      crashReason: this.crashReason || undefined,
    };
  }

  private emitCallout(
    text: string,
    color: FloatingCallout["color"],
    subtext?: string
  ) {
    this.callbacks.onCallout({
      id: this.calloutCounter++,
      text,
      subtext,
      color,
    });
  }

  private createObstacle(
    kind: ObstacleKind,
    lane: LaneIndex,
    z: number,
    ownSpeed: number,
    variant: number = 0
  ) {
    const mesh = createObstacleMesh(kind, this.atlas, variant);
    const x = lane * LANE_WIDTH;
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);

    // Forgiving arcade hitboxes (~76% of visual bounds) so close dodges feel awesome, never cheap!
    let halfWidth = 0.78;
    let halfLength = 1.2;
    let minY = 0;
    let maxY = 1.9;

    switch (kind) {
      case "bus":
        halfWidth = 0.86;
        halfLength = 2.95;
        maxY = 2.85;
        break;
      case "cng":
        halfWidth = 0.72;
        halfLength = 1.25;
        maxY = 1.75;
        break;
      case "rickshaw":
        halfWidth = 0.68;
        halfLength = 1.22;
        maxY = 1.85;
        break;
      case "car":
        halfWidth = 0.78;
        halfLength = 1.75;
        maxY = 1.32; // Skilled peak jump clears car roof!
        break;
      case "barrier_low":
        halfWidth = 0.92;
        halfLength = 0.28;
        maxY = 0.92; // Easy crisp jump!
        break;
      case "barrier_high":
        halfWidth = 0.95;
        halfLength = 0.3;
        minY = 1.18; // Open underneath for sliding!
        maxY = 2.8;
        break;
    }

    this.obstacles.push({
      id: this.entityCounter++,
      kind,
      lane,
      z,
      ownSpeed,
      halfWidth,
      halfLength,
      minY,
      maxY,
      mesh,
      soundTriggered: false,
      nearMissChecked: false,
      smashed: false,
      smashVel: new THREE.Vector3(),
      smashRot: new THREE.Vector3(),
    });
  }

  private createCollectible(
    kind: CollectibleKind,
    lane: LaneIndex,
    z: number,
    y: number = 0.72
  ) {
    const mesh = createCollectibleMesh(kind, this.atlas);
    const x = lane * LANE_WIDTH;
    mesh.position.set(x, y - 0.72, z);
    this.scene.add(mesh);

    this.collectibles.push({
      id: this.entityCounter++,
      kind,
      lane,
      x,
      y,
      z,
      mesh,
      magnetized: false,
    });
  }

  private spawnCoinLine(lane: LaneIndex, startZ: number, count: number, spacing = 2.6) {
    for (let i = 0; i < count; i++) {
      this.createCollectible("coin", lane, startZ - i * spacing, 0.72);
    }
  }

  private spawnCoinArcOverBarrier(lane: LaneIndex, barrierZ: number) {
    this.createObstacle("barrier_low", lane, barrierZ, 0);
    const offsets = [-5.2, -2.6, 0, 2.6, 5.2];
    const heights = [0.75, 1.55, 2.05, 1.55, 0.75];
    offsets.forEach((dz, idx) => {
      this.createCollectible("coin", lane, barrierZ + dz, heights[idx]);
    });
  }

  private spawnCoinSlideTunnel(lane: LaneIndex, gateZ: number) {
    this.createObstacle("barrier_high", lane, gateZ, 0);
    for (let dz = -4.8; dz <= 4.8; dz += 2.4) {
      this.createCollectible("coin", lane, gateZ + dz, 0.56);
    }
  }

  private spawnNextTrafficPattern() {
    const z = this.nextSpawnZ;
    const lanes: LaneIndex[] = [-1, 0, 1];
    // Shuffle lanes so every run feels fresh
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }

    const [laneA, laneB, laneC] = lanes;
    const speedFactor = this.speed / 19.0;
    const roll = this.patternIndex % 7;
    this.patternIndex++;

    // Spacing scales slightly with speed so high speeds remain fair & readable
    let gap = 22 + speedFactor * 4.5;

    if (roll === 0) {
      // Pattern 1: Painted Bus + Overhead Slide Gate + Open Coin Lane
      this.createObstacle("bus", laneA, z, 5.5 * speedFactor, Math.floor(Math.random() * 3));
      this.spawnCoinSlideTunnel(laneB, z + 1);
      this.spawnCoinLine(laneC, z + 3, 4);
    } else if (roll === 1) {
      // Pattern 2: Emerald CNG + Cycle Rickshaw + Jump Coin Arc
      this.createObstacle("cng", laneA, z, 6.2 * speedFactor);
      this.createObstacle("rickshaw", laneB, z - 5, 3.2 * speedFactor);
      this.spawnCoinArcOverBarrier(laneC, z - 1);
    } else if (roll === 2) {
      // Pattern 3: Staggered Dhaka Traffic Slalom with Powerup chance!
      this.createObstacle("bus", laneA, z, 5.0 * speedFactor, 1);
      this.createObstacle("car", laneB, z - 11, 7.5 * speedFactor, 0);
      this.spawnCoinLine(laneB, z + 2, 3);
      this.spawnCoinLine(laneC, z - 8, 4);

      if (Math.random() < 0.42) {
        const pKind: CollectibleKind = Math.random() < 0.52 ? "magnet" : "chai";
        this.createCollectible(pKind, laneC, z - 2, 0.85);
      }
    } else if (roll === 3) {
      // Pattern 4: Double DMP Barriers (One Jump, One Slide) + Moving Sedan
      this.spawnCoinArcOverBarrier(laneA, z);
      this.spawnCoinSlideTunnel(laneB, z - 2);
      this.createObstacle("car", laneC, z - 4, 6.8 * speedFactor, 2);
    } else if (roll === 4) {
      // Pattern 5: Exciting Jump-then-Slide Combo in Lane A, open escape in Lane C
      this.spawnCoinArcOverBarrier(laneA, z + 2);
      this.spawnCoinSlideTunnel(laneA, z - 14);
      this.createObstacle("bus", laneB, z - 6, 4.8 * speedFactor, 2);
      this.spawnCoinLine(laneC, z, 5, 3.0);
      gap += 10;
    } else if (roll === 5) {
      // Pattern 6: Twin Rickshaw & CNG Street Jam + Golden Taka Bonanza
      this.createObstacle("rickshaw", laneA, z, 3.5 * speedFactor);
      this.createObstacle("cng", laneB, z - 3, 5.8 * speedFactor);
      this.spawnCoinLine(laneC, z + 2, 6, 2.3);
    } else {
      // Pattern 7: Express Bus Duel + Powerup Reward Over Low Barrier
      this.createObstacle("bus", laneA, z, 6.4 * speedFactor, 0);
      this.createObstacle("bus", laneB, z - 13, 6.4 * speedFactor, 1);
      this.createObstacle("barrier_low", laneC, z - 4, 0);
      const rewardKind: CollectibleKind = Math.random() < 0.5 ? "chai" : "magnet";
      this.createCollectible(rewardKind, laneC, z - 4, 1.95);
      gap += 8;
    }

    this.nextSpawnZ -= gap;
  }

  private loop = (timestamp: number) => {
    this.rafId = requestAnimationFrame(this.loop);

    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const dt = Math.min(rawDt, 0.05); // clamp delta for tab-switch safety

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      this.updateParticles(dt);
      this.renderScene();
      return;
    }

    if (this.phase === "menu") {
      this.updateMenuBackdrop(dt);
    } else if (this.phase === "playing") {
      this.updateGameplay(dt, timestamp);
    } else if (this.phase === "gameover") {
      this.updateGameOverIdle(dt);
    }

    this.updateParticles(dt);
    this.renderScene();
  };

  private updateMenuBackdrop(dt: number) {
    this.elapsedMenuTime += dt;
    const previewSpeed = 10.5;

    // Scroll road chunks gently
    this.scrollWorld(previewSpeed * dt);

    // Move decorative vehicles in outer lanes and wrap them around
    for (const obs of this.obstacles) {
      obs.z += (previewSpeed + obs.ownSpeed * 0.5) * dt;
      if (obs.z > 14) {
        obs.z = -75 - Math.random() * 20;
      }
      obs.mesh.position.z = obs.z;
    }

    // Energetic warm-up jog animation on Rafi
    this.runCycle += dt * 11;
    this.animatePlayerMesh(dt, true);

    // Gentle cinematic camera sway behind Rafi on Start Screen
    const camX = Math.sin(this.elapsedMenuTime * 0.75) * 1.35;
    this.camera.position.set(camX, 3.85, 6.6);
    this.camera.lookAt(0, 1.55, -10);
  }

  private updateGameOverIdle(dt: number) {
    this.crashAnimTimer += dt;
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.8);
    }
    // Smashed obstacles keep flying if any
    for (const obs of this.obstacles) {
      if (obs.smashed) {
        obs.mesh.position.addScaledVector(obs.smashVel, dt);
        obs.smashVel.y -= 24 * dt;
        obs.mesh.rotation.x += obs.smashRot.x * dt;
        obs.mesh.rotation.y += obs.smashRot.y * dt;
      }
    }
    // Recoil stumble pose
    this.player.bodyPivot.rotation.x = Math.min(
      0.55,
      this.player.bodyPivot.rotation.x + dt * 2.5
    );
    this.updateCameraChase(dt);
  }

  private scrollWorld(deltaZ: number) {
    for (const chunk of this.chunks) {
      chunk.position.z += deltaZ;
      if (chunk.position.z > CHUNK_LENGTH * 1.5) {
        chunk.position.z -= NUM_CHUNKS * CHUNK_LENGTH;
      }
    }

    // Elevated Dhaka Metro Rail Train gliding overhead!
    this.metroZ += (deltaZ + 0.32);
    if (this.metroZ > 65) {
      this.metroZ = -210;
    }
    this.metroTrain.position.z = this.metroZ;
  }

  private updateGameplay(dt: number, nowMs: number) {
    // 1. Check buffered input
    if (this.queuedInput && nowMs <= this.queuedInput.expiresAt) {
      if (this.queuedInput.action === "jump" && !this.isJumping) {
        this.queuedInput = null;
        this.executeJump();
      }
    } else if (this.queuedInput && nowMs > this.queuedInput.expiresAt) {
      this.queuedInput = null;
    }

    // 2. Speed & Zone Progression
    let targetZoneIdx = 0;
    for (let i = ZONES.length - 1; i >= 0; i--) {
      if (this.distance >= ZONES[i].minDist) {
        targetZoneIdx = i;
        break;
      }
    }
    if (targetZoneIdx > this.currentZoneIdx) {
      this.currentZoneIdx = targetZoneIdx;
      const zName = ZONES[targetZoneIdx].name;
      this.emitCallout(`⚡ ${zName.toUpperCase()}!`, "cyan", "Traffic Speed Up!");
      soundEngine.playPowerup();
    }

    const baseTargetSpeed =
      ZONES[this.currentZoneIdx].targetSpeed +
      Math.min(6.5, this.distance * 0.0025);
    const chaiSpeedBonus = this.chaiShieldActive ? 3.0 : 0;
    this.speed += (baseTargetSpeed + chaiSpeedBonus - this.speed) * Math.min(1, dt * 1.2);
    soundEngine.setTempoFactor(this.speed / 19.5);

    const stepZ = this.speed * dt;
    this.distance += stepZ * 0.42;
    this.score += stepZ * 0.95 * this.multiplier;

    // 3. Scroll Dhaka Street & Metro Rail
    this.scrollWorld(stepZ);

    // 4. Power-up timers
    if (this.magnetTimer > 0) {
      this.magnetTimer = Math.max(0, this.magnetTimer - dt);
      this.player.magnetRing.visible = this.magnetTimer > 0;
      this.player.magnetRing.rotation.z += dt * 5.5;
    } else {
      this.player.magnetRing.visible = false;
    }

    if (this.chaiTimer > 0) {
      this.chaiTimer = Math.max(0, this.chaiTimer - dt);
      if (this.chaiTimer <= 0) {
        this.chaiShieldActive = false;
        this.player.shieldAura.visible = false;
      } else {
        this.player.shieldAura.visible = true;
        const pulse = 1 + Math.sin(nowMs * 0.012) * 0.06;
        this.player.shieldAura.scale.setScalar(pulse);
      }
    }

    // 5. Player Lateral & Vertical Physics
    const targetX = this.currentLane * LANE_WIDTH;
    const prevX = this.playerX;
    this.playerX += (targetX - this.playerX) * (1 - Math.exp(-21 * dt));

    if (this.isJumping) {
      this.playerY += this.verticalVel * dt;
      this.verticalVel -= GRAVITY * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.verticalVel = 0;
        this.isJumping = false;
        this.squashFactor = 0.76; // Juicy landing squash!
        this.spawnParticles(this.playerX, 0.08, 0, 0xe2e8f0, 7, 4);
      }
    }

    if (this.slideTimer > 0) {
      this.slideTimer = Math.max(0, this.slideTimer - dt);
    }

    this.squashFactor += (1 - this.squashFactor) * (1 - Math.exp(-16 * dt));
    this.laneBankAngle += (0 - this.laneBankAngle) * (1 - Math.exp(-13 * dt));

    this.player.root.position.set(this.playerX, 0, 0);
    this.runCycle += dt * (this.speed * 0.72);
    this.animatePlayerMesh(dt, false);

    // 6. Spawn upcoming patterns cleanly
    this.nextSpawnZ += stepZ;
    while (this.nextSpawnZ > -155) {
      this.spawnNextTrafficPattern();
    }

    // 7. Update Collectibles & Coin Magnet
    const playerChestY = this.playerY + (this.slideTimer > 0 ? 0.55 : 1.0);
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.z += stepZ;

      if (col.kind === "coin" && this.magnetTimer > 0 && col.z > -26 && col.z < 3.5) {
        col.magnetized = true;
      }

      if (col.magnetized) {
        const pullLerp = 1 - Math.exp(-15 * dt);
        col.x += (this.playerX - col.x) * pullLerp;
        col.y += (playerChestY - col.y) * pullLerp;
        col.z += (0 - col.z) * pullLerp * 0.65;
      }

      const waveBob = col.magnetized
        ? 0
        : Math.sin(nowMs * 0.0055 + col.z * 0.35) * 0.075;
      col.mesh.position.set(col.x, col.y - 0.72 + waveBob, col.z);
      col.mesh.rotation.y += dt * 4.2;

      // Pickup check
      const dx = Math.abs(col.x - this.playerX);
      const dy = Math.abs(col.y - playerChestY);
      const dz = Math.abs(col.z);

      if (dx < 0.98 && dy < 1.15 && dz < 1.15) {
        this.collectItem(col);
        this.scene.remove(col.mesh);
        this.collectibles.splice(i, 1);
        continue;
      }

      if (col.z > 10) {
        this.scene.remove(col.mesh);
        this.collectibles.splice(i, 1);
      }
    }

    // 8. Update Obstacles, Ambient Horns/Bells, Near-Misses & Collisions
    const playerHalfW = 0.34;
    const playerHalfZ = 0.28;
    const playerBottomY = this.playerY;
    const playerTopY =
      this.playerY + (this.slideTimer > 0 && !this.isJumping ? 0.82 : 1.78);

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (obs.smashed) {
        obs.mesh.position.addScaledVector(obs.smashVel, dt);
        obs.smashVel.y -= 26 * dt;
        obs.mesh.rotation.x += obs.smashRot.x * dt;
        obs.mesh.rotation.y += obs.smashRot.y * dt;
        if (obs.mesh.position.y < -5 || obs.mesh.position.z > 18) {
          this.scene.remove(obs.mesh);
          this.obstacles.splice(i, 1);
        }
        continue;
      }

      obs.z += (this.speed + obs.ownSpeed) * dt;
      const obsX = obs.lane * LANE_WIDTH;
      const rumbleY =
        obs.ownSpeed > 0
          ? Math.abs(Math.sin(nowMs * 0.022 + obs.id * 1.7)) * 0.032
          : 0;
      obs.mesh.position.set(obsX, rumbleY, obs.z);

      // Authentic Dhaka Street Sound Cues (Bus Horn / Rickshaw Bell)
      if (
        !obs.soundTriggered &&
        obs.z > -32 &&
        obs.z < -16 &&
        nowMs - this.lastAmbientSoundAt > 1700
      ) {
        if (obs.kind === "bus" && Math.random() < 0.45) {
          obs.soundTriggered = true;
          this.lastAmbientSoundAt = nowMs;
          soundEngine.playBusHorn();
        } else if (obs.kind === "rickshaw" && Math.random() < 0.55) {
          obs.soundTriggered = true;
          this.lastAmbientSoundAt = nowMs;
          soundEngine.playRickshawBell();
        }
      }

      // 3D AABB Collision Check
      const zOverlap = Math.abs(obs.z) < obs.halfLength + playerHalfZ;
      const xOverlap = Math.abs(obsX - this.playerX) < obs.halfWidth + playerHalfW;
      const yOverlap = playerTopY > obs.minY && playerBottomY < obs.maxY;

      if (zOverlap && xOverlap && yOverlap) {
        // Forgiving vault assist: if jumping and feet are within top 18cm of a low barrier or car roof, vault cleanly!
        if (
          this.isJumping &&
          obs.minY === 0 &&
          obs.maxY <= 1.4 &&
          playerBottomY > obs.maxY - 0.22
        ) {
          this.playerY = obs.maxY + 0.05;
          this.verticalVel = Math.max(this.verticalVel, 4.5);
          this.triggerNearMiss("ROOF VAULT! +50");
          obs.nearMissChecked = true;
        } else if (this.chaiShieldActive) {
          // Gorom Cha Shield blasts the obstacle out of the street!
          this.smashObstacleWithChai(obs);
        } else {
          // Crash -> Game Over!
          this.handleCrash(obs);
          return;
        }
      }

      // Near-Miss Detection: passing right beside an oncoming vehicle or dodging out at the last moment!
      if (!obs.nearMissChecked && obs.z > 0.6) {
        obs.nearMissChecked = true;
        const lateralDist = Math.abs(obsX - this.playerX);
        const justSwitchedOut = Math.abs(prevX - this.playerX) > 0.035;
        if (
          obs.kind !== "barrier_low" &&
          obs.kind !== "barrier_high" &&
          lateralDist < LANE_WIDTH * 1.04 &&
          (justSwitchedOut || Math.abs(obsX - this.playerX) < 2.25)
        ) {
          if (justSwitchedOut) {
            this.triggerNearMiss("CUT-THROUGH! +50");
          }
        }
      }

      if (obs.z > 14) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // 9. Update Chase Camera & HUD Throttled Snapshot (~15fps for React HUD, 60fps 3D canvas)
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 3.2);
    }
    this.updateCameraChase(dt);

    if (nowMs - this.lastHudEmitAt > 65) {
      this.lastHudEmitAt = nowMs;
      this.callbacks.onHudUpdate(this.getHudSnapshot());
    }
  }

  private collectItem(col: ActiveCollectible) {
    if (col.kind === "coin") {
      this.coins += 1;
      const pts = 10 * this.multiplier;
      this.score += pts;
      this.streakPoints += 1;
      if (this.streakPoints >= 15 && this.multiplier < 5) {
        this.multiplier += 1;
        this.streakPoints = 0;
        this.emitCallout(`🔥 MULTIPLIER x${this.multiplier}!`, "gold");
      }
      soundEngine.playCoin();
      this.spawnParticles(this.playerX, this.playerY + 0.9, 0, 0xffb800, 9, 5.5);
      return;
    }

    if (col.kind === "magnet") {
      this.magnetTimer = 9.0;
      this.score += 50 * this.multiplier;
      soundEngine.playPowerup();
      this.spawnParticles(this.playerX, this.playerY + 1.0, 0, 0x38bdf8, 16, 7);
      this.emitCallout("🧲 TAKA MAGNET!", "cyan", "Pulls all 3 lanes!");
      return;
    }

    if (col.kind === "chai") {
      this.chaiShieldActive = true;
      this.chaiTimer = 10.0;
      this.score += 50 * this.multiplier;
      soundEngine.playPowerup();
      this.spawnParticles(this.playerX, this.playerY + 1.0, 0, 0x10b981, 18, 7.5);
      this.emitCallout("☕ GOROM CHA BOOST!", "emerald", "Crash Shield Active!");
    }
  }

  private triggerNearMiss(label: string) {
    this.nearMisses += 1;
    const bonus = 50 * this.multiplier;
    this.score += bonus;
    this.streakPoints += 5;
    if (this.streakPoints >= 15 && this.multiplier < 5) {
      this.multiplier += 1;
      this.streakPoints = 0;
    }
    this.shakeIntensity = Math.max(this.shakeIntensity, 0.14);
    soundEngine.playNearMiss();
    this.spawnParticles(this.playerX, this.playerY + 1.0, -0.5, 0x38bdf8, 12, 6.5);
    this.emitCallout(label, "emerald", `Near Miss x${this.multiplier}`);
  }

  private smashObstacleWithChai(obs: ActiveObstacle) {
    obs.smashed = true;
    obs.smashVel.set((Math.random() - 0.5) * 14, 13, -24);
    obs.smashRot.set(6, 5, 4);

    this.chaiShieldActive = false;
    this.chaiTimer = 0;
    this.player.shieldAura.visible = false;

    this.score += 100 * this.multiplier;
    this.shakeIntensity = 0.42;
    this.hitStopTimer = 0.045;
    soundEngine.playShieldSmash();
    this.spawnParticles(obs.mesh.position.x, 1.2, obs.z, 0xffb800, 24, 10);
    this.emitCallout("💥 CHAI SMASH! +100", "gold", "Saved by Gorom Cha!");
  }

  private handleCrash(obs: ActiveObstacle) {
    this.phase = "gameover";
    this.crashReason = CRASH_LABELS[obs.kind];
    this.shakeIntensity = 0.65;
    this.hitStopTimer = 0.075; // Tactile arcade freeze-frame on impact!

    soundEngine.stopStreetBeat();
    soundEngine.playCrash();
    this.spawnParticles(this.playerX, this.playerY + 1.0, -0.4, 0xf42a41, 28, 9.5);
    this.spawnParticles(this.playerX, this.playerY + 1.2, -0.4, 0xffb800, 16, 8);

    const finalSnap = this.getHudSnapshot();
    this.highScore = Math.max(this.highScore, finalSnap.score);
    this.callbacks.onHudUpdate(finalSnap);
    this.callbacks.onPhaseChange("gameover", finalSnap);
  }

  private animatePlayerMesh(dt: number, isMenuPreview: boolean) {
    const pivot = this.player.bodyPivot;
    const isSliding = this.slideTimer > 0 && !this.isJumping && !isMenuPreview;

    // Ground shadow stays at y=0.03 and shrinks smoothly with height
    const shadowScale = Math.max(0.42, 1 - this.playerY * 0.22);
    this.player.shadow.scale.setScalar(shadowScale);

    // Scarf ribbon wind flutter
    const flutter = Math.sin(this.runCycle * 1.8) * 0.24;
    this.player.scarfLeft.rotation.x = 0.25 + flutter;
    this.player.scarfRight.rotation.x = 0.2 - flutter;

    if (isSliding) {
      // Baseball/limbo slide posture under high barriers
      pivot.position.y = 0.05;
      pivot.scale.set(1.06, 0.56, 1.1);
      pivot.rotation.x = -0.58; // lean back into slide
      pivot.rotation.z = this.laneBankAngle * 0.5;

      this.player.leftLeg.rotation.x = -0.85;
      this.player.rightLeg.rotation.x = 0.35;
      this.player.leftArm.rotation.x = -0.7;
      this.player.rightArm.rotation.x = -0.7;
      return;
    }

    pivot.scale.set(
      1 / Math.sqrt(this.squashFactor),
      this.squashFactor,
      1 / Math.sqrt(this.squashFactor)
    );

    if (this.isJumping && !isMenuPreview) {
      pivot.position.y = this.playerY;
      pivot.rotation.x = 0.18;
      pivot.rotation.z = this.laneBankAngle;

      // Heroic mid-air stride pose
      this.player.leftLeg.rotation.x = 0.65;
      this.player.rightLeg.rotation.x = -0.55;
      this.player.leftArm.rotation.x = -0.95;
      this.player.rightArm.rotation.x = 0.65;
      return;
    }

    // Energetic street sprint cycle!
    const stride = Math.sin(this.runCycle);
    const bob = Math.abs(Math.cos(this.runCycle)) * 0.11;

    pivot.position.y = this.playerY + bob;
    pivot.rotation.x = isMenuPreview ? 0.08 : 0.14;
    pivot.rotation.z = this.laneBankAngle;

    this.player.leftLeg.rotation.x = stride * 0.88;
    this.player.rightLeg.rotation.x = -stride * 0.88;
    this.player.leftArm.rotation.x = -stride * 0.82;
    this.player.rightArm.rotation.x = stride * 0.82;

    // Subtle playful head look on menu
    if (isMenuPreview) {
      this.player.headGroup.rotation.y = Math.sin(this.elapsedMenuTime * 1.6) * 0.28;
    } else {
      this.player.headGroup.rotation.y *= 1 - Math.min(1, dt * 10);
    }
  }

  private updateCameraChase(dt: number) {
    const aspect =
      (this.container.clientWidth || window.innerWidth) /
      (this.container.clientHeight || window.innerHeight);

    // Subtle speed FOV rush
    const baseFov = aspect < 0.85 ? 66 : 55;
    const speedFovBoost = Math.max(0, (this.speed - 19) * 0.38);
    const targetFov = baseFov + speedFovBoost;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 5);
      this.camera.updateProjectionMatrix();
    }

    const followX = this.playerX * 0.52;
    const followY = 4.45 + this.playerY * 0.28;
    const followZ = aspect < 0.85 ? 8.3 : 7.35;

    const shakeX =
      this.shakeIntensity > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
    const shakeY =
      this.shakeIntensity > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;

    this.camera.position.x +=
      (followX - this.camera.position.x) * (1 - Math.exp(-10 * dt)) + shakeX;
    this.camera.position.y +=
      (followY - this.camera.position.y) * (1 - Math.exp(-10 * dt)) + shakeY;
    this.camera.position.z +=
      (followZ - this.camera.position.z) * (1 - Math.exp(-10 * dt));

    this.camera.lookAt(this.playerX * 0.3, 1.45 + this.playerY * 0.15, -10.5);
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= 16 * dt;
      p.mesh.rotation.x += dt * 7;
      p.mesh.rotation.y += dt * 6;
      const ratio = p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.05, ratio));
    }
  }

  private renderScene() {
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.85 ? 66 : 55;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    soundEngine.stopStreetBeat();
    window.removeEventListener("resize", this.handleResize);
    this.renderer.dispose();
  }
}
