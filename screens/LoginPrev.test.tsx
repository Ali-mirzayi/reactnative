import * as React from 'react';
import { screen, waitFor, act, userEvent,render } from '@testing-library/react-native';
import '@testing-library/react-native/extend-expect';
import LoginPrev from './LoginPrev';
import { renderNavigator } from '../utils/test-utils';
import { LoginNavigation } from '../Navigation';
import Login from './Login';

const mockNavigate = jest.fn();

// Mock the navigation object
jest.mock('@react-navigation/native', () => {
    return {
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => ({
            navigate: mockNavigate
        })
    };
});

describe('LoginNavigation', () => {
    const user = userEvent.setup();
    it('should be render correctly', () => {
        // @ts-ignore
        const tree = renderNavigator(<LoginNavigation />).toJSON();
        expect(tree).toMatchSnapshot();
    })
    it('should change navigate when click button', async () => {
        // renderNavigator(<LoginNavigation />);
        const route = { params: { beCheck:false,setCheck:()=>{} } }
        //@ts-ignore
        const {getByTestId,unmount} = render(<LoginPrev />);
        
        await act(async () => {
            await waitFor(() => user.press(getByTestId('LoginPrevScreen')))
        });
        
        unmount();

        // @ts-ignore
        const {getByTestId:getid} = render(<Login />);

        expect(getid('LoginScreen')).toBeOnTheScreen();
    });
});