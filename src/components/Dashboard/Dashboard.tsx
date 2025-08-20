import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  RateReview as ReviewIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Grade as GradeIcon,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  useGetSelfAssessmentsQuery,
  useGetUsersQuery,
  useGetManagerReviewsQuery,
  useGetPeerReviewsQuery,
  useGetReviewCyclesQuery,
  useGetNotificationsQuery,
  useGetCommitteeDecisionsQuery,
  useGetGradeExpectationsQuery,
  useCreateReviewCycleMutation,
  useCreateNotificationMutation,
} from "../../services/api";
import { AssessmentStatus, GradeLevel, UserRole } from "../../types";
import { getGradeName, getGradeColor } from "../../utils/gradeUtils";
import { formatDate, formatDateRange } from "../../utils/dateUtils";
import { ru } from "../../utils/translations";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeReviewCycle, setActiveReviewCycle] = useState<any>(null);
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [showCreateNotification, setShowCreateNotification] = useState(false);
  const [newCycleData, setNewCycleData] = useState({
    cycleName: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [newNotificationData, setNewNotificationData] = useState({
    type: "general",
    title: "",
    message: "",
    targetRole: "all",
  });

  const { data: assessments = [], isLoading: assessmentsLoading } =
    useGetSelfAssessmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: managerReviews = [] } = useGetManagerReviewsQuery();
  const { data: peerReviewers = [] } = useGetPeerReviewsQuery();
  const { data: reviewCycles = [] } = useGetReviewCyclesQuery();
  const { data: notifications = [] } = useGetNotificationsQuery();
  const { data: committeeDecisions = [] } = useGetCommitteeDecisionsQuery();
  const { data: gradeExpectations = [] } = useGetGradeExpectationsQuery();

  const [createReviewCycle] = useCreateReviewCycleMutation();
  const [createNotification] = useCreateNotificationMutation();

  useEffect(() => {
    if (reviewCycles.length > 0) {
      const active = reviewCycles.find(
        (cycle: any) => cycle.status === "active"
      );
      setActiveReviewCycle(active);
    }
  }, [reviewCycles]);

  const handleCreateReviewCycle = async () => {
    try {
      await createReviewCycle({
        ...newCycleData,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).unwrap();
      setShowCreateCycle(false);
      setNewCycleData({
        cycleName: "",
        startDate: "",
        endDate: "",
        description: "",
      });
    } catch (error) {
      console.error("Failed to create review cycle:", error);
    }
  };

  const handleCreateNotification = async () => {
    try {
      await createNotification({
        ...newNotificationData,
        isRead: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).unwrap();
      setShowCreateNotification(false);
      setNewNotificationData({
        type: "general",
        title: "",
        message: "",
        targetRole: "all",
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  };

  const handleDeleteReviewCycle = async (cycleId: string) => {
    if (window.confirm("Are you sure you want to delete this review cycle?")) {
      try {
        // For now, just show a message since we don't have delete mutation
        alert("Delete functionality not implemented yet");
      } catch (error) {
        console.error("Failed to delete review cycle:", error);
      }
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      try {
        // For now, just show a message since we don't have delete mutation
        alert("Delete functionality not implemented yet");
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case AssessmentStatus.SUBMITTED:
        return "info";
      case AssessmentStatus.UNDER_REVIEW:
        return "warning";
      case AssessmentStatus.COMPLETED:
        return "success";
      case AssessmentStatus.DRAFT:
        return "default";
      default:
        return "default";
    }
  };

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

  // Role-based statistics
  let roleStats: any = {};
  if (user?.role === UserRole.EMPLOYEE) {
    const userAssessments = assessments.filter(
      (a: any) => a.employee_id === user.id
    );
    roleStats = {
      totalAssessments: userAssessments.length,
      submittedAssessments: userAssessments.filter(
        (a: any) => a.status === AssessmentStatus.SUBMITTED
      ).length,
      completedAssessments: userAssessments.filter(
        (a: any) => a.status === AssessmentStatus.COMPLETED
      ).length,
      pendingReviews: userAssessments.filter(
        (a: any) => a.status === AssessmentStatus.UNDER_REVIEW
      ).length,
    };
  } else if (user?.role === UserRole.COMMITTEE_MEMBER) {
    const userCommitteeDecisions = committeeDecisions.filter(
      (d: any) => d.committee_id === user.id
    );
    roleStats = {
      totalDecisions: userCommitteeDecisions.length,
      approvedDecisions: userCommitteeDecisions.filter(
        (d: any) => d.decision === "approved"
      ).length,
      rejectedDecisions: userCommitteeDecisions.filter(
        (d: any) => d.decision === "rejected"
      ).length,
      pendingReviews: assessments.filter(
        (a: any) =>
          a.status === AssessmentStatus.SUBMITTED &&
          peerReviewers.some(
            (r: any) =>
              r.self_assessment_id === a.id && r.status === "confirmed"
          )
      ).length,
    };
  } else if (user?.role === UserRole.HR || user?.role === UserRole.ADMIN) {
    roleStats = {
      totalEmployees: users.length,
      totalAssessments: assessments.length,
      activeReviewCycle: activeReviewCycle ? "Yes" : "No",
      pendingReviews: assessments.filter(
        (a: any) => a.status === AssessmentStatus.SUBMITTED
      ).length,
      completedReviews: assessments.filter(
        (a: any) => a.status === AssessmentStatus.COMPLETED
      ).length,
      systemHealth: "Good",
    };
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Добро пожаловать, {user?.firstName || "Пользователь"}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {user?.role?.toUpperCase()} {ru.dashboard.title} - Система Оценки
          Производительности
        </Typography>
        {activeReviewCycle && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {ru.dashboard.activeReviewCycle}: {activeReviewCycle.cycleName}(
            {formatDateRange(
              activeReviewCycle.startDate,
              activeReviewCycle.endDate
            )}
            )
          </Alert>
        )}
      </Box>

      {/* Role-based Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {user?.role === UserRole.EMPLOYEE && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {ru.dashboard.totalAssessments}
                  </Typography>
                  <Typography variant="h4">
                    {roleStats.totalAssessments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {ru.reviewList.submitted}
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {roleStats.submittedAssessments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {ru.common.completed}
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {roleStats.completedAssessments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {ru.dashboard.pendingReviews}
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {roleStats.pendingReviews}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {user?.role === UserRole.COMMITTEE_MEMBER && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Всего решений
                  </Typography>
                  <Typography variant="h4">
                    {roleStats.totalDecisions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {ru.committeeReview.approved}
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {roleStats.approvedDecisions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {ru.committeeReview.rejected}
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {roleStats.rejectedDecisions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {ru.dashboard.pendingReviews}
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {roleStats.pendingReviews}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {(user?.role === UserRole.HR || user?.role === UserRole.ADMIN) && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Employees
                  </Typography>
                  <Typography variant="h4">
                    {roleStats.totalEmployees}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Assessments
                  </Typography>
                  <Typography variant="h4">
                    {roleStats.totalAssessments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active Cycle
                  </Typography>
                  <Typography
                    variant="h4"
                    color={
                      roleStats.activeReviewCycle === "Yes"
                        ? "success.main"
                        : "error.main"
                    }
                  >
                    {roleStats.activeReviewCycle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    System Health
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {roleStats.systemHealth}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Quick Actions
          </Typography>
        </Grid>

        {user?.role === UserRole.EMPLOYEE && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Self Assessment
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Create or update your performance assessment
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate("/self-assessment")}
                    fullWidth
                  >
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Peer Reviews
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Review assessments from your colleagues
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ReviewIcon />}
                    onClick={() => navigate("/peer-review")}
                    fullWidth
                  >
                    View Reviews
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Profile
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Update your profile information
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate("/profile")}
                    fullWidth
                  >
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {user?.role === UserRole.COMMITTEE_MEMBER && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Committee Review
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Make final decisions on assessments
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<GroupIcon />}
                    onClick={() => navigate("/committee-review")}
                    fullWidth
                  >
                    Review Assessments
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Self Assessment
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Complete your own assessment
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate("/self-assessment")}
                    fullWidth
                  >
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Peer Reviews
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Review assessments from colleagues
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ReviewIcon />}
                    onClick={() => navigate("/peer-review")}
                    fullWidth
                  >
                    View Reviews
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {(user?.role === UserRole.HR || user?.role === UserRole.ADMIN) && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Review Management
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Manage all performance reviews
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ReviewIcon />}
                    onClick={() => navigate("/reviews")}
                    fullWidth
                  >
                    Manage Reviews
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Employee Directory
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    View and manage all employees
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate("/employees")}
                    fullWidth
                  >
                    View Employees
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Review Cycles
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Manage review cycles and periods
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ScheduleIcon />}
                    onClick={() => setShowCreateCycle(true)}
                    fullWidth
                  >
                    Manage Cycles
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Recent Notifications */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h5">Recent Notifications</Typography>
            {(user?.role === UserRole.HR || user?.role === UserRole.ADMIN) && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateNotification(true)}
              >
                Create Notification
              </Button>
            )}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              {notifications.length === 0 ? (
                <Typography color="text.secondary">No notifications</Typography>
              ) : (
                <List>
                  {notifications.slice(0, 5).map((notification: any) => (
                    <ListItem key={notification.id}>
                      <ListItemIcon>
                        <NotificationsIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.title}
                        secondary={notification.message}
                      />
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={notification.type}
                          size="small"
                          color="primary"
                        />
                        {(user?.role === UserRole.HR ||
                          user?.role === UserRole.ADMIN) && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => {
                                // updateNotification functionality not implemented yet
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteNotification(notification.id)
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* HR/Admin Management Section */}
      {(user?.role === UserRole.HR || user?.role === UserRole.ADMIN) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              System Management
            </Typography>
          </Grid>

          {/* Review Cycles Management */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">Review Cycles</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCreateCycle(true)}
                  >
                    New Cycle
                  </Button>
                </Box>
                {reviewCycles.length === 0 ? (
                  <Typography color="text.secondary">
                    No review cycles
                  </Typography>
                ) : (
                  <List>
                    {reviewCycles.map((cycle: any) => (
                      <ListItem key={cycle.id}>
                        <ListItemIcon>
                          <ScheduleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={cycle.cycleName}
                          secondary={`${formatDateRange(
                            cycle.startDate,
                            cycle.endDate
                          )}`}
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={cycle.status}
                            size="small"
                            color={
                              cycle.status === "active" ? "success" : "default"
                            }
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              // updateReviewCycle functionality not implemented yet
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteReviewCycle(cycle.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* System Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                    <Typography variant="h6">{users.length}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Active Assessments
                    </Typography>
                    <Typography variant="h6">
                      {
                        assessments.filter(
                          (a: any) => a.status === AssessmentStatus.SUBMITTED
                        ).length
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pending Reviews
                    </Typography>
                    <Typography variant="h6">
                      {
                        assessments.filter(
                          (a: any) => a.status === AssessmentStatus.UNDER_REVIEW
                        ).length
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Completed Reviews
                    </Typography>
                    <Typography variant="h6">
                      {
                        assessments.filter(
                          (a: any) => a.status === AssessmentStatus.COMPLETED
                        ).length
                      }
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Create Review Cycle Dialog */}
      <Dialog
        open={showCreateCycle}
        onClose={() => setShowCreateCycle(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Review Cycle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cycle Name"
                value={newCycleData.cycleName}
                onChange={(e) =>
                  setNewCycleData({
                    ...newCycleData,
                    cycleName: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={newCycleData.startDate}
                onChange={(e) =>
                  setNewCycleData({
                    ...newCycleData,
                    startDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={newCycleData.endDate}
                onChange={(e) =>
                  setNewCycleData({ ...newCycleData, endDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={newCycleData.description}
                onChange={(e) =>
                  setNewCycleData({
                    ...newCycleData,
                    description: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateCycle(false)}>Cancel</Button>
          <Button onClick={handleCreateReviewCycle} variant="contained">
            Create Cycle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Notification Dialog */}
      <Dialog
        open={showCreateNotification}
        onClose={() => setShowCreateNotification(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newNotificationData.title}
                onChange={(e) =>
                  setNewNotificationData({
                    ...newNotificationData,
                    title: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message"
                value={newNotificationData.message}
                onChange={(e) =>
                  setNewNotificationData({
                    ...newNotificationData,
                    message: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newNotificationData.type}
                  onChange={(e) =>
                    setNewNotificationData({
                      ...newNotificationData,
                      type: e.target.value,
                    })
                  }
                  label="Type"
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="reminder">Reminder</MenuItem>
                  <MenuItem value="announcement">Announcement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Target Role</InputLabel>
                <Select
                  value={newNotificationData.targetRole}
                  onChange={(e) =>
                    setNewNotificationData({
                      ...newNotificationData,
                      targetRole: e.target.value,
                    })
                  }
                  label="Target Role"
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="employee">Employees</MenuItem>
                  <MenuItem value="manager">Managers</MenuItem>
                  <MenuItem value="committee">Committee Members</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateNotification(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateNotification} variant="contained">
            Create Notification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
