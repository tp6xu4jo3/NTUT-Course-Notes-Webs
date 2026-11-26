// Reading-order and progress helpers, independent of the DOM.
export function pageState(length, target, doublePage) {
  const count = Math.max(1, length);
  const idx = Math.max(0, Math.min(count - 1, Math.trunc(Number(target) || 0)));
  const first = doublePage ? idx - idx % 2 : idx;
  const last = Math.min(count - 1, first + (doublePage ? 1 : 0));
  const value = last + 1;
  return {first, last, value, percent: value === count ? 100 : Math.min(99, Math.round(value / count * 100))};
}

export function groupToc(entries) {
  const groups = [];
  for (const entry of entries) {
    const unit = entry.unit?.trim() || "";
    const previous = groups[groups.length - 1];
    if (previous && previous.unit === unit) previous.entries.push(entry);
    else groups.push({unit, entries:[entry]});
  }
  return groups;
}
