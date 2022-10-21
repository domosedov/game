import * as PIXI from "pixi.js";
import "./style.css";

const DEFAULT_SCALE = 0.4;

const app = new PIXI.Application({
  width: 432,
  height: 768,
  antialias: true,
});

document.body.appendChild(app.view);

const gameScreen = new PIXI.Container();
const resultScreen = new PIXI.Container();
const titleScreen = new PIXI.Container();

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

loader
  .add("road", "road.png")
  .add("car", "car.png")
  .add("panel", "panel.png")
  .add("wheel", "wheel.png")
  .add("block", "block.png")
  .add("restart_panel", "restart_panel.png")
  .add("restart_button", "restart_button.png");

loader.load(initGame);

function initGame(
  _loader: PIXI.Loader,
  resources: PIXI.utils.Dict<PIXI.LoaderResource>
) {
  const roadTexture = resources["road"].texture;
  const carTexture = resources["car"].texture;
  const panelTexture = resources["panel"].texture;
  const restartPanelTexture = resources["restart_panel"].texture;
  const restartButtonTexture = resources["restart_button"].texture;
  const wheelTexture = resources["wheel"].texture;
  const blockTexture = resources["block"].texture;

  const INITIAL_GAME_SPEED = 6;
  const CAR_INITIAL_POSITION_X = 90;
  const CAR_INITIAL_POSITION_Y = 380;
  const BLOCK_INITIAL_POSITION_X = 90;
  const BLOCK_INITIAL_POSITION_Y = 0;

  let gameSpeed = 8;
  const carTransitionSpeed = 12;

  // Block
  function createBlock() {
    const sprite = new Block({ spriteTexture: blockTexture });
    sprite.scale.set(DEFAULT_SCALE);
    return sprite;
  }

  function createRestartButton() {
    const sprite = new PIXI.Sprite(restartButtonTexture);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(0.5, 0.49);
    return sprite;
  }

  // Road
  function createRoad() {
    const sprite = new PIXI.TilingSprite(
      roadTexture!,
      app.view.width,
      app.view.height
    );
    sprite.tileScale.set(DEFAULT_SCALE);
    return sprite;
  }

  // Car
  function createCar() {
    const sprite = new Car({ spriteTexture: carTexture });
    sprite.scale.set(DEFAULT_SCALE);
    return sprite;
  }

  // Panel
  function createPanel() {
    const sprite = new PIXI.Sprite(panelTexture);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(1, 1);
    sprite.position.set(app.view.width, app.view.height);
    return sprite;
  }

  function createRestartPanel() {
    const sprite = new PIXI.Sprite(restartPanelTexture);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(1, 1);
    sprite.position.set(app.view.width, app.view.height);
    return sprite;
  }

  // Wheel
  function createWheel() {
    const sprite = new PIXI.Sprite(wheelTexture);
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
  const road = createRoad();
  const road2 = createRoad();
  const car = createCar();
  const panel = createPanel();
  const restartPanel = createRestartPanel();

  const restartButton = createRestartButton();
  restartButton.x = app.view.width / 2;
  restartButton.y = app.view.height - 100;
  restartButton.interactive = true;
  restartButton.buttonMode = true;
  restartButton.on("click", restartGame);

  const wheel = createWheel();
  const block = createBlock();

  function moveRoad() {
    road.tilePosition.y += gameSpeed;
  }

  function stopGame() {
    const isIntersect = rectsIntersect(car.border, block.border);
    console.log(isIntersect);
    if (isIntersect) {
      gameSpeed = 0;
    }
  }

  block.position.set(90, 0);
  function moveBlock() {
    if (block.y > app.view.height) {
      block.position.set(90, 0);
    }
    block.y += gameSpeed;
  }

  car.x = CAR_INITIAL_POSITION_X;
  car.y = CAR_INITIAL_POSITION_Y;

  wheel.position.set(216, 650);
  wheel.interactive = true;
  wheel.buttonMode = true;

  // Init screens
  gameScreen.addChild(road);
  gameScreen.addChild(car);
  gameScreen.addChild(block);
  gameScreen.addChild(panel);
  gameScreen.addChild(wheel);

  resultScreen.addChild(road2);
  resultScreen.addChild(restartPanel);
  resultScreen.addChild(restartButton);

  app.stage.addChild(gameScreen);
  app.stage.addChild(resultScreen);

  const arrowKeys = {
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
  } as const;

  type ArrowKeys = keyof typeof arrowKeys;

  const pressedArrowKeys: Record<ArrowKeys, boolean> = {
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
  };

  document.addEventListener("keydown", (event) => {
    if (event.key in arrowKeys) {
      pressedArrowKeys[event.key as ArrowKeys] = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key in arrowKeys) {
      pressedArrowKeys[event.key as ArrowKeys] = false;
    }
  });

  function moveCar() {
    if (pressedArrowKeys.ArrowUp) {
      car.y -= carTransitionSpeed;
    }
    if (pressedArrowKeys.ArrowDown) {
      car.y += carTransitionSpeed;
    }
    if (pressedArrowKeys.ArrowLeft) {
      car.x -= carTransitionSpeed;
    }
    if (pressedArrowKeys.ArrowRight) {
      car.x += carTransitionSpeed;
    }
  }

  let carCurrentPosition: "left" | "right" = "left";
  const leftFinishPositionX = 90;
  const rightFinishPositionX = 240;
  let moveToRightClicked = false;
  let moveToLeftClicked = false;
  let isCarTransition = false;

  wheel.on("pointerdown", () => {
    if (carCurrentPosition === "left") {
      moveToRightClicked = true;
      moveToLeftClicked = false;
    } else {
      moveToRightClicked = false;
      moveToLeftClicked = true;
    }
  });

  function updateCarPosition() {
    if (gameSpeed === 0) return;
    if (
      car.position.x === leftFinishPositionX ||
      car.position.x === rightFinishPositionX
    ) {
      isCarTransition = false;
    } else {
      isCarTransition = true;
    }

    // To right
    if (moveToRightClicked && car.position.x < rightFinishPositionX) {
      carCurrentPosition = "right";
      // Fix offset
      const x = rightFinishPositionX - car.position.x;
      if (x < carTransitionSpeed) {
        car.position.x += x;
      } else {
        car.position.x += carTransitionSpeed;
      }
    }
    // To left
    if (moveToLeftClicked && car.position.x > leftFinishPositionX) {
      carCurrentPosition = "left";
      // Fix offset
      const x = car.position.x - leftFinishPositionX;
      if (x < carTransitionSpeed) {
        car.position.x -= x;
      } else {
        car.position.x -= carTransitionSpeed;
      }
    }
    if (car.x === leftFinishPositionX || car.x === rightFinishPositionX) {
      moveToLeftClicked = false;
      moveToRightClicked = false;
    }
  }

  const wheelRotateSpeed = 0.08;

  function w(n: number): number {
    return +n.toFixed(2);
  }

  function updateWheelTurn() {
    if (!gameSpeed) return;
    if (isCarTransition) {
      if (carCurrentPosition === "right") {
        wheel.rotation += wheelRotateSpeed;
      } else {
        wheel.rotation -= wheelRotateSpeed;
      }
    } else {
      if (carCurrentPosition === "right" && w(wheel.rotation) !== 0) {
        wheel.rotation -= wheelRotateSpeed;
      }
      if (carCurrentPosition === "left" && w(wheel.rotation) !== 0) {
        wheel.rotation += wheelRotateSpeed;
      }
    }
  }

  function updateScreen() {
    if (gameSpeed === 0) {
      gameScreen.visible = false;
      resultScreen.visible = true;
    } else {
      gameScreen.visible = true;
      resultScreen.visible = false;
    }
  }

  function restartGame() {
    gameSpeed = INITIAL_GAME_SPEED;
    car.x = CAR_INITIAL_POSITION_X;
    car.y = CAR_INITIAL_POSITION_Y;
    block.x = BLOCK_INITIAL_POSITION_X;
    block.y = BLOCK_INITIAL_POSITION_Y;
    resultScreen.visible = false;
    gameScreen.visible = true;
  }

  app.ticker.add(gameLoop);

  function gameLoop() {
    moveCar();
    moveRoad();
    moveBlock();
    stopGame();
    updateCarPosition();
    updateWheelTurn();
    updateScreen();
  }
}
