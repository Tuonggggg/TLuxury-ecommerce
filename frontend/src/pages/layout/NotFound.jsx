import React from 'react'

const NotFoundPage = () => {
  return (
    <div className='items-center justify-center'>
    <div className='flex flex-col items-center justify-center min-h-screen text-center bg-white'>
      <img src="/404_NotFound.png" alt="404_NotFound" className='max-w-full mb-6 w-125' />
      <p className='text-xl font-semibold '>
        Không tìm thấy trang
      </p>
      <a href="/" className='inline-block px-6 py-3 mt-6 font-medium text-white transition shadow-md 
        bg-primary rounded-2xl hover:bg-primary-dark'
      >
        Trở lại trang chủ
      </a>
    </div>
    </div>
  )
}

export default NotFoundPage