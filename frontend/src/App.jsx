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
//
// Local:
// VITE_API_URL=http://127.0.0.1:8000
//
// Render:
// VITE_API_URL=https://land-acquisition-ai-sih-1.onrender.com
//
// IMPORTANT:
// Your deployed FastAPI backend is:
// https://land-acquisition-ai-sih-1.onrender.com
// ======================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://land-acquisition-ai-sih-1.onrender.com";

console.log("API URL:", API_URL);

// ======================================================
// LEAFLET DEFAULT MARKER FIX
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
// RISK COLOR
// ======================================================

const getRiskColor = (risk) => {
  const value = String(risk || "LOW").toUpperCase();

  if (value === "HIGH") {
    return "#ef4444";
  }

  if (value === "MEDIUM") {
    return "#f59e0b";
  }

  return "#22c55e";
};

// ======================================================
// RISK ICON
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
// MAP AUTO FIT
// ======================================================

function AutoFitBounds({ projects }) {
  const map = useMap();

  useEffect(() => {
    let locations = [];

    if (projects.length > 0) {
      locations = projects
        .map((project) => {
          const district = project.district?.trim();

          return districtLocations[district];
        })
        .filter(Boolean);
    }

    if (locations.length === 0) {
      locations = [
        [13.0827, 80.2707],
        [11.0168, 76.9558],
        [9.9252, 78.1198],
      ];
    }

    if (locations.length === 1) {
      map.setView(locations[0], 9);
    } else {
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
  // LOAD PROJECTS WHEN APP STARTS
  // ====================================================

  useEffect(() => {
    loadProjects();
  }, []);

  // ====================================================
  // LOAD PROJECTS
  // ====================================================

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError("");

    try {
      console.log(
        "Loading projects from:",
        `${API_URL}/projects`
      );

      const response = await fetch(
        `${API_URL}/projects`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      console.log(
        "Projects status:",
        response.status
      );

      console.log(
        "Projects response:",
        responseText
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}: ${responseText}`
        );
      }

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Backend returned invalid JSON."
        );
      }

      let projectList = [];

      if (Array.isArray(data)) {
        projectList = data;
      } else if (
        data &&
        Array.isArray(data.projects)
      ) {
        projectList = data.projects;
      }

      setProjects(projectList);

      console.log(
        "Projects loaded:",
        projectList
      );
    } catch (error) {
      console.error(
        "Project loading error:",
        error
      );

      setProjectsError(
        error.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  // ====================================================
  // STATISTICS
  // ====================================================

  const totalProjects = projects.length;

  const highRiskProjects = projects.filter(
    (project) =>
      String(
        project.risk_level
      ).toUpperCase() === "HIGH"
  );

  const mediumRiskProjects = projects.filter(
    (project) =>
      String(
        project.risk_level
      ).toUpperCase() === "MEDIUM"
  );

  const lowRiskProjects = projects.filter(
    (project) =>
      String(
        project.risk_level
      ).toUpperCase() === "LOW"
  );

  const highCount =
    highRiskProjects.length;

  const mediumCount =
    mediumRiskProjects.length;

  const lowCount =
    lowRiskProjects.length;

  // ====================================================
  // OPEN PREDICTION
  // ====================================================

  const openPrediction = () => {
    setActivePage("prediction");
    setShowForm(true);
    setPrediction(null);
  };

  // ====================================================
  // OPEN MAP
  // ====================================================

  const openMap = () => {
    setActivePage("map");
    setShowForm(false);
    setPrediction(null);
  };

  // ====================================================
  // OPEN DASHBOARD
  // ====================================================

  const openDashboard = () => {
    setActivePage("dashboard");
    setShowForm(false);
    setPrediction(null);
  };

  // ====================================================
  // HANDLE AI PREDICTION
  // ====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData =
      new FormData(e.target);

    // ==================================================
    // CREATE DATA FOR FASTAPI
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
        Number(
          formData.get("landArea")
        ),

      affected_families:
        Number(
          formData.get("families")
        ),

      compensation_percentage:
        Number(
          formData.get("compensation")
        ),

      documentation_percentage:
        Number(
          formData.get("documentation")
        ),

      approval_percentage:
        Number(
          formData.get("approval")
        ),

      rr_progress:
        Number(
          formData.get("rrProgress")
        ),

      possession_percentage:
        Number(
          formData.get("possession")
        ),

      legal_disputes:
        Number(
          formData.get("legalDisputes")
        ),

      approval_delay_days:
        Number(
          formData.get("approvalDelay")
        ),

      stakeholder_responsiveness:
        Number(
          formData.get("stakeholder")
        ),
    };

    // ==================================================
    // LOG DATA
    // ==================================================

    console.log(
      "================================"
    );

    console.log(
      "Sending prediction request"
    );

    console.log(
      "API URL:",
      API_URL
    );

    console.log(
      "Endpoint:",
      `${API_URL}/predict`
    );

    console.log(
      "Project data:",
      projectData
    );

    console.log(
      "================================"
    );

    setLoading(true);
    setPrediction(null);

    // ==================================================
    // CALL FASTAPI
    // ==================================================

    try {
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

          body: JSON.stringify(
            projectData
          ),
        }
      );

      // ==================================================
      // READ RESPONSE
      // ==================================================

      const responseText =
        await response.text();

      console.log(
        "Backend HTTP status:",
        response.status
      );

      console.log(
        "Backend response:",
        responseText
      );

      // ==================================================
      // CHECK HTTP ERROR
      // ==================================================

      if (!response.ok) {
        throw new Error(
          `Prediction failed (${response.status}): ${responseText}`
        );
      }

      // ==================================================
      // CONVERT RESPONSE TO JSON
      // ==================================================

      let result;

      try {
        result =
          JSON.parse(responseText);
      } catch (jsonError) {
        console.error(
          "JSON parsing error:",
          jsonError
        );

        throw new Error(
          "FastAPI returned an invalid JSON response."
        );
      }

      console.log(
        "AI prediction result:",
        result
      );

      // ==================================================
      // STORE PREDICTION
      // ==================================================

      setPrediction({
        probability:
          result.delay_probability,

        risk:
          result.risk_level,

        prediction:
          result.prediction,

        riskFactors:
          result.risk_factors || [],

        recommendations:
          result.recommendations || [],
      });

      // ==================================================
      // REFRESH PROJECTS
      // ==================================================

      await loadProjects();

    } catch (error) {
      // ==================================================
      // ERROR
      // ==================================================

      console.error(
        "================================"
      );

      console.error(
        "AI Prediction Error:"
      );

      console.error(
        error
      );

      console.error(
        "================================"
      );

      alert(
        "AI Prediction Failed\n\n" +
        error.message
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
  // RECENT PROJECTS
  // ====================================================

  const recentProjects = [
    ...projects,
  ]
    .sort((a, b) => {
      return (
        (b.id || 0) -
        (a.id || 0)
      );
    })
    .slice(0, 5);

  // ====================================================
  // RECENT HIGH RISK
  // ====================================================

  const recentHighRisk =
    highRiskProjects.slice(0, 5);

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
            onClick={openDashboard}
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
              setActivePage(
                "projects"
              );

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
            onClick={
              openPrediction
            }
          >
            🤖 AI Prediction
          </div>

          {/* GIS */}

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
              setActivePage(
                "alerts"
              );

              setShowForm(false);

              setPrediction(null);
            }}
          >
            🔔 Alerts
          </div>

        </nav>

      </aside>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="main">

        {/* HEADER */}

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
            onClick={
              openPrediction
            }
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
              {totalProjects}
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
              {highCount}
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
              {mediumCount}
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
              {lowCount}
            </h2>

            <p>
              Progressing normally
            </p>

          </div>

        </section>

        {/* ==================================================
            PROJECTS PAGE
        ================================================== */}

        {activePage ===
          "projects" && (

          <section
            className="form-panel"
          >

            <div
              className="form-header"
            >

              <div>

                <h2>
                  📋 Projects
                </h2>

                <p>
                  All land acquisition
                  projects stored in
                  the database.
                </p>

              </div>

              <button
                className="predict-btn"
                onClick={
                  openPrediction
                }
              >
                + Add Project
              </button>

            </div>

            <div
              className="projects-table-container"
            >

              {projectsLoading ? (

                <div
                  className="projects-empty"
                >

                  <h2>
                    Loading Projects...
                  </h2>

                  <p>
                    Fetching data
                    from backend.
                  </p>

                </div>

              ) : projectsError ? (

                <div
                  className="projects-empty"
                >

                  <div
                    className="empty-icon"
                  >
                    ⚠️
                  </div>

                  <h2>
                    Backend Connection
                    Error
                  </h2>

                  <p>
                    {projectsError}
                  </p>

                  <button
                    className="predict-btn"
                    onClick={
                      loadProjects
                    }
                  >
                    🔄 Try Again
                  </button>

                </div>

              ) : projects.length ===
                0 ? (

                <div
                  className="projects-empty"
                >

                  <div
                    className="empty-icon"
                  >
                    📁
                  </div>

                  <h2>
                    No Projects Found
                  </h2>

                  <p>
                    Add your first
                    project to start
                    AI analysis.
                  </p>

                  <button
                    className="predict-btn"
                    onClick={
                      openPrediction
                    }
                  >
                    + Add New Project
                  </button>

                </div>

              ) : (

                <table
                  className="projects-table"
                >

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
                      (
                        project,
                        index
                      ) => {

                        const risk =
                          String(
                            project.risk_level ||
                              "LOW"
                          ).toUpperCase();

                        return (

                          <tr
                            key={
                              project.id ||
                              `${project.project_id}-${index}`
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
                                className={`table-risk ${risk.toLowerCase()}`}
                              >

                                {risk ===
                                  "HIGH" &&
                                  "🔴 "}

                                {risk ===
                                  "MEDIUM" &&
                                  "🟡 "}

                                {risk ===
                                  "LOW" &&
                                  "🟢 "}

                                {risk}

                              </span>

                            </td>

                          </tr>

                        );
                      }
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

        {activePage ===
          "map" && (

          <section
            className="form-panel"
          >

            <div
              className="form-header"
            >

              <div>

                <h2>
                  🗺️ GIS Project Map
                </h2>

                <p>
                  Geographic visualization
                  of land acquisition
                  projects.
                </p>

              </div>

              <button
                className="predict-btn"
                onClick={
                  loadProjects
                }
              >
                🔄 Refresh
              </button>

            </div>

            <div
              style={{
                display: "flex",
                gap: "20px",
                marginBottom: "15px",
                flexWrap: "wrap",
              }}
            >

              <div>
                🔴{" "}
                <strong>
                  High Risk
                </strong>
              </div>

              <div>
                🟡{" "}
                <strong>
                  Medium Risk
                </strong>
              </div>

              <div>
                🟢{" "}
                <strong>
                  Low Risk
                </strong>
              </div>

            </div>

            <div className="real-map">

              <MapContainer
                center={[
                  11.1271,
                  78.6569,
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

                {projects.map(
                  (
                    project,
                    index
                  ) => {

                    const district =
                      project.district?.trim();

                    const location =
                      districtLocations[
                        district
                      ];

                    if (!location) {
                      return null;
                    }

                    const risk =
                      String(
                        project.risk_level ||
                          "LOW"
                      ).toUpperCase();

                    return (

                      <Marker
                        key={
                          project.id ||
                          `${project.project_id}-${index}`
                        }
                        position={
                          location
                        }
                        icon={
                          createRiskIcon(
                            risk
                          )
                        }
                      >

                        <Popup>

                          <div
                            style={{
                              minWidth:
                                "220px",
                            }}
                          >

                            <h3
                              style={{
                                marginBottom:
                                  "10px",
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

                              {risk ===
                                "HIGH" &&
                                "🔴 HIGH RISK"}

                              {risk ===
                                "MEDIUM" &&
                                "🟡 MEDIUM RISK"}

                              {risk ===
                                "LOW" &&
                                "🟢 LOW RISK"}

                            </p>

                          </div>

                        </Popup>

                      </Marker>

                    );
                  }
                )}

                {/* DEMO MARKERS */}

                {projects.length ===
                  0 && (

                  <>

                    <Marker
                      position={[
                        13.0827,
                        80.2707,
                      ]}
                      icon={
                        createRiskIcon(
                          "HIGH"
                        )
                      }
                    >

                      <Popup>

                        <strong>
                          Demo Project
                        </strong>

                        <br />

                        Chennai

                        <br />

                        🔴 High Risk

                      </Popup>

                    </Marker>

                    <Marker
                      position={[
                        11.0168,
                        76.9558,
                      ]}
                      icon={
                        createRiskIcon(
                          "MEDIUM"
                        )
                      }
                    >

                      <Popup>

                        <strong>
                          Demo Project
                        </strong>

                        <br />

                        Coimbatore

                        <br />

                        🟡 Medium Risk

                      </Popup>

                    </Marker>

                    <Marker
                      position={[
                        9.9252,
                        78.1198,
                      ]}
                      icon={
                        createRiskIcon(
                          "HIGH"
                        )
                      }
                    >

                      <Popup>

                        <strong>
                          Demo Project
                        </strong>

                        <br />

                        Madurai

                        <br />

                        🔴 High Risk

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

        {activePage ===
          "alerts" && (

          <section
            className="form-panel"
          >

            <div
              className="form-header"
            >

              <div>

                <h2>
                  🔔 Alerts & Notifications
                </h2>

                <p>
                  Projects requiring
                  immediate attention.
                </p>

              </div>

              <button
                className="predict-btn"
                onClick={
                  loadProjects
                }
              >
                🔄 Refresh
              </button>

            </div>

            <div
              className="alerts-container"
            >

              {recentHighRisk.length >
              0 ? (

                recentHighRisk.map(
                  (
                    project,
                    index
                  ) => (

                    <div
                      className="alert-card high-alert"
                      key={
                        project.id ||
                        `${project.project_id}-${index}`
                      }
                    >

                      <div
                        className="alert-icon"
                      >
                        🔴
                      </div>

                      <div>

                        <h3>
                          High Risk Project
                        </h3>

                        <p>

                          <strong>
                            {
                              project.project_id
                            }
                          </strong>{" "}

                          has a{" "}

                          <strong>
                            {
                              project.delay_probability
                            }%
                          </strong>{" "}

                          probability of
                          delay.

                        </p>

                        <small>
                          {
                            project.district
                          }{" "}
                          •{" "}
                          {
                            project.project_type
                          }
                        </small>

                      </div>

                    </div>

                  )
                )

              ) : (

                <div
                  className="alert-card"
                >

                  <div
                    className="alert-icon"
                  >
                    🟢
                  </div>

                  <div>

                    <h3>
                      No High Risk Alerts
                    </h3>

                    <p>
                      No high-risk projects
                      are currently
                      recorded.
                    </p>

                  </div>

                </div>

              )}

              {mediumCount > 0 && (

                <div
                  className="alert-card medium-alert"
                >

                  <div
                    className="alert-icon"
                  >
                    🟡
                  </div>

                  <div>

                    <h3>
                      Medium Risk Projects
                    </h3>

                    <p>
                      {mediumCount} project
                      {mediumCount > 1
                        ? "s are"
                        : " is"}{" "}
                      currently
                      classified as
                      medium risk.
                    </p>

                  </div>

                </div>

              )}

              <div
                className="alert-card"
              >

                <div
                  className="alert-icon"
                >
                  ℹ️
                </div>

                <div>

                  <h3>
                    AI System
                  </h3>

                  <p>
                    AI prediction service
                    is connected to the
                    backend.
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
          activePage ===
            "dashboard" && (

          <>

            <section
              className="dashboard-grid"
            >

              {/* RISK OVERVIEW */}

              <div className="panel">

                <h2>
                  AI Risk Overview
                </h2>

                <div className="risk">

                  <div>

                    <strong>
                      🔴 High Risk
                    </strong>

                    <span>
                      {highCount} Projects
                    </span>

                  </div>

                  <div className="bar">

                    <div
                      className="bar-fill high-bar"
                      style={{
                        width:
                          totalProjects >
                          0
                            ? `${
                                (highCount /
                                  totalProjects) *
                                100
                              }%`
                            : "0%",
                      }}
                    />

                  </div>

                </div>

                <div className="risk">

                  <div>

                    <strong>
                      🟡 Medium Risk
                    </strong>

                    <span>
                      {mediumCount} Projects
                    </span>

                  </div>

                  <div className="bar">

                    <div
                      className="bar-fill medium-bar"
                      style={{
                        width:
                          totalProjects >
                          0
                            ? `${
                                (mediumCount /
                                  totalProjects) *
                                100
                              }%`
                            : "0%",
                      }}
                    />

                  </div>

                </div>

                <div className="risk">

                  <div>

                    <strong>
                      🟢 Low Risk
                    </strong>

                    <span>
                      {lowCount} Projects
                    </span>

                  </div>

                  <div className="bar">

                    <div
                      className="bar-fill low-bar"
                      style={{
                        width:
                          totalProjects >
                          0
                            ? `${
                                (lowCount /
                                  totalProjects) *
                                100
                              }%`
                            : "0%",
                      }}
                    />

                  </div>

                </div>

              </div>

              {/* RECENT HIGH RISK */}

              <div className="panel">

                <h2>
                  Recent High-Risk
                  Projects
                </h2>

                {recentHighRisk.length ===
                0 ? (

                  <div className="project">

                    <div>

                      <strong>
                        No high-risk
                        projects
                      </strong>

                      <p>
                        Everything is
                        currently under
                        control.
                      </p>

                    </div>

                    <span>
                      🟢
                    </span>

                  </div>

                ) : (

                  recentHighRisk
                    .slice(0, 3)
                    .map(
                      (
                        project,
                        index
                      ) => (

                        <div
                          className="project"
                          key={
                            project.id ||
                            `${project.project_id}-${index}`
                          }
                        >

                          <div>

                            <strong>
                              {
                                project.project_id
                              }
                            </strong>

                            <p>
                              {
                                project.district
                              }{" "}
                              –{" "}
                              {
                                project.project_type
                              }
                            </p>

                          </div>

                          <span
                            className="risk-badge"
                          >
                            {
                              project.delay_probability
                            }%
                          </span>

                        </div>

                      )
                    )

                )}

              </div>

            </section>

            {/* RECENT PROJECTS */}

            <section className="panel">

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom:
                    "15px",
                }}
              >

                <div>

                  <h2>
                    Recent Projects
                  </h2>

                  <p>
                    Latest projects
                    analyzed by the
                    AI system.
                  </p>

                </div>

                <button
                  className="predict-btn"
                  onClick={() =>
                    setActivePage(
                      "projects"
                    )
                  }
                >
                  View All →
                </button>

              </div>

              {recentProjects.length ===
              0 ? (

                <div
                  className="projects-empty"
                >

                  <div
                    className="empty-icon"
                  >
                    📁
                  </div>

                  <h2>
                    No Projects Yet
                  </h2>

                  <p>
                    Add a project to
                    begin AI risk
                    analysis.
                  </p>

                </div>

              ) : (

                <div
                  className="projects-table-container"
                >

                  <table
                    className="projects-table"
                  >

                    <thead>

                      <tr>

                        <th>
                          Project
                        </th>

                        <th>
                          District
                        </th>

                        <th>
                          Type
                        </th>

                        <th>
                          Risk
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {recentProjects.map(
                        (
                          project,
                          index
                        ) => {

                          const risk =
                            String(
                              project.risk_level ||
                                "LOW"
                            ).toUpperCase();

                          return (

                            <tr
                              key={
                                project.id ||
                                `${project.project_id}-${index}`
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
                                  project.district
                                }
                              </td>

                              <td>
                                {
                                  project.project_type
                                }
                              </td>

                              <td>

                                <span
                                  className={`table-risk ${risk.toLowerCase()}`}
                                >

                                  {risk ===
                                    "HIGH" &&
                                    "🔴 "}

                                  {risk ===
                                    "MEDIUM" &&
                                    "🟡 "}

                                  {risk ===
                                    "LOW" &&
                                    "🟢 "}

                                  {
                                    project.delay_probability
                                  }%

                                </span>

                              </td>

                            </tr>

                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

            {/* AI PANEL */}

            <section className="ai-panel">

              <div>

                <h2>
                  🤖 AI Delay Prediction
                </h2>

                <p>
                  Analyze land
                  acquisition factors
                  and predict the
                  probability of
                  project delays.
                </p>

              </div>

              <button
                className="predict-btn"
                onClick={
                  openPrediction
                }
              >
                Predict Project Risk →
              </button>

            </section>

            {/* GIS PANEL */}

            <section className="ai-panel">

              <div>

                <h2>
                  🗺️ GIS Project Map
                </h2>

                <p>
                  View project locations
                  and identify
                  high-risk areas
                  geographically.
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

          <section
            className="form-panel"
          >

            <div
              className="form-header"
            >

              <div>

                <h2>
                  🤖 AI Delay Prediction
                </h2>

                <p>
                  Enter project details
                  for AI-based delay
                  prediction.
                </p>

              </div>

              <button
                className="close-btn"
                onClick={closeForm}
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* PROJECT INFORMATION */}

              <h3>
                Project Information
              </h3>

              <div
                className="form-grid"
              >

                {/* PROJECT ID */}

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

                  <label>
                    State
                  </label>

                  <input
                    type="text"
                    name="state"
                    placeholder="Example: Tamil Nadu"
                    defaultValue="Tamil Nadu"
                    required
                  />

                </div>

                {/* DISTRICT */}

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

                  <label>
                    Land Area (Acres)
                  </label>

                  <input
                    type="number"
                    name="landArea"
                    min="0"
                    step="0.01"
                    placeholder="Example: 250"
                    required
                  />

                </div>

                {/* FAMILIES */}

                <div
                  className="input-group"
                >

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

              <div
                className="form-grid"
              >

                {/* COMPENSATION */}

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

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

                {/* REHABILITATION */}

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

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

                <div
                  className="input-group"
                >

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

              {/* ==================================================
                  FORM BUTTONS
              ================================================== */}

              <div
                className="form-actions"
              >

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeForm
                  }
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
                    : "🤖 Predict Delay Risk"}

                </button>

              </div>

            </form>

            {/* ==================================================
                AI RESULT
            ================================================== */}

            {prediction && (

              <div
                className="prediction-result"
              >

                <h2>
                  🤖 AI Prediction Result
                </h2>

                {/* PROBABILITY */}

                <div
                  className="prediction-score"
                >

                  <span>
                    Delay Probability
                  </span>

                  <strong>
                    {prediction.probability}%
                  </strong>

                </div>

                {/* RISK */}

                <div
                  className="prediction-risk"
                  style={{
                    color:
                      getRiskColor(
                        prediction.risk
                      ),
                  }}
                >

                  {String(
                    prediction.risk
                  ).toUpperCase() ===
                    "HIGH" && "🔴"}

                  {String(
                    prediction.risk
                  ).toUpperCase() ===
                    "MEDIUM" && "🟡"}

                  {String(
                    prediction.risk
                  ).toUpperCase() ===
                    "LOW" && "🟢"}

                  {" "}

                  {prediction.risk}

                  {" "}RISK

                </div>

                {/* RISK FACTORS */}

                <div
                  className="risk-factors"
                >

                  <h3>
                    ⚠️ Key Risk Factors
                  </h3>

                  <ul>

                    {prediction
                      .riskFactors
                      .length > 0 ? (

                      prediction
                        .riskFactors
                        .map(
                          (
                            factor,
                            index
                          ) => (

                            <li
                              key={
                                index
                              }
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

                <div
                  className="recommendations"
                >

                  <h3>
                    💡 Recommended Actions
                  </h3>

                  <ul>

                    {prediction
                      .recommendations
                      .length > 0 ? (

                      prediction
                        .recommendations
                        .map(
                          (
                            action,
                            index
                          ) => (

                            <li
                              key={
                                index
                              }
                            >
                              {action}
                            </li>

                          )
                        )

                    ) : (

                      <li>
                        Continue regular
                        monitoring of
                        the project.
                      </li>

                    )}

                  </ul>

                </div>

                {/* RESULT ACTIONS */}

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "20px",
                    flexWrap: "wrap",
                  }}
                >

                  <button
                    className="predict-btn"
                    onClick={() =>
                      setActivePage(
                        "projects"
                      )
                    }
                  >
                    📋 View Projects
                  </button>

                  <button
                    className="cancel-btn"
                    onClick={
                      openDashboard
                    }
                  >
                    🏠 Dashboard
                  </button>

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