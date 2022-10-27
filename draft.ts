function spawnObjects() {
  if (!isStartGameClicked) return;

  let newObject = randomSpawn();

  const randomOffset = randomIntFromInterval(
    0,
    newObject.height * (Math.random() + 1)
  );
  const side = generateRandomSide();
  const lastObject = allObjects.at(-1);
  const lastObjectInView = lastObject ? lastObject.y >= 0 : false;
  const lastObjectIsBlock = isBarrier(lastObject);
  const startOffset = lastObject?.y ?? 0;
  const isOffsetMoreThanDistance = startOffset > distance;

  // Если блок
  if (isBarrier(newObject) && blocksCount < 5) {
    newObject.x = 0;
    if (!lastObject) {
      newObject.y = 0 - newObject.height;
      newObject.x =
        side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
    }

    if (lastObject && lastObjectInView) {
      if (lastObjectIsBlock) {
        newObject.y = isOffsetMoreThanDistance
          ? 0 - newObject.height
          : 0 - distance - newObject.height;
      }

      newObject.x =
        side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
    }

    if (lastObject && !lastObjectInView) {
      if (lastObjectIsBlock) {
        newObject.y = lastObject.y - distance;
      } else {
        newObject.y = lastObject.y - newObject.height;
      }

      newObject.x =
        side === "left" ? CAR_LEFT_POSITION_X : CAR_RIGHT_POSITION_X;
    }

    blocksCount += 1;
    gameRoad.addChild(newObject);
    allObjects.push(newObject);
  }

  if (Diamond.isDiamond(newObject) && diamondsCount < 2) {
    if (!lastObject) {
      newObject.y = 0 - newObject.height;
    }

    if (lastObject && lastObjectInView) {
      const startOffset = lastObject.y;
      newObject.y = 0 - newObject.height - startOffset - randomOffset;
    }

    if (lastObject && !lastObjectInView) {
      newObject.y = lastObject.y - newObject.height;
    }

    newObject.x =
      side === "left"
        ? CAR_LEFT_POSITION_X + newObject.width
        : CAR_RIGHT_POSITION_X + newObject.width;

    diamondsCount++;
    allObjects.push(newObject);
    gameRoad.addChild(newObject);
  }
}
