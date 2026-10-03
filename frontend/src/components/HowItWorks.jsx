import React from 'react';
import './HowItWorks.css';

const STEPS = [
  {
    n: '1',
    step: 'Step 01',
    title: 'Register or Log In',
    desc: 'Sign up with your mobile number, or log in if you already have an account.',
  },
  {
    n: '2',
    step: 'Step 02',
    title: 'Report or Request',
    desc: 'File a complaint, ask for a water tanker, or look up your ward’s utility schedule.',
  },
  {
    n: '3',
    step: 'Step 03',
    title: 'Track the Outcome',
    desc: 'Get an instant reference tracking number and follow progress.',
  },
  {
    n: '4',
    step: 'Step 04',
    title: 'Confirm Resolution',
    desc: 'The assigned officer submits proof of work, and you close the loop with your rating.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section how" aria-labelledby="how-heading">
      <div className="container">
        <div className="section-heading">
          <span className="how-tag">Simple 4 Step Process</span>
          <h2 id="how-heading">How It Works</h2>
          <p>Resolve civic issues and access municipal services in four simple steps.</p>
        </div>
        <ol className="how-steps">
          {STEPS.map((s) => (
            <li key={s.n} className="how-step">
              <div className="how-step-header">
                <span className="how-number" aria-hidden="true">{s.n}</span>
                <span className="how-step-badge">{s.step}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
