import "dotenv/config";

import { setServers } from "node:dns";

import { hash } from "bcryptjs";
import mongoose, { Types } from "mongoose";

import { AssessmentModel } from "../../models/assessment.model";
import { ClassroomModel } from "../../models/classroom.model";
import { SkillModel } from "../../models/skill.model";
import { SubmissionModel } from "../../models/submission.model";
import { UserModel } from "../../models/user.model";
import {
  classroomConfigs,
  demoSkills,
  draftQuestionTemplates,
  firstNames,
  lastNames,
  publishedQuestionTemplates,
  type DemoQuestionTemplate,
} from "./seed-data";

const TEACHER_PASSWORD = "Professor123";
const STUDENT_PASSWORD = "Aluno123";

function getMongoUri(): string {
  const mongoUri =
    process.env.MONGODB_URI ??
    process.env.MONGO_URL ??
    process.env.DATABASE_URL;

  if (!mongoUri) {
    throw new Error(
      "A variável de conexão com o MongoDB não foi configurada.",
    );
  }

  return mongoUri;
}

function ensureSeedCanRun(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "O seed não pode ser executado em produção.",
    );
  }

  if (!process.argv.includes("--reset")) {
    throw new Error(
      "Execute o seed utilizando a opção --reset.",
    );
  }

  if (!process.env.SEED_DATABASE_NAME) {
    throw new Error(
      "Defina SEED_DATABASE_NAME no arquivo .env.",
    );
  }
}

function ensureCorrectDatabase(): void {
  const currentDatabase =
    mongoose.connection.db?.databaseName;

  const expectedDatabase =
    process.env.SEED_DATABASE_NAME;

  if (!currentDatabase) {
    throw new Error(
      "Não foi possível identificar o banco conectado.",
    );
  }

  if (currentDatabase !== expectedDatabase) {
    throw new Error(
      [
        "Execução interrompida por segurança.",
        `Banco conectado: ${currentDatabase}.`,
        `Banco autorizado: ${expectedDatabase}.`,
      ].join(" "),
    );
  }
}

function buildStudentName(index: number): string {
  const firstName =
    firstNames[index % firstNames.length];

  const cycle = Math.floor(
    index / firstNames.length,
  );

  const lastNameIndex =
    (index * 7 + cycle) %
    lastNames.length;

  return `${firstName} ${lastNames[lastNameIndex]}`;
}

function buildQuestions(
  templates: DemoQuestionTemplate[],
  skillIdByName: Map<string, Types.ObjectId>,
) {
  return templates.map((template) => {
    const skillId = skillIdByName.get(
      template.skillName,
    );

    if (!skillId) {
      throw new Error(
        `Habilidade não encontrada: ${template.skillName}.`,
      );
    }

    return {
      statement: template.statement,
      skillId,

      alternatives:
        template.alternatives.map(
          (alternative, alternativeIndex) => ({
            text: alternative,

            isCorrect:
              alternativeIndex ===
              template.correctAlternativeIndex,
          }),
        ),
    };
  });
}

async function resetDatabase(): Promise<void> {
  console.log("Limpando dados anteriores...");

  await SubmissionModel.deleteMany({});
  await AssessmentModel.deleteMany({});
  await ClassroomModel.deleteMany({});
  await SkillModel.deleteMany({});
  await UserModel.deleteMany({});
}

async function runSeed(): Promise<void> {
  ensureSeedCanRun();

  // Mantém o mesmo ajuste de DNS utilizado pela API.
  setServers([
    "8.8.8.8",
    "1.1.1.1",
  ]);

  await mongoose.connect(getMongoUri());

  ensureCorrectDatabase();

  await resetDatabase();

  const teacherPasswordHash =
    await hash(TEACHER_PASSWORD, 10);

  const studentPasswordHash =
    await hash(STUDENT_PASSWORD, 10);

  const teacher = await UserModel.create({
    name: "Professora Marina Andrade",
    email: "professor@radaraprende.demo",
    passwordHash: teacherPasswordHash,
    role: "TEACHER",
    active: true,
  });

  const totalStudentCount =
    classroomConfigs.reduce(
      (total, classroom) =>
        total + classroom.studentCount,
      0,
    );

  const studentPayloads = Array.from(
    {
      length: totalStudentCount,
    },
    (_, index) => ({
      name: buildStudentName(index),

      registration: `ALUNO${String(
        index + 1,
      ).padStart(3, "0")}`,

      passwordHash: studentPasswordHash,
      role: "STUDENT" as const,
      createdBy: teacher._id,
      active: true,
    }),
  );

  const students =
    await UserModel.create(studentPayloads);

  const skills = await SkillModel.create(
    demoSkills.map((skill) => ({
      ...skill,
      teacherId: teacher._id,
      active: true,
    })),
  );

  const skillIdByName = new Map(
    skills.map((skill) => [
      skill.name,
      skill._id,
    ]),
  );

  let currentStudentIndex = 0;

  const createdClassrooms = [];
  const createdAssessments = [];
  const submissionPayloads = [];

  for (
    const [classroomIndex, config]
    of classroomConfigs.entries()
  ) {
    const classroomStudents =
      students.slice(
        currentStudentIndex,
        currentStudentIndex +
          config.studentCount,
      );
  
    currentStudentIndex +=
      config.studentCount;
  
    const classroom =
      await ClassroomModel.create({
        name: config.name,
        subject: config.subject,
        schoolYear: config.schoolYear,
        teacherId: teacher._id,
  
        studentIds:
          classroomStudents.map(
            (student) => student._id,
          ),
  
        active: true,
      });
  
    createdClassrooms.push(classroom);
  
    const assessment =
      await AssessmentModel.create({
        title:
          `Diagnóstico de Matemática — ${config.name}`,
  
        description:
          "Avaliação diagnóstica com dados demonstrativos para análise pedagógica.",
  
        classroomId: classroom._id,
        teacherId: teacher._id,
        status: "PUBLISHED",
  
        questions: buildQuestions(
          publishedQuestionTemplates,
          skillIdByName,
        ),
  
        publishedAt: new Date(
          Date.UTC(
            2026,
            6,
            20 + classroomIndex,
            12,
          ),
        ),
  
        active: true,
      });
  
    createdAssessments.push(assessment);
  
    const submittedStudents =
      classroomStudents.slice(
        0,
        config.submissionCount,
      );
  
    for (
      const [studentIndex, student]
      of submittedStudents.entries()
    ) {
      let correctAnswers = 0;
  
      const answers =
        assessment.questions.map(
          (question, questionIndex) => {
            if (!question._id) {
              throw new Error(
                "Questão sem identificador.",
              );
            }
  
            const targetAccuracy =
              config.accuracyTargets[
                questionIndex
              ];
  
            if (targetAccuracy === undefined) {
              throw new Error(
                [
                  "Taxa de acerto não configurada",
                  `para a questão ${questionIndex + 1}`,
                  `da turma ${config.name}.`,
                ].join(" "),
              );
            }
  
            const targetCorrectCount =
              Math.round(
                config.submissionCount *
                  targetAccuracy,
              );
  
            /*
             * Distribui os acertos entre os alunos
             * sem utilizar aleatoriedade.
             */
            const performancePosition =
              (
                studentIndex * 5 +
                questionIndex * 3
              ) %
              config.submissionCount;
  
            const shouldBeCorrect =
              performancePosition <
              targetCorrectCount;
  
            const correctAlternative =
              question.alternatives.find(
                (alternative) =>
                  alternative.isCorrect,
              );
  
            const wrongAlternatives =
              question.alternatives.filter(
                (alternative) =>
                  !alternative.isCorrect,
              );
  
            if (
              !correctAlternative?._id ||
              wrongAlternatives.length === 0
            ) {
              throw new Error(
                "Questão demonstrativa inválida.",
              );
            }
  
            const wrongAlternativeIndex =
              (
                studentIndex +
                questionIndex
              ) %
              wrongAlternatives.length;
  
            const wrongAlternative =
              wrongAlternatives[
                wrongAlternativeIndex
              ];
  
            if (!wrongAlternative?._id) {
              throw new Error(
                "Alternativa sem identificador.",
              );
            }
  
            const selectedAlternative =
              shouldBeCorrect
                ? correctAlternative
                : wrongAlternative;
  
            if (shouldBeCorrect) {
              correctAnswers += 1;
            }
  
            return {
              questionId: question._id,
  
              selectedAlternativeId:
                selectedAlternative._id,
  
              skillId: question.skillId,
              isCorrect: shouldBeCorrect,
            };
          },
        );
  
      const totalQuestions =
        assessment.questions.length;
  
      const score = Number(
        (
          (
            correctAnswers /
            totalQuestions
          ) * 100
        ).toFixed(2),
      );
  
      submissionPayloads.push({
        assessmentId: assessment._id,
        classroomId: classroom._id,
        studentId: student._id,
        answers,
        correctAnswers,
        totalQuestions,
        score,
  
        submittedAt: new Date(
          Date.UTC(
            2026,
            6,
            22 + classroomIndex,
            13,
            studentIndex,
          ),
        ),
      });
    }
  }

  const firstClassroom =
  createdClassrooms[0];

if (!firstClassroom) {
  throw new Error(
    "Nenhuma turma foi criada pelo seed.",
  );
}

await AssessmentModel.create({
    title: "Revisão bimestral — Rascunho",
  
    description:
      "Avaliação em preparação para demonstrar o estado de rascunho.",
  
    classroomId: firstClassroom._id,
    teacherId: teacher._id,
    status: "DRAFT",
  
    questions: buildQuestions(
      draftQuestionTemplates,
      skillIdByName,
    ),
  
    active: true,
  });

  await SubmissionModel.create(
    submissionPayloads,
  );

  const totalAnswers =
    submissionPayloads.reduce(
      (total, submission) =>
        total + submission.answers.length,
      0,
    );

  console.log("");
  console.log("Seed concluído com sucesso.");
  console.log("");
  console.table({
    professor: 1,
    turmas: createdClassrooms.length,
    alunos: students.length,
    habilidades: skills.length,
    avaliacoes:
      createdAssessments.length + 1,
    avaliacoesPublicadas:
      createdAssessments.length,
    submissoes:
      submissionPayloads.length,
    respostas: totalAnswers,
  });

  console.log("");
  console.log("Credenciais de demonstração:");
  console.log(
    "Professor: professor@radaraprende.demo",
  );
  console.log(
    `Senha do professor: ${TEACHER_PASSWORD}`,
  );
  console.log(
    "Aluno inicial: ALUNO001",
  );
  console.log(
    `Senha dos alunos: ${STUDENT_PASSWORD}`,
  );
}

runSeed()
  .catch((error: unknown) => {
    console.error("");
    console.error(
      "Não foi possível executar o seed.",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });