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
        <div className="w-full relative overflow-hidden py-6">
            {/* Smooth mask for fading edges */}
            <div className="flex [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="flex items-center gap-16 pr-16 whitespace-nowrap"
                >
                    {[...logos, ...logos, ...logos, ...logos].map((logo, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-3 group opacity-40 hover:opacity-100 transition-all duration-300"
                        >
                            <logo.icon className="w-5 h-5 text-slate-600 text-slate-400 group-hover:text-indigo-600 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-lg font-bold text-slate-700 text-slate-300 tracking-tight group-hover:text-slate-900 group-hover:text-white transition-colors">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
