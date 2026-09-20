import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

let socket: Socket | null = null;

export function useClinicRealtime(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const token = sessionStorage.getItem('cf_access');
    if (!token) return;
    socket = io(`${import.meta.env.VITE_WS_URL || 'http://localhost:3000'}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    const invalidate = () => {
      qc.invalidateQueries();
    };
    [
      'token.created',
      'token.called',
      'token.started',
      'token.completed',
      'prescription.ready',
      'dispensing.created',
      'dispensing.completed',
      'payment.completed',
      'repeat.requested',
      'repeat.approved',
    ].forEach((event) => socket?.on(event, invalidate));
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [enabled, qc]);
}
