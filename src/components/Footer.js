import React from 'react';
import '../styles/Footer.css';

const Footer = ({ feedbackMessage }) => (
  <footer className="spotify-footer">
    {feedbackMessage}
  </footer>
);

export default Footer;
