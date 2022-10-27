import { randomIntFromInterval } from "../shared/lib/random_int_from_interval";

export function generateRandomSide(): "left" | "right" {
  return randomIntFromInterval(0, 1) === 0 ? "left" : "right";
}
