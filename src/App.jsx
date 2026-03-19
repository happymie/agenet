import React, { useState, useEffect } from 'react';
import { FileText, Github, Database, Activity, Zap, Cpu, Layers, Code, Settings, Beaker } from 'lucide-react';

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

// 表格 3: 主实验结果
const TABLE_3_RESULTS = [
  { model: "AGE-Net (Proposed Full Framework)", qwk: "0.9017 ± 0.0045", mse: "0.2349 ± 0.0028", spec: "0.8500 ± 0.0096", sens: "0.8676 ± 0.0115", acc: "0.7839 ± 0.0056", isOurs: true },
  { model: "VGG16", qwk: "0.8654 ± 0.0068", mse: "0.3046 ± 0.0102", spec: "0.8705 ± 0.0166", sens: "0.7154 ± 0.0089", acc: "0.8012 ± 0.0198" },
  { model: "EfficientNet", qwk: "0.8638 ± 0.0012", mse: "0.3078 ± 0.0060", spec: "0.8444 ± 0.0222", sens: "0.8471 ± 0.0244", acc: "0.7087 ± 0.0049" },
  { model: "ConvNeXt-Base (Raw Baseline)", qwk: "0.8602 ± 0.0077", mse: "0.3248 ± 0.0118", spec: "0.7132 ± 0.0087", sens: "0.9029 ± 0.0311", acc: "0.7944 ± 0.0259" },
  { model: "Inception-V3", qwk: "0.8475 ± 0.0075", mse: "0.3252 ± 0.0068", spec: "0.8286 ± 0.0239", sens: "0.8401 ± 0.0186", acc: "0.6752 ± 0.0036" },
  { model: "DenseNet121", qwk: "0.8427 ± 0.0088", mse: "0.3274 ± 0.0032", spec: "0.8419 ± 0.0167", sens: "0.6629 ± 0.0126", acc: "0.8358 ± 0.0166" },
  { model: "ResNet50", qwk: "0.8271 ± 0.0012", mse: "0.3711 ± 0.0021", spec: "0.6272 ± 0.0033", sens: "0.8324 ± 0.0075", acc: "0.8357 ± 0.0100" },
  { model: "Swin-Transformer (Tiny)", qwk: "0.8537 ± 0.0014", mse: "0.3562 ± 0.0083", spec: "0.6777 ± 0.0025", sens: "0.8106 ± 0.0746", acc: "0.8442 ± 0.0781" },
];

// 表格 4: 消融实验结果
const TABLE_4_ABLATION = [
  { variant: "AGE-Net (Fully Intact Framework)", qwk: "0.9017 ± 0.0045", mse: "0.2349 ± 0.0028", isBase: true },
  { variant: "w/o Ordinal Ranking Constraint", qwk: "0.8963 ± 0.0033", mse: "0.2600 ± 0.0083" },
  { variant: "w/o Anatomical Graph Reasoner (AGR)", qwk: "0.8932 ± 0.0018", mse: "0.2665 ± 0.0017" },
  { variant: "w/o Spectral-Spatial Fusion (SSF)", qwk: "0.8602 ± 0.0077", mse: "0.3248 ± 0.0118" },
  { variant: "w/o Differential Refinement (DFR)", qwk: "0.8229 ± 0.0132", mse: "0.3950 ± 0.0136" },
  { variant: "w/o Continuous Ordinal Evidential (COE) Head", qwk: "0.8289 ± 0.0014", mse: "0.3908 ± 0.0113" },
];

// ==========================================
// 组件渲染区
// ==========================================
export default function AcademicProjectPage() {
  const [activeNav, setActiveNav] = useState('abstract');

  // 监听滚动实现导航栏高亮
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['abstract', 'dataset', 'methodology', 'implementation', 'results', 'ablation', 'analysis', 'conclusion'];
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
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-cyan-900/50 selection:text-cyan-50 leading-relaxed">
      
      {/* ================= 极简深色导航栏 ================= */}
      <nav className="fixed top-0 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800/50 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between overflow-x-auto hide-scrollbar">
          <span className="font-serif font-bold text-zinc-100 tracking-tight shrink-0 mr-8">AGE-Net</span>
          <div className="flex items-center gap-5 text-sm font-medium text-zinc-500 whitespace-nowrap">
            {['Abstract', 'Dataset', 'Methodology', 'Implementation', 'Results', 'Ablation', 'Analysis', 'Conclusion'].map((item) => (
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
            <span className="inline-block px-3 py-1 bg-zinc-900/50 text-zinc-400 text-xs font-mono uppercase tracking-widest rounded-full border border-zinc-800">
              {PAPER_INFO.venue}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-zinc-100 leading-tight mb-10 max-w-4xl mx-auto">
            {PAPER_INFO.title}
          </h1>

          <div className="text-lg text-zinc-300 mb-6 flex flex-wrap justify-center gap-x-3 gap-y-2 max-w-3xl mx-auto">
            {PAPER_INFO.authors.map((author, idx) => (
              <span key={idx} className="whitespace-nowrap">
                <span className={author.isCorresponding ? "text-zinc-100 font-medium" : ""}>{author.name}</span>
                {author.isFirst && <sup className="ml-0.5 text-cyan-500">†</sup>}
                {author.isCorresponding && <sup className="ml-0.5 text-indigo-400">*</sup>}
                {idx < PAPER_INFO.authors.length - 1 && <span className="text-zinc-600">,</span>}
              </span>
            ))}
          </div>

          <div className="text-sm font-light text-zinc-500 mb-6 max-w-2xl mx-auto">
            {PAPER_INFO.affiliations.map((aff, idx) => <p key={idx}>{aff}</p>)}
          </div>

          <div className="text-xs font-mono text-zinc-500 space-x-6 mb-12">
            <span><sup className="mr-0.5 text-cyan-500">†</sup>Equal Contribution</span>
            <span><sup className="mr-0.5 text-indigo-400">*</sup>Corresponding Author</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <a href={PAPER_INFO.links.pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-950 text-sm font-bold tracking-wide hover:bg-white transition-colors rounded-sm">
              <FileText className="w-4 h-4" /> arXiv / PDF
            </a>
            <a href={PAPER_INFO.links.code} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm font-bold tracking-wide hover:bg-zinc-800 hover:text-white transition-colors rounded-sm">
              <Github className="w-4 h-4" /> Code
            </a>
            <a href={PAPER_INFO.links.dataset} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm font-bold tracking-wide hover:bg-zinc-800 hover:text-white transition-colors rounded-sm">
              <Database className="w-4 h-4" /> Dataset
            </a>
          </div>
        </header>

        <hr className="my-16 border-zinc-800/50" />

        {/* ================= ABSTRACT ================= */}
        <section id="abstract" className="mb-24 scroll-mt-24">
          <h2 className="text-2xl font-serif text-zinc-100 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-zinc-700"></span> Abstract
          </h2>
          <div className="bg-zinc-900/30 p-8 border border-zinc-800/50 rounded-sm">
            <p className="text-zinc-400 font-serif leading-relaxed text-justify text-lg">
              {PAPER_INFO.abstract}
            </p>
          </div>
        </section>

        {/* ================= DATASET & PROTOCOL ================= */}
        <section id="dataset" className="mb-24 scroll-mt-24">
          <h2 className="text-2xl font-serif text-zinc-100 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-zinc-700"></span> Datasets and Clinical Definition
          </h2>
          <p className="text-zinc-400 leading-relaxed text-justify mb-8">
            We constructed an internal development cohort from the <strong className="text-zinc-200 font-medium">Osteoarthritis Initiative (OAI)</strong> and used <strong className="text-zinc-200 font-medium">NHANES III</strong> as an external evaluation cohort. The labels strictly adhere to the Kellgren-Lawrence (KL) grading criteria, which assesses KOA severity on a 5-point ordinal scale (Grade 0 to 4).
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-zinc-100 font-medium mb-3 border-b border-zinc-800 pb-3 flex items-center gap-2"><Database className="w-4 h-4" /> Cohort Statistics</h3>
              <ul className="space-y-4">
                <li>
                  <strong className="block text-zinc-300 text-sm">OAI (Internal Cohort)</strong>
                  <span className="text-sm text-zinc-500">4,130 unique patients, 8,620 radiographs. Strictly partitioned at the patient level: training (5,782), validation (1,238), and testing (1,240).</span>
                </li>
                <li>
                  <strong className="block text-zinc-300 text-sm">NHANES III (External)</strong>
                  <span className="text-sm text-zinc-500">3,922 discrete knees after strict manual quality control to exclude degraded or improperly aligned images.</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-zinc-100 font-medium mb-3 border-b border-zinc-800 pb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> KL Grading Protocol</h3>
              <div className="space-y-2">
                {KL_CRITERIA.map((kl, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <span className="font-mono text-cyan-500 shrink-0 w-10">{kl.grade}</span>
                    <span className="text-zinc-400"><strong className="text-zinc-300 font-medium">{kl.name}:</strong> {kl.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= METHODOLOGY ================= */}
        <section id="methodology" className="mb-24 scroll-mt-24">
          <h2 className="text-2xl font-serif text-zinc-100 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-zinc-700"></span> Methodology
          </h2>
          <p className="text-zinc-400 leading-relaxed text-justify mb-10">
            AGE-Net uses a ConvNeXt backbone to extract deep features, followed by three enhancement modules and an evidential regression head. This formulation directly addresses the challenges of subtle degenerative changes, long-range dependencies, and ordinal boundary ambiguity.
          </p>

          <div className="mb-16">
            <div className="w-full aspect-video md:aspect-[2/1] bg-zinc-900/50 border border-zinc-700 border-dashed flex flex-col items-center justify-center p-6 mb-6">
              <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest"></span>
              <span className="text-zinc-600 mt-2 text-sm text-center">Replace this placeholder with the dark-themed pipeline image from the PDF.</span>
            </div>
            <p className="text-sm text-zinc-500 text-justify font-serif leading-relaxed">
              <strong className="text-zinc-300 font-sans">Figure 1.</strong> Architectural overview of the proposed AGE-Net framework. A ConvNeXt backbone extracts dense feature maps, which are enhanced by SSF. Subsequently, AGR is implemented as a macro-micro reasoning stage. Finally, PA-DFR performs semantically gated differential refinement before the COE-Head optimization.
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md shrink-0"><Zap className="w-5 h-5 text-zinc-400" /></div>
              <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">1. Spectral-Spatial Fusion (SSF)</h3>
                <p className="text-zinc-400 leading-relaxed text-justify">
                  Early-stage radiographic OA manifestations frequently present as nearly imperceptible variations in trabecular texture. The SSF module harmonizes frequency-domain amplitude modulation (via rFFT) with a tightly parameterized spatial gating mechanism to explicitly elevate spectral coefficients synonymous with fine-grained, pathological micro-textures.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md shrink-0"><Cpu className="w-5 h-5 text-zinc-400" /></div>
              <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">2. Anatomical Graph Reasoning (AGR)</h3>
                <p className="text-zinc-400 leading-relaxed text-justify">
                  To capture global anatomical context without diluting pathology with background noise, we adopt a macro-micro design. A coarse token graph captures global context, while a small set of high-resolution anatomical anchors preserves micro-pathology evidence. Bidirectional cross-attention routes information between these levels.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md shrink-0"><Settings className="w-5 h-5 text-zinc-400" /></div>
              <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">3. Pathology-Aware Differential Refinement (PA-DFR)</h3>
                <p className="text-zinc-400 leading-relaxed text-justify">
                  To prevent indiscriminate edge amplification, PA-DFR leverages an internally predicted joint-interest map to gate differential responses. It calculates local semantic gradients utilizing a 3×3 depthwise kernel, sharply emphasizing osteochondral borders crucial for detecting joint-space narrowing (JSN).
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md shrink-0"><Layers className="w-5 h-5 text-zinc-400" /></div>
              <div>
                <h3 className="text-lg font-bold text-zinc-200 mb-2">4. Continuous Ordinal Evidential Head (COE-Head)</h3>
                <p className="text-zinc-400 leading-relaxed text-justify">
                  We formulate KL grading not as independent categorical bins, but as a continuous severity continuum. The COE-Head maps the embedding to hyperparameters of a Normal-Inverse-Gamma (NIG) distribution, estimating both severity and uncertainty. A pairwise ordinal ranking constraint rigorously enforces monotonicity across the predicted severity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= IMPLEMENTATION & LOSS FORMULATION ================= */}
        <section id="implementation" className="mb-24 scroll-mt-24">
          <h2 className="text-2xl font-serif text-zinc-100 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-zinc-700"></span> Implementation Details & Formulation
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-zinc-200 font-mono text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Code className="w-4 h-4"/> Environment</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Implemented using <strong>PyTorch</strong>. All models were trained on dual <strong>NVIDIA RTX 3090</strong> (24GB) GPUs to ensure sufficient batch capacity during high-resolution processing.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-zinc-200 font-mono text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Beaker className="w-4 h-4"/> Optimization</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Optimized with <strong>AdamW</strong>. Initial learning rate set to <code className="bg-zinc-800 px-1 rounded text-cyan-400">1e-4</code>, regulated by a Cosine Annealing schedule over 100 epochs. Batch size of 32.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-zinc-200 font-mono text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Settings className="w-4 h-4"/> Pre-processing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Images resized to <code className="bg-zinc-800 px-1 rounded text-cyan-400">224×224</code>. Augmentations include random horizontal flipping, color jittering, and affine rotations (±15°).</p>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-sm">
            <h3 className="text-lg font-bold text-zinc-200 mb-4">Loss Formulation</h3>
            <p className="text-zinc-400 leading-relaxed text-justify mb-6">
              To jointly optimize the evidential regression and preserve the ordinal progression of KL grades, the total loss function is defined as a linear combination of the Negative Log-Likelihood of the NIG distribution ({"$\\mathcal{L}_{NLL}$"}), an evidential regularizer ({"$\\mathcal{L}_{R}$"}), and a Pairwise Ordinal Ranking loss ({"$\\mathcal{L}_{POR}$"}).
            </p>
            
            {/* 模拟 LaTeX 数学公式块 */}
            <div className="bg-[#050505] border border-zinc-800 py-6 px-8 rounded flex flex-col items-center justify-center overflow-x-auto my-6 font-serif text-lg tracking-wide text-zinc-200">
               <span className="italic">
                 <span className="font-bold">L</span><sub className="text-sm font-sans">total</sub> 
                 <span className="mx-3">=</span> 
                 <span className="font-bold">L</span><sub className="text-sm font-sans">NIG</sub>
                 <span className="mx-3">+</span>
                 λ <span className="font-bold ml-1">L</span><sub className="text-sm font-sans">POR</sub>
               </span>
               <div className="mt-4 text-sm text-zinc-500 font-sans tracking-normal">
                 where <span className="italic font-serif">L<sub className="text-xs font-sans">NIG</sub> = L<sub className="text-xs font-sans">NLL</sub> + β L<sub className="text-xs font-sans">R</sub></span>
               </div>
            </div>
            <p className="text-sm text-zinc-500 italic text-center">
              * The hyperparameter λ controls the contribution of the ordinal ranking penalty, strictly penalizing out-of-order severity predictions.
            </p>
          </div>
        </section>

        {/* ================= QUANTITATIVE RESULTS & CONFUSION MATRIX ================= */}
        <section id="results" className="mb-24 scroll-mt-24">
          <h2 className="text-2xl font-serif text-zinc-100 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-zinc-700"></span> Quantitative Results
          </h2>
          <p className="text-zinc-400 leading-relaxed text-justify mb-8">
            AGE-Net achieved the strongest overall performance among the evaluated models. Specifically, it obtained a <strong className="text-cyan-400 font-medium">QWK of 0.9017 ± 0.0045</strong> on the internal test set, outperforming the raw ConvNeXt-Base backbone and other representative baselines (CNNs and Vision Transformers).
          </p>

          <div className="overflow-x-auto mb-10">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-t-[3px] border-b border-zinc-600">
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif whitespace-nowrap">Target Architecture</th>
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif text-right whitespace-nowrap">QWK ↑</th>
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif text-right whitespace-nowrap">MSE ↓</th>
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif text-right whitespace-nowrap">Specificity ↑</th>
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif text-right whitespace-nowrap">Sensitivity ↑</th>
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif text-right whitespace-nowrap">ACC ↑</th>
                </tr>
              </thead>
              <tbody className="border-b-[3px] border-zinc-600 font-mono">
                {TABLE_3_RESULTS.map((row, idx) => (
                  <tr key={idx} className={`border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30 transition-colors ${row.isOurs ? 'bg-cyan-900/10' : ''}`}>
                    <td className={`py-4 px-4 whitespace-nowrap flex items-center gap-2 ${row.isOurs ? 'font-bold text-cyan-400' : 'text-zinc-300'}`}>
                      {row.model}
                      {row.isOurs && <span className="text-[10px] font-sans tracking-widest px-1.5 py-0.5 border border-cyan-500/30 bg-cyan-500/10 rounded-sm">OURS</span>}
                    </td>
                    <td className={`py-4 px-4 text-right whitespace-nowrap ${row.isOurs ? 'font-bold text-cyan-400' : 'text-zinc-400'}`}>{row.qwk}</td>
                    <td className={`py-4 px-4 text-right whitespace-nowrap ${row.isOurs ? 'font-bold text-cyan-400' : 'text-zinc-400'}`}>{row.mse}</td>
                    <td className="py-4 px-4 text-right whitespace-nowrap text-zinc-400">{row.spec}</td>
                    <td className="py-4 px-4 text-right whitespace-nowrap text-zinc-400">{row.sens}</td>
                    <td className="py-4 px-4 text-right whitespace-nowrap text-zinc-400">{row.acc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500 font-serif italic text-center mb-16">
            Table 3: Comprehensive benchmark evaluation against state-of-the-art diagnostic paradigms (Results aggregated across 3 independent initialization seeds).
          </p>

          {/* 混淆矩阵占位 */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-sm">
             <h3 className="text-xl font-serif text-zinc-100 mb-6">Confusion Matrix Analysis</h3>
             <p className="text-zinc-400 leading-relaxed text-justify mb-8">
               Unlike nominal classification models that frequently produce extreme misclassifications (e.g., confusing KL 0 with KL 4), AGE-Net's predictions strictly gather along the primary diagonal. Errors are almost exclusively confined to adjacent grades, confirming the efficacy of the ordinal constraint.
             </p>
             <div className="grid md:grid-cols-2 gap-8 mb-4">
                <div className="w-full aspect-square bg-[#050505] border border-zinc-800 border-dashed flex flex-col items-center justify-center p-6 relative">
                   <span className="text-zinc-600 font-mono text-xs uppercase tracking-widest text-center">[Insert Confusion Matrix: OAI]</span>
                </div>
                <div className="w-full aspect-square bg-[#050505] border border-zinc-800 border-dashed flex flex-col items-center justify-center p-6 relative">
                   <span className="text-zinc-600 font-mono text-xs uppercase tracking-widest text-center">[Insert Confusion Matrix: NHANES III]</span>
                </div>
             </div>
             <p className="text-sm text-zinc-500 text-center font-serif">
                <strong>Figure X.</strong> Confusion matrices on the internal OAI test set and the external NHANES III cohort.
             </p>
          </div>
        </section>

        {/* ================= ABLATION STUDIES ================= */}
        <section id="ablation" className="mb-24 scroll-mt-24">
          <h3 className="text-2xl font-serif text-zinc-100 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-zinc-700"></span> Ablation Studies
          </h3>
          <p className="text-zinc-400 leading-relaxed text-justify mb-8">
            Removing the ordinal ranking constraint or AGR led to noticeable reductions in QWK, indicating that explicit ordinal supervision and non-local anatomical modeling are beneficial. Larger drops were observed when SSF, PA-DFR, or the COE-Head were removed, supporting the complementary roles of the entire framework.
          </p>
          
          <div className="overflow-x-auto mb-6 max-w-4xl mx-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-t-[3px] border-b border-zinc-600">
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif">Model Variant Architecture</th>
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif text-right whitespace-nowrap">Computed QWK ↑</th>
                  <th className="py-4 px-4 font-bold text-zinc-100 font-serif text-right whitespace-nowrap">Resultant MSE ↓</th>
                </tr>
              </thead>
              <tbody className="border-b-[3px] border-zinc-600 font-mono">
                {TABLE_4_ABLATION.map((row, idx) => (
                  <tr key={idx} className={`border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30 transition-colors ${row.isBase ? 'bg-zinc-900/50' : ''}`}>
                    <td className={`py-4 px-4 ${row.isBase ? 'font-bold text-zinc-200' : 'text-zinc-400'}`}>{row.variant}</td>
                    <td className={`py-4 px-4 text-right whitespace-nowrap ${row.isBase ? 'font-bold text-zinc-200' : 'text-zinc-500'}`}>{row.qwk}</td>
                    <td className={`py-4 px-4 text-right whitespace-nowrap ${row.isBase ? 'font-bold text-zinc-200' : 'text-zinc-500'}`}>{row.mse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500 font-serif italic text-center">
            Table 4: Architectural ablation study quantifying the isolated impact of integrated modules.
          </p>
        </section>

        {/* ================= QUALITATIVE ANALYSIS ================= */}
        <section id="analysis" className="mb-24 scroll-mt-24">
          <h2 className="text-2xl font-serif text-zinc-100 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-zinc-700"></span> Clinical Interpretability & Uncertainty
          </h2>

          <div className="space-y-16">
            {/* Figure 10 & 11 Placeholder */}
            <div>
              <h3 className="text-lg font-bold text-zinc-200 mb-6">Alignment with Clinical Expertise</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="w-full aspect-square bg-zinc-900/50 border border-zinc-800 border-dashed flex flex-col items-center justify-center p-6">
                  <span className="text-zinc-600 font-mono text-sm uppercase tracking-widest text-center"></span>
                </div>
                <div className="w-full aspect-square bg-zinc-900/50 border border-zinc-800 border-dashed flex flex-col items-center justify-center p-6">
                  <span className="text-zinc-600 font-mono text-sm uppercase tracking-widest text-center"></span>
                </div>
              </div>
              <p className="text-sm text-zinc-400 text-justify font-serif leading-relaxed">
                <strong className="text-zinc-200 font-sans">Figure 10 & 11.</strong> Qualitative visualization using gradient-based attribution. The model's focal attention shifts and clusters at critical pathological sites, notably joint space narrowing (JSN), demonstrating spatial overlap with physician annotations.
              </p>
            </div>

            {/* Figure 12 & 13 Placeholder */}
            <div>
              <h3 className="text-lg font-bold text-zinc-200 mb-6">Uncertainty and Robustness</h3>
              <div className="w-full aspect-video md:aspect-[2/1] bg-zinc-900/50 border border-zinc-800 border-dashed flex flex-col items-center justify-center p-6 mb-6">
                <span className="text-zinc-600 font-mono text-sm uppercase tracking-widest"></span>
              </div>
              <p className="text-sm text-zinc-400 text-justify font-serif leading-relaxed">
                <strong className="text-zinc-200 font-sans">Figure 12 & 13.</strong> Higher estimated uncertainty is consistently associated with larger absolute error, supporting selective prediction. AGE-Net also maintains robust stability under synthetic perturbations (Noise, Brightness, Occlusion).
              </p>
            </div>
          </div>
        </section>

        {/* ================= CONCLUSION ================= */}
        <section id="conclusion" className="mb-24 scroll-mt-24">
          <h2 className="text-2xl font-serif text-zinc-100 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-zinc-700"></span> Conclusion
          </h2>
          <p className="text-zinc-400 leading-relaxed text-justify mb-8">
            In this work, we proposed AGE-Net, an anatomy-aware and ordinally constrained deep learning framework for automated KL grading of knee osteoarthritis from plain radiographs. By combining spectral-spatial enhancement, anatomical graph reasoning, pathology-aware differential refinement, and evidential ordinal prediction, the model achieved strong performance on both internal and external evaluations. The empirical results suggest that integrating anatomy-aware representation learning with ordinal supervision and uncertainty-related modeling can improve radiographic KOA assessment beyond a strong convolutional baseline.
          </p>
        </section>

        {/* ================= CITATION ================= */}
        <section className="mb-10">
          <h2 className="text-xl font-serif text-zinc-100 mb-6">BibTeX Citation</h2>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-sm p-6 overflow-x-auto shadow-inner">
            <pre className="text-sm font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
              {PAPER_INFO.bibtex}
            </pre>
          </div>
        </section>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full py-10 border-t border-zinc-800/50 bg-[#0a0a0a] text-center">
        <p className="text-sm text-zinc-600 font-serif">
          © {new Date().getFullYear()} AGE-Net Authors. All rights reserved.
        </p>
      </footer>
    </div>
  );
}