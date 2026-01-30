import { motion } from 'framer-motion';
import { useApp, useInView } from '../context/AppContext';

const About = () => {
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const { cvData } = useApp();
  const { hero, education, skillCategories } = cvData;

  const techSkills = skillCategories
    .filter(cat => ['Frontend', 'Backend'].includes(cat.title))
    .flatMap(cat => cat.skills)
    .slice(0, 6);

  return (
    <section id="about" className="about section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="section-number">01.</span>
          <h2 className="section-title">About Me</h2>
          <div className="section-line"></div>
        </motion.div>

        <div className="about-content">
          <motion.div
            className="about-text"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p>
              I'm a {hero.title} currently studying {education?.degree || 'Computer Science'} at {education?.institution || 'university'} in {hero.location}. I specialize in building 
              web and mobile applications using modern technologies like React, React Native, 
              and Node.js.
            </p>
            <p>
              {cvData.about}
            </p>

            <div className="about-tech">
              <p>Technologies I work with:</p>
              <ul className="tech-list">
                {techSkills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            className="about-image"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="image-wrapper">
              <div className="image-placeholder">
                <span>{hero.firstName?.[0]}{hero.lastName?.[0]}</span>
              </div>
              <div className="image-border"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
