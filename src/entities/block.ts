import * as PIXI from "pixi.js";

export class Block extends PIXI.Sprite {
  border: PIXI.Graphics;

  constructor({
    spriteTexture,
  }: {
    spriteTexture: ConstructorParameters<typeof PIXI.Sprite>[0];
  }) {
    super(spriteTexture);

    const rect = new PIXI.Graphics();
    rect.lineStyle({ width: 1 });
    // TODO fix size
    rect.drawRect(0, 0, this.width - 43, this.height - 2);
    rect.endFill();
    rect.visible = false;
    this.addChild(rect);
    this.border = rect;
  }
}
