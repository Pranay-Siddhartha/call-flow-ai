import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CallerScreen from './pages/CallerScreen';
import CallHistory from './pages/CallHistory';
import CallDetail from './pages/CallDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="call/:id" element={<CallerScreen />} />
        <Route path="history" element={<CallHistory />} />
        <Route path="history/:id" element={<CallDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
