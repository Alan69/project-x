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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  useGetManagerReviewsQuery,
  useSubmitManagerReviewMutation,
} from "../../services/api";
import { AssessmentStatus, GradeLevel, UserRole } from "../../types";

const ManagerReview: React.FC = () => {
  const { user } = useAuth();
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [reviewData, setReviewData] = useState({
    status: "pending",
    comments: "",
    feedback: "",
    recommended_grade: "",
  });
  const [activeStep, setActiveStep] = useState(0);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  const { data: assessments = [], isLoading: assessmentsLoading } =
    useGetSelfAssessmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: managerReviews = [] } = useGetManagerReviewsQuery();

  const [createManagerReview] = useSubmitManagerReviewMutation();

  // Filter assessments that need manager review
  const pendingManagerReviews = assessments.filter((assessment: any) => {
    const hasManagerReview = managerReviews.some(
      (review: any) => review.self_assessment_id === assessment.id
    );
    return (
      assessment.status === AssessmentStatus.SUBMITTED &&
      !hasManagerReview &&
      assessment.employee_id !== user?.id
    );
  });

  // Filter team members (employees who report to this manager)
  const teamMembers = users.filter((u: any) => u.managerId === user?.id);

  // Filter assessments from team members
  const teamAssessments = assessments.filter((assessment: any) =>
    teamMembers.some((member: any) => member.id === assessment.employee_id)
  );

  const completedReviews = managerReviews.filter(
    (review: any) => review.manager_id === user?.id
  );

  const handleReviewSubmit = async () => {
    if (!selectedAssessment || !reviewData.comments.trim()) {
      alert("Please provide comments before submitting the review.");
      return;
    }

    try {
      // Create new review
      await createManagerReview({
        self_assessment_id: selectedAssessment.id,
        manager_id: user?.id,
        status: reviewData.status,
        comments: reviewData.comments,
        feedback: reviewData.feedback,
        recommended_grade: reviewData.recommended_grade,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).unwrap();

      alert("Manager review submitted successfully!");
      setSelectedAssessment(null);
      setReviewData({
        status: "pending",
        comments: "",
        feedback: "",
        recommended_grade: "",
      });
      setActiveStep(0);
      setShowReviewDialog(false);
      setEditingReview(null);
    } catch (error) {
      console.error("Failed to submit manager review:", error);
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
      recommended_grade: review.recommended_grade,
    });
    setEditingReview(review);
    setShowReviewDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
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
    user?.role?.toLowerCase() !== UserRole.MANAGER &&
    user?.role?.toLowerCase() !== UserRole.HR &&
    user?.role?.toLowerCase() !== UserRole.ADMIN
  ) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Alert severity="warning">
          You don't have permission to access Manager Review functionality. Your
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
          Manager Review Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Review and provide feedback on team member assessments
        </Typography>

        {/* Team Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Size
                </Typography>
                <Typography variant="h3" color="primary">
                  {teamMembers.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Direct reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Reviews
                </Typography>
                <Typography variant="h3" color="warning.main">
                  {pendingManagerReviews.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assessments awaiting review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Completed Reviews
                </Typography>
                <Typography variant="h3" color="success.main">
                  {completedReviews.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reviews submitted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Pending Manager Reviews */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Manager Reviews ({pendingManagerReviews.length})
                </Typography>
                {pendingManagerReviews.length === 0 ? (
                  <Alert severity="info">
                    No assessments pending manager review
                  </Alert>
                ) : (
                  <List>
                    {pendingManagerReviews.map((assessment: any) => {
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
                              label={assessment.target_grade}
                              color={getGradeColor(assessment.target_grade)}
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                            <Chip
                              label="Ready for Review"
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

          {/* Team Assessment Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Assessment Status
                </Typography>
                {teamMembers.length === 0 ? (
                  <Alert severity="info">No team members found</Alert>
                ) : (
                  <List>
                    {teamMembers.map((member: any) => {
                      const assessment = assessments.find(
                        (a: any) => a.employee_id === member.id
                      );
                      const review = managerReviews.find(
                        (r: any) => r.self_assessment_id === assessment?.id
                      );

                      return (
                        <ListItem key={member.id}>
                          <ListItemIcon>
                            <Avatar>
                              {member.firstName?.charAt(0)}
                              {member.lastName?.charAt(0)}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={`${member.firstName} ${member.lastName}`}
                            secondary={`${member.position} - ${member.department}`}
                          />
                          <Box display="flex" alignItems="center" gap={1}>
                            {assessment ? (
                              <>
                                <Chip
                                  label={assessment.status}
                                  color={getStatusColor(assessment.status)}
                                  size="small"
                                />
                                {review && (
                                  <Chip
                                    label={review.status}
                                    color={getStatusColor(review.status)}
                                    size="small"
                                  />
                                )}
                              </>
                            ) : (
                              <Chip
                                label="No Assessment"
                                color="default"
                                size="small"
                              />
                            )}
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

        {/* Completed Reviews */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Completed Reviews
          </Typography>
          {completedReviews.length === 0 ? (
            <Alert severity="info">No completed reviews yet</Alert>
          ) : (
            <Grid container spacing={2}>
              {completedReviews.map((review: any) => {
                const assessment = assessments.find(
                  (a: any) => a.id === review.self_assessment_id
                );
                const employee = users.find(
                  (u: any) => u.id === assessment?.employee_id
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
                            <IconButton
                              size="small"
                              onClick={() => handleEditReview(review)}
                            >
                              <EditIcon />
                            </IconButton>
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
                        {review.recommended_grade && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Recommended Grade:</strong>{" "}
                            <Chip
                              label={review.recommended_grade}
                              color={getGradeColor(review.recommended_grade)}
                              size="small"
                            />
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          Review submitted on:{" "}
                          {new Date(review.created_at).toLocaleDateString()}
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
          {editingReview ? "Edit Manager Review" : "Submit Manager Review"}
        </DialogTitle>
        <DialogContent>
          {selectedAssessment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Reviewing:{" "}
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
                  <StepLabel>Assessment Overview</StepLabel>
                  <StepContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Current Grade:</strong>{" "}
                      {selectedAssessment.current_grade}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Target Grade:</strong>{" "}
                      {selectedAssessment.target_grade}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Achievements Category:</strong>{" "}
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
                  <StepLabel>Manager Decision</StepLabel>
                  <StepContent>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Review Decision</InputLabel>
                      <Select
                        value={reviewData.status}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        label="Review Decision"
                      >
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="pending">
                          Pending Further Review
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Recommended Grade</InputLabel>
                      <Select
                        value={reviewData.recommended_grade}
                        onChange={(e) =>
                          setReviewData((prev) => ({
                            ...prev,
                            recommended_grade: e.target.value,
                          }))
                        }
                        label="Recommended Grade"
                      >
                        <MenuItem value="">Keep Target Grade</MenuItem>
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
                      label="Manager Comments"
                      value={reviewData.comments}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          comments: e.target.value,
                        }))
                      }
                      placeholder="Provide your assessment and decision..."
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Development Feedback"
                      value={reviewData.feedback}
                      onChange={(e) =>
                        setReviewData((prev) => ({
                          ...prev,
                          feedback: e.target.value,
                        }))
                      }
                      placeholder="Provide feedback for employee development..."
                      sx={{ mb: 2 }}
                    />

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleReviewSubmit}
                      disabled={!reviewData.comments.trim()}
                      sx={{ mr: 1 }}
                    >
                      {editingReview ? "Update Review" : "Submit Review"}
                    </Button>
                    <Button variant="outlined" onClick={() => setActiveStep(1)}>
                      Back
                    </Button>
                  </StepContent>
                </Step>
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReviewDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagerReview;
