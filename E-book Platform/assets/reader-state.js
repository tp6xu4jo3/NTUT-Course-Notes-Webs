// Reading positions, not individual visible page counts.
export function pageState(length, target, doublePage) {
  const count = Math.max(1, length), stride = doublePage ? 2 : 1;
  const idx = Math.max(0, Math.min(count - 1, Math.trunc(Number(target) || 0)));
  const first = idx - idx % stride;
  const last = Math.min(count - 1, first + stride - 1);
  const position = Math.floor(first / stride);
  const max = Math.ceil(count / stride) - 1;
  const percent = max === 0 ? 0 : position === max ? 100 : Math.min(99, Math.round(position / max * 100));
  return {first,last,position,max,percent};
}
export function targetForPosition(position,doublePage) {
  return Math.max(0,Math.trunc(Number(position)||0))*(doublePage?2:1);
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
