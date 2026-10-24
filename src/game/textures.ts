import * as THREE from "three";

export interface GameTextureAtlas {
  rickshawHood: THREE.CanvasTexture;
  busSides: THREE.CanvasTexture[];
  busFront: THREE.CanvasTexture;
  hazardLow: THREE.CanvasTexture;
  overheadSign: THREE.CanvasTexture;
  takaCoin: THREE.CanvasTexture;
  shopSigns: THREE.CanvasTexture[];
  buildingFacades: THREE.CanvasTexture[];
  roadAsphalt: THREE.CanvasTexture;
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function createRickshawHoodTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  // Vibrant magenta-crimson base
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#D90452");
  grad.addColorStop(0.5, "#F72585");
  grad.addColorStop(1, "#006A4E");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Golden scalloped border
  ctx.strokeStyle = "#FFB800";
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 240, 240);

  // Dotted folk art frame
  ctx.fillStyle = "#FFF3B0";
  for (let i = 20; i <= 236; i += 24) {
    ctx.beginPath();
    ctx.arc(i, 20, 4, 0, Math.PI * 2);
    ctx.arc(i, 236, 4, 0, Math.PI * 2);
    ctx.arc(20, i, 4, 0, Math.PI * 2);
    ctx.arc(236, i, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central lotus medallion
  ctx.save();
  ctx.translate(128, 118);
  for (let p = 0; p < 12; p++) {
    ctx.rotate((Math.PI * 2) / 12);
    ctx.fillStyle = p % 2 === 0 ? "#FFB800" : "#00F5D4";
    ctx.beginPath();
    ctx.ellipse(0, -42, 13, 32, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#F42A41";
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFE66D";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Classic rickshaw banner
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(34, 186, 188, 36);
  ctx.strokeStyle = "#FFB800";
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 186, 188, 36);

  ctx.fillStyle = "#FFE66D";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("মায়ের দোয়া ★ DHAKA", 128, 204);

  return finalizeTexture(c);
}

function createBusSideTexture(primary: string, accent: string, routeText: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  // Lower body
  ctx.fillStyle = primary;
  ctx.fillRect(0, 0, 512, 256);

  // Upper cream/teal cabin
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 18, 512, 108);

  // Roof trim & folk stripe
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 124, 512, 26);

  // Decorative rickshaw-style triangles along beltline
  ctx.fillStyle = "#FFB800";
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 150);
    ctx.lineTo(x + 16, 174);
    ctx.lineTo(x + 32, 150);
    ctx.closePath();
    ctx.fill();
  }

  // Illuminated passenger windows
  for (let i = 0; i < 6; i++) {
    const wx = 22 + i * 80;
    const g = ctx.createLinearGradient(wx, 32, wx, 112);
    g.addColorStop(0, "#1E293B");
    g.addColorStop(0.6, "#334155");
    g.addColorStop(1, "#F59E0B");
    ctx.fillStyle = g;
    ctx.fillRect(wx, 32, 64, 78);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 4;
    ctx.strokeRect(wx, 32, 64, 78);
  }

  // Route board on side
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(110, 184, 292, 42);
  ctx.strokeStyle = "#FFB800";
  ctx.lineWidth = 3;
  ctx.strokeRect(110, 184, 292, 42);
  ctx.fillStyle = "#FFE66D";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(routeText, 256, 205);

  return finalizeTexture(c);
}

function createBusFrontTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#E11D48";
  ctx.fillRect(0, 0, 256, 256);

  // Destination header
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(18, 14, 220, 34);
  ctx.fillStyle = "#FFB800";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ঢাকা মেট্রো • EXPRESS", 128, 31);

  // Big windshield
  const wg = ctx.createLinearGradient(0, 56, 0, 148);
  wg.addColorStop(0, "#0EA5E9");
  wg.addColorStop(1, "#1E293B");
  ctx.fillStyle = wg;
  ctx.fillRect(20, 56, 216, 90);
  ctx.strokeStyle = "#FFB800";
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 56, 216, 90);

  // Chrome grille
  ctx.fillStyle = "#1E293B";
  ctx.fillRect(56, 168, 144, 52);
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 4;
  for (let y = 178; y <= 212; y += 11) {
    ctx.beginPath();
    ctx.moveTo(62, y);
    ctx.lineTo(194, y);
    ctx.stroke();
  }

  return finalizeTexture(c);
}

function createHazardStripeTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#FFB800";
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = "#111827";
  for (let x = -128; x < 384; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 24, 0);
    ctx.lineTo(x - 24, 128);
    ctx.lineTo(x - 48, 128);
    ctx.closePath();
    ctx.fill();
  }

  // Center badge
  ctx.fillStyle = "#DC2626";
  ctx.fillRect(58, 34, 140, 60);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.strokeRect(58, 34, 140, 60);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("JUMP ↑", 128, 64);

  return finalizeTexture(c);
}

function createOverheadSignTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#006A4E";
  ctx.fillRect(0, 0, 512, 160);

  // Hazard bottom trim
  ctx.fillStyle = "#FFB800";
  ctx.fillRect(0, 124, 512, 36);
  ctx.fillStyle = "#DC2626";
  for (let x = -40; x < 560; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 124);
    ctx.lineTo(x + 24, 124);
    ctx.lineTo(x + 8, 160);
    ctx.lineTo(x - 16, 160);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 110);

  ctx.fillStyle = "#FFE66D";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("▼ SLIDE UNDER • নিচু হন ▼", 256, 64);

  return finalizeTexture(c);
}

function createTakaCoinTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;

  const g = ctx.createRadialGradient(52, 46, 8, 64, 64, 62);
  g.addColorStop(0, "#FFF7AE");
  g.addColorStop(0.55, "#FFB800");
  g.addColorStop(1, "#D97706");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = "#FEF08A";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#92400E";
  ctx.font = "bold 66px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("৳", 64, 68);

  return finalizeTexture(c);
}

function createShopSignTextures(): THREE.CanvasTexture[] {
  const signs = [
    { bg: "#B91C1C", border: "#FFB800", text: "ঢাকা বিরিয়ানি • BIRYANI" },
    { bg: "#047857", border: "#FDE047", text: "ভাই ভাই চা স্টল • CHA" },
    { bg: "#1D4ED8", border: "#38BDF8", text: "মিরপুর ইলেকট্রনিক্স" },
    { bg: "#7E22CE", border: "#F472B6", text: "পদ্মা ফ্যাশন হাউস" },
    { bg: "#C2410C", border: "#FDE047", text: "শাহবাগ বুক ডিপো" },
  ];

  return signs.map((s) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 96;
    const ctx = c.getContext("2d")!;

    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = s.border;
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, 246, 86);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.text, 128, 48);

    return finalizeTexture(c);
  });
}

function createBuildingFacadeTextures(): THREE.CanvasTexture[] {
  const palettes = [
    { wall: "#F59E0B", trim: "#78350F" },
    { wall: "#FB7185", trim: "#881337" },
    { wall: "#2DD4BF", trim: "#115E59" },
    { wall: "#FBBF24", trim: "#92400E" },
    { wall: "#818CF8", trim: "#312E81" },
  ];

  return palettes.map((p) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext("2d")!;

    ctx.fillStyle = p.wall;
    ctx.fillRect(0, 0, 256, 512);

    // Floor ledges
    ctx.fillStyle = p.trim;
    for (let y = 76; y < 460; y += 92) {
      ctx.fillRect(0, y, 256, 8);
    }

    // Windows with warm Dhaka evening glow on random panes
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = 22 + col * 76;
        const wy = 20 + row * 92;
        const lit = (row + col) % 2 === 0;
        ctx.fillStyle = lit ? "#FDE68A" : "#1E293B";
        ctx.fillRect(wx, wy, 48, 48);
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 4;
        ctx.strokeRect(wx, wy, 48, 48);
      }
    }

    // Ground-floor shutter / shop entrance
    ctx.fillStyle = "#1E293B";
    ctx.fillRect(20, 412, 216, 100);
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(36, 428, 184, 84);

    return finalizeTexture(c);
  });
}

function createRoadAsphaltTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;

  // Rich dark asphalt
  ctx.fillStyle = "#262B38";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle asphalt grain
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.07)";
    ctx.fillRect(x, y, 3, 3);
  }

  // Yellow shoulder edge stripes
  ctx.fillStyle = "#F59E0B";
  ctx.fillRect(14, 0, 10, 512);
  ctx.fillRect(488, 0, 10, 512);

  // Two crisp white dashed lane dividers dividing road into 3 equal lanes
  ctx.fillStyle = "#F8FAFC";
  const lane1X = 176;
  const lane2X = 336;
  for (let y = 24; y < 512; y += 128) {
    ctx.fillRect(lane1X - 5, y, 10, 68);
    ctx.fillRect(lane2X - 5, y, 10, 68);
  }

  return finalizeTexture(c, 1, 14);
}

let cachedAtlas: GameTextureAtlas | null = null;

export function getGameTextures(): GameTextureAtlas {
  if (cachedAtlas) return cachedAtlas;

  cachedAtlas = {
    rickshawHood: createRickshawHoodTexture(),
    busSides: [
      createBusSideTexture("#008F5D", "#F42A41", "মিরপুর ⇄ মতিঝিল"),
      createBusSideTexture("#E11D48", "#0284C7", "উত্তরা ⇄ শাহবাগ"),
      createBusSideTexture("#0284C7", "#FFB800", "ধানমন্ডি ⇄ ফার্মগেট"),
    ],
    busFront: createBusFrontTexture(),
    hazardLow: createHazardStripeTexture(),
    overheadSign: createOverheadSignTexture(),
    takaCoin: createTakaCoinTexture(),
    shopSigns: createShopSignTextures(),
    buildingFacades: createBuildingFacadeTextures(),
    roadAsphalt: createRoadAsphaltTexture(),
  };

  return cachedAtlas;
}
