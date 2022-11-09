import * as PIXI from "pixi.js";

export class Rocks extends PIXI.Sprite {
  public isBarrier = true;
  public isDestructible = false;
  public isDestroyed = false;
  public border;

  constructor({
    spriteTexture,
  }: {
    spriteTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(spriteTexture);
    this.border = this;
  }

  public destroy() {
    this.isDestroyed = true;
    this.visible = false;
  }
}
