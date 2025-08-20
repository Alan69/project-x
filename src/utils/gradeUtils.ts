import { GradeLevel } from "../types";

// Utility function to convert grade level to grade name
export const getGradeName = (
  gradeLevel: string,
  gradeExpectations: any[]
): string => {
  if (!gradeLevel || !gradeExpectations) return gradeLevel || "";

  const gradeExpectation = gradeExpectations.find(
    (ge: any) => ge.grade_level === gradeLevel
  );

  return gradeExpectation?.grade_name || gradeLevel;
};

// Utility function to get grade color based on grade level
export const getGradeColor = (grade: string) => {
  switch (grade) {
    case GradeLevel.L1:
      return "default";
    case GradeLevel.L2:
      return "info";
    case GradeLevel.L3:
      return "warning";
    case GradeLevel.L4:
      return "success";
    case GradeLevel.L5:
      return "error";
    default:
      return "default";
  }
};
