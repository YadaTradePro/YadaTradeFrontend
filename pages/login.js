import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { loginUser, isAuthenticated } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'نام کاربری الزامی است';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear server error when user modifies form
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      // Store remember me preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_remember', formData.rememberMe.toString());
      }

      // ✅ اصلاح مهم: از ساختار جدید پاسخ loginUser استفاده کنید
      const { token } = await loginUser(formData.username, formData.password);

      // بررسی وجود توکن برای تایید موفقیت لاگین
      if (token) {
        console.log('✅ Login successful, updating auth context...');
        // Update auth context to trigger data reload
        login(token);
        router.push('/');
      } else {
        // اگر توکن وجود نداشت، خطا را پرتاب کنید
        throw new Error('Login failed: No token received.');
      }

    } catch (error) {
      console.error('Login error:', error);

      // Error handling based on API response or network issues
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('fetch') || errorMsg.includes('failed to fetch')) {
        setServerError('عدم اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
      } else if (error.status === 401 || errorMsg.includes('401') || errorMsg.includes('invalid')) {
        setServerError('نام کاربری یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.');
      } else if (error.status === 429 || errorMsg.includes('429')) {
        setServerError('تعداد تلاش‌های ورود زیاد است. لطفاً کمی صبر کنید.');
      } else {
        setServerError(error.message || 'ورود ناموفق. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>ورود - پلتفرم تحلیلی YADATradepro</title>
        <meta name="description" content="ورود به حساب کاربری پلتفرم تحلیلی YADATradepro" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          {/* Header */}
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>خوش آمدید</h1>
            <p className={styles.authSubtitle}>وارد حساب کاربری خود شوید</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Server Error */}
            {serverError && (
              <div className={`${styles.alert} ${styles.alertError}`}>
                <p style={{ margin: 0 }}>
                  ⚠️ {serverError}
                </p>
              </div>
            )}

            {/* Username Field */}
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.formLabel}>
                نام کاربری
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="نام کاربری خود را وارد کنید"
                className={`${styles.formInput} ${errors.username ? styles.error : ''}`}
              />
              {errors.username && (
                <p className={styles.formError}>نام کاربری الزامی است</p>
              )}
            </div>

            {/* Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                رمز عبور
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="رمز عبور خود را وارد کنید"
                className={`${styles.formInput} ${errors.password ? styles.error : ''}`}
              />
              {errors.password && (
                <p className={styles.formError}>رمز عبور الزامی است</p>
              )}
            </div>

            {/* Remember Me */}
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className={styles.checkbox}
              />
              <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                مرا به خاطر بسپار
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? (
                <>
                  <div className={styles.loadingSpinner}></div>
                  در حال ورود...
                </>
              ) : (
                'ورود'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className={styles.authFooter}>
            <p>
              حساب کاربری ندارید؟{' '}
              <Link href="/register" className={styles.authLink}>
                اینجا ثبت نام کنید
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}