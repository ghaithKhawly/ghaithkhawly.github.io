/**
 * CV Parser Library
 * Reusable parser for LaTeX CV files
 */

class CVParser {
  constructor(content, fileName = '') {
    this.content = content;
    this.fileName = fileName;
    this.data = {
      personal: {},
      experience: [],
      education: [],
      skills: {},
      projects: [],
      certifications: [],
      languages: [],
      services: [],
      whatIOffer: ''
    };
  }

  parse() {
    this.parsePersonalInfo();
    this.parseExperience();
    this.parseEducation();
    this.parseSkills();
    this.parseProjects();
    this.parseCertifications();
    this.parseLanguages();
    this.parseServices();
    this.parseWhatIOffer();
    return this.data;
  }

  parsePersonalInfo() {
    const nameMatch = this.content.match(/\\name\{([^}]*)\}\{([^}]*)\}/);
    if (nameMatch) {
      this.data.personal.firstName = nameMatch[1].trim();
      this.data.personal.lastName = nameMatch[2].trim();
      this.data.personal.fullName = `${nameMatch[1].trim()} ${nameMatch[2].trim()}`;
    }

    const titleMatch = this.content.match(/\\title\{([^}]*)\}/);
    if (titleMatch) this.data.personal.title = titleMatch[1].trim();

    const addressMatch = this.content.match(/\\address\{([^}]*)\}\{([^}]*)\}/);
    if (addressMatch) this.data.personal.location = addressMatch[1].trim();

    const phoneMatch = this.content.match(/\\phone\[mobile\]\{([^}]*)\}/);
    if (phoneMatch) this.data.personal.phone = phoneMatch[1].trim();

    const emailMatch = this.content.match(/\\email\{([^}]*)\}/);
    if (emailMatch) this.data.personal.email = emailMatch[1].trim();

    const linkedinMatch = this.content.match(/\\social\[linkedin\]\{([^}]*)\}/);
    if (linkedinMatch) this.data.personal.linkedin = linkedinMatch[1].trim();

    const githubMatch = this.content.match(/\\social\[github\]\{([^}]*)\}/);
    if (githubMatch) this.data.personal.github = githubMatch[1].trim();
  }

  parseExperience() {
    const expSection = this.extractSection('Experience');
    if (!expSection) return;

    const entryRegex = /\\cventry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{[^}]*\}\{([\s\S]*?)(?=\\cventry|\\section|$)/g;
    let match;

    while ((match = entryRegex.exec(expSection)) !== null) {
      const bullets = [];
      const itemRegex = /\\item\s+([^\n\\]+)/g;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(match[5])) !== null) {
        bullets.push(itemMatch[1].trim());
      }

      this.data.experience.push({
        period: match[1].trim(),
        position: match[2].trim(),
        company: match[3].trim(),
        location: match[4].trim(),
        description: bullets
      });
    }
  }

  parseEducation() {
    const eduSection = this.extractSection('Education');
    if (!eduSection) return;

    const entryRegex = /\\cventry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([\s\S]*?)(?=\\cventry|\\section|$)/g;
    let match;

    while ((match = entryRegex.exec(eduSection)) !== null) {
      this.data.education.push({
        period: match[1].trim(),
        degree: match[2].trim(),
        institution: match[3].trim(),
        location: match[4].trim(),
        gpa: match[5].trim().replace('GPA: ', ''),
        description: match[6].trim().replace(/\\begin\{itemize\}|\\end\{itemize\}|\\item/g, '').trim()
      });
    }
  }

  parseSkills() {
    const skillsSection = this.extractSection('Skills') || this.extractSection('Technical Skills');
    if (!skillsSection) return;

    const itemRegex = /\\cvitem\{([^}]*)\}\{([^}]*)\}/g;
    let match;

    while ((match = itemRegex.exec(skillsSection)) !== null) {
      const category = match[1].trim();
      const skills = match[2].trim().split(',').map(s => s.trim().replace(/\\#/g, '#'));
      this.data.skills[category] = skills;
    }
  }

  parseProjects() {
    let projectsSection = this.extractSection('Current Projects') || 
                          this.extractSection('Projects') || 
                          this.extractSection('Selected Projects');
    if (!projectsSection) return;

    const itemRegex = /\\cvitem\{([^}]*)\}\{([^}]*)\}/g;
    let match;

    while ((match = itemRegex.exec(projectsSection)) !== null) {
      this.data.projects.push({
        title: match[1].trim(),
        description: match[2].trim()
      });
    }
  }

  parseCertifications() {
    const certSection = this.extractSection('Certifications') || 
                        this.extractSection('Google Cloud Skill Badges');
    if (!certSection) return;

    const itemRegex = /\\cvitem\{([^}]*)\}\{([^}]*)\}/g;
    let match;

    while ((match = itemRegex.exec(certSection)) !== null) {
      this.data.certifications.push({
        provider: match[1].trim(),
        name: match[2].trim()
      });
    }
  }

  parseLanguages() {
    const langSection = this.extractSection('Languages');
    if (!langSection) return;

    const itemRegex = /\\cvitemwithcomment\{([^}]*)\}\{([^}]*)\}\{[^}]*\}/g;
    let match;

    while ((match = itemRegex.exec(langSection)) !== null) {
      this.data.languages.push({
        language: match[1].trim(),
        level: match[2].trim()
      });
    }
  }

  parseServices() {
    const servicesSection = this.extractSection('Services');
    if (!servicesSection) return;

    const itemRegex = /\\cvitem\{([^}]*)\}\{([^}]*)\}/g;
    let match;

    while ((match = itemRegex.exec(servicesSection)) !== null) {
      this.data.services.push({
        title: match[1].trim(),
        description: match[2].trim()
      });
    }
  }

  parseWhatIOffer() {
    const offerSection = this.extractSection('What I Offer');
    if (!offerSection) return;

    const itemRegex = /\\cvitem\{[^}]*\}\{([^}]*)\}/;
    const match = offerSection.match(itemRegex);
    if (match) {
      this.data.whatIOffer = match[1].trim();
    }
  }

  extractSection(sectionName) {
    const regex = new RegExp(`\\\\section\\{${sectionName}\\}([\\s\\S]*?)(?=\\\\section|\\\\end\\{document\\}|$)`, 'i');
    const match = this.content.match(regex);
    return match ? match[1] : null;
  }

  generateComponentData(rawData, fileName = '') {
    // Detect CV type based on content or filename
    const isFreelance = rawData.services.length > 0 || 
                        rawData.whatIOffer || 
                        fileName.toLowerCase().includes('freelance');
    
    return {
      cvType: isFreelance ? 'freelance' : 'fulltime',
      cvSource: fileName,
      hero: {
        name: rawData.personal.fullName,
        firstName: rawData.personal.firstName,
        lastName: rawData.personal.lastName,
        title: rawData.personal.title,
        location: rawData.personal.location,
        email: rawData.personal.email,
        github: `https://github.com/${rawData.personal.github}`,
        linkedin: `https://linkedin.com/in/${rawData.personal.linkedin}`,
        phone: rawData.personal.phone
      },
      whatIOffer: rawData.whatIOffer || '',
      services: rawData.services,
      experiences: rawData.experience.map(exp => ({
        company: exp.company,
        position: exp.position,
        period: exp.period.replace(/--/g, '-'),
        description: exp.description,
        technologies: this.extractTechnologies(exp.description.join(' '))
      })),
      skillCategories: Object.entries(rawData.skills).map(([title, skills]) => ({
        title,
        skills
      })),
      projects: rawData.projects.map(proj => ({
        title: proj.title,
        description: proj.description,
        technologies: this.extractTechnologies(proj.description),
        featured: true
      })),
      education: rawData.education[0] || null,
      languages: rawData.languages,
      certifications: rawData.certifications
    };
  }

  extractTechnologies(text) {
    const techKeywords = [
      'React', 'React.js', 'React Native', 'JavaScript', 'TypeScript', 'Node.js',
      'FastAPI', 'Python', 'PostgreSQL', 'MongoDB', 'C#', '.NET', 'DevExpress',
      'HTML', 'HTML5', 'CSS', 'CSS3', 'Git', 'GitHub', 'Azure', 'Docker',
      'REST', 'API', 'GraphQL', 'SQL', 'GCP', 'AWS', 'CI/CD'
    ];

    const found = [];
    techKeywords.forEach(tech => {
      if (text.toLowerCase().includes(tech.toLowerCase()) && !found.includes(tech)) {
        found.push(tech);
      }
    });
    return found;
  }
}

module.exports = CVParser;
