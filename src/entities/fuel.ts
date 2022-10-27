import * as PIXI from "pixi.js";

export class Fuel extends PIXI.Sprite {
  public isBarrier = false;

  constructor({
    spriteTexture,
  }: {
    spriteTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(spriteTexture);
  }

  public static isFuel(obj: unknown): obj is Fuel {
    return obj instanceof Fuel;
  }
}
