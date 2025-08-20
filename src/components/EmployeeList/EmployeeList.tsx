import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import {
  useGetUsersQuery,
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

const EmployeeList: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
  const { data: assessments = [] } = useGetSelfAssessmentsQuery();
  const { data: managerReviews = [] } = useGetManagerReviewsQuery();
  const { data: peerReviews = [] } = useGetPeerReviewsQuery();
  const { data: committeeDecisions = [] } = useGetCommitteeDecisionsQuery();
  const { data: gradeExpectations = [] } = useGetGradeExpectationsQuery();

  // Filter employees based on search and filters
  const filteredEmployees = users.filter((employee: any) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;

    // Grade filter
    const matchesGrade =
      gradeFilter === "all" ||
      getGradeName(employee.currentGrade, gradeExpectations) === gradeFilter;

    // Department filter
    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;

    return matchesSearch && matchesRole && matchesGrade && matchesDepartment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique departments and roles for filters
  const departments = Array.from(
    new Set(users.map((u: any) => u.department).filter(Boolean))
  );
  const roles = Array.from(
    new Set(users.map((u: any) => u.role).filter(Boolean))
  );

  // Get employee statistics
  const getEmployeeStats = (employeeId: string) => {
    const employeeAssessments = assessments.filter(
      (a: any) => a.employee_id === employeeId
    );
    const employeeManagerReviews = managerReviews.filter(
      (r: any) => r.manager_id === employeeId
    );
    const employeePeerReviews = peerReviews.filter(
      (r: any) => r.peer_reviewer_id === employeeId
    );
    const employeeCommitteeDecisions = committeeDecisions.filter(
      (d: any) => d.committee_id === employeeId
    );

    return {
      totalAssessments: employeeAssessments.length,
      submittedAssessments: employeeAssessments.filter(
        (a: any) => a.status === AssessmentStatus.SUBMITTED
      ).length,
      completedAssessments: employeeAssessments.filter(
        (a: any) => a.status === AssessmentStatus.COMPLETED
      ).length,
      managerReviews: employeeManagerReviews.length,
      peerReviews: employeePeerReviews.length,
      committeeDecisions: employeeCommitteeDecisions.length,
    };
  };

  // Get employee manager
  const getEmployeeManager = (managerId: string) => {
    const manager = users.find((u: any) => u.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : "No Manager";
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

  if (usersLoading) {
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
          {ru.employeeList.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {ru.employeeList.subtitle}
        </Typography>

        {/* Overview Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Всего сотрудников
                </Typography>
                <Typography variant="h3" color="primary">
                  {users.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ru.common.allEmployees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Managers
                </Typography>
                <Typography variant="h3" color="info.main">
                  {users.filter((u: any) => u.role === UserRole.MANAGER).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Team leaders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Committee Members
                </Typography>
                <Typography variant="h3" color="secondary.main">
                  {
                    users.filter(
                      (u: any) => u.role === UserRole.COMMITTEE_MEMBER
                    ).length
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review committee
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Assessments
                </Typography>
                <Typography variant="h3" color="success.main">
                  {
                    assessments.filter(
                      (a: any) => a.status === AssessmentStatus.SUBMITTED
                    ).length
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Under review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters & Search
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search by name, position, or department"
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
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    label="Role"
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    label="Grade"
                  >
                    <MenuItem value="all">All Grades</MenuItem>
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
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    label="Department"
                  >
                    <MenuItem value="all">All Departments</MenuItem>
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
                    setRoleFilter("all");
                    setGradeFilter("all");
                    setDepartmentFilter("all");
                    setCurrentPage(1);
                  }}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Employees ({filteredEmployees.length})
            </Typography>

            {paginatedEmployees.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No employees match the current filters
              </Typography>
            ) : (
              <List>
                {paginatedEmployees.map((employee: any) => {
                  const stats = getEmployeeStats(employee.id);

                  return (
                    <React.Fragment key={employee.id}>
                      <ListItem>
                        <ListItemIcon>
                          <Avatar>
                            {employee.firstName?.charAt(0)}
                            {employee.lastName?.charAt(0)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={`${employee.firstName} ${employee.lastName}`}
                          secondary={`${employee.position} - ${employee.department}`}
                        />
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={1}
                          sx={{ mr: 2 }}
                        >
                          <Chip
                            label={employee.role}
                            color={getRoleColor(employee.role)}
                            size="small"
                          />
                          <Chip
                            label={
                              getGradeName(
                                employee.currentGrade,
                                gradeExpectations
                              ) || "No Grade"
                            }
                            color={getGradeColor(employee.currentGrade)}
                            size="small"
                          />
                          <Chip
                            label={`${stats.totalAssessments} assessments`}
                            color="info"
                            size="small"
                          />
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setExpandedEmployee(
                                expandedEmployee === employee.id
                                  ? null
                                  : employee.id
                              )
                            }
                          >
                            <ExpandMoreIcon
                              sx={{
                                transform:
                                  expandedEmployee === employee.id
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowEmployeeDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Box>
                      </ListItem>

                      {/* Expanded Employee Details */}
                      {expandedEmployee === employee.id && (
                        <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2">
                                Employee Details & Performance
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    <strong>Personal Information:</strong>
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Email:</strong> {employee.email}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Hire Date:</strong>{" "}
                                    {new Date(
                                      employee.hireDate
                                    ).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Manager:</strong>{" "}
                                    {getEmployeeManager(employee.managerId)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Created:</strong>{" "}
                                    {new Date(
                                      employee.createdAt
                                    ).toLocaleDateString()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    <strong>Performance Statistics:</strong>
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Total Assessments:</strong>{" "}
                                    {stats.totalAssessments}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Submitted:</strong>{" "}
                                    {stats.submittedAssessments}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Completed:</strong>{" "}
                                    {stats.completedAssessments}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Manager Reviews:</strong>{" "}
                                    {stats.managerReviews}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Peer Reviews:</strong>{" "}
                                    {stats.peerReviews}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Committee Decisions:</strong>{" "}
                                    {stats.committeeDecisions}
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

      {/* Employee Details Dialog */}
      <Dialog
        open={showEmployeeDialog}
        onClose={() => setShowEmployeeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Employee Details -{" "}
          {selectedEmployee
            ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
            : ""}
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {selectedEmployee.firstName}{" "}
                    {selectedEmployee.lastName}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {selectedEmployee.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Position:</strong> {selectedEmployee.position}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Department:</strong> {selectedEmployee.department}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Role:</strong> {selectedEmployee.role}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Current Grade:</strong>{" "}
                    {selectedEmployee.currentGrade || "Not set"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Hire Date:</strong>{" "}
                    {formatDate(selectedEmployee.hireDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Performance Overview
                  </Typography>
                  {(() => {
                    const stats = getEmployeeStats(selectedEmployee.id);
                    return (
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Total Assessments:</strong>{" "}
                          {stats.totalAssessments}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Submitted Assessments:</strong>{" "}
                          {stats.submittedAssessments}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Completed Assessments:</strong>{" "}
                          {stats.completedAssessments}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Manager Reviews Given:</strong>{" "}
                          {stats.managerReviews}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Peer Reviews Given:</strong>{" "}
                          {stats.peerReviews}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Committee Decisions Made:</strong>{" "}
                          {stats.committeeDecisions}
                        </Typography>
                      </>
                    );
                  })()}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmployeeDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
