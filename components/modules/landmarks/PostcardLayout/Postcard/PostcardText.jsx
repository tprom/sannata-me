import styles from "./PostcardText.module.css";

export default function PostcardText({ text = "" }) {
  const safeText = text || "";
  const blocks = safeText.split(/\n\n+/g).map((item) => item.trim());
  const nodes = [];

  blocks.forEach((block, index) => {
    if (!block) return;

    const match = block.match(
      /^\[\[illustration:([^\]|]+)(?:\|([^\]]+))?\]\]$/i,
    );

    if (match) {
      const src = match[1];
      const side = match[2] === "right" ? "right" : "left";
      nodes.push(
        <span
          key={`illustration-${index}`}
          className={`${styles.illustration} ${
            side === "right" ? styles.right : styles.left
          }`}
        >
          <img src={src} alt="Illustration" />
        </span>,
      );
      return;
    }

    nodes.push(<p key={`paragraph-${index}`}>{block}</p>);
  });

  return <div className={styles.text}>{nodes}</div>;
}
