import kaboom, {
   KaboomCtx,
   LevelOpt,
} from "kaboom";

const k: KaboomCtx = kaboom({
   background: [134, 135, 247],
   width: 320,
   height: 240,
   scale: 2,
});

const {
   loadAseprite,
   loadRoot,
   loadSprite,
   isKeyDown,
   onKeyDown,
   onKeyPress,
   onKeyRelease,
   add,
   addLevel,
   anchor,
   area,
   body,
   camPos,
   color,
   debug,
   destroy,
   fixed,
   go,
   lifespan,
   offscreen,
   pos,
   scene,
   setGravity,
   sprite,
   text,
   toScreen,
   wait,
   vec2,
   z,
} = k;

const LEVELS = [
   [
      "                                                                                                ",
      "                                                                                                ",
      "      --?--                                                                                     ",
      "                                                                                                ",
      "                                                                                                ",
      "                                                                  ?                             ",
      "       ---                                                                                      ",
      "                                                                                                ",
      "                                                   ?    ?    ?                                  ",
      "                                                                                                ",
      "      -?-b-                           _                                                         ",
      "                                 _    |                                                         ",
      "                           _     |    |                _                                        ",
      "                           |     |    |       E        |   E    E                   H           ",
      "================     ===========================================================================",
      "================     ===========================================================================",
   ],
   [
      "                                                                                             ",
      "                                                                                             ",
      "                                                                                             ",
      "                                       ?                                                     ",
      "                                                                                             ",
      "                                   -?-                                                       ",
      "                                                                                             ",
      "      -?-b-                  -?-                                                             ",
      "                                                                                             ",
      "                                                                                             ",
      "                                                                                             ",
      "                                                                                             ",
      "       _                                            _                                        ",
      "       |                                            |          E    E            H           ",
      "================     ========================================================================",
      "================     ========================================================================",
   ],
];

const JUMP_FORCE = 315,
      SQUASH_FORCE = 144,
      SQUASH_JUMP_MULTIPLIER = 1.3;

function patrol(distance = 100, speed = 50, dir = 1) {
   return {
      id: "patrol",
      require: ["pos", "area"],
      startingPos: vec2(0, 0),
      async add() {
         await wait(0.01);
         this.startingPos = this.worldPos();
         this.onCollide((obj, displacement)=>{
            if (displacement.isLeft() || displacement.isRight()) {
               dir = -dir;
            }
         });
      },
      update() {
         const diff = this.worldPos().x - this.startingPos.x;
         if (diff >= distance) dir=-1;
         else if (diff <= -distance) dir=1;
         this.move(speed * dir, 0);
      },
   };
}

function enemy() {
   return {
      id: "enemy",
      require: ["pos", "area", "sprite", "patrol"],
      isAlive: true,
      update() {},
      squash() {
         this.isAlive = false;
         this.unuse("patrol");
         this.stop();
         this.unuse("body");
         this.frame = 2;
         this.use(lifespan(0.3, { fade: 0.1 }));
      },
   };
}

function bump(offset = 8, speed = 3, stopAtOrigin = true) {
   return {
      id: "bump",
      require: ["pos"],
      bumpOffset: offset,
      speed: speed,
      bumped: false,
      origY: 0,
      direction: -1,
      update() {
         if (this.bumped) {
            this.moveBy(0, this.direction * this.speed);
            if (this.pos.y < this.origY - this.bumpOffset) {
               this.direction = 1;
            }
            if (stopAtOrigin && this.pos.y >= this.origY) {
               this.bumped = false;
               this.moveTo(this.pos.x, this.origY);
               this.direction = -1;
            }
         }
      },
      bump() {
         this.origY = this.pos.y;
         this.bumped = true;
      },
   };
}

loadRoot("sprites/");
loadAseprite("mario", "Mario.png", "Mario.json");
loadAseprite("enemies", "enemies.png", "enemies.json");
loadSprite("ground", "ground.png");
loadSprite("questionBox", "questionBox.png");
loadSprite("emptyBox", "emptyBox.png");
loadSprite("brick", "brick.png");
loadSprite("coin", "coin.png");
loadSprite("bigMushy", "bigMushy.png");
loadSprite("pipeTop", "pipeTop.png");
loadSprite("pipeBottom", "pipeBottom.png");
loadSprite("shrubbery", "shrubbery.png");
loadSprite("hill", "hill.png");
loadSprite("cloud", "cloud.png");
loadSprite("castle", "castle.png");

const levelConf: LevelOpt = {
   // grid size
   tileWidth: 16,
   tileHeight: 16,
   pos: vec2(0, 0),
   tiles: {
      "=": () => [sprite("ground"), area(), body({isStatic: true}), anchor("bot"), "ground"],
      "-": () => [
         sprite("brick"),
         area(),
         body({isStatic: true}),
         anchor("bot"),
         bump(),
         "brick"
      ],
      H: () => [
         sprite("castle"),
         area(),
         anchor("bot"),
         "castle",
      ],
      "?": () => [
         sprite("questionBox"),
         area(),
         body({isStatic: true}),
         anchor("bot"),
         "questionBox",
         "coinBox",
      ],
      b: () => [
         sprite("questionBox"),
         area(),
         body({isStatic: true}),
         anchor("bot"),
         "questionBox",
         "mushyBox",
      ],
      "!": () => [
         sprite("emptyBox"),
         area(),
         body({isStatic: true}),
         bump(),
         anchor("bot"),
         "emptyBox",
      ],
      c: () => [
         sprite("coin"),
         area(),
         body({isStatic: true}),
         bump(42, 7),
         offscreen({ destroy: true }),
         lifespan(0.25, { fade: 0.1 }),
         anchor("bot"),
         "coin",
      ],
      M: () => [
         sprite("bigMushy"),
         area(),
         body(),
         patrol(5000),
         body(),
         offscreen({ destroy: true }),
         anchor("bot"),
         "bigMushy",
      ],
      "|": () => [sprite("pipeBottom"), area(), body({isStatic: true}), anchor("bot"), "pipe"],
      _: () => [sprite("pipeTop"), area(), body({isStatic: true}), anchor("bot"), "pipe"],
      E: () => [
         sprite("enemies", { anim: "Walking" }),
         area({ shape: new Rect(vec2(0), 16, 16) }),
         body(),
         body(),
         patrol(),
         enemy(),
         anchor("bot"),
         "badGuy",
      ],
      p: () => [
         sprite("mario"),
         area({ shape: new Rect(vec2(0), 16, 16) }),
         body({ jumpForce: JUMP_FORCE }),
         //mario(),
         //bump(150, 20, false),
         anchor("bot"),
         "player",
      ],
   }
};

setGravity(700);

debug.inspect = !!location.search.match(/\bdebug\b/);

scene("start", () => {
   add([
      text("Press enter to start", { size: 18 }),
      pos(vec2(160, 120)),
      anchor("center"),
      color(255, 255, 255),
   ]);

   onKeyRelease("enter", ()=>go("game"));
   onKeyRelease("space", ()=>go("game"));
});

scene("game", (levelNumber = 0) => {
   // Layers
   const ui = add([fixed(), z(100)]),
         bg = add([z(-1)]);

   const level = addLevel(LEVELS[levelNumber], levelConf);

   bg.add([sprite("cloud"), pos(20, 50)]);
   bg.add([sprite("hill"), pos(32, 208), anchor("bot")]);
   bg.add([sprite("shrubbery"), pos(200, 208), anchor("bot")]);
   ui.add([
      text("Level " + (levelNumber + 1), { size: 18 }),
      pos(vec2(160, 120)),
      color(255, 255, 255),
      anchor("center"),
      lifespan(1, { fade: 0.5 }),
   ]);

   const player = level.spawn("p", 1, 10);
   const SPEED = 120;

   onKeyDown("right", () => {
      player.flipX = false;
      player.move(SPEED, 0);
   });

   onKeyDown("left", () => {
      player.flipX = true;
      if (toScreen(player.pos).x > 20) {
         player.move(-SPEED, 0);
      }
   });

   onKeyPress("space", () => {
      if (player.isGrounded()) {
         player.jump();
      }
   });

   player.onUpdate(() => {
      // center camera to player
      var currCam = camPos();
      if (currCam.x < player.pos.x) {
         camPos(player.pos.x, currCam.y);
      }
    });

    player.onCollide("badGuy", (baddy, displacement) => {
      if (!baddy.isAlive) return;
      if (player.isFalling() && displacement.isBottom()) {
         baddy.squash();
         player.jump(isKeyDown('space') ? JUMP_FORCE * SQUASH_JUMP_MULTIPLIER : SQUASH_FORCE);
      } else {
         // Mario has been hurt. Add logic here later...
      }
   });

   player.onHeadbutt(async obj=>{
      // If brick, just bump and do nothing
      if (obj.is("brick")) {
         obj.bump();
         return;
      }
      // If question, we have to convert it and pop out what's inside
      if (obj.is("questionBox")) {
         if (obj.is("coinBox")) {
            let coin = level.spawn("c", level.pos2Tile(obj.pos).sub(0, 1));
            coin.bump();
         } else if (obj.is("mushyBox")) {
            level.spawn("M", level.pos2Tile(obj.pos).sub(0, 1));
         }
         var pos = obj.pos.clone();
         destroy(obj);
         var box = level.spawn("!", level.pos2Tile(pos));
         box.bump();
       }
   });

});

go("start");
