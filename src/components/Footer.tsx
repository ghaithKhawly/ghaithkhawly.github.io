import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { useCVData } from '../context/CVDataContext';
import './Footer.css';

const Footer: React.FC = () => {
  const { cvData } = useCVData();
  const { hero } = cvData;
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-social">
          <a href={hero.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github size={18} />
          </a>
          <a href={hero.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin size={18} />
          </a>
          <a href={`mailto:${hero.email}`} aria-label="Email">
            <Mail size={18} />
          </a>
        </div>
        
        <p className="footer-text">
          Designed & Built by <span className="accent">{hero.name}</span>
        </p>
        
        <p className="footer-copyright">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
