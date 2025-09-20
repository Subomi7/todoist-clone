import React, { useState } from 'react';
import '../styles/Login.css';
import { Link, useNavigate } from 'react-router';
import todoist from '../assets/todoist.png';
import loginimg from '../assets/login.png';
import { loginApi } from '@/api/auth';
import { Spinner } from '@/components/Spinner';

type LoginApiResponse = {
  ok: boolean;
  token?: string;
  data?: {
    token?: string;
    message?: string;
    [key: string]: string | undefined;
  };
  message?: string;
  [key: string]: unknown;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    const res = (await loginApi(
      email,
      password
    )) as unknown as LoginApiResponse;
    setLoading(false);

    if (res.ok) {
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
      } else if (res.data && res.data.token) {
        localStorage.setItem('auth_token', res.data.token);
      }
      navigate('/');
    } else {
      setError(
        res.message ||
          res.data?.message ||
          'Login failed. Check credentials and try again.'
      );
    }
  };

  return (
    <div className='flex flex-col justify-center gap-24 container mx-auto px-20 lg:px-72 py-8'>
      <nav className='flex items-center'>
        <div className='flex items-center gap-2 logo-container'>
          <Link to='/'>
            <img src={todoist} alt='home' className='logo-img' />
          </Link>
          <h2 className='font-bold text-xl text-[#e44232]'>todoist</h2>
        </div>
      </nav>
      <main className='flex flex-col h-scren mt'>
        <h1 className='font-extrabold text-4xl flex items-center'>Log in</h1>
        <div className='divider'>
          <p></p>
        </div>
        <div className='flex flex-col lg:items-center lg:flex-row  gap-x-40 mt-7'>
          <form onSubmit={handleSubmit} className='w-full lg:w-[60%] max-w-sm space-y-4'>
            <div className='border-t border-gray-300 pt-4 hidden lg:block'></div>

            <div className='relative border rounded-lg px-3 pt-5 pb-2 h-16'>
              <label className='absolute top-1.5 left-3 text-xs'>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type='email'
                className='w-full border-0 focus:ring-0 focus:outline-none'
                placeholder='Enter your email...'
                autoComplete='email'
              />
            </div>
            <div className='relative border rounded-lg px-3 pt-5 pb-2 h-16'>
              <label className='absolute top-1.5 left-3 text-xs'>
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type='password'
                className='w-full border-0 focus:ring-0 focus:outline-none'
                placeholder='Enter your password...'
                autoComplete='current-password'
              />
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer'
              >
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  stroke-width='2'
                  d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                />
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  stroke-width='2'
                  d='M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z'
                />
              </svg>
            </div>

            {error && <div className='text-sm text-red-600'>{error}</div>}

            <button
              type='submit'
              disabled={loading}
              className='login-btn rounded-md w-full h-12'
            >
              {loading ? (
                <>
                  <Spinner />
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </button>
            <p className='text-sm'>
              By continuing with Google, Apple, or Email, you agree to Todoist’s{' '}
              <span className='text-[#e44232] underline'>Terms of Service</span>{' '}
              and{' '}
              <span className='text-[#e44232] underline'>Privacy Policy.</span>
            </p>
            <div className='border-t border-gray-300 pt-4'></div>
            <p className='text-sm flex items-center justify-center'>
              Don't have an account?{' '}
              <Link to='/auth/signup' className='text-[#e44232] underline pl-1'>
                Sign up
              </Link>
            </p>
          </form>
          <img
            src={loginimg}
            alt=''
            className='hidden lg:flex justify-center items-center lg:w-[40%] lg:h-3/4'
          />
        </div>
      </main>
    </div>
  );
};

export default Login;
