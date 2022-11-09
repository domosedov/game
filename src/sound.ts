import { Howl } from "howler";

export const coinSound = new Howl({
  src: "assets/coin.wav",
  volume: 0.3,
});

export const pickUpShovelSound = new Howl({
  src: "assets/pickup_shovel.wav",
});

export const lostSound = new Howl({
  src: "assets/lost.wav",
});

export const destroyBlock = new Howl({
  src: "assets/destroy_block.wav",
});

export const sweepCarSound = new Howl({
  src: "assets/sweep_car.wav",
});
