const GAME_WIDTH = 640;
const GAME_HEIGHT = 640;
const TILE_SIZE = 16;
const TILES_X = GAME_WIDTH / TILE_SIZE;
const TILES_Y = GAME_HEIGHT / TILE_SIZE;
const FPS = 1000 / 60;
const GRID = false;
const BLUE = 0;
const PINK = 1;
const GREEN = 2;
const WHITE = 2;
const BLACK = 0;
const P1 = 0;
const P2 = 1;
const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;

class Game {
  constructor(container, canvas, ctx) {
    this.cnt = container;
    this.canvas = canvas;
    this.ctx = ctx;
    this.colors = null;
    this.images = null;
    this.cubes = [];
    this.levels = [];
    this.lastTime = 0;
    this.state = null;
    this.animId = null;
    this.audio = new AudioManager();
  }

  init = async() => {
    window.addEventListener("resize", this.resize);
    await this.audio.init();
    await this.audio.load("match", "msc/battles/1.ogg");
    await this.audio.playMusic("match");
  }

  resize = () => {
    const rect = this.cnt.getBoundingClientRect();
    const width = rect.width / GAME_WIDTH;
    const height = rect.height / GAME_HEIGHT;

    const scale = Math.max(Math.floor(Math.min(width, height)), 0.5);

    const w = GAME_WIDTH * scale;
    const h = GAME_HEIGHT * scale;

    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;

    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";

    this.ctx.imageSmoothingEnabled = false;
  }
  
  changeState(newState) {
    this.state = newState;
  }

  loop = (time) => {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    this.state.update(dt);
    this.state.draw(this.ctx);
    requestAnimationFrame(this.loop);
  }
}

class State {
  constructor(game) {
    this.game = game;
  }
  update(dt) { }
  draw(ctx) { }
}

class Match extends State {
  constructor(game, players, objects, level) {
    super(game);
    this.players = players;
    this.objects = objects;
    this.level = level;
    this.init();
  }
  
  init() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  onKeyDown = (e) => {
    if (e.repeat) return;
    const code = e.keyCode;
    const input1 = this.players[P1].input;
    const input2 = this.players[P2].input;
    //console.log(code);
    switch(code) {
      case 65: if (input1.at(-1) != "left") input1.push("left"); break;
      case 68: if (input1.at(-1) != "right") input1.push("right"); break;
      case 87: if (input1.at(-1) != "up") input1.push("up"); break;
      case 83: if (input1.at(-1) != "down") input1.push("down"); break;

      case 37: if (input2.at(-1) != "left") input2.push("left"); break;
      case 39: if (input2.at(-1) != "right") input2.push("right"); break;
      case 38: if (input2.at(-1) != "up") input2.push("up"); break;
      case 40: if (input2.at(-1) != "down") input2.push("down"); break;
    }
    //console.log(input1);
    e.preventDefault()
  }

  onKeyUp = (e) => {
    const code = e.keyCode;
    const input1 = this.players[P1].input;
    const input2 = this.players[P2].input
    switch(code){
      case 65: if (input1.indexOf("left") != -1) input1.splice(input1.indexOf("left"), 1); break;
      case 68: if (input1.indexOf("right") != -1) input1.splice(input1.indexOf("right"), 1); break;
      case 87: if (input1.indexOf("up") != -1) input1.splice(input1.indexOf("up"), 1); break;
      case 83: if (input1.indexOf("down") != -1) input1.splice(input1.indexOf("down"), 1); break;

      case 37: if (input2.indexOf("left") != -1) input2.splice(input2.indexOf("left"), 1); break;
      case 39: if (input2.indexOf("right") != -1) input2.splice(input2.indexOf("right"), 1); break;
      case 38: if (input2.indexOf("up") != -1) input2.splice(input2.indexOf("up"), 1); break;
      case 40: if (input2.indexOf("down") != -1) input2.splice(input2.indexOf("down"), 1); break;
    }
    //console.log(input1);
    e.preventDefault();
  }

  update(dt) {
    for (const p of this.players) {
      const path = new Path(p.x, p.y, TILE_SIZE, TILE_SIZE, p.cube.color);
      this.objects.push(path);
      p.update(this.level.walls, this.objects);
    }

    for (let i = this.objects.length-1; i >= 0; i--) {
      const o = this.objects[i];

      if (o instanceof Flag) {
        o.update(this.players);
      } else {
        o.update();
      }

      if(o.done){
        this.objects.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (GRID) drawGrid(ctx);
    this.level.draw(ctx);
    for (const o of this.objects) {
      o.draw(ctx);
    }
    for (const p of this.players) {
      p.draw(ctx);
    }
  }
}

class Player {
  constructor(cube, x, y) {
    this.cube = cube;
    this.x = x;
    this.y = y;
    this.input = new Array();
    this.input.push("idle");
    this.state = this.input.at(-1);
    this.prev = this.input.at(-1);
    this.collisions = [false, false, false, false];
    this.left = 0;
    this.spd = 4;
  }

  draw(ctx) {
    ctx.drawImage(this.cube.img, this.x, this.y);
  }

  checkCollision(walls) {
    const tx = this.x / TILE_SIZE;
    const ty = this.y / TILE_SIZE;
    this.collisions[LEFT] = (walls[tx-1][ty] != "" || !this.x);
    this.collisions[RIGHT] = (walls[tx+1][ty] != "" || this.x == 624);
    this.collisions[UP] = (walls[tx][ty-1] != "");
    this.collisions[DOWN] = (walls[tx][ty+1] != "");
  }

  update(walls, objects) {
    if (!this.left) {
      this.state = this.input.at(-1);
      if (this.state == this.prev && this.input.length > 2) {
        this.state = this.input.at(-2);
      }
      if (this.input != "idle") {
        this.left = 16;
        this.checkCollision(walls);
      }
    }

    if (this.left) {
      switch (this.state) {
        case "left": 
          if (!this.collisions[0]) {
            this.x -= this.spd;
          } else {
            this.left = this.spd;
          }
          break;
        case "right": 
          if (!this.collisions[1]) {
            this.x += this.spd;
          } else {
            this.left = this.spd;
          }
          break;
        case "up": 
          if (!this.collisions[2]) {
            this.y -= this.spd;
          } else {
            this.left = this.spd;
          }
          break;
        case "down": 
          if (!this.collisions[3]) {
            this.y += this.spd;
          } else {
            this.left = this.spd;
          }
          break;
      }
      this.left -= this.spd;
      this.prev = this.state;
    }
  }
}

class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.musicSource = null;
    this.buffers = {};
    this.enabled = true;
  }

  async init() {
    this.ctx = new AudioContext();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.ctx.destination);
  }

  async load(name, src) {
    const res = await fetch(src);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.buffers[name] = buffer;
  }

  playMusic(name, loop = true) {
    if (!this.enabled || !this.buffers[name]) return;

    if (this.musicSource) {
      this.musicSource.stop();
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[name];
    source.loop = loop;
    source.connect(this.musicGain);
    source.start(0);

    this.musicSource = source;
  }

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.stop();
      this.musicSource = null;
    }
  }

  setMusicVolume(v) {
    this.musicGain.gain.value = v;
  }
}

class Wall {
  constructor(spr, x, y, inum) {
    this.spr = spr;
    this.x = x;
    this.y = y;
    this.inum;
    this.sx = (inum % 5);
    this.sy = Math.floor(inum/5);
  }

  draw(ctx) {
    ctx.drawImage(
      this.spr, 
      this.sx*TILE_SIZE, 
      this.sy*TILE_SIZE, 
      TILE_SIZE, 
      TILE_SIZE, 
      this.x*TILE_SIZE, 
      this.y*TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    )
  }
}

class Path {
  constructor(x, y, w, h, color) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.a = 0.90;
    this.done = false;
    this.color = color;
  }

  draw(ctx) {
    ctx.globalAlpha = this.a;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }

  update() {
    if (this.a <= 0.10) {
      this.done = true;
    } else {
      this.a -= 0.03;
    }
  }
}

class Flag {
  constructor(spr, x, y){
    this.spr = spr;
    this.x = x;
    this.y = y;
    this.done = false;
  }
  
  draw(ctx){
    ctx.globalAlpha = 1;
    ctx.drawImage(this.spr, this.x, this.y);
  }

  update(players) {
    for (const p of players) {
      if (p.x == this.x && p.y == this.y) {
        p.cube.color = "white";
        p.spd = 2;
        this.done = true;
        break;
      }
    }
  }
}

class Cube {
  constructor(img, color) {
    this.img = img;
    this.color = color;
  }
}

class Level {
  constructor(img, back, posP1, posP2) {
    this.tileset = img;
    this.back = back;
    this.posP1 = posP1;
    this.posP2 = posP2;
    this.walls = []; 
  }
  
  load(level) {
    this.walls = [];
    for (let i = 0; i < TILES_X; i++) {
      const row = [];
      for(let j = 0; j < TILES_Y; j++){
        //console.log(levels[0][(i*(GAME_WIDTH/TILE_SIZE))+j]);
        let tile = level[(j*TILES_X)+i];
        if (tile != ' ') {
          let inum = tile.charCodeAt(0) - 'a'.charCodeAt(0);
          //console.log(inum);
          let wall = new Wall(this.tileset, i, j, inum);
          row.push(wall);
        } else {
          row.push("");
        }
      }
      this.walls.push(row);
    }
  }

  draw(ctx) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.back;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let i = 0; i < TILES_X; i++) {
      for (let j = 0; j < TILES_Y; j++) {
        if (this.walls[i][j] != "") {
          this.walls[i][j].draw(ctx);
        }
      }
    }
  }
}

async function loadImage(src) {
  const img = new Image();
  img.src = "img/" + src;
  await img.decode();
  return img;
}

function drawGrid(ctx) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = "black";
  for(let i = 16; i < GAME_WIDTH; i += 16){
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i,GAME_HEIGHT);
    ctx.stroke();
  }
  for(let i=16;i<GAME_HEIGHT;i+=16){
    ctx.beginPath();
    ctx.moveTo(0,i);
    ctx.lineTo(GAME_HEIGHT,i);
    ctx.stroke();
  }
}

async function main() {
  const container = document.getElementById("game-container");
  const canvas = document.getElementById("game");
  const pre = document.getElementById("pre");

  canvas.style.display = "block";
  pre.style.display = "none";

  const ctx = canvas.getContext("2d");
  const game = new Game(container, canvas, ctx);
  await game.init();

  const colors = {
    cubes: ["cyan", "pink", "lime"],
    lvls: ["black"]
  }

  const images = {
    cubes: [],
    lvls: [],
    objs: []
  };

  const cubes = [];
  const levels = [];
  const objects = [];
  const players = [];
  
  const [
    imgCubeBlue,
    imgCubePink,
    imgCubeGreen,
    imgLvl1,
    imgFlag
  ] = await Promise.all([
    loadImage("cubes/blue.png"),
    loadImage("cubes/pink.png"),
    loadImage("cubes/green.png"),
    loadImage("lvls/1.png"),
    loadImage("objs/flag.png")
  ]);

  images.cubes.push(
    imgCubeBlue,
    imgCubePink,
    imgCubeGreen
  );

  images.lvls.push(
    imgLvl1
  );

  images.objs.push(
    imgFlag
  );

  cubes.push(
    new Cube(images.cubes[BLUE], colors.cubes[BLUE]),
    new Cube(images.cubes[PINK], colors.cubes[PINK]),
    new Cube(images.cubes[GREEN], colors.cubes[GREEN])
  );
  
  //document.removeEventListener("keydown", preventKeyboardScroll, false);

  const flag = new Flag(images.objs[0], 320, 320);
  objects.push(flag);

  levels.push(
    new Level(
      images.lvls[0], 
      colors.lvls[BLACK],
      {x: 48, y: 48}, 
      {x: 576, y: 48}
    )
  );

  levels[0].load(lvls[0]);

  players.push(
    new Player(cubes[BLUE], levels[0].posP1.x, levels[0].posP1.y),
    new Player(cubes[GREEN], levels[0].posP2.x, levels[0].posP2.y)
  );
  
  game.resize();

  game.colors = colors;
  game.images = images;
  game.cubes = cubes;
  game.levels = levels;

  game.changeState(
    new Match(
      game,
      players,
      objects,
      levels[0]
    )
  );

  game.animId = requestAnimationFrame(game.loop);
}
