import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PengajuanMutasi() {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately redirect to the integrated system
    navigate('/apps/pengajuan-mutasi-terpadu', { replace: true });
  }, [navigate]);

  // Return null since we're redirecting immediately
  return null;
}