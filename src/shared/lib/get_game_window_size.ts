export function getGameWindowSize() {
  const { innerWidth, innerHeight } = window;
  const minAspectRatio = 10 / 16;
  const ratio = innerWidth / innerHeight;
  const needCut = ratio > minAspectRatio;
  const isVertical = innerHeight > innerWidth && !needCut;

  const aspectRatioList = [9 / 21, 1 / 2, 9 / 16, 10 / 16];

  if (!isVertical) {
    for (const ratio of aspectRatioList) {
      const width = ratio * innerHeight;
      if (width < innerWidth) {
        return [width, innerHeight];
      }
    }

    return [innerWidth, innerHeight];
  } else {
    return [innerWidth, innerHeight];
  }
}
