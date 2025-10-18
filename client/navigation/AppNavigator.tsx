import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../Provider/AuthProvider'

// Auth screens
import Welcome from '@/Screen/welcome';
import Login from '@/Screen/login';
import Signup from '@/Screen/signup';

// App screens
import Index from '../Screen/index';
import AddTaskScreen from '@/Screen/addTaskScreen';
import TaskDetail from '@/Screen/taskDetail';
import CalendarScreen from '@/Screen/calendarScreen';
import Settings from '@/Screen/settings';
import EditProfile from '@/Screen/sections/editProfile';
import ChangePassword from '@/Screen/sections/changePassword';
import UpdateEmail from '@/Screen/sections/updateEmail';
import PrivacyPolicy from '@/Screen/sections/PrivacyPolicy';
import SecureSettings from '@/Screen/sections/SecureSettings';
import SendFeedback from '@/Screen/sendFeedback';
import HelpSupport from '@/Screen/helpSupport';

const AuthStackNav = createNativeStackNavigator();
const AppStackNav = createNativeStackNavigator();

const AuthStack = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="welcome" component={Welcome} />
    <AuthStackNav.Screen name="login" component={Login} />
    <AuthStackNav.Screen name="signup" component={Signup} />

  </AuthStackNav.Navigator>
);

const AppStack = () => (
  <AppStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AppStackNav.Screen name="index" component={Index} />
    <AppStackNav.Screen name="addTaskScreen" component={AddTaskScreen} />
    <AppStackNav.Screen name="taskDetail" component={TaskDetail} />
    <AppStackNav.Screen name="calendarScreen" component={CalendarScreen} />
    <AppStackNav.Screen name="settings" component={Settings} />
    <AppStackNav.Screen name="sections/editProfile" component={EditProfile} />
    <AppStackNav.Screen name="sections/changePassword" component={ChangePassword} />
    <AppStackNav.Screen name="sections/updateEmail" component={UpdateEmail} />
    <AppStackNav.Screen name="sections/privacyPolicy" component={PrivacyPolicy} />
    <AppStackNav.Screen name="secureSettings" component={SecureSettings} />
    <AppStackNav.Screen name="sendFeedback" component={SendFeedback} />
    <AppStackNav.Screen name="helpSupport" component={HelpSupport} />
  </AppStackNav.Navigator>
);

const AppNavigator = () =>{
  const {userId, loading} = useAuth();

  if(loading){
    return null;
  }

  return userId ? <AppStack/> : <AuthStack/>;

}
export default AppNavigator;