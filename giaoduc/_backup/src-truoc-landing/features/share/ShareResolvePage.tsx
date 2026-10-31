import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { shareApi } from '../../services/featureApi';
import Button from '../../components/ui/Button';

const ShareResolvePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    shareApi.resolveShare(token).then((res) => {
      const { resourceType, resourceId } = res.data;
      if (resourceType === 'DECK') navigate(`/flashcards/${resourceId}/study`, { replace: true });
      else navigate('/exams', { replace: true });
    }).catch(() => {
      setError('Link chia sẻ không hợp lệ hoặc đã hết hạn');
      setLoading(false);
    });
  }, [token, navigate]);

  if (loading && !error) {
    return <div className="p-10 text-center text-vutruNhat">Đang mở nội dung chia sẻ...</div>;
  }

  return (
    <div className="max-w-md mx-auto card text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <Link to="/dashboard"><Button variant="primary">Về Dashboard</Button></Link>
    </div>
  );
};

export default ShareResolvePage;
