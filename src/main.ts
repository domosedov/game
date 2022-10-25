import * as PIXI from "pixi.js";
import { Block } from "./entities/block";
import { Car } from "./entities/car";
import { Diamond } from "./entities/diamond";
import { Rocks } from "./entities/rocks";
import { Shovel } from "./entities/shovel";
import { randomIntFromInterval } from "./shared/lib/random_int_from_interval";
import { rectsIntersect } from "./shared/lib/rects_intersect";
import "./style.css";

function generateRandomSide(): "left" | "right" {
  return randomIntFromInterval(0, 1) === 0 ? "left" : "right";
}

const DEFAULT_SCALE = 0.4;

const app = new PIXI.Application({
  width: 432,
  height: 768,
  antialias: true,
});

document.getElementById("game")!.appendChild(app.view);

const gameScreenContainer = new PIXI.Container();
const resultScreenContainer = new PIXI.Container();
const titleScreenContainer = new PIXI.Container();

const scoreSprite = new PIXI.Text("0", {
  fontSize: 28,
  fontWeight: "900",
  fill: "white",
});

// score.anchor.set(0.5);
scoreSprite.x = app.view.width / 2 - 65;
scoreSprite.y = 25;

const loader = PIXI.Loader.shared;

loader.baseUrl = "assets";

const assetsEnum = {
  road: "road",
  car: "car",
  panel: "panel",
  wheel: "wheel",
  block: "block",
  restartPanel: "restart_panel",
  restartButton: "restart_button",
  coinGold: "coin_gold",
  coinPurple: "coin_purple",
  diamond: "diamond",
  gas: "gas",
  rocks: "rocks",
  scoreCoin: "score_coin",
  shovel: "shovel",
  topPanel: "top_panel",
  startButton: "start_button",
} as const;

type TexturesMap = Record<AssetsKeys, PIXI.Texture>;
type AssetsKeys = keyof typeof assetsEnum;

Object.entries(assetsEnum).map(([key, path]) => {
  loader.add(key, path + ".png");
});

loader.load(runGame);

function runGame(
  _loader: PIXI.Loader,
  resources: PIXI.utils.Dict<PIXI.LoaderResource>
) {
  const INITIAL_GAME_SPEED = 6;
  const CAR_INITIAL_POSITION_X = 90;
  const CAR_INITIAL_POSITION_Y = 380;
  const CAR_LEFT_X_POSITION = 90;
  const CAR_RIGHT_X_POSITION = 240;
  const WHEEL_ROTATE_SPEED = 0.08;
  const MIN_DISTANCE_BETWEEN_OBJECTS = 450;
  const SPEED_INCREASE = 0.05;

  let gameStarted = false;
  let showResult = false;
  let gameSpeed = 6;
  let carTransitionSpeed = 12;
  let carCurrentPosition: "left" | "right" = "left";
  let moveToRightClicked = false;
  let moveToLeftClicked = false;
  let isCarTransition = false;
  let gameInterval: number | null;
  let blocks: (Block | Rocks)[] = [];
  let diamonds: Diamond[] = [];
  let shovels: Shovel[] = [];
  let score = 0;
  let shovelSpawnInterval: number | undefined;
  let shovelCreated = false;

  const textures = Object.keys(assetsEnum).reduce<TexturesMap>((acc, cur) => {
    acc[cur as AssetsKeys] = resources[cur].texture!;
    return acc;
  }, {} as TexturesMap);

  // Block
  function createBlock() {
    const sprite = new Block({ spriteTexture: textures.block });
    sprite.scale.set(DEFAULT_SCALE);
    return sprite;
  }

  function createRocks() {
    const sprite = new Rocks({ spriteTexture: textures.rocks });
    sprite.scale.set(DEFAULT_SCALE);
    return sprite;
  }

  function createShovel() {
    const sprite = new Shovel({ spriteTexture: textures.shovel });
    sprite.scale.set(DEFAULT_SCALE);
    return sprite;
  }

  function createRestartButton() {
    const sprite = new PIXI.Sprite(textures.restartButton);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(0.5, 0.49);
    return sprite;
  }

  // Road
  function createRoad() {
    const sprite = new PIXI.TilingSprite(
      textures.road,
      app.view.width,
      app.view.height
    );
    sprite.tileScale.set(DEFAULT_SCALE);
    return sprite;
  }

  // Car
  function createCar() {
    const sprite = new Car({
      carTexture: textures.car,
      shovelTexture: textures.shovel,
    });
    sprite.scale.set(DEFAULT_SCALE);
    return sprite;
  }

  function createTopPanel() {
    const sprite = new PIXI.Sprite(textures.topPanel);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.position.set(0, 0);
    return sprite;
  }

  // Panel
  function createCarPanel() {
    const sprite = new PIXI.Sprite(textures.panel);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(1, 1);
    sprite.position.set(app.view.width, app.view.height);
    return sprite;
  }

  function createPanel() {
    const sprite = new PIXI.Sprite(textures.restartPanel);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(1, 1);
    sprite.position.set(app.view.width, app.view.height);
    return sprite;
  }

  // Wheel
  function createWheel() {
    const sprite = new PIXI.Sprite(textures.wheel);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(0.5, 0.49);
    return sprite;
  }

  function createStartButton() {
    const sprite = new PIXI.Sprite(textures.startButton);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(0.5, 0.49);
    return sprite;
  }

  function createDiamond() {
    const sprite = new Diamond({ spriteTexture: textures.diamond });
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(0.5);
    return sprite;
  }

  function createRandomBarrier() {
    const num = randomIntFromInterval(0, 5);
    if (num === 0) return createRocks();
    return createBlock();
  }

  // Init screens
  const road1 = createRoad();
  const gameRoad = createRoad();
  const resultRoad = createRoad();
  const car = createCar();
  const panel = createCarPanel();
  const topPanel = createTopPanel();
  const restartPanel = createPanel();
  const startPanel = createPanel();
  const wheel = createWheel();

  const restartButton = createRestartButton();
  restartButton.x = app.view.width / 2;
  restartButton.y = app.view.height - 100;
  restartButton.interactive = true;
  restartButton.buttonMode = true;
  restartButton.on("pointerdown", restartGame);

  const startButton = createStartButton();
  startButton.x = app.view.width / 2;
  startButton.y = app.view.height - 100;
  startButton.interactive = true;
  startButton.buttonMode = true;
  startButton.on("pointerdown", startGame);

  function detectIntersect() {
    if (gameStarted) {
      let isIntersect: boolean = false;

      diamonds.forEach((d) => {
        if (rectsIntersect(car.border, d)) {
          gameRoad.removeChild(d);
          diamonds.splice(diamonds.indexOf(d), 1);
          score += 1;
        }
      });

      shovels.forEach((d) => {
        if (rectsIntersect(car.border, d)) {
          d.visible = false;
          shovels.splice(diamonds.indexOf(d), 1);
          car.activateShovel();
        }
      });

      if (car.shovelIsActive) {
        blocks.forEach((block) => {
          const is = rectsIntersect(car.border, block);
          if (is) {
            if (block.isDestructible) {
              gameRoad.removeChild(block);
              blocks.splice(blocks.indexOf(block), 1);
              isIntersect = false;
            } else {
              isIntersect = true;
            }
          }
        });
      } else {
        isIntersect = blocks.some((block) =>
          rectsIntersect(car.border, block.border)
        );
      }

      if (isIntersect) {
        showResult = true;
      }
    } else {
      showResult = false;
    }
  }

  function deleteObjects() {
    diamonds.forEach((block) => {
      if (block.y > app.view.height) {
        gameRoad.removeChild(block);
        const index = diamonds.indexOf(block);
        diamonds.splice(index, 1);
      }
    });

    blocks.forEach((block) => {
      if (block.y > app.view.height) {
        gameRoad.removeChild(block);
        const index = blocks.indexOf(block);
        blocks.splice(index, 1);
      }
    });

    shovels.forEach((block) => {
      if (block.y > app.view.height) {
        gameRoad.removeChild(block);
        const index = shovels.indexOf(block);
        shovels.splice(index, 1);
      }
    });
  }

  function moveObjects() {
    if (!gameStarted) return;

    gameRoad.tilePosition.y += gameSpeed;

    [...diamonds, ...blocks, ...shovels].forEach((o) => {
      o.y += gameSpeed;
    });
  }

  function spawnObjects() {
    if (!gameStarted) return;

    if (blocks.length < 5) {
      const newBlock = createRandomBarrier();
      const side = generateRandomSide();
      const lastBlock = blocks.at(-1);
      if (!lastBlock) {
        newBlock.y = 0;
      } else {
        newBlock.y = lastBlock.y - MIN_DISTANCE_BETWEEN_OBJECTS;
      }
      newBlock.x = side === "left" ? CAR_LEFT_X_POSITION : CAR_RIGHT_X_POSITION;
      blocks.push(newBlock);
      gameRoad.addChild(newBlock);
    }

    if (diamonds.length < 2) {
      const diamond = createDiamond();

      const side = generateRandomSide();

      diamond.x =
        side === "left" ? CAR_LEFT_X_POSITION + 50 : CAR_RIGHT_X_POSITION + 50;
      diamond.y = 0;

      if (blocks.some((block) => rectsIntersect(block, diamond))) {
        diamond.y = (blocks.at(-1)?.y ?? 0) - 100;
      }

      if (diamonds.some((block) => rectsIntersect(block, diamond))) {
        diamond.y = (diamonds.at(-1)?.y ?? 0) - 100;
      }

      gameRoad.addChild(diamond);
      diamonds.push(diamond);
    }

    if (shovels.length < 1 && !shovelCreated) {
      const shovel = createShovel();
      shovelCreated = true;
      if (shovelSpawnInterval) {
        clearInterval(shovelSpawnInterval);
      }
      shovelSpawnInterval = setInterval(() => {
        shovelCreated = false;
      }, 10000);
      const side = generateRandomSide();
      shovel.x = side === "left" ? CAR_LEFT_X_POSITION : CAR_RIGHT_X_POSITION;
      shovel.y = 0;

      if (blocks.some((block) => rectsIntersect(block, shovel))) {
        shovel.y = (blocks.at(-1)?.y ?? 0) - 100;
      }

      if (diamonds.some((block) => rectsIntersect(block, shovel))) {
        shovel.y = (diamonds.at(-1)?.y ?? 0) - 100;
      }

      gameRoad.addChild(shovel);
      shovels.push(shovel);
    }
  }

  wheel.position.set(216, 650);
  wheel.interactive = true;
  wheel.buttonMode = true;

  // Init screens
  titleScreenContainer.addChild(road1);
  titleScreenContainer.addChild(startPanel);
  titleScreenContainer.addChild(startButton);

  gameScreenContainer.addChild(gameRoad);
  gameScreenContainer.addChild(car);
  gameScreenContainer.addChild(panel);
  gameScreenContainer.addChild(topPanel);
  gameScreenContainer.addChild(scoreSprite);
  gameScreenContainer.addChild(wheel);

  resultScreenContainer.addChild(resultRoad);
  resultScreenContainer.addChild(restartPanel);
  resultScreenContainer.addChild(restartButton);

  wheel.on("pointerdown", () => {
    if (carCurrentPosition === "left") {
      moveToRightClicked = true;
      moveToLeftClicked = false;
    } else {
      moveToRightClicked = false;
      moveToLeftClicked = true;
    }
  });

  function runGameInterval() {
    if (gameInterval) {
      clearInterval(gameInterval);
    }

    gameInterval = setInterval(() => {
      gameSpeed += SPEED_INCREASE;
    }, 1000);
  }

  function updateScore() {
    scoreSprite.text = score;
  }

  function updateCarPosition() {
    if (
      car.position.x === CAR_LEFT_X_POSITION ||
      car.position.x === CAR_RIGHT_X_POSITION
    ) {
      isCarTransition = false;
    } else {
      isCarTransition = true;
    }

    // To right
    if (moveToRightClicked && car.position.x < CAR_RIGHT_X_POSITION) {
      carCurrentPosition = "right";
      // Fix offset
      const x = CAR_RIGHT_X_POSITION - car.position.x;
      if (x < carTransitionSpeed) {
        car.position.x += x;
      } else {
        car.position.x += carTransitionSpeed;
      }
    }
    // To left
    if (moveToLeftClicked && car.position.x > CAR_LEFT_X_POSITION) {
      carCurrentPosition = "left";
      // Fix offset
      const x = car.position.x - CAR_LEFT_X_POSITION;
      if (x < carTransitionSpeed) {
        car.position.x -= x;
      } else {
        car.position.x -= carTransitionSpeed;
      }
    }
    if (car.x === CAR_LEFT_X_POSITION || car.x === CAR_RIGHT_X_POSITION) {
      moveToLeftClicked = false;
      moveToRightClicked = false;
    }
  }

  function w(n: number): number {
    return +n.toFixed(2);
  }

  function updateWheelTurn() {
    if (isCarTransition) {
      if (carCurrentPosition === "right") {
        wheel.rotation += WHEEL_ROTATE_SPEED;
      } else {
        wheel.rotation -= WHEEL_ROTATE_SPEED;
      }
    } else {
      if (carCurrentPosition === "right" && w(wheel.rotation) !== 0) {
        wheel.rotation -= WHEEL_ROTATE_SPEED;
      }
      if (carCurrentPosition === "left" && w(wheel.rotation) !== 0) {
        wheel.rotation += WHEEL_ROTATE_SPEED;
      }
    }
  }

  function startGame() {
    gameStarted = true;
    resetGameState();
    runGameInterval();
  }

  function restartGame() {
    resetGameState();
    runGameInterval();
  }

  function resetGameState() {
    score = 0;
    blocks.forEach((block) => gameRoad.removeChild(block));
    diamonds.forEach((block) => gameRoad.removeChild(block));
    shovels.forEach((block) => gameRoad.removeChild(block));
    blocks = [];
    diamonds = [];
    shovels = [];
    gameSpeed = INITIAL_GAME_SPEED;
    shovelCreated = false;
    if (shovelSpawnInterval) {
      clearInterval(shovelSpawnInterval);
    }
    car.deactivateShovel();
    car.position.set(CAR_INITIAL_POSITION_X, CAR_INITIAL_POSITION_Y);
    isCarTransition = false;
    moveToRightClicked = false;
    moveToLeftClicked = false;
    carCurrentPosition = "left";
    wheel.rotation = 0;
    showResult = false;
  }

  function updateScreen() {
    if (!gameStarted) {
      app.stage.addChild(titleScreenContainer);
    } else {
      if (showResult) {
        app.stage.removeChild(titleScreenContainer);
        app.stage.removeChild(gameScreenContainer);
        app.stage.addChild(resultScreenContainer);
      } else {
        app.stage.removeChild(titleScreenContainer);
        app.stage.removeChild(resultScreenContainer);
        app.stage.addChild(gameScreenContainer);
      }
    }
  }

  app.ticker.add(gameLoop);

  function gameLoop() {
    spawnObjects();
    moveObjects();
    deleteObjects();
    detectIntersect();
    updateCarPosition();
    updateWheelTurn();
    updateScreen();
    updateScore();
  }
}
