import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CityTransportation.css';

const BUS_ROUTES = [
  { no: '101', route: 'Railway Station ↔ CIDCO Bus Stand (N-1)', first: '06:00 AM', last: '10:30 PM', freq: '10 mins', fare: '₹15', stops: 'Kranti Chowk, Seven Hills, Cannaught Place, N-1' },
  { no: '102', route: 'Central Bus Stand (CBS) ↔ Waluj MIDC', first: '05:45 AM', last: '11:00 PM', freq: '15 mins', fare: '₹25', stops: 'Baba Petrol Pump, Cantonment, Waluj Industrial Mor' },
  { no: '103', route: 'CBS ↔ Chikalthana Airport / MIDC', first: '06:15 AM', last: '10:00 PM', freq: '20 mins', fare: '₹20', stops: 'Mondha Naka, Akashwani, Jalna Road, Airport' },
  { no: '104', route: 'Railway Station ↔ Begumpura / University', first: '07:00 AM', last: '09:30 PM', freq: '25 mins', fare: '₹15', stops: 'Bhadkal Gate, Panchakki, Dr. BAMU University' },
  { no: '105', route: 'CIDCO Bus Stand ↔ Harsul T-Point', first: '06:30 AM', last: '09:45 PM', freq: '20 mins', fare: '₹20', stops: 'Jalgaon Road, Delhi Gate, Harsul Lake Chowk' },
];

const TRAIN_SCHEDULE = [
  { no: '20706/05', name: 'Vande Bharat Express', fromTo: 'CSN ↔ Mumbai CSMT', dep: '05:35 AM', arr: '11:55 AM', days: 'Daily (ex. Wed)', stops: 'Jalna, Manmad, Nashik Road, Thane, CSMT' },
  { no: '12072/71', name: 'Jan Shatabdi Express', fromTo: 'Jalna / CSN ↔ Mumbai CSMT', dep: '06:00 AM', arr: '12:30 PM', days: 'Daily', stops: 'Aurangabad, Manmad, Nasik, Kalyan, Dadar' },
  { no: '17058/57', name: 'Devagiri Express', fromTo: 'CSN ↔ Secunderabad / Mumbai', dep: '11:25 PM', arr: '07:10 AM', days: 'Daily', stops: 'Jalna, Parbhani, Nanded, Nizamabad, Secunderabad' },
  { no: '12716/15', name: 'Sachkhand Express', fromTo: 'CSN ↔ New Delhi / Amritsar', dep: '09:40 AM', arr: '07:45 AM (Next)', days: 'Daily', stops: 'Bhopal, Jhansi, Gwalior, Agra Cantt, New Delhi' },
  { no: '11402/01', name: 'Nandigram Express', fromTo: 'CSN ↔ Nagpur / Mumbai', dep: '09:35 PM', arr: '05:40 AM (Next)', days: 'Daily', stops: 'Rotegaon, Lasur, Manmad, Igatpuri, CSMT' },
];

const FLIGHT_SCHEDULE = [
  { no: 'AI-442', airline: 'Air India', dest: 'New Delhi (DEL)', dep: '08:35 AM', arr: '10:45 AM', days: 'Daily', type: 'Non-stop' },
  { no: '6E-5321', airline: 'IndiGo', dest: 'Mumbai (BOM)', dep: '09:50 AM', arr: '10:55 AM', days: 'Daily', type: 'Non-stop' },
  { no: '6E-7112', airline: 'IndiGo', dest: 'Hyderabad (HYD)', dep: '01:20 PM', arr: '02:35 PM', days: 'Mon, Wed, Fri, Sun', type: 'Non-stop' },
  { no: '6E-684', airline: 'IndiGo', dest: 'Bengaluru (BLR)', dep: '04:45 PM', arr: '06:25 PM', days: 'Daily', type: 'Non-stop' },
  { no: 'AI-444', airline: 'Air India', dest: 'Mumbai (BOM)', dep: '07:15 PM', arr: '08:20 PM', days: 'Daily', type: 'Non-stop' },
];



export default function CityTransportation() {
  const [activeTab, setActiveTab] = useState('bus');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="transport-page">
      {/* Hero Header */}
      <section className="transport-hero">
        <div className="container">
          <div className="transport-breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/know-your-city">Know Your City</Link>
            <span>/</span>
            <span>Transportation</span>
          </div>
          <span className="transport-tag">City Mobility &amp; Transit</span>
          <h1>City Transportation &amp; Schedules</h1>
          <p className="transport-subtitle">
            Comprehensive transit timetables for Smart City Buses, Express Trains, Domestic Flights, and Zone-Wise Auto-Rickshaw stands.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container transport-container">
        {/* Navigation Tabs */}
        <div className="transport-tabs">
          <button
            type="button"
            className={`transport-tab ${activeTab === 'bus' ? 'active' : ''}`}
            onClick={() => setActiveTab('bus')}
          >
            🚌 Smart City Bus
          </button>
          <button
            type="button"
            className={`transport-tab ${activeTab === 'trains' ? 'active' : ''}`}
            onClick={() => setActiveTab('trains')}
          >
            🚆 Railways
          </button>
          <button
            type="button"
            className={`transport-tab ${activeTab === 'flights' ? 'active' : ''}`}
            onClick={() => setActiveTab('flights')}
          >
            ✈️ Flights (IXU Airport)
          </button>
          
        </div>

        {/* 1. Smart City Bus */}
        {activeTab === 'bus' && (
          <section className="transport-section">
            <div className="transport-section-header">
              <h2>Smart City Bus Service Schedule</h2>
              <p>CSMC &amp; MSRTC operated electric and low-floor transit buses connecting key city corridors.</p>
            </div>
            <div className="transport-table-wrapper">
              <table className="transport-table">
                <thead>
                  <tr>
                    <th>Route No.</th>
                    <th>Route / Corridor</th>
                    <th>First Bus</th>
                    <th>Last Bus</th>
                    <th>Frequency</th>
                    <th>Fare</th>
                    <th>Major Stops</th>
                  </tr>
                </thead>
                <tbody>
                  {BUS_ROUTES.map((b) => (
                    <tr key={b.no}>
                      <td><span className="route-badge">Route {b.no}</span></td>
                      <td><strong>{b.route}</strong></td>
                      <td>{b.first}</td>
                      <td>{b.last}</td>
                      <td><span className="freq-badge">{b.freq}</span></td>
                      <td className="fare-badge">{b.fare}</td>
                      <td className="stops-cell">{b.stops}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 2. Trains */}
        {activeTab === 'trains' && (
          <section className="transport-section">
            <div className="transport-section-header">
              <h2>Major Train Timetable (Station Code: CSN)</h2>
              <p>Key superfast, express, and Vande Bharat trains connecting Chhatrapati Sambhajinagar across India.</p>
            </div>
            <div className="transport-table-wrapper">
              <table className="transport-table">
                <thead>
                  <tr>
                    <th>Train No.</th>
                    <th>Train Name</th>
                    <th>From ↔ To</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Operating Days</th>
                    <th>Key Halts</th>
                  </tr>
                </thead>
                <tbody>
                  {TRAIN_SCHEDULE.map((t) => (
                    <tr key={t.no}>
                      <td><span className="train-badge">{t.no}</span></td>
                      <td><strong>{t.name}</strong></td>
                      <td>{t.fromTo}</td>
                      <td className="time-highlight">{t.dep}</td>
                      <td>{t.arr}</td>
                      <td><span className="freq-badge">{t.days}</span></td>
                      <td className="stops-cell">{t.stops}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 3. Flights */}
        {activeTab === 'flights' && (
          <section className="transport-section">
            <div className="transport-section-header">
              <h2>Chikalthana Airport (IXU) Flight Timetable</h2>
              <p>Daily direct commercial flights connecting Chhatrapati Sambhajinagar with major metropolitan cities.</p>
            </div>
            <div className="transport-table-wrapper">
              <table className="transport-table">
                <thead>
                  <tr>
                    <th>Flight No.</th>
                    <th>Airline</th>
                    <th>Destination</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Operating Days</th>
                    <th>Service Type</th>
                  </tr>
                </thead>
                <tbody>
                  {FLIGHT_SCHEDULE.map((f) => (
                    <tr key={f.no}>
                      <td><span className="flight-badge">{f.no}</span></td>
                      <td><strong>{f.airline}</strong></td>
                      <td>{f.dest}</td>
                      <td className="time-highlight">{f.dep}</td>
                      <td>{f.arr}</td>
                      <td><span className="freq-badge">{f.days}</span></td>
                      <td><span className="type-badge">{f.type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

    
      </div>
    </div>
  );
}
