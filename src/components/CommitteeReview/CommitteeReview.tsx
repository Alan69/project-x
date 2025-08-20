import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import { Group as GroupIcon } from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import {
  useGetSelfAssessmentsQuery,
  useGetUsersQuery,
  useGetPeerReviewsQuery,
  useGetCommitteeDecisionsQuery,
  useGetGradeExpectationsQuery,
  useSubmitCommitteeDecisionMutation,
} from "../../services/api";
import { AssessmentStatus, GradeLevel, UserRole } from "../../types";
import { getGradeName, getGradeColor } from "../../utils/gradeUtils";
import { formatDate } from "../../utils/dateUtils";
import { ru } from "../../utils/translations";

const CommitteeReview: React.FC = () => {
  const { user } = useAuth();
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [committeeData, setCommitteeData] = useState({
    decision: "pending",
    final_grade: "",
    comments: "",
    recommendations: "",
  });
  const [activeStep, setActiveStep] = useState(0);

  const { data: assessments = [], isLoading: assessmentsLoading } =
    useGetSelfAssessmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: peerReviews = [] } = useGetPeerReviewsQuery();
  const { data: committeeDecisions = [] } = useGetCommitteeDecisionsQuery();
  const { data: gradeExpectations = [] } = useGetGradeExpectationsQuery();

  const [submitCommitteeDecision] = useSubmitCommitteeDecisionMutation();

  // Filter assessments ready for committee review
  const readyForCommittee = assessments.filter((assessment: any) => {
    // Check if assessment has at least 2 peer reviews (both confirmed)
    const assessmentPeerReviews = peerReviews.filter(
      (review: any) => review.self_assessment_id === assessment.id
    );

    const hasEnoughPeerReviews = assessmentPeerReviews.length >= 2;
    const confirmedPeerReviews = assessmentPeerReviews.filter(
      (review: any) => review.status === "confirmed"
    );
    const hasMinimumConfirmedReviews = confirmedPeerReviews.length >= 2;

    const hasCommitteeDecision = committeeDecisions.some(
      (decision: any) => decision.self_assessment_id === assessment.id
    );

    // Debug logging
    console.log(
      `=== COMMITTEE REVIEW DEBUG FOR ASSESSMENT ${assessment.id} ===`
    );
    console.log("Assessment status:", assessment.status);
    console.log("Total peer reviews:", assessmentPeerReviews.length);
    console.log("Confirmed peer reviews:", confirmedPeerReviews.length);
    console.log("Has committee decision:", hasCommitteeDecision);
    console.log(
      "Peer review statuses:",
      assessmentPeerReviews.map((r) => r.status)
    );
    console.log(
      "Ready for committee:",
      assessment.status === AssessmentStatus.SUBMITTED &&
        hasEnoughPeerReviews &&
        hasMinimumConfirmedReviews &&
        !hasCommitteeDecision
    );

    return (
      assessment.status === AssessmentStatus.SUBMITTED &&
      hasEnoughPeerReviews &&
      hasMinimumConfirmedReviews &&
      !hasCommitteeDecision
    );
  });

  const completedCommitteeReviews = committeeDecisions.filter(
    (decision: any) => decision.status === "completed" || decision.decision
  );

  const handleCommitteeReviewSubmit = async () => {
    if (!selectedAssessment || !committeeData.comments.trim()) {
      alert("Please provide comments before submitting the committee review.");
      return;
    }

    try {
      // Submit committee decision
      await submitCommitteeDecision({
        self_assessment_id: selectedAssessment.id,
        committee_id: user?.id,
        decision: committeeData.decision,
        final_grade:
          committeeData.final_grade || selectedAssessment.target_grade,
        comments: committeeData.comments,
        recommendations: committeeData.recommendations,
        decision_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        status: "completed", // Ensure status is set to completed
      }).unwrap();

      // Update the assessment status to completed
      // Note: This would require an updateSelfAssessment mutation call
      // For now, the committee decision will show in the completed reviews

      alert("Committee review submitted successfully!");
      setSelectedAssessment(null);
      setCommitteeData({
        decision: "pending",
        final_grade: "",
        comments: "",
        recommendations: "",
      });
      setActiveStep(0);
    } catch (error) {
      console.error("Failed to submit committee review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      case "conditional":
        return "info";
      default:
        return "default";
    }
  };

  const getGradeColor = (grade: string) => {
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

  // Check user permissions
  if (
    user?.role?.toLowerCase() !== UserRole.COMMITTEE_MEMBER &&
    user?.role?.toLowerCase() !== UserRole.HR &&
    user?.role?.toLowerCase() !== UserRole.ADMIN
  ) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Alert severity="warning">
          You don't have permission to access Committee Review functionality.
          Your current role is: {user?.role || "Unknown"}
        </Alert>
      </Box>
    );
  }

  if (assessmentsLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Alert severity="error">
          User not authenticated. Please log in again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {ru.committeeReview.dashboard}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {ru.committeeReview.subtitle}
        </Typography>

        <Grid container spacing={3}>
          {/* Ready for Committee Review */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.committeeReview.readyForCommittee} (
                  {readyForCommittee.length})
                </Typography>
                {readyForCommittee.length === 0 ? (
                  <Alert severity="info">
                    {ru.committeeReview.noAssessmentsReady}
                  </Alert>
                ) : (
                  <List>
                    {readyForCommittee.map((assessment: any) => {
                      const employee = users.find(
                        (u: any) => u.id === assessment.employee_id
                      );

                      return (
                        <ListItem
                          key={assessment.id}
                          button
                          onClick={() => setSelectedAssessment(assessment)}
                          selected={selectedAssessment?.id === assessment.id}
                        >
                          <ListItemIcon>
                            <GroupIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${employee?.firstName} ${employee?.lastName}`}
                            secondary={`${employee?.position} - ${employee?.department}`}
                          />
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="flex-end"
                          >
                            <Chip
                              label={getGradeName(
                                assessment.target_grade,
                                gradeExpectations
                              )}
                              color={getGradeColor(assessment.target_grade)}
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                            <Chip
                              label={ru.committeeReview.peerReviewsComplete}
                              color="success"
                              size="small"
                            />
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Committee Review Form */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.committeeReview.committeeReviewForm}
                </Typography>
                {selectedAssessment ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Обзор:{" "}
                      {(() => {
                        const employee = users.find(
                          (u: any) => u.id === selectedAssessment.employee_id
                        );
                        return `${employee?.firstName} ${employee?.lastName}`;
                      })()}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Stepper activeStep={activeStep} orientation="vertical">
                      <Step>
                        <StepLabel>{ru.selfAssessment.step1}</StepLabel>
                        <StepContent>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>{ru.selfAssessment.currentGrade}:</strong>{" "}
                            {getGradeName(
                              selectedAssessment.current_grade,
                              gradeExpectations
                            )}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>{ru.selfAssessment.targetGrade}:</strong>{" "}
                            {selectedAssessment.target_grade}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>
                              {ru.selfAssessment.achievementsCategory}:
                            </strong>{" "}
                            {selectedAssessment.achievements_category}
                          </Typography>
                          <Button
                            variant="outlined"
                            onClick={() => setActiveStep(1)}
                            sx={{ mt: 1 }}
                          >
                            Continue
                          </Button>
                        </StepContent>
                      </Step>

                      <Step>
                        <StepLabel>Review Content</StepLabel>
                        <StepContent>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 2,
                              p: 2,
                              bgcolor: "grey.50",
                              borderRadius: 1,
                            }}
                          >
                            <strong>Achievements:</strong>{" "}
                            {selectedAssessment.achievements ||
                              "No achievements recorded"}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 2,
                              p: 2,
                              bgcolor: "grey.50",
                              borderRadius: 1,
                            }}
                          >
                            <strong>Self Evaluation:</strong>{" "}
                            {selectedAssessment.self_evaluation ||
                              "No self evaluation recorded"}
                          </Typography>
                          <Button
                            variant="outlined"
                            onClick={() => setActiveStep(2)}
                            sx={{ mt: 1 }}
                          >
                            Continue
                          </Button>
                        </StepContent>
                      </Step>

                      <Step>
                        <StepLabel>Решение комитета</StepLabel>
                        <StepContent>
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Решение комитета</InputLabel>
                            <Select
                              value={committeeData.decision}
                              onChange={(e) =>
                                setCommitteeData((prev) => ({
                                  ...prev,
                                  decision: e.target.value,
                                }))
                              }
                              label="Решение комитета"
                            >
                              <MenuItem value="approved">
                                {ru.committeeReview.approved}
                              </MenuItem>
                              <MenuItem value="rejected">
                                {ru.committeeReview.rejected}
                              </MenuItem>
                              <MenuItem value="conditional">
                                Условное одобрение
                              </MenuItem>
                              <MenuItem value="pending">
                                {ru.status.pendingFurtherReview}
                              </MenuItem>
                            </Select>
                          </FormControl>

                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Решение по итоговому уровню</InputLabel>
                            <Select
                              value={committeeData.final_grade}
                              onChange={(e) =>
                                setCommitteeData((prev) => ({
                                  ...prev,
                                  final_grade: e.target.value,
                                }))
                              }
                              label="Решение по итоговому уровню"
                            >
                              <MenuItem value="">
                                Оставить целевой уровень
                              </MenuItem>
                              {Object.values(GradeLevel).map((grade) => (
                                <MenuItem key={grade} value={grade}>
                                  {grade}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Комментарии комитета"
                            value={committeeData.comments}
                            onChange={(e) =>
                              setCommitteeData((prev) => ({
                                ...prev,
                                comments: e.target.value,
                              }))
                            }
                            placeholder="Предоставьте окончательное решение комитета и обоснование..."
                            sx={{ mb: 2 }}
                          />

                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Рекомендации"
                            value={committeeData.recommendations}
                            onChange={(e) =>
                              setCommitteeData((prev) => ({
                                ...prev,
                                recommendations: e.target.value,
                              }))
                            }
                            placeholder="Предоставьте рекомендации для будущего развития..."
                            sx={{ mb: 2 }}
                          />

                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCommitteeReviewSubmit}
                            disabled={!committeeData.comments.trim()}
                            sx={{ mr: 1 }}
                          >
                            {ru.committeeReview.submitCommitteeDecision}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => setActiveStep(1)}
                          >
                            {ru.common.back}
                          </Button>
                        </StepContent>
                      </Step>
                    </Stepper>
                  </Box>
                ) : (
                  <Alert severity="info">
                    {ru.committeeReview.selectAssessment}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Completed Committee Reviews */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {ru.committeeReview.completedCommitteeReviews}
          </Typography>
          {completedCommitteeReviews.length === 0 ? (
            <Alert severity="info">
              {ru.committeeReview.noCompletedReviews}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {completedCommitteeReviews.map((decision: any) => {
                const assessment = assessments.find(
                  (a: any) => a.id === decision.self_assessment_id
                );
                const employee = users.find(
                  (u: any) => u.id === assessment?.employee_id
                );

                return (
                  <Grid item xs={12} md={6} key={decision.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Typography variant="h6">
                            {employee
                              ? `${employee.firstName} ${employee.lastName}`
                              : "Unknown Employee"}
                          </Typography>
                          <Chip
                            label={decision.decision}
                            color={getDecisionColor(decision.decision)}
                            size="small"
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {employee?.position} - {employee?.department}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>{ru.committeeReview.finalGrade}:</strong>{" "}
                          {decision.final_grade}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>{ru.common.comments}:</strong>{" "}
                          {decision.comments}
                        </Typography>
                        {decision.recommendations && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>
                              {ru.committeeReview.recommendations}:
                            </strong>{" "}
                            {decision.recommendations}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          {ru.committeeReview.decisionMadeOn}:{" "}
                          {formatDate(decision.decision_date)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default CommitteeReview;
