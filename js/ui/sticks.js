export function bindSticks(root) {
  const front = root.querySelector("[data-dot='front']");
  const back = root.querySelector("[data-dot='back']");
  const frontLabel = root.querySelector("[data-label='front']");
  const backLabel = root.querySelector("[data-label='back']");

  function set(input, regular, visible) {
    root.hidden = !visible;
    if (!visible) return;
    frontLabel.textContent = regular ? "L front" : "L back";
    backLabel.textContent = regular ? "R back" : "R front";
    front.style.transform = `translate(${input.front.x * 28}px, ${input.front.y * 28}px)`;
    back.style.transform = `translate(${input.back.x * 28}px, ${input.back.y * 28}px)`;
  }

  return { set };
}
