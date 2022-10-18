import * as PIXI from "pixi.js";
import "./style.css";

// const aspectRatio = 9 / 16;

const app = new PIXI.Application({
  width: 432,
  height: 768,
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

  // Road
  const roadTexture = PIXI.Texture.from("assets/road.png");
  const road = new PIXI.TilingSprite(
    roadTexture,
    app.view.width,
    app.view.height
  );
  app.stage.addChild(road);

  road.tileScale.set(1 / 2.5, 1 / 2.5);

  app.ticker.add(() => {
    road.tilePosition.y += 8;
  });

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
  wheel.on("click", () => {
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
  };

  const speed = 10;

  document.addEventListener("keydown", (event) => {
    console.log(event);
    if (event.key === arrowKeys["ArrowUp"]) {
      carSprite.position.y -= speed;
    }
    if (event.key === arrowKeys["ArrowRight"]) {
      carSprite.position.x += speed;
    }
    if (event.key === arrowKeys["ArrowDown"]) {
      carSprite.position.y += speed;
    }
    if (event.key === arrowKeys["ArrowLeft"]) {
      carSprite.position.x -= speed;
    }
    console.log(carSprite.position);
  });
}
