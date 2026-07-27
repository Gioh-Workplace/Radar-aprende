import { Types } from "mongoose";
import request from "supertest";
import {
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../app";
import { UserModel } from "../../models/user.model";
import { createClassroomFactory } from "../factories/classroom.factory";
import {
  createStudentFactory,
  createTeacherFactory,
} from "../factories/user.factory";
import { loginAndGetToken } from "../helpers/auth.helper";

interface TeacherTestContext {
  teacherId: string;
  token: string;
}

async function createTeacherContext(
  email = "turmas@radaraprende.test",
): Promise<TeacherTestContext> {
  const {
    user: teacher,
    password,
  } = await createTeacherFactory({
    email,
  });

  const token = await loginAndGetToken(
    email,
    password,
  );

  return {
    teacherId: String(teacher._id),
    token,
  };
}

function bearerToken(
  token: string,
): string {
  return `Bearer ${token}`;
}

describe("Teacher classrooms", () => {
  it(
    "allows a teacher to create a classroom",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .post("/classrooms")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name: "  8º Ano B  ",
          subject: "  Matemática  ",
          schoolYear: "  2026  ",
        });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        message:
          "Turma criada com sucesso.",

        classroom: {
          name: "8º Ano B",
          subject: "Matemática",
          schoolYear: "2026",
          teacherId:
            context.teacherId,
          studentCount: 0,
          active: true,
        },
      });

      expect(
        response.body.classroom.id,
      ).toEqual(
        expect.any(String),
      );

      expect(
        response.body.classroom.createdAt,
      ).toEqual(
        expect.any(String),
      );
    },
  );

  it(
    "rejects invalid classroom data",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .post("/classrooms")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name: "A",
          subject: "",
          schoolYear: "1",
        });

      expect(response.status).toBe(400);

      expect(response.body).toMatchObject({
        message:
          "Dados da requisição inválidos.",
        code: "VALIDATION_ERROR",
      });

      const invalidFields = (
        response.body.details as Array<{
          field: string;
        }>
      ).map(
        (detail) => detail.field,
      );

      expect(invalidFields).toEqual(
        expect.arrayContaining([
          "name",
          "subject",
          "schoolYear",
        ]),
      );
    },
  );

  it(
    "filters active, archived and all classrooms",
    async () => {
      const context =
        await createTeacherContext();

      await createClassroomFactory({
        teacherId:
          context.teacherId,

        name: "Turma ativa",
        active: true,
      });

      await createClassroomFactory({
        teacherId:
          context.teacherId,

        name: "Turma arquivada",
        active: false,
      });

      const activeResponse =
        await request(app)
          .get("/classrooms")
          .set(
            "Authorization",
            bearerToken(
              context.token,
            ),
          );

      expect(
        activeResponse.status,
      ).toBe(200);

      expect(
        activeResponse.body.total,
      ).toBe(1);

      expect(
        activeResponse.body.classrooms.map(
          (classroom: {
            name: string;
          }) => classroom.name,
        ),
      ).toEqual([
        "Turma ativa",
      ]);

      const archivedResponse =
        await request(app)
          .get(
            "/classrooms?status=archived",
          )
          .set(
            "Authorization",
            bearerToken(
              context.token,
            ),
          );

      expect(
        archivedResponse.status,
      ).toBe(200);

      expect(
        archivedResponse.body.total,
      ).toBe(1);

      expect(
        archivedResponse.body.classrooms.map(
          (classroom: {
            name: string;
          }) => classroom.name,
        ),
      ).toEqual([
        "Turma arquivada",
      ]);

      const allResponse =
        await request(app)
          .get(
            "/classrooms?status=all",
          )
          .set(
            "Authorization",
            bearerToken(
              context.token,
            ),
          );

      expect(allResponse.status).toBe(
        200,
      );

      expect(
        allResponse.body.total,
      ).toBe(2);

      expect(
        allResponse.body.classrooms.map(
          (classroom: {
            name: string;
          }) => classroom.name,
        ),
      ).toEqual([
        "Turma ativa",
        "Turma arquivada",
      ]);
    },
  );

  it(
    "rejects an invalid classroom status filter",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .get(
          "/classrooms?status=unknown",
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(400);

      expect(response.body.code).toBe(
        "VALIDATION_ERROR",
      );
    },
  );

  it(
    "returns classroom details with associated students sorted by name",
    async () => {
      const context =
        await createTeacherContext();

      const {
        user: secondStudent,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        name: "Bruno Oliveira",
        registration:
          "ALUNO-CLASSROOM-002",
      });

      const {
        user: firstStudent,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        name: "Ana Carvalho",
        registration:
          "ALUNO-CLASSROOM-001",
      });

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,

          studentIds: [
            secondStudent._id,
            firstStudent._id,
          ],
        });

      const response = await request(app)
        .get(
          `/classrooms/${classroom._id}`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(200);

      expect(
        response.body.classroom,
      ).toMatchObject({
        id: String(classroom._id),
        studentCount: 2,
        active: true,
      });

      expect(
        response.body.classroom.students.map(
          (student: {
            name: string;
          }) => student.name,
        ),
      ).toEqual([
        "Ana Carvalho",
        "Bruno Oliveira",
      ]);

      expect(
        response.body.classroom.students,
      ).toEqual([
        expect.objectContaining({
          id: String(
            firstStudent._id,
          ),
          name: "Ana Carvalho",
          registration:
            "ALUNO-CLASSROOM-001",
          active: true,
        }),

        expect.objectContaining({
          id: String(
            secondStudent._id,
          ),
          name: "Bruno Oliveira",
          registration:
            "ALUNO-CLASSROOM-002",
          active: true,
        }),
      ]);
    },
  );

  it(
    "hides a classroom from another teacher",
    async () => {
      const firstTeacher =
        await createTeacherContext(
          "primeiro-turmas@radaraprende.test",
        );

      const secondTeacher =
        await createTeacherContext(
          "segundo-turmas@radaraprende.test",
        );

      const secondTeacherClassroom =
        await createClassroomFactory({
          teacherId:
            secondTeacher.teacherId,
        });

      const response = await request(app)
        .get(
          `/classrooms/${secondTeacherClassroom._id}`,
        )
        .set(
          "Authorization",
          bearerToken(
            firstTeacher.token,
          ),
        );

      expect(response.status).toBe(404);

      expect(response.body.code).toBe(
        "CLASSROOM_NOT_FOUND",
      );
    },
  );

  it(
    "rejects an invalid classroom identifier",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .get(
          "/classrooms/invalid-id",
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(400);

      expect(response.body.code).toBe(
        "VALIDATION_ERROR",
      );
    },
  );

  it(
    "adds a teacher student to an active classroom",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const {
        user: student,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        name: "Carla Souza",
        registration:
          "ALUNO-ADD-001",
      });

      const response = await request(app)
        .post(
          `/classrooms/${classroom._id}/students`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          studentId:
            String(student._id),
        });

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        message:
          "Aluno adicionado à turma com sucesso.",

        classroom: {
          id: String(classroom._id),
          studentCount: 1,

          students: [
            {
              id: String(
                student._id,
              ),
              name: "Carla Souza",
              registration:
                "ALUNO-ADD-001",
              active: true,
            },
          ],
        },
      });
    },
  );

  it(
    "prevents adding the same student twice",
    async () => {
      const context =
        await createTeacherContext();

      const {
        user: student,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        registration:
          "ALUNO-DUPLICATE-001",
      });

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,

          studentIds: [
            student._id,
          ],
        });

      const response = await request(app)
        .post(
          `/classrooms/${classroom._id}/students`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          studentId:
            String(student._id),
        });

      expect(response.status).toBe(409);

      expect(response.body.code).toBe(
        "STUDENT_ALREADY_IN_CLASSROOM",
      );
    },
  );

  it(
    "prevents adding a student created by another teacher",
    async () => {
      const firstTeacher =
        await createTeacherContext(
          "professor-dono@radaraprende.test",
        );

      const secondTeacher =
        await createTeacherContext(
          "professor-aluno@radaraprende.test",
        );

      const classroom =
        await createClassroomFactory({
          teacherId:
            firstTeacher.teacherId,
        });

      const {
        user: foreignStudent,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            secondTeacher.teacherId,
          ),

        registration:
          "ALUNO-FOREIGN-001",
      });

      const response = await request(app)
        .post(
          `/classrooms/${classroom._id}/students`,
        )
        .set(
          "Authorization",
          bearerToken(
            firstTeacher.token,
          ),
        )
        .send({
          studentId:
            String(
              foreignStudent._id,
            ),
        });

      expect(response.status).toBe(404);

      expect(response.body.code).toBe(
        "STUDENT_NOT_FOUND",
      );
    },
  );

  it(
    "archives and restores a classroom",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const archiveResponse =
        await request(app)
          .patch(
            `/classrooms/${classroom._id}/status`,
          )
          .set(
            "Authorization",
            bearerToken(
              context.token,
            ),
          )
          .send({
            active: false,
          });

      expect(
        archiveResponse.status,
      ).toBe(200);

      expect(
        archiveResponse.body,
      ).toMatchObject({
        message:
          "Turma arquivada com sucesso.",

        classroom: {
          id: String(classroom._id),
          active: false,
        },
      });

      const restoreResponse =
        await request(app)
          .patch(
            `/classrooms/${classroom._id}/status`,
          )
          .set(
            "Authorization",
            bearerToken(
              context.token,
            ),
          )
          .send({
            active: true,
          });

      expect(
        restoreResponse.status,
      ).toBe(200);

      expect(
        restoreResponse.body,
      ).toMatchObject({
        message:
          "Turma restaurada com sucesso.",

        classroom: {
          id: String(classroom._id),
          active: true,
        },
      });
    },
  );

  it(
    "prevents adding students to an archived classroom",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,

          active: false,
        });

      const {
        user: student,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        registration:
          "ALUNO-ARCHIVED-001",
      });

      const response = await request(app)
        .post(
          `/classrooms/${classroom._id}/students`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          studentId:
            String(student._id),
        });

      expect(response.status).toBe(404);

      expect(response.body.code).toBe(
        "CLASSROOM_NOT_FOUND",
      );
    },
  );

  it(
    "removes the classroom relationship without deleting the student",
    async () => {
      const context =
        await createTeacherContext();

      const {
        user: student,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        name: "Estudante Preservado",
        registration:
          "ALUNO-REMOVE-001",
      });

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,

          studentIds: [
            student._id,
          ],
        });

      const response = await request(app)
        .delete(
          `/classrooms/${classroom._id}/students/${student._id}`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        message:
          "Aluno removido da turma com sucesso.",

        classroom: {
          id: String(classroom._id),
          studentCount: 0,
          students: [],
        },
      });

      const persistedStudent =
        await UserModel.findById(
          student._id,
        );

      expect(
        persistedStudent,
      ).not.toBeNull();

      expect(
        persistedStudent?.registration,
      ).toBe(
        "ALUNO-REMOVE-001",
      );
    },
  );

  it(
    "rejects removing a student that is not in the classroom",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const {
        user: student,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        registration:
          "ALUNO-NOT-IN-CLASSROOM",
      });

      const response = await request(app)
        .delete(
          `/classrooms/${classroom._id}/students/${student._id}`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(404);

      expect(response.body.code).toBe(
        "STUDENT_NOT_IN_CLASSROOM",
      );
    },
  );

  it(
    "prevents students from accessing teacher classroom routes",
    async () => {
      const teacherContext =
        await createTeacherContext();

      const {
        user: student,
        password,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            teacherContext.teacherId,
          ),

        registration:
          "ALUNO-CLASSROOM-PERMISSION",
      });

      const studentToken =
        await loginAndGetToken(
          student.registration ??
            "ALUNO-CLASSROOM-PERMISSION",
          password,
        );

      const response = await request(app)
        .get("/classrooms")
        .set(
          "Authorization",
          bearerToken(studentToken),
        );

      expect(response.status).toBe(403);

      expect(response.body.code).toBe(
        "FORBIDDEN",
      );
    },
  );
});