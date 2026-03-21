"use client";

import { motion } from "framer-motion";
import {
    CommandLineIcon,
    CubeIcon,
    Square2StackIcon,
    SwatchIcon,
    TableCellsIcon,
    BeakerIcon,
    CpuChipIcon
} from "@heroicons/react/24/outline";

const logos = [
    { name: "Veridian", icon: CubeIcon },
    { name: "Nebula", icon: Square2StackIcon },
    { name: "Crest", icon: CommandLineIcon },
    { name: "Apex", icon: Square2StackIcon },
    { name: "Nova", icon: SwatchIcon },
    { name: "Prism", icon: BeakerIcon },
    { name: "Synapse", icon: CpuChipIcon },
    { name: "Catalyst", icon: TableCellsIcon },
];

export const LogoMarquee = () => {
    return (
        <div className="w-full relative overflow-hidden py-6 overflow-x-hidden">
            {/* Smooth mask for fading edges */}
            <div className="flex [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] max-w-full">
                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="flex items-center gap-16 pr-16 whitespace-nowrap"
                    style={{ minWidth: "max-content" }}
                >
                    {[...logos, ...logos, ...logos, ...logos].map((logo, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-3 group opacity-40 hover:opacity-100 transition-all duration-300"
                        >
                            <logo.icon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] transition-colors" />
                            <span className="text-lg font-bold text-[var(--text-secondary)] tracking-tight group-hover:text-[var(--text-primary)] transition-colors">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
