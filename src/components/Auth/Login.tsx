import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ru } from "../../utils/translations";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box
            sx={{
              backgroundColor: "primary.main",
              borderRadius: "50%",
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 2,
            }}
          >
            <LockOutlined sx={{ color: "white", fontSize: 28 }} />
          </Box>

          <Typography component="h1" variant="h5" gutterBottom>
            Система Оценки Производительности
          </Typography>

          <Typography
            component="h2"
            variant="h6"
            color="textSecondary"
            gutterBottom
          >
            {ru.auth.login}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={ru.common.email}
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              type="email"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={ru.auth.password}
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : ru.auth.login}
            </Button>
          </Box>

          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mt: 2 }}
          >
            Demo Credentials:
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            Employee: employee@company.com / password123
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            Manager: manager@company.com / password123
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            HR: hr@company.com / password123
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            Committee: committee@company.com / password123
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            HR: hr@company.com / password123
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
