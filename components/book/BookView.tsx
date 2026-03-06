export default function BookView({ book }) {
  return (
    <div style={{ padding: 40 }}>
      <h2>Книга: {book?.title || 'Без названия'}</h2>
      <p>Компонент BookView ещё не реализован.</p>
    </div>
  );
}
