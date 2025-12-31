const GAME_WIDTH = 640;
const GAME_HEIGHT = 640;
const TILE_SIZE = 16;
const TILES_X = GAME_WIDTH / TILE_SIZE;
const TILES_Y = GAME_HEIGHT / TILE_SIZE;
const FPS = 1000 / 60;
const GRID = false;
const BLUE = 0;
const PINK = 1;
const YELLOW = 2;
const BLACK = 0;
const P1 = 0;
const P2 = 1;

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
  }

  init = () => {
    window.addEventListener("resize", this.game.resize);
  }

  resize = () => {
    const rect = this.cnt.getBoundingClientRect();
    const width = rect.width/GAME_WIDTH;
    const height = rect.height/GAME_HEIGHT;

    const scale = Math.floor(Math.min(width, height));

    this.canvas.width = GAME_WIDTH * scale;
    this.canvas.height = GAME_HEIGHT * scale;

    this.canvas.style.width = this.canvas.width + "px";
    this.canvas.style.height = this.canvas.height + "px";

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
  
  init = () => {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  onKeyDown = (e) => {
    if (e.repeat) return;
    var code = e.keyCode;
    //console.log(code);
    switch(code) {
      case 65:
        if (this.players[P1].input.at(-1)!="left") this.players[P1].input.push("left");
        break;
      case 68:
        if(this.players[P1].input.at(-1)!="right") this.players[P1].input.push("right");
        break;
      case 87:
        if(this.players[P1].input.at(-1)!="up") this.players[P1].input.push("up");
        break;
      case 83:
        if(this.players[P1].input.at(-1)!="down") this.players[P1].input.push("down"); 
        break;

      case 37:
        if(this.players[P2].input.at(-1)!="left") this.players[P2].input.push("left");
        break;
      case 39:
        if(this.players[P2].input.at(-1)!="right") this.players[P2].input.push("right");
        break;
      case 38:
        if(this.players[P2].input.at(-1)!="up") this.players[P2].input.push("up");
        break;
      case 40:
        if(this.players[P2].input.at(-1)!="down") this.players[P2].input.push("down"); 
        break;
    }
    //console.log(this.players[P1].input);
    e.preventDefault()
  }

  onKeyUp = (e) => {
    var code = e.keyCode;
    switch(code){
      case 65:
        if(this.players[P1].input.indexOf("left")!=-1)
          this.players[P1].input.splice(this.players[P1].input.indexOf("left"),1);
        break;
      case 68:
        if(this.players[P1].input.indexOf("right")!=-1)
          this.players[P1].input.splice(this.players[P1].input.indexOf("right"),1);
        break;
      case 87:
        if(this.players[P1].input.indexOf("up")!=-1)
          this.players[P1].input.splice(this.players[P1].input.indexOf("up"),1);
        break;
      case 83:
        if(this.players[P1].input.indexOf("down")!=-1)
          this.players[P1].input.splice(this.players[P1].input.indexOf("down"),1);
        break;
      case 37:
        if(this.players[P2].input.indexOf("left")!=-1)
          this.players[P2].input.splice(this.players[P2].input.indexOf("left"),1);
        break;
      case 39:
        if(this.players[P2].input.indexOf("right")!=-1)
          this.players[P2].input.splice(this.players[P2].input.indexOf("right"),1);
        break;
      case 38:
        if(this.players[P2].input.indexOf("up")!=-1)
          this.players[P2].input.splice(this.players[P2].input.indexOf("up"),1);
        break;
      case 40:
        if(this.players[P2].input.indexOf("down")!=-1)
          this.players[P2].input.splice(this.players[P2].input.indexOf("down"),1);
        break;
    }
    //console.log(this.players[P1].input);
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
  }

  draw(ctx) {
    ctx.drawImage(this.cube.img, this.x, this.y);
  }

  checkCollision(walls) {
      console.log(this.x);
      console.log(this.x/TILE_SIZE);
      console.log(this.y/TILE_SIZE);
    if(!this.x){
      this.collisions[0]=true;
    }else if(walls[(this.x/TILE_SIZE)-1][(this.y/TILE_SIZE)]!=""){
      this.collisions[0]=true;
    }else{
      this.collisions[0]=false;
    }
    if(this.x==(640-16)){
      this.collisions[1]=true;
    }else if(walls[(this.x/TILE_SIZE)+1][(this.y/TILE_SIZE)]!=""){
      this.collisions[1]=true;
    }else{
      this.collisions[1]=false;
    }
    if(walls[(this.x/TILE_SIZE)][(this.y/TILE_SIZE)-1]!=""){
      this.collisions[2]=true;
    }else{
      this.collisions[2]=false;
    }
    if(walls[(this.x/TILE_SIZE)][(this.y/TILE_SIZE)+1]!=""){
      this.collisions[3]=true;
    }else{
      this.collisions[3]=false;
    }
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
            this.x--;
          } else {
            this.left=1;
          }
          break;
        case "right": 
          if (!this.collisions[1]) {
            this.x++;
          } else {
            this.left=1;
          }
          break;
        case "up": 
          if (!this.collisions[2]) {
            this.y--;
          } else {
            this.left=1;
          }
          break;
        case "down": 
          if (!this.collisions[3]) {
            this.y++;
          } else {
            this.left=1;
          }
          break;
      }
      this.left--;
      this.prev = this.state;
    }
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
    this.a = 1.00;
    this.done = false;
    this.color = color;
  }

  draw(ctx) {
    ctx.globalAlpha = this.a;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }

  update() {
    if (this.a <= 0.01) {
      this.done = true;
    } else {
      this.a -= 0.02;
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
        p.cube.color = "yellow";
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
  const ctx = canvas.getContext("2d");
  const game = new Game(container, canvas, ctx);

  const colors = {
    cubes: ["cyan", "pink", "yellow"],
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
    imgLvl1,
    imgFlag
  ] = await Promise.all([
    loadImage("cubes/blue.png"),
    loadImage("cubes/pink.png"),
    loadImage("lvls/1.png"),
    loadImage("objs/flag.png")
  ]);

  images.cubes.push(
    imgCubeBlue,
    imgCubePink
  );

  images.lvls.push(
    imgLvl1
  );

  images.objs.push(
    imgFlag
  );

  cubes.push(
    new Cube(images.cubes[BLUE], colors.cubes[BLUE]),
    new Cube(images.cubes[PINK], colors.cubes[PINK])
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
    new Player(cubes[PINK], levels[0].posP2.x, levels[0].posP2.y)
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
