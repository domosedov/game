import * as PIXI from "pixi.js";
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

  let carSpeed = 6;
  const speed = 8;

  // Block
  function createBlock() {
    const sprite = new PIXI.Sprite(blockTexture);
    sprite.scale.set(DEFAULT_SCALE);
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
    const sprite = new PIXI.Sprite(carTexture);
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

  // Wheel
  function createWheel() {
    const sprite = new PIXI.Sprite(wheelTexture);
    sprite.scale.set(DEFAULT_SCALE);
    sprite.anchor.set(0.5, 0.5);
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
    road.tilePosition.y += carSpeed;
  }

  function stopGame() {
    const isIntersect = rectsIntersect(car, block);
    console.log({ isIntersect });
    if (isIntersect) {
      carSpeed = 0;
    }
  }

  block.position.set(90, 0);
  function moveBlock() {
    const blockBottomBoard = block.position.y + block.height;
    console.log(blockBottomBoard);
    if (block.y > app.view.height) {
      block.position.set(90, 0);
    }
    block.y += carSpeed;
  }

  car.x = 90;
  car.y = 380;

  wheel.position.set(216, 650);
  wheel.interactive = true;
  wheel.buttonMode = true;
  wheel.on("pointerdown", () => {
    console.log(car.getBounds());
    if (car.position.x === 90) {
      car.position.x = 240;
    } else {
      car.position.x = 90;
    }
  });

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
    console.log(event);
    if (event.key in arrowKeys) {
      pressedArrowKeys[event.key as ArrowKeys] = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    console.log(event);
    if (event.key in arrowKeys) {
      pressedArrowKeys[event.key as ArrowKeys] = false;
    }
  });

  app.ticker.add(gameLoop);

  function gameLoop() {
    if (pressedArrowKeys.ArrowUp) {
      car.y -= speed;
    }
    if (pressedArrowKeys.ArrowDown) {
      car.y += speed;
      carSpeed = 0;
    }
    if (pressedArrowKeys.ArrowLeft) {
      car.x -= speed;
    }
    if (pressedArrowKeys.ArrowRight) {
      car.x += speed;
    }
    moveRoad();
    moveBlock();
    stopGame();
  }
}
