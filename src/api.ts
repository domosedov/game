const sleep = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

export async function getUser() {
  await sleep(1000);
  return { id: "kek" };
}
