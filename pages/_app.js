import '../styles/globals.css';
import '../styles/theme.css';
import { AuthProvider } from '../context/AuthContext';
import AuthWrapper from '../components/AuthWrapper';

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AuthWrapper>
        <Component {...pageProps} />
      </AuthWrapper>
    </AuthProvider>
  );
}