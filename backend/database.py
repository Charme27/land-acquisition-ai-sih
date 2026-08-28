import sqlite3


DATABASE_NAME = "projects.db"


def create_database():

    connection = sqlite3.connect(DATABASE_NAME)

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            project_id TEXT,
            project_type TEXT,
            state TEXT,
            district TEXT,

            land_area REAL,
            affected_families INTEGER,

            compensation_percentage REAL,
            documentation_percentage REAL,
            approval_percentage REAL,

            rr_progress REAL,
            possession_percentage REAL,

            legal_disputes INTEGER,
            approval_delay_days INTEGER,

            stakeholder_responsiveness REAL,

            delay_probability REAL,
            risk_level TEXT

        )
    """)

    connection.commit()

    connection.close()


if __name__ == "__main__":
    create_database()

    print("✅ Database created successfully!")