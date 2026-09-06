import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicHome from '../pages/public/PublicHome';

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
    </Routes>
  );
}
