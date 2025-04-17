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

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="login" component={Login} />
    <Stack.Screen name="index" component={Index} />
    <Stack.Screen name="addTaskScreen" component={AddTaskScreen} />
    <Stack.Screen name="taskDetail" component={TaskDetail} />
    <Stack.Screen name="calendarScreen" component={CalendarScreen} />
    <Stack.Screen name="signup" component={Signup} />
    <Stack.Screen name="welcome" component={Welcome} />
    <Stack.Screen name="settings" component={Settings} />
    {/* Settings sections */}
    <Stack.Screen name="sections/editProfile" component={EditProfile} />
    <Stack.Screen name="sections/changePassword" component={ChangePassword} />
    <Stack.Screen name="sections/updateEmail" component={UpdateEmail} />
  </Stack.Navigator>
);

export default AuthStack;

