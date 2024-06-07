import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/Beestingsandhoney.webp'; // update the path to your image file
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice.js';
import { useEffect } from 'react';

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const { loading, error: errorMessage } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('error message', errorMessage);
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return dispatch(signInFailure('Please fill in all fields'));
    }
    try {
      dispatch(signInStart());
      const res = await fetch('api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(signInFailure(data.message));
      }
      if (res.ok) {
        dispatch(signInSuccess(data));
        navigate('/')
      }
    } catch (error) {
      dispatch(signInFailure(error.message));
    }
  };

  return (
    <div className='min-h-screen mt-20 sm:mx-auto md:mx-auto'>
      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>
        {/* {left} */}
        <div className='flex-1'>
          <div className='flex flex-col items-center'>
            <Link to='/'>
              <img src={logo} alt='logo' className='w-64 sm:w-64 md:w-64 lg:w-96 xl:w-128' />
            </Link>
            <Link
              to="/"
              className="whitespace-nowrap font-bold dark:text-white text-4xl"
            >
              <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-yellow-400 rounded-lg text-white text-base sm:text-base md:text-lg lg:text-2xl xl:text-2xl">
                Beestings and Honey Blog
              </span>
            </Link>
          </div>
          <p className='text-md mt-5 mb-5'>
            Sign in with your email addess and password or with google to get started!
          </p>
        </div>
        {/* {right} */}
        <div className='flex-1'>
          <form className='flex flex-col gap-4 w-full md:w-full xl:w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg' onSubmit={handleSubmit}>
            <div className=''>
              <Label value='Your email' />
              <TextInput
                type='email'
                placeholder='name@company.com'
                id='email'
                onChange={handleChange}
              />
            </div>
            <div className=''>
              <Label value='Your Password' />
              <TextInput
                type='password'
                placeholder='************'
                id='password'
                onChange={handleChange}
              />
            </div>
            <Button className='bg-gradient-to-r from-green-500 to-yellow-400' type='submit' disabled={loading}>
              {
                loading ? (
                  <>
                    <Spinner size='sm' />
                    <span className='pl-3'>Loading...</span>
                  </>
                ) : (
                  'Sign In'
                )
              }
            </Button>
          </form>
          <div className='flex gap-2 mt-2'>
            <span>Don&#39;t have an account?</span>
            <Link to='/sign-up' className='text-blue-500'>Sign Up</Link>
          </div>
          {
            errorMessage && (
              <Alert className='mt-5' color='failure'>
                {errorMessage}
              </Alert>
            )
          }
        </div>
      </div>
    </div>
  )
}
