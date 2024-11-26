import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { PortURL } from './Config';
// import Header from './Header';
import CustomSnackbar from './Snackbar';
import { TextField, InputAdornment } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoadingSpinner from './LoadingSpinner'; 


function Login() {
  const [email, setEmail] = useState(''); // Corrected typo
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); 
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  //const [snackColor,setSnackColor]=useState('success');
  const [snackbarVariant, setSnackbarVariant] = useState('success');

  const navigate = useNavigate();


  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!email) {
      setLoading(false);
      setSnackbarMessage('Email is required');
      setSnackbarOpen(true);
      // setSnackColor('red');
      setSnackbarVariant('error');
      
      return;
    }
  
    if (!password) {
      setLoading(false);
      setSnackbarMessage('Password is required');
      setSnackbarOpen(true);
      setSnackbarVariant('error');

      return;
    }
  
    if (!email.includes('@')) {
      setLoading(false);
      setSnackbarMessage('Please enter a valid email');
      setSnackbarOpen(true);
      setSnackbarVariant('error');

      return;
    }
  
    const requestBody = { email, password};
  
    try {
      setLoading(true);
      const response = await fetch(`${PortURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (response.ok) {
        const data1 = await response.json();
  
        localStorage.setItem('sessionId', data1.sessionId);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('UserName', data1.UserName);
        localStorage.setItem('email', data1.email);
        localStorage.setItem('Organization', data1.Organization);
        localStorage.setItem('createdAt', data1.createdAt);
        localStorage.setItem('Role_ID', data1.Role_ID);
        localStorage.setItem('Org_ID', data1.Org_ID);
        localStorage.setItem('user_ID', data1.userId);
        localStorage.setItem('role', data1.role);
        localStorage.setItem('firstName', data1.firstName);
        localStorage.setItem('lastName', data1.lastName);
        setLoading(false);
        navigate('/dashboard');
  } else {
    const data = await response.json();
    setLoading(false);
    setSnackbarMessage(data.error || 'An error occurred while logging in.');
    setSnackbarOpen(true);
    setSnackbarVariant('error');

  }
} catch (error) {
  console.error('Error logging in:', error);
  setLoading(false);
  setSnackbarMessage('An error occurred while logging in.');
  setSnackbarOpen(true);
  setSnackbarVariant('error');

}

setLoading(false);
};

  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  return (
   <div className='loginContainer'>
     {/* <Header /> */}
     <div className='background'></div>
     <div className='curve'></div>
     <div className=" me-auto d-flex flex-row">
      <div className='bcp-logo'></div>
     </div>
    <div className="form d-flex justify-content-center align-items-center ">
      <div className=" shadow con ">
        <h6 className="text-center mb-2 mt-1 display-6 ">Sign in</h6>
        {/* <p>Navigate your Business with Ease!!!</p> */}
        
        {serverError && (
          <div className="text-center mt-2">
            <p className="text-danger">{serverError}</p>
          </div>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formBasicEmail" className="mb-3 mt-3 text-secondary">
          <label className='py-2'>Email</label>
          <TextField
            className={`label form-control ${emailError ? 'error' : ''}`}
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
              setServerError('');
            }}  
            fullWidth
            variant="outlined"
            size="small"
          />
          </Form.Group>
          <Form.Group controlId="formBasicPassword" className="mb-2 mt-2 pb-2 text-secondary">
            <label className='py-2'>Password</label>
          <TextField
            className={`label form-control ${passwordError ? 'error' : ''}`}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
              setServerError('');
            }}
            fullWidth
            variant="outlined"
            size="small"
            error={!!passwordError}
            InputProps={{
              endAdornment: password && ( 
                <InputAdornment position="end">
                  {showPassword ? (
                    <VisibilityIcon onClick={togglePasswordVisibility} />
                  ) : (
                    <VisibilityOffIcon onClick={togglePasswordVisibility} />
                  )}
                </InputAdornment>
              ),
            }}
          />
          </Form.Group>
          <Row className="mb-2 mt-1 ">
            <Col>
              <Form.Text className="text-left">
                <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
              </Form.Text>
            </Col>
          </Row>
       
          <div className="btn-container mt-4 mb-4 ">
            <Button type="submit" className="btn rounded login btn-success ">
              Sign in
            </Button>
          </div>
        </Form>
        
      </div>
      <CustomSnackbar
        message={snackbarMessage}
        variant={snackbarVariant}
        onClose={handleCloseSnackbar}
        open={snackbarOpen}
        // color={snackColor}


      />
    </div>
    {loading && <LoadingSpinner />} 
   </div>
  );
}

export default Login;
