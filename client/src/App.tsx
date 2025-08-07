import './App.css';
import { Route, Routes } from 'react-router-dom';
import RootLayout from './layout/layout';
import Inbox from './pages/inbox';
import CompleteTask from './pages/CompleteTask';
import AddTask from './pages/AddTask';
import MyProject from './pages/MyProject';

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
      </Routes>
    </>
  );
}

export default App;
