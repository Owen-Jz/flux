'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BuildingOffice2Icon, ShieldCheckIcon, HandRaisedIcon, DocumentChartBarIcon, ServerIcon, CheckCircleIcon, ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Head from 'next/head';

const FEATURES = [
    { icon: ShieldCheckIcon, title: 'SSO/SAML', description: 'Secure single sign-on with SAML 2.0 integration for your entire organization' },
    { icon: HandRaisedIcon, title: 'Dedicated Success Manager', description: 'Personal onboarding and ongoing support to ensure your team thrives' },
    { icon: DocumentChartBarIcon, title: 'SLA Guarantee', description: '99.99% uptime SLA with guaranteed response times and remediation' },
    { icon: ServerIcon, title: 'On-Premise Deployment', description: 'Run Flux on your own infrastructure for maximum data sovereignty and compliance' },
    { icon: CheckCircleIcon, title: 'Custom Contracts', description: 'Tailored agreements with flexible terms, volume discounts, and custom billing' },
    { icon: BuildingOffice2Icon, title: 'Unlimited Everything', description: 'Unlimited projects, members, storage, and API calls with no restrictions' },
];

const TEAM_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function EnterprisePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        teamSize: '',
        message: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) { setError('Name is required'); return; }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Valid email is required'); return; }
        if (!formData.company.trim()) { setError('Company is required'); return; }
        if (!formData.teamSize) { setError('Team size is required'); return; }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/enterprise/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit inquiry');
            }

            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Enterprise - Flux Board</title>
                <meta name="description" content="Scale your organization with Flux Enterprise. Custom pricing, SSO/SAML, dedicated support, and SLA guarantees." />
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                            <BuildingOffice2Icon className="w-4 h-4" />
                            Enterprise Plan
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Scale your organization with Flux Enterprise
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Get unlimited everything, dedicated support, and enterprise-grade security for your growing team.
                        </p>
                    </motion.div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Everything you need to succeed
                            </h2>
                            <div className="grid gap-4">
                                {FEATURES.map((feature, i) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.05 }}
                                        className="flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                            <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="card p-6 lg:p-8 sticky top-8">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    Contact Sales
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Fill out the form below and our team will get back to you within 24 hours.
                                </p>

                                <AnimatePresence mode="wait">
                                    {submitted ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-12"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                                Thank you!
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-400">
                                                We&apos;ve received your inquiry and will contact you shortly.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.form
                                            key="form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onSubmit={handleSubmit}
                                            className="space-y-4"
                                        >
                                            {error && (
                                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                                                    <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                                                    {error}
                                                </div>
                                            )}

                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    className="input w-full"
                                                    placeholder="John Smith"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Work Email <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    className="input w-full"
                                                    placeholder="john@company.com"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="company" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Company <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="company"
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleChange}
                                                    required
                                                    className="input w-full"
                                                    placeholder="Acme Corporation"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="input w-full"
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="teamSize" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Team Size <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="teamSize"
                                                    name="teamSize"
                                                    value={formData.teamSize}
                                                    onChange={handleChange}
                                                    required
                                                    className="input w-full"
                                                >
                                                    <option value="">Select team size</option>
                                                    {TEAM_SIZES.map(size => (
                                                        <option key={size} value={size}>{size} employees</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    How can we help?
                                                </label>
                                                <textarea
                                                    id="message"
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    rows={4}
                                                    className="input w-full resize-none"
                                                    placeholder="Tell us about your requirements, timeline, or any specific needs..."
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                        Submitting...
                                                    </span>
                                                ) : (
                                                    'Submit Inquiry'
                                                )}
                                            </button>

                                            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                                By submitting, you agree to be contacted by our sales team.
                                            </p>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}