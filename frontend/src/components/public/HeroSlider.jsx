import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  { id: 1, src: '/images/public/aarohan-hero-01.png', alt: 'Aarohan Hero 1' },
  { id: 2, src: '/images/public/aarohan-hero-02.jpg', alt: 'Aarohan Hero 2' },
  { id: 3, src: '/images/public/aarohan-hero-03.jpg', alt: 'Aarohan Hero 3' },
  { id: 4, src: '/images/public/aarohan-hero-04.png', alt: 'Aarohan Hero 4' },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="hero-slider-container">
      {slides.map((slide, index) => (
        <div key={slide.id} className={`hero-slide ${index === currentSlide ? 'active' : ''}`}>
          <img src={slide.src} alt={slide.alt} />
        </div>
      ))}
      
      <div className="hero-overlay">
        <h1 className="hero-title">AAROHAN</h1>
        <h2 className="hero-subtitle">Supporting Wellbeing. Strengthening Recovery.</h2>
        <p className="hero-desc">
          An AI-assisted mental health monitoring and support layer designed to help identify concerning wellbeing indicators early and connect people with appropriate human support.
        </p>
        <div className="hero-actions">
          <Link to="/login" className="btn-primary">LOGIN</Link>
          <a href="#about" className="btn-secondary">EXPLORE AAROHAN</a>
        </div>
      </div>

      <button className="slider-btn slider-prev" onClick={prevSlide} aria-label="Previous Slide">&#10094;</button>
      <button className="slider-btn slider-next" onClick={nextSlide} aria-label="Next Slide">&#10095;</button>

      <div className="slider-controls">
        {slides.map((_, index) => (
          <button 
            key={index} 
            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
