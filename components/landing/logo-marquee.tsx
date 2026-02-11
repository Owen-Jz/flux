"use client";

import { motion } from "framer-motion";
import {
    Command,
    Box,
    Hexagon,
    Triangle,
    Circle,
    Layers,
    Droplet,
    Cpu
} from "lucide-react";

const logos = [
    { name: "Veridian", icon: Box },
    { name: "Nebula", icon: Hexagon },
    { name: "Crest", icon: Command },
    { name: "Apex", icon: Triangle },
    { name: "Nova", icon: Circle },
    { name: "Prism", icon: Droplet },
    { name: "Synapse", icon: Cpu },
    { name: "Catalyst", icon: Layers },
];

export const LogoMarquee = () => {
    return (
        <div className="w-full relative overflow-hidden py-10">
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm -z-10" />

            {/* Smooth mask for fading edges */}
            <div className="flex [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="flex items-center gap-20 pr-20 whitespace-nowrap"
                >
                    {[...logos, ...logos, ...logos, ...logos].map((logo, idx) => (
                        <div key={idx} className="flex items-center gap-3 group opacity-40 hover:opacity-100 transition-all duration-300 transform hover:scale-110">
                            <logo.icon className="w-5 h-5 text-[var(--foreground)]" />
                            <span className="text-xl font-bold text-[var(--foreground)] tracking-tight">{logo.name}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
