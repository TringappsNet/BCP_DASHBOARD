import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSave, faBan, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { PortURL } from "./Config";
import '../styles/UserPop.css';

const UserPop = ({ handleClose }) => {
  const [excelData, setExcelData] = useState([]);
  const [editedRowId, setEditedRowId] = useState(null);
  const [editedRole, setEditedRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [deactivatedRows, setDeactivatedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);


  const fetchData = () => {
    // Sample JSON data for users
    const sampleData = [
      {
        "UserID": 1,
        "Name": "John Doe",
        "Email": "john.doe@example.com",
        "Role": "Admin",
        "isActive": 1
      },
      {
        "UserID": 2,
        "Name": "Jane Smith",
        "Email": "jane.smith@example.com",
        "Role": "User",
        "isActive": 1
      },
      {
        "UserID": 2,
        "Name": "Jane Smith",
        "Email": "jane.smith@example.com",
        "Role": "User",
        "isActive": 0 
      },
      {
        "UserID": 2,
        "Name": "Jane Smith",
        "Email": "jane.smith@example.com",
        "Role": "User",
        "isActive": 1
      }
    ];
  
    setExcelData(sampleData);
  };

  
  // const fetchData = async () => {
  //   try {
  //     const response = await fetch(`${PortURL}/users`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       setExcelData(data);
  //     } else {
  //       console.error('Failed to fetch Excel data:', response.statusText);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching Excel data:', error);
  //   }
  // };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${PortURL}/Get-Role`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        console.error('Failed to fetch roles:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleEdit = async (index) => {
    try {
      if (!deactivatedRows.includes(index)) {
        const response = await fetch(`${PortURL}/Get-Role`);
        if (response.ok) {
          const data = await response.json();
          setRoles(data);
        } else {
          console.error('Failed to fetch roles:', response.statusText);
        }

        setEditedRowId(index);
        const selectedRole = excelData[index].Role.trim() ? excelData[index].Role : null;
        setEditedRole(selectedRole);
      } else {
        console.log('Row is deactivated. Cannot edit.');
      }
    } catch (error) {
      console.error('Error editing row:', error);
    }
  };

  const handleRoleChange = (event) => {
    const selectedRole = event.target.value;
    setEditedRole(selectedRole);
  };

  const handleSave = async () => {
    try {
      if (editedRowId !== null) {
        const updatedData = [...excelData];
        updatedData[editedRowId].Role = editedRole;
  
        const { Organization, Email } = updatedData[editedRowId]; // Extract organization and email from the selected row
  
        const response = await fetch(`${PortURL}/Updateuser`, {
          method: 'POST',
          body: JSON.stringify({  email:Email,Role: editedRole}),
          headers: {
            'Content-Type': 'application/json',
            'Session-ID': localStorage.getItem('sessionId'),
            'Email': Email
          }
        });
  
        if (response.ok) {
          console.log('Role updated successfully');
          setEditSuccess(true);
          const responseData = await response.json();
          // Handle responseData as needed
        } else {
          console.error('Failed to update role:', response.statusText);
        }
  
        setExcelData(updatedData);
        setEditedRowId(null);
      } else {
        console.log('No row is currently being edited.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };
  
  const handleDeactivate = async (index) => {
    try {
      const email = localStorage.getItem('email');
      const isActive = excelData[index].isActive; // Assuming isActive status is stored in the excelData array

      // Check if the user is active
      if (isActive) {
        const response = await fetch(`${PortURL}/user-Active`, {
          method: 'PUT',
          body: JSON.stringify({ isActive: 0, email }), // Deactivate the user by setting isActive to false
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log('User deactivated successfully');
          setDeactivateSuccess(1);
          const updatedData = [...excelData];
          updatedData[index].isActive = 0; // Update isActive status in the local data
          setExcelData(updatedData);
          setDeactivatedRows([...deactivatedRows, index]);
        } else {
          console.error('Failed to deactivate user:', response.statusText);
        }
      } else {
        // User is already inactive, no action needed
        console.log('User is already deactivated.');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter excelData based on searchQuery
  const filteredData = excelData.filter((row) => {
    const values = Object.values(row).join('').toLowerCase();
    return values.includes(searchQuery.toLowerCase());
  });

  

  return (
    <Container fluid className="mt-10">
      
      <Row className="row Render-Row1">
        <Col className="col col1 Render-Col">
        {editSuccess && (
            <div className="success-message">Edit successful!</div>
          )}
          {deactivateSuccess && (
            <div className="success-message">Deactivated successfully!</div>
          )}
          <div className='User'>
            <h4>USERS</h4>
            <input type="text" placeholder="Search..." className='Usersearch' value={searchQuery} onChange={handleSearch} />
          </div>
        
          <div className="table-container" style={{  height: '500px', overflowY: 'auto' }}>
            <Table  bordered hover striped className='grid'>
              <thead className="sticky-header">
                <tr>
                  {Object.keys(excelData[0] || {}).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                  <th className="action-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index} className={row.isActive === 0 ? 'deactivated-row' : ''}>
                    {Object.keys(row).map((key, i) => (
                      <td key={i}>
                        {editedRowId === index && key === 'Role' ? (
                          <select  className="Role" value={editedRole || ''} onChange={handleRoleChange} style={{ color: 'black' }}>
                            {roles.length > 0 && roles.map(role => (
                              <option key={role.role_ID} value={role.role}>{role.role}</option>
                            ))}
                          </select>
                        ) : (
                          row[key]
                        )}
                      </td>
                    ))}
                    <td className="action-cell">
                      {editedRowId === index ? (
                        <div className="action-buttons">
                          <button className="btn btn-sm Save" onClick={handleSave}>
                            <FontAwesomeIcon icon={faSave} />
                          </button>
                          <button className="btn btn-sm Cancel" onClick={() => setEditedRowId(null)}>
                            <FontAwesomeIcon icon={faTimesCircle} />
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="btn btn-sm Edit" onClick={() => handleEdit(index)} disabled={row.isActive === 0}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="btn btn-sm Deactivate" onClick={() => handleDeactivate(index)}>
                            <FontAwesomeIcon icon={faBan} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        
        </Col>
      </Row>
    </Container>
  );
};

export default UserPop;
