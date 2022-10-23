import * as PIXI from "pixi.js";
import "./style.css";

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

class Car extends PIXI.Sprite {
  border: PIXI.Graphics;

  constructor({
    spriteTexture,
  }: {
    spriteTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(spriteTexture);

    const rect = new PIXI.Graphics();
    rect.lineStyle({ width: 1 });
    // TODO fix size
    rect.drawRect(0, 0, this.width - 48, this.height - 18);
    rect.endFill();
    rect.visible = false;
    this.addChild(rect);
    this.border = rect;
  }
}

class Block extends PIXI.Sprite {
  border: PIXI.Graphics;

  constructor({
    spriteTexture,
  }: {
    spriteTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(spriteTexture);

    const rect = new PIXI.Graphics();
    rect.lineStyle({ width: 1 });
    // TODO fix size
    rect.drawRect(0, 0, this.width - 43, this.height - 2);
    rect.endFill();
    rect.visible = false;
    this.addChild(rect);
    this.border = rect;
  }
}

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
  const BLOCK_INITIAL_POSITION_X = 90;
  const BLOCK_INITIAL_POSITION_Y = 0;
  const CAR_LEFT_X_POSITION = 90;
  const CAR_RIGHT_X_POSITION = 240;
  const WHEEL_ROTATE_SPEED = 0.08;
  const MIN_DISTANCE_BETWEEN_OBJECTS = 400;

  let gameStarted = false;
  let showResult = false;
  let gameSpeed = 8;
  let carTransitionSpeed = 12;
  let carCurrentPosition: "left" | "right" = "left";
  let moveToRightClicked = false;
  let moveToLeftClicked = false;
  let isCarTransition = false;
  let gameInterval: number | null;
  let blocks: PIXI.Container[] = [];

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
    const sprite = new Car({ spriteTexture: textures.car });
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

  // Utils
  function rectsIntersect(a: PIXI.Container, b: PIXI.Container) {
    const aBox = a.getBounds();
    const bBox = b.getBounds();
    return (
      aBox.x + aBox.width > bBox.x &&
      aBox.x < bBox.x + bBox.width &&
      aBox.y + aBox.height > bBox.y &&
      aBox.y < bBox.y + bBox.height
    );
  }

  // Init screens
  const road1 = createRoad();
  const gameRoad = createRoad();
  const road3 = createRoad();
  const car = createCar();
  const panel = createCarPanel();
  const topPanel = createTopPanel();
  const restartPanel = createPanel();
  const startPanel = createPanel();
  const wheel = createWheel();
  const block1 = createBlock();
  const block2 = createBlock();

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

  function moveRoad() {
    if (gameStarted) {
      gameRoad.tilePosition.y += gameSpeed;
    }
  }

  function detectIntersect() {
    if (gameStarted && gameSpeed > 0) {
      const isIntersect = [block1, block2].some((block) =>
        rectsIntersect(car.border, block.border)
      );
      if (isIntersect) {
        showResult = true;
      }
    } else {
      showResult = false;
    }
  }

  function spawnBlock() {
    const s = 21;
  }

  function moveBlock() {
    block1.position.set(90, 0);
    block2.position.set(240, block1.y - MIN_DISTANCE_BETWEEN_OBJECTS);

    if (block1.y > app.view.height) {
      block1.position.set(90, 0);
    }
    block1.y += gameSpeed;

    if (block2.y > app.view.height) {
      block2.position.set(240, block1.y - MIN_DISTANCE_BETWEEN_OBJECTS);
    }
    block2.y += gameSpeed;
  }

  car.x = CAR_INITIAL_POSITION_X;
  car.y = CAR_INITIAL_POSITION_Y;

  wheel.position.set(216, 650);
  wheel.interactive = true;
  wheel.buttonMode = true;

  // Init screens
  titleScreenContainer.addChild(road1);
  titleScreenContainer.addChild(startPanel);
  titleScreenContainer.addChild(startButton);

  gameScreenContainer.addChild(gameRoad);
  gameScreenContainer.addChild(car);
  gameScreenContainer.addChild(block1);
  gameScreenContainer.addChild(block2);
  gameScreenContainer.addChild(panel);
  gameScreenContainer.addChild(topPanel);
  gameScreenContainer.addChild(wheel);

  resultScreenContainer.addChild(road3);
  resultScreenContainer.addChild(restartPanel);
  resultScreenContainer.addChild(restartButton);

  wheel.on("pointerdown", () => {
    console.log("here");
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
      gameSpeed += 0.5;
    }, 1000);
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
    console.log("Start game clicked");
    gameSpeed = INITIAL_GAME_SPEED;
    car.position.set(CAR_INITIAL_POSITION_X, CAR_INITIAL_POSITION_Y);
    gameStarted = true;
    runGameInterval();
  }

  function restartGame() {
    console.log("Reset game clicked");
    gameSpeed = INITIAL_GAME_SPEED;
    car.position.set(CAR_INITIAL_POSITION_X, CAR_INITIAL_POSITION_Y);
    isCarTransition = false;
    moveToRightClicked = false;
    moveToLeftClicked = false;
    carCurrentPosition = "left";
    wheel.rotation = 0;
    showResult = false;
    runGameInterval();
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
    moveRoad();
    moveBlock();
    detectIntersect();
    updateCarPosition();
    updateWheelTurn();
    updateScreen();
  }
}
