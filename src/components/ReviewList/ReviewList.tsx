import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
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
  Pagination,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
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
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import {
  useGetSelfAssessmentsQuery,
  useGetUsersQuery,
  useGetPeerReviewsQuery,
  useGetCommitteeDecisionsQuery,
  useGetGradeExpectationsQuery,
  useDeleteSelfAssessmentMutation,
  useUpdateSelfAssessmentMutation,
} from "../../services/api";
import { AssessmentStatus, GradeLevel, UserRole } from "../../types";
import { getGradeName, getGradeColor } from "../../utils/gradeUtils";
import { formatDate } from "../../utils/dateUtils";
import { ru } from "../../utils/translations";

const ReviewList: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(
    null
  );

  const { data: assessments = [], isLoading: assessmentsLoading } =
    useGetSelfAssessmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: peerReviews = [] } = useGetPeerReviewsQuery();
  const { data: committeeDecisions = [] } = useGetCommitteeDecisionsQuery();
  const { data: gradeExpectations = [] } = useGetGradeExpectationsQuery();

  const [deleteAssessment] = useDeleteSelfAssessmentMutation();
  const [updateAssessment] = useUpdateSelfAssessmentMutation();

  // Filter assessments based on search and filters
  const filteredAssessments = assessments.filter((assessment: any) => {
    const employee = users.find((u: any) => u.id === assessment.employee_id);

    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.department?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || assessment.status === statusFilter;

    // Grade filter
    const matchesGrade =
      gradeFilter === "all" ||
      getGradeName(assessment.current_grade, gradeExpectations) ===
        gradeFilter ||
      getGradeName(assessment.target_grade, gradeExpectations) === gradeFilter;

    // Department filter
    const matchesDepartment =
      departmentFilter === "all" || employee?.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesGrade && matchesDepartment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique departments for filter
  const departments = Array.from(
    new Set(users.map((u: any) => u.department).filter(Boolean))
  );

  const handleEditAssessment = (assessment: any) => {
    setSelectedAssessment(assessment);
    setEditData({
      status: assessment.status,
      current_grade: assessment.current_grade,
      target_grade: assessment.target_grade,
      achievements_category: assessment.achievements_category,
    });
    setShowEditDialog(true);
  };

  const handleUpdateAssessment = async () => {
    try {
      if (!selectedAssessment || !selectedAssessment.id) {
        alert("No assessment selected or assessment ID is missing.");
        return;
      }

      // Ensure the ID is explicitly a string, as NocoDB URLs expect string IDs
      const assessmentId = String(selectedAssessment.id);
      const updatePayload = {
        ...editData,
        updated_at: new Date().toISOString(),
      };

      // --- DEBUGGING LOGS ---
      console.log("Attempting to update assessment:");
      console.log("Assessment ID being sent:", assessmentId);
      console.log("Payload being sent:", updatePayload);
      console.log("Selected Assessment object:", selectedAssessment);
      // --- END DEBUGGING LOGS ---

      await updateAssessment({
        id: assessmentId,
        data: updatePayload,
      }).unwrap();

      alert("Assessment updated successfully!");
      setShowEditDialog(false);
      setSelectedAssessment(null);
      setEditData({});
    } catch (error) {
      console.error("Failed to update assessment:", error);
      alert("Failed to update assessment. Please try again.");
    }
  };

  const handleDeleteAssessment = async () => {
    try {
      await deleteAssessment(selectedAssessment.id).unwrap();
      alert("Assessment deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedAssessment(null);
    } catch (error) {
      console.error("Failed to delete assessment:", error);
      alert("Failed to delete assessment. Please try again.");
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

  const getReviewProgress = (assessment: any) => {
    const assessmentPeerReviews = peerReviews.filter(
      (r: any) => r.self_assessment_id === assessment.id
    );
    const hasPeerReviews = assessmentPeerReviews.length > 0;
    const confirmedPeerReviews = assessmentPeerReviews.filter(
      (r: any) => r.status === "confirmed"
    );
    const hasEnoughConfirmedReviews = confirmedPeerReviews.length >= 2;
    const hasCommitteeDecision = committeeDecisions.some(
      (d: any) => d.self_assessment_id === assessment.id
    );

    if (hasCommitteeDecision) return { status: "Completed", color: "success" };
    if (hasEnoughConfirmedReviews)
      return { status: "Committee Review", color: "warning" };
    if (hasPeerReviews) return { status: "Peer Review", color: "info" };
    return { status: "Submitted", color: "default" };
  };

  // Check user permissions
  if (
    user?.role?.toLowerCase() !== UserRole.HR &&
    user?.role?.toLowerCase() !== UserRole.ADMIN &&
    user?.role?.toLowerCase() !== UserRole.COMMITTEE_MEMBER &&
    user?.role?.toLowerCase() !== UserRole.MANAGER
  ) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Alert severity="warning">
          You don't have permission to access Review Management functionality.
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

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {ru.reviewList.reviewManagement}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {ru.reviewList.subtitle}
        </Typography>

        {/* Overview Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.dashboard.totalAssessments}
                </Typography>
                <Typography variant="h3" color="primary">
                  {assessments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ru.common.allAssessments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Отправлено
                </Typography>
                <Typography variant="h3" color="info.main">
                  {
                    assessments.filter(
                      (a: any) => a.status === AssessmentStatus.SUBMITTED
                    ).length
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ru.common.awaitingReview}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  На рассмотрении
                </Typography>
                <Typography variant="h3" color="warning.main">
                  {
                    assessments.filter(
                      (a: any) => a.status === AssessmentStatus.UNDER_REVIEW
                    ).length
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ru.common.inProgress}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ru.common.completed}
                </Typography>
                <Typography variant="h3" color="success.main">
                  {
                    assessments.filter(
                      (a: any) => a.status === AssessmentStatus.COMPLETED
                    ).length
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ru.common.finalized}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {ru.common.filtersAndSearch}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={ru.common.searchByName}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{ru.common.status}</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label={ru.common.status}
                  >
                    <MenuItem value="all">{ru.common.allStatuses}</MenuItem>
                    {Object.values(AssessmentStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{ru.common.grade}</InputLabel>
                  <Select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    label={ru.common.grade}
                  >
                    <MenuItem value="all">{ru.common.allGrades}</MenuItem>
                    {gradeExpectations.map((grade: any) => (
                      <MenuItem
                        key={grade.grade_level}
                        value={grade.grade_name}
                      >
                        {grade.grade_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{ru.common.department}</InputLabel>
                  <Select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    label={ru.common.department}
                  >
                    <MenuItem value="all">{ru.common.allDepartments}</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setGradeFilter("all");
                    setDepartmentFilter("all");
                    setCurrentPage(1);
                  }}
                  fullWidth
                >
                  {ru.common.clearFilters}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Assessment List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Reviews ({filteredAssessments.length})
            </Typography>

            {paginatedAssessments.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No assessments match the current filters
              </Typography>
            ) : (
              <List>
                {paginatedAssessments.map((assessment: any) => {
                  const employee = users.find(
                    (u: any) => u.id === assessment.employee_id
                  );
                  const reviewProgress = getReviewProgress(assessment);

                  return (
                    <React.Fragment key={assessment.id}>
                      <ListItem>
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
                          alignItems="center"
                          gap={1}
                          sx={{ mr: 2 }}
                        >
                          <Chip
                            label={assessment.status}
                            color={getStatusColor(assessment.status)}
                            size="small"
                          />
                          <Chip
                            label={getGradeName(
                              assessment.current_grade,
                              gradeExpectations
                            )}
                            color={getGradeColor(assessment.current_grade)}
                            size="small"
                          />
                          <Chip
                            label={getGradeName(
                              assessment.target_grade,
                              gradeExpectations
                            )}
                            color={getGradeColor(assessment.target_grade)}
                            size="small"
                          />
                          <Chip
                            label={reviewProgress.status}
                            color={reviewProgress.color as any}
                            size="small"
                          />
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setExpandedAssessment(
                                expandedAssessment === assessment.id
                                  ? null
                                  : assessment.id
                              )
                            }
                          >
                            <ExpandMoreIcon
                              sx={{
                                transform:
                                  expandedAssessment === assessment.id
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </IconButton>
                          {user?.role?.toLowerCase() === UserRole.HR ||
                          user?.role?.toLowerCase() === UserRole.ADMIN ||
                          user?.role?.toLowerCase() === UserRole.MANAGER ? (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleEditAssessment(assessment)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedAssessment(assessment);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          ) : null}
                        </Box>
                      </ListItem>

                      {/* Expanded Assessment Details */}
                      {expandedAssessment === assessment.id && (
                        <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2">
                                Assessment Details
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    <strong>Achievements Category:</strong>{" "}
                                    {assessment.achievements_category}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 2 }}>
                                    <strong>Achievements:</strong>{" "}
                                    {assessment.achievements ||
                                      "No achievements recorded"}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 2 }}>
                                    <strong>Self Evaluation:</strong>{" "}
                                    {assessment.self_evaluation ||
                                      "No self evaluation recorded"}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    <strong>Timeline:</strong>
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Created:</strong>{" "}
                                    {formatDate(assessment.created_at)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Submitted:</strong>{" "}
                                    {assessment.submitted_at
                                      ? formatDate(assessment.submitted_at)
                                      : "Not submitted"}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Last Updated:</strong>{" "}
                                    {formatDate(assessment.updated_at)}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      )}

                      <Divider />
                    </React.Fragment>
                  );
                })}
              </List>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Paper>

      {/* Edit Assessment Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Assessment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                  label="Status"
                >
                  {Object.values(AssessmentStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Current Grade</InputLabel>
                <Select
                  value={editData.current_grade}
                  onChange={(e) =>
                    setEditData({ ...editData, current_grade: e.target.value })
                  }
                  label="Current Grade"
                >
                  {Object.values(GradeLevel).map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Target Grade</InputLabel>
                <Select
                  value={editData.target_grade}
                  onChange={(e) =>
                    setEditData({ ...editData, target_grade: e.target.value })
                  }
                  label="Target Grade"
                >
                  {Object.values(GradeLevel).map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Achievements Category</InputLabel>
                <Select
                  value={editData.achievements_category}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      achievements_category: e.target.value,
                    })
                  }
                  label="Achievements Category"
                >
                  <MenuItem value="Ответственность">Ответственность</MenuItem>
                  <MenuItem value="Взаимодействие">Взаимодействие</MenuItem>
                  <MenuItem value="Лидерство">Лидерство</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateAssessment} variant="contained">
            Update Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the assessment for{" "}
            {selectedAssessment &&
              (() => {
                const employee = users.find(
                  (u: any) => u.id === selectedAssessment.employee_id
                );
                return `${employee?.firstName} ${employee?.lastName}`;
              })()}
            ?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAssessment}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewList;
