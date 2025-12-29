'use client';

import React, { useState } from 'react';
import Flipbook from './Flipbook.tsx';
import GlobalNavigation from './GlobalNavigation.tsx';
import ModuleHost from './ModuleHost.tsx';
import IntroSpread from './intro/IntroSpread.tsx';

export default function Portal() {
  const [activeModule, setActiveModule] = useState<
  'books' | 'insights' | 'landmarks' | 'studio' | null
>(null);


  // Если модуль не выбран → показываем IntroSpread
  if (!activeModule) {
    const introPages = IntroSpread();
    return (
      <div className="portal">
        <GlobalNavigation onSelect={setActiveModule} active={null} />
        <Flipbook pages={introPages} />
      </div>
    );
  }

  // Если модуль выбран → рендерим ModuleHost
  return (
    <div className="portal">
      <GlobalNavigation onSelect={setActiveModule} active={activeModule} />
      <ModuleHost activeModule={activeModule} />
    </div>
  );
}


