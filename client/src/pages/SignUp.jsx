import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/Beestingsandhoney.webp'; // update the path to your image file
import { useState } from 'react';
import OAuth from '../components/OAuth';


export default function SignUp() {
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      return setErrorMessage('Please fill in all fields');
    }
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch('api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        setErrorMessage(data.message);
        setLoading(false);
        return;
      }
      if (res.ok) {
        navigate('/sign-in')
      }
    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
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
            Sign up with your email addess and password or with google to get started!
          </p>
        </div>
        {/* {right} */}
        <div className='flex-1'>
          <form className='flex flex-col gap-4 w-full md:w-full xl:w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg' onSubmit={handleSubmit}>
            <div className=''>
              <Label value='Your Username' />
              <TextInput
                type='text'
                placeholder='Username'
                id='username'
                onChange={handleChange}
              />
            </div>
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
                placeholder='Password'
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
                  'Sign Up'
                )
              }
            </Button>
            <OAuth />
          </form>
          <div className='flex gap-2 mt-2'>
            <span>Have an account?</span>
            <Link to='/sign-in' className='text-blue-500'>Sign In</Link>
          </div>
          {
            errorMessage && (
              <Alert className='mt-5' color={'failure'}>
                {errorMessage}
              </Alert>
            )
          }
        </div>
      </div>
    </div>
  )
}
