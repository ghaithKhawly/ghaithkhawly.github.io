import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { CVDataProvider } from './context/CVDataContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <CVDataProvider>
        <div className="app">
          <Navbar />
          <main>
            <Hero />
            <About />
            <Experience />
            <Projects />
            <Skills />
            <Contact />
          </main>
          <Footer />
        </div>
      </CVDataProvider>
    </ThemeProvider>
  );
};

export default App;
