import api from './api';

// Updated to accept loginName and send 'login_name' key to backend
export const loginUser = async (loginName, password) => {
  try {
    // Backend expects: { login_name: "...", password: "..." }
    const response = await api.post('/auth/login', {
      login_name: loginName,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error("Logout error", error);
  } finally {
    sessionStorage.clear();
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Failed to change password');
  }
};