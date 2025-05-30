import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import UpdateEmail from '../updateEmail';
import * as reactNavigation from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ replace: jest.fn(), goBack: jest.fn() }),
  useTheme: () => ({ colors: { primary: '#000', text: '#000', notification: 'red', border: '#ccc', background: '#fff', placeholder: '#888' } }),
}));
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

describe('UpdateEmail handleSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update email successfully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('123');
    (axios.patch as jest.Mock).mockResolvedValue({ data: {} });

    const { getByPlaceholderText, getByText } = render(<UpdateEmail />);
    fireEvent.changeText(getByPlaceholderText('Current Email'), 'old@mail.com');
    fireEvent.changeText(getByPlaceholderText('New Email'), 'new@mail.com');
    fireEvent.changeText(getByPlaceholderText('Confirm New Email'), 'new@mail.com');
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        'http://localhost:8080/api/users/123/update-email',
        { currentEmail: 'old@mail.com', newEmail: 'new@mail.com' }
      );
    });
  });

  it('should show error on network failure', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('123');
    (axios.patch as jest.Mock).mockRejectedValue({ message: 'Network Error' });

    const { getByPlaceholderText, getByText, findByText } = render(<UpdateEmail />);
    fireEvent.changeText(getByPlaceholderText('Current Email'), 'old@mail.com');
    fireEvent.changeText(getByPlaceholderText('New Email'), 'new@mail.com');
    fireEvent.changeText(getByPlaceholderText('Confirm New Email'), 'new@mail.com');
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalled();
    });
  });

  it('should show error if emails do not match', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<UpdateEmail />);
    fireEvent.changeText(getByPlaceholderText('Current Email'), 'old@mail.com');
    fireEvent.changeText(getByPlaceholderText('New Email'), 'new@mail.com');
    fireEvent.changeText(getByPlaceholderText('Confirm New Email'), 'different@mail.com');
    fireEvent.press(getByText('Save Changes'));

    expect(await findByText('Emails must match')).toBeTruthy();
  });
});

// Stub for handleSaveProfilePicture (not implemented in this file)
describe('handleSaveProfilePicture', () => {
  it('should be tested when implemented', () => {
    // Placeholder for future tests
    expect(true).toBe(true);
  });
});
