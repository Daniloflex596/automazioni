// Intro registica: schermo nero → il nome appare in grande (editoriale) → una linea si traccia →
// tutto sfuma e rivela il sito. È il "sipario" che i siti premium hanno sempre.
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Intro({ name }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: 'easeInOut' } }}
        >
          <motion.h1
            className="intro-name"
            initial={{ opacity: 0, y: 16, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.12em', transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } }}
          >
            {name}
          </motion.h1>
          <motion.div
            className="intro-line"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1, transition: { duration: 1.2, delay: 0.5, ease: 'easeInOut' } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
