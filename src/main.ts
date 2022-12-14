import { Howl } from "howler";
import * as PIXI from "pixi.js";
import { Block } from "./entities/block";
import { Car } from "./entities/car";
import { Diamond } from "./entities/diamond";
import { Fuel } from "./entities/fuel";
import { Rocks } from "./entities/rocks";
import { Shovel } from "./entities/shovel";
import { generateRandomSide } from "./features/generate_random_side";
import { getGameWindowSize } from "./shared/lib/get_game_window_size";
import { randomIntFromInterval } from "./shared/lib/random_int_from_interval";
import { rectsIntersect } from "./shared/lib/rects_intersect";
import "./style.css";

const gameDiv = document.getElementById("game") as HTMLDivElement;
const panelDiv = document.getElementById("panel") as HTMLDivElement;
const scoreDiv = document.getElementById("score") as HTMLDivElement;

const coinSound = new Howl({
  src: "assets/coin.wav",
  volume: 0.3,
});

const pickUpShovelSound = new Howl({
  src: "assets/pickup_shovel.wav",
});

const lostSound = new Howl({
  src: "assets/lost.wav",
});

const destroyBlock = new Howl({
  src: "assets/destroy_block.wav",
});

const sweepCarSound = new Howl({
  src: "assets/sweep_car.wav",
});

const [width, height] = getGameWindowSize();

const DEFAULT_SCALE = width / 1080;

const app = new PIXI.Application({
  width,
  height,
  antialias: true,
});

gameDiv.appendChild(app.view);

window.addEventListener("resize", () => {
  const [width, height] = getGameWindowSize();

  app.view.width = width;
  app.view.height = height;
});

const gameScreenContainer = new PIXI.Container();
const resultScreenContainer = new PIXI.Container();
const titleScreenContainer = new PIXI.Container();

const loader = PIXI.Loader.shared;
const ticker = PIXI.Ticker.shared;

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

// Load assets
Object.entries(assetsEnum).map(([key, path]) => {
  loader.add(key, path + ".png");
});

loader.onProgress.add((_v) => {
  // console.log(v);
});

loader.load(runGame);

function runGame(
  _loader: PIXI.Loader,
  resources: PIXI.utils.Dict<PIXI.LoaderResource>
) {
  const textures = Object.keys(assetsEnum).reduce<TexturesMap>((acc, cur) => {
    acc[cur as AssetsKeys] = resources[cur].texture!;
    return acc;
  }, {} as TexturesMap);

  const car = createCar();
  const carBorderWidth = car.border.width * DEFAULT_SCALE;
  const carBorderOffset = car.width - carBorderWidth;

  const panel = createCarPanel();

  const INITIAL_GAME_SPEED = 3;
  const CAR_LEFT_POSITION_X =
    app.view.width / 2 - carBorderWidth - carBorderOffset;
  const CAR_RIGHT_POSITION_X = app.view.width / 2 + carBorderOffset;
  const CAR_INITIAL_POSITION_Y = app.view.height - panel.height - car.height;
  const WHEEL_ROTATE_SPEED = 0.08;
  const MIN_DISTANCE_BETWEEN_OBJECTS = car.height * 2;
  const DEFAULT_DISTANCE_BETWEEN_OBJECTS = MIN_DISTANCE_BETWEEN_OBJECTS * 2;
  const SPEED_INCREASE = 0.05;

  let isGameStarted = false;
  let isGameOver = false;
  let isResultOpened = false;

  let gameSpeed = INITIAL_GAME_SPEED;
  let gameScore = 0;
  let gameFuels = 4;

  let distance = DEFAULT_DISTANCE_BETWEEN_OBJECTS;
  let carTransitionSpeed = 12;
  let carCurrentPosition: "left" | "right" = "left";
  let isMoveToRightClicked = false;
  let isMoveToLeftClicked = false;
  let isCarTransition = false;
  let gameInterval: number | null;

  // Spawned objects
  const spawnedBarriersQueue = new Set<Block | Rocks>();
  const spawnedDiamondQueue = new Set<Diamond>();
  const spawnedShovelsQueue = new Set<Shovel>();
  const spawnedFuelsQueue = new Set<Fuel>();
  let lastSpawnedObjRef: Block | Rocks | Diamond | Shovel | null = null;
  let lastSpawnedBarrierObjRef: Block | Rocks | null = null;

  let shovelSpawnInterval: number | undefined;
  let fuelSpawnInterval: number | undefined;

  let isShovelSpawned = false;
  let isFuelSpawned = false;

  let lostGameSoundPlayed = false;

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

  function createFuel() {
    const sprite = new Fuel({ spriteTexture: textures.gas });
    sprite.scale.set(DEFAULT_SCALE);
    // sprite.anchor.set(0.5);
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

  function createScoreCoin() {
    const sprite = new PIXI.Sprite(textures.scoreCoin);
    sprite.scale.set(DEFAULT_SCALE / 12);
    return sprite;
  }

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

  car.x = CAR_LEFT_POSITION_X;
  car.y = CAR_INITIAL_POSITION_Y;

  const topPanel = createTopPanel();
  const restartPanel = createPanel();
  const startPanel = createPanel();
  const wheel = createWheel();

  const scoreContainer = new PIXI.Container();
  scoreContainer.x = app.view.width / 2.9;
  scoreContainer.y = topPanel.height / 10;

  const scoreCoin = createScoreCoin();

  const scoreSprite = new PIXI.Text("0", {
    fontSize: 85 * DEFAULT_SCALE,
    fontWeight: "900",
    fill: "white",
  });

  scoreContainer.addChild(scoreSprite);
  scoreContainer.addChild(scoreCoin);

  scoreSprite.x = 0;
  scoreCoin.x = app.view.width / 3.1 - scoreCoin.width;

  const restartButton = createRestartButton();
  restartButton.x = app.view.width / 2;
  restartButton.y = app.view.height - restartPanel.height / 2.5;
  restartButton.interactive = true;
  restartButton.buttonMode = true;
  restartButton.on("pointerdown", restartGame);

  const startButton = createStartButton();
  startButton.x = app.view.width / 2;
  startButton.y = app.view.height - startPanel.height / 2.5;
  startButton.interactive = true;
  startButton.buttonMode = true;
  startButton.on("pointerdown", startGame);

  function randomSpawn() {
    const num = randomIntFromInterval(0, 59);
    if (num === 0) return createShovel();
    if (num === 1) return createFuel();
    if (num % 2 === 0) return createDiamond();

    return createRandomBarrier();
  }

  function isBarrier(obj: unknown): obj is Block | Rocks {
    return Block.isBlock(obj) || Rocks.isRocks(obj);
  }

  function isDiamond(obj: unknown): obj is Diamond {
    return Diamond.isDiamond(obj);
  }

  function isShovel(obj: unknown): obj is Shovel {
    return Shovel.isShovel(obj);
  }

  function isFuel(obj: unknown): obj is Fuel {
    return Fuel.isFuel(obj);
  }

  function moveObjects() {
    if (!gameSpeed || !isGameStarted) return;

    gameRoad.tilePosition.y += gameSpeed;

    for (const obj of [
      ...spawnedBarriersQueue,
      ...spawnedDiamondQueue,
      ...spawnedShovelsQueue,
      ...spawnedFuelsQueue,
    ]) {
      obj.y += gameSpeed;
    }
  }

  function intersectObject() {
    for (const obj of [
      ...spawnedBarriersQueue,
      ...spawnedDiamondQueue,
      ...spawnedShovelsQueue,
      ...spawnedFuelsQueue,
    ]) {
      if (obj.y > app.view.height) {
        if (isBarrier(obj)) {
          spawnedBarriersQueue.delete(obj);
        }

        if (Diamond.isDiamond(obj)) {
          spawnedDiamondQueue.delete(obj);
        }

        if (isShovel(obj)) {
          spawnedShovelsQueue.delete(obj);
        }

        if (isFuel(obj)) {
          spawnedFuelsQueue.delete(obj);
        }

        gameRoad.removeChild(obj);

        if (obj === lastSpawnedObjRef) {
          lastSpawnedObjRef = null;
        }

        if (obj === lastSpawnedBarrierObjRef) {
          lastSpawnedBarrierObjRef = null;
        }
      } else if (rectsIntersect(car.border, obj)) {
        if (isDiamond(obj)) {
          if (!obj.isCaped) {
            obj.cap();
            gameScore += 1;
            coinSound.play();
          }
        }

        if (isShovel(obj)) {
          if (!obj.isCaped) {
            obj.cap();
            car.activateShovel();
            pickUpShovelSound.play();
          }
        }

        if (isFuel(obj)) {
          if (!obj.isCaped) {
            obj.cap();
            gameFuels++;
            coinSound.play();
          }
        }

        if (isBarrier(obj)) {
          if (
            (car.shovelIsActive && car.shovelHp > 0 && obj.isDestructible) ||
            obj.isDestroyed
          ) {
            if (!obj.isDestroyed) {
              obj.destroy();
              destroyBlock.play();
              car.shovelHp -= 1;
              if (car.shovelHp === 0) {
                car.deactivateShovel();
              }
            }
          } else {
            gameSpeed = 0;
            isGameOver = true;
            if (!lostGameSoundPlayed) {
              lostSound.play();
              lostGameSoundPlayed = true;
            }
          }
        }
      }
    }
  }

  function repeat() {
    if (!isGameStarted || gameSpeed === 0) return;

    shovelSpawnInterval = setInterval(() => {
      isShovelSpawned = false;
    }, 20000 * randomIntFromInterval(1, 10));

    if (gameFuels < 5 && !isFuelSpawned) {
      fuelSpawnInterval = setInterval(() => {
        isFuelSpawned = false;
      }, 10000 * randomIntFromInterval(0, 3));
    }

    moveObjects();
    intersectObject();
    spawnObjects();
  }

  function spawnObjects(): boolean {
    const newObject = randomSpawn();
    const side = generateRandomSide();

    if (
      (isBarrier(newObject) && spawnedBarriersQueue.size >= 2) ||
      (isDiamond(newObject) && spawnedDiamondQueue.size >= 3) ||
      (isShovel(newObject) &&
        (spawnedShovelsQueue.size >= 1 ||
          isShovelSpawned ||
          car.shovelIsActive)) ||
      (isFuel(newObject) &&
        (spawnedFuelsQueue.size >= 1 || isFuelSpawned || gameFuels >= 5))
    ) {
      // Skip spawn
      return false;
    }

    if (!lastSpawnedObjRef) {
      newObject.y = 0 - newObject.height;

      if (isBarrier(newObject)) {
        spawnedBarriersQueue.add(newObject);
        lastSpawnedBarrierObjRef = newObject;
        newObject.x =
          side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
      }

      if (isDiamond(newObject)) {
        spawnedDiamondQueue.add(newObject);
        newObject.x =
          side === "left"
            ? CAR_LEFT_POSITION_X + newObject.width
            : CAR_RIGHT_POSITION_X + newObject.width;
      }

      if (isShovel(newObject)) {
        isShovelSpawned = true;
        spawnedShovelsQueue.add(newObject);
        newObject.x =
          side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
      }

      if (isFuel(newObject)) {
        isFuelSpawned = true;
        spawnedFuelsQueue.add(newObject);
        newObject.x =
          side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
      }

      gameRoad.addChild(newObject);
      lastSpawnedObjRef = newObject;
      return true;
    } else {
      if (isBarrier(newObject)) {
        if (lastSpawnedBarrierObjRef) {
          if (lastSpawnedBarrierObjRef.y > distance) {
            if (lastSpawnedObjRef.y > 0) {
              newObject.x =
                side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
              if (lastSpawnedObjRef.y > lastSpawnedObjRef.height) {
                newObject.y =
                  0 -
                  (newObject.height +
                    randomIntFromInterval(0, newObject.height * 2));
                spawnedBarriersQueue.add(newObject);
                gameRoad.addChild(newObject);
                lastSpawnedObjRef = newObject;
                lastSpawnedBarrierObjRef = newObject;
                return true;
              } else {
                newObject.y =
                  0 -
                  (lastSpawnedObjRef.y +
                    lastSpawnedObjRef.height +
                    newObject.height +
                    randomIntFromInterval(0, newObject.height * 2));
                spawnedBarriersQueue.add(newObject);
                gameRoad.addChild(newObject);
                lastSpawnedObjRef = newObject;
                lastSpawnedBarrierObjRef = newObject;
                return true;
              }
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          if (lastSpawnedObjRef.y > 0) {
            newObject.x =
              side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
            if (lastSpawnedObjRef.y > lastSpawnedObjRef.height) {
              newObject.y =
                0 -
                (newObject.height +
                  randomIntFromInterval(0, newObject.height * 2));
              spawnedBarriersQueue.add(newObject);
              gameRoad.addChild(newObject);
              lastSpawnedObjRef = newObject;
              lastSpawnedBarrierObjRef = newObject;
              return true;
            } else {
              newObject.y =
                0 -
                (lastSpawnedObjRef.y +
                  lastSpawnedObjRef.height +
                  newObject.height +
                  randomIntFromInterval(0, newObject.height * 2));
              spawnedBarriersQueue.add(newObject);
              gameRoad.addChild(newObject);
              lastSpawnedObjRef = newObject;
              lastSpawnedBarrierObjRef = newObject;
              return true;
            }
          } else {
            // skip spawn
            return false;
          }
        }
      } else {
        if (lastSpawnedObjRef.y > 0) {
          if (isDiamond(newObject)) {
            spawnedDiamondQueue.add(newObject);
            newObject.x =
              side === "left"
                ? CAR_LEFT_POSITION_X + newObject.width
                : CAR_RIGHT_POSITION_X + newObject.width;
          }

          if (isShovel(newObject)) {
            isShovelSpawned = true;
            spawnedShovelsQueue.add(newObject);
            newObject.x =
              side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
          }

          if (isFuel(newObject)) {
            isFuelSpawned = true;
            spawnedFuelsQueue.add(newObject);
            newObject.x =
              side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
          }
          if (lastSpawnedObjRef.y > lastSpawnedObjRef.height) {
            newObject.y =
              0 -
              (newObject.height +
                randomIntFromInterval(0, newObject.height * 2));
            if (isDiamond(newObject)) {
              spawnedDiamondQueue.add(newObject);
            }
            if (isShovel(newObject)) {
              isShovelSpawned = true;
              spawnedShovelsQueue.add(newObject);
            }
            if (isFuel(newObject)) {
              isFuelSpawned = true;
              spawnedFuelsQueue.add(newObject);
            }
            gameRoad.addChild(newObject);
            lastSpawnedObjRef = newObject;
            return true;
          } else {
            newObject.y =
              0 -
              (lastSpawnedObjRef.y +
                lastSpawnedObjRef.height +
                newObject.height +
                randomIntFromInterval(0, newObject.height * 2));
            if (isDiamond(newObject)) {
              spawnedDiamondQueue.add(newObject);
            }
            if (isShovel(newObject)) {
              isShovelSpawned = true;
              spawnedShovelsQueue.add(newObject);
            }
            if (isFuel(newObject)) {
              isFuelSpawned = true;
              spawnedFuelsQueue.add(newObject);
            }
            gameRoad.addChild(newObject);
            lastSpawnedObjRef = newObject;
            return true;
          }
        } else {
          // skip spawn
          return false;
        }
      }
    }
  }

  wheel.position.set(app.view.width / 2, app.view.height - panel.height / 2);
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
  gameScreenContainer.addChild(scoreContainer);
  gameScreenContainer.addChild(wheel);

  resultScreenContainer.addChild(resultRoad);
  resultScreenContainer.addChild(restartPanel);
  resultScreenContainer.addChild(restartButton);

  wheel.on("pointerdown", changeCarSide);

  window.addEventListener("keydown", (event) => {
    if (event.keyCode === 32 || event.code === "Space") {
      if (!isGameOver) {
        changeCarSide();
      } else {
        resetGameState();
      }
    }
  });

  function changeCarSide() {
    sweepCarSound.play();
    if (carCurrentPosition === "left") {
      isMoveToRightClicked = true;
      isMoveToLeftClicked = false;
    } else {
      isMoveToRightClicked = false;
      isMoveToLeftClicked = true;
    }
  }

  function runGameInterval() {
    if (gameInterval) {
      clearInterval(gameInterval);
    }

    gameInterval = setInterval(() => {
      if (isGameOver) return;
      gameSpeed += SPEED_INCREASE;
      if (distance > MIN_DISTANCE_BETWEEN_OBJECTS) {
        distance -= 0.5;
      }
    }, 5000);
  }

  function updateScore() {
    scoreSprite.text = gameScore;
  }

  function updateCarPosition() {
    if (
      car.position.x === CAR_LEFT_POSITION_X ||
      car.position.x === CAR_RIGHT_POSITION_X
    ) {
      isCarTransition = false;
    } else {
      isCarTransition = true;
    }

    // To right
    if (isMoveToRightClicked && car.position.x < CAR_RIGHT_POSITION_X) {
      carCurrentPosition = "right";
      // Fix offset
      const x = CAR_RIGHT_POSITION_X - car.position.x;
      if (x < carTransitionSpeed) {
        car.position.x += x;
      } else {
        car.position.x += carTransitionSpeed;
      }
    }
    // To left
    if (isMoveToLeftClicked && car.position.x > CAR_LEFT_POSITION_X) {
      carCurrentPosition = "left";
      // Fix offset
      const x = car.position.x - CAR_LEFT_POSITION_X;
      if (x < carTransitionSpeed) {
        car.position.x -= x;
      } else {
        car.position.x -= carTransitionSpeed;
      }
    }
    if (car.x === CAR_LEFT_POSITION_X || car.x === CAR_RIGHT_POSITION_X) {
      isMoveToLeftClicked = false;
      isMoveToRightClicked = false;
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
    isGameStarted = true;
    resetGameState();
    runGameInterval();
  }

  function restartGame() {
    resetGameState();
    runGameInterval();
    gameFuels -= 1;
  }

  function resetGameState() {
    lastSpawnedObjRef = null;
    lastSpawnedBarrierObjRef = null;
    gameScore = 0;
    for (const obj of [
      ...spawnedBarriersQueue,
      ...spawnedDiamondQueue,
      ...spawnedShovelsQueue,
      ...spawnedFuelsQueue,
    ]) {
      gameRoad.removeChild(obj);
    }
    spawnedBarriersQueue.clear();
    spawnedDiamondQueue.clear();
    spawnedShovelsQueue.clear();
    spawnedFuelsQueue.clear();
    gameSpeed = INITIAL_GAME_SPEED;
    distance = DEFAULT_DISTANCE_BETWEEN_OBJECTS;
    isShovelSpawned = false;
    if (shovelSpawnInterval) {
      clearInterval(shovelSpawnInterval);
    }
    if (fuelSpawnInterval) {
      clearInterval(fuelSpawnInterval);
    }
    car.deactivateShovel();
    car.shovelHp = 0;
    car.position.set(CAR_LEFT_POSITION_X, CAR_INITIAL_POSITION_Y);
    isCarTransition = false;
    isMoveToRightClicked = false;
    isMoveToLeftClicked = false;
    carCurrentPosition = "left";
    wheel.rotation = 0;
    isGameOver = false;
    lostGameSoundPlayed = false;
  }

  function updateScreen() {
    if (!isGameStarted) {
      app.stage.addChild(titleScreenContainer);
    } else {
      if (isGameOver) {
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

  function showResultCard() {
    if (isGameOver && !isResultOpened) {
      scoreDiv.innerHTML = "" + gameScore;
      panelDiv.style.display = "block";
      isResultOpened = true;
    }
    if (!isGameOver && isResultOpened) {
      panelDiv.style.display = "none";
      isResultOpened = false;
    }
  }

  // @ts-expect-error
  window.ticker = ticker;
  ticker.maxFPS = 60;
  ticker.add(gameLoop);

  function pauseGame() {
    ticker.stop();
  }

  function resumeGame() {
    ticker.start();
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "p") {
      if (ticker.started) {
        pauseGame();
      } else {
        resumeGame();
      }
    }
  });

  function gameLoop() {
    repeat();
    moveObjects();
    updateCarPosition();
    updateWheelTurn();
    updateScreen();
    updateScore();
    showResultCard();
  }
}
