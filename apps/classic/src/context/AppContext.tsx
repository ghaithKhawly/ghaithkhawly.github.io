import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import freelanceData from '../data/cv-data.json';
import fulltimeData from '../data/cv-fulltime.json';

type Theme = 'dark' | 'light';

export interface CVData {
  cvType: 'freelance' | 'fulltime';
  cvSource: string;
  hero: {
    name: string;
    firstName: string;
    lastName: string;
    title: string;
    location: string;
    email: string;
    github: string;
    linkedin: string;
    phone: string;
  };
  about: string;
  whatIOffer?: string;
  services?: { title: string; description: string }[];
  experiences: {
    company: string;
    position: string;
    period: string;
    description: string[];
    technologies: string[];
  }[];
  skillCategories: { title: string; skills: string[] }[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
    featured: boolean;
    github?: string;
    demo?: string;
  }[];
  education: {
    period: string;
    degree: string;
    institution: string;
    location: string;
    gpa: string;
    description: string;
  };
  languages: { language: string; level: string }[];
  certifications: { title: string; year: string }[];
}

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  cvData: CVData;
  cvType: 'freelance' | 'fulltime';
  isFreelance: boolean;
  isFulltime: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getCVTypeFromURL(): 'freelance' | 'fulltime' {
  if (typeof window === 'undefined') return 'freelance';
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || params.get('cv');
  return type === 'fulltime' || type === 'full-time' || type === 'job' ? 'fulltime' : 'freelance';
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'dark';
  });

  const cvType = useMemo(() => getCVTypeFromURL(), []);
  const cvData = useMemo(() => (cvType === 'fulltime' ? fulltimeData : freelanceData) as CVData, [cvType]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const value = useMemo(() => ({
    theme,
    toggleTheme,
    cvData,
    cvType,
    isFreelance: cvType === 'freelance',
    isFulltime: cvType === 'fulltime',
  }), [theme, cvData, cvType]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const useInView = (options: { threshold?: number; rootMargin?: string } = {}) => {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return { ref, isInView };
};
