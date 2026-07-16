import { fireEvent, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../api/api';

jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.reject(new Error('No active session'))) }
}));

const AuthProbe = () => {
  const { user, loading, login, logout } = useAuth();

  return (
    <div>
      <span>{loading ? 'Checking session' : user?.name || 'Guest'}</span>
      <button onClick={() => login('test-token', { name: 'Daniela' })}>Log in</button>
      <button onClick={logout}>Log out</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    api.get.mockReset();
  });

  test('stores the authenticated user and token on login', () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Daniela')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('userName')).toBe('Daniela');
  });

  test('clears authentication state on logout', async () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('userName', 'Daniela');
    api.get.mockResolvedValue({ data: { user: { name: 'Daniela' } } });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(await screen.findByText('Daniela')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userName')).toBeNull();
  });
});
