import * as Phaser from "phaser";
import { TILE } from "../config";
import { LEVELS, eachCell, hubIdFor, worldSize, type LevelDef } from "../data/levels";
import { BOSSES, FLOORS, HEROES, rankFromScore, type HeroId } from "../data/world";
import { emitGame } from "../bus";
import { bootInput, pollGamepad, readActions, setInjected } from "../input";
import { sfx } from "../audio";
import { useGame } from "@/store/game-store";

type Mob = {
  spr: Phaser.Physics.Arcade.Sprite;
  kind: string;
  dir: number;
  hp: number;
  next: number;
};

export class PlayScene extends Phaser.Scene {
  private levelId = "hub-1";
  private level!: LevelDef;
  private player!: Phaser.Physics.Arcade.Sprite;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private oneWay!: Phaser.Physics.Arcade.StaticGroup;
  private mobs: Mob[] = [];
  private pickups!: Phaser.Physics.Arcade.Group;
  private shots!: Phaser.Physics.Arcade.Group;
  private facing = 1;
  private coyote = 0;
  private jumpBuf = 0;
  private attackT = 0;
  private hurtT = 0;
  private shieldT = 0;
  private mach = 0;
  private comboT = 0;
  private pizza = false;
  private timer = 0;
  private goal: "exit" | "start" = "exit";
  private spawn = { x: 80, y: 80 };
  private exitPt = { x: 200, y: 80 };
  private interactives: { kind: string; id: string; x: number; y: number }[] = [];
  private frozen = false;
  private trauma = 0;
  private secrets = 0;
  private blocked = 0;
  private incoming = 0;
  private metroidHit = false;
  private label = "";
  private prompt = "";
  private hero: HeroId = "cuboe";
  private score = 0;
  private combo = 0;
  private hp = 6;
  private maxHp = 6;
  private lives = 6;
  private damaged = false;
  private burstT = 0;
  private meter = 0;
  private dropT = 0;
  private holeT = 0;
  private invulnT = 0;
  private speedT = 0;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("play");
  }

  init(data: { levelId?: string }) {
    const floor = useGame.getState().save.floor;
    let id = data.levelId ?? hubIdFor(floor);
    if (id === "hub") id = hubIdFor(floor);
    this.levelId = id;
    this.mobs = [];
    this.interactives = [];
    this.pizza = false;
    this.goal = "exit";
    this.frozen = false;
    this.trauma = 0;
    this.combo = 0;
    this.comboT = 0;
    this.attackT = 0;
    this.hurtT = 0;
    this.shieldT = 0;
    this.mach = 0;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.secrets = 0;
    this.blocked = 0;
    this.incoming = 0;
    this.metroidHit = false;
    this.damaged = false;
    this.burstT = 0;
    this.dropT = 0;
    this.holeT = 0;
    this.invulnT = 0;
    this.speedT = 0;
    this.prompt = "";
  }

  preload() {
    const s = (k: string, path: string) => {
      if (!this.textures.exists(k)) this.load.image(k, path);
    };
    const sheet = (k: string, path: string) => {
      if (!this.textures.exists(k)) this.load.spritesheet(k, path, { frameWidth: 128, frameHeight: 128 });
    };
    s("bg-valley", "/game/bg/candy-corn-valley.jpg");
    s("bg-mash", "/game/bg/marsh-mash.jpg");
    s("bg-hub", "/game/bg/hub-interior.jpg");
    s("bg-desert", "/game/bg/desert.jpg");
    s("bg-landfill", "/game/bg/landfill.jpg");
    s("bg-plex", "/game/bg/plex.jpg");
    s("ground-candy", "/game/sprites/ground-candy.png");
    s("ground-marsh", "/game/sprites/ground-marsh.png");
    for (const h of ["cuboe", "cubro"] as const) {
      for (const a of ["idle", "run", "jump", "attack"] as const) sheet(`${h}-${a}`, `/game/sprites/${h}-${a}.png`);
    }
    sheet("boxguy", "/game/sprites/boxguy.png");
    sheet("nincube", "/game/sprites/nincube.png");
    sheet("pump", "/game/sprites/pump.png");
    sheet("choco", "/game/sprites/choco.png");
    sheet("outlaw", "/game/sprites/outlaw.png");
    sheet("warlock", "/game/sprites/warlock.png");
    sheet("pickups", "/game/sprites/pickups.png");
    sheet("props", "/game/sprites/props.png");
  }

  create() {
    try {
      this.bootWorld();
    } catch (err) {
      console.error(err);
      emitGame({ t: "toast", text: "Couldn't load that room" });
      emitGame({ t: "ready" });
    }
  }

  private bootWorld() {
    bootInput();
    this.hero = useGame.getState().save.hero;
    const def = HEROES[this.hero];
    this.maxHp = def.lives;
    this.hp = def.lives;
    this.lives = useGame.getState().hud.lives || def.lives;
    this.score = 0;
    this.meter = 20;

    this.level = LEVELS[this.levelId] ?? LEVELS["hub-1"]!;
    this.label = this.level.name;
    const { w, h } = worldSize(this.level);
    this.physics.world.setBounds(0, 0, w, h);

    if (!this.textures.exists("px")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture("px", 4, 4);
      g.destroy();
    }

    const bgKey = this.bgKey();
    const bg = this.add.image(0, 0, bgKey).setOrigin(0, 0).setDepth(-8);
    if (this.level.isHub) {
      bg.setScrollFactor(0.12, 0).setDisplaySize(Math.max(w, 1600), Math.max(h, 720));
    } else {
      bg.setScrollFactor(0.22, 0.08).setDisplaySize(Math.max(w, 1600), h + 80);
    }
    if (this.level.tint) bg.setTint(this.level.tint);

    this.solids = this.physics.add.staticGroup();
    this.oneWay = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group();
    this.shots = this.physics.add.group();

    this.dust = this.add.particles(0, 0, "px", {
      lifespan: 320,
      speed: { min: 30, max: 110 },
      scale: { start: 2.4, end: 0 },
      alpha: { start: 0.7, end: 0 },
      emitting: false,
      gravityY: 240,
    });
    this.dust.setDepth(5);

    this.makeAnims();
    this.buildMap();
    this.spawnPlayer();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.oneWay, undefined, (_p, plat) => {
      if (this.dropT > 0) return false;
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      const pb = (plat as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      return body.velocity.y >= 0 && body.bottom <= pb.top + 8;
    });
    this.physics.add.overlap(this.player, this.pickups, (_p, pk) => this.grab(pk as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.player, this.shots, (_p, sh) => {
      const s = sh as Phaser.Physics.Arcade.Sprite;
      if (s.getData("friendly")) return;
      s.destroy();
      this.incoming++;
      if (this.shieldT > 0 || this.invulnT > 0) {
        this.blocked++;
        sfx.land();
        return;
      }
      this.hurt(1);
    });

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.14, 0.1);
    cam.setBounds(0, 0, w, Math.max(h, 720));
    cam.setDeadzone(140, 64);
    cam.fadeIn(250, 20, 12, 8);

    this.events.once("shutdown", () => {
      this.mobs.length = 0;
    });

    emitGame({ t: "ready" });
    this.pushHud();
    this.wireControlsTest();
  }

  private bgKey() {
    const p = this.level.bg;
    if (p.includes("hub")) return "bg-hub";
    if (p.includes("marsh")) return "bg-mash";
    if (p.includes("desert")) return "bg-desert";
    if (p.includes("landfill")) return "bg-landfill";
    if (p.includes("plex")) return "bg-plex";
    return "bg-valley";
  }

  private makeAnims() {
    const mk = (key: string, sheet: string, rate: number, rep: number) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(sheet, { start: 0, end: 3 }),
        frameRate: rate,
        repeat: rep,
      });
    };
    for (const h of ["cuboe", "cubro"] as const) {
      mk(`${h}-idle`, `${h}-idle`, 7, -1);
      mk(`${h}-run`, `${h}-run`, 12, -1);
      mk(`${h}-jump`, `${h}-jump`, 8, 0);
      mk(`${h}-attack`, `${h}-attack`, 14, 0);
    }
    mk("boxguy-walk", "boxguy", 8, -1);
    mk("nincube-walk", "nincube", 12, -1);
    mk("pump-walk", "pump", 8, -1);
    mk("choco-idle", "choco", 6, -1);
    mk("outlaw-idle", "outlaw", 6, -1);
    mk("warlock-idle", "warlock", 6, -1);
  }

  private tileSpr(tx: number, ty: number, oneWay: boolean) {
    const x = tx * TILE + TILE / 2;
    const y = ty * TILE + TILE / 2;
    let img: Phaser.GameObjects.GameObject;
    if (this.level.isHub) {
      const rec = this.add.rectangle(x, y, TILE + 1, TILE + 1, 0x3a2214).setDepth(1);
      this.add.rectangle(x, y - TILE / 2 + 3, TILE + 1, 6, 0xc47a3a).setDepth(1);
      img = rec;
    } else {
      const key = this.level.ground === "marsh" ? "ground-marsh" : "ground-candy";
      img = this.add.image(x, y, key).setDisplaySize(TILE + 1, TILE + 1).setDepth(1);
    }
    this.physics.add.existing(img, true);
    const body = (img as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(TILE, TILE);
    if (oneWay) this.oneWay.add(img);
    else this.solids.add(img);
  }

  private marker(x: number, y: number, text: string) {
    this.add
      .text(x, y, text, {
        fontFamily: "Lilita One, Impact, sans-serif",
        fontSize: "20px",
        color: "#fff4d6",
        stroke: "#140c0a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private drawDoor(x: number, y: number, label: string, kind: "room" | "boss" | "up" | "pc") {
    const g = this.add.graphics().setDepth(2);
    const w = 46;
    const h = 72;
    const top = y - 20 - h / 2;
    const col = kind === "boss" ? 0x1a0808 : kind === "up" ? 0x2a1810 : 0x3a1a10;
    g.fillStyle(col, 1);
    g.fillRoundedRect(x - w / 2, top, w, h, 8);
    g.lineStyle(3, kind === "boss" ? 0xff4d7a : 0xfff4d6, 0.9);
    g.strokeRoundedRect(x - w / 2, top, w, h, 8);
    if (kind === "boss") {
      g.fillStyle(0xfff4d6, 1);
      g.fillTriangle(x - 20, top + 4, x - 12, top - 18, x - 4, top + 4);
      g.fillTriangle(x + 20, top + 4, x + 12, top - 18, x + 4, top + 4);
    }
    if (kind === "up") {
      g.fillStyle(0xfff4d6, 1);
      g.fillTriangle(x, top + 14, x - 12, top + 34, x + 12, top + 34);
    }
    this.marker(x, top - 14, label);
  }

  private buildMap() {
    const floor = useGame.getState().save.floor;
    eachCell(this.level, (ch, tx, ty) => {
      const x = tx * TILE + TILE / 2;
      const y = ty * TILE + TILE / 2;
      if (ch === "#") this.tileSpr(tx, ty, false);
      else if (ch === "=") this.tileSpr(tx, ty, true);
      else if (ch === "S") this.spawn = { x: Math.max(x, 96), y: y - 8 };
      else if (ch === "X") this.exitPt = { x, y };
      else if (ch === "c" || ch === "l") this.dropPickup(x, y, ch === "l" ? 1 : 0, 20);
      else if (ch === "g") {
        this.dropPickup(x, y, 3, 50);
        this.interactives.push({ kind: "giver", id: "g", x, y });
        if (this.level.isHub) this.marker(x, y - 50, "400");
      } else if (ch === "b") this.spawnMob(x, y, "boxguy");
      else if (ch === "n") this.spawnMob(x, y, "nincube");
      else if (ch === "p") this.spawnMob(x, y, "pump");
      else if (ch === "C") this.spawnMob(x, y, "cannon");
      else if (ch === "B") {
        if (this.level.isBoss) this.spawnBoss(x, y);
        else {
          this.interactives.push({ kind: "boss", id: `f${floor}-boss`, x, y });
          this.drawDoor(x, y, "BOSS", "boss");
        }
      } else if (ch === "P") {
        this.interactives.push({ kind: "pc", id: "pc", x, y });
        this.drawDoor(x, y, "PC", "pc");
      } else if (ch === "E") {
        this.interactives.push({ kind: "elevator", id: "next", x, y });
        this.drawDoor(x, y, "UP", "up");
      } else if (ch === "T") this.interactives.push({ kind: "treasure", id: "t", x, y });
      else if (ch === "R") {
        this.secrets++;
        this.interactives.push({ kind: "rift", id: "rift", x, y });
        this.marker(x, y - 36, "?");
      } else if (ch === "M") this.interactives.push({ kind: "metroid", id: "metroid", x, y });
      else if (ch === "H") {
        this.interactives.push({ kind: "tv", id: "tv", x, y });
        const tv = this.add.rectangle(x, y - 18, 40, 32, 0x1a1210).setDepth(2);
        this.add.rectangle(x, y - 18, 28, 20, 0x3ecf8e).setDepth(2);
        void tv;
        this.marker(x, y - 52, "TV");
      } else if (ch >= "1" && ch <= "4") {
        this.interactives.push({ kind: "door", id: `f${floor}-${ch}`, x, y });
        this.drawDoor(x, y, ch, "room");
      }
    });
    if (!this.level.isHub && !this.level.isBoss) {
      this.add.sprite(this.exitPt.x, this.exitPt.y - 16, "props", 1).setDisplaySize(56, 72).setDepth(2);
    }
  }

  private dropPickup(x: number, y: number, frame: number, value: number) {
    const s = this.pickups.create(x, y, "pickups", frame) as Phaser.Physics.Arcade.Sprite;
    s.setDisplaySize(36, 36);
    (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    s.setData("value", value);
    this.tweens.add({ targets: s, y: y - 6, yoyo: true, duration: 700, repeat: -1, ease: "Sine.easeInOut" });
  }

  private spawnMob(x: number, y: number, kind: string) {
    const key = kind === "cannon" ? "props" : kind;
    const spr = this.physics.add.sprite(x, y, key, 0);
    spr.setDisplaySize(kind === "cannon" ? 52 : 56, kind === "cannon" ? 40 : 56);
    spr.setCollideWorldBounds(true);
    (spr.body as Phaser.Physics.Arcade.Body).setGravityY(2200);
    (spr.body as Phaser.Physics.Arcade.Body).setSize(70, 80).setOffset(29, 40);
    this.physics.add.collider(spr, this.solids);
    this.physics.add.collider(spr, this.oneWay);
    if (kind !== "cannon" && this.anims.exists(`${kind}-walk`)) spr.play(`${kind}-walk`);
    this.mobs.push({ spr, kind, dir: Math.random() > 0.5 ? 1 : -1, hp: kind === "nincube" ? 2 : 1, next: 0 });
  }

  private spawnBoss(x: number, y: number) {
    const id = this.level.bossId ?? "f1-boss";
    const info = BOSSES[id]!;
    const spr = this.physics.add.sprite(x, y, info.sprite, 0);
    spr.setDisplaySize(96, 96);
    (spr.body as Phaser.Physics.Arcade.Body).setGravityY(2200);
    (spr.body as Phaser.Physics.Arcade.Body).setSize(80, 90).setOffset(24, 30);
    spr.setCollideWorldBounds(true);
    this.physics.add.collider(spr, this.solids);
    if (this.anims.exists(`${info.sprite}-idle`)) spr.play(`${info.sprite}-idle`);
    spr.setData("open", false);
    this.mobs.push({ spr, kind: "boss", dir: -1, hp: info.lives, next: this.time.now + 800 });
    this.label = info.name;
    this.pop(x, y - 80, "HIT WHEN FLASHING");
  }

  private spawnPlayer() {
    const h = this.hero;
    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, `${h}-idle`, 0);
    this.player.setDisplaySize(64, 64);
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(1900);
    body.setMaxVelocity(780, 1100);
    body.setSize(54, 78).setOffset(37, 42);
    this.player.play(`${h}-idle`);
    this.player.setDepth(6);
    const promo = useGame.getState().save.promo;
    if (h === "cuboe" && promo.includes("were-cuboe")) this.player.setTint(0x88ffaa);
    if (h === "cubro" && promo.includes("were-cubro")) this.player.setTint(0xff6688);
  }

  update(_t: number, delta: number) {
    if (this.frozen) return;
    const dt = Math.min(delta, 50) / 1000;
    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }
    if (this.attackT > 0) this.attackT -= dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.shieldT > 0) this.shieldT -= dt;
    if (this.burstT > 0) this.burstT -= dt;
    if (this.dropT > 0) this.dropT -= dt;
    if (this.holeT > 0) this.holeT -= dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.speedT > 0) this.speedT -= dt;
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
      const s = this.trauma * this.trauma;
      if (useGame.getState().save.settings.shake) {
        this.cameras.main.setScroll(
          this.cameras.main.scrollX + (Math.random() - 0.5) * 18 * s,
          this.cameras.main.scrollY + (Math.random() - 0.5) * 12 * s,
        );
      }
    }

    const actions = readActions();
    pollGamepad(actions);
    if (actions.pausePressed) {
      this.frozen = true;
      emitGame({ t: "pause" });
      return;
    }
    this.controlPlayer(actions, dt);
    this.tickMobs();
    this.tickGoal();
    this.tickInteract(actions);
    this.tickPizza(dt);
    this.tickAnims();
    this.tickFx();
    if (this.player.y > worldSize(this.level).h + 40) this.fallOut();
    this.cameras.main.setFollowOffset(-this.facing * 90, 12);
    this.pushHud();
  }

  private tickFx() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.mach > 0.45 && (body.blocked.down || body.touching.down)) {
      this.dust.emitParticleAt(this.player.x - this.facing * 18, this.player.y + 26, 1);
    }
    if (this.holeT > 0) {
      this.mobs.forEach((m) => {
        if (!m.spr.active) return;
        const dx = this.player.x - m.spr.x;
        const dy = this.player.y - m.spr.y;
        (m.spr.body as Phaser.Physics.Arcade.Body).setVelocity(dx * 1.4, dy * 0.6);
      });
    }
  }

  private controlPlayer(actions: ReturnType<typeof readActions>, dt: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.coyote = 0.11;
    else this.coyote = Math.max(0, this.coyote - dt);
    if (actions.jumpPressed) this.jumpBuf = 0.13;
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt);

    if (actions.moveX !== 0) this.facing = actions.moveX;
    this.player.setFlipX(this.facing < 0);

    if (actions.down && actions.jumpPressed && grounded) {
      this.dropT = 0.22;
    }

    const wantRun = actions.run || this.hero === "cubro";
    const max = this.burstT > 0 ? 760 : this.speedT > 0 ? 640 : wantRun ? (this.hero === "cubro" ? 560 : 480) : 260;
    const accel = grounded ? 3200 : 1800;
    if (actions.moveX !== 0) {
      body.setAccelerationX(actions.moveX * accel);
      this.mach = Math.min(1, this.mach + dt * (wantRun ? 0.7 : 0.25));
    } else {
      body.setAccelerationX(0);
      body.setVelocityX(body.velocity.x * (grounded ? 0.78 : 0.94));
      this.mach = Math.max(0, this.mach - dt * 1.4);
    }
    if (Math.abs(body.velocity.x) > max) body.setVelocityX(max * Math.sign(body.velocity.x));

    const vy = body.velocity.y;
    if (vy > 0) body.setGravityY(3400);
    else if (vy > -90) body.setGravityY(1200);
    else body.setGravityY(1900);

    if (this.jumpBuf > 0 && this.coyote > 0 && this.dropT <= 0) {
      body.setVelocityY(this.hero === "cubro" ? -820 : -760);
      this.coyote = 0;
      this.jumpBuf = 0;
      sfx.jump();
      this.player.play(`${this.hero}-jump`, true);
    }
    if (!actions.jump && body.velocity.y < 0) body.setVelocityY(body.velocity.y * 0.52);
    if (actions.down && !grounded && body.velocity.y > 80) body.setVelocityY(Math.min(1200, body.velocity.y + 2400 * dt));
    if (actions.attackPressed && this.attackT <= 0) this.doAttack(actions);
    if (actions.specialPressed) this.doSpecial(actions);

    if (this.shieldT > 0) this.player.setTint(0x9ad7ff);
    else if (this.hurtT > 0) this.player.setTint(0xff6677);
    else if (this.burstT > 0) this.player.setTint(0xffe066);
    else if (this.invulnT > 0) this.player.setTint(0xffffff);
    else {
      const promo = useGame.getState().save.promo;
      if (this.hero === "cuboe" && promo.includes("were-cuboe")) this.player.setTint(0x88ffaa);
      else if (this.hero === "cubro" && promo.includes("were-cubro")) this.player.setTint(0xff6688);
      else this.player.clearTint();
    }
  }

  private tickAnims() {
    if (this.attackT > 0) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    const key = !grounded ? `${this.hero}-jump` : Math.abs(body.velocity.x) > 40 ? `${this.hero}-run` : `${this.hero}-idle`;
    if (this.player.anims.currentAnim?.key !== key) this.player.play(key, true);
  }

  private spend(n: number) {
    if (this.meter < n) return false;
    this.meter -= n;
    return true;
  }

  private doAttack(actions: ReturnType<typeof readActions>) {
    this.attackT = 0.22;
    this.player.play(`${this.hero}-attack`, true);
    sfx.attack();
    const grounded = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down;

    if (this.hero === "cuboe" && actions.up && this.spend(30)) {
      this.masterCombo("beams");
      this.shoot(this.player.x, this.player.y, 1);
      this.shoot(this.player.x, this.player.y, -1);
      this.pop(this.player.x, this.player.y - 40, "BEAMS");
      return;
    }
    if (this.hero === "cuboe" && !grounded && this.spend(35)) {
      this.masterCombo("laser");
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        this.shootAngle(this.player.x, this.player.y, Math.cos(a), Math.sin(a));
      }
      this.pop(this.player.x, this.player.y - 40, "LASER");
      return;
    }
    if (this.hero === "cubro" && actions.up && this.spend(40)) {
      this.doBurst();
      return;
    }
    if (this.hero === "cubro" && actions.run && this.spend(25)) {
      this.masterCombo("rocket");
      this.shoot(this.player.x + this.facing * 20, this.player.y, this.facing, true);
      this.pop(this.player.x, this.player.y - 40, "ROCKET");
      return;
    }

    const reach = this.hero === "cubro" ? 54 : 42;
    const hx = this.player.x + this.facing * reach;
    const hy = this.player.y;
    this.mobs.forEach((m) => {
      if (!m.spr.active) return;
      if (Phaser.Math.Distance.Between(hx, hy, m.spr.x, m.spr.y) < 50) this.hitMob(m, 1);
    });
    if (this.hero === "cubro" && this.mach > 0.4) {
      this.masterCombo("tornado");
      this.mobs.forEach((m) => {
        if (m.spr.active && Math.abs(m.spr.x - this.player.x) < 90 && Math.abs(m.spr.y - this.player.y) < 60)
          this.hitMob(m, 1);
      });
    }
  }

  private doSpecial(actions: ReturnType<typeof readActions>) {
    if (this.hero === "cuboe") {
      if (actions.up && this.spend(40)) {
        this.holeT = 2;
        this.masterCombo("blackhole");
        sfx.boom();
        this.pop(this.player.x, this.player.y - 40, "BLACK HOLE");
      } else if (this.spend(20)) {
        this.shieldT = 5;
        this.masterCombo("shield");
        sfx.ui();
      }
    } else if (actions.up && this.spend(50)) {
      this.burstT = 8;
      this.speedT = 8;
      this.masterCombo("infinity");
      sfx.pizza();
      this.pop(this.player.x, this.player.y - 40, "INFINITY");
    } else if (this.spend(25)) {
      this.shieldT = 8;
      this.masterCombo("barrier");
      sfx.ui();
      this.pop(this.player.x, this.player.y - 40, "BARRIER");
    }
  }

  private doBurst() {
    this.burstT = 1.2;
    this.masterCombo("burst");
    sfx.boom();
    this.trauma = Math.min(1, this.trauma + 0.55);
    let kills = 0;
    this.mobs.forEach((m) => {
      if (!m.spr.active) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, m.spr.x, m.spr.y) < 180) {
        this.hitMob(m, 3);
        kills++;
      }
    });
    if (kills) useGame.getState().persist({ saiyanKills: useGame.getState().save.saiyanKills + kills });
    this.pop(this.player.x, this.player.y - 40, "BURST");
  }

  private hitMob(m: Mob, dmg: number) {
    if (m.spr.getData("flash")) return;
    if (m.kind === "boss" && !m.spr.getData("open")) {
      this.pop(m.spr.x, m.spr.y - 50, "FLASHING");
      return;
    }
    m.hp -= dmg;
    m.spr.setTintFill(0xffffff);
    m.spr.setData("flash", true);
    this.time.delayedCall(80, () => {
      if (m.spr.active) {
        m.spr.clearTint();
        m.spr.setData("flash", false);
      }
    });
    this.trauma = Math.min(1, this.trauma + 0.28);
    this.dust.emitParticleAt(m.spr.x, m.spr.y, 6);
    sfx.hit();
    this.addCombo(100);
    this.meter = Math.min(100, this.meter + 8);
    if (m.hp <= 0) {
      this.pop(m.spr.x, m.spr.y, m.kind === "boss" ? "KO" : "+100");
      m.spr.destroy();
      if (m.kind === "boss") this.winBoss();
    }
  }

  private tickMobs() {
    const now = this.time.now;
    for (const m of this.mobs) {
      if (!m.spr.active) continue;
      const body = m.spr.body as Phaser.Physics.Arcade.Body;
      m.spr.setFlipX(m.dir < 0);
      if (m.kind === "boss") {
        this.tickBoss(m, now);
        continue;
      }
      const spd = m.kind === "nincube" ? 90 : m.kind === "pump" ? 55 : 70;
      if (m.kind !== "cannon") body.setVelocityX(m.dir * spd);
      if (body.blocked.left) m.dir = 1;
      if (body.blocked.right) m.dir = -1;
      if (m.kind === "cannon" && now > m.next) {
        m.next = now + 1600;
        this.shoot(m.spr.x + 24, m.spr.y, 1);
      }
      if (m.kind === "pump" && body.blocked.down && Math.random() < 0.01) body.setVelocityY(-420);
      if (this.hurtT <= 0 && this.shieldT <= 0 && this.invulnT <= 0 && this.player.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.spr.x, m.spr.y);
        if (dist < 40) {
          const pbody = this.player.body as Phaser.Physics.Arcade.Body;
          if (pbody.velocity.y > 80 && this.player.y < m.spr.y) {
            pbody.setVelocityY(-560);
            this.hitMob(m, 1);
            this.masterCombo("aeraste");
          } else {
            this.hurt(1);
            pbody.setVelocity(-this.facing * 220, -240);
          }
        }
      }
    }
  }

  private openBoss(m: Mob) {
    m.spr.setTint(0xffe088);
    m.spr.setData("open", true);
    this.time.delayedCall(560, () => {
      if (!m.spr.active) return;
      m.spr.clearTint();
      m.spr.setData("open", false);
    });
  }

  private tickBoss(m: Mob, now: number) {
    const body = m.spr.body as Phaser.Physics.Arcade.Body;
    const dx = this.player.x - m.spr.x;
    m.dir = dx < 0 ? -1 : 1;
    if (now < m.next) {
      body.setVelocityX(0);
      return;
    }
    const id = this.level.bossId ?? "f1-boss";
    if (id === "f1-boss" || id === "f3-boss") {
      body.setVelocityX(m.dir * 340);
      m.next = now + 1100;
      this.time.delayedCall(420, () => {
        if (m.spr.active) {
          (m.spr.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
          this.openBoss(m);
        }
      });
    } else if (id === "f2-boss") {
      this.shoot(m.spr.x, m.spr.y - 10, m.dir);
      this.incoming++;
      m.next = now + 1100;
      this.openBoss(m);
    } else if (id === "f4-boss") {
      this.shoot(m.spr.x, m.spr.y, 1);
      this.shoot(m.spr.x, m.spr.y, -1);
      m.next = now + 1400;
      this.openBoss(m);
    } else {
      this.shoot(m.spr.x, m.spr.y - 8, m.dir);
      body.setVelocityX(m.dir * 160);
      m.next = now + 800;
      this.openBoss(m);
    }
    if (this.hurtT <= 0 && this.shieldT <= 0 && this.invulnT <= 0) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, m.spr.x, m.spr.y) < 52) this.hurt(1);
    }
  }

  private shoot(x: number, y: number, dir: number, friendly = false) {
    const b = this.shots.create(x, y, "pickups", friendly ? 1 : 0) as Phaser.Physics.Arcade.Sprite;
    b.setDisplaySize(22, 22);
    b.setData("friendly", friendly);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(dir * (friendly ? 420 : 280), 0);
    if (friendly) {
      this.time.delayedCall(80, () => {
        this.mobs.forEach((m) => {
          if (m.spr.active && Phaser.Math.Distance.Between(b.x, b.y, m.spr.x, m.spr.y) < 46) this.hitMob(m, 2);
        });
      });
    }
    this.time.delayedCall(2400, () => b.destroy());
  }

  private shootAngle(x: number, y: number, dx: number, dy: number) {
    const b = this.shots.create(x, y, "pickups", 1) as Phaser.Physics.Arcade.Sprite;
    b.setDisplaySize(16, 16);
    b.setData("friendly", true);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(dx * 360, dy * 360);
    this.time.delayedCall(40, () => {
      this.mobs.forEach((m) => {
        if (m.spr.active && Phaser.Math.Distance.Between(b.x, b.y, m.spr.x, m.spr.y) < 50) this.hitMob(m, 1);
      });
    });
    this.time.delayedCall(900, () => b.destroy());
  }

  private grab(pk: Phaser.Physics.Arcade.Sprite) {
    const v = Number(pk.getData("value") ?? 20);
    this.addCombo(v);
    useGame.getState().persist({ candyBux: useGame.getState().save.candyBux + (v >= 50 ? 50 : 5) });
    this.pop(pk.x, pk.y, `+${v}`);
    sfx.pickup();
    this.meter = Math.min(100, this.meter + 4);
    pk.destroy();
  }

  private addCombo(pts: number) {
    this.combo += 1;
    this.comboT = 2.2;
    this.score += pts * Math.min(8, 1 + Math.floor(this.combo / 3));
    if (this.combo > 1) sfx.combo();
  }

  private hurt(n: number) {
    if (this.hurtT > 0 || this.invulnT > 0) return;
    this.hurtT = 0.85;
    this.hp -= n;
    this.damaged = true;
    this.trauma = Math.min(1, this.trauma + 0.5);
    this.cameras.main.flash(80, 180, 40, 40);
    sfx.hurt();
    if (this.hp <= 0) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.frozen = true;
        sfx.lose();
        emitGame({ t: "over" });
        return;
      }
      this.hp = this.maxHp;
      this.player.setPosition(this.spawn.x, this.spawn.y);
    }
  }

  private fallOut() {
    useGame.getState().persist({ pits: useGame.getState().save.pits + 1 });
    if (useGame.getState().save.pits >= 20) this.unlockLore("warlock");
    this.hurt(1);
    this.player.setPosition(this.spawn.x, this.spawn.y);
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  private tickGoal() {
    if (this.level.isHub || this.level.isBoss) return;
    const target = this.goal === "exit" ? this.exitPt : this.spawn;
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
    if (d > 42) return;
    if (this.goal === "exit") {
      if (this.level.isFinal) {
        this.finish("normal");
        return;
      }
      this.startSugarTime();
    } else if (this.pizza) {
      this.completeLevel();
    }
  }

  private startSugarTime() {
    this.pizza = true;
    this.timer = this.level.pizzaTime || 70;
    this.goal = "start";
    this.cameras.main.flash(180, 255, 80, 40);
    this.cameras.main.setBackgroundColor(0x3a1008);
    sfx.pizza();
    this.pop(this.player.x, this.player.y - 20, "SUGAR TIME");
    for (let i = 0; i < 3; i++) {
      this.spawnMob(this.exitPt.x - 80 - i * 70, this.exitPt.y - 8, i === 1 ? "nincube" : "boxguy");
    }
  }

  private tickPizza(dt: number) {
    if (!this.pizza && this.level.id === "f5-2") {
      this.pizza = true;
      this.timer = this.level.pizzaTime || 90;
    }
    if (!this.pizza && this.level.isFinal) {
      this.pizza = true;
      this.timer = this.level.pizzaTime || 240;
    }
    if (!this.pizza) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      if (this.level.isFinal) {
        this.finish("bad");
        return;
      }
      this.hurt(1);
      this.timer = 12;
    }
  }

  private tickInteract(actions: ReturnType<typeof readActions>) {
    this.prompt = "";
    if (!this.level.isHub && !this.level.isBoss) return;
    let nearest: (typeof this.interactives)[0] | null = null;
    let best = 70;
    for (const it of this.interactives) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.x, it.y);
      if (d < best) {
        best = d;
        nearest = it;
      }
    }
    if (!nearest) return;
    const names: Record<string, string> = {
      door: "Enter  ·  Up / Jump",
      boss: "Boss gate  ·  400 bux  ·  Up",
      elevator: "Next floor  ·  Up",
      pc: "Station  ·  Up",
      giver: "Candy Bux  ·  Up",
      rift: "Strange rift  ·  Up",
      metroid: "Metroid platform  ·  Attack",
      tv: "It's Me  ·  Up",
    };
    this.prompt = names[nearest.kind] ?? "Up";
    if (nearest.kind === "metroid" && actions.attackPressed) {
      this.metroidHit = true;
      this.unlockLore("fake-cuboe");
      this.pop(nearest.x, nearest.y, "LORE");
    }
    if (!actions.upPressed && !(this.level.isHub && actions.jumpPressed)) return;
    sfx.door();
    if (nearest.kind === "door") this.scene.restart({ levelId: nearest.id });
    if (nearest.kind === "pc") emitGame({ t: "interact", kind: "pc", id: "pc" });
    if (nearest.kind === "tv") {
      emitGame({ t: "toast", text: "it's Me" });
      this.pop(nearest.x, nearest.y - 20, "it's Me");
    }
    if (nearest.kind === "giver") {
      useGame.getState().persist({ candyBux: useGame.getState().save.candyBux + 50 });
      this.pop(nearest.x, nearest.y, "+50 BUX");
    }
    if (nearest.kind === "rift") {
      this.unlockLore("rift");
      this.pop(nearest.x, nearest.y, "UNIVERSE RIFT");
    }
    if (nearest.kind === "boss") this.tryBoss();
    if (nearest.kind === "elevator") this.tryElevator();
  }

  private tryBoss() {
    const floor = useGame.getState().save.floor;
    const f = FLOORS[floor - 1]!;
    const done = f.levels.filter((l) => useGame.getState().save.completed.includes(l.id)).length;
    if (done < 4) {
      this.pop(this.player.x, this.player.y - 30, "Clear all 4 rooms");
      return;
    }
    if (useGame.getState().save.candyBux < f.keyCost) {
      this.pop(this.player.x, this.player.y - 30, `${f.keyCost} candy bux`);
      return;
    }
    useGame.getState().persist({ candyBux: useGame.getState().save.candyBux - f.keyCost });
    this.scene.restart({ levelId: f.boss.id });
  }

  private tryElevator() {
    const floor = useGame.getState().save.floor;
    const f = FLOORS[floor - 1]!;
    if (!useGame.getState().save.bosses.includes(f.boss.id)) {
      this.pop(this.player.x, this.player.y - 30, "Beat the floor boss");
      return;
    }
    if (floor >= 5) {
      this.scene.restart({ levelId: "final-run" });
      return;
    }
    const next = floor + 1;
    const unlocked = Array.from(new Set([...useGame.getState().save.unlockedFloors, next]));
    useGame.getState().persist({ floor: next, unlockedFloors: unlocked });
    this.scene.restart({ levelId: hubIdFor(next) });
  }

  private completeLevel() {
    this.frozen = true;
    const rank = rankFromScore(this.score, this.damaged, this.secrets);
    const save = useGame.getState().save;
    const completed = save.completed.includes(this.levelId) ? save.completed : [...save.completed, this.levelId];
    const ranks = { ...save.ranks, [this.levelId]: rank };
    if (save.highScore < this.score) useGame.getState().persist({ highScore: this.score });
    useGame.getState().persist({ completed, ranks });
    sfx.win();
    emitGame({ t: "rank", levelId: this.levelId, rank, score: this.score });
  }

  private winBoss() {
    this.frozen = true;
    const id = this.level.bossId ?? this.levelId;
    const save = useGame.getState().save;
    const bosses = save.bosses.includes(id) ? save.bosses : [...save.bosses, id];
    useGame.getState().persist({ bosses });
    if (id === "f1-boss" && this.incoming > 0 && this.blocked / this.incoming >= 0.25) this.unlockLore("choco");
    if (id === "f2-boss" && this.incoming > 0 && this.blocked / this.incoming >= 0.5) this.unlockLore("outlaw");
    if (id === "f3-boss" && !this.damaged) this.unlockLore("fake-cubro");
    const rank = rankFromScore(this.score + 3000, this.damaged, 0);
    sfx.win();
    emitGame({ t: "rank", levelId: id, rank, score: this.score + 3000 });
  }

  private finish(ending: string) {
    this.frozen = true;
    const save = useGame.getState().save;
    const endings = save.endings.includes(ending) ? save.endings : [...save.endings, ending];
    useGame.getState().persist({ endings });
    if (endings.length >= 5 && !endings.includes("true")) {
      useGame.getState().persist({ endings: [...endings, "true"] });
      emitGame({ t: "win", ending: "true" });
      return;
    }
    emitGame({ t: "win", ending });
  }

  private unlockLore(id: string) {
    const save = useGame.getState().save;
    if (save.lore.includes(id)) return;
    useGame.getState().persist({ lore: [...save.lore, id] });
    this.pop(this.player.x, this.player.y - 40, "SECRET LORE");
  }

  private masterCombo(id: string) {
    const save = useGame.getState().save;
    const list = save.combos[this.hero];
    if (list.includes(id)) return;
    const next = { ...save.combos, [this.hero]: [...list, id] };
    useGame.getState().persist({ combos: next });
    if (next[this.hero].length >= 5) this.unlockLore(this.hero);
  }

  private pop(x: number, y: number, text: string) {
    const t = this.add
      .text(x, y, text, { fontFamily: "Lilita One, Impact, sans-serif", fontSize: "22px", color: "#fff4d6" })
      .setOrigin(0.5)
      .setDepth(30);
    this.tweens.add({ targets: t, y: y - 46, alpha: 0, duration: 640, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  }

  private pushHud() {
    const rank = rankFromScore(this.score, this.damaged, this.secrets);
    emitGame({
      t: "hud",
      score: this.score,
      combo: this.combo,
      lives: this.lives,
      hp: this.hp,
      maxHp: this.maxHp,
      candy: useGame.getState().save.candyBux,
      timer: this.pizza ? this.timer : 0,
      pizza: this.pizza,
      rank,
      label: this.prompt || this.label,
      meter: this.meter,
    });
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
  }

  goHub() {
    this.scene.restart({ levelId: hubIdFor(useGame.getState().save.floor) });
  }

  private wireControlsTest() {
    const self = this;
    window.__controlsTest = {
      getYaw: () => self.player?.x ?? 0,
      getSpeed: () => Math.abs((self.player?.body as Phaser.Physics.Arcade.Body | undefined)?.velocity.x ?? 0),
      setKeys: (codes: string[]) => setInjected(codes),
    };
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
    };
  }
}



