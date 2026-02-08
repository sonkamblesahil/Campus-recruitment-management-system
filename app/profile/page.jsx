'use client';

import React, { useState } from 'react';

/* -------------------- UI HELPERS -------------------- */

const Section = ({ title, children, action }) => (
  <div className="space-y-4 max-w-4xl">
    <div className="flex justify-between items-center border-b pb-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const Row = ({ label, value, editable, onChange }) => (
  <div className="grid grid-cols-4 gap-4 text-sm items-center">
    <span className="text-gray-600">{label}</span>
    {editable ? (
      <input
        className="col-span-3 border rounded px-3 py-1.5"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    ) : (
      <span className="col-span-3">{value || '-'}</span>
    )}
  </div>
);

const Block = ({ children, onRemove, editable }) => (
  <div className="border rounded p-4 space-y-2 relative">
    {editable && (
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-xs text-red-500"
      >
        Remove
      </button>
    )}
    {children}
  </div>
);

/* -------------------- MAIN -------------------- */

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [edit, setEdit] = useState(false);

  const [data, setData] = useState({
    basic: {
      name: 'John Doe',
      email: 'john@email.com',
      phone: '+91 9876543210',
      address: 'Mumbai, India',
    },

    academic: {
      college: 'IIT Bombay',
      department: 'Computer Science',
      cgpa: '8.9',
      batch: '2021–2025',
    },

    education: [
      {
        degree: 'B.Tech',
        institute: 'IIT Bombay',
        duration: '2021–2025',
        score: 'CGPA 8.9',
      },
    ],

    experience: [
      {
        role: 'Software Engineer Intern',
        org: 'Google',
        duration: 'May 2024 – Aug 2024',
        description: 'Worked on internal dashboards.',
      },
    ],

    projects: [
      {
        title: 'E-Commerce Platform',
        tech: 'React, Node.js',
        github: 'https://github.com/johndoe/ecommerce',
        live: '',
      },
    ],

    skills: ['React', 'Node.js', 'Python'],
  });

  /* -------------------- HELPERS -------------------- */

  const updateField = (section, field, value) => {
    setData(d => ({ ...d, [section]: { ...d[section], [field]: value } }));
  };

  const updateArrayItem = (section, i, field, value) => {
    const copy = [...data[section]];
    copy[i][field] = value;
    setData(d => ({ ...d, [section]: copy }));
  };

  const addArrayItem = (section, template) => {
    setData(d => ({ ...d, [section]: [...d[section], template] }));
  };

  const removeArrayItem = (section, i) => {
    setData(d => ({
      ...d,
      [section]: d[section].filter((_, idx) => idx !== i),
    }));
  };

  /* -------------------- TABS -------------------- */

  const tabs = [
    { id: 'basic', label: 'Basic Details' },
    { id: 'academic', label: 'Academic Details' },
    { id: 'education', label: 'Education Details' },
    { id: 'experience', label: 'Internship & Work Ex' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
  ];

  /* -------------------- CONTENT -------------------- */

  const content = {
    basic: (
      <Section title="Basic Details">
        <Row label="Name" value={data.basic.name} editable={edit}
          onChange={v => updateField('basic', 'name', v)} />
        <Row label="Email" value={data.basic.email} editable={edit}
          onChange={v => updateField('basic', 'email', v)} />
        <Row label="Phone" value={data.basic.phone} editable={edit}
          onChange={v => updateField('basic', 'phone', v)} />
        <Row label="Address" value={data.basic.address} editable={edit}
          onChange={v => updateField('basic', 'address', v)} />
      </Section>
    ),

    academic: (
      <Section title="Academic Details">
        <Row label="College" value={data.academic.college} editable={edit}
          onChange={v => updateField('academic', 'college', v)} />
        <Row label="Department" value={data.academic.department} editable={edit}
          onChange={v => updateField('academic', 'department', v)} />
        <Row label="Batch" value={data.academic.batch} editable={edit}
          onChange={v => updateField('academic', 'batch', v)} />
        <Row label="CGPA" value={data.academic.cgpa} editable={edit}
          onChange={v => updateField('academic', 'cgpa', v)} />
      </Section>
    ),

    education: (
      <Section
        title="Education Details"
        action={edit && (
          <button
            onClick={() =>
              addArrayItem('education', {
                degree: '',
                institute: '',
                duration: '',
                score: '',
              })
            }
            className="text-sm text-green-600"
          >
            + Add
          </button>
        )}
      >
        {data.education.map((e, i) => (
          <Block
            key={i}
            editable={edit}
            onRemove={() => removeArrayItem('education', i)}
          >
            <Row label="Degree" value={e.degree} editable={edit}
              onChange={v => updateArrayItem('education', i, 'degree', v)} />
            <Row label="Institute" value={e.institute} editable={edit}
              onChange={v => updateArrayItem('education', i, 'institute', v)} />
            <Row label="Duration" value={e.duration} editable={edit}
              onChange={v => updateArrayItem('education', i, 'duration', v)} />
            <Row label="Score" value={e.score} editable={edit}
              onChange={v => updateArrayItem('education', i, 'score', v)} />
          </Block>
        ))}
      </Section>
    ),

    experience: (
      <Section
        title="Internship & Work Experience"
        action={edit && (
          <button
            onClick={() =>
              addArrayItem('experience', {
                role: '',
                org: '',
                duration: '',
                description: '',
              })
            }
            className="text-sm text-green-600"
          >
            + Add
          </button>
        )}
      >
        {data.experience.map((e, i) => (
          <Block
            key={i}
            editable={edit}
            onRemove={() => removeArrayItem('experience', i)}
          >
            <Row label="Role" value={e.role} editable={edit}
              onChange={v => updateArrayItem('experience', i, 'role', v)} />
            <Row label="Organization" value={e.org} editable={edit}
              onChange={v => updateArrayItem('experience', i, 'org', v)} />
            <Row label="Duration" value={e.duration} editable={edit}
              onChange={v => updateArrayItem('experience', i, 'duration', v)} />
            <Row label="Description" value={e.description} editable={edit}
              onChange={v => updateArrayItem('experience', i, 'description', v)} />
          </Block>
        ))}
      </Section>
    ),

    projects: (
      <Section
        title="Projects"
        action={edit && (
          <button
            onClick={() =>
              addArrayItem('projects', {
                title: '',
                tech: '',
                github: '',
                live: '',
              })
            }
            className="text-sm text-green-600"
          >
            + Add
          </button>
        )}
      >
        {data.projects.map((p, i) => (
          <Block
            key={i}
            editable={edit}
            onRemove={() => removeArrayItem('projects', i)}
          >
            <Row label="Title" value={p.title} editable={edit}
              onChange={v => updateArrayItem('projects', i, 'title', v)} />
            <Row label="Tech" value={p.tech} editable={edit}
              onChange={v => updateArrayItem('projects', i, 'tech', v)} />
            <Row label="GitHub" value={p.github} editable={edit}
              onChange={v => updateArrayItem('projects', i, 'github', v)} />
            <Row label="Live Link" value={p.live} editable={edit}
              onChange={v => updateArrayItem('projects', i, 'live', v)} />
          </Block>
        ))}
      </Section>
    ),

    skills: (
      <Section
        title="Skills"
        action={edit && (
          <button
            onClick={() => setData(d => ({ ...d, skills: [...d.skills, ''] }))}
            className="text-sm text-green-600"
          >
            + Add
          </button>
        )}
      >
        {data.skills.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            {edit ? (
              <input
                className="border rounded px-3 py-1.5 text-sm flex-1"
                value={s}
                onChange={e => {
                  const copy = [...data.skills];
                  copy[i] = e.target.value;
                  setData(d => ({ ...d, skills: copy }));
                }}
              />
            ) : (
              <span className="text-sm">{s}</span>
            )}
            {edit && (
              <button
                onClick={() =>
                  setData(d => ({
                    ...d,
                    skills: d.skills.filter((_, idx) => idx !== i),
                  }))
                }
                className="text-xs text-red-500"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </Section>
    ),
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="bg-white rounded-xl h-[85vh] flex overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-72 border-r bg-gray-50 p-3 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full text-left px-4 py-3 text-sm rounded-lg ${
                activeTab === t.id
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </aside>

        {/* CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setEdit(!edit)}
              className="text-sm text-indigo-600"
            >
              {edit ? 'Save' : 'Edit'}
            </button>
          </div>
          {content[activeTab]}
        </main>

      </div>
    </div>
  );
}
