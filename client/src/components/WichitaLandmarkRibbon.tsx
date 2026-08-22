import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin, Sparkles } from 'lucide-react';

const commons = (filename: string) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}`;

const landmarks = [
  {
    name: 'Keeper of the Plains',
    detail: 'Arkansas River · Wichita',
    image: commons('The-Keeper-of-the-Plains.jpg'),
    source: 'https://commons.wikimedia.org/wiki/File:The-Keeper-of-the-Plains.jpg',
    credit: '04stx · CC BY-SA 3.0',
  },
  {
    name: 'Exploration Place',
    detail: 'River District · Wichita',
    image: commons('Exploration Place (Wichita, Kansas).jpg'),
    source: 'https://commons.wikimedia.org/wiki/File:Exploration_Place_(Wichita,_Kansas).jpg',
    credit: 'Wikimedia Commons · Creative Commons',
  },
  {
    name: 'Downtown Wichita',
    detail: 'Century II · Riverfront · Core',
    image: commons('Downtown Wichita.jpg'),
    source: 'https://commons.wikimedia.org/wiki/File:Downtown_Wichita.jpg',
    credit: 'Popcorn700 · CC BY-SA 4.0',
  },
  {
    name: 'Union Station',
    detail: 'Historic Downtown Wichita',
    image: commons('Wichita Kansas Former Train Station (3616104314).jpg'),
    source: 'https://commons.wikimedia.org/wiki/File:Wichita_Kansas_Former_Train_Station_(3616104314).jpg',
    credit: 'Ty Nigh · Wikimedia Commons',
  },
  {
    name: 'Century II',
    detail: 'Downtown Riverfront',
    image: commons('Century II - Bob Brown Expo Hall.jpg'),
    source: 'https://commons.wikimedia.org/wiki/File:Century_II_-_Bob_Brown_Expo_Hall.jpg',
    credit: 'FUBAR007 · CC BY-SA 3.0',
  },
];

export function WichitaLandmarkRibbon() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#060b13] py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(245,158,11,.12),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(37,99,235,.16),transparent_30%)]" />
      <motion.div
        aria-hidden="true"
        animate={{ x: ['-8%', '8%', '-8%'], opacity: [0.14, 0.24, 0.14] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-24 left-0 h-64 w-2/3 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-10 grid gap-5 lg:grid-cols-[1fr_.8fr] lg:items-end"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/8 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
              <Sparkles size={12} /> Proudly investing in Wichita
            </div>
            <h2 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Wichita is not our backdrop. It is part of the intelligence.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400 lg:justify-self-end">
            OCG evaluates properties in the context of Wichita neighborhoods, housing stock, renovation patterns, local demand, and block-by-block market behavior. The city should feel present throughout the experience.
          </p>
        </motion.div>

        <div className="grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[250px]">
          {landmarks.map((landmark, index) => {
            const span = index === 0 ? 'lg:col-span-5 lg:row-span-2' : index === 1 ? 'lg:col-span-4' : index === 2 ? 'lg:col-span-3' : index === 3 ? 'lg:col-span-3' : 'lg:col-span-4';
            return (
              <motion.article
                key={landmark.name}
                initial={{ opacity: 0, y: 28, scale: 0.985 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{ duration: 0.62, delay: index * 0.06 }}
                whileHover={{ y: -6 }}
                className={`group relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950 shadow-2xl shadow-black/30 ${span}`}
              >
                <motion.img
                  src={landmark.image}
                  alt={`${landmark.name} in Wichita, Kansas`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ scale: 1.04 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.25, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/15 via-transparent to-amber-950/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
                    <MapPin size={11} /> {landmark.detail}
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-white sm:text-2xl">{landmark.name}</h3>
                      <p className="mt-1 text-[10px] text-slate-400">{landmark.credit}</p>
                    </div>
                    <a
                      href={landmark.source}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${landmark.name} photo source and license`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-slate-300 backdrop-blur-md transition-all hover:border-amber-300/40 hover:text-amber-300"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 text-center"
        >
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
          <p className="max-w-3xl font-serif text-xl italic leading-relaxed text-slate-200 sm:text-2xl">
            “We believe in Wichita. We invest in Wichita. We build lasting value in Wichita.”
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Photography sources and licenses linked on each image.</p>
        </motion.div>
      </div>
    </section>
  );
}

export default WichitaLandmarkRibbon;
