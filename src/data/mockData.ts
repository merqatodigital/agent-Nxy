import { ProspectLead, CRMRecord, OpenRouterModel, ICPConfig, ScrapedWebsiteData } from '../types';

export const DEFAULT_OPENROUTER_MODELS: OpenRouterModel[] = [
  // --- FREE MODELS ---
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct (Free)',
    provider: 'Meta / Open Source',
    contextWindow: 131072,
    isFree: true,
    description: 'Meta flagship 70B open weights model with zero API cost. High accuracy reasoning.',
    recommendedFor: 'Best overall free model for SDR agent loops and B2B strategy.'
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 Reasoning (Free)',
    provider: 'DeepSeek',
    contextWindow: 64000,
    isFree: true,
    description: 'Free open reasoning architecture with chain-of-thought verification for deep prospect synthesis.',
    recommendedFor: 'Zero-cost complex value hook generation and research.'
  },
  {
    id: 'deepseek/deepseek-chat:free',
    name: 'DeepSeek V3 Chat (Free)',
    provider: 'DeepSeek',
    contextWindow: 64000,
    isFree: true,
    description: 'Ultra-fast, highly capable free MoE model optimized for structured JSON outputs.',
    recommendedFor: 'High-speed free SDR step execution and JSON formatting.'
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B Instruct (Free)',
    provider: 'Alibaba / Qwen',
    contextWindow: 131072,
    isFree: true,
    description: 'Exceptional open-weights tool-use model with multi-lingual capabilities at zero cost.',
    recommendedFor: 'Tool calling, JSON schema compliance, and multi-lingual outreach.'
  },
  {
    id: 'google/gemma-2-9b-it:free',
    name: 'Gemma 2 9B IT (Free)',
    provider: 'Google / Open Source',
    contextWindow: 8192,
    isFree: true,
    description: 'Lightweight, fast Google open model tailored for rapid cold email drafting.',
    recommendedFor: 'Fast zero-cost email copy generation.'
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B Instruct (Free)',
    provider: 'Meta / Open Source',
    contextWindow: 131072,
    isFree: true,
    description: 'Ultra-lightweight Meta open-source model for instant pipeline execution.',
    recommendedFor: 'Low latency testing and quick lead processing.'
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct (Free)',
    provider: 'Mistral AI',
    contextWindow: 32768,
    isFree: true,
    description: 'Reliable, concise open-weights model from Mistral AI with free access.',
    recommendedFor: 'Short, punchy executive sales copy.'
  },
  {
    id: 'microsoft/phi-3-medium-128k-instruct:free',
    name: 'Phi-3 Medium 128k (Free)',
    provider: 'Microsoft',
    contextWindow: 128000,
    isFree: true,
    description: 'Microsoft efficient open model with massive 128k context window at zero cost.',
    recommendedFor: 'Long context document and web scrape analysis.'
  },

  // --- PAID / PREMIUM MODELS ---
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct (Paid)',
    provider: 'Meta / Open Source',
    contextWindow: 131072,
    isFree: false,
    description: 'Dedicated high-throughput Llama 3.3 70B endpoint for production enterprise workflows.',
    recommendedFor: 'High reliability enterprise SDR automation.'
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 Reasoning (Paid)',
    provider: 'DeepSeek',
    contextWindow: 64000,
    isFree: false,
    description: 'Premium dedicated DeepSeek R1 reasoning model with guaranteed rate limits.',
    recommendedFor: 'Production deep research and reasoning.'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 Chat (Paid)',
    provider: 'DeepSeek',
    contextWindow: 64000,
    isFree: false,
    description: 'Dedicated DeepSeek V3 endpoint for instantaneous JSON generation.',
    recommendedFor: 'Ultra-fast commercial sales agent pipelines.'
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B Instruct (Paid)',
    provider: 'Alibaba / Qwen',
    contextWindow: 131072,
    isFree: false,
    description: 'Paid Qwen 2.5 72B tier for enterprise SLA and dedicated rate limits.',
    recommendedFor: 'High volume B2B lead enrichment loops.'
  },
  {
    id: 'mistralai/mistral-large-2411',
    name: 'Mistral Large 2 (Paid)',
    provider: 'Mistral AI',
    contextWindow: 128000,
    isFree: false,
    description: 'Top-tier enterprise B2B sales copy generator with polished C-level tone.',
    recommendedFor: 'Executive outreach and high-ticket sales.'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Paid)',
    provider: 'Anthropic',
    contextWindow: 200000,
    isFree: false,
    description: 'World-class intelligence for subtle persuasive writing, coding, and strategy.',
    recommendedFor: 'Unmatched cold email personalization quality.'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o Omnimodal (Paid)',
    provider: 'OpenAI',
    contextWindow: 128000,
    isFree: false,
    description: 'OpenAI flagship multimodal intelligence for complex enterprise sales workflows.',
    recommendedFor: 'High accuracy multi-step tool orchestration.'
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash (Paid)',
    provider: 'Google',
    contextWindow: 1048576,
    isFree: false,
    description: 'Google next-gen 1M context model with lightning speed and precise tool calling.',
    recommendedFor: 'Sub-second agent step latency and huge context.'
  },
  {
    id: 'perplexity/sonar-reasoning',
    name: 'Perplexity Sonar Reasoning (Paid)',
    provider: 'Perplexity AI',
    contextWindow: 127000,
    isFree: false,
    description: 'Real-time web-grounded research model for live company insight extraction.',
    recommendedFor: 'Live web scraping and real-time news hooks.'
  }
];

export const DEFAULT_ICP_CONFIG: ICPConfig = {
  companyBio: 'merqato.digital - AI-powered Outbound GTM & SDR Platform driving predictable B2B sales growth.',
  targetIndustry: 'B2B Software, Digital Agencies & Tech Consultancies',
  valueProposition: 'Automate manual SDR research, qualify B2B leads 10x faster, and boost meeting conversion by 35%.',
  offeringDescription: 'Autonomous SDR agent loop that scrapes prospect sites, checks CRM history, and writes high-converting personalized cold emails.',
  primaryPainPoints: [
    'High SDR churn and expensive manual research hours',
    'Low cold email response rates due to generic templates',
    'Disconnected CRM records causing redundant outreach'
  ],
  callToAction: '15-minute quick workflow review & interactive SDR demo',
  senderName: 'Alex Rivera',
  senderRole: 'Head of Growth',
  senderCompany: 'merqato.digital'
};

export const INITIAL_CRM_RECORDS: CRMRecord[] = [
  {
    id: 'crm-1',
    companyName: 'Apex Cloud Solutions',
    domain: 'apexcloud.io',
    lifecycleStage: 'Prospect',
    pastDeals: [
      {
        id: 'deal-101',
        title: 'Initial Consultation - Cloud Ops',
        amount: 4500,
        status: 'Lost',
        date: '2025-11-15'
      }
    ],
    totalSpend: 0,
    lastContactDate: '2025-11-20',
    sentiment: 'Hesitant',
    keyNotes: 'Spoke with CTO Jordan Vance last Q4. Interested in workflow automation but stalled on budget. Re-engage in mid 2026 when engineering team expands.',
    accountOwner: 'Alex Rivera'
  },
  {
    id: 'crm-2',
    companyName: 'Veritas Analytics',
    domain: 'veritasanalytics.com',
    lifecycleStage: 'Customer',
    pastDeals: [
      {
        id: 'deal-202',
        title: 'Enterprise Pipeline Enrichment Tier',
        amount: 18000,
        status: 'Won',
        date: '2026-02-10'
      }
    ],
    totalSpend: 18000,
    lastContactDate: '2026-07-01',
    sentiment: 'Positive',
    keyNotes: 'Happy customer. Currently evaluating expansion to EMEA sales reps. Do NOT send cold outreach; routing to CS team.',
    accountOwner: 'Sarah Jenkins'
  },
  {
    id: 'crm-3',
    companyName: 'NexGen Health Tech',
    domain: 'nexgenhealth.co',
    lifecycleStage: 'Lead',
    pastDeals: [],
    totalSpend: 0,
    lastContactDate: undefined,
    sentiment: 'New Account',
    keyNotes: 'No previous interactions recorded in CRM. Pure cold prospect.',
    accountOwner: 'Unassigned'
  },
  {
    id: 'crm-4',
    companyName: 'LogiFlow Supply Chain',
    domain: 'logiflow.net',
    lifecycleStage: 'Lead',
    pastDeals: [
      {
        id: 'deal-303',
        title: 'SDR Automation Pilot',
        amount: 2500,
        status: 'Lost',
        date: '2025-05-12'
      }
    ],
    totalSpend: 0,
    lastContactDate: '2025-05-18',
    sentiment: 'Hesitant',
    keyNotes: 'VP of Sales was interested but team lacked bandwidth to set up scripts. Good candidate for our new autonomous no-code agent engine.',
    accountOwner: 'Alex Rivera'
  }
];

export const MOCK_SCRAPED_SITES: Record<string, ScrapedWebsiteData> = {
  'apexcloud.io': {
    url: 'https://apexcloud.io',
    title: 'Apex Cloud Solutions | Next-Gen Multi-Cloud Infrastructure Management',
    description: 'Apex Cloud simplifies Kubernetes cluster management, automated CI/CD pipelines, and cost optimization for high-growth tech companies.',
    coreBusinessVectors: [
      'Multi-cloud orchestration',
      'Kubernetes cost management',
      'DevOps pipeline automation'
    ],
    techStack: ['Kubernetes', 'AWS', 'GCP', 'Terraform', 'React', 'Go'],
    valueProps: [
      'Reduce cloud spend by up to 40% with smart cluster autoscaling',
      'Zero-downtime deployment pipelines for microservices'
    ],
    recentHighlights: [
      'Raised $12M Series A funding round in Q2 2026',
      'Hiring 15+ senior DevOps engineers and SDR team leads',
      'Launched Apex CostGuard feature for real-time AWS usage alerts'
    ],
    targetAudience: 'CTOs, VP Engineering, and DevOps Leaders at fast-growing SaaS startups',
    detectedPainPoints: [
      'Engineering teams spending 20+ hours/week manually tuning pipeline infrastructure',
      'Scaling outbound sales team while expanding into EMEA market'
    ]
  },
  'nexgenhealth.co': {
    url: 'https://nexgenhealth.co',
    title: 'NexGen Health Tech - HIPAA Compliant Telehealth & Patient Portals',
    description: 'Empowering specialty medical practices with modern digital patient intake, telehealth video, and AI clinical notes integration.',
    coreBusinessVectors: [
      'Telehealth software for clinics',
      'Automated medical intake forms',
      'AI-assisted clinical documentation'
    ],
    techStack: ['Node.js', 'PostgreSQL', 'Twilio', 'WebRTC', 'HIPAA Shield'],
    valueProps: [
      'Cut patient check-in wait times by 60%',
      'Eliminate 3 hours of daily physician charting work'
    ],
    recentHighlights: [
      'Expanded provider network to 120+ clinical practices',
      'Featured in MedTech Breakthrough awards 2026',
      'Looking to accelerate sales outreach to private specialty clinics'
    ],
    targetAudience: 'Clinic Managers, Medical Directors, Specialty Healthcare Executives',
    detectedPainPoints: [
      'High administrative overhead for medical staff',
      'Slow manual prospect outreach to new clinic directors'
    ]
  },
  'logiflow.net': {
    url: 'https://logiflow.net',
    title: 'LogiFlow Supply Chain | AI Route & Fleet Optimization',
    description: 'Real-time logistics tracking, automated dispatch scheduling, and predictive freight management for regional distribution networks.',
    coreBusinessVectors: [
      'Fleet telematics & GPS dispatch',
      'Predictive freight route planning',
      'Automated warehouse inventory sync'
    ],
    techStack: ['Python', 'Kafka', 'React Native', 'Azure IoT', 'Docker'],
    valueProps: [
      'Cut fuel costs by 18% with dynamic route re-calculation',
      '99.4% on-time delivery rate across regional hubs'
    ],
    recentHighlights: [
      'Announced partnership with 3 national logistics carriers',
      'VP of Sales looking for turnkey SDR automation tools without complex setup'
    ],
    targetAudience: 'Fleet Managers, VP Operations, Supply Chain Directors',
    detectedPainPoints: [
      'Manual dispatch coordination causes route delays',
      'Previous outreach tools took weeks to configure and train sales reps'
    ]
  }
};

export const INITIAL_PROSPECTS: ProspectLead[] = [
  {
    id: 'lead-1',
    companyName: 'Apex Cloud Solutions',
    website: 'apexcloud.io',
    contactName: 'Jordan Vance',
    contactRole: 'CTO & Co-Founder',
    contactEmail: 'jordan.vance@apexcloud.io',
    industry: 'DevOps & Cloud Infrastructure',
    employeeCount: '50-150',
    location: 'Austin, TX',
    status: 'New',
    createdAt: '2026-08-10',
    notes: 'Series A company hiring aggressively. Historical deal lost in 2025 due to timing. Perfect target for re-engagement hook.'
  },
  {
    id: 'lead-2',
    companyName: 'NexGen Health Tech',
    website: 'nexgenhealth.co',
    contactName: 'Dr. Elena Rostova',
    contactRole: 'Chief Medical Officer',
    contactEmail: 'elena.rostova@nexgenhealth.co',
    industry: 'Healthcare Technology',
    employeeCount: '20-50',
    location: 'Boston, MA',
    status: 'New',
    createdAt: '2026-08-11',
    notes: 'Fresh lead. No prior CRM interactions. Expanding clinic partnerships.'
  },
  {
    id: 'lead-3',
    companyName: 'LogiFlow Supply Chain',
    website: 'logiflow.net',
    contactName: 'Marcus Thorne',
    contactRole: 'VP of Sales',
    contactEmail: 'm.thorne@logiflow.net',
    industry: 'Logistics & Supply Chain Software',
    employeeCount: '100-250',
    location: 'Chicago, IL',
    status: 'New',
    createdAt: '2026-08-12',
    notes: 'Previous pilot lost in 2025 because SDR team found set-up too complex. Our new no-code autonomous agent is ideal.'
  }
];
