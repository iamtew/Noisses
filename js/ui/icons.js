/** Tabler outline SVGs in /assets/icons. Mask so they take currentColor. */
export function iconUrl(name) {
  return new URL(`../../assets/icons/${name}.svg`, import.meta.url).href;
}

export function iconHtml(name) {
  const href = iconUrl(name);
  return `<span class="ico" style="-webkit-mask-image:url('${href}');mask-image:url('${href}')" aria-hidden="true"></span>`;
}
