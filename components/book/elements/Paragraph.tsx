import styles from './Paragraph.module.css';

export default function Paragraph({ text }: { text: string }) {
  return <p className={styles.paragraph}>{text}</p>;
}
