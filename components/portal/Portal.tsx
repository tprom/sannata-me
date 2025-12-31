'use client';

import React, { useState } from 'react';
import Flipbook from './Flipbook';
import GlobalNavigation from './GlobalNavigation';
import ModuleHost from './ModuleHost';
import IntroSpread from './intro/IntroSpread';

export default function Portal() {
  const [activeModule, setActiveModule] = useState<
    'books' | 'insights' | 'landmarks' | 'studio' | null
  >(null);

  // Если модуль не выбран → показываем IntroSpread
  if (!activeModule) {
    const introPages = [<IntroSpread key="intro-spread" />];
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



