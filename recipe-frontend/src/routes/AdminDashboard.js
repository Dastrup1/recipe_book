// routes/AdminDashboard.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Button,
  Paper,
  Box,
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const decoded = jwtDecode(token);
    if (decoded.role !== 'admin') return navigate('/recipes'); // block non-admins

    fetchUsers(token);
  }, []);

  const fetchUsers = async (token) => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
  
      // 🔽 Filter out the '[deleted]' user
      const filtered = data.filter((user) => user.username !== '[deleted]');
      setUsers(filtered);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this user?');
    if (!confirm) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchUsers(token); // ✅ refresh full user list from backend
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Paper elevation={3}>
        <Box p={2}>
          <Table>
          <TableHead>
  <TableRow>
    <TableCell>ID</TableCell>
    <TableCell>Username</TableCell>
    <TableCell>Email</TableCell>
    <TableCell>Role</TableCell>
    <TableCell>Joined</TableCell>
    <TableCell>Recipes</TableCell>
    <TableCell>Actions</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {users.map((user) => (
    <TableRow key={user.id}>
      <TableCell>{user.id}</TableCell>
      <TableCell>{user.username}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Select
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value)}
          disabled={user.id === 5}
        >
          <MenuItem value="user">user</MenuItem>
          <MenuItem value="admin">admin</MenuItem>
        </Select>
      </TableCell>
      <TableCell>
        {user.created_at
          ? new Date(user.created_at).toLocaleDateString()
          : '—'}
      </TableCell>
      <TableCell>{user.recipe_count}</TableCell>
      <TableCell>
        <Button
          variant="outlined"
          color="error"
          onClick={() => handleDelete(user.id)}
          disabled={user.id === 5}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
          </Table>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
