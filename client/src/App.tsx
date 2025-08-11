import './App.css';
import { Route, Routes } from 'react-router-dom';
import RootLayout from './layout/layout';
import Inbox from './pages/Inbox';
import CompleteTask from './pages/CompleteTask';
import AddTask from './pages/AddTask';
import MyProject from './pages/MyProject';
import Login from './auth/Login';
import SignUp from './auth/SignUp';

function App() {
  return (
    <>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path='/' element={<Inbox />} />
          <Route path='/completed' element={<CompleteTask />} />
          <Route path='/add' element={<AddTask />} />
          <Route path='/projects/:pID' element={<MyProject />} />
        </Route>
        <Route path='/auth/login' element={<Login />} />
        <Route path='/auth/signup' element={<SignUp />} />
      </Routes>
    </>
  );
}

export default App;
