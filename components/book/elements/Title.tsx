import styles from './Title.module.css';

export default function Title({ text }: { text: string }) {
  return <h1 className={styles.title}>{text}</h1>;
}
