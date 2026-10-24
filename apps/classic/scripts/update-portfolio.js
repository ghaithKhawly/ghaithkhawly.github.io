const fs = require('fs');
const path = require('path');

/**
 * Update Portfolio Components from CV Data
 * Usage: node scripts/update-portfolio.js [cv-file-path]
 * 
 * This script:
 * 1. Parses the CV file
 * 2. Generates component data
 * 3. Updates the React components with new data
 */

// Import the parser
const CVParser = require('./cv-parser-lib');

function generateExperienceCode(experiences) {
  const items = experiences.map(exp => {
    const descArray = exp.description.map(d => `      '${d.replace(/'/g, "\\'")}',`).join('\n');
    const techArray = exp.technologies.map(t => `'${t}'`).join(', ');
    
    return `  {
    company: '${exp.company}',
    position: '${exp.position}',
    period: '${exp.period}',
    description: [
${descArray}
    ],
    technologies: [${techArray}],
  }`;
  }).join(',\n');

  return `const experiences: ExperienceItem[] = [
${items},
];`;
}

function generateProjectsCode(projects) {
  const items = projects.map(proj => {
    const techArray = proj.technologies.map(t => `'${t}'`).join(', ');
    
    return `  {
    title: '${proj.title.replace(/'/g, "\\'")}',
    description:
      '${proj.description.replace(/'/g, "\\'")}',
    technologies: [${techArray}],
    github: 'https://github.com/ghaithKhawly',
    featured: true,
  }`;
  }).join(',\n');

  return `const projects: Project[] = [
${items},
];`;
}

function generateSkillsCode(skillCategories) {
  const items = skillCategories.map(cat => {
    const skillsArray = cat.skills.map(s => `'${s.replace(/'/g, "\\'")}'`).join(', ');
    
    return `  {
    title: '${cat.title}',
    skills: [${skillsArray}],
  }`;
  }).join(',\n');

  return `const skillCategories: SkillCategory[] = [
${items},
];`;
}

function updateFile(filePath, searchPattern, replacement) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const regex = new RegExp(searchPattern, 's');
  
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

function main() {
  const args = process.argv.slice(2);
  const cvPath = args[0] || 'cv-fulltime.tex';
  
  const fullPath = path.resolve(process.cwd(), cvPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: CV file not found at ${fullPath}`);
    process.exit(1);
  }

  console.log(`\n🔄 Updating portfolio from: ${cvPath}\n`);
  
  // Parse CV
  const content = fs.readFileSync(fullPath, 'utf-8');
  const parser = new CVParser(content);
  const rawData = parser.parse();
  const componentData = parser.generateComponentData(rawData, cvPath);

  // Save JSON data
  const dataPath = path.join(process.cwd(), 'src', 'data', 'cv-data.json');
  const dataDir = path.dirname(dataPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dataPath, JSON.stringify(componentData, null, 2));
  console.log('✅ Updated: src/data/cv-data.json');

  // Update Hero links
  const heroPath = path.join(process.cwd(), 'src', 'components', 'Hero.tsx');
  if (fs.existsSync(heroPath)) {
    let heroContent = fs.readFileSync(heroPath, 'utf-8');
    
    // Update GitHub link
    heroContent = heroContent.replace(
      /href="https:\/\/github\.com\/[^"]*"/g,
      `href="${componentData.hero.github}"`
    );
    
    // Update LinkedIn link
    heroContent = heroContent.replace(
      /href="https:\/\/linkedin\.com\/in\/[^"]*"/g,
      `href="${componentData.hero.linkedin}"`
    );
    
    // Update email
    heroContent = heroContent.replace(
      /href="mailto:[^"]*"/g,
      `href="mailto:${componentData.hero.email}"`
    );
    
    fs.writeFileSync(heroPath, heroContent);
    console.log('✅ Updated: Hero.tsx (social links)');
  }

  // Update Contact links
  const contactPath = path.join(process.cwd(), 'src', 'components', 'Contact.tsx');
  if (fs.existsSync(contactPath)) {
    let contactContent = fs.readFileSync(contactPath, 'utf-8');
    
    contactContent = contactContent.replace(
      /href="https:\/\/github\.com\/[^"]*"/g,
      `href="${componentData.hero.github}"`
    );
    contactContent = contactContent.replace(
      /href="https:\/\/linkedin\.com\/in\/[^"]*"/g,
      `href="${componentData.hero.linkedin}"`
    );
    contactContent = contactContent.replace(
      /href="mailto:[^"]*"/g,
      `href="mailto:${componentData.hero.email}"`
    );
    
    fs.writeFileSync(contactPath, contactContent);
    console.log('✅ Updated: Contact.tsx (links)');
  }

  // Update Footer links
  const footerPath = path.join(process.cwd(), 'src', 'components', 'Footer.tsx');
  if (fs.existsSync(footerPath)) {
    let footerContent = fs.readFileSync(footerPath, 'utf-8');
    
    footerContent = footerContent.replace(
      /href="https:\/\/github\.com\/[^"]*"/g,
      `href="${componentData.hero.github}"`
    );
    footerContent = footerContent.replace(
      /href="https:\/\/linkedin\.com\/in\/[^"]*"/g,
      `href="${componentData.hero.linkedin}"`
    );
    footerContent = footerContent.replace(
      /href="mailto:[^"]*"/g,
      `href="mailto:${componentData.hero.email}"`
    );
    
    fs.writeFileSync(footerPath, footerContent);
    console.log('✅ Updated: Footer.tsx (links)');
  }

  console.log('\n📊 Summary of parsed data:');
  console.log(`   • ${componentData.experiences.length} experience entries`);
  console.log(`   • ${componentData.skillCategories.length} skill categories`);
  console.log(`   • ${componentData.projects.length} projects`);
  console.log(`   • ${componentData.languages.length} languages`);
  
  console.log('\n✨ Portfolio updated successfully!');
  console.log('   Refresh your browser to see changes.\n');
}

main();
