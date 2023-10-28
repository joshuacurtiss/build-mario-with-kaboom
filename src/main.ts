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
   vec2,
   z,
} = k;

const LEVELS = [
   [
      "                                                                                                ",
      "                                                                                                ",
      "                                                                                                ",
      "                                                                                                ",
      "                                                                                                ",
      "                                                                                                ",
      "                                                                                                ",
      "      -?-b-                                                                                     ",
      "                                                    ?        ?                                  ",
      "                                                                                                ",
      "                                      _                 ?                                       ",
      "                                 _    |                                                         ",
      "                           _     |    |                _                                        ",
      "       E                   |     |    |   E   E        |                            H           ",
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
      "-": () => [sprite("brick"), area(), body({isStatic: true}), anchor("bot"), "brick"],
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
         // bump(),
         anchor("bot"),
         "emptyBox",
      ],
      c: () => [
         sprite("coin"),
         area(),
         body({isStatic: true}),
         //bump(64, 8),
         offscreen({ destroy: true }),
         lifespan(0.4, { fade: 0.01 }),
         anchor("bot"),
         "coin",
      ],
      M: () => [
         sprite("bigMushy"),
         area(),
         body({isStatic: true}),
         //patrol(10000),
         body(),
         offscreen({ destroy: true }),
         anchor("bot"),
         "bigMushy",
      ],
      "|": () => [sprite("pipeBottom"), area(), body({isStatic: true}), anchor("bot"), "pipe"],
      _: () => [sprite("pipeTop"), area(), body({isStatic: true}), anchor("bot"), "pipe"],
      E: () => [
         sprite("enemies", { anim: "Walking" }),
         area(),
         body({isStatic: true}),
         body(),
         //patrol(50),
         //enemy(),
         anchor("bot"),
         "badGuy",
      ],
      p: () => [
         sprite("mario"),
         area(),
         body({ jumpForce: 375 }),
         //mario(),
         //bump(150, 20, false),
         anchor("bot"),
         "player",
      ],
   }
};

setGravity(700);

scene("start", () => {
   add([
      text("Press enter to start", { size: 24 }),
      pos(vec2(160, 120)),
      anchor("center"),
      color(255, 255, 255),
   ]);

   onKeyRelease("enter", () => {
      go("game");
   });
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
      text("Level " + (levelNumber + 1), { size: 24 }),
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

});

go("start");
