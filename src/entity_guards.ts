import { Block } from "./entities/block";
import { Diamond } from "./entities/diamond";
import { Fuel } from "./entities/fuel";
import { Rocks } from "./entities/rocks";
import { Shovel } from "./entities/shovel";

export function isBarrier(obj: unknown): obj is Block | Rocks {
  return obj instanceof Block || obj instanceof Rocks;
}

export function isDiamond(obj: unknown): obj is Diamond {
  return obj instanceof Diamond;
}

export function isShovel(obj: unknown): obj is Shovel {
  return obj instanceof Shovel;
}

export function isFuel(obj: unknown): obj is Fuel {
  return obj instanceof Fuel;
}
