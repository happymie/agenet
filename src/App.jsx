import React, { useState, useEffect } from 'react';
import { FileText, Github, Database, Activity, Zap, Cpu, Layers } from 'lucide-react';

// ==========================================
// 论文核心数据与文案提取 (基于 PDF 原文)
// ==========================================
const PAPER_INFO = {
  title: "AGE-Net: Spectral-Spatial Fusion and Anatomical Graph Reasoning with Evidential Ordinal Regression for Knee Osteoarthritis Grading",
  venue: "Preprint submitted to Elsevier (Medical Image Analysis) · 2026",
  authors: [
    { name: "Xiaoyang Li", isFirst: true },
    { name: "Runni Zhou", isFirst: true },
    { name: "Xinghao Yan" },
    { name: "Liehao Yan" },
    { name: "Zhaochen Li" },
    { name: "Chenjie Zhu" },
    { name: "Rongrong Fu" },
    { name: "Yuan Chai", isCorresponding: true }
  ],
  affiliations: [
    "College of Medicine and Biological Information Engineering, Northeastern University, Shenyang, 110016, China"
  ],
  links: {
    pdf: "https://arxiv.org/abs/2601.17336",
    code: "https://github.com/TadejPogacar105/AGE-Net.git",
    dataset: "https://nda.nih.gov/oai/",
  },
  abstract: "Accurate Kellgren-Lawrence (KL) grading of knee osteoarthritis from plain radiographs remains challenging because of subtle early degenerative changes, long-range anatomical dependencies, and ambiguity near adjacent-grade boundaries. To address these issues, we propose AGE-Net, an anatomy-aware and ordinally constrained deep learning framework for automated KL grading. Built upon a ConvNeXt-Base backbone, AGE-Net integrates three complementary components: Spectral-Spatial Fusion (SSF) for enhancing diagnostically relevant frequency-sensitive textures, a macro-micro Anatomical Graph Reasoning (AGR) module for modeling non-local anatomical relations, and a Pathology-Aware Differential Refinement (PA-DFR) module for emphasizing pathology-relevant boundary cues while suppressing non-informative edges. To better align prediction with the ordered structure of disease severity, we further formulate the task as evidential ordinal regression by combining a Normal-Inverse-Gamma (NIG) evidential head with a pairwise ordinal ranking constraint. We evaluate AGE-Net on a large public knee radiograph cohort and further assess external transferability on NHANES III. Across three random initialization seeds, AGE-Net achieves a quadratic weighted kappa (QWK) of 0.9017 ± 0.0045 and a mean squared error (MSE) of 0.2349 ± 0.0028 on the internal test set. External evaluation yields a QWK of 0.8640 ± 0.0025.",
  bibtex: `@article{li2026agenet,
  title={AGE-Net: Spectral-Spatial Fusion and Anatomical Graph Reasoning with Evidential Ordinal Regression for Knee Osteoarthritis Grading},
  author={Li, Xiaoyang and Zhou, Runni and Yan, Xinghao and Zhu, Chenjie and Li, Zhaochen and Yan, Liehao and Fu, Rongrong and Chai, Yuan},
  journal={Preprint submitted to Elsevier (Medical Image Analysis)},
  year={2026}
}`
};

// 临床 KL 分级标准
const KL_CRITERIA = [
  { grade: "KL 0", name: "Normal", desc: "No radiographic features of osteoarthritis." },
  { grade: "KL 1", name: "Doubtful", desc: "Minute osteophytes, doubtful significance." },
  { grade: "KL 2", name: "Mild", desc: "Definite osteophytes, unimpaired joint space." },
  { grade: "KL 3", name: "Moderate", desc: "Moderate diminution of joint space." },
  { grade: "KL 4", name: "Severe", desc: "Joint space greatly impaired with sclerosis of subchondral bone." }
];

// 四大核心模块数据 (已配置真实的 jpeg 图片路径)
const MODULES = [
  {
    id: "ssf",
    fig: "Figure 2",
    title: "Spectral-Spatial Fusion (SSF)",
    icon: <Zap className="w-5 h-5 text-cyan-400" />,
    desc: "Harmonizes frequency-domain amplitude modulation via rFFT with a spatial gating mechanism to explicitly elevate spectral coefficients synonymous with fine-grained, pathological micro-textures.",
    imgSrc: "/fig2.jpg"
  },
  {
    id: "agr",
    fig: "Figure 3",
    title: "Anatomical Graph Reasoning (AGR)",
    icon: <Cpu className="w-5 h-5 text-indigo-400" />,
    desc: "A macro-micro design where a coarse token graph captures global context, and high-resolution anatomical anchors preserve micro-pathology evidence, routed via bidirectional cross-attention.",
    imgSrc: "/fig3.jpg"
  },
  {
    id: "padfr",
    fig: "Figure 4",
    title: "Differential Refinement (PA-DFR)",
    icon: <Activity className="w-5 h-5 text-purple-400" />,
    desc: "Leverages an internally predicted joint-interest map to gate differential responses, sharply emphasizing osteochondral borders crucial for JSN detection while suppressing non-informative edges.",
    imgSrc: "/fig4.jpg"
  },
  {
    id: "coe",
    fig: "Figure 5",
    title: "Continuous Ordinal Evidential Head",
    icon: <Layers className="w-5 h-5 text-emerald-400" />,
    desc: "Maps the embedding to hyperparameters of a Normal-Inverse-Gamma (NIG) distribution. A pairwise ordinal ranking constraint rigorously enforces monotonicity across the predicted severity.",
    imgSrc: "/fig5.jpg"
  }
];

// 表格 3: 主实验结果
const TABLE_3_RESULTS = [
  { model: "AGE-Net (Proposed Full Framework)", qwk: "0.9017 ± 0.0045", mse: "0.2349 ± 0.0028", spec: "0.8500 ± 0.0096", sens: "0.8676 ± 0.0115", acc: "0.7839 ± 0.0056", isOurs: true },
  { model: "VGG16", qwk: "0.8654 ± 0.0068", mse: "0.3046 ± 0.0102", spec: "0.8705 ± 0.0166", sens: "0.7154 ± 0.0089", acc: "0.8012 ± 0.0198" },
  { model: "EfficientNet", qwk: "0.8638 ± 0.0012", mse: "0.3078 ± 0.0060", spec: "0.8444 ± 0.0222", sens: "0.8471 ± 0.0244", acc: "0.7087 ± 0.0049" },
  { model: "ConvNeXt-Base", qwk: "0.8602 ± 0.0077", mse: "0.3248 ± 0.0118", spec: "0.7132 ± 0.0087", sens: "0.9029 ± 0.0311", acc: "0.7944 ± 0.0259" },
  { model: "Swin-Transformer (Tiny)", qwk: "0.8537 ± 0.0014", mse: "0.3562 ± 0.0083", spec: "0.6777 ± 0.0025", sens: "0.8106 ± 0.0746", acc: "0.8442 ± 0.0781" },
  { model: "Inception-V3", qwk: "0.8475 ± 0.0075", mse: "0.3252 ± 0.0068", spec: "0.8286 ± 0.0239", sens: "0.8401 ± 0.0186", acc: "0.6752 ± 0.0036" },
];

// 表格 4: 消融实验结果
const TABLE_4_ABLATION = [
  { variant: "AGE-Net (Fully Intact Framework)", qwk: "0.9017 ± 0.0045", mse: "0.2349 ± 0.0028", isBase: true },
  { variant: "w/o Ordinal Ranking Constraint", qwk: "0.8963 ± 0.0033", mse: "0.2600 ± 0.0083" },
  { variant: "w/o Anatomical Graph Reasoner (AGR)", qwk: "0.8932 ± 0.0018", mse: "0.2665 ± 0.0017" },
  { variant: "w/o Spectral-Spatial Fusion (SSF)", qwk: "0.8602 ± 0.0077", mse: "0.3248 ± 0.0118" },
  { variant: "w/o Differential Refinement (DFR)", qwk: "0.8229 ± 0.0132", mse: "0.3950 ± 0.0136" },
  { variant: "w/o Continuous Ordinal Evidential (COE)", qwk: "0.8289 ± 0.0014", mse: "0.3908 ± 0.0113" },
];

// ==========================================
// 组件渲染区
// ==========================================
export default function AcademicProjectPage() {
  const [activeNav, setActiveNav] = useState('abstract');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['abstract', 'dataset', 'methodology', 'experiments', 'analysis'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveNav(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-cyan-500/30 selection:text-white leading-relaxed">
      
      {/* ================= 背景光效 ================= */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="fixed top-[10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none -z-10 mix-blend-screen"></div>

      {/* ================= 极简深色导航栏 ================= */}
      <nav className="fixed top-0 w-full bg-[#030303]/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between overflow-x-auto hide-scrollbar">
          <span className="font-serif font-bold text-white tracking-tight shrink-0 mr-8">AGE-Net</span>
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-500 whitespace-nowrap">
            {['Abstract', 'Dataset', 'Methodology', 'Experiments', 'Analysis'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item.toLowerCase())}
                className={`hover:text-cyan-400 transition-colors ${activeNav === item.toLowerCase() ? 'text-cyan-400' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        
        {/* ================= HEADER: 标题与作者 ================= */}
        <header className="mb-24 text-center">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-white/5 text-zinc-400 text-xs font-mono uppercase tracking-widest rounded-full border border-white/10">
              {PAPER_INFO.venue}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-[1.15] mb-10 max-w-4xl mx-auto">
            {PAPER_INFO.title}
          </h1>

          <div className="text-lg text-zinc-300 mb-6 flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-3xl mx-auto">
            {PAPER_INFO.authors.map((author, idx) => (
              <span key={idx} className="whitespace-nowrap">
                <span className={author.isCorresponding ? "text-white font-medium" : ""}>{author.name}</span>
                {author.isFirst && <sup className="ml-0.5 text-cyan-400">†</sup>}
                {author.isCorresponding && <sup className="ml-0.5 text-indigo-400">*</sup>}
                {idx < PAPER_INFO.authors.length - 1 && <span className="text-zinc-600">,</span>}
              </span>
            ))}
          </div>

          <div className="text-sm font-light text-zinc-500 mb-6 max-w-2xl mx-auto">
            {PAPER_INFO.affiliations.map((aff, idx) => <p key={idx}>{aff}</p>)}
          </div>

          <div className="text-xs font-mono text-zinc-500 space-x-6 mb-12">
            <span><sup className="mr-0.5 text-cyan-400">†</sup>Equal Contribution</span>
            <span><sup className="mr-0.5 text-indigo-400">*</sup>Corresponding Author</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <a href={PAPER_INFO.links.pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black text-sm font-bold tracking-wide hover:bg-zinc-200 transition-colors rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <FileText className="w-4 h-4" /> Read Paper
            </a>
            <a href={PAPER_INFO.links.code} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 text-white text-sm font-bold tracking-wide hover:bg-white/10 transition-colors rounded-full backdrop-blur-sm">
              <Github className="w-4 h-4" /> Code
            </a>
            <a href={PAPER_INFO.links.dataset} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 text-white text-sm font-bold tracking-wide hover:bg-white/10 transition-colors rounded-full backdrop-blur-sm">
              <Database className="w-4 h-4" /> Dataset
            </a>
          </div>
        </header>

        {/* ================= ABSTRACT ================= */}
        <section id="abstract" className="mb-24 scroll-mt-24">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 border-b border-white/5 pb-4">
            Abstract
          </h2>
          <p className="text-zinc-400 font-serif leading-relaxed text-justify text-lg md:text-xl">
            {PAPER_INFO.abstract}
          </p>
        </section>

        {/* ================= DATASET ================= */}
        <section id="dataset" className="mb-24 scroll-mt-24">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6 border-b border-white/5 pb-4">
            Datasets & Protocol
          </h2>
          <div className="text-zinc-400 leading-relaxed text-justify space-y-6">
            <p>
              We constructed an internal development cohort from the <strong className="text-zinc-200 font-medium">Osteoarthritis Initiative (OAI)</strong> comprising 4,130 unique patients and 8,620 radiographs (partitioned strictly at the patient level). <strong className="text-zinc-200 font-medium">NHANES III</strong> was utilized as a completely independent external evaluation cohort, comprising 3,922 discrete knees after strict manual quality control.
            </p>
            <div>
              <span className="text-zinc-200 font-medium block mb-3">Kellgren-Lawrence (KL) Grading Criteria:</span>
              <div className="flex flex-wrap gap-2">
                {KL_CRITERIA.map((kl, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-md text-sm text-zinc-400">
                    <strong className="text-cyan-400 font-mono">{kl.grade}</strong> {kl.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= METHODOLOGY ================= */}
        <section id="methodology" className="mb-32 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-bold uppercase tracking-[0.3em] text-sm mb-4">Methodology</h2>
            <h3 className="text-3xl md:text-4xl font-serif text-white">Anatomy-Aware Deep Framework</h3>
          </div>

          {/* 1. 主架构图 (Figure 1) */}
          <div className="mb-16">
            <div className="w-full aspect-video md:aspect-[21/9] bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
              {/* 真实图片渲染：架构图 */}
              <img 
                src="/fig1.jpg" 
                alt="Figure 1 Architectural Overview" 
                className="w-full h-full object-contain p-4" 
                onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%230a0a0a'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-family='monospace' font-size='14' text-anchor='middle' dominant-baseline='middle'%3E[Image Missing: /fig1.jpg]%3C/text%3E%3C/svg%3E" }}
              />
            </div>
            
            <p className="text-sm text-zinc-500 text-justify font-serif leading-relaxed mt-6">
              <strong className="text-zinc-300 font-sans">Figure 1.</strong> Architectural overview of the proposed AGE-Net framework. A ConvNeXt backbone extracts dense feature maps, which are enhanced by SSF. Subsequently, AGR is implemented as a macro-micro reasoning stage. Finally, PA-DFR performs semantically gated differential refinement before the COE-Head optimization.
            </p>
          </div>

          {/* 2. 四大模块画廊 (Figure 2, 3, 4, 5) */}
          <div className="grid md:grid-cols-2 gap-6">
            {MODULES.map((mod, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all flex flex-col group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2.5 bg-black/50 border border-white/5 rounded-lg">
                    {mod.icon}
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-600 group-hover:text-zinc-400 transition-colors">{mod.fig}</span>
                </div>
                
                <h4 className="text-xl font-serif text-white mb-3">{mod.title}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed mb-8 flex-grow">
                  {mod.desc}
                </p>

                {/* 真实图片渲染：各模块图 */}
                <div className="w-full aspect-[16/9] bg-[#050505] rounded-xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                  <img 
                    src={mod.imgSrc} 
                    alt={mod.title} 
                    className="w-full h-full object-contain p-2"
                    onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23050505'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-family='monospace' font-size='12' text-anchor='middle' dominant-baseline='middle'%3E[Missing: ${mod.imgSrc}]%3C/text%3E%3C/svg%3E` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 损失函数与优化 */}
          <div className="mt-12 p-8 rounded-2xl bg-black border border-white/5">
             <div className="flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="md:w-1/3">
                 <h3 className="text-lg font-bold text-white mb-2">Loss Formulation</h3>
                 <p className="text-xs text-zinc-500 leading-relaxed">
                   The total objective synthesizes Evidential NIG Regression with a Pairwise Ordinal Ranking Constraint, heavily penalizing non-monotonic severity predictions.
                 </p>
               </div>
               <div className="md:w-2/3 w-full bg-[#050505] border border-white/5 py-4 px-6 rounded-xl flex items-center justify-center overflow-x-auto font-serif text-lg tracking-wide text-zinc-300">
                 <span className="italic whitespace-nowrap">
                   <span className="font-bold">L</span><sub className="text-xs font-sans">total</sub> 
                   <span className="mx-3">=</span> 
                   <span className="font-bold">L</span><sub className="text-xs font-sans">NIG</sub>
                   <span className="mx-3">+</span>
                   λ <span className="font-bold ml-1">L</span><sub className="text-xs font-sans">POR</sub>
                 </span>
               </div>
             </div>
          </div>
        </section>

        {/* ================= EXPERIMENTS ================= */}
        <section id="experiments" className="mb-32 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-bold uppercase tracking-[0.3em] text-sm mb-4">Experiments</h2>
            <h3 className="text-3xl md:text-4xl font-serif text-white">Comprehensive Evaluation</h3>
          </div>

          {/* Table 3: Main Results */}
          <div className="mb-16">
            <h4 className="text-lg font-medium text-white mb-6 border-l-2 border-cyan-500 pl-3">State-of-the-Art Benchmarks (OAI Internal)</h4>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/50">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="py-4 px-6 font-medium text-zinc-300">Architecture</th>
                    <th className="py-4 px-6 font-medium text-zinc-300 text-right">QWK ↑</th>
                    <th className="py-4 px-6 font-medium text-zinc-300 text-right">MSE ↓</th>
                    <th className="py-4 px-6 font-medium text-zinc-300 text-right">Specificity ↑</th>
                    <th className="py-4 px-6 font-medium text-zinc-300 text-right">Accuracy ↑</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {TABLE_3_RESULTS.map((row, idx) => (
                    <tr key={idx} className={`transition-colors hover:bg-white/[0.02] ${row.isOurs ? 'bg-cyan-900/10' : ''}`}>
                      <td className={`py-4 px-6 flex items-center gap-2 ${row.isOurs ? 'text-cyan-400 font-bold' : 'text-zinc-400'}`}>
                        {row.model}
                        {row.isOurs && <span className="text-[9px] font-sans tracking-widest px-1.5 py-0.5 border border-cyan-500/30 bg-cyan-500/10 rounded-sm">OURS</span>}
                      </td>
                      <td className={`py-4 px-6 text-right ${row.isOurs ? 'text-cyan-400 font-bold' : 'text-zinc-500'}`}>{row.qwk}</td>
                      <td className={`py-4 px-6 text-right ${row.isOurs ? 'text-cyan-400 font-bold' : 'text-zinc-500'}`}>{row.mse}</td>
                      <td className="py-4 px-6 text-right text-zinc-500">{row.spec}</td>
                      <td className="py-4 px-6 text-right text-zinc-500">{row.acc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4: Ablation */}
          <div>
            <h4 className="text-lg font-medium text-white mb-6 border-l-2 border-indigo-500 pl-3">Ablation Studies</h4>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/50">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="py-4 px-6 font-medium text-zinc-300">Model Variant</th>
                    <th className="py-4 px-6 font-medium text-zinc-300 text-right">QWK ↑</th>
                    <th className="py-4 px-6 font-medium text-zinc-300 text-right">MSE ↓</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {TABLE_4_ABLATION.map((row, idx) => (
                    <tr key={idx} className={`transition-colors hover:bg-white/[0.02] ${row.isBase ? 'bg-zinc-900/40' : ''}`}>
                      <td className={`py-4 px-6 ${row.isBase ? 'text-white font-bold' : 'text-zinc-400'}`}>{row.variant}</td>
                      <td className={`py-4 px-6 text-right ${row.isBase ? 'text-white font-bold' : 'text-zinc-500'}`}>{row.qwk}</td>
                      <td className={`py-4 px-6 text-right ${row.isBase ? 'text-white font-bold' : 'text-zinc-500'}`}>{row.mse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ================= ANALYSIS (Qualitative & Robustness) ================= */}
        <section id="analysis" className="mb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold uppercase tracking-[0.3em] text-sm mb-4">Qualitative Analysis</h2>
            <h3 className="text-3xl md:text-4xl font-serif text-white">Interpretability & Robustness</h3>
          </div>

          <div className="space-y-16">
            
            {/* Confusion Matrices (Fig 9a & 9b) */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Confusion Matrix Analysis</h4>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Unlike nominal classification models that produce extreme misclassifications, AGE-Net's predictions strictly gather along the primary diagonal. Errors are exclusively confined to adjacent grades, confirming ordinal efficacy.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square bg-[#050505] rounded-xl border border-white/10 flex items-center justify-center p-2 relative overflow-hidden">
                  <img 
                    src="/fig9a.jpg" 
                    alt="Confusion Matrix OAI" 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23050505'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-family='monospace' font-size='12' text-anchor='middle' dominant-baseline='middle'%3E[Missing: /fig9a.jpg]%3C/text%3E%3C/svg%3E" }}
                  />
                </div>
                <div className="aspect-square bg-[#050505] rounded-xl border border-white/10 flex items-center justify-center p-2 relative overflow-hidden">
                  <img 
                    src="/fig9b.jpg" 
                    alt="Confusion Matrix NHANES" 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23050505'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-family='monospace' font-size='12' text-anchor='middle' dominant-baseline='middle'%3E[Missing: /fig9b.jpg]%3C/text%3E%3C/svg%3E" }}
                  />
                </div>
              </div>
            </div>

            {/* GradCAM (Fig 10 & 11) */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Clinical Alignment (GradCAM)</h4>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                The model's focal attention shifts and clusters at critical pathological sites, notably joint space narrowing (JSN), demonstrating spatial overlap with physician annotations.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square bg-[#050505] rounded-xl border border-white/10 flex items-center justify-center p-2 relative overflow-hidden">
                  <img 
                    src="/fig10.jpg" 
                    alt="Figure 10 GradCAM" 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23050505'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-family='monospace' font-size='12' text-anchor='middle' dominant-baseline='middle'%3E[Missing: /fig10.jpg]%3C/text%3E%3C/svg%3E" }}
                  />
                </div>
                <div className="aspect-square bg-[#050505] rounded-xl border border-white/10 flex items-center justify-center p-2 relative overflow-hidden">
                  <img 
                    src="/fig11.jpg" 
                    alt="Figure 11 CAM Evolution" 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23050505'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-family='monospace' font-size='12' text-anchor='middle' dominant-baseline='middle'%3E[Missing: /fig11.jpg]%3C/text%3E%3C/svg%3E" }}
                  />
                </div>
              </div>
            </div>

            {/* Uncertainty (Fig 12 & 13) */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Evidential Uncertainty & Reliability</h4>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Higher estimated uncertainty is consistently associated with larger absolute error. AGE-Net also maintains robust stability under synthetic perturbations (Noise, Brightness, Occlusion).
              </p>
              <div className="w-full aspect-video md:aspect-[21/9] bg-[#050505] rounded-xl border border-white/10 flex items-center justify-center p-4 relative overflow-hidden">
                <img 
                  src="/fig12.jpg" 
                  alt="Figure 12 & 13 Uncertainty and Perturbations" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23050505'/%3E%3Ctext x='50%25' y='50%25' fill='%2352525b' font-family='monospace' font-size='14' text-anchor='middle' dominant-baseline='middle'%3E[Missing: /fig12.jpg]%3C/text%3E%3C/svg%3E" }}
                />
              </div>
            </div>

          </div>
        </section>

        {/* ================= CITATION ================= */}
        <section className="mb-10 pt-16 border-t border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">Citation</h2>
          <div className="bg-[#050505] border border-white/5 rounded-xl p-6 overflow-x-auto">
            <pre className="text-xs md:text-sm font-mono text-zinc-500 whitespace-pre-wrap leading-relaxed">
              {PAPER_INFO.bibtex}
            </pre>
          </div>
        </section>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full py-8 border-t border-white/5 bg-[#030303] text-center">
        <p className="text-xs text-zinc-600 font-serif">
          © {new Date().getFullYear()} AGE-Net Authors. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
