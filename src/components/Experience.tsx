import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../hooks/useInView';
import { useCVData } from '../context/CVDataContext';
import './Experience.css';

const Experience: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.2 });
  const { cvData } = useCVData();
  const experiences = cvData.experiences;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="experience" className="experience section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="section-number">02.</span>
          <h2 className="section-title">Experience</h2>
          <div className="section-line"></div>
        </motion.div>

        <motion.div
          className="experience-content"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="experience-tabs">
            {experiences.map((exp, index) => (
              <button
                key={`${exp.company}-${exp.position}`}
                className={`tab-button ${activeIndex === index ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                {exp.position}
              </button>
            ))}
            <div
              className="tab-indicator"
              style={{ transform: `translateY(${activeIndex * 100}%)` }}
            />
          </div>

          <div className="experience-details">
            <h3 className="exp-position">
              {experiences[activeIndex].position}
              <span className="exp-company"> @ {experiences[activeIndex].company}</span>
            </h3>
            <p className="exp-period">{experiences[activeIndex].period}</p>
            
            <ul className="exp-description">
              {experiences[activeIndex].description.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <div className="exp-technologies">
              {experiences[activeIndex].technologies.map((tech, index) => (
                <span key={index} className="tech-tag">{tech}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Experience;
