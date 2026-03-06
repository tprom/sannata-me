import styles from "./PostcardBookInvite.module.css";

export default function PostcardBookInvite({ link }) {
  if (!link) {
    return null;
  }

  return (
    <div className={styles.invite}>
      <span>Читать полную историю в книге</span>
      <a href={link} className={styles.link}>
        Книга Кетти
      </a>
    </div>
  );
}
