
import Head from 'next/head';
import Navbar from '../components/Navbar';

export default function Profile() {
  return (
    <>
      <Head>
        <title>User Profile - Stock Analysis</title>
        <meta name="description" content="User profile and account information" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="theme-purple">
        <div className="page-content">
          <div className="container">
            <header style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '1rem' }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                background: 'linear-gradient(135deg, #7b61ff, #9c88ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                User Profile
              </h1>
              <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                Manage your account and personal information
              </p>
            </header>

            <div className="card">
              <h2 className="text-primary" style={{ marginBottom: '1rem' }}>Account Information</h2>
              <p style={{ color: '#6b7280' }}>
                View and update your profile information, subscription details, and account settings.
              </p>
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9ff', borderRadius: '8px' }}>
                <strong>Coming Soon:</strong> Integration with /auth/protected API for user data
              </div>
            </div>
          </div>
        </div>
        <Navbar />
      </div>
    </>
  );
}
