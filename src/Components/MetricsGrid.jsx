import React, { useState, useEffect, useRef } from "react";
import { Table, Form } from "react-bootstrap";
import { Container, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { PortURL } from "./Config";
import LoadingSpinner from "./LoadingSpinner";
import "../styles/dashboard.css";
import "../styles/ExcelGrid.css";
import "../styles/auditGrid.css";

const MetricsGrid = ({ handleClose }) => {
  const [metricsData, setMetricsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "monthYear",
    direction: "descending",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState([]);
  const rowsPerBatch = 10000;
  const [currentBatch, setCurrentBatch] = useState(1);
  const [error, setError] = useState(null);

  const isFetched = useRef(false);

  const metricsColumnMap = {
    operatingResults: "Operating Results",
    monthYear: "Month-Year",
    companyName: "Company Name",
    revenue: "Revenue",
    grossProfit: "Gross Profit",
    grossMargin: "Gross Margin",
    sgaExpense: "SGA Expense",
    sgaPercentOfRevenue: "SGA % of Revenue",
    ebitdam: "EBITDA M",
    ebitdamPercentOfRevenue: "EBITDA % of Revenue",
    cash: "Cash",
    accountsReceivable: "Accounts Receivable",
    inventory: "Inventory",
    fixedAssetsNet: "Fixed Assets Net",
    accountsPayable: "Accounts Payable",
    totalDebt: "Total Debt",
    netDebt: "Net Debt",
    capEx: "CapEx",
    employees: "Employees",
  };

  useEffect(() => {
    if (!isFetched.current) {
      fetchMetricsData();
      isFetched.current = true;
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterYear, metricsData, sortConfig]);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector(".custom-scroll");
      if (
        container &&
        container.scrollTop + container.clientHeight >=
          container.scrollHeight - 100
      ) {
        loadMoreRows();
      }
    };

    const container = document.querySelector(".custom-scroll");
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [visibleRows, filteredData]);

  const loadMoreRows = () => {
    const newBatch = currentBatch + 1;
    const newVisibleRows = filteredData.slice(0, rowsPerBatch * newBatch);
    setVisibleRows(newVisibleRows);
    setCurrentBatch(newBatch);
  };

  const processMetricsEntry = (entry) => {
    if (!entry || !entry.metrics) return [];

    const types = ["1", "2", "3", "4", "5"];
    const typeLabels = {
      1: "Actual",
      2: "Budget",
      3: "Prior",
      4: "Variance - Actual vs Prior",
      5: "Variance - Actual vs Budget",
    };

    return types.map((type) => {
      const metrics = entry.metrics[type] || {};

      return {
        operatingResults: typeLabels[type],
        monthYear: entry.monthYear,
        companyName: entry.companyName || "",
        revenue: formatNumber(metrics.revenue),
        grossProfit: formatNumber(metrics.grossProfit),
        grossMargin: formatPercentage(metrics.grossMargin),
        sgaExpense: formatNumber(metrics.sgaExpense),
        sgaPercentOfRevenue: formatPercentage(metrics.sgaPercentOfRevenue),
        ebitdam: formatNumber(metrics.ebitdam),
        ebitdamPercentOfRevenue: formatPercentage(
          metrics.ebitdamPercentOfRevenue
        ),
        cash: formatNumber(metrics.cash),
        accountsReceivable: formatNumber(metrics.accountsReceivable),
        inventory: formatNumber(metrics.inventory),
        fixedAssetsNet: formatNumber(metrics.fixedAssetsNet),
        accountsPayable: formatNumber(metrics.accountsPayable),
        totalDebt: formatNumber(metrics.totalDebt),
        netDebt: formatNumber(metrics.netDebt),
        capEx: formatNumber(metrics.capEx),
        employees: metrics.employees || 0,
      };
    });
  };

  const fetchMetricsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${PortURL}/portfolio-metrics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Session-ID": localStorage.getItem("sessionId"),
          Email: localStorage.getItem("email"),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // console.log('Raw API response:', result);

      const data = result.data || result;

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from API");
      }

      // Process and flatten the data
      const processedData = data.flatMap((entry) => processMetricsEntry(entry));
      // Step 1: Create a map to store the original order of companies
      let companyOrder = [
        ...new Set(processedData.map((item) => item.companyName)),
      ];

      // Step 2: Group by company and sort within each group
      let groupedAndSorted = companyOrder.map((company) => {
        let companyData = processedData.filter(
          (item) => item.companyName === company
        );
        return companyData.sort(
          (a, b) => new Date(a.monthYear) - new Date(b.monthYear)
        );
      });

      // Step 3: Flatten the grouped and sorted data
      let sortedData = groupedAndSorted.flat();
      // Sort by date and company name
      //   processedData.sort((a, b) => {
      //     const dateCompare = new Date(b.monthYear) - new Date(a.monthYear);
      //   });

      setMetricsData(sortedData);
      setFilteredData(sortedData);
      setVisibleRows(sortedData.slice(0, rowsPerBatch));
    } catch (error) {
      console.error("Error fetching metrics data:", error);
      setError(error.message);
      setMetricsData([]);
      setFilteredData([]);
      setVisibleRows([]);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00";
    }
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00%";
    }
    return `${value.toFixed(2)}%`;
  };

  const formatMonthYear = (dateString) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleString("default", { month: "short" })}-${date
        .getFullYear()
        .toString()
        .slice(-2)}`;
    } catch (e) {
      console.warn("Error formatting date:", e);
      return dateString;
    }
  };

  const applyFilters = () => {
    let filtered = [...metricsData];

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((item) =>
        Object.values(item).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterYear !== "") {
      filtered = filtered.filter((item) => {
        try {
          const date = new Date(item.monthYear);
          return date.getFullYear().toString() === filterYear;
        } catch (e) {
          console.warn("Invalid date:", item.monthYear);
          return false;
        }
      });
    }

    // Apply sorting
    if (
      sortConfig.key &&
      sortConfig.key !== "companyName" &&
      sortConfig.key !== "operatingResults"
    ) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle percentage strings
        if (typeof aValue === "string" && aValue.includes("%")) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        }

        // Handle formatted numbers
        if (typeof aValue === "string" && aValue.includes(",")) {
          aValue = parseFloat(aValue.replace(/,/g, ""));
          bValue = parseFloat(bValue.replace(/,/g, ""));
        }

        // if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        // if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
    setVisibleRows(filtered.slice(0, rowsPerBatch * currentBatch));
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const renderTableHeaders = () => (
    <thead className="sticky-header">
      <tr>
        {Object.entries(metricsColumnMap).map(([key, label]) => (
          <th key={key} onClick={() => requestSort(key)}>
            <div className="d-flex align-items-center justify-content-between">
              <span>{label}</span>
              {sortConfig.key === key && (
                <FontAwesomeIcon
                  icon={faCaretDown}
                  className={`ml-1 ${
                    sortConfig.direction === "ascending" ? "fa-rotate-180" : ""
                  }`}
                />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderTableBody = () => {
    if (visibleRows.length === 0) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={Object.keys(metricsColumnMap).length}
              className="text-center"
            >
              No results found
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {visibleRows.map((row, index) => (
          <tr key={`${row.companyName}-${row.monthYear}-${index}`}>
            {Object.keys(metricsColumnMap).map((key) => (
              <td key={key}>
                {key === "monthYear" ? formatMonthYear(row[key]) : row[key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return (
        <div className="text-center p-4">
          <p className="text-danger">Error loading data: {error}</p>
          <button
            className="btn btn-primary mt-2"
            onClick={() => {
              isFetched.current = false;
              fetchMetricsData();
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <Table striped bordered hover>
        {renderTableHeaders()}
        {renderTableBody()}
      </Table>
    );
  };

  return (
    <Container fluid className="audit-grid-container">
      <Row className="audit-header-container justify-content-between align-items-center">
        <Col>
          <h4 className="text-light">Metrics Data</h4>
        </Col>
        <Col className="text-right">
          <div className="close-audit text-light" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </div>
        </Col>
      </Row>
      <Container fluid className="container-fluid mt-2">
        <Row className="filter-container justify-content-between">
          <Col md={6} className="search-bar-audit">
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={3} className="year-filter-audit">
            <Form.Control
              as="select"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">Select Year</option>
              {Array.from(
                new Set(
                  metricsData
                    .map((item) => {
                      try {
                        const date = new Date(item.monthYear);
                        return date.getFullYear();
                      } catch (e) {
                        console.warn("Invalid date:", item.monthYear);
                        return null;
                      }
                    })
                    .filter(Boolean)
                )
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Form.Control>
            <FontAwesomeIcon
              icon={faCaretDown}
              className="dropdown-icon-audit"
            />
          </Col>
        </Row>
      </Container>
      <Row className="table-audit">
        <Col className="custom-scroll">{renderContent()}</Col>
      </Row>
    </Container>
  );
};

export default MetricsGrid;
