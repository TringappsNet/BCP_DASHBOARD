import React, { useState, useCallback, useEffect } from "react";
import { Button, Form, FormControl, Container } from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/dashboard.css";
import CustomSnackbar from "./Snackbar";
import { PortURL } from "./Config";
import LoadingSpinner from "./LoadingSpinner";
import ConfirmationModal from "./ConfirmationModal";
import NavbarComponent from "./Navbar";
import ExcelGrid from "./ExcelGrid";
import { columnMap } from "../Objects/Objects";
// import AuditGrid from './Audit';

function Dashboard() {
  const [username, setUsername] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [_role, setRole] = useState("");
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editedRowId, setEditedRowId] = useState(null);
  const [editedRowData, setEditedRowData] = useState({});
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [_organization, setOrganization] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [, setEmail] = useState("");
  // const [showPreview, setShowPreview] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [retriveData, setRetriveData] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  // const [remainingTime, setRemainingTime] = useState(500);
  // const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [snackbarVariant, setSnackbarVariant] = useState("success");
  const [showModal, setShowModal] = useState(false);
  const [roleID, setRoleID] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // const [selectionModel, setSelectionModel] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      const storedUsername = localStorage.getItem("UserName");
      const storedOrganization = localStorage.getItem("Organization");
      const storedEmail = localStorage.getItem("email");
      const storedRoleID = localStorage.getItem("Role_ID");
      const storedRole = localStorage.getItem("role");

      setUsername(storedUsername);
      setOrganization(storedOrganization);
      setRoleID(storedRoleID);
      setEmail(storedEmail);
      setRole(storedRole);

      fetchData();
      // setShowPreview(true);
    }
    // eslint-disable-next-line
  }, [navigate]);

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setRemainingTime((prevTime) => {
  //       if (prevTime <= 0) {
  //         clearInterval(timer);
  //         handleLogout();
  //         return 0;
  //       }
  //       return prevTime - 1;
  //     });
  //   }, 10000000);

  //   return () => clearInterval(timer);
  // }, []);

  // useEffect(() => {
  //   if (remainingTime === 0) {
  //     handleLogout();
  //     navigate("/login");
  //   }
  // }, [remainingTime]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth >= 1000);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (uploadSuccess) {
      setSnackbarOpen(true);

      setTimeout(() => setUploadSuccess(false), 5000);
    }
  }, [uploadSuccess]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storedUsername = localStorage.getItem("UserName");
      const storedOrganization = localStorage.getItem("Organization");
      const response = await fetch(
        `${PortURL}/data?username=${storedUsername}&organization=${storedOrganization}`
      );
      if (response.ok) {
        const excelData = await response.json();

        // Modify the "MonthYear" column data by adding one minute to each date
        const modifiedData = excelData.map((row) => ({
          ...row,
          MonthYear: addOneMinuteToDate(row.MonthYear),
        }));
        // Step 1: Create a map to store the original order of companies
        let companyOrder = [
          ...new Set(modifiedData.map((item) => item.CompanyName)),
        ];

        // Step 2: Group by company and sort within each group
        let groupedAndSorted = companyOrder.map((company) => {
          let companyData = modifiedData.filter(
            (item) => item.CompanyName === company
          );
          return companyData.sort(
            (a, b) => new Date(a.MonthYear) - new Date(b.MonthYear)
          );
        });

        // Step 3: Flatten the grouped and sorted data
        let sortedData = groupedAndSorted.flat();
        // Set the modified data in the state
        setRetriveData(sortedData);
        // console.log("retrived data",modifiedData);
      } else {
        console.error("Failed to fetch data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to add one minute to a given date string
  const addOneMinuteToDate = (dateString) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + 1000);
    return date.toISOString(); // Format the modified date as an ISO string or in your desired format
  };

  const handleConfirm = () => {
    handleSubmit();
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setData([]);
    setUploadedFileName("");
    setShowModal(false);
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setData([]);
      setLoading(true);

      acceptedFiles.forEach(async (file) => {
        // Check if the file extension is supported
        const fileExtension = file.name.split(".").pop().toLowerCase();
        if (fileExtension !== "xlsx" && fileExtension !== "xls") {
          // Display error message for unsupported file format
          setLoading(false);
          setSnackbarOpen(true);
          setSnackbarMessage("File type not supported");
          setSnackbarVariant("error");
          return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = e.target.result;
          try {
            const workbook = XLSX.read(data, {
              type: "buffer",
              cellDates: true,
            });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {
              header: 1,
              dateNF: "yyyy-mm-dd hh:mm:ss",
              defval: null,
            });
            console.log(jsonData);
            const trimmedData = jsonData.filter((row) =>
              row.some((cell) => cell !== null && cell !== "")
            );

            const cleanedData = trimmedData.map((row, rowIndex) => {
              if (rowIndex === 0) {
                return row;
              }
              return row.map((cell, columnIndex) => {
                if (columnIndex === 0 || columnIndex === 1) {
                  return cell;
                }

                if (cell !== null && typeof cell === "string") {
                  const numericValue = parseFloat(cell);
                  if (!isNaN(numericValue) && /^[0-9.]+$/.test(cell)) {
                    return numericValue;
                  } else {
                    return null;
                  }
                }

                return cell;
              });
            });
            const header = cleanedData.shift();
            const filteredHeader = header.filter((col) => col !== null);
            const mappedHeader = filteredHeader.map(
              (col) => columnMap[col] || col
            );
            const newJsonData = cleanedData.map((row) => {
              const obj = {};
              mappedHeader.forEach((key, index) => {
                obj[key] = row[index];
              });
              return obj;
            });

            const updatedData = newJsonData.map((row) => {
              if (row["MonthYear"]) {
                const dateString = row["MonthYear"].toString();
                const date = new Date(dateString);
                date.setSeconds(date.getSeconds() + 10);
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const day = date.getDate().toString().padStart(2, "0");
                const hours = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                const seconds = "00";
                const formattedDate = `${year}-${month}-${day}' '${hours}:${minutes}:${seconds}`;
                row["MonthYear"] = formattedDate;
              }
              return row;
            });
            setData((prevData) => [...prevData, ...updatedData]);
            setUploadedFileName(file.name);

            const Org_ID = localStorage.getItem("Org_ID");
            const userId = localStorage.getItem("user_ID");
            try {
              const response = await fetch(`${PortURL}/validate-duplicates`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userData: {
                    userId: userId,
                    Org_ID: Org_ID,
                  },
                  data: updatedData,
                }),
              });
              if (response.ok) {
                const responseData = await response.json();
                const hasDuplicates = responseData.hasDuplicates;
                if (hasDuplicates === true) {
                  setShowModal(true);
                  setLoading(false);
                } else if (hasDuplicates === false) {
                  setLoading(false);
                }
              } else {
                setLoading(false);
                const responseData = await response.json();
                setData([]);
                setUploadedFileName("");
                setSnackbarOpen(true);
                setSnackbarMessage(responseData.message);
                setSnackbarVariant("error");
                console.error("Error:", response.statusText);
              }
            } catch (error) {
              console.error("Error calling validate API:", error);
            }
          } catch (error) {
            setLoading(false);
            console.error("Error reading file:", error);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    [setData, setUploadedFileName]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCancel = () => {
    setEditedRowId(null);
  };

  const handleInputChange = (e, key) => {
    const { value } = e.target;
    setEditedRowData((prevData) => ({
      ...prevData,
      [String(key)]: String(value || ""),
    }));
  };

  const handleLogout = () => {
    setShowConfirmation(true);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem("sessionId");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("UserName");
    localStorage.removeItem("email");
    localStorage.removeItem("Organization");
    localStorage.removeItem("createdAt");
    localStorage.removeItem("Org_ID");
    localStorage.removeItem("role");
    localStorage.removeItem("user_ID");

    navigate("/login");
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    date.setSeconds(date.getSeconds() + 100);
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear().toString().substr(-2);
    return `${month.toUpperCase()} ${year}`;
  };

  const formatDateCell = (value, key) => {
    if (key === "MonthYear") {
      return formatMonthYear(value);
    }
    return value;
  };

  const filteredData = retriveData.filter((row) => {
    return Object.keys(row || {}).some((key) => {
      // Check if the key is 'MonthYear' and the value includes the search query
      if (key === "MonthYear") {
        const monthYearValue = formatMonthYear(row[key]);
        return monthYearValue.toLowerCase().includes(searchQuery.toLowerCase());
      }
      // For other columns, check if the value includes the search query
      return (
        row[key] &&
        row[key].toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  });

  const handleSubmit = async () => {
    setUploadedFileName("");
    setData([]);
    if (data.length === 0) {
      setSnackbarOpen(true);
      setSnackbarMessage("File is empty");
      setSnackbarVariant("error");
      return;
    }

    setLoading(true);

    try {
      const sessionId = localStorage.getItem("sessionId");
      const email = localStorage.getItem("email");
      // const organization = localStorage.getItem('Organisation');
      const Role_ID = localStorage.getItem("Role_ID");
      const Org_ID = localStorage.getItem("Org_ID");
      const userId = localStorage.getItem("user_ID");
      const role = localStorage.getItem("role");

      const userData = {
        username: username,
        orgID: Org_ID,
        email: email,
        roleID: Role_ID,
        userId: userId,
        role: role,
      };

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await fetch(`${PortURL}/bulk-upload-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Session-ID": sessionId,
          Email: email,
        },
        body: JSON.stringify({ userData, data }),
      });

      if (response.ok) {
        setData([]);
        fetchData();
        const jsonResponse = await response.json();

        setUploadSuccess(true);
        setUploadedFileName("");
        setSnackbarMessage(jsonResponse.message);
        setSnackbarVariant("success");
      } else {
        const errorResponse = await response.json();
        const errorMessage = errorResponse.message || "Data upload failed";
        console.error("Error:", errorMessage);
        setSnackbarOpen(true);
        setSnackbarMessage(errorMessage);
        setSnackbarVariant("error");
      }
    } catch (error) {
      console.error("Error:", error);
      setSnackbarOpen(true);
      setSnackbarMessage("Data upload failed");
      setSnackbarVariant("error");
    }

    setLoading(false);
  };

  const handleCheckboxChange = (rowId) => {
    if (rowId === null) {
      const allRowIds = filteredData.map((_, index) => index);
      setSelectedRowIds(
        selectedRowIds.length === allRowIds.length ? [] : allRowIds
      );
    } else {
      setSelectedRowIds(
        selectedRowIds.includes(rowId)
          ? selectedRowIds.filter((id) => id !== rowId)
          : [...selectedRowIds, rowId]
      );
    }
  };

  const handleUpdateValidation = async () => {
    setLoading(true);
    // const sessionId = localStorage.getItem('sessionId');
    const email = localStorage.getItem("email");
    const Org_ID = localStorage.getItem("Org_ID");
    const userId = localStorage.getItem("user_ID");
    const monthYearDate = new Date(editedRowData.MonthYear);
    const formattedMonthYear = `${monthYearDate.getFullYear()}-${(
      monthYearDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${monthYearDate
      .getDate()
      .toString()
      .padStart(2, "0")}`;

    const payload = {
      editedRow: {
        ...editedRowData,
        MonthYear: formattedMonthYear,
      },
      email,
      Org_ID,
      userId,
    };

    try {
      const validateResponse = await fetch(`${PortURL}/validate-duplicates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userData: {
            userId: userId,
            Org_ID: Org_ID,
          },
          data: [payload.editedRow],
        }),
      });

      if (validateResponse.ok) {
        const validationResult = await validateResponse.json();
        const hasDuplicates = validationResult.hasDuplicates;

        if (hasDuplicates === true) {
          setLoading(false);
          setShowUpdateModal(true);
        } else {
          setLoading(false);
          handleSave();
        }
      } else {
        console.error(
          "Error validating duplicates:",
          validateResponse.statusText
        );
        setSnackbarOpen(true);
        setSnackbarMessage("Error validating duplicates");
        setSnackbarVariant("error");
      }
    } catch (error) {
      console.error("Error validating duplicates:", error);
      setSnackbarOpen(true);
      setSnackbarMessage("Error validating duplicates");
      setSnackbarVariant("error");
    }
  };

  const handleCloseUpdate = () => {
    setShowUpdateModal(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      const email = localStorage.getItem("email");
      const Org_ID = localStorage.getItem("Org_ID");
      const userId = localStorage.getItem("user_ID");
      const monthYearDate = new Date(editedRowData.MonthYear);
      const formattedMonthYear = `${monthYearDate.getFullYear()}-${(
        monthYearDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${monthYearDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;

      const payload = {
        editedRow: {
          ...editedRowData,
          MonthYear: formattedMonthYear,
        },
        email,
        Org_ID,
        userId,
        username,
      };

      const response = await fetch(`${PortURL}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          "Session-ID": sessionId,
          Email: email,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchData();
        setLoading(false);
        setSnackbarOpen(true);
        setSnackbarMessage("Row updated successfully");
        setSnackbarVariant("success");

        setEditedRowId(null);
      } else {
        console.error("Error updating row:", response.statusText);
        setSnackbarOpen(true);
        setSnackbarMessage("Error updating row");
        setSnackbarVariant("error");
      }
    } catch (error) {
      console.error("Error updating row:", error);
      setSnackbarOpen(true);
      setSnackbarMessage("Error updating row");
      setSnackbarVariant("error");
    }
    setLoading(false);
    setShowUpdateModal(false);
  };

  const handleCloseDelete = () => {
    setShowDeleteModal(false);
  };
  const handleEdit = (rowId) => {
    // console.log("edited  row id " ,rowId);
    setEditedRowId(rowId);
    setEditedRowData(filteredData[rowId]);
  };

  const handleDelete = (index, columnId) => {
    setRowToDelete(columnId);

    // console.log("index andcolumnID",index,columnId)

    setShowDeleteModal(true);
    // console.log("row current delete data",rowToDelete);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setShowDeleteModal(false);
    const rowId = rowToDelete;
    // console.log("confirm delte",rowId);
    try {
      const sessionId = localStorage.getItem("sessionId");
      const email = localStorage.getItem("email");
      const userId = localStorage.getItem("user_ID");
      const Org_ID = localStorage.getItem("Org_ID");
      // const identifierToDelete = String(filteredData[rowId]?.ID);

      //  console.log("identifier delete",identifierToDelete);

      const stringRow = String(rowId);
      const response = await fetch(`${PortURL}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Session-ID": sessionId,
          Email: email,
        },
        body: JSON.stringify({
          ids: [stringRow],
          Org_Id: Org_ID,
          userId: userId,
        }),
      });

      if (response.ok) {
        fetchData();
        const updatedData = retriveData;
        // const updatedData = filteredData.filter((row, index) => index !== rowId);
        // console.log("updated Data after deleting ",updatedData);
        setRetriveData(updatedData);
        setLoading(false);
        setSnackbarOpen(true);
        setSnackbarMessage("Row deleted successfully");
        setSnackbarVariant("success");
        setShowDeleteModal(false);
      } else {
        console.error("Error deleting row:", response.statusText);
        setSnackbarOpen(true);
        setSnackbarMessage("Error deleting row");
        setSnackbarVariant("error");
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error deleting row:", error);
      setSnackbarOpen(true);
      setSnackbarMessage("Error deleting row");
      setSnackbarVariant("error");
      setShowDeleteModal(false);
    }
    setLoading(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  // const columns = [
  //   { field: 'ID', headerName: 'ID', width: 90 },
  //   { field: 'MonthYear', headerName: 'MonthYear', width: 200 },
  //   { field: 'CompanyName', headerName: 'Company Name', width: 200 },
  //   { field: 'RevenueActual', headerName: 'Revenue Actual', width: 150 },
  //   { field: 'RevenueBudget', headerName: 'Revenue Budget', width: 150 },
  //   { field: 'GrossProfitActual', headerName: 'Gross Profit Actual', width: 180 },
  //   { field: 'GrossProfitBudget', headerName: 'Gross Profit Budget', width: 180 },
  //   { field: 'SGAActual', headerName: 'SGA Actual', width: 120 },
  //   { field: 'SGABudget', headerName: 'SGA Budget', width: 120 },
  //   { field: 'EBITDAActual', headerName: 'EBITDA Actual', width: 150 },
  //   { field: 'EBITDABudget', headerName: 'EBITDA Budget', width: 150 },
  //   { field: 'CapExActual', headerName: 'CapEx Actual', width: 150 },
  //   { field: 'CapExBudget', headerName: 'CapEx Budget', width: 150 },
  //   { field: 'FixedAssetsNetActual', headerName: 'Fixed Assets Net Actual', width: 200 },
  //   { field: 'FixedAssetsNetBudget', headerName: 'Fixed Assets Net Budget', width: 200 },
  //   { field: 'CashActual', headerName: 'Cash Actual', width: 150 },
  //   { field: 'CashBudget', headerName: 'Cash Budget', width: 150 },
  //   { field: 'TotalDebtActual', headerName: 'Total Debt Actual', width: 180 },
  //   { field: 'TotalDebtBudget', headerName: 'Total Debt Budget', width: 180 },
  //   { field: 'AccountsReceivableActual', headerName: 'Accounts Receivable Actual', width: 220 },
  //   { field: 'AccountsReceivableBudget', headerName: 'Accounts Receivable Budget', width: 220 },
  //   { field: 'AccountsPayableActual', headerName: 'Accounts Payable Actual', width: 220 },
  //   { field: 'AccountsPayableBudget', headerName: 'Accounts Payable Budget', width: 220 },
  //   { field: 'InventoryActual', headerName: 'Inventory Actual', width: 150 },
  //   { field: 'InventoryBudget', headerName: 'Inventory Budget', width: 150 },
  //   { field: 'EmployeesActual', headerName: 'Employees Actual', width: 150 },
  //   { field: 'EmployeesBudget', headerName: 'Employees Budget', width: 150 },
  //   { field: 'Quarter', headerName: 'Quarter', width: 120 },
  // ];

  return (
    <div className="dashboard-container">
      <CustomSnackbar
        message={snackbarMessage}
        variant={snackbarVariant}
        onClose={handleCloseSnackbar}
        open={snackbarOpen}
      />

      <NavbarComponent
        username={username}
        handleLogout={handleLogout}
        isMobile={isMobile}
      />

      <ConfirmationModal
        show={showConfirmation}
        onHide={handleCloseConfirmation}
        onConfirm={handleConfirmLogout}
        title="Confirm Action"
        confirmText="Logout"
        confirmVariant="danger"
        message="Are you sure you want to log out?"
        showCancelButton={false}
      />

      {/* <Container fluid className="container-fluid mt-4">
    <Form className="border shadow p-3 d-flex flex-column flex-lg-row">
          <div className="search-wrapper col-lg-6 mb-3 mb-lg-0">
            <FormControl
              className="search-input"
              type="text"
              placeholder="Search"
              style={{ flex: "1" }}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="spacer"></div>

          <div className="filename mr-3 col-lg-2 mb-3 ">
          {roleID !== '3' && uploadedFileName ? (
            <div className="d-flex align-items-center">
              <p className="mb-0">{`File: ${uploadedFileName}`}</p>
              <FontAwesomeIcon
                icon={faTimes}
                className="ml-2 cancel-icon"
                onClick={() => setUploadedFileName("")} 
              />
            </div>
          ) : (
            roleID !== '3' && <p className="mb-0">No file uploaded</p>
          )}
        </div>

    <div className="spacer"></div>


    <div className="custom-file-upload d-flex align-items-center">
      
      <div {...getRootProps()} className="Upload-Form">
        <input {...getInputProps()} accept=".xlsx, .xls" />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <Button className="btn btn-secondary btn-sm Upload"  >
             <FontAwesomeIcon className="clearicon" icon={faUpload} />
             <span className="UploadText">Upload</span>
           </Button>
        )}
      </div>

           <Dropdown className='dropdown-Form'>
          <Dropdown.Toggle variant="secondary" id="dropdown-basic dropdown">
            <FontAwesomeIcon icon={faAngleDown} />
          </Dropdown.Toggle>

          <Dropdown.Menu className='menu-drop'>
            <Dropdown.Item onClick={() => handleFinancialSelect('Financial')}>Financial </Dropdown.Item>
            <Dropdown.Item onClick={() => handlePortfolioSelect('Portfolio ')}>Portfolio </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {roleID !== '3' && (
        <Button className="btn  btn-secondary submit" onClick={handleSubmit}>
          Submit
        </Button>
        )}



      </div>
    </Form>




    
    </Container> */}

      <Container fluid className="container-fluid mt-4">
        <Form className="border shadow p-3 d-flex flex-column flex-lg-row">
          <div className="search-wrapper col-lg-6 mb-3 mb-lg-0">
            <FormControl
              className="search-input"
              type="text"
              placeholder="Search"
              style={{ flex: "1" }}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="spacer"></div>

          <div className="filename mr-3 col-lg-2 mb-3 ">
            {roleID !== "3" && uploadedFileName ? (
              <div className="d-flex align-items-center">
                <p className="mb-0 overflow-hidden">{`File: ${uploadedFileName}`}</p>
                <FontAwesomeIcon
                  icon={faTimes} // Cancel icon
                  className="ml-2 cancel-icon"
                  onClick={() => setUploadedFileName("")} // onClick handler to clear uploadedFileName
                />
              </div>
            ) : (
              roleID !== "3" && <p className="mb-0"></p>
            )}
          </div>
          <div className="spacer"></div>
          {roleID !== "3" && (
            <div className="custom-file-upload d-flex">
              <div {...getRootProps()} className="Upload ">
                <input {...getInputProps()} accept=".xlsx, .xls" />
                {isDragActive ? (
                  <p>Drop the files here ...</p>
                ) : (
                  <Button className="btn btn-secondary btn-sm  Upload">
                    <FontAwesomeIcon className="clearicon" icon={faUpload} />
                    <span className="UploadText">Upload</span>
                  </Button>
                )}
              </div>
              <div className="spacer"></div>
              {roleID !== "3" && (
                <Button
                  className="btn  btn-secondary submit"
                  onClick={handleSubmit}
                >
                  Submit
                </Button>
              )}
            </div>
          )}
        </Form>
      </Container>

      {/* 
<div style={{ height: 400, width: '100%' }}>
      <AuditGrid
        initialRows={retriveData} 
        columnNames={columns} 
        onEdit={handleEdit}
        onSave={handleUpdateValidation}
        onDelete={handleDelete}
        onCancel={handleCancel}
      />
    </div>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br>
<br></br> */}

      <div>
        {filteredData.length === 0 ? (
          <div className="no-results">
            {/* <img src="/images.png" alt="No results found" className="background-image" /> */}
            <p>No results found</p>
          </div>
        ) : (
          <ExcelGrid
            filteredData={filteredData}
            selectedRowIds={selectedRowIds}
            editedRowId={editedRowId}
            editedRowData={editedRowData}
            handleCheckboxChange={handleCheckboxChange}
            handleEdit={handleEdit}
            handleCancel={handleCancel}
            handleInputChange={handleInputChange}
            handleSave={handleUpdateValidation}
            handleDelete={handleDelete}
            formatDateCell={formatDateCell}
            roleID={roleID}
            setEditedRowData={setEditedRowData}
            rowToDelete={rowToDelete}
            setRowToDelete={setRowToDelete}
          />
        )}
      </div>

      {/* Override Confirmation popup */}
      <>
        <ConfirmationModal
          show={showModal}
          onHide={handleCloseModal}
          onConfirm={handleConfirm}
          title="Confirm Override"
          cancelText="No"
          confirmText="Yes"
          cancelVariant="danger"
          confirmVariant="secondary"
          message="Are you sure you want to override?"
        />
      </>

      {/* Delete Confirmation popup */}
      <>
        <ConfirmationModal
          show={showDeleteModal}
          onHide={handleCloseDelete}
          onConfirm={handleConfirmDelete}
          title="Confirm Delete"
          cancelText="No"
          confirmText="Delete"
          cancelVariant="danger"
          confirmVariant="secondary"
          message={`Are you sure you want to delete the row ${formatMonthYear(
            filteredData.find((row) => row.ID === rowToDelete)?.MonthYear
          )}?`}
        />
      </>

      {/* override Update popup */}
      <>
        <ConfirmationModal
          show={showUpdateModal}
          onHide={handleCloseUpdate}
          onConfirm={handleSave}
          title="Confirm Update"
          cancelText="No"
          confirmText="Update"
          cancelVariant="danger"
          confirmVariant="secondary"
          message={`Are you sure you want to update?`}
        />
      </>

      {loading && <LoadingSpinner />}
    </div>
  );
}
export default Dashboard;
