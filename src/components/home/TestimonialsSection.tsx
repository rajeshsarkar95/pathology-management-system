"use client";

import { useEffect, useState } from "react";

const testimonials = [
  {
    text: "Reports came within 12 hours, and the online portal is incredibly clean. I could share my thyroid report with my doctor in one click. Excellent experience.",
    name: "Rahul Sharma",
    role: "Software Engineer, Dehradun",
    initials: "RS",
    color: "#0A5EC0",
  },
  {
    text: "The home collection service is a lifesaver for elderly patients. The phlebotomist arrived on time and the results were perfect. Highly recommend LAL Pathology.",
    name: "Priya Gupta",
    role: "Homemaker, Rishikesh",
    initials: "PG",
    color: "#0D9488",
  },
  {
    text: "As a doctor, I recommend LAL Pathology to all my patients. Their reports are accurate, standardised, and the digital portal makes follow-up incredibly efficient.",
    name: "Dr. Manish Verma",
    role: "General Physician, AIIMS Rishikesh",
    initials: "DM",
    color: "#C8293A",
  },
  {
    text: "Booked at 9 PM, the collector arrived by 7 AM next morning. Report was ready by noon. The WhatsApp notification with the PDF link was super convenient.",
    name: "Sneha Rawat",
    role: "Teacher, Haridwar",
    initials: "SR",
    color: "#7C3AED",
  },
  {
    text: "Very professional staff and the reports were easy to read. The comparison with previous reports feature helped me track my health progress over time.",
    name: "Amit Negi",
    role: "Business Owner, Roorkee",
    initials: "AN",
    color: "#C07020",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActive((prev) => (prev + 1) % testimonials.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  const t = testimonials[active];

  return (
    <>
      <style>{`
        .tm-card {
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .tm-card.tm-out {
          opacity: 0;
          transform: translateY(12px);
        }
        .tm-card.tm-in {
          opacity: 1;
          transform: translateY(0);
        }
        .tm-dot {
          transition: width 0.4s ease, background 0.4s ease;
        }

      `}</style>

      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 mb-3">
              <span className="text-xs">★★★★★</span>
              <span className="text-xs font-medium tracking-widest uppercase">Patient stories</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 leading-snug">
              Trusted by thousands across the city
            </h2>
          </div>

          {/* Card */}
          <div
            className={`tm-card bg-white border border-slate-200 rounded-2xl p-8 shadow-sm ${
              visible ? "tm-in" : "tm-out"
            }`}
          >
            {/* Big quote mark */}
            <div
              className="text-6xl font-serif leading-none mb-3 select-none"
              style={{ color: t.color, opacity: 0.15 }}
            >
              &ldquo;
            </div>

            <p className="text-slate-600 text-base leading-relaxed mb-8">
              {t.text}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{
                    background: t.color,
                    boxShadow: `0 0 0 3px ${t.color}25`,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs">{t.role}</p>
                </div>
              </div>
              <div className="text-amber-400 text-sm tracking-wide">★★★★★</div>
            </div>
          </div>

          {/* Dots — display only, no click */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className="tm-dot h-1.5 rounded-full"
                style={{
                  width: i === active ? "24px" : "6px",
                  background: i === active ? t.color : "#cbd5e1",
                }}
              />
            ))}
          </div>

        </div>
      </section>
    </>
  );
}