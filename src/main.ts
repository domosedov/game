import * as PIXI from "pixi.js";
import "./style.css";

// const aspectRatio = 9 / 16;

const app = new PIXI.Application({
  width: 432,
  height: 768,
  antialias: true,
});

document.body.appendChild(app.view);

const loader = PIXI.Loader.shared;

loader
  .add("road", "assets/road.png")
  .add("car", "assets/car.png")
  .add("panel", "assets/panel.png")
  .add("wheel", "assets/wheel.png");

loader.load(setup);

function setup(...args: unknown[]) {
  console.log(args);

  let carSpeed = 10;

  // Road
  const roadTexture = PIXI.Texture.from("assets/road.png");
  const road = new PIXI.TilingSprite(
    roadTexture,
    app.view.width,
    app.view.height
  );
  app.stage.addChild(road);

  road.tileScale.set(1 / 2.5, 1 / 2.5);

  function moveRoad() {
    road.tilePosition.y += carSpeed;
  }

  // Panel
  const panelSprite = PIXI.Sprite.from("assets/panel.png");
  app.stage.addChild(panelSprite);
  panelSprite.scale.set(0.4, 0.4);
  panelSprite.position.set(0, 768 - panelSprite._texture.orig.height / 2.5);

  // Car
  const carSprite = PIXI.Sprite.from("assets/car.png");
  carSprite.x = 90;
  carSprite.y = 380;
  carSprite.scale.set(1 / 2.5, 1 / 2.5);
  app.stage.addChild(carSprite);

  // Wheel
  const wheel = PIXI.Sprite.from("assets/wheel.png");
  app.stage.addChild(wheel);
  wheel.scale.set(0.4, 0.4);
  wheel.anchor.set(0.5, 0.5);
  wheel.position.set(216, 650);
  wheel.interactive = true;
  wheel.buttonMode = true;
  wheel.on("pointerdown", () => {
    if (carSprite.position.x === 90) {
      carSprite.position.x = 240;
    } else {
      carSprite.position.x = 90;
    }
  });

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

  const speed = 5;

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
      carSprite.y -= speed;
    }
    if (pressedArrowKeys.ArrowDown) {
      carSprite.y += speed;
      carSpeed = 0;
    }
    if (pressedArrowKeys.ArrowLeft) {
      carSprite.x -= speed;
    }
    if (pressedArrowKeys.ArrowRight) {
      carSprite.x += speed;
    }
    moveRoad();
  }
}
