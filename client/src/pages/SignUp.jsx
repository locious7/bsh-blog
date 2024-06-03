import { Button, Label, TextInput } from 'flowbite-react'
import React from 'react'
import { Link } from 'react-router-dom'

export default function SignUp() {
  return (
    <div className='min-h-screen mt-20'>
      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>
        {/* {left} */}
        <div className='flex-1'>
          <Link
            to="/"
            className="whitespace-nowrap font-bold dark:text-white text-4xl"
          >
            <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-yellow-400 rounded-lg text-white">
              Beestings and Honey Blog
            </span>
          </Link>
          <p className='text-md mt-5 mb-5'>
            Sign up with your email addess and passworg or with google to get started!
          </p>
        </div>
        {/* {right} */}
        <div className='flex-1'>
          <form className='flex flex-col gap-4 w-full md:w-full xl:w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg'>
            <div className=''>
              <Label value='Your Username' />
              <TextInput
                type='text'
                placeholder='Username'
                id='username'
              />
            </div>
            <div className=''>
              <Label value='Your email' />
              <TextInput
                type='text'
                placeholder='name@company.com'
                id='email'
              />
            </div>
            <div className=''>
              <Label value='Your Password' />
              <TextInput
                type='text'
                placeholder='Password'
                id='password'
              />
            </div>
            <Button className='bg-gradient-to-r from-green-500 to-yellow-400' type='submit'>
              Sign Up
            </Button>
          </form>
          <div className='flex gap-2 mt-2'>
            <span>Have an account?</span>
            <Link to='/sign-in' className='text-blue-500'>Sign In</Link>
          </div>
        </div>
        <div className=''>

        </div>
      </div>
    </div>
  )
}
