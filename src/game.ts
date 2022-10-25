export {};
// import * as PIXI from "pixi.js";
// import { Block } from "./entities/block";
// import { Diamond } from "./entities/diamond";
// import { Rocks } from "./entities/rocks";
// import { Shovel } from "./entities/shovel";

// class Game {
//   private app: PIXI.Application;
//   private gameStarted = false;
//   private showResult = false;
//   private gameSpeed = 6;
//   private carTransitionSpeed = 12;
//   private carCurrentPosition: "left" | "right" = "left";
//   private moveToRightClicked = false;
//   private moveToLeftClicked = false;
//   private isCarTransition = false;
//   private gameInterval: number | undefined;
//   private blocks: (Block | Rocks)[] = [];
//   private diamonds: Diamond[] = [];
//   private shovels: Shovel[] = [];
//   private score = 0;
//   private shovelSpawnInterval: number | undefined;
//   private shovelCreated = false;
//   private textures!: Record<keyof typeof this.assetsEnum, PIXI.Texture>;

//   private assetsEnum = {
//     road: "road",
//     car: "car",
//     panel: "panel",
//     wheel: "wheel",
//     block: "block",
//     restartPanel: "restart_panel",
//     restartButton: "restart_button",
//     coinGold: "coin_gold",
//     coinPurple: "coin_purple",
//     diamond: "diamond",
//     gas: "gas",
//     rocks: "rocks",
//     scoreCoin: "score_coin",
//     shovel: "shovel",
//     topPanel: "top_panel",
//     startButton: "start_button",
//   } as const;

//   constructor({ app }: { app: PIXI.Application }) {
//     this.app = app;
//   }

//   private loadAssets() {
//     Object.entries(this.assetsEnum).map(([key, path]) => {
//       this.app.loader.add(key, path + ".png");
//     });

//     this.app.loader.load(this.assetsLoaded);
//   }

//   private assetsLoaded(
//     _loader: PIXI.Loader,
//     resources: PIXI.utils.Dict<PIXI.LoaderResource>
//   ) {
//     this.textures = Object.keys(this.assetsEnum).reduce<
//       Record<keyof typeof this.assetsEnum, PIXI.Texture>
//     >((acc, cur) => {
//       acc[cur as keyof typeof this.assetsEnum] = resources[cur].texture!;
//       return acc;
//     }, {} as Record<keyof typeof this.assetsEnum, PIXI.Texture>);

//     this.initGame();
//   }

//   private initGame() {}

//   private loop() {}

//   public run() {
//     this.loadAssets();
//   }
// }
