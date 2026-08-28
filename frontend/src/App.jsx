import { useState, useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ======================================================
// API URL
// ======================================================

const API_URL = "http://127.0.0.1:8000";

// ======================================================
// FIX LEAFLET DEFAULT MARKER
// ======================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ======================================================
// TAMIL NADU DISTRICT LOCATIONS
// ======================================================

const districtLocations = {
  Chennai: [13.0827, 80.2707],
  Coimbatore: [11.0168, 76.9558],
  Madurai: [9.9252, 78.1198],
  Salem: [11.6643, 78.146],
  Trichy: [10.7905, 78.7047],
  Tiruchirappalli: [10.7905, 78.7047],
  Tirunelveli: [8.7139, 77.7567],
  Erode: [11.341, 77.7172],
  Vellore: [12.9165, 79.1325],
  Thanjavur: [10.787, 79.1378],
  Dindigul: [10.3673, 77.9803],
  Thoothukudi: [8.7642, 78.1348],
  Kanchipuram: [12.8342, 79.7036],
  Villupuram: [11.9401, 79.4861],
  Namakkal: [11.2194, 78.1677],
  Dharmapuri: [12.1211, 78.1582],
  Krishnagiri: [12.5186, 78.2137],
  Karur: [10.9601, 78.0766],
  Sivaganga: [9.847, 78.4836],
  Ramanathapuram: [9.3639, 78.8395],
  Virudhunagar: [9.568, 77.9624],
  Cuddalore: [11.748, 79.7714],
  Nagapattinam: [10.7672, 79.8449],
  Tenkasi: [8.959, 77.3152],
  Ariyalur: [11.1401, 79.0786],
  Perambalur: [11.2342, 78.8806],
  Pudukkottai: [10.3797, 78.8208],
  Nilgiris: [11.4102, 76.695],
};

// ======================================================
// RISK COLORS
// ======================================================

const getRiskColor = (risk) => {
  if (risk === "HIGH") {
    return "#ef4444";
  }

  if (risk === "MEDIUM") {
    return "#f59e0b";
  }

  return "#22c55e";
};

// ======================================================
// CUSTOM RISK MAP ICON
// ======================================================

const createRiskIcon = (risk) => {
  const color = getRiskColor(risk);

  return L.divIcon({
    className: "custom-map-marker",

    html: `
      <div
        style="
          width: 22px;
          height: 22px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        "
      ></div>
    `,

    iconSize: [22, 22],

    iconAnchor: [11, 11],
  });
};

// ======================================================
// AUTO FIT MAP
// ======================================================

function AutoFitBounds({ projects }) {
  const map = useMap();

  useEffect(() => {
    let locations = [];

    // DATABASE PROJECT LOCATIONS
    if (projects.length > 0) {
      locations = projects
        .map((project) => {
          const district = project.district?.trim();

          return districtLocations[district];
        })
        .filter(Boolean);
    }

    // DEMO LOCATIONS
    else {
      locations = [
        [13.0827, 80.2707],
        [11.0168, 76.9558],
        [9.9252, 78.1198],
      ];
    }

    // ONE LOCATION
    if (locations.length === 1) {
      map.setView(locations[0], 9);
    }

    // MULTIPLE LOCATIONS
    else if (locations.length > 1) {
      const bounds = L.latLngBounds(locations);

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 10,
        animate: true,
      });
    }
  }, [projects, map]);

  return null;
}

// ======================================================
// APP
// ======================================================

function App() {
  // ====================================================
  // STATES
  // ====================================================

  const [showForm, setShowForm] = useState(false);

  const [activePage, setActivePage] =
    useState("dashboard");

  const [prediction, setPrediction] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [projects, setProjects] =
    useState([]);

  const [projectsLoading, setProjectsLoading] =
    useState(false);

  const [projectsError, setProjectsError] =
    useState("");

  // ====================================================
  // LOAD PROJECTS ON START
  // ====================================================

  useEffect(() => {
    loadProjects();
  }, []);

  // ====================================================
  // GET PROJECTS FROM FASTAPI
  // ====================================================

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError("");

    try {
      console.log("Loading projects from FastAPI...");

      const response = await fetch(
        `${API_URL}/projects`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log(
        "Projects API status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `Projects API returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Projects API response:",
        data
      );

      let projectList = [];

      if (Array.isArray(data)) {
        projectList = data;
      } else if (
        data &&
        Array.isArray(data.projects)
      ) {
        projectList = data.projects;
      } else {
        console.warn(
          "Unexpected projects API response:",
          data
        );
      }

      console.log(
        "Projects loaded:",
        projectList
      );

      setProjects(projectList);
    } catch (error) {
      console.error(
        "Projects API error:",
        error
      );

      setProjectsError(
        "Unable to load projects. Make sure FastAPI is running on port 8000."
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  // ====================================================
  // OPEN AI PREDICTION
  // ====================================================

  const openPrediction = () => {
    setActivePage("prediction");

    setShowForm(true);

    setPrediction(null);
  };

  // ====================================================
  // OPEN GIS MAP
  // ====================================================

  const openMap = () => {
    setActivePage("map");

    setShowForm(false);

    setPrediction(null);
  };

  // ====================================================
  // HANDLE AI PREDICTION
  // ====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    // ==================================================
    // CREATE PROJECT DATA
    // ==================================================

    const projectData = {
      project_id:
        formData.get("projectId"),

      project_type:
        formData.get("projectType"),

      state:
        formData.get("state"),

      district:
        formData.get("district"),

      land_area:
        Number(formData.get("landArea")),

      affected_families:
        Number(formData.get("families")),

      compensation_percentage:
        Number(formData.get("compensation")),

      documentation_percentage:
        Number(formData.get("documentation")),

      approval_percentage:
        Number(formData.get("approval")),

      rr_progress:
        Number(formData.get("rrProgress")),

      possession_percentage:
        Number(formData.get("possession")),

      legal_disputes:
        Number(formData.get("legalDisputes")),

      approval_delay_days:
        Number(formData.get("approvalDelay")),

      stakeholder_responsiveness:
        Number(formData.get("stakeholder")),
    };

    console.log(
      "Sending prediction data:",
      projectData
    );

    setLoading(true);

    setPrediction(null);

    try {
      // ==================================================
      // SEND DATA TO FASTAPI
      // ==================================================

      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(
              projectData
            ),
        }
      );

      console.log(
        "Prediction API status:",
        response.status
      );

      // Read response as text first
      // This makes backend errors easier to see.

      const responseText =
        await response.text();

      console.log(
        "Prediction API response:",
        responseText
      );

      if (!response.ok) {
        throw new Error(
          `Prediction API returned ${response.status}: ${responseText}`
        );
      }

      const result =
        JSON.parse(responseText);

      console.log(
        "Prediction result:",
        result
      );

      // ==================================================
      // SHOW AI RESULT
      // ==================================================

      setPrediction({
        probability:
          result.delay_probability,

        risk:
          result.risk_level,

        riskFactors:
          result.risk_factors || [],

        recommendations:
          result.recommendations || [],
      });

      // ==================================================
      // RELOAD PROJECTS
      // ==================================================

      // IMPORTANT:
      // If projects API fails, it will NOT
      // trigger the prediction catch block.

      loadProjects();

    } catch (error) {
      console.error(
        "Prediction API error:",
        error
      );

      alert(
        "AI Prediction failed.\n\n" +
        error.message +
        "\n\n" +
        "Make sure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // CLOSE FORM
  // ====================================================

  const closeForm = () => {
    setShowForm(false);

    setPrediction(null);

    setActivePage("dashboard");
  };

  // ====================================================
  // RETURN UI
  // ====================================================

  return (
    <div className="app">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="sidebar">

        <h2>
          LandAI
        </h2>

        <p className="subtitle">
          Acquisition Intelligence
        </p>

        <nav>

          {/* DASHBOARD */}

          <div
            className={`nav-item ${
              activePage === "dashboard" &&
              !showForm
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("dashboard");

              setShowForm(false);

              setPrediction(null);
            }}
          >
            🏠 Dashboard
          </div>

          {/* PROJECTS */}

          <div
            className={`nav-item ${
              activePage === "projects"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("projects");

              setShowForm(false);

              setPrediction(null);
            }}
          >
            📋 Projects
          </div>

          {/* AI PREDICTION */}

          <div
            className={`nav-item ${
              activePage === "prediction"
                ? "active"
                : ""
            }`}
            onClick={openPrediction}
          >
            🤖 AI Prediction
          </div>

          {/* GIS MAP */}

          <div
            className={`nav-item ${
              activePage === "map"
                ? "active"
                : ""
            }`}
            onClick={openMap}
          >
            🗺️ GIS Map
          </div>

          {/* ALERTS */}

          <div
            className={`nav-item ${
              activePage === "alerts"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setActivePage("alerts");

              setShowForm(false);

              setPrediction(null);
            }}
          >
            🔔 Alerts
          </div>

        </nav>

      </aside>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="main">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header>

          <div>

            <h1>
              Land Acquisition Dashboard
            </h1>

            <p>
              AI-powered early detection
              of project delays
            </p>

          </div>

          <button
            className="add-btn"
            onClick={openPrediction}
          >
            + Add Project
          </button>

        </header>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="stats">

          <div className="card">

            <span>
              Total Projects
            </span>

            <h2>
              1,248
            </h2>

            <p>
              All registered projects
            </p>

          </div>

          <div className="card high">

            <span>
              High Risk
            </span>

            <h2>
              184
            </h2>

            <p>
              Requires immediate attention
            </p>

          </div>

          <div className="card medium">

            <span>
              Medium Risk
            </span>

            <h2>
              327
            </h2>

            <p>
              Needs monitoring
            </p>

          </div>

          <div className="card low">

            <span>
              Low Risk
            </span>

            <h2>
              737
            </h2>

            <p>
              Progressing normally
            </p>

          </div>

        </section>

        {/* ==================================================
            PROJECTS PAGE
        ================================================== */}

        {activePage === "projects" && (

          <section className="form-panel">

            <div className="form-header">

              <div>

                <h2>
                  📋 Projects
                </h2>

                <p>
                  View land acquisition projects.
                </p>

              </div>

            </div>

            <div className="projects-table-container">

              {projectsLoading ? (

                <div className="projects-empty">

                  <h2>
                    Loading Projects...
                  </h2>

                  <p>
                    Fetching project data from FastAPI.
                  </p>

                </div>

              ) : projectsError ? (

                <div className="projects-empty">

                  <div className="empty-icon">
                    ⚠️
                  </div>

                  <h2>
                    Unable to Load Projects
                  </h2>

                  <p>
                    {projectsError}
                  </p>

                  <button
                    className="predict-btn"
                    onClick={loadProjects}
                  >
                    🔄 Try Again
                  </button>

                </div>

              ) : projects.length === 0 ? (

                <div className="projects-empty">

                  <div className="empty-icon">
                    📁
                  </div>

                  <h2>
                    No Projects Found
                  </h2>

                  <p>
                    Add your first land acquisition project.
                  </p>

                  <button
                    className="predict-btn"
                    onClick={openPrediction}
                  >
                    + Add New Project
                  </button>

                </div>

              ) : (

                <table className="projects-table">

                  <thead>

                    <tr>

                      <th>
                        Project ID
                      </th>

                      <th>
                        Type
                      </th>

                      <th>
                        District
                      </th>

                      <th>
                        State
                      </th>

                      <th>
                        Delay Probability
                      </th>

                      <th>
                        Risk
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {projects.map(
                      (project) => (

                        <tr
                          key={
                            project.id ||
                            project.project_id
                          }
                        >

                          <td>

                            <strong>
                              {
                                project.project_id
                              }
                            </strong>

                          </td>

                          <td>
                            {
                              project.project_type
                            }
                          </td>

                          <td>
                            {
                              project.district
                            }
                          </td>

                          <td>
                            {
                              project.state
                            }
                          </td>

                          <td>

                            {
                              project.delay_probability
                            }%

                          </td>

                          <td>

                            <span
                              className={`table-risk ${
                                project.risk_level
                                  ? project.risk_level.toLowerCase()
                                  : ""
                              }`}
                            >

                              {
                                project.risk_level
                              }

                            </span>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              )}

            </div>

          </section>

        )}

        {/* ==================================================
            GIS MAP
        ================================================== */}

        {activePage === "map" && (

          <section className="form-panel">

            <div className="form-header">

              <div>

                <h2>
                  🗺️ GIS Project Map
                </h2>

                <p>
                  Geographic visualization
                  of land acquisition projects.
                </p>

              </div>

            </div>

            {/* MAP LEGEND */}

            <div
              style={{
                display: "flex",
                gap: "20px",
                marginBottom: "15px",
                flexWrap: "wrap",
              }}
            >

              <div>
                🔴 <strong>High Risk</strong>
              </div>

              <div>
                🟡 <strong>Medium Risk</strong>
              </div>

              <div>
                🟢 <strong>Low Risk</strong>
              </div>

            </div>

            {/* REAL MAP */}

            <div className="real-map">

              <MapContainer
                center={[
                  11.1271,
                  78.6569
                ]}
                zoom={7}
                scrollWheelZoom={true}
                style={{
                  height: "550px",
                  width: "100%",
                  borderRadius: "15px",
                }}
              >

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <AutoFitBounds
                  projects={projects}
                />

                {/* DATABASE PROJECT MARKERS */}

                {projects.map(
                  (project) => {

                    const district =
                      project.district?.trim();

                    const location =
                      districtLocations[district];

                    if (!location) {
                      return null;
                    }

                    const risk =
                      project.risk_level ||
                      "LOW";

                    return (

                      <Marker
                        key={
                          project.id ||
                          project.project_id
                        }
                        position={location}
                        icon={
                          createRiskIcon(
                            risk
                          )
                        }
                      >

                        <Popup>

                          <div
                            style={{
                              minWidth: "210px",
                            }}
                          >

                            <h3
                              style={{
                                marginBottom: "10px",
                              }}
                            >

                              📍{" "}
                              {
                                project.project_id
                              }

                            </h3>

                            <p>

                              <strong>
                                District:
                              </strong>{" "}

                              {
                                project.district
                              }

                            </p>

                            <p>

                              <strong>
                                State:
                              </strong>{" "}

                              {
                                project.state
                              }

                            </p>

                            <p>

                              <strong>
                                Type:
                              </strong>{" "}

                              {
                                project.project_type
                              }

                            </p>

                            <p>

                              <strong>
                                Delay Probability:
                              </strong>{" "}

                              {
                                project.delay_probability
                              }%

                            </p>

                            <p
                              style={{
                                color:
                                  getRiskColor(
                                    risk
                                  ),
                                fontWeight:
                                  "bold",
                                fontSize:
                                  "15px",
                              }}
                            >

                              {risk === "HIGH" &&
                                "🔴 HIGH RISK"}

                              {risk === "MEDIUM" &&
                                "🟡 MEDIUM RISK"}

                              {risk === "LOW" &&
                                "🟢 LOW RISK"}

                            </p>

                          </div>

                        </Popup>

                      </Marker>

                    );
                  }
                )}

                {/* DEMO MARKERS */}

                {projects.length === 0 && (

                  <>

                    {/* CHENNAI */}

                    <Marker
                      position={[
                        13.0827,
                        80.2707
                      ]}
                      icon={
                        createRiskIcon(
                          "HIGH"
                        )
                      }
                    >

                      <Popup>

                        <strong>
                          LA-1023
                        </strong>

                        <br />

                        Chennai

                        <br />

                        Highway Expansion

                        <br />

                        🔴 87% Delay Risk

                      </Popup>

                    </Marker>

                    {/* COIMBATORE */}

                    <Marker
                      position={[
                        11.0168,
                        76.9558
                      ]}
                      icon={
                        createRiskIcon(
                          "MEDIUM"
                        )
                      }
                    >

                      <Popup>

                        <strong>
                          LA-1087
                        </strong>

                        <br />

                        Coimbatore

                        <br />

                        Railway Project

                        <br />

                        🟡 81% Delay Risk

                      </Popup>

                    </Marker>

                    {/* MADURAI */}

                    <Marker
                      position={[
                        9.9252,
                        78.1198
                      ]}
                      icon={
                        createRiskIcon(
                          "HIGH"
                        )
                      }
                    >

                      <Popup>

                        <strong>
                          LA-1142
                        </strong>

                        <br />

                        Madurai

                        <br />

                        Road Development

                        <br />

                        🔴 76% Delay Risk

                      </Popup>

                    </Marker>

                  </>

                )}

              </MapContainer>

            </div>

          </section>

        )}

        {/* ==================================================
            ALERTS
        ================================================== */}

        {activePage === "alerts" && (

          <section className="form-panel">

            <div className="form-header">

              <div>

                <h2>
                  🔔 Alerts & Notifications
                </h2>

                <p>
                  Monitor projects requiring attention.
                </p>

              </div>

            </div>

            <div className="alerts-container">

              <div className="alert-card high-alert">

                <div className="alert-icon">
                  🔴
                </div>

                <div>

                  <h3>
                    High Risk Project
                  </h3>

                  <p>
                    LA-1023 has an
                    87% probability of delay.
                  </p>

                </div>

              </div>

              <div className="alert-card medium-alert">

                <div className="alert-icon">
                  🟡
                </div>

                <div>

                  <h3>
                    Medium Risk Project
                  </h3>

                  <p>
                    LA-1087 requires monitoring.
                  </p>

                </div>

              </div>

              <div className="alert-card">

                <div className="alert-icon">
                  ℹ️
                </div>

                <div>

                  <h3>
                    System Notification
                  </h3>

                  <p>
                    AI model is running successfully.
                  </p>

                </div>

              </div>

            </div>

          </section>

        )}

        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {!showForm &&
          activePage === "dashboard" && (

            <>

              <section className="dashboard-grid">

                {/* AI RISK OVERVIEW */}

                <div className="panel">

                  <h2>
                    AI Risk Overview
                  </h2>

                  {/* HIGH */}

                  <div className="risk">

                    <div>

                      <strong>
                        🔴 High Risk
                      </strong>

                      <span>
                        184 Projects
                      </span>

                    </div>

                    <div className="bar">

                      <div
                        className="bar-fill high-bar"
                      ></div>

                    </div>

                  </div>

                  {/* MEDIUM */}

                  <div className="risk">

                    <div>

                      <strong>
                        🟡 Medium Risk
                      </strong>

                      <span>
                        327 Projects
                      </span>

                    </div>

                    <div className="bar">

                      <div
                        className="bar-fill medium-bar"
                      ></div>

                    </div>

                  </div>

                  {/* LOW */}

                  <div className="risk">

                    <div>

                      <strong>
                        🟢 Low Risk
                      </strong>

                      <span>
                        737 Projects
                      </span>

                    </div>

                    <div className="bar">

                      <div
                        className="bar-fill low-bar"
                      ></div>

                    </div>

                  </div>

                </div>

                {/* RECENT PROJECTS */}

                <div className="panel">

                  <h2>
                    Recent High-Risk Projects
                  </h2>

                  <div className="project">

                    <div>

                      <strong>
                        LA-1023
                      </strong>

                      <p>
                        Chennai – Highway Expansion
                      </p>

                    </div>

                    <span className="risk-badge">
                      87%
                    </span>

                  </div>

                  <div className="project">

                    <div>

                      <strong>
                        LA-1087
                      </strong>

                      <p>
                        Coimbatore – Railway Project
                      </p>

                    </div>

                    <span className="risk-badge">
                      81%
                    </span>

                  </div>

                  <div className="project">

                    <div>

                      <strong>
                        LA-1142
                      </strong>

                      <p>
                        Madurai – Road Development
                      </p>

                    </div>

                    <span className="risk-badge">
                      76%
                    </span>

                  </div>

                </div>

              </section>

              {/* AI PANEL */}

              <section className="ai-panel">

                <div>

                  <h2>
                    🤖 AI Delay Prediction
                  </h2>

                  <p>
                    Analyze project factors
                    and predict the probability
                    of land acquisition delays.
                  </p>

                </div>

                <button
                  className="predict-btn"
                  onClick={openPrediction}
                >
                  Predict Project Risk →
                </button>

              </section>

              {/* MAP QUICK ACCESS */}

              <section className="ai-panel">

                <div>

                  <h2>
                    🗺️ GIS Project Map
                  </h2>

                  <p>
                    View project locations
                    and identify high-risk
                    areas geographically.
                  </p>

                </div>

                <button
                  className="predict-btn"
                  onClick={openMap}
                >
                  Open GIS Map →
                </button>

              </section>

            </>

          )}

        {/* ==================================================
            AI PREDICTION FORM
        ================================================== */}

        {showForm && (

          <section className="form-panel">

            {/* FORM HEADER */}

            <div className="form-header">

              <div>

                <h2>
                  🤖 AI Delay Prediction
                </h2>

                <p>
                  Enter project details
                  for AI-based delay prediction.
                </p>

              </div>

              <button
                className="close-btn"
                onClick={closeForm}
              >
                ✕
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>

              <h3>
                Project Information
              </h3>

              <div className="form-grid">

                {/* PROJECT ID */}

                <div className="input-group">

                  <label>
                    Project ID
                  </label>

                  <input
                    type="text"
                    name="projectId"
                    placeholder="Example: LA-1201"
                    required
                  />

                </div>

                {/* PROJECT TYPE */}

                <div className="input-group">

                  <label>
                    Project Type
                  </label>

                  <select
                    name="projectType"
                    required
                  >

                    <option value="">
                      Select project type
                    </option>

                    <option value="Highway">
                      Highway
                    </option>

                    <option value="Railway">
                      Railway
                    </option>

                    <option value="Airport">
                      Airport
                    </option>

                    <option value="Industrial Corridor">
                      Industrial Corridor
                    </option>

                    <option value="Irrigation">
                      Irrigation
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

                {/* STATE */}

                <div className="input-group">

                  <label>
                    State
                  </label>

                  <input
                    type="text"
                    name="state"
                    placeholder="Example: Tamil Nadu"
                    required
                  />

                </div>

                {/* DISTRICT */}

                <div className="input-group">

                  <label>
                    District
                  </label>

                  <input
                    type="text"
                    name="district"
                    placeholder="Example: Chennai"
                    required
                  />

                </div>

                {/* LAND AREA */}

                <div className="input-group">

                  <label>
                    Land Area (Acres)
                  </label>

                  <input
                    type="number"
                    name="landArea"
                    min="0"
                    placeholder="Example: 250"
                    required
                  />

                </div>

                {/* FAMILIES */}

                <div className="input-group">

                  <label>
                    Affected Families
                  </label>

                  <input
                    type="number"
                    name="families"
                    min="0"
                    placeholder="Example: 180"
                    required
                  />

                </div>

              </div>

              {/* ACQUISITION PROGRESS */}

              <h3>
                Acquisition Progress
              </h3>

              <div className="form-grid">

                {/* COMPENSATION */}

                <div className="input-group">

                  <label>
                    Compensation Completed (%)
                  </label>

                  <input
                    type="number"
                    name="compensation"
                    min="0"
                    max="100"
                    placeholder="Example: 65"
                    required
                  />

                </div>

                {/* DOCUMENTATION */}

                <div className="input-group">

                  <label>
                    Documentation Completed (%)
                  </label>

                  <input
                    type="number"
                    name="documentation"
                    min="0"
                    max="100"
                    placeholder="Example: 75"
                    required
                  />

                </div>

                {/* APPROVAL */}

                <div className="input-group">

                  <label>
                    Approval Completed (%)
                  </label>

                  <input
                    type="number"
                    name="approval"
                    min="0"
                    max="100"
                    placeholder="Example: 60"
                    required
                  />

                </div>

                {/* RR */}

                <div className="input-group">

                  <label>
                    Rehabilitation Progress (%)
                  </label>

                  <input
                    type="number"
                    name="rrProgress"
                    min="0"
                    max="100"
                    placeholder="Example: 45"
                    required
                  />

                </div>

                {/* POSSESSION */}

                <div className="input-group">

                  <label>
                    Possession Completed (%)
                  </label>

                  <input
                    type="number"
                    name="possession"
                    min="0"
                    max="100"
                    placeholder="Example: 40"
                    required
                  />

                </div>

                {/* LEGAL DISPUTES */}

                <div className="input-group">

                  <label>
                    Legal Disputes
                  </label>

                  <input
                    type="number"
                    name="legalDisputes"
                    min="0"
                    placeholder="Example: 4"
                    required
                  />

                </div>

                {/* APPROVAL DELAY */}

                <div className="input-group">

                  <label>
                    Approval Delay (Days)
                  </label>

                  <input
                    type="number"
                    name="approvalDelay"
                    min="0"
                    placeholder="Example: 45"
                    required
                  />

                </div>

                {/* STAKEHOLDER */}

                <div className="input-group">

                  <label>
                    Stakeholder Responsiveness (%)
                  </label>

                  <input
                    type="number"
                    name="stakeholder"
                    min="0"
                    max="100"
                    placeholder="Example: 55"
                    required
                  />

                </div>

              </div>

              {/* FORM BUTTONS */}

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="predict-btn"
                  disabled={loading}
                >

                  {loading
                    ? "🤖 Analyzing..."
                    : "🤖 Predict Delay Risk"
                  }

                </button>

              </div>

            </form>

            {/* ==================================================
                AI RESULT
            ================================================== */}

            {prediction && (

              <div className="prediction-result">

                <h2>
                  🤖 AI Prediction Result
                </h2>

                {/* SCORE */}

                <div className="prediction-score">

                  <span>
                    Delay Probability
                  </span>

                  <strong>
                    {
                      prediction.probability
                    }%
                  </strong>

                </div>

                {/* RISK */}

                <div className="prediction-risk">

                  {prediction.risk ===
                    "HIGH" && "🔴"}

                  {prediction.risk ===
                    "MEDIUM" && "🟡"}

                  {prediction.risk ===
                    "LOW" && "🟢"}

                  {" "}

                  {
                    prediction.risk
                  } RISK

                </div>

                {/* RISK FACTORS */}

                <div className="risk-factors">

                  <h3>
                    ⚠️ Key Risk Factors
                  </h3>

                  <ul>

                    {prediction.riskFactors
                      .length > 0 ? (

                      prediction.riskFactors.map(
                        (factor, index) => (

                          <li
                            key={index}
                          >
                            {factor}
                          </li>

                        )
                      )

                    ) : (

                      <li>
                        No major risk
                        factors detected.
                      </li>

                    )}

                  </ul>

                </div>

                {/* RECOMMENDATIONS */}

                <div className="recommendations">

                  <h3>
                    💡 Recommended Actions
                  </h3>

                  <ul>

                    {prediction.recommendations
                      .length > 0 ? (

                      prediction.recommendations.map(
                        (action, index) => (

                          <li
                            key={index}
                          >
                            {action}
                          </li>

                        )
                      )

                    ) : (

                      <li>
                        Continue regular
                        monitoring of the project.
                      </li>

                    )}

                  </ul>

                </div>

              </div>

            )}

          </section>

        )}

      </main>

    </div>
  );
}

export default App;