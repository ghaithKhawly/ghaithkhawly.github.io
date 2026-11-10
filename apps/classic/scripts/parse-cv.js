const fs = require('fs');
const path = require('path');

/**
 * CV Parser - Extracts data from LaTeX CV files
 * Usage: node scripts/parse-cv.js [cv-file-path]
 */

class CVParser {
  constructor(content) {
    this.content = content;
    this.data = {
      personal: {},
      experience: [],
      education: [],
      skills: {},
      projects: [],
      certifications: [],
      languages: []
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
    return this.data;
  }

  parsePersonalInfo() {
    // Parse name
    const nameMatch = this.content.match(/\\name\{([^}]*)\}\{([^}]*)\}/);
    if (nameMatch) {
      this.data.personal.firstName = nameMatch[1].trim();
      this.data.personal.lastName = nameMatch[2].trim();
      this.data.personal.fullName = `${nameMatch[1].trim()} ${nameMatch[2].trim()}`;
    }

    // Parse title
    const titleMatch = this.content.match(/\\title\{([^}]*)\}/);
    if (titleMatch) {
      this.data.personal.title = titleMatch[1].trim();
    }

    // Parse address
    const addressMatch = this.content.match(/\\address\{([^}]*)\}\{([^}]*)\}/);
    if (addressMatch) {
      this.data.personal.location = addressMatch[1].trim();
    }

    // Parse phone
    const phoneMatch = this.content.match(/\\phone\[mobile\]\{([^}]*)\}/);
    if (phoneMatch) {
      this.data.personal.phone = phoneMatch[1].trim();
    }

    // Parse email
    const emailMatch = this.content.match(/\\email\{([^}]*)\}/);
    if (emailMatch) {
      this.data.personal.email = emailMatch[1].trim();
    }

    // Parse LinkedIn
    const linkedinMatch = this.content.match(/\\social\[linkedin\]\{([^}]*)\}/);
    if (linkedinMatch) {
      this.data.personal.linkedin = linkedinMatch[1].trim();
    }

    // Parse GitHub
    const githubMatch = this.content.match(/\\social\[github\]\{([^}]*)\}/);
    if (githubMatch) {
      this.data.personal.github = githubMatch[1].trim();
    }
  }

  parseExperience() {
    const expSection = this.extractSection('Experience');
    if (!expSection) return;

    // Match cventry patterns
    const entryRegex = /\\cventry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{[^}]*\}\{([\s\S]*?)(?=\\cventry|\\section|$)/g;
    let match;

    while ((match = entryRegex.exec(expSection)) !== null) {
      const period = match[1].trim();
      const position = match[2].trim();
      const company = match[3].trim();
      const location = match[4].trim();
      const descriptionBlock = match[5];

      // Extract bullet points
      const bullets = [];
      const itemRegex = /\\item\s+([^\n\\]+)/g;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(descriptionBlock)) !== null) {
        bullets.push(itemMatch[1].trim());
      }

      this.data.experience.push({
        period,
        position,
        company,
        location,
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
    const skillsSection = this.extractSection('Skills');
    if (!skillsSection) return;

    const itemRegex = /\\cvitem\{([^}]*)\}\{([^}]*)\}/g;
    let match;

    while ((match = itemRegex.exec(skillsSection)) !== null) {
      const category = match[1].trim();
      const skillsStr = match[2].trim();
      // Split by comma and clean up
      const skills = skillsStr.split(',').map(s => s.trim().replace(/\\#/g, '#'));
      this.data.skills[category] = skills;
    }
  }

  parseProjects() {
    // Try "Current Projects" or "Projects" section
    let projectsSection = this.extractSection('Current Projects') || this.extractSection('Projects') || this.extractSection('Selected Projects');
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
    const certSection = this.extractSection('Certifications') || this.extractSection('Google Cloud Skill Badges');
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

  extractSection(sectionName) {
    const regex = new RegExp(`\\\\section\\{${sectionName}\\}([\\s\\S]*?)(?=\\\\section|\\\\end\\{document\\}|$)`, 'i');
    const match = this.content.match(regex);
    return match ? match[1] : null;
  }
}

// Generate React component data
function generateComponentData(cvData) {
  const output = {
    // For Hero component
    hero: {
      name: cvData.personal.fullName,
      title: cvData.personal.title,
      location: cvData.personal.location,
      email: cvData.personal.email,
      github: `https://github.com/${cvData.personal.github}`,
      linkedin: `https://linkedin.com/in/${cvData.personal.linkedin}`
    },

    // For Experience component
    experiences: cvData.experience.map(exp => ({
      company: exp.company,
      position: exp.position,
      period: exp.period,
      description: exp.description,
      technologies: extractTechnologies(exp.description.join(' '))
    })),

    // For Skills component
    skillCategories: Object.entries(cvData.skills).map(([title, skills]) => ({
      title,
      skills
    })),

    // For Projects component
    projects: cvData.projects.map(proj => ({
      title: proj.title,
      description: proj.description,
      technologies: extractTechnologies(proj.description),
      featured: true
    })),

    // For Education (About section)
    education: cvData.education[0] || null,

    // Languages
    languages: cvData.languages
  };

  return output;
}

// Helper to extract technology keywords
function extractTechnologies(text) {
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

// Main execution
function main() {
  const args = process.argv.slice(2);
  const cvPath = args[0] || 'cv-fulltime.tex';
  
  const fullPath = path.resolve(process.cwd(), cvPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: CV file not found at ${fullPath}`);
    console.log('\nUsage: node scripts/parse-cv.js [cv-file-path]');
    console.log('Example: node scripts/parse-cv.js cv-fulltime.tex');
    process.exit(1);
  }

  console.log(`\n📄 Parsing CV: ${cvPath}\n`);
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const parser = new CVParser(content);
  const rawData = parser.parse();
  const componentData = generateComponentData(rawData);

  // Output results
  console.log('━'.repeat(50));
  console.log('📋 PARSED CV DATA');
  console.log('━'.repeat(50));

  console.log('\n👤 Personal Info:');
  console.log(`   Name: ${rawData.personal.fullName}`);
  console.log(`   Title: ${rawData.personal.title}`);
  console.log(`   Location: ${rawData.personal.location}`);
  console.log(`   Email: ${rawData.personal.email}`);
  console.log(`   GitHub: ${rawData.personal.github}`);
  console.log(`   LinkedIn: ${rawData.personal.linkedin}`);

  console.log('\n💼 Experience:');
  rawData.experience.forEach((exp, i) => {
    console.log(`   ${i + 1}. ${exp.position} @ ${exp.company} (${exp.period})`);
  });

  console.log('\n🎓 Education:');
  rawData.education.forEach(edu => {
    console.log(`   ${edu.degree} - ${edu.institution} (${edu.period})`);
    if (edu.gpa) console.log(`   GPA: ${edu.gpa}`);
  });

  console.log('\n🛠️  Skills:');
  Object.entries(rawData.skills).forEach(([cat, skills]) => {
    console.log(`   ${cat}: ${skills.join(', ')}`);
  });

  console.log('\n📂 Projects:');
  rawData.projects.forEach(proj => {
    console.log(`   • ${proj.title}`);
  });

  console.log('\n🌍 Languages:');
  rawData.languages.forEach(lang => {
    console.log(`   ${lang.language}: ${lang.level}`);
  });

  // Save JSON output
  const outputPath = path.join(process.cwd(), 'src', 'data', 'cv-data.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(componentData, null, 2));
  console.log(`\n✅ Data saved to: src/data/cv-data.json`);
  console.log('\n💡 You can now import this data in your components:');
  console.log("   import cvData from '../data/cv-data.json';\n");
}

main();
