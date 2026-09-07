export type HeroId = "cuboe" | "cubro";
export type Rank = "P" | "S" | "A" | "B" | "C" | "D" | "F";

export const HEROES: Record<
  HeroId,
  {
    name: string;
    tag: string;
    lives: number;
    control: string;
    blurb: string;
    color: string;
    portrait: string;
  }
> = {
  cuboe: {
    name: "Cuboe",
    tag: "Easy",
    lives: 6,
    control: "Punch, shield, air stall",
    blurb: "Cream cube with dash eyes. Safer jumps, a forward shield, and the Aeraste stomp.",
    color: "#fff4d6",
    portrait: "/game/sprites/cuboe-portrait.png",
  },
  cubro: {
    name: "Cubro",
    tag: "Mild",
    lives: 9,
    control: "Skateboard, bounce, tornado",
    blurb: "Chocolate cube in visor shades. Faster mach run, bounce jump, and Super Saiyan Burst.",
    color: "#c47a3a",
    portrait: "/game/sprites/cubro-portrait.png",
  },
};

export const FLOORS = [
  {
    id: 1,
    name: "Candy Corn Valley",
    hubTitle: "Floor 1 Hub",
    bg: "/game/bg/candy-corn-valley.jpg",
    ground: "candy",
    tint: 0xffffff,
    levels: [
      { id: "f1-1", name: "Candy Corn Valley", kind: "level" as const },
      { id: "f1-2", name: "Marsh Mellow Mash", kind: "level" as const },
      { id: "f1-3", name: "Lolly Pop Forest", kind: "level" as const },
      { id: "f1-4", name: "Butter Scotch Mountain", kind: "level" as const },
    ],
    boss: { id: "f1-boss", name: "Choco Man", lives: 9 },
    keyCost: 400,
  },
  {
    id: 2,
    name: "Sugar Rush Desert",
    hubTitle: "Floor 2 Hub",
    bg: "/game/bg/sugar-rush-desert.jpg",
    ground: "candy",
    tint: 0xffd08a,
    levels: [
      { id: "f2-1", name: "Sugar Rush Desert", kind: "level" as const },
      { id: "f2-2", name: "Cookie War Farm", kind: "level" as const },
      { id: "f2-3", name: "Sour Showdown", kind: "level" as const },
      { id: "f2-4", name: "Butter Scotch Dune", kind: "level" as const },
    ],
    boss: { id: "f2-boss", name: "Marshmallow Outlaw", lives: 6 },
    keyCost: 400,
  },
  {
    id: 3,
    name: "Raisin Ruins",
    hubTitle: "Floor 3 Hub",
    bg: "/game/bg/marsh-mash.jpg",
    ground: "marsh",
    tint: 0xc9b8ff,
    levels: [
      { id: "f3-1", name: "Raisin Ruins", kind: "level" as const },
      { id: "f3-2", name: "Smash City", kind: "level" as const },
      { id: "f3-3", name: "Drunk Saloon", kind: "level" as const },
      { id: "f3-4", name: "Scotch T.V.", kind: "level" as const },
    ],
    boss: { id: "f3-boss", name: "Fake Candy Cubro", lives: 6 },
    keyCost: 400,
  },
  {
    id: 4,
    name: "Licorice Landfill",
    hubTitle: "Floor 4 Hub",
    bg: "/game/bg/hub.jpg",
    ground: "candy",
    tint: 0xb8d4c0,
    levels: [
      { id: "f4-1", name: "Licorice Landfill", kind: "level" as const },
      { id: "f4-2", name: "Cube Factory", kind: "level" as const },
      { id: "f4-3", name: "Sloppy Lab", kind: "level" as const },
      { id: "f4-4", name: "Butter Scotch Music Box", kind: "level" as const },
    ],
    boss: { id: "f4-boss", name: "Fake Candy Cuboe", lives: 6 },
    keyCost: 400,
  },
  {
    id: 5,
    name: "Ruin Pizza Plex",
    hubTitle: "Floor 5 Hub",
    bg: "/game/bg/marsh-mash.jpg",
    ground: "marsh",
    tint: 0xff9a6a,
    levels: [
      { id: "f5-1", name: "Ruin Pizza Plex", kind: "level" as const },
      { id: "f5-2", name: "Time Bomb Rush", kind: "level" as const },
      { id: "f5-3", name: "Grave Yard", kind: "level" as const },
      { id: "f5-4", name: "Butter Scotch Summit", kind: "level" as const },
    ],
    boss: { id: "f5-boss", name: "Candy Warlock", lives: 9 },
    keyCost: 400,
  },
] as const;

export const FINAL_RUN = {
  id: "final-run",
  name: "The Rotting Pumpkin",
  time: 240,
};

export const BOSSES: Record<
  string,
  {
    name: string;
    sprite: string;
    lives: number;
    moves: string[];
    hitWhen: string;
    lore: string;
  }
> = {
  "f1-boss": {
    name: "Choco Man",
    sprite: "choco",
    lives: 9,
    moves: ["Hadoken", "Shoryuken", "Tatsumaki", "Jump-in elbow"],
    hitWhen: "After a special, while he is flashing.",
    lore: "Block 25% of his attacks to claim The Lore of Choco Man.",
  },
  "f2-boss": {
    name: "Marshmallow Outlaw",
    sprite: "outlaw",
    lives: 6,
    moves: ["Sweet shots", "Super nuke", "Boot rush"],
    hitWhen: "Hit him while he is flashing after a shot.",
    lore: "Block 50% of his shots to claim The Lore of Marshmallow Outlaw.",
  },
  "f3-boss": {
    name: "Fake Candy Cubro",
    sprite: "cubro-idle",
    lives: 6,
    moves: ["Tornado copy", "Rocket shot", "Board rush"],
    hitWhen: "Same windows as Cubro — strike during recovery.",
    lore: "Beat him without taking damage for The Lore of Candy Cubro.",
  },
  "f4-boss": {
    name: "Fake Candy Cuboe",
    sprite: "cuboe-idle",
    lives: 6,
    moves: ["Aeraste copy", "Laser spin", "Shield bash"],
    hitWhen: "Same windows as Cuboe.",
    lore: "Attack the Metroid platform in this fight for The Lore of Fake Candy Cuboe.",
  },
  "f5-boss": {
    name: "Candy Warlock",
    sprite: "warlock",
    lives: 9,
    moves: ["Candy corn vine", "Licorice strike", "Candy ray"],
    hitWhen: "After a ray, while the crown flashes.",
    lore: "Fall into a pit 20 times in the campaign to unlock his backstory.",
  },
};

export const COMBOS = {
  cuboe: [
    { id: "aeraste", name: "Aeraste", input: "Jump on an enemy", desc: "Stomp to bounce-kill." },
    { id: "laser", name: "Spinning Laser", input: "Y + B with meter", desc: "Lasers spin in all directions." },
    { id: "shield", name: "Forward Shield", input: "Hold X", desc: "Protective shield for 4 seconds." },
    { id: "blackhole", name: "Black Hole", input: "Up + X with meter", desc: "Pulls enemies in." },
    { id: "beams", name: "Two-Side Energy Beam", input: "Up + Y with meter", desc: "Fires beams both ways." },
  ],
  cubro: [
    { id: "tornado", name: "Tornado Spin", input: "Attack while skating", desc: "Become a chocolate tornado." },
    { id: "rocket", name: "Rocket Shot", input: "Y + A", desc: "Launch the skateboard like a missile." },
    { id: "barrier", name: "Saiyan Barrier", input: "Special with meter", desc: "A barrier that lasts several seconds." },
    { id: "infinity", name: "Infinity Boost", input: "Up + X + Y", desc: "A 8-second super speed gem." },
    { id: "burst", name: "Super Saiyan Burst", input: "Up + B + Y", desc: "Energy burst that clears nearby foes." },
  ],
};

export const LORE = [
  { id: "choco", name: "The Lore of Choco Man", how: "Block 25% of Choco Man's attacks." },
  { id: "outlaw", name: "The Lore of Marshmallow Outlaw", how: "Block 50% of his shots." },
  { id: "cubro", name: "The Lore of Cubro", how: "Master all of Cubro's combos." },
  { id: "cuboe", name: "The Lore of Cuboe", how: "Master all of Cuboe's combos." },
  { id: "fake-cubro", name: "The Lore of Candy Cubro", how: "Beat Fake Candy Cubro without taking damage." },
  { id: "fake-cuboe", name: "The Lore of Fake Candy Cuboe", how: "Attack the Metroid platform in his fight." },
  { id: "warlock", name: "Candy Warlock Backstory", how: "Fall into a pit 20 times." },
  { id: "rift", name: "Universe Rift", how: "Fall into the secret spot at Butter Scotch Summit." },
];

export const ENDINGS = [
  { id: "normal", name: "Normal", how: "Complete the game and escape the rotting pumpkin." },
  { id: "bad", name: "Bad", how: "Fail to escape the rotting pumpkin." },
  { id: "good", name: "Good", how: "Punch the Warlock out of the rotting pumpkin and save every boss." },
  { id: "playco", name: "Playco Path", how: "Spare the Candy Warlock for a finale battle." },
  { id: "omega", name: "Omega Saiyan", how: "As Cubro, burst-kill 40 enemies and save every boss including the Warlock." },
  { id: "true", name: "True", how: "Collect every other ending. The Warlock becomes a friend." },
];

export const PROMO_CODES = [
  { code: "SYIOX", reward: "secret-sylux", label: "Unlocks secret boss Sylux" },
  { code: "WERE CUBRO", reward: "were-cubro", label: "Were-Cubro palette" },
  { code: "WERE CUBOE", reward: "were-cuboe", label: "Were-Cuboe palette" },
  { code: "METROID", reward: "metroid", label: "Secret Metroid arena" },
  { code: "MARIONETTE", reward: "marionette", label: "Secret boss Marionette" },
  { code: "MOTHERBRAIN", reward: "mother-brain", label: "Secret boss Mother Brain" },
  { code: "MRGAW", reward: "mrgaw", label: "Mr. Game and Watch" },
  { code: "OCTAVIO", reward: "octavio", label: "DJ Octavio Mecha 2.0" },
  { code: "INKLING", reward: "inkling", label: "Inkling Squid" },
];

export const MINIGAMES = [
  { id: "match", name: "Match and Hang", blurb: "Flip candy cards. Hang on with Up." },
  { id: "wreck", name: "Wrecking Wednesday", blurb: "Smash the licorice tower. Press Attack." },
  { id: "bomb", name: "Bomb for All", blurb: "Toss bombs at a spinning target." },
  { id: "fit", name: "Mr. Game and Fit", blurb: "Pose to match the silhouette." },
  { id: "glitch", name: "Glitch Puppet", blurb: "Mini-boss. Earn A or P on every other mini first." },
];

export function rankFromScore(score: number, damaged: boolean, secrets: number): Rank {
  if (score >= 14000 && !damaged && secrets > 0) return "P";
  if (score >= 11000) return "S";
  if (score >= 8000) return "A";
  if (score >= 5000) return "B";
  if (score >= 2500) return "C";
  if (score >= 800) return "D";
  return "F";
}

export function minigameRank(seconds: number): Rank {
  if (seconds <= 20) return "P";
  if (seconds <= 30) return "A";
  if (seconds <= 40) return "C";
  if (seconds <= 50) return "D";
  return "F";
}
