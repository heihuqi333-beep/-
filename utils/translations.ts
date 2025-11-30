

import { Language } from '../types';

export const t = (key: string, lang: Language): string => {
  const dict: Record<string, { en: string; zh: string }> = {
    // Navigation & General
    'nav.dashboard': { en: 'Project Dashboard', zh: '项目概览' },
    'nav.screening': { en: 'Genetic Screening', zh: '基因筛查' },
    'nav.drugDiscovery': { en: 'Drug Design R&D', zh: '药物研发' },
    'nav.team': { en: 'Team', zh: '团队介绍' },
    'footer.rights': { en: 'Hubei University Innovation Niuma Team. All rights reserved.', zh: '湖北大学创新牛马团队。保留所有权利。' },
    'footer.version': { en: 'Deep Learning Model V3.0 (Beta)', zh: '深度学习模型 V3.0 (测试版)' },
    
    // Dashboard
    'dash.title': { en: 'Project Overview', zh: '项目概览' },
    'dash.subtitle': { en: 'Key performance indicators comparing Traditional methods vs AI BioGen Model.', zh: '传统方法与 AI BioGen 模型的关键性能指标对比。' },
    'dash.accuracy': { en: 'Screening Accuracy', zh: '筛查准确率' },
    'dash.cost': { en: 'Avg. Detection Cost', zh: '平均检测成本' },
    'dash.time': { en: 'Turnaround Time', zh: '检测周期' },
    'dash.chart.cost': { en: 'Cost Comparison (CNY)', zh: '成本对比 (元)' },
    'dash.chart.time': { en: 'Time Efficiency (Days)', zh: '效率对比 (天)' },
    'dash.chart.accuracy': { en: 'Diagnostic Accuracy', zh: '诊断准确率' },
    'dash.legend.trad': { en: 'Traditional', zh: '传统方法' },
    'dash.legend.ai': { en: 'AI Model', zh: 'AI 模型' },

    // Genetic Screening
    'screen.title': { en: 'Rare Disease Genetic Screening', zh: '罕见病基因变异筛查' },
    'screen.subtitle': { en: 'Upload FASTQ/VCF files or select a demo sample to detect pathogenic variants.', zh: '上传 FASTQ/VCF 文件或选择示例样本以检测致病变异。' },
    'screen.accuracy_badge': { en: 'AI Model Accuracy: 92.7%', zh: 'AI 模型准确率: 92.7%' },
    'screen.list_title': { en: 'Available Samples', zh: '现有样本库' },
    'screen.upload_btn': { en: '+ Upload New Sequence', zh: '+ 上传新序列' },
    'screen.preview_title': { en: 'Sequence Analysis', zh: '序列分析' },
    'screen.preview_desc': { en: 'Displaying critical regions of', zh: '显示关键区域：' },
    'screen.run_btn': { en: 'Run Mutation Analysis', zh: '运行变异分析' },
    'screen.processing': { en: 'Processing AI Model...', zh: 'AI 模型运算中...' },
    'screen.dna_view': { en: 'Genomic DNA', zh: '基因组 DNA' },
    'screen.cdna_view': { en: 'cDNA Sequence', zh: 'cDNA 序列' },
    'screen.protein_view': { en: 'Protein Sequence', zh: '氨基酸序列' },
    'screen.chr_loc': { en: 'Chromosome Location', zh: '染色体位置' },
    'screen.result_title': { en: 'Analysis Complete', zh: '分析完成' },
    'screen.col_pos': { en: 'Position', zh: '位点' },
    'screen.col_change': { en: 'Change (c./p.)', zh: '变异 (c./p.)' },
    'screen.col_type': { en: 'Type', zh: '类型' },
    'screen.col_disease': { en: 'Disease Assoc.', zh: '关联疾病' },
    'screen.col_score': { en: 'Pathogenicity Score', zh: '致病性打分' },
    'screen.disclaimer': { en: '* AI Confidence Interval: 95% | Reference Genome: hg38', zh: '* AI 置信区间: 95% | 参考基因组: hg38' },
    'screen.select_prompt': { en: 'Select a sample from the list to begin analysis', zh: '请从左侧列表选择一个样本以开始分析' },
    'screen.expand_seq': { en: 'Show Full Sequence', zh: '展开完整序列' },
    'screen.collapse_seq': { en: 'Collapse Sequence', zh: '收起序列' },

    // Drug Discovery
    'drug.title': { en: 'AI-Assisted Drug Design', zh: 'AI 辅助药物设计' },
    'drug.subtitle': { en: 'Visualize protein targets and simulate molecular docking with Generative AI.', zh: '可视化蛋白质靶点并使用生成式 AI 模拟分子对接。' },
    'drug.export': { en: 'Export Report', zh: '导出报告' },
    'drug.list_title': { en: 'Target Database', zh: '靶点数据库' },
    'drug.viewer_live': { en: 'Interactive View', zh: '交互视图' },
    'drug.viewer_instruction': { en: 'Drag to rotate • Scroll/Buttons to zoom', zh: '拖动旋转 • 滚动或按钮缩放' },
    'drug.details': { en: 'Structure Details', zh: '结构详情' },
    'drug.docking_title': { en: 'Candidate Screening', zh: '候选药物筛选' },
    'drug.chart_y': { en: 'Lead Candidates', zh: '主要候选药物' },
    'drug.chart_x': { en: 'Binding Affinity (kcal/mol)', zh: '结合亲和力 (kcal/mol)' },
    'drug.lead': { en: 'Top Candidate', zh: '最佳候选' },
    'drug.toxicity': { en: 'Predicted Toxicity', zh: '预测毒性' },
    'drug.initiate': { en: 'Initiate Simulation', zh: '启动模拟' },
    'drug.simulating': { en: 'Running Molecular Dynamics...', zh: '正在运行分子动力学模拟...' },
    'drug.select_prompt': { en: 'Select a target protein to view candidate molecules', zh: '选择靶点蛋白以查看候选分子' },
    'drug.sim_complete': { en: 'Simulation Complete', zh: '模拟完成' },
    'drug.style_ball': { en: 'Ball & Stick', zh: '球棍模型' },
    'drug.style_ribbon': { en: 'AlphaFold Ribbon', zh: 'AlphaFold 丝带' },
    'drug.zoom_in': { en: 'Zoom In', zh: '放大' },
    'drug.zoom_out': { en: 'Zoom Out', zh: '缩小' },
    'drug.upload': { en: 'Upload PDB', zh: '上传结构 (PDB)' },
    'drug.share': { en: 'Share Analysis', zh: '分享分析' },
    'drug.shared_success': { en: 'Link copied to clipboard!', zh: '链接已复制到剪贴板！' },
    'drug.moi_title': { en: 'Interaction Mechanism', zh: '药物-靶点作用机制' },
    'drug.moi_2d': { en: '2D Interaction Map', zh: '2D 互作图谱' },
    'drug.moi_3d': { en: '3D Binding Pocket', zh: '3D 结合口袋' },
    'drug.moi_legend_h': { en: 'H-Bond', zh: '氢键' },
    'drug.moi_legend_p': { en: 'Hydrophobic', zh: '疏水作用' },
    'drug.moi_legend_lig': { en: 'Ligand', zh: '配体' },
    'drug.moi_legend_res': { en: 'Residue', zh: '残基' },
    
    // Team
    'team.title': { en: 'Our Team', zh: '团队介绍' },
    'team.subtitle': { en: 'An interdisciplinary team combining AI, Biology, and Medical expertise.', zh: '融合人工智能、生物学与医学专业的跨学科团队。' },
    'team.advisor': { en: 'Project Advisor', zh: '项目指导' },
    'team.members': { en: 'Core Members', zh: '核心成员' },
  };

  return dict[key]?.[lang] || key;
};
