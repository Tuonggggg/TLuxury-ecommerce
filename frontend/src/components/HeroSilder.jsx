import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      id: 1,
      image: '/slide2.png',
      title: 'Bộ sưu tập Phòng Khách 2024',
      subtitle: 'Khám phá những thiết kế sofa, bàn ghế hiện đại và sang trọng',
      buttonText: 'Mua ngay',
      buttonLink: '/category/phong-khach',
      gradient: 'from-black/70 via-black/30 to-transparent'
    },
    {
      id: 2,
      image: '/slide6.jpg',
      title: 'Giảm giá đến 50%',
      subtitle: 'Ưu đãi đặc biệt cho nội thất phòng ngủ và phòng bếp',
      buttonText: 'Xem ưu đãi',
      buttonLink: '/flashsale',
      gradient: 'from-black/70 via-black/30 to-transparent'
    },
    {
      id: 3,
      image: '/slide5.jpg',
      title: 'Thiết kế Đẳng Cấp',
      subtitle: 'Nội thất cao cấp - Nâng tầm không gian sống của bạn',
      buttonText: 'Khám phá',
      buttonLink: '/category/thiet-ke',
      gradient: 'from-black/70 via-black/30 to-transparent'
    },
    {
      id: 4,
      image: '/slide4.png',
      title: 'Giải pháp Văn Phòng',
      subtitle: 'Bàn ghế văn phòng ergonomic - Hiệu quả làm việc tối ưu',
      buttonText: 'Xem ngay',
      buttonLink: '/category/van-phong',
      gradient: 'from-black/70 via-black/30 to-transparent'
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative w-full h-[400px] md:h-[550px] lg:h-[650px] mt-0 overflow-hidden shadow-lg group">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentSlide
                ? 'opacity-100 translate-x-0'
                : index < currentSlide
                  ? 'opacity-0 -translate-x-full'
                  : 'opacity-0 translate-x-full'
              }`}
          >
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-6 max-w-3xl">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold drop-shadow-lg mb-4 animate-fade-in-up">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-xl lg:text-2xl text-gray-200 mb-8 animate-fade-in-up animation-delay-200">
                  {slide.subtitle}
                </p>
                <a
                  href={slide.buttonLink}
                  className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-full font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all animate-fade-in-up animation-delay-400"
                >
                  {slide.buttonText}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={28} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 w-3 rounded-full transition-all ${index === currentSlide
                ? 'bg-white scale-125 shadow-lg'
                : 'bg-white/50 hover:bg-white/75'
              }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{
            width: isAutoPlaying ? '100%' : '0%',
            animation: isAutoPlaying ? 'progress 5s linear' : 'none'
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animation-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animation-delay-400 { animation-delay: 0.4s; opacity: 0; }
      `}</style>
    </div>
  );
};

export default HeroSlider;
