import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Folder } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { useCVData } from '../context/CVDataContext';
import './Projects.css';

interface ProjectItem {
  title: string;
  description: string;
  technologies: string[];
  github?: string;
  demo?: string;
  featured: boolean;
  image?: string;
}

const Projects: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { cvData, isFulltime } = useCVData();

  // Map CV projects to component format
  const projects: ProjectItem[] = useMemo(() => 
    cvData.projects.map(p => ({
      ...p,
      github: cvData.hero.github,
      featured: true,
    })), [cvData.projects, cvData.hero.github]
  );

  const otherProjects: ProjectItem[] = useMemo(() => {
    const baseProjects: ProjectItem[] = [
      {
        title: 'Enterprise React Applications',
        description: 'Production React applications at Titan with DevExpress, API integrations, and CI/CD pipelines.',
        technologies: ['React.js', 'DevExpress', 'Azure DevOps'],
        github: cvData.hero.github,
        featured: false,
      },
    ];

    // Add certifications as a project for fulltime CV
    if (isFulltime && cvData.certifications && cvData.certifications.length > 0) {
      baseProjects.push({
        title: 'Google Cloud Skill Badges',
        description: `Completed ${cvData.certifications.length} Google Cloud skill badges covering digital transformation, AI, security, and cloud operations.`,
        technologies: ['GCP', 'Cloud Architecture', 'DevOps'],
        featured: false,
      });
    }

    return baseProjects;
  }, [cvData.hero.github, cvData.certifications, isFulltime]);

  return (
    <section id="projects" className="projects section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="section-number">03.</span>
          <h2 className="section-title">Projects</h2>
          <div className="section-line"></div>
        </motion.div>

        {/* Featured Projects */}
        <div className="featured-projects">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              className={`featured-project ${index % 2 === 1 ? 'reverse' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <div className="project-image">
                <div className="image-overlay"></div>
                <div className="project-placeholder">
                  <Folder size={48} />
                </div>
              </div>
              
              <div className="project-content">
                <p className="project-overline">Featured Project</p>
                <h3 className="project-title">{project.title}</h3>
                <div className="project-description">
                  <p>{project.description}</p>
                </div>
                <ul className="project-tech">
                  {project.technologies.map((tech, i) => (
                    <li key={i}>{tech}</li>
                  ))}
                </ul>
                <div className="project-links">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                      <Github size={20} />
                    </a>
                  )}
                  {project.demo && (
                    <a href={project.demo} target="_blank" rel="noopener noreferrer" aria-label="Demo">
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Other Projects */}
        <motion.div
          className="other-projects-section"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="other-projects-title">Other Noteworthy Projects</h3>
          
          <div className="other-projects-grid">
            {otherProjects.map((project, index) => (
              <motion.div
                key={project.title}
                className="project-card"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="card-header">
                  <Folder className="folder-icon" size={40} />
                  <div className="card-links">
                    {project.github && (
                      <a href={project.github} target="_blank" rel="noopener noreferrer">
                        <Github size={18} />
                      </a>
                    )}
                  </div>
                </div>
                <h4 className="card-title">{project.title}</h4>
                <p className="card-description">{project.description}</p>
                <ul className="card-tech">
                  {project.technologies.map((tech, i) => (
                    <li key={i}>{tech}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;
