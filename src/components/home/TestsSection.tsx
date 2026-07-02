"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";

const tests = [
  {
    icon: "🩸",
    name: "Complete blood count",
    desc: "Hemoglobin, WBC, platelets, RBC indices — essential health baseline.",
    count: "18 parameters",
    price: "₹299",
    accent: "#1E6FCC",
    bg: "rgba(30,111,204,0.1)",
    badgeBg: "rgba(30,111,204,0.12)",
    badgeColor: "#1E6FCC",
  },
  {
    icon: "🦋",
    name: "Thyroid profile",
    desc: "TSH, T3, T4 levels for comprehensive thyroid function assessment.",
    count: "6 parameters",
    price: "₹599",
    accent: "#0D9488",
    bg: "rgba(13,148,136,0.1)",
    badgeBg: "rgba(13,148,136,0.12)",
    badgeColor: "#0D9488",
  },
  {
    icon: "🫀",
    name: "Liver function test",
    desc: "ALT, AST, bilirubin, albumin — complete liver health evaluation.",
    count: "12 parameters",
    price: "₹499",
    accent: "#C8293A",
    bg: "rgba(200,41,58,0.1)",
    badgeBg: "rgba(200,41,58,0.12)",
    badgeColor: "#C8293A",
  },
  {
    icon: "🫘",
    name: "Kidney function test",
    desc: "Creatinine, BUN, uric acid, eGFR for kidney health monitoring.",
    count: "10 parameters",
    price: "₹449",
    accent: "#C07020",
    bg: "rgba(192,112,32,0.1)",
    badgeBg: "rgba(192,112,32,0.12)",
    badgeColor: "#C07020",
  },
  {
    icon: "💉",
    name: "Diabetes test panel",
    desc: "HbA1c, fasting glucose, insulin resistance — full diabetes workup.",
    count: "8 parameters",
    price: "₹399",
    accent: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
    badgeBg: "rgba(124,58,237,0.12)",
    badgeColor: "#7C3AED",
  },
  {
    icon: "☀️",
    name: "Vitamin test panel",
    desc: "Vitamin D, B12, folate, ferritin — micronutrient deficiency screening.",
    count: "5 parameters",
    price: "₹699",
    accent: "#0891B2",
    bg: "rgba(8,145,178,0.1)",
    badgeBg: "rgba(8,145,178,0.12)",
    badgeColor: "#0891B2",
  },
];

export default function TestsSection() {
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("ts-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .ts-card {
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 0.45s ease,
            transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.28s ease,
            border-color 0.2s;
        }
        .ts-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .ts-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 12px 32px -8px rgba(0,0,0,0.12);
          border-color: #cbd5e1 !important;
        }
        .ts-card:hover .ts-icon {
          transform: scale(1.12) rotate(-4deg);
        }
        .ts-icon {
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ts-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255,255,255,0.07) 50%,
            transparent 70%
          );
          transform: translateX(-100%);
          pointer-events: none;
        }
        .ts-card:hover .ts-shimmer {
          animation: ts-shimmer-sweep 0.55s ease forwards;
        }
        @keyframes ts-shimmer-sweep {
          to { transform: translateX(100%); }
        }
        .ts-arrow {
          opacity: 0;
          transform: translate(0, 0);
          transition: opacity 0.2s, transform 0.2s;
        }
        .ts-card:hover .ts-arrow {
          opacity: 1;
          transform: translate(3px, -3px);
        }
        .ts-cta-btn {
          transition: background 0.18s, transform 0.18s;
        }
        .ts-cta-btn:hover {
          background: #eff6ff;
          transform: translateX(2px);
        }
      `}</style>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-xs font-medium tracking-widest uppercase">
                  Our test menu
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 leading-snug mb-2 max-w-sm">
                Comprehensive blood test categories
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                From routine checkups to specialised panels — all results delivered digitally within 24 hours.
              </p>
            </div>

            <Link
              href="/tests"
              className="ts-cta-btn inline-flex items-center gap-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-4 py-2 self-start md:self-auto no-underline"
            >
              View all tests
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((t, i) => (
              <Link
                key={t.name}
                href="/signup"
                ref={(el) => { cardRefs.current[i] = el; }}
                className="ts-card group relative block bg-white border border-slate-200 rounded-2xl p-5 no-underline overflow-hidden"
                style={{ transitionDelay: `${i * 75}ms` }}
              >
                {/* Shimmer overlay */}
                <div className="ts-shimmer" />

                {/* Top accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: t.accent }}
                />

                {/* Arrow indicator */}
                <div className="ts-arrow absolute top-4 right-4 text-slate-300">
                  <ArrowUpRight className="w-4 h-4" />
                </div>

                {/* Icon */}
                <div
                  className="ts-icon w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: t.bg }}
                >
                  {t.icon}
                </div>

                {/* Text */}
                <h3 className="text-sm font-semibold text-slate-800 mb-1.5 capitalize">
                  {t.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {t.desc}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: t.badgeBg, color: t.badgeColor }}
                  >
                    {t.count}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {t.price}
                  </span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}