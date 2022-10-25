import * as PIXI from "pixi.js";

export class Diamond extends PIXI.Sprite {
  public isBarrier = false;

  constructor({
    spriteTexture,
  }: {
    spriteTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(spriteTexture);
  }

  public static isDiamond(obj: unknown): obj is Diamond {
    return obj instanceof Diamond;
  }
}
