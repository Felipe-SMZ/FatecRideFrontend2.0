import { Navigate } from 'react-router-dom';
import { useAnunciosStore } from '../stores/anunciosStore';

export function AnuncianteProtectedRoute({ children }) {
  const isAuthed = useAnunciosStore((s) => s.isAuthenticated());
  if (!isAuthed) return <Navigate to="/anunciante/login" replace />;
  return children;
}

export default AnuncianteProtectedRoute;
