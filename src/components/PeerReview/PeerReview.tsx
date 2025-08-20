import React, { useState, useEffect } from "react";
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
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import {
  Person as PersonIcon,
  Grade as GradeIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  RateReview as ReviewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import {
  useGetSelfAssessmentsQuery,
  useGetUsersQuery,
  useGetPeerReviewsQuery,
  useGetGradeExpectationsQuery,
  useGetCommitteeDecisionsQuery,
  useSubmitPeerReviewMutation,
} from "../../services/api";
import { AssessmentStatus, GradeLevel, UserRole } from "../../types";
import { getGradeName, getGradeColor } from "../../utils/gradeUtils";
import { formatDate } from "../../utils/dateUtils";
import { ru } from "../../utils/translations";

const PeerReview: React.FC = () => {
  const { user } = useAuth();
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [reviewData, setReviewData] = useState({
    status: "confirmed", // Changed from "pending" to "confirmed" as default
    comments: "",
    feedback: "",
    grade_confirmation: "",
  });
  const [activeStep, setActiveStep] = useState(0);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  const { data: assessments = [], isLoading: assessmentsLoading } =
    useGetSelfAssessmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: peerReviews = [] } = useGetPeerReviewsQuery();
  const { data: gradeExpectations = [] } = useGetGradeExpectationsQuery();
  const { data: committeeDecisions = [] } = useGetCommitteeDecisionsQuery();

  const [submitPeerReview] = useSubmitPeerReviewMutation();

  // Filter assessments that need peer review (submitted status)
  const pendingPeerReviews = assessments.filter((assessment: any) => {
    // Show assessments that are submitted and need peer review
    // Also check if this user hasn't already reviewed this assessment
    const hasAlreadyReviewed = peerReviews.some(
      (review: any) =>
        review.self_assessment_id === assessment.id &&
        review.reviewer_id === user?.id
    );

    // Check if committee has completed this assessment
    const hasCommitteeDecision = committeeDecisions.some(
      (decision: any) => decision.self_assessment_id === assessment.id
    );

    return (
      assessment.status === AssessmentStatus.SUBMITTED &&
      !hasAlreadyReviewed &&
      !hasCommitteeDecision && // Don't show assessments completed by committee
      assessment.employee_id !== user?.id // Don't show user's own assessments
    );
  });

  // Filter assessments that this user has already reviewed
  // Include both peer reviews submitted by this user AND assessments completed by committee
  const userPeerReviews = peerReviews.filter(
    (review: any) => review.reviewer_id === user?.id
  );

  // Get assessments where committee has made a decision AND this user was involved as peer reviewer
  const completedAssessmentsByCommittee = assessments.filter(
    (assessment: any) => {
      const hasCommitteeDecision = committeeDecisions.some(
        (decision: any) => decision.self_assessment_id === assessment.id
      );
      const userWasPeerReviewer = peerReviews.some(
        (review: any) =>
          review.self_assessment_id === assessment.id &&
          review.reviewer_id === user?.id
      );
      return hasCommitteeDecision && userWasPeerReviewer;
    }
  );

  // Combine both types of completed reviews for display
  // Show all peer reviews by this user (both completed and committee-finalized)
  const completedPeerReviews = userPeerReviews;

  // Debug logging
  console.log("=== PEER REVIEW DEBUG ===");
  console.log("Current user ID:", user?.id);
  console.log("All peer reviews:", peerReviews);
  console.log("User peer reviews:", userPeerReviews);
  console.log("Committee decisions:", committeeDecisions);
  console.log(
    "Completed assessments by committee:",
    completedAssessmentsByCommittee
  );
  console.log(
    "Final completed peer reviews count:",
    completedPeerReviews.length
  );

  // Filter assessments where this user can request peer reviews
  const myAssessments = assessments.filter(
    (assessment: any) => assessment.employee_id === user?.id
  );

  const handleReviewSubmit = async () => {
    if (!selectedAssessment || !reviewData.comments.trim()) {
      alert("Please provide comments before submitting the review.");
      return;
    }

    try {
      // Calculate review order based on existing reviews for this assessment
      const existingReviews = peerReviews.filter(
        (review: any) => review.self_assessment_id === selectedAssessment.id
      );
      const reviewOrder = existingReviews.length + 1;

      // Submit peer review
      await submitPeerReview({
        self_assessment_id: selectedAssessment.id,
        peer_reviewer_id: user?.id, // This will be mapped to reviewer_id in the API
        review_order: reviewOrder, // Add required review_order field
        status: reviewData.status,
        feedback: reviewData.comments, // Map comments to feedback field
        review_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }).unwrap();

      alert("Peer review submitted successfully!");
      setSelectedAssessment(null);
      setReviewData({
        status: "pending",
        comments: "",
        feedback: "",
        grade_confirmation: "",
      });
      setActiveStep(0);
      setShowReviewDialog(false);
      setEditingReview(null);
    } catch (error) {
      console.error("Failed to submit peer review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const handleEditReview = (review: any) => {
    const assessment = assessments.find(
      (a: any) => a.id === review.self_assessment_id
    );
    setSelectedAssessment(assessment);
    setReviewData({
      status: review.status,
      comments: review.comments,
      feedback: review.feedback,
      grade_confirmation: review.grade_confirmation,
    });
    setEditingReview(review);
    setShowReviewDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
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
    user?.role?.toLowerCase() !== UserRole.EMPLOYEE &&
    user?.role?.toLowerCase() !== UserRole.MANAGER &&
    user?.role?.toLowerCase() !== UserRole.HR &&
    user?.role?.toLowerCase() !== UserRole.ADMIN &&
    user?.role?.toLowerCase() !== UserRole.COMMITTEE_MEMBER
  ) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Alert severity="warning">
          You don't have permission to access Peer Review functionality. Your
          current role is: {user?.role || "Unknown"}
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

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {ru.peerReview.dashboard}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {ru.peerReview.subtitle}
        </Typography>

        {/* Overview Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.dashboard.pendingReviews}
                </Typography>
                <Typography variant="h3" color="warning.main">
                  {pendingPeerReviews.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Оценки, ожидающие обзора
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.dashboard.completedReviews}
                </Typography>
                <Typography variant="h3" color="success.main">
                  {completedPeerReviews.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Отправленные обзоры
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.dashboard.myAssessments}
                </Typography>
                <Typography variant="h3" color="info.main">
                  {myAssessments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ваши оценки
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Всего запросов
                </Typography>
                <Typography variant="h3" color="primary">
                  {pendingPeerReviews.length + completedPeerReviews.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего запросов на коллегиальный обзор
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Pending Peer Reviews */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.peerReview.pendingReviews} ({pendingPeerReviews.length})
                </Typography>
                {pendingPeerReviews.length === 0 ? (
                  <Alert severity="info">
                    {ru.peerReview.noAssessmentsPending}
                  </Alert>
                ) : (
                  <List>
                    {pendingPeerReviews.map((assessment: any) => {
                      const employee = users.find(
                        (u: any) => u.id === assessment.employee_id
                      );

                      return (
                        <ListItem
                          key={assessment.id}
                          button
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setShowReviewDialog(true);
                            setEditingReview(null);
                          }}
                        >
                          <ListItemIcon>
                            <Avatar>
                              {employee?.firstName?.charAt(0)}
                              {employee?.lastName?.charAt(0)}
                            </Avatar>
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
                              label={ru.peerReview.readyForReview}
                              color="warning"
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

          {/* My Assessment Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.peerReview.myAssessmentStatus}
                </Typography>
                {myAssessments.length === 0 ? (
                  <Alert severity="info">
                    {ru.selfAssessment.noAssessments}
                  </Alert>
                ) : (
                  <List>
                    {myAssessments.map((assessment: any) => {
                      const assessmentPeerReviews = peerReviews.filter(
                        (r: any) => r.self_assessment_id === assessment.id
                      );

                      return (
                        <ListItem key={assessment.id}>
                          <ListItemIcon>
                            <AssessmentIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Assessment - ${assessment.achievements_category}`}
                            secondary={`Status: ${assessment.status}`}
                          />
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={assessment.status}
                              color={getStatusColor(assessment.status)}
                              size="small"
                            />
                            <Chip
                              label={`${
                                assessmentPeerReviews.length
                              } ${ru.peerReview.title.toLowerCase()}`}
                              color="info"
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
        </Grid>

        {/* Completed Peer Reviews */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {ru.peerReview.completedReviews}
          </Typography>
          {completedPeerReviews.length === 0 &&
          completedAssessmentsByCommittee.length === 0 ? (
            <Alert severity="info">{ru.peerReview.noCompletedReviews}</Alert>
          ) : (
            <Grid container spacing={2}>
              {/* Show peer reviews submitted by this user */}
              {completedPeerReviews.map((review: any) => {
                const assessment = assessments.find(
                  (a: any) => a.id === review.self_assessment_id
                );
                const employee = users.find(
                  (u: any) => u.id === assessment?.employee_id
                );

                // Check if committee has completed this assessment
                const committeeDecision = committeeDecisions.find(
                  (decision: any) =>
                    decision.self_assessment_id === assessment?.id
                );

                return (
                  <Grid item xs={12} md={6} key={review.id}>
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
                          <Box display="flex" gap={1}>
                            <Chip
                              label={review.status}
                              color={getStatusColor(review.status)}
                              size="small"
                            />
                            {committeeDecision && (
                              <Chip
                                label={`Committee: ${committeeDecision.decision}`}
                                color={
                                  committeeDecision.decision === "approved"
                                    ? "success"
                                    : "error"
                                }
                                size="small"
                              />
                            )}
                            {!committeeDecision && (
                              <IconButton
                                size="small"
                                onClick={() => handleEditReview(review)}
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {employee?.position} - {employee?.department}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Comments:</strong> {review.comments}
                        </Typography>
                        {review.feedback && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Feedback:</strong> {review.feedback}
                          </Typography>
                        )}
                        {review.grade_confirmation && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Grade Confirmation:</strong>{" "}
                            <Chip
                              label={review.grade_confirmation}
                              color={getGradeColor(review.grade_confirmation)}
                              size="small"
                            />
                          </Typography>
                        )}
                        {committeeDecision && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Final Grade:</strong>{" "}
                            <Chip
                              label={getGradeName(
                                committeeDecision.final_grade,
                                gradeExpectations
                              )}
                              color={getGradeColor(
                                committeeDecision.final_grade
                              )}
                              size="small"
                            />
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          Review submitted on: {formatDate(review.created_at)}
                          {committeeDecision && (
                            <span>
                              {" "}
                              • Committee decision:{" "}
                              {formatDate(committeeDecision.decision_date)}
                            </span>
                          )}
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

      {/* Review Dialog */}
      <Dialog
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingReview
            ? ru.peerReview.editPeerReview
            : ru.peerReview.submitPeerReview}
        </DialogTitle>
        <DialogContent>
          {selectedAssessment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {ru.peerReview.reviewing}:{" "}
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
                      <strong>{ru.selfAssessment.achievementsCategory}:</strong>{" "}
                      {selectedAssessment.achievements_category}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(1)}
                      sx={{ mt: 1 }}
                    >
                      {ru.selfAssessment.continue}
                    </Button>
                  </StepContent>
                </Step>

                <Step>
                  <StepLabel>{ru.selfAssessment.step2}</StepLabel>
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
                      <strong>{ru.selfAssessment.achievements}:</strong>{" "}
                      {selectedAssessment.achievements ||
                        "Достижения не записаны"}
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
                      <strong>{ru.selfAssessment.selfEvaluation}:</strong>{" "}
                      {selectedAssessment.self_evaluation ||
                        "Самооценка не записана"}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(2)}
                      sx={{ mt: 1 }}
                    >
                      {ru.selfAssessment.continue}
                    </Button>
                  </StepContent>
                </Step>

                <Step>
                  <StepLabel>{ru.selfAssessment.step3}</StepLabel>
                  <StepContent>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Решение обзора</InputLabel>
                      <Select
                        value={reviewData.status}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        label="Решение обзора"
                      >
                        <MenuItem value="confirmed">
                          {ru.status.confirmed}
                        </MenuItem>
                        <MenuItem value="rejected">
                          {ru.status.rejected}
                        </MenuItem>
                        <MenuItem value="pending">
                          {ru.status.pendingFurtherReview}
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>
                        {ru.selfAssessment.gradeConfirmation}
                      </InputLabel>
                      <Select
                        value={reviewData.grade_confirmation}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            grade_confirmation: e.target.value,
                          }))
                        }
                        label={ru.selfAssessment.gradeConfirmation}
                      >
                        <MenuItem value="">
                          {ru.selfAssessment.noGradeChange}
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
                      label={ru.selfAssessment.peerReviewComments}
                      value={reviewData.comments}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          comments: e.target.value,
                        }))
                      }
                      placeholder={ru.selfAssessment.provideAssessment}
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={ru.selfAssessment.developmentFeedback}
                      value={reviewData.feedback}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          feedback: e.target.value,
                        }))
                      }
                      placeholder={ru.selfAssessment.provideFeedback}
                      sx={{ mb: 2 }}
                    />

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleReviewSubmit}
                      disabled={!reviewData.comments.trim()}
                      sx={{ mr: 1 }}
                    >
                      {editingReview
                        ? ru.peerReview.updateReview
                        : ru.peerReview.submitReview}
                    </Button>
                    <Button variant="outlined" onClick={() => setActiveStep(1)}>
                      {ru.common.back}
                    </Button>
                  </StepContent>
                </Step>
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReviewDialog(false)}>
            {ru.common.cancel}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PeerReview;
