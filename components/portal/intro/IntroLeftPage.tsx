'use client';

import React from 'react';
import Image from 'next/image';

import castle from '/images/castle.jpeg';     // Рис. 1
import divider from '/images/divider.png';    // Рис. 2

export function IntroLeftPage() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      textAlign: 'center',
      position: 'relative',
    }}>
      {/* Слоган */}
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>
        Раскрасьте свой город — и история оживёт.
      </h2>

      {/* Рис. 1 */}
      <Image src={castle} alt="Sannata Castle" width={300} height={200} style={{ marginBottom: '12px' }} />

      {/* Текст SANNATA.me */}
      <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '12px' }}>
        SANNATA.me
      </div>

      {/* Рис. 2 */}
      <Image src={divider} alt="Decorative Divider" width={240} height={40} style={{ marginBottom: '24px' }} />

      {/* Подзаголовок */}
      <p style={{ fontSize: '1.2rem', marginBottom: '40px' }}>
        Приключенческие раскраски для детей и взрослых...
      </p>

      {/* Финальная подпись внизу справа */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '30px',
        fontSize: '1rem',
        fontStyle: 'italic',
        opacity: 0.8,
      }}>
        ... вдохновлённые путешествиями Кетти — SANNATA
      </div>
    </div>
  );
}

