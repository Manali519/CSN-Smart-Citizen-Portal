import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-band" aria-hidden="true" />
      <div className="container footer-inner">
        <p>&copy; {new Date().getFullYear()} Chh. Sambhajinagar Municipal Corporation. All rights reserved.</p>
        <nav aria-label="Footer">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Use</a>
          <a href="#accessibility">Accessibility</a>
        </nav>
      </div>
    </footer>
  );
}
