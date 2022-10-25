import * as PIXI from "pixi.js";

export class Shovel extends PIXI.Sprite {
  public isBarrier = false;

  constructor({
    spriteTexture,
  }: {
    spriteTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(spriteTexture);
  }

  public static isShovel(obj: unknown): obj is Shovel {
    return obj instanceof Shovel;
  }
}
