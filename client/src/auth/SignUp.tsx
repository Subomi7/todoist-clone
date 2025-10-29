import React from 'react';
import '../styles/Login.css';
import { Link, useNavigate } from 'react-router';
import todoist from '../assets/todoist.png';
import signup from '../assets/signtodoist.mp4';
import { registerApi } from '@/api/auth';
import { Spinner } from '@/components/Spinner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const signupSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupFormData) => {
    const res = await registerApi(data.email, data.password);
    if (res.ok) {
      toast.success('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/auth/login'), 1000);
    } else {
      toast.error(res.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className='flex flex-col gap-24 container mx-auto px-11 lg:px-72 py-8'>
      <nav className='flex items-center'>
        <div className='flex items-center gap-2 logo-container'>
          <Link to='/'>
            <img src={todoist} alt='home' className='logo-img' />
          </Link>
          <h2 className='font-bold text-xl text-[#e44232]'>todoist</h2>
        </div>
      </nav>
      <main className='flex flex-col h-scren mt'>
        <h1 className='font-extrabold text-4xl flex items-center'>Sign up</h1>
        <div className='divider'>
          <p></p>
        </div>
        <div className='flex flex-col lg:items-center lg:flex-row  gap-x-40 mt-7'>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='w-full lg:w-[60%] max-w-sm space-y-4'
          >
            <div className='border-t border-gray-300 pt-4 hidden lg:block'></div>

            {/* Email */}
            <div className='relative border rounded-lg px-3 pt-5 pb-2 h-16'>
              <label className='absolute top-1.5 left-3 text-xs'>Email</label>
              <input
                type='email'
                placeholder='Enter your email...'
                autoComplete='email'
                {...register('email')}
                className='w-full border-0 focus:ring-0 focus:outline-none'
              />
              {errors.email && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className='relative border rounded-lg px-3 pt-5 pb-2 h-16'>
              <label className='absolute top-1.5 left-3 text-xs'>
                Password
              </label>
              <input
                type='password'
                placeholder='Enter your password...'
                autoComplete='new-password'
                {...register('password')}
                className='w-full border-0 focus:ring-0 focus:outline-none'
              />
              {errors.password && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className='relative border rounded-lg px-3 pt-5 pb-2 h-16'>
              <label className='absolute top-1.5 left-3 text-xs'>
                Confirm Password
              </label>
              <input
                type='password'
                placeholder='Confirm your password...'
                autoComplete='new-password'
                {...register('confirmPassword')}
                className='w-full border-0 focus:ring-0 focus:outline-none'
              />
              {errors.confirmPassword && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='login-btn rounded-md w-full h-12'
            >
              {isSubmitting ? (
                <>
                  <div className='flex justify-center items-center gap-4'>
                    <Spinner className='w-5 h-5 mr-2' />
                    <p>Creating account...</p>
                  </div>
                </>
              ) : (
                'Sign up with Email'
              )}
            </button>

            <p className='text-sm'>
              By continuing, you agree to Todoist’s{' '}
              <span className='text-[#e44232] underline'>Terms of Service</span>{' '}
              and{' '}
              <span className='text-[#e44232] underline'>Privacy Policy.</span>
            </p>
            <div className='border-t border-gray-300 pt-4'></div>
            <p className='text-sm flex items-center justify-center'>
              Already have an account?{' '}
              <Link to='/auth/login' className='text-[#e44232] underline pl-1'>
                Log in
              </Link>
            </p>
          </form>
          <video
            src={signup}
            autoPlay
            loop
            muted
            className='hidden lg:flex justify-center items-center lg:w-[40%] lg:h-3/4'
          />
        </div>
      </main>
    </div>
  );
};

export default SignUp;

// import React, { useState } from 'react';
// import '../styles/Login.css';
// import { Link, useNavigate } from 'react-router';
// import todoist from '../assets/todoist.png';
// import signup from '../assets/signtodoist.mp4';
// import { registerApi } from '@/api/auth';
// import { Spinner } from '@/components/Spinner';

// const SignUp: React.FC = () => {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccessMsg(null);

//     if (!email || !password) {
//       setError('Please provide both email and password.');
//       return;
//     }

//     setLoading(true);
//     const res = await registerApi(email, password);
//     setLoading(false);

//     if (res.ok) {
//       // If API returns message, show briefly and navigate to login
//       setSuccessMsg(
//         res.message || 'Account created successfully. Redirecting to login...'
//       );
//       // small delay to show message (optional)
//       setTimeout(() => navigate('/auth/login'), 800);
//     } else {
//       // Safely handle unknown data property
//       let errorMsg = res.message || 'Signup failed. Please try again.';
//       if (res.data && typeof res.data === 'object' && 'message' in res.data) {
//         errorMsg = (res.data as { message?: string }).message || errorMsg;
//       }
//       setError(errorMsg);
//     }
//   };

//   return (
//     <div className='flex flex-col gap-24 container mx-auto px-20 lg:px-72 py-8'>
//       <nav className='flex items-center'>
//         <div className='flex items-center gap-2 logo-container'>
//           <Link to='/'>
//             <img src={todoist} alt='home' className='logo-img' />
//           </Link>
//           <h2 className='font-bold text-xl text-[#e44232]'>todoist</h2>
//         </div>
//       </nav>
//       <main className='flex flex-col h-scren mt'>
//         <h1 className='font-extrabold text-4xl flex items-center'>Sign up</h1>
//         <div className='divider'>
//           <p></p>
//         </div>
//         <div className='flex flex-col lg:items-center lg:flex-row  gap-x-40 mt-7'>
//           <form
//             onSubmit={handleSubmit}
//             className='w-full lg:w-[60%] max-w-sm space-y-4'
//           >
//             <div className='border-t border-gray-300 pt-4 hidden lg:block'></div>

//             <div className='relative border rounded-lg px-3 pt-5 pb-2 h-16'>
//               <label className='absolute top-1.5 left-3 text-xs'>Email</label>
//               <input
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 type='email'
//                 className='w-full border-0 focus:ring-0 focus:outline-none'
//                 placeholder='Enter your personal or work email...'
//                 autoComplete='email'
//               />
//             </div>
//             <div className='relative border rounded-lg px-3 pt-5 pb-2 h-16'>
//               <label className='absolute top-1.5 left-3 text-xs'>
//                 Password
//               </label>
//               <input
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 type='password'
//                 className='w-full border-0 focus:ring-0 focus:outline-none'
//                 placeholder='Enter your password...'
//                 autoComplete='new-password'
//               />
//               <svg
//                 xmlns='http://www.w3.org/2000/svg'
//                 fill='none'
//                 viewBox='0 0 24 24'
//                 stroke='currentColor'
//                 className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer'
//               >
//                 <path
//                   stroke-linecap='round'
//                   stroke-linejoin='round'
//                   stroke-width='2'
//                   d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
//                 />
//                 <path
//                   stroke-linecap='round'
//                   stroke-linejoin='round'
//                   stroke-width='2'
//                   d='M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z'
//                 />
//               </svg>
//             </div>
//             {error && <div className='text-sm text-red-600'>{error}</div>}
//             {successMsg && (
//               <div className='text-sm text-green-600'>{successMsg}</div>
//             )}

//             <button
//               type='submit'
//               disabled={loading}
//               className='login-btn rounded-md w-full h-12'
//             >
//               {loading ? (
//                 <>
//                   <Spinner className='w-5 h-5 mr-2' />
//                   Creating account...
//                 </>
//               ) : (
//                 'Sign up with Email'
//               )}
//             </button>
//             <p className='text-sm'>
//               By continuing with Google, Apple, or Email, you agree to Todoist’s{' '}
//               <span className='text-[#e44232] underline'>Terms of Service</span>{' '}
//               and{' '}
//               <span className='text-[#e44232] underline'>Privacy Policy.</span>
//             </p>
//             <div className='border-t border-gray-300 pt-4'></div>
//             <p className='text-sm flex items-center justify-center'>
//               Don't have an account?{' '}
//               <Link to='/auth/login' className='text-[#e44232] underline pl-1'>
//                 Go to Login
//               </Link>
//             </p>
//           </form>
//           <video
//             src={signup}
//             autoPlay
//             loop
//             muted
//             className='hidden lg:flex justify-center items-center lg:w-[40%] lg:h-3/4'
//           />
//         </div>
//       </main>
//     </div>
//   );
// };

// export default SignUp;
