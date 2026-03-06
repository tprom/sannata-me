import type { IllustrationBlock } from "@/data/types";

type Props = {
  block: IllustrationBlock;
  lang: string;
};

const sizeClass: Record<IllustrationBlock["size"], string> = {
  small: "illustration-size-small",
  medium: "illustration-size-medium",
  large: "illustration-size-large",
};

const positionClass: Record<IllustrationBlock["position"], string> = {
  left: "illustration-position-left",
  right: "illustration-position-right",
  center: "illustration-position-center",
};

export default function IllustrationBlockRenderer({ block, lang }: Props) {
  const caption =
    block.caption?.[lang as keyof typeof block.caption] ?? "";

  const classes = [
    "illustration-block",
    sizeClass[block.size],
    positionClass[block.position],
    block.wrap ? "illustration-wrap" : "",
    block.shadow ? "illustration-shadow" : "",
    block.border ? "illustration-border" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: React.CSSProperties =
    block.rotate ? { transform: `rotate(${block.rotate}deg)` } : {};

  return (
    <figure
      className={classes}
      style={style}
      id={block.anchor ?? undefined}
    >
      <img src={block.image} alt={caption} className="illustration-img" />
      {caption && (
        <figcaption className="illustration-caption">{caption}</figcaption>
      )}
    </figure>
  );
}
