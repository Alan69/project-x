import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  RateReview as ReviewIcon,
  AccountCircle as ProfileIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Assignment as AssignmentIcon,
  Group as CommitteeIcon,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useGetNotificationsQuery } from "../../services/api";
import { ru } from "../../utils/translations";

const drawerWidth = 240;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifications = [] } = useGetNotificationsQuery();
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigationItems = [
    { text: ru.navigation.dashboard, icon: <DashboardIcon />, path: "/" },
    {
      text: ru.navigation.selfAssessment,
      icon: <AssessmentIcon />,
      path: "/self-assessment",
    },
    { text: ru.navigation.employees, icon: <PeopleIcon />, path: "/employees" },
    { text: ru.navigation.reviews, icon: <ReviewIcon />, path: "/reviews" },
    {
      text: ru.navigation.peerReview,
      icon: <ReviewIcon />,
      path: "/peer-review",
    },

    {
      text: ru.navigation.committeeReview,
      icon: <CommitteeIcon />,
      path: "/committee-review",
    },
    { text: ru.navigation.profile, icon: <ProfileIcon />, path: "/profile" },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Система Оценки
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Система Оценки Производительности
          </Typography>

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={() => navigate("/notifications")}
          >
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate("/profile")}>
          <ListItemIcon>
            <ProfileIcon fontSize="small" />
          </ListItemIcon>
          {ru.navigation.profile}
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {ru.navigation.logout}
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
