import React from 'react';
import './ContactUs.css';

/**
 * Replace the placeholder values below (email, phone, address, social
 * links) with the Corporation's real, verified details before deploying.
 */
const CONTACT = {
  email: 'csejnec.2@gmail.com',
  phone: '+91-XXXXXXXXXX',
  helpline: '1800-XXX-XXXX (toll-free)',
  address: 'Chh. Sambhajinagar, Maharashtra 431005',
};

const SOCIALS = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.4c0-.9.25-1.5 1.55-1.5H16.6V4.2C16.3 4.16 15.3 4.07 14.15 4.07c-2.4 0-4.05 1.47-4.05 4.16v2.34H7.5v3h2.6V21h3.4z" /></svg>
    ),
  },
  {
    name: 'X (Twitter)',
    href: 'https://x.com/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3l7.4 9.6L3.3 21h2.1l6.1-6.9L16.4 21H21l-7.7-9.9L20.7 3h-2.1l-5.8 6.6L8.6 3H3z" /></svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" /></svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 7.5s-.2-1.5-.9-2.1c-.8-.8-1.7-.8-2.1-.9C15.8 4.2 12 4.2 12 4.2s-3.8 0-6.5.3c-.4 0-1.3.1-2.1.9-.6.6-.9 2.1-.9 2.1S2.2 9.3 2.2 11v2c0 1.7.3 3.5.3 3.5s.2 1.5.9 2.1c.8.8 1.9.7 2.3.8 1.7.2 7.3.3 7.3.3s3.8 0 6.5-.3c.4 0 1.3-.1 2.1-.9.6-.6.9-2.1.9-2.1s.3-1.8.3-3.5v-2c0-1.7-.3-3.5-.3-3.5zM9.9 14.6V8.9l5.6 2.9-5.6 2.8z" /></svg>
    ),
  },
];

export default function ContactUs() {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-heading">
      <div className="container">
        <div className="contact-card">
          <div className="contact-main">
            <h2 id="contact-heading">Contact us</h2>
            <p>Reach the Smart City helpdesk for anything the portal can&rsquo;t resolve.</p>

            <dl className="contact-list">
              <div className="contact-row">
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                </dd>
              </div>
              <div className="contact-row">
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`}>{CONTACT.phone}</a>
                  <span className="contact-note"> &middot; Helpline: {CONTACT.helpline}</span>
                </dd>
              </div>
              <div className="contact-row">
                <dt>Address</dt>
                <dd>{CONTACT.address}</dd>
              </div>
            </dl>
          </div>

          <div className="contact-social">
            <span className="contact-social-label">Follow us</span>
            <ul>
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name}
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
