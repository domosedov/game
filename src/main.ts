import * as PIXI from "pixi.js";
import { Container } from "pixi.js";
import "./style.css";

const DEFAULT_SCALE = 0.4;
// const ASPECT_RATIO = 9 / 16;

const app = new PIXI.Application({
  width: 432,
  height: 768,
  antialias: true,
});

document.body.appendChild(app.view);

const loader = PIXI.Loader.shared;

loader.baseUrl = "assets";

loader
  .add("road", "road.png")
  .add("car", "car.png")
  .add("panel", "panel.png")
  .add("wheel", "wheel.png")
  .add("block", "block.png");

loader.load(setup);

function setup(
  _loader: PIXI.Loader,
  resources: PIXI.utils.Dict<PIXI.LoaderResource>
) {
  const roadTexture = resources["road"].texture;
  const carTexture = resources["car"].texture;
  const panelTexture = resources["panel"].texture;
  const wheelTexture = resources["wheel"].texture;
  const blockTexture = resources["block"].texture;

  let gameSpeed = 5;
  const carTransitionSpeed = 12;

  // Block
  function createBlock() {
    const sprite = new PIXI.Sprite(blockTexture);
    sprite.scale.set(DEFAULT_SCALE);

    const container = new PIXI.Container();
    container.addChild(sprite);

    const rect = new PIXI.Graphics();
    rect.lineStyle({ width: 1, color: 0xaa0000 });
    rect.drawRect(
      0,
      0,
      sprite.getBounds().width - 17,
      sprite.getBounds().height
    );
    rect.endFill();

    container.addChild(rect);

    return container;
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
    const container = new PIXI.Container();

    const sprite = new PIXI.Sprite(carTexture);
    sprite.scale.set(DEFAULT_SCALE);

    const rect = new PIXI.Graphics();
    rect.lineStyle({ width: 1, color: 0xaa0000 });
    rect.drawRect(
      0,
      0,
      sprite.getBounds().width - 17,
      sprite.getBounds().height
    );
    rect.endFill();

    container.addChild(sprite, rect);

    return container;
  }

  // Panel
  function createPanel() {
    const sprite = new PIXI.Sprite(panelTexture);
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

  // Init
  const road = createRoad();
  const car = createCar();
  const panel = createPanel();
  const wheel = createWheel();
  const block = createBlock();

  function moveRoad() {
    road.tilePosition.y += gameSpeed;
  }

  function stopGame() {
    const isIntersect = rectsIntersect(car, block.children[1] as Container);
    if (isIntersect) {
      gameSpeed = 0;
    }
  }

  block.position.set(90, 0);
  function moveBlock() {
    const blockBottomBoard = block.position.y + block.height;
    if (block.y > app.view.height) {
      block.position.set(90, 0);
    }
    block.y += gameSpeed;
  }

  car.x = 90;
  car.y = 380;

  wheel.position.set(216, 650);
  wheel.interactive = true;
  wheel.buttonMode = true;

  // Add to game
  app.stage.addChild(road);
  app.stage.addChild(car);
  app.stage.addChild(block);
  app.stage.addChild(panel);
  app.stage.addChild(wheel);

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

  app.ticker.add(gameLoop);

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

  function gameLoop() {
    moveCar();
    moveRoad();
    moveBlock();
    stopGame();
    updateCarPosition();
    updateWheelTurn();
  }
}
