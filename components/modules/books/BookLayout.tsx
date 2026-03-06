"use client";

import { useState } from "react";
import BooksMainPage from "@/components/modules/books/BooksMainPage";
import BookView from "@/components/book/BookView";
import styles from "./BookLayout.module.css";

export default function BookLayout() {
  const [activeBook, setActiveBook] = useState(null);

  return (
    <div className={styles.layout}>
      {/* Правая панель — книга или главная страница модуля */}
      <div className={styles.mainPane}>
        {activeBook ? <BookView book={activeBook} /> : <BooksMainPage />}
      </div>
    </div>
  );
}
