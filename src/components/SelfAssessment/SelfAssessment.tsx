import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import {
  useGetUsersQuery,
  useGetGradeExpectationsQuery,
  useGetReviewCyclesQuery,
  useCreateSelfAssessmentMutation,
  useUpdateSelfAssessmentMutation,
  useSubmitSelfAssessmentMutation,
} from "../../services/api";
import {
  UserRole,
  GradeLevel,
  AssessmentStatus,
  AchievementsCategory,
} from "../../types";
import { SelfAssessmentForm } from "../../types";
import { ru } from "../../utils/translations";

const SelfAssessment: React.FC = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<SelfAssessmentForm>>({});

  const [formData, setFormData] = useState<SelfAssessmentForm>({
    achievements: "",
    achievements_category: "",
    selfEvaluation: "",
    currentGrade: GradeLevel.L1,
    targetGrade: GradeLevel.L1,
    peerReviewerIds: [],
    employeeId: user?.id,
    reviewCycleId: "",
    status: AssessmentStatus.DRAFT,
  });

  const { data: users = [] } = useGetUsersQuery();
  const { data: gradeExpectations = [] } = useGetGradeExpectationsQuery();
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery();
  const [createAssessment, { isLoading: isCreating }] =
    useCreateSelfAssessmentMutation();
  const [updateAssessment, { isLoading: isUpdating }] =
    useUpdateSelfAssessmentMutation();
  const [submitAssessment, { isLoading: isSubmittingAssessment }] =
    useSubmitSelfAssessmentMutation();

  // Get active review cycle
  const activeReviewCycle = reviewCycles.find(
    (cycle: any) => cycle.status === "active"
  );

  // Find the employee record that corresponds to the current user
  const currentEmployee = users.find((u: any) => u.id === user?.id);

  // Update form data when user or review cycle changes
  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, employeeId: user.id }));
    }
    if (activeReviewCycle?.id) {
      setFormData((prev) => ({ ...prev, reviewCycleId: activeReviewCycle.id }));
    }
  }, [user, activeReviewCycle]);

  // Filter users to only show potential peer reviewers (excluding self and managers)
  const potentialPeerReviewers =
    users.filter(
      (u: any) =>
        u && // Ensure user object exists
        u.id !== user?.id &&
        u.role !== UserRole.MANAGER &&
        u.role !== UserRole.HR &&
        u.role !== UserRole.ADMIN &&
        u.firstName && // Ensure user has firstName
        u.lastName && // Ensure user has lastName
        u.id // Ensure user has id
    ) || [];

  // Debug logging
  useEffect(() => {
    if (users.length > 0) {
      console.log("Available users:", users);
      console.log("Potential peer reviewers:", potentialPeerReviewers);
    }
    if (reviewCycles.length > 0) {
      console.log("Available review cycles:", reviewCycles);
      console.log("Active review cycle:", activeReviewCycle);
    }
    console.log("=== AUTH DEBUG ===");
    console.log("Current user:", user);
    console.log("User ID:", user?.id);
    console.log("Is authenticated:", !!user);
    console.log("Form data employeeId:", formData.employeeId);
  }, [
    users,
    potentialPeerReviewers,
    reviewCycles,
    activeReviewCycle,
    user,
    formData.employeeId,
  ]);

  // Helper function to get user display name
  const getUserDisplayName = (user: any): string => {
    if (!user) return "Unknown User";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || "Unknown User";
  };

  // Helper function to get current Almaty time
  const getAlmatyTime = (): string => {
    const now = new Date();
    const almatyTime = new Date(now.getTime() + 5 * 60 * 60 * 1000); // GMT+5
    return almatyTime.toISOString();
  };

  // Show loading state while users are being fetched
  if (users.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <Alert severity="error">
          You must be logged in to access the self assessment. Please log in and
          try again.
        </Alert>
      </Box>
    );
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step: number): boolean => {
    console.log(`=== VALIDATING STEP ${step} ===`);
    console.log("Current form data:", formData);

    const newErrors: any = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.achievements.trim()) {
          newErrors.achievements = "Achievements are required";
          console.log("❌ Achievements validation failed");
        }
        if (!formData.achievements_category) {
          newErrors.achievements_category = "Achievements category is required";
          console.log("❌ Achievements category validation failed");
        }
        if (!formData.selfEvaluation.trim()) {
          newErrors.selfEvaluation = "Self evaluation is required";
          console.log("❌ Self evaluation validation failed");
        }
        break;
      case 1: // Grade Assessment
        if (!formData.currentGrade) {
          newErrors.currentGrade = "Current grade is required";
          console.log("❌ Current grade validation failed");
        }
        if (!formData.targetGrade) {
          newErrors.targetGrade = "Target grade is required";
          console.log("❌ Target grade validation failed");
        }
        break;
      case 2: // Peer Reviewers
        if (formData.peerReviewerIds.length < 2) {
          newErrors.peerReviewerIds = "Please select at least 2 peer reviewers";
          console.log("❌ Peer reviewers validation failed");
        }
        break;
      case 3: // Review & Submit
        if (!formData.achievements.trim()) {
          newErrors.achievements = "Achievements are required";
          console.log("❌ Final achievements validation failed");
        }
        if (!formData.selfEvaluation.trim()) {
          newErrors.selfEvaluation = "Self evaluation is required";
          console.log("❌ Final self evaluation validation failed");
        }
        if (!formData.currentGrade) {
          newErrors.currentGrade = "Current grade is required";
          console.log("❌ Final current grade validation failed");
        }
        if (!formData.targetGrade) {
          newErrors.targetGrade = "Target grade is required";
          console.log("❌ Final target grade validation failed");
        }
        if (formData.peerReviewerIds.length < 2) {
          newErrors.peerReviewerIds = "Please select at least 2 peer reviewers";
          console.log("❌ Final peer reviewers validation failed");
        }
        if (!formData.employeeId) {
          newErrors.employeeId = "Employee ID is required";
          console.log("❌ Employee ID validation failed");
        }
        if (!formData.reviewCycleId) {
          newErrors.reviewCycleId = "Review cycle is required";
          console.log("❌ Review cycle validation failed");
        }
        break;
    }

    console.log("Validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Prepare the data for saving as draft
      // NocoDB expects relationships in this format:
      // employees: [1] (array of employee IDs)
      // review_cycles: [1] (array of review cycle IDs)
      const draftData = {
        achievements: formData.achievements,
        achievements_category: formData.achievements_category,
        self_evaluation: formData.selfEvaluation,
        current_grade: formData.currentGrade,
        target_grade: formData.targetGrade,
        status: "draft",
        submitted_at: null,
        created_at: getAlmatyTime(),
        updated_at: getAlmatyTime(),
        // Pass these for NocoDB relationships
        employee_id: formData.employeeId,
        review_cycle_id: formData.reviewCycleId,
      };

      console.log(
        "Saving draft assessment (without system columns):",
        draftData
      );

      const result = await createAssessment(draftData).unwrap();

      if (result) {
        console.log("Draft saved successfully:", result);
        alert("Assessment saved as draft!");

        // Update the form with the saved ID
        setFormData((prev) => ({ ...prev, id: result.id }));
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      alert("Failed to save assessment as draft. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    console.log("=== SUBMISSION DEBUG ===");
    console.log("Current form data:", formData);
    console.log("Active review cycle:", activeReviewCycle);
    console.log("User:", user);

    if (!validateStep(3)) {
      console.log("Validation failed. Errors:", errors);
      return;
    }

    // Check if there's an active review cycle
    if (!activeReviewCycle) {
      alert(
        "No active review cycle found. Please contact HR to start a review cycle."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare the data for submission
      // NocoDB expects relationships in this format:
      // employees: [1] (array of employee IDs)
      // review_cycles: [1] (array of review cycle IDs)
      const submissionData = {
        achievements: formData.achievements,
        achievements_category: formData.achievements_category,
        self_evaluation: formData.selfEvaluation,
        current_grade: formData.currentGrade,
        target_grade: formData.targetGrade,
        status: "submitted",
        submitted_at: getAlmatyTime(),
        created_at: getAlmatyTime(),
        updated_at: getAlmatyTime(),
        // Pass these for NocoDB relationships
        employee_id: formData.employeeId,
        review_cycle_id: formData.reviewCycleId,
      };

      console.log(
        "Submitting assessment data (without system columns):",
        submissionData
      );
      console.log("Original form data:", formData);
      console.log("Peer reviewers selected:", formData.peerReviewerIds);

      const result = await createAssessment(submissionData).unwrap();

      if (result) {
        console.log("Assessment created and submitted successfully:", result);
        console.log("Assessment ID:", result.id);
        console.log("Employee ID set to:", formData.employeeId);
        console.log("Review Cycle ID set to:", formData.reviewCycleId);

        alert("Assessment submitted successfully!");

        // Reset form
        setFormData({
          achievements: "",
          achievements_category: "",
          selfEvaluation: "",
          currentGrade: GradeLevel.L1,
          targetGrade: GradeLevel.L1,
          peerReviewerIds: [],
          employeeId: user?.id,
          reviewCycleId: activeReviewCycle?.id || "",
          status: AssessmentStatus.DRAFT,
        });
        setActiveStep(0);
        setErrors({});
      }
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      alert("Failed to submit assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {ru.common.basicInformation}
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>{ru.common.achievementsCategory}</InputLabel>
              <Select
                value={formData.achievements_category || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    achievements_category: e.target.value,
                  }))
                }
                label={ru.common.achievementsCategory}
                required
                error={!!errors.achievements_category}
              >
                <MenuItem value={AchievementsCategory.RESPONSIBILITY}>
                  {AchievementsCategory.RESPONSIBILITY}
                </MenuItem>
                <MenuItem value={AchievementsCategory.INTERACTION}>
                  {AchievementsCategory.INTERACTION}
                </MenuItem>
                <MenuItem value={AchievementsCategory.LEADERSHIP}>
                  {AchievementsCategory.LEADERSHIP}
                </MenuItem>
              </Select>
              {errors.achievements_category && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {errors.achievements_category}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label={ru.common.achievementsAndAccomplishments}
              value={formData.achievements}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  achievements: e.target.value,
                }))
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label={ru.common.selfEvaluation}
              value={formData.selfEvaluation}
              onChange={(e) =>
                setFormData({ ...formData, selfEvaluation: e.target.value })
              }
              error={!!errors.selfEvaluation}
              helperText={errors.selfEvaluation}
              margin="normal"
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Grade Assessment
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Current Grade</InputLabel>
              <Select
                value={formData.currentGrade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentGrade: e.target.value as GradeLevel,
                  })
                }
                error={!!errors.currentGrade}
              >
                {gradeExpectations.map((grade: any) => (
                  <MenuItem key={grade.grade_level} value={grade.grade_level}>
                    {grade.grade_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Target Grade</InputLabel>
              <Select
                value={formData.targetGrade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetGrade: e.target.value as GradeLevel,
                  })
                }
                error={!!errors.targetGrade}
              >
                {gradeExpectations.map((grade: any) => (
                  <MenuItem key={grade.grade_level} value={grade.grade_level}>
                    {grade.grade_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Peer Reviewers
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Select at least 2 colleagues who can provide feedback on your
              performance
            </Typography>
            <Autocomplete
              multiple
              options={potentialPeerReviewers}
              getOptionLabel={(option: any) => getUserDisplayName(option)}
              value={potentialPeerReviewers.filter((u: any) =>
                formData.peerReviewerIds.includes(u.id)
              )}
              onChange={(_, newValue) => {
                console.log("Peer reviewers selection changed:", newValue);
                console.log(
                  "Selected IDs:",
                  newValue.map((u: any) => u.id)
                );
                setFormData({
                  ...formData,
                  peerReviewerIds: newValue.map((u: any) => u.id),
                });
                console.log(
                  "Updated form data peerReviewerIds:",
                  formData.peerReviewerIds
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Peer Reviewers"
                  error={!!errors.peerReviewerIds}
                  helperText={errors.peerReviewerIds}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={getUserDisplayName(option)}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
            />
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>
            <Typography variant="body1" paragraph>
              Please review your assessment before submitting:
            </Typography>

            {/* Debug info */}
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: "yellow.50",
                border: "1px solid yellow",
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" color="warning.main">
                Debug Info:
              </Typography>
              <Typography variant="body2" fontFamily="monospace">
                achievements: "{formData.achievements}"<br />
                selfEvaluation: "{formData.selfEvaluation}"<br />
                currentGrade: "{formData.currentGrade}"<br />
                targetGrade: "{formData.targetGrade}"<br />
                peerReviewerIds: [{formData.peerReviewerIds.join(", ")}]<br />
                employeeId: "{formData.employeeId}"<br />
                reviewCycleId: "{formData.reviewCycleId}"<br />
                status: "{formData.status}"
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Achievements:</Typography>
              <Typography variant="body2" color="textSecondary">
                {formData.achievements || "Not provided"}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Self Evaluation:</Typography>
              <Typography variant="body2" color="textSecondary">
                {formData.selfEvaluation || "Not provided"}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                Current Grade: {formData.currentGrade || "Not selected"}
              </Typography>
              <Typography variant="subtitle1">
                Target Grade: {formData.targetGrade || "Not selected"}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Peer Reviewers:</Typography>
              <Typography variant="body2" color="textSecondary">
                {potentialPeerReviewers
                  .filter((u: any) => formData.peerReviewerIds.includes(u.id))
                  .map((u: any) => getUserDisplayName(u))
                  .join(", ") || "None selected"}
              </Typography>
            </Box>
          </Box>
        );
      default:
        return "Unknown step";
    }
  };

  const steps = [
    ru.selfAssessment.step1,
    ru.selfAssessment.step2,
    ru.selfAssessment.step3,
    ru.selfAssessment.step4,
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {ru.selfAssessment.title}
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {ru.selfAssessment.subtitle}
        </Typography>

        {/* User and Review Cycle Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            {ru.common.assessmentDetails}
          </Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Typography variant="body2">
              <strong>{ru.common.employee}:</strong>{" "}
              {user ? `${user.firstName} ${user.lastName}` : "Загрузка..."}
            </Typography>
            <Typography variant="body2">
              <strong>{ru.common.reviewCycle}:</strong>{" "}
              {activeReviewCycle
                ? activeReviewCycle.cycle_name
                : "Нет активного цикла"}
            </Typography>
            <Typography variant="body2">
              <strong>{ru.common.currentStatus}:</strong>{" "}
              {formData.status || ru.common.draft}
            </Typography>
          </Box>
          {!activeReviewCycle && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Активный цикл оценки не найден. Вы можете сохранить свою оценку
              как черновик, но не сможете отправить её до начала цикла оценки.
            </Alert>
          )}
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 3 }}>{getStepContent(activeStep)}</Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            {ru.common.back}
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  sx={{ mr: 1 }}
                >
                  Сохранить черновик
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={isSubmitting || !activeReviewCycle}
                  title={!activeReviewCycle ? "Нет активного цикла оценки" : ""}
                >
                  {ru.selfAssessment.submitAssessment}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {ru.common.next}
              </Button>
            )}
          </Box>
        </Box>

        {/* Submit Confirmation Dialog */}
        <Dialog
          open={showSubmitDialog}
          onClose={() => setShowSubmitDialog(false)}
        >
          <DialogTitle>Подтверждение отправки</DialogTitle>
          <DialogContent>
            <Typography>
              Вы уверены, что хотите отправить эту оценку? После отправки вы не
              сможете внести изменения.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSubmitDialog(false)}>
              {ru.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmittingAssessment}
            >
              {isSubmittingAssessment ? (
                <CircularProgress size={20} />
              ) : (
                ru.common.submit
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default SelfAssessment;
