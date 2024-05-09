import * as React from 'react';
import { screen, waitFor, act, userEvent, fireEvent, render } from '@testing-library/react-native';
import '@testing-library/react-native/extend-expect';
import Login from './Login';
import {  renderNavigator } from '../utils/test-utils';
import { LoginNavigation } from '../Navigation';
import sleep from '../utils/wait';
import Chat from './Chat';
import LoginPrev from './LoginPrev';


const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

describe('LoginNavigation', () => {
  const user = userEvent.setup();

  // it('should be render correctly', () => {
  //   // @ts-ignore
  //   const tree = renderNavigator(<Login />).toJSON();
  //   expect(tree).toMatchSnapshot();
  // });

  it('should type user and pass', async () => {
    // @ts-ignore
    const { getByPlaceholderText } = render(<Login />);
    const userInput = getByPlaceholderText(/user name/i);
    fireEvent.changeText(userInput, 'ali mirzaei');
    expect(userInput.props.value).toMatch('ali mirzaei');
  });

  it('should change navigate when click button', async () => {

    const fakeData = { isOK: true };
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(fakeData),
    });

    // @ts-ignore
    const { getByTestId,unmount } = renderNavigator(<LoginPrev />);

    await act(async () => {
      await waitFor(() => user.longPress(getByTestId('LoginPrevScreen')));
    })

    unmount();
    
    // @ts-ignore
    const { getByPlaceholderText, getByTestId:getById, unmount:un, } = renderNavigator(<Login navigation={{navigate:mockNavigate}} />);
    
    await act(async () => {
      await waitFor(() => user.type(getByPlaceholderText(/user name/i), 'aliimirzaei'));
      await waitFor(() => user.press(getById('LoginScreen')));
    });
    
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(2));
    un();
    //@ts-ignores
    // const {getByTestId:id} = renderNavigator(<Chat />);

    // const chat = render(<Chat />);
    
    // await waitFor(() => expect(chat.getByTestId('ChatScreen')).toBeOnTheScreen());
    // expect(getById('ChatScreen')).toBeOnTheScreen()

  });
});