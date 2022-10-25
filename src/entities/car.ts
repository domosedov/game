import * as PIXI from "pixi.js";

export class Car extends PIXI.Sprite {
  border: PIXI.Graphics;
  shovel: PIXI.Sprite;
  shovelIsActive = false;
  shovelTimer: number | undefined;
  shovelHp: number = 0;

  constructor({
    carTexture,
    shovelTexture,
  }: {
    carTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
    shovelTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(carTexture);

    const rect = new PIXI.Graphics();
    rect.lineStyle({ width: 1, color: 0xff0000 });
    // TODO fix size
    rect.drawRect(0, 0, this.width - 48, this.height - 18);
    rect.endFill();
    rect.visible = false;
    this.addChild(rect);
    this.border = rect;

    const shovel = new PIXI.Sprite(shovelTexture);
    this.shovel = shovel;
  }

  public activateShovel() {
    if (!this.shovelIsActive) {
      this.shovelIsActive = true;
      this.shovelHp = 3;
      this.addChild(this.shovel);
      this.shovel.y = this.height / 2 - this.shovel.height;
    }
  }

  public deactivateShovel() {
    this.removeChild(this.shovel);
    this.shovelIsActive = false;
  }
}
