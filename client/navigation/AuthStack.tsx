import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Index from '../Screen/index';
import Login from '@/Screen/login';
import AddTaskScreen from '@/Screen/addTaskScreen';
import TaskDetail from '@/Screen/taskDetail';
import CalendarScreen from '@/Screen/calendarScreen';
import Settings from '@/Screen/settings';
import Signup from '@/Screen/signup';
import Welcome from '@/Screen/welcome';
import EditProfile from '@/Screen/sections/editProfile';
import ChangePassword from '@/Screen/sections/changePassword';
import UpdateEmail from '@/Screen/sections/updateEmail';
import PrivacyPolicy from '@/Screen/sections/PrivacyPolicy';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define your stack param list for type safety
export type AuthStackParamList = {
  login: undefined;
  index: undefined;
  addTaskScreen: undefined;
  taskDetail: { taskId: string }; // <-- Only taskId is required now
  calendarScreen: undefined;
  signup: undefined;
  welcome: undefined;
  settings: undefined;
  'sections/editProfile': undefined;
  'sections/changePassword': undefined;
  'sections/updateEmail': undefined;
  'sections/privacyPolicy': undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="login" component={Login} />
    <Stack.Screen name="index" component={Index} />
    <Stack.Screen name="addTaskScreen" component={AddTaskScreen} />
    <Stack.Screen
      name="taskDetail"
      component={TaskDetail}
    />
    <Stack.Screen name="calendarScreen" component={CalendarScreen} />
    <Stack.Screen name="signup" component={Signup} />
    <Stack.Screen name="welcome" component={Welcome} />
    <Stack.Screen name="settings" component={Settings} />
    {/* Settings sections */}
    <Stack.Screen name="sections/editProfile" component={EditProfile} />
    <Stack.Screen name="sections/changePassword" component={ChangePassword} />
    <Stack.Screen name="sections/updateEmail" component={UpdateEmail} />
    <Stack.Screen name="sections/privacyPolicy" component={PrivacyPolicy} />
  </Stack.Navigator>
);

export default AuthStack;

