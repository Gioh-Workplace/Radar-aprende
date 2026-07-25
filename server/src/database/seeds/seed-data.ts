export interface DemoQuestionTemplate {
    skillName: string;
    statement: string;
    alternatives: string[];
    correctAlternativeIndex: number;
  }
  
  export interface DemoClassroomConfig {
    name: string;
    subject: string;
    schoolYear: string;
    studentCount: number;
    submissionCount: number;
    accuracyTargets: number[];
  }
  
  export const demoSkills = [
    {
      name: "Adição de frações",
      description:
        "Resolver operações de adição envolvendo frações.",
      subject: "Matemática",
    },
    {
      name: "Subtração de frações",
      description:
        "Resolver operações de subtração envolvendo frações.",
      subject: "Matemática",
    },
    {
      name: "Comparação de frações",
      description:
        "Comparar e ordenar frações com diferentes denominadores.",
      subject: "Matemática",
    },
    {
      name: "Simplificação de frações",
      description:
        "Identificar e produzir frações equivalentes simplificadas.",
      subject: "Matemática",
    },
    {
      name: "Porcentagem",
      description:
        "Resolver situações-problema envolvendo porcentagem.",
      subject: "Matemática",
    },
    {
      name: "Proporcionalidade",
      description:
        "Reconhecer e resolver relações proporcionais.",
      subject: "Matemática",
    },
    {
      name: "Área de figuras planas",
      description:
        "Calcular áreas de figuras planas elementares.",
      subject: "Matemática",
    },
    {
      name: "Perímetro",
      description:
        "Calcular o perímetro de polígonos.",
      subject: "Matemática",
    },
    {
      name: "Interpretação de gráficos",
      description:
        "Interpretar informações apresentadas em gráficos.",
      subject: "Matemática",
    },
  ];
  
  export const publishedQuestionTemplates:
    DemoQuestionTemplate[] = [
      {
        skillName: "Adição de frações",
        statement:
          "Qual é o resultado de 1/2 + 1/4?",
        alternatives: [
          "2/6",
          "3/4",
          "1/6",
          "2/4",
        ],
        correctAlternativeIndex: 1,
      },
      {
        skillName: "Subtração de frações",
        statement:
          "Qual é o resultado de 5/6 - 1/3?",
        alternatives: [
          "4/3",
          "1/2",
          "2/6",
          "4/6",
        ],
        correctAlternativeIndex: 1,
      },
      {
        skillName: "Comparação de frações",
        statement:
          "Qual das frações abaixo é a maior?",
        alternatives: [
          "1/4",
          "2/5",
          "3/4",
          "1/2",
        ],
        correctAlternativeIndex: 2,
      },
      {
        skillName: "Simplificação de frações",
        statement:
          "Qual é a forma simplificada de 8/12?",
        alternatives: [
          "4/6",
          "2/3",
          "3/4",
          "1/3",
        ],
        correctAlternativeIndex: 1,
      },
      {
        skillName: "Porcentagem",
        statement:
          "Quanto representa 25% de 200?",
        alternatives: [
          "25",
          "40",
          "50",
          "75",
        ],
        correctAlternativeIndex: 2,
      },
      {
        skillName: "Proporcionalidade",
        statement:
          "Se 2 cadernos custam R$ 10, quanto custam 6 cadernos?",
        alternatives: [
          "R$ 20",
          "R$ 25",
          "R$ 30",
          "R$ 60",
        ],
        correctAlternativeIndex: 2,
      },
    ];
  
  export const draftQuestionTemplates:
    DemoQuestionTemplate[] = [
      {
        skillName: "Área de figuras planas",
        statement:
          "Qual é a área de um retângulo de 5 cm por 4 cm?",
        alternatives: [
          "9 cm²",
          "18 cm²",
          "20 cm²",
          "25 cm²",
        ],
        correctAlternativeIndex: 2,
      },
      {
        skillName: "Perímetro",
        statement:
          "Qual é o perímetro de um quadrado com lado de 6 cm?",
        alternatives: [
          "12 cm",
          "18 cm",
          "24 cm",
          "36 cm",
        ],
        correctAlternativeIndex: 2,
      },
      {
        skillName: "Interpretação de gráficos",
        statement:
          "Em um gráfico de barras, o que normalmente representa a altura de cada barra?",
        alternatives: [
          "A cor da categoria",
          "O valor da categoria",
          "O título do gráfico",
          "A fonte dos dados",
        ],
        correctAlternativeIndex: 1,
      },
    ];
  
  export const classroomConfigs:
    DemoClassroomConfig[] = [
      {
        name: "7º Ano A",
        subject: "Matemática",
        schoolYear: "2026",
        studentCount: 30,
        submissionCount: 28,
  
        // Predomínio de habilidades consolidadas.
        accuracyTargets: [
          0.89,
          0.82,
          0.75,
          0.71,
          0.79,
          0.68,
        ],
      },
      {
        name: "7º Ano B",
        subject: "Matemática",
        schoolYear: "2026",
        studentCount: 30,
        submissionCount: 24,
  
        // Dificuldade específica em comparação de frações.
        accuracyTargets: [
          0.79,
          0.67,
          0.42,
          0.58,
          0.54,
          0.71,
        ],
      },
      {
        name: "8º Ano A",
        subject: "Matemática",
        schoolYear: "2026",
        studentCount: 30,
        submissionCount: 18,
  
        // Participação baixa e múltiplas dificuldades.
        accuracyTargets: [
          0.61,
          0.44,
          0.33,
          0.56,
          0.5,
          0.72,
        ],
      },
    ];
  
  export const firstNames = [
    "Ana",
    "Bruno",
    "Camila",
    "Daniel",
    "Eduarda",
    "Felipe",
    "Gabriela",
    "Henrique",
    "Isabela",
    "João",
    "Karina",
    "Lucas",
    "Mariana",
    "Nicolas",
    "Olívia",
    "Pedro",
    "Rafaela",
    "Samuel",
    "Tainá",
    "Vinícius",
    "Alice",
    "Caio",
    "Débora",
    "Enzo",
    "Fernanda",
    "Gustavo",
    "Helena",
    "Igor",
    "Júlia",
    "Leandro",
  ];
  
  export const lastNames = [
    "Almeida",
    "Barbosa",
    "Cardoso",
    "Costa",
    "Ferreira",
    "Lima",
    "Martins",
    "Oliveira",
    "Pereira",
    "Santos",
    "Silva",
    "Souza",
  ];