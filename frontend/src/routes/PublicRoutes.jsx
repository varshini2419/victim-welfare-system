import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicHome from '../pages/public/PublicHome';
import Register from '../pages/auth/Register';

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/register/victim" element={<Register />} />
    </Routes>
  );
}
