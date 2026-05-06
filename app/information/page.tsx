"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BoltIcon,
  UsersIcon,
  GlobeAltIcon,
  TableCellsIcon,
  ChartBarIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  CogIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

interface FeatureDetail {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

interface TechDetail {
  category: string;
  items: string[];
}

interface PlanDetail {
  name: string;
  price: string;
  features: string[];
}

export default function InformationPage() {
  const coreFeatures: FeatureDetail[] = [
    {
      icon: UsersIcon,
      title: "Real-time Collaboration",
      description:
        "See who's viewing and editing tasks in real-time. Work together on the same board without conflicts or double work.",
      color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    },
    {
      icon: BoltIcon,
      title: "Lightning Fast",
      description:
        "Optimistic updates ensure every interaction feels instant. No loading spinners, just speed that disappears into the background.",
      color: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
    },
    {
      icon: TableCellsIcon,
      title: "Workflow Automation",
      description:
        "Automate repetitive tasks with smart rules. When something changes, items move where they need to go automatically.",
      color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    },
    {
      icon: ChartBarIcon,
      title: "Insightful Analytics",
      description:
        "Beautiful charts show where work is piling up and how to fix it. Track progress with actionable insights to improve team velocity.",
      color: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
    },
    {
      icon: GlobeAltIcon,
      title: "Public Sharing",
      description:
        "Share your roadmap or project status with the world via a simple public link. Keep stakeholders informed without granting full access.",
      color: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    },
    {
      icon: LockClosedIcon,
      title: "Enterprise Security",
      description:
        "Bank-grade security with role-based access control. You control who sees what down to the smallest detail, with data encryption at rest and in transit.",
      color: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    },
  ];

  const techStack = [
    {
      category: "Frontend",
      items: [
        "Next.js 16 (App Router)",
        "TypeScript 5",
        "Tailwind CSS v4",
        "Framer Motion",
        "GSAP Animations",
      ],
    },
    {
      category: "Backend & Database",
      items: [
        "MongoDB with Mongoose",
        "NextAuth.js v5",
        "Server Actions",
        "REST API (OpenAPI)",
      ],
    },
    {
      category: "Integrations",
      items: [
        "Paystack (Payments)",
        "Resend (Email)",
        "UploadThing (File Uploads)",
        "Google OAuth",
      ],
    },
    {
      category: "Analytics & Monitoring",
      items: [
        "Prometheus Metrics",
        "Recharts",
        "Custom Analytics Dashboard",
        "Workspace Analytics",
      ],
    },
  ];

  const plans: PlanDetail[] = [
    {
      name: "Free",
      price: "₦0/mo",
      features: [
        "Up to 3 Projects",
        "Up to 3 Team Members",
        "Unlimited Tasks",
        "Basic Analytics",
        "Community Support",
      ],
    },
    {
      name: "Starter",
      price: "₦10,000/mo",
      features: [
        "Up to 5 Projects",
        "Up to 10 Active Members",
        "Unlimited Tasks",
        "Email Support",
        "Custom Workflows",
        "API Access",
      ],
    },
    {
      name: "Pro",
      price: "₦25,000/mo",
      features: [
        "Unlimited Projects",
        "Up to 25 Active Members",
        "Advanced Analytics",
        "Priority Support",
        "Admin Controls",
        "SSO",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Unlimited Everything",
        "Unlimited Team Members",
        "SSO & SAML",
        "Dedicated Success Manager",
        "Advanced Security",
        "SLA Guarantee",
        "On-premise Deployment",
      ],
    },
  ];

  const workflowStatuses = [
    { name: "Backlog", color: "bg-zinc-400", description: "Tasks that need to be prioritized" },
    { name: "To Do", color: "bg-blue-500", description: "Tasks ready to be worked on" },
    { name: "In Progress", color: "bg-amber-500", description: "Tasks currently being worked on" },
    { name: "Review", color: "bg-purple-500", description: "Tasks awaiting review" },
    { name: "Done", color: "bg-green-500", description: "Completed tasks" },
    { name: "Archived", color: "bg-zinc-600", description: "Archived completed tasks" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="absolute top-1/4 left-1/4 w-[min(600px,80vw)] h-[min(600px,80vw)] bg-gradient-to-br from-[var(--brand-primary)]/20 via-[var(--info-primary)]/10 to-transparent rounded-full blur-[80px]" />

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-7xl mx-auto relative z-10"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-4xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-sm font-bold uppercase tracking-widest mb-6">
              About Flux
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--text-primary)] tracking-tight mb-6">
              One place where your engineering team{" "}
              <span className="text-[var(--brand-primary)]">collaborates, stays aligned,</span> and ships faster
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
              Flux is a modern, SaaS-based project management platform designed specifically for engineering teams.
              Built with cutting-edge technology, it combines Kanban-style task management, real-time collaboration,
              and powerful analytics to help teams ship faster without the chaos.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              { value: "24,000+", label: "Teams Worldwide" },
              { value: "4.9/5", label: "Average Rating" },
              { value: "14-day", label: "Free Trial" },
              { value: "99.9%", label: "Uptime SLA" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]"
              >
                <div className="text-3xl lg:text-4xl font-black text-[var(--brand-primary)] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--text-tertiary)] font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* What is Flux Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          >
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-6">
                What is Flux?
              </h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
                Flux is a comprehensive project management solution built for engineering teams who want to
                move fast without sacrificing quality or visibility. Unlike generic productivity tools, Flux
                understands the unique challenges of software development teams.
              </p>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
                Whether you&apos;re a small startup with 3 team members or an enterprise with hundreds of
                engineers, Flux scales to fit your workflow—not the other way around. Our intuitive Kanban
                boards, combined with powerful automation and real-time collaboration, ensure everyone stays
                aligned and work flows smoothly from idea to completion.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl font-semibold hover:opacity-90 transition-colors"
                >
                  Start Free Trial
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl font-semibold hover:bg-[var(--background-subtle)] transition-colors"
                >
                  Explore Features
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative">
              <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                  </div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">Key Benefits</div>
                </div>
                <ul className="space-y-4">
                  {[
                    "Stop switching between multiple tools",
                    "See what everyone is working on in real-time",
                    "Automate repetitive manual tasks",
                    "Track progress with visual analytics",
                    "Ship faster with less coordination overhead",
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="w-3 h-3 text-[var(--text-inverse)]" />
                      </div>
                      <span className="text-[var(--text-secondary)]">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
              Core Features
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              Everything your team needs
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Powerful features that actually make sense—not a bloated tool with checkboxes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Workflow Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
              How It Works
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              Simple Workflow, Powerful Results
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Tasks flow through clear stages from idea to completion
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
            {workflowStatuses.map((status, index) => (
              <motion.div
                key={status.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)]"
              >
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <span className="font-semibold text-[var(--text-primary)]">{status.name}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              {
                icon: CogIcon,
                title: "Boards & Categories",
                description:
                  "Organize work into Boards, each with customizable Categories (columns) that match your team's workflow.",
              },
              {
                icon: BoltIcon,
                title: "Smart Tasks",
                description:
                  "Create Tasks with priorities, assignees, due dates, subtasks, comments, and tags. AI can automatically break down complex tasks.",
              },
              {
                icon: ShieldCheckIcon,
                title: "Permissions",
                description:
                  "Fine-grained access control with Admin, Editor, and Viewer roles at workspace and board levels.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="text-center p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
              Technology
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              Built with Modern Tech
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              Using the latest and most reliable technologies to deliver a fast, secure, and scalable experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-6"
              >
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{tech.category}</h3>
                <ul className="space-y-2">
                  {tech.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Overview Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
              Pricing
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-[var(--text-secondary)]">
              All plans include a 14-day free trial. No credit card required to start.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] p-6"
              >
                <div className="text-sm font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                  {plan.name}
                </div>
                <div className="text-3xl font-black text-[var(--text-primary)] mb-4">{plan.price}</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckIcon className="w-4 h-4 text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                      <span className="text-[var(--text-secondary)]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                  className={`block text-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    index === 2
                      ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:opacity-90"
                      : "bg-[var(--background-subtle)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)]"
                  }`}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : plan.name === "Free" ? "Start Free" : "Start Trial"}
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-[var(--brand-primary)] font-semibold hover:underline">
              View full pricing details
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                Security
              </span>
              <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-6">
                Enterprise-Grade Security
              </h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
                We take security seriously. Flux implements industry-leading security practices to protect your
                data, including encryption at rest and in transit, regular security audits, and compliance with
                major security standards.
              </p>
              <ul className="space-y-4">
                {[
                  "Role-based access control (RBAC)",
                  "Data encryption (AES-256)",
                  "SOC 2 compliance ready",
                  "Regular security audits",
                  "Secure cloud infrastructure on Vercel",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-[var(--success-primary)]/20 flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="w-3 h-3 text-[var(--success-primary)]" />
                    </div>
                    <span className="text-[var(--text-secondary)]">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] p-8 text-[var(--text-inverse)]">
                <LockClosedIcon className="w-16 h-16 mb-6 opacity-80" />
                <h3 className="text-2xl font-bold mb-4">Your Data, Protected</h3>
                <p className="opacity-80 leading-relaxed">
                  We never sell or share your data. All workspaces, boards, and tasks are private by default
                  with enterprise-grade access controls.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--background-subtle)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-6">
            Ready to streamline your team&apos;s workflow?
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            Join thousands of engineering teams who ship faster with Flux. Start your 14-day free trial today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-2xl font-bold text-lg hover:opacity-90 transition-colors"
            >
              Start Free Trial
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl font-bold text-lg hover:bg-[var(--background-subtle)] transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3"/>
              <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6"/>
              <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9"/>
            </svg>
            <span className="font-black text-xl text-[var(--text-primary)]">flux</span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            © 2026 Flux Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Terms
            </Link>
            <Link href="/security" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
