import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './DailyUpdates.css';

const WATER_SCHEDULE = [
  { zone: 'Zone A-1 (Town Hall)', areas: 'Town Hall, Makai Gate, Killa Arrak', time: '06:00 AM – 09:00 AM', status: 'Maintenance', pressure: 'Normal' },
{ zone: 'Zone B-5 (CIDCO N-6)', areas: 'N-6 Sector, Sambhaji Nagar, Avishkar Colony', time: '07:30 AM – 10:30 AM', status: 'On Schedule', pressure: 'High' },
{ zone: 'Zone C-3 (Central Naka)', areas: 'Central Naka, Jalna Road, Mondha', time: '09:00 AM – 12:00 PM', status: 'On Schedule', pressure: 'Normal' },
{ zone: 'Zone D-9 (Krantichowk)', areas: 'Krantichowk, Tilak Nagar, Nirala Bazar', time: '11:00 AM – 02:00 PM', status: 'Maintenance', pressure: 'Normal' },
{ zone: 'Zone E-6 (CIDCO N-6)', areas: 'N-6 Sectors B & C, CIDCO Shopping Center', time: '01:00 PM – 04:00 PM', status: 'On Schedule', pressure: 'Normal' },
{ zone: 'Zone F-7 (Jawahar Colony)', areas: 'Jawahar Colony, Shanoorwadi, Mahesh Nagar', time: '03:00 PM – 06:00 PM', status: 'On Schedule', pressure: 'Normal' },
{ zone: 'Zone G-2 (Mondha Naka)', areas: 'Mondha Naka, Sille Khana, Kranti Nagar', time: '04:30 PM – 07:30 PM', status: 'Maintenance', pressure: 'Low' },
{ zone: 'Zone H-4 (Saubhagya Mangalkaryalya)', areas: 'Saubhagya Mangalkaryalya Parisar, Shahnoor Miya Dargah Road', time: '06:00 PM – 09:00 PM', status: 'On Schedule', pressure: 'Normal' },
{ zone: 'Zone I-8 (Satara Parisar)', areas: 'Satara Parisar, Alok Nagar, Devendra Nagar', time: '07:30 PM – 10:30 PM', status: 'On Schedule', pressure: 'High' },
];
const ROAD_WORKS = [
  {
    title: 'Kranti Chowk to Baba Petrol Pump Road Resurfacing',
    ward: 'Ward 44 (Osmanpura)',
    type: 'Asphalt Layering & Pothole Patching',
    status: 'In Progress (70%)',
    traffic: 'Single lane open; slow movement expected during peak hours',
   
  },
  {
    title: 'Seven Hills to Cannaught Underground Drainage Pipe Installation',
    ward: 'Ward 23 (CIDCO N-3)',
    type: 'Stormwater Drainage Upgrade',
    status: 'In Progress (45%)',
    traffic: 'Diversion active via N-2 Internal Link Road',
    
  },
  {
    title: 'Jalna Road Smart LED Streetlight Pole Upgrades',
    ward: 'Ward 62 (Chikalthana)',
    type: 'Electrical Infrastructure',
    status: 'Night Shift Work (9 PM – 5 AM)',
    traffic: 'No daytime road blockage; night lane diversion',
    
  },
];

const POWER_SHUTDOWNS = [
  {
    feeder: 'CIDCO 33kV Substation',
    areas: 'N-4, N-5, Town Centre Shopping Complex',
    hours: '10:00 AM – 01:00 PM',
    reason: 'Preventive monsoon tree branch trimming & transformer check',
  },
  {
    feeder: 'Railway Station 11kV Feeder',
    areas: 'Padampura, Railway Colony, Bansilal Nagar',
    hours: '02:00 PM – 05:00 PM',
    reason: 'Underground cable splicing and feeder maintenance',
  },
];

export default function DailyUpdates() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    ['water', 'roads', 'power'].includes(initialTab) ? initialTab : 'water'
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (['water', 'roads', 'power'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="updates-page">
      {/* Hero header */}
      <section className="updates-hero">
        <div className="container">
          <span className="updates-badge">Live Civic Bulletin</span>
          <h1>Daily City Updates &amp; Schedules</h1>
          <p className="updates-date">
            📅 Showing published schedule for <strong>{today}</strong>
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="container updates-container">
        {/* Navigation Tabs */}
        <div className="updates-tabs">
          <button
            type="button"
            className={`updates-tab ${activeTab === 'water' ? 'active' : ''}`}
            onClick={() => setActiveTab('water')}
          >
            💧 Water Supply Timings
          </button>
          <button
            type="button"
            className={`updates-tab ${activeTab === 'roads' ? 'active' : ''}`}
            onClick={() => setActiveTab('roads')}
          >
            🚧 Ongoing Road Works
          </button>
          <button
            type="button"
            className={`updates-tab ${activeTab === 'power' ? 'active' : ''}`}
            onClick={() => setActiveTab('power')}
          >
            ⚡ Electricity Maintenance
          </button>
        </div>

        {/* Tab 1: Water Supply */}
        {activeTab === 'water' && (
          <section className="updates-section">
            <div className="updates-section-header">
              <h2>Area Wise Water Supply Timings</h2>
              <p>Daily ward distribution schedule from Jayakwadi / Harsul filtration plants.</p>
            </div>

            <div className="updates-table-wrapper">
              <table className="updates-table">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Key Areas Covered</th>
                    <th>Supply Window</th>
                    <th>Pressure</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {WATER_SCHEDULE.map((row, idx) => (
                    <tr key={idx}>
                      <td><strong>{row.zone}</strong></td>
                      <td>{row.areas}</td>
                      <td className="updates-time-cell">{row.time}</td>
                      <td>{row.pressure}</td>
                      <td>
                        <span
                          className={`updates-status-tag ${
                            row.status === 'On Schedule' ? 'tag--ok' : 'tag--warn'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="updates-note-card">
              <span>ℹ️</span>
              <p>
                In case of pipeline breakdown or urgent tanker requirement, dial the 24/7 Water Supply Helpline at <strong>0240-2333444</strong> or book via the Water Request service.
              </p>
            </div>
          </section>
        )}

        {/* Tab 2: Road Works */}
        {activeTab === 'roads' && (
          <section className="updates-section">
            <div className="updates-section-header">
              <h2>Ongoing Road &amp; Infrastructure Projects</h2>
              <p>Active repair zones, pothole filling drives, and traffic advisories.</p>
            </div>

            <div className="updates-cards-grid">
              {ROAD_WORKS.map((work, idx) => (
                <div className="updates-card" key={idx}>
                  <div className="updates-card-top">
                    <span className="updates-card-ward">{work.ward}</span>
                    <span className="updates-status-tag tag--progress">{work.status}</span>
                  </div>
                  <h3 className="updates-card-title">{work.title}</h3>
                  <div className="updates-card-detail">
                    <strong>Type:</strong> {work.type}
                  </div>
                  <div className="updates-card-detail">
                    <strong>Traffic Advisory:</strong> {work.traffic}
                  </div>
                 
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 3: Power Shutdowns */}
        {activeTab === 'power' && (
          <section className="updates-section">
            <div className="updates-section-header">
              <h2>Scheduled Electricity Maintenance</h2>
              <p>MSEDCL &amp; CSMC coordinated maintenance schedules for feeder reliability.</p>
            </div>

            <div className="updates-cards-grid">
              {POWER_SHUTDOWNS.map((item, idx) => (
                <div className="updates-card" key={idx}>
                  <div className="updates-card-top">
                    <span className="updates-card-ward">{item.feeder}</span>
                    <span className="updates-status-tag tag--warn">Scheduled</span>
                  </div>
                  <h3 className="updates-card-title">{item.areas}</h3>
                  <div className="updates-card-detail">
                    <strong>Hours:</strong> {item.hours}
                  </div>
                  <div className="updates-card-detail">
                    <strong>Reason:</strong> {item.reason}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
