// /components/modules/landmarks/LandmarksModule.tsx

'use client';

import React from 'react';

// Временные страницы (позже заменим на JSON)
function LandmarkIntroLeft() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Landmarks</h1>
      <p>Welcome to the Landmarks module.</p>
    </div>
  );
}

function LandmarkIntroRight() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Augsburg</h2>
      <p>A city of history, architecture, and quiet beauty.</p>
    </div>
  );
}

const LandmarksModule = {
  generate() {
    // 1. Навигация модуля
    const navigation = {
  title: 'Landmarks',
  active: 'map',
  items: [
    { id: 'map', label: 'Map' }
  ]
};


    // 2. Страницы (пока статично)
    const pages = [
      <LandmarkIntroLeft key="landmark-left" />,
      <LandmarkIntroRight key="landmark-right" />
    ];

    // 3. Управление модулем (пока заглушка)
    const controls = {
      onSelect: (id: string) => {
        console.log('Selected landmark:', id);
      }
    };

    return { navigation, pages, controls };
  }
};

export default LandmarksModule;
