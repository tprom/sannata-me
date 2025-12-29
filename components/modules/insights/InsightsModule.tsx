// /components/modules/insights/InsightsModule.tsx

'use client';

import React from 'react';

// Временные страницы (позже заменим на JSON)
function InsightIntroLeft() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Insights</h1>
      <p>Welcome to the Insights module.</p>
    </div>
  );
}

function InsightIntroRight() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Creative Thinking</h2>
      <p>This is where ideas begin.</p>
    </div>
  );
}

const InsightsModule = {
  generate() {
    // 1. Навигация модуля
    const navigation = {
  title: 'Insights',
  active: 'default',
  items: [
    { id: 'default', label: 'Overview' }
  ]
};


    // 2. Страницы (пока статично)
    const pages = [
      <InsightIntroLeft key="insight-left" />,
      <InsightIntroRight key="insight-right" />
    ];

    // 3. Управление модулем (пока заглушка)
    const controls = {
      onSelect: (id: string) => {
        console.log('Selected insight topic:', id);
      }
    };

    return { navigation, pages, controls };
  }
};

export default InsightsModule;
