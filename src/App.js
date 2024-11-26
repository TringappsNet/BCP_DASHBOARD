import './App.css';
import ForgotPassword from './Components/forgetPassword';
import ResetPassword from './Components/resetPassword';
import Register from './Components/register';
import Dashboard from './Components/dashboard';
import SendInvite from './Components/sendInvite';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Components/Login';
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import UserPop from './Components/UserPop';
import OrgPop from './Components/OrganizationPopup';
// import DataGrid from './Components/Audit';

function App() {
  useEffect(() => {
    document.title = 'JMI'; 
  }, []);
  return (
    
    <Router>
       <Helmet>
      <title>JMI</title> 
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    </Helmet>
    <Routes>
      <Route index element={<Login/>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />
      <Route path="/dashboard" element={<Dashboard/>} />
      <Route path="/send-invite" element={<SendInvite />} />
      <Route path="/UserPop" element={<UserPop />} />
      <Route path="/OrgPop" element={<OrgPop />} />

    </Routes>
  </Router>
  );
}

export default App;
