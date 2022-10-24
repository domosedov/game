import * as PIXI from "pixi.js";

export class Car extends PIXI.Sprite {
  border: PIXI.Graphics;
  shovel: PIXI.Sprite;
  shovelIsActive = false;
  shovelTimer: number | undefined;

  constructor({
    carTexture,
    shovelTexture,
  }: {
    carTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
    shovelTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(carTexture);

    const rect = new PIXI.Graphics();
    rect.lineStyle({ width: 1 });
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
    console.log(this.shovelIsActive);
    if (!this.shovelIsActive) {
      this.shovelIsActive = true;
      this.addChild(this.shovel);
      this.shovel.y = this.height / 2 - this.shovel.height;

      setTimeout(() => {
        this.deactivateShovel();
      }, 2000);
    }
  }

  public deactivateShovel() {
    this.removeChild(this.shovel);
    this.shovelIsActive = false;
  }
}
