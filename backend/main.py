from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from database import create_database
import sqlite3


# =============================
# CREATE FASTAPI APP
# =============================

app = FastAPI(
    title="Land Acquisition Delay Prediction API"
)

create_database()


# =============================
# CORS
# =============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================
# LOAD ML MODEL
# =============================

model = joblib.load("land_delay_model.pkl")


# =============================
# PROJECT DATA
# =============================

class ProjectData(BaseModel):

    project_id: str
    project_type: str
    state: str
    district: str

    land_area: float
    affected_families: int

    compensation_percentage: float
    legal_disputes: int
    approval_delay_days: int

    documentation_percentage: float
    approval_percentage: float

    rr_progress: float
    possession_percentage: float

    stakeholder_responsiveness: float


# =============================
# HOME
# =============================

@app.get("/")
def home():

    return {
        "message": "Land Acquisition AI Backend is running"
    }


# =============================
# AI PREDICTION
# =============================

@app.post("/predict")
def predict(data: ProjectData):

    # -------------------------
    # Prepare ML input
    # -------------------------

    input_data = [[
        data.land_area,
        data.affected_families,
        data.compensation_percentage,
        data.legal_disputes,
        data.approval_delay_days,
        data.documentation_percentage,
        data.rr_progress,
        data.possession_percentage,
        data.stakeholder_responsiveness
    ]]


    # -------------------------
    # ML Prediction
    # -------------------------

    prediction = model.predict(input_data)[0]

    probability = model.predict_proba(input_data)[0][1]

    probability_percentage = round(
        probability * 100,
        2
    )


    # -------------------------
    # Risk Level
    # -------------------------

    if probability_percentage >= 70:

        risk_level = "HIGH"

    elif probability_percentage >= 40:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"


    # -------------------------
    # Risk Factors
    # -------------------------

    risk_factors = []

    recommendations = []


    # Compensation

    if data.compensation_percentage < 60:

        risk_factors.append(
            "Low compensation completion"
        )

        recommendations.append(
            "Speed up compensation processing"
        )


    # Legal disputes

    if data.legal_disputes >= 3:

        risk_factors.append(
            "Multiple legal disputes"
        )

        recommendations.append(
            "Prioritize resolution of pending legal disputes"
        )


    # Approval delay

    if data.approval_delay_days > 30:

        risk_factors.append(
            "Long approval processing time"
        )

        recommendations.append(
            "Escalate pending approvals to the concerned department"
        )


    # Documentation

    if data.documentation_percentage < 70:

        risk_factors.append(
            "Incomplete documentation"
        )

        recommendations.append(
            "Complete and verify pending land documents"
        )


    # Rehabilitation

    if data.rr_progress < 60:

        risk_factors.append(
            "Low rehabilitation and resettlement progress"
        )

        recommendations.append(
            "Increase monitoring of rehabilitation and resettlement activities"
        )


    # Possession

    if data.possession_percentage < 60:

        risk_factors.append(
            "Low land possession progress"
        )

        recommendations.append(
            "Prioritize pending land possession activities"
        )


    # Stakeholder responsiveness

    if data.stakeholder_responsiveness < 60:

        risk_factors.append(
            "Low stakeholder responsiveness"
        )

        recommendations.append(
            "Improve coordination with stakeholders"
        )


    # No risk factors

    if not risk_factors:

        risk_factors.append(
            "No major risk factors detected"
        )

        recommendations.append(
            "Continue regular monitoring of the project"
        )


    # =============================
    # SAVE PROJECT TO DATABASE
    # =============================

    connection = sqlite3.connect("projects.db")

    cursor = connection.cursor()


    cursor.execute("""
        INSERT INTO projects (
            project_id,
            project_type,
            state,
            district,
            land_area,
            affected_families,
            compensation_percentage,
            documentation_percentage,
            approval_percentage,
            rr_progress,
            possession_percentage,
            legal_disputes,
            approval_delay_days,
            stakeholder_responsiveness,
            delay_probability,
            risk_level
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (

        data.project_id,
        data.project_type,
        data.state,
        data.district,

        data.land_area,
        data.affected_families,

        data.compensation_percentage,
        data.documentation_percentage,
        data.approval_percentage,

        data.rr_progress,
        data.possession_percentage,

        data.legal_disputes,
        data.approval_delay_days,

        data.stakeholder_responsiveness,

        probability_percentage,
        risk_level
    ))


    connection.commit()

    connection.close()


    # =============================
    # RETURN RESULT
    # =============================

    return {

        "delay_probability": probability_percentage,

        "risk_level": risk_level,

        "prediction": int(prediction),

        "risk_factors": risk_factors,

        "recommendations": recommendations
    }


# =============================
# GET ALL PROJECTS
# =============================

@app.get("/projects")
def get_projects():

    connection = sqlite3.connect("projects.db")

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()


    cursor.execute("""
        SELECT *
        FROM projects
        ORDER BY id DESC
    """)


    projects = cursor.fetchall()

    connection.close()


    return [
        dict(project)
        for project in projects
    ]