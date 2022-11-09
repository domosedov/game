import * as PIXI from "pixi.js";

export class Fuel extends PIXI.Sprite {
  public isBarrier = false;
  public isCaped = false;

  constructor({
    spriteTexture,
  }: {
    spriteTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(spriteTexture);
  }

  public cap() {
    this.isCaped = true;
    this.visible = false;
  }
}
