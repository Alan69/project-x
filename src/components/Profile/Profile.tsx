import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Grade as GradeIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assessment as AssessmentIcon,
  RateReview as ReviewIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import {
  useGetSelfAssessmentsQuery,
  useGetManagerReviewsQuery,
  useGetPeerReviewsQuery,
  useGetCommitteeDecisionsQuery,
  useGetGradeExpectationsQuery,
} from "../../services/api";
import { AssessmentStatus, GradeLevel, UserRole } from "../../types";
import { getGradeName, getGradeColor } from "../../utils/gradeUtils";
import { formatDate } from "../../utils/dateUtils";
import { ru } from "../../utils/translations";

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: assessments = [] } = useGetSelfAssessmentsQuery();
  const { data: managerReviews = [] } = useGetManagerReviewsQuery();
  const { data: peerReviews = [] } = useGetPeerReviewsQuery();
  const { data: committeeDecisions = [] } = useGetCommitteeDecisionsQuery();
  const { data: gradeExpectations = [] } = useGetGradeExpectationsQuery();

  useEffect(() => {
    if (user) {
      setEditData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        position: user.position || "",
        department: user.department || "",
        currentGrade: user.currentGrade || "",
        hireDate: user.hireDate || "",
      });
    }
  }, [user]);

  // Get user statistics
  const getUserStats = () => {
    if (!user) return null;

    const userAssessments = assessments.filter(
      (a: any) => a.employee_id === user.id
    );
    const userManagerReviews = managerReviews.filter(
      (r: any) => r.manager_id === user.id
    );
    const userPeerReviews = peerReviews.filter(
      (r: any) => r.peer_reviewer_id === user.id
    );
    const userCommitteeDecisions = committeeDecisions.filter(
      (d: any) => d.committee_id === user.id
    );

    return {
      totalAssessments: userAssessments.length,
      submittedAssessments: userAssessments.filter(
        (a: any) => a.status === AssessmentStatus.SUBMITTED
      ).length,
      completedAssessments: userAssessments.filter(
        (a: any) => a.status === AssessmentStatus.COMPLETED
      ).length,
      pendingAssessments: userAssessments.filter(
        (a: any) => a.status === AssessmentStatus.UNDER_REVIEW
      ).length,
      managerReviews: userManagerReviews.length,
      peerReviews: userPeerReviews.length,
      committeeDecisions: userCommitteeDecisions.length,
    };
  };

  // Get user's manager
  const getUserManager = () => {
    if (!user?.managerId) return "No Manager Assigned";
    // In a real app, you'd fetch the manager's details
    return "Manager Name"; // Placeholder
  };

  const handleEditProfile = () => {
    setShowEditDialog(true);
  };

  const handleSaveProfile = async () => {
    try {
      // In a real app, you'd call an API to update the user profile
      // For now, we'll just update the local state
      if (updateUser) {
        await updateUser(editData);
      }
      setIsEditing(false);
      setShowEditDialog(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      position: user?.position || "",
      department: user?.department || "",
      currentGrade: user?.currentGrade || "",
      hireDate: user?.hireDate || "",
    });
    setIsEditing(false);
    setShowEditDialog(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "error";
      case UserRole.HR:
        return "warning";
      case UserRole.MANAGER:
        return "info";
      case UserRole.COMMITTEE_MEMBER:
        return "secondary";
      case UserRole.EMPLOYEE:
        return "default";
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

  if (!user) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Alert severity="error">User not authenticated</Alert>
      </Box>
    );
  }

  const stats = getUserStats();

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {ru.profile.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {ru.profile.subtitle}
        </Typography>

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <Typography variant="h6">
                    {ru.profile.personalInformation}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditProfile}
                  >
                    {ru.profile.editProfile}
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ mr: 2, width: 80, height: 80 }}>
                        {user.firstName?.charAt(0)}
                        {user.lastName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h5">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.position}
                        </Typography>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={ru.common.email}
                          secondary={user.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={ru.common.department}
                          secondary={user.department}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <GradeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={ru.selfAssessment.currentGrade}
                          secondary={
                            user.currentGrade ? (
                              <Chip
                                label={getGradeName(
                                  user.currentGrade,
                                  gradeExpectations
                                )}
                                color={getGradeColor(user.currentGrade)}
                                size="small"
                              />
                            ) : (
                              ru.common.notSet
                            )
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={ru.employeeList.hireDate}
                          secondary={
                            user.hireDate
                              ? formatDate(user.hireDate)
                              : ru.common.notSet
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Менеджер"
                          secondary={getUserManager()}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.profile.performanceOverview}
                </Typography>
                {stats && (
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AssessmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Assessments"
                        secondary={stats.totalAssessments}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Completed"
                        secondary={stats.completedAssessments}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PendingIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Under Review"
                        secondary={stats.pendingAssessments}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ReviewIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Manager Reviews"
                        secondary={stats.managerReviews}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <GroupIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Peer Reviews"
                        secondary={stats.peerReviews}
                      />
                    </ListItem>
                    {user.role === UserRole.COMMITTEE_MEMBER && (
                      <ListItem>
                        <ListItemIcon>
                          <GroupIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Committee Decisions"
                          secondary={stats.committeeDecisions}
                        />
                      </ListItem>
                    )}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Activity
          </Typography>
          <Grid container spacing={3}>
            {/* Recent Assessments */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {ru.profile.recentAssessments}
                  </Typography>
                  {stats && stats.totalAssessments > 0 ? (
                    <List dense>
                      {assessments
                        .filter((a: any) => a.employee_id === user.id)
                        .slice(0, 3)
                        .map((assessment: any) => (
                          <ListItem key={assessment.id}>
                            <ListItemIcon>
                              <AssessmentIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${assessment.achievements_category} Assessment`}
                              secondary={`Status: ${
                                assessment.status
                              } - ${formatDate(assessment.created_at)}`}
                            />
                            <Chip
                              label={assessment.status}
                              color={getRoleColor(assessment.status)}
                              size="small"
                            />
                          </ListItem>
                        ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">
                      No assessments yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Reviews */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {ru.profile.recentReviews}
                  </Typography>
                  {(() => {
                    const recentReviews = [];

                    // Add manager reviews
                    if (stats && stats.managerReviews > 0) {
                      const userManagerReviews = managerReviews
                        .filter((r: any) => r.manager_id === user.id)
                        .slice(0, 2);
                      recentReviews.push(
                        ...userManagerReviews.map((r: any) => ({
                          ...r,
                          type: "Manager Review",
                        }))
                      );
                    }

                    // Add peer reviews
                    if (stats && stats.peerReviews > 0) {
                      const userPeerReviews = peerReviews
                        .filter((r: any) => r.peer_reviewer_id === user.id)
                        .slice(0, 2);
                      recentReviews.push(
                        ...userPeerReviews.map((r: any) => ({
                          ...r,
                          type: "Peer Review",
                        }))
                      );
                    }

                    // Sort by date and take first 3
                    const sortedReviews = recentReviews
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .slice(0, 3);

                    return sortedReviews.length > 0 ? (
                      <List dense>
                        {sortedReviews.map((review: any) => (
                          <ListItem key={`${review.type}-${review.id}`}>
                            <ListItemIcon>
                              {review.type === "Manager Review" ? (
                                <ReviewIcon />
                              ) : (
                                <GroupIcon />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={review.type}
                              secondary={`Status: ${
                                review.status
                              } - ${formatDate(review.created_at)}`}
                            />
                            <Chip
                              label={review.status}
                              color={getRoleColor(review.status)}
                              size="small"
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary">
                        No reviews yet
                      </Typography>
                    );
                  })()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={handleCancelEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{ru.profile.editProfile}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={ru.profile.firstName}
                value={editData.firstName}
                onChange={(e) =>
                  setEditData({ ...editData, firstName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={ru.profile.lastName}
                value={editData.lastName}
                onChange={(e) =>
                  setEditData({ ...editData, lastName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={ru.common.email}
                value={editData.email}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
                }
                type="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={ru.common.position}
                value={editData.position}
                onChange={(e) =>
                  setEditData({ ...editData, position: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={ru.common.department}
                value={editData.department}
                onChange={(e) =>
                  setEditData({ ...editData, department: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{ru.selfAssessment.currentGrade}</InputLabel>
                <Select
                  value={editData.currentGrade}
                  onChange={(e) =>
                    setEditData({ ...editData, currentGrade: e.target.value })
                  }
                  label={ru.selfAssessment.currentGrade}
                >
                  <MenuItem value="">Нет уровня</MenuItem>
                  {gradeExpectations.map((grade: any) => (
                    <MenuItem key={grade.grade_level} value={grade.grade_level}>
                      {grade.grade_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label={ru.employeeList.hireDate}
                value={editData.hireDate}
                onChange={(e) =>
                  setEditData({ ...editData, hireDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>{ru.common.cancel}</Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {ru.profile.saveChanges}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
