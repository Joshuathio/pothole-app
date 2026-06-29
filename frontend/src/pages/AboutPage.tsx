import { Users, BookOpen, Calendar, Mail, GraduationCap } from "lucide-react";

const TEAM = [
  {
    nim: "2802417314",
    name: "Haposan Emmanuel Tobias",
  },
  {
    nim: "2802424156",
    name: "Jonathan Alston Jayapurnama",
  },
  {
    nim: "2802418323",
    name: "Joshua Christian Rudy Thiopelus",
  },
  {
    nim: "2802424313",
    name: "Keanan Julian Hakim",
  },
  {
    nim: "2802424370",
    name: "Timotius Alfredo Murteja",
  },
];

const COURSE_INFO = {
  title: "Real-Time Pothole Detection Using Classical Machine Learning",
  course: "Computer Vision",
  semester: "Semester Genap 2026/2027",
  class: "LF01",
  university: "BINUS University",
};

export default function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold uppercase tracking-wide text-2xl mb-2">
          About This Project
        </h1>
        <p className="text-sm text-neutral-400 max-w-3xl">
          A final project for the Computer Vision course at BINUS University,
          exploring classical machine learning techniques for real-time pothole
          detection on resource-constrained hardware.
        </p>
      </div>

      {/* Project info card */}
      <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-accent/5 border-b border-accent/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <h2 className="text-xs uppercase tracking-widest font-display font-bold text-accent">
              Project Details
            </h2>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow
            icon={<BookOpen className="w-4 h-4" />}
            label="Project Title"
            value={COURSE_INFO.title}
          />
          <InfoRow
            icon={<GraduationCap className="w-4 h-4" />}
            label="Course"
            value={COURSE_INFO.course}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Semester"
            value={COURSE_INFO.semester}
          />
          <InfoRow
            icon={<Users className="w-4 h-4" />}
            label="Class"
            value={COURSE_INFO.class}
          />
          <InfoRow
            icon={<GraduationCap className="w-4 h-4" />}
            label="University"
            value={COURSE_INFO.university}
          />
        </div>
      </div>

      {/* Team */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-accent" />
          <h2 className="text-xs uppercase tracking-widest font-display font-bold">
            Team Members
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM.map((member) => (
            <TeamCard key={member.nim} {...member} />
          ))}
        </div>
      </div>

      {/* Motivation / context */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h2 className="text-xs uppercase tracking-widest font-display font-bold text-neutral-400 mb-4">
          Motivation
        </h2>
        <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
          <p>
            Potholes are more than a daily nuisance, they pose serious hazards
            to driver safety and vehicle integrity. While cities have
            traditionally relied on slow manual inspections, recent computer
            vision research has gravitated heavily toward GPU-intensive deep
            learning approaches that are impractical for many municipal
            deployments.
          </p>
          <p>
            This project shifts focus back to <span className="text-accent font-bold">efficiency</span>{" "}
            and <span className="text-accent font-bold">accessibility</span>:
            we investigate whether classical machine learning, specifically
            HOG and LBP feature extraction with an SVM classifier, can deliver
            useful pothole detection on standard CPU hardware. The motivation is
            grounded in real-world infrastructure constraints, particularly in
            developing economies like Indonesia where road maintenance budgets
            are limited and GPU-based deployments are not feasible.
          </p>
        </div>
      </div>

      {/* Acknowledgments / refs */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h2 className="text-xs uppercase tracking-widest font-display font-bold text-neutral-400 mb-4">
          Acknowledgments
        </h2>
        <div className="space-y-2 text-sm text-neutral-300">
          <p>
            <span className="text-neutral-500">Datasets:</span>{" "}
            virenbr11/pothole-and-plain-rode-images (Kaggle),
            sachinpatel21/pothole-image-dataset (Kaggle)
          </p>
          <p>
            <span className="text-neutral-500">Key references:</span> Dalal &
            Triggs (HOG, 2005), Ojala et al. (LBP, 2002), Cortes & Vapnik (SVM, 1995)
          </p>
          <p>
            <span className="text-neutral-500">Tooling:</span> scikit-learn,
            scikit-image, OpenCV, Flask, React, Vite, Tailwind CSS, PostgreSQL
          </p>
        </div>
      </div>
    </div>
  );
}

function TeamCard({ nim, name }: { nim: string; name: string }) {
  // Initials
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-bg-card border border-border rounded-lg p-5 hover:border-accent/40 transition group">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center font-display font-bold text-sm group-hover:bg-accent/20 transition">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-sm leading-tight">
            {name}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            {nim}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-accent mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
          {label}
        </div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}