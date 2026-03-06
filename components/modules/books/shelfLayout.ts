export const SHELF_LAYOUT = {
  shelfHeight: 290,
  shelfGap: 4,
  plankHeight: 12,
  sidebarPaddingTop: 20,
  menuContainerPaddingTop: 40
};

export const getAlignedPlankOffsets = () => {
  const {
    shelfHeight,
    shelfGap,
    plankHeight,
    sidebarPaddingTop,
    menuContainerPaddingTop
  } = SHELF_LAYOUT;
  const block = plankHeight + shelfGap + shelfHeight;
  const start = menuContainerPaddingTop + sidebarPaddingTop + plankHeight;
  return [
    start,
    start + block,
    start + block * 2
  ];
};
