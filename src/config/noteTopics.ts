import type { SiteLanguage } from './site.ts';

type LocalizedText = Record<SiteLanguage, string>;

export interface NoteTopic {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  prefix: string;
  tag: LocalizedText;
  featuredTranslationKeys: string[];
}

export interface NoteTopicDomain {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  topics: NoteTopic[];
}

export const noteTopicDomains: NoteTopicDomain[] = [
  {
    id: 'software',
    title: {
      zh: '软件工程',
      en: 'Software Engineering',
    },
    description: {
      zh: '从架构、前端、后端到发布和工具，把真实项目怎么设计、开发、上线串起来。',
      en: 'Architecture, frontend, backend, delivery, and tools for building and operating real projects.',
    },
    topics: [
      {
        id: 'software-architecture',
        title: {
          zh: '架构与协作',
          en: 'Architecture & Collaboration',
        },
        description: {
          zh: '系统全景、前后端边界、API 契约和技术选型。',
          en: 'System maps, frontend/backend boundaries, API contracts, and technical choices.',
        },
        prefix: 'software/architecture/',
        tag: {
          zh: '架构',
          en: 'Architecture',
        },
        featuredTranslationKeys: [
          'software/architecture/frontend-backend-architecture-map',
          'software/architecture/api-contract-collaboration-guide',
        ],
      },
      {
        id: 'software-frontend',
        title: {
          zh: '前端工程',
          en: 'Frontend Engineering',
        },
        description: {
          zh: '渲染模式、组件边界、状态管理、性能和体验工程。',
          en: 'Rendering models, component boundaries, state, performance, and product experience.',
        },
        prefix: 'software/frontend/',
        tag: {
          zh: '前端',
          en: 'Frontend',
        },
        featuredTranslationKeys: ['software/frontend/frontend-engineering-architecture-guide'],
      },
      {
        id: 'software-backend',
        title: {
          zh: '后端系统',
          en: 'Backend Systems',
        },
        description: {
          zh: 'API、服务分层、数据库、缓存、认证权限和业务可靠性。',
          en: 'APIs, service boundaries, databases, cache, auth, and backend reliability.',
        },
        prefix: 'software/backend/',
        tag: {
          zh: '后端',
          en: 'Backend',
        },
        featuredTranslationKeys: [
          'software/backend/backend-architecture-practical-guide',
          'software/backend/database-cache-practical-guide',
          'software/backend/auth-access-control-practical-guide',
        ],
      },
      {
        id: 'software-devops',
        title: {
          zh: 'DevOps 与上线',
          en: 'DevOps & Delivery',
        },
        description: {
          zh: 'Docker、CI/CD、可观测性、可靠性和发布治理。',
          en: 'Docker, CI/CD, observability, reliability, and release governance.',
        },
        prefix: 'software/devops/',
        tag: {
          zh: 'DevOps',
          en: 'DevOps',
        },
        featuredTranslationKeys: [
          'software/devops/docker-daily-development-guide',
          'software/devops/harness-cicd-delivery-guide',
          'software/devops/observability-reliability-practical-guide',
        ],
      },
      {
        id: 'software-tools',
        title: {
          zh: '工具与效率',
          en: 'Tools & Workflow',
        },
        description: {
          zh: '日常开发工具、命令行习惯、协作规范和效率插件。',
          en: 'Developer tools, command-line habits, collaboration rules, and workflow boosters.',
        },
        prefix: 'software/tools/',
        tag: {
          zh: '工具',
          en: 'Tools',
        },
        featuredTranslationKeys: ['software/tools/git-commit-history-workflow'],
      },
    ],
  },
  {
    id: 'robotics',
    title: {
      zh: '机器人',
      en: 'Robotics',
    },
    description: {
      zh: '机器人描述、ROS 工具链、仿真和后续 VLA 实验内容都会归到这里。',
      en: 'Robot description, ROS tooling, simulation, and future VLA experiments.',
    },
    topics: [
      {
        id: 'robotics-ros',
        title: {
          zh: 'ROS 与建模',
          en: 'ROS & Modeling',
        },
        description: {
          zh: 'URDF、Xacro、RViz、MoveIt 和机器人模型验证流程。',
          en: 'URDF, Xacro, RViz, MoveIt, and robot model validation workflows.',
        },
        prefix: 'robotics/ros/',
        tag: {
          zh: 'ROS',
          en: 'ROS',
        },
        featuredTranslationKeys: ['robotics/ros/robot-urdf-modeling-guide'],
      },
    ],
  },
];
