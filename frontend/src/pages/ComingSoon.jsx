import React from 'react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';

export default function ComingSoon({ title }) {
  return (
    <section className="section coming-soon">
      <div className="container coming-soon-inner">
        <span className="coming-soon-tag">Coming soon</span>
        <h1>{title}</h1>
        <p>
          This page is planned for a later step of the build. For now, head back
          to the homepage to see what&rsquo;s live.
        </p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </section>
  );
}
