import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import freelanceData from '../data/cv-data.json';
import fulltimeData from '../data/cv-fulltime.json';

// Types
export interface HeroData {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  phone: string;
}

export interface Service {
  title: string;
  description: string;
}

export interface Experience {
  company: string;
  position: string;
  period: string;
  description: string[];
  technologies: string[];
}

export interface SkillCategory {
  title: string;
  skills: string[];
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
  featured: boolean;
  github?: string;
  demo?: string;
}

export interface Education {
  period: string;
  degree: string;
  institution: string;
  location: string;
  gpa: string;
  description: string;
}

export interface Language {
  language: string;
  level: string;
}

export interface Certification {
  title: string;
  year: string;
}

export interface CVData {
  cvType: 'freelance' | 'fulltime';
  cvSource: string;
  hero: HeroData;
  about: string;
  whatIOffer?: string;
  services?: Service[];
  experiences: Experience[];
  skillCategories: SkillCategory[];
  projects: Project[];
  education: Education;
  languages: Language[];
  certifications: Certification[];
}

interface CVDataContextType {
  cvData: CVData;
  cvType: 'freelance' | 'fulltime';
  isFreelance: boolean;
  isFulltime: boolean;
}

const CVDataContext = createContext<CVDataContextType | undefined>(undefined);

function getCVTypeFromURL(): 'freelance' | 'fulltime' {
  if (typeof window === 'undefined') return 'freelance';
  
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type') || urlParams.get('cv');
  
  if (typeParam === 'fulltime' || typeParam === 'full-time' || typeParam === 'job') {
    return 'fulltime';
  }
  
  // Default to freelance
  return 'freelance';
}

interface CVDataProviderProps {
  children: ReactNode;
}

export const CVDataProvider: React.FC<CVDataProviderProps> = ({ children }) => {
  const cvType = useMemo(() => getCVTypeFromURL(), []);
  
  const cvData = useMemo(() => {
    return cvType === 'fulltime' 
      ? (fulltimeData as CVData)
      : (freelanceData as CVData);
  }, [cvType]);

  const value = useMemo(() => ({
    cvData,
    cvType,
    isFreelance: cvType === 'freelance',
    isFulltime: cvType === 'fulltime',
  }), [cvData, cvType]);

  return (
    <CVDataContext.Provider value={value}>
      {children}
    </CVDataContext.Provider>
  );
};

export const useCVData = (): CVDataContextType => {
  const context = useContext(CVDataContext);
  if (!context) {
    throw new Error('useCVData must be used within a CVDataProvider');
  }
  return context;
};

export default CVDataContext;
