import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { registerUser, isAuthenticated } from '../services/api';
import styles from '../styles/Auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    } else if (formData.username.length < 3) {
      newErrors.username = 'نام کاربری باید حداقل ۳ کاراکتر باشد';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'ایمیل الزامی است';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'لطفا یک آدرس ایمیل معتبر وارد کنید';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (formData.password.length < 8) {
      newErrors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'رمز عبور باید شامل حداقل یک حرف بزرگ، یک حرف کوچک و یک عدد باشد';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'لطفا رمز عبور خود را تایید کنید';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمزهای عبور مطابقت ندارند';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    setSuccessMessage('');

    try {
      const result = await registerUser(formData.username, formData.email, formData.password);

      if (!result.success) {
        throw new Error(result.error || 'ثبت نام ناموفق بود');
      }

      setSuccessMessage('حساب کاربری با موفقیت ایجاد شد! در حال انتقال به صفحه ورود...');

      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      console.error('خطا در ثبت نام:', error);

      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        setServerError('امکان اتصال به سرور وجود ندارد. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.');
      } else if (error.message.includes('400') && (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('username'))) {
        setServerError('حساب کاربری با این ایمیل یا نام کاربری از قبل وجود دارد. لطفاً از اطلاعات کاربری دیگری استفاده کنید یا وارد شوید.');
      } else if (error.message.includes('400')) {
        setServerError('داده‌های ثبت نام نامعتبر است. لطفاً ورودی‌های خود را بررسی کرده و دوباره تلاش کنید.');
      } else {
        setServerError(error.message || 'ثبت نام ناموفق بود. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>ایجاد حساب کاربری - پلتفرم تحلیلی YADATradepro</title>
        <meta name="description" content="ایجاد حساب کاربری در پلتفرم تحلیلی" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          {/* Header */}
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>ایجاد حساب کاربری</h1>
            <p className={styles.authSubtitle}>برای شروع تحلیل سهام به ما بپیوندید</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            {/* Success Message */}
            {successMessage && (
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                <p style={{ margin: 0 }}>
                  ✅ {successMessage}
                </p>
              </div>
            )}

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
                placeholder="یک نام کاربری انتخاب کنید"
                className={`${styles.formInput} ${errors.username ? styles.error : ''}`}
              />
              {errors.username && (
                <p className={styles.formError}>{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                آدرس ایمیل
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@example.com"
                className={`${styles.formInput} ${errors.email ? styles.error : ''}`}
              />
              {errors.email && (
                <p className={styles.formError}>{errors.email}</p>
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
                placeholder="یک رمز عبور قوی ایجاد کنید"
                className={`${styles.formInput} ${errors.password ? styles.error : ''}`}
              />
              {errors.password && (
                <p className={styles.formError}>{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.formLabel}>
                تأیید رمز عبور
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="رمز عبور خود را تایید کنید"
                className={`${styles.formInput} ${errors.confirmPassword ? styles.error : ''}`}
              />
              {errors.confirmPassword && (
                <p className={styles.formError}>{errors.confirmPassword}</p>
              )}
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
                  در حال ایجاد حساب کاربری...
                </>
              ) : (
                'ایجاد حساب کاربری'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className={styles.authFooter}>
            <p>
              آیا حساب کاربری دارید؟{' '}
              <Link href="/login" className={styles.authLink}>
                از اینجا وارد شوید
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}