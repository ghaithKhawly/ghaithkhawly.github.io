import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, MapPin } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { useCVData } from '../context/CVDataContext';
import './Contact.css';

const Contact: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const { cvData, isFreelance } = useCVData();
  const { hero } = cvData;

  return (
    <section id="contact" className="contact section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header centered"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="section-number">05.</span>
          <h2 className="section-title">Get In Touch</h2>
        </motion.div>

        <motion.div
          className="contact-content"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="contact-description">
            {isFreelance 
              ? "I'm currently open to freelance opportunities and interesting projects. Whether you have a question, a project idea, or just want to say hello, I'd love to hear from you!"
              : "I'm currently looking for full-time opportunities where I can contribute and grow. Whether you have a position that might be a good fit, or just want to connect, I'd love to hear from you!"
            }
          </p>

          <div className="contact-info">
            <motion.div
              className="contact-item"
              whileHover={{ scale: 1.02 }}
            >
              <MapPin size={20} />
              <span>{hero.location}</span>
            </motion.div>
          </div>

          <div className="contact-links">
            <motion.a
              href={`mailto:${hero.email}`}
              className="contact-btn primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Mail size={20} />
              <span>Say Hello</span>
            </motion.a>

            <motion.a
              href={hero.github}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Github size={20} />
              <span>GitHub</span>
            </motion.a>

            <motion.a
              href={hero.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Linkedin size={20} />
              <span>LinkedIn</span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
