import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score


# Load the dataset
data = pd.read_csv("dataset.csv")

# Features used by AI
features = [
    "land_area",
    "affected_families",
    "compensation_percentage",
    "legal_disputes",
    "approval_delay_days",
    "documentation_percentage",
    "rr_progress",
    "possession_percentage",
    "stakeholder_responsiveness"
]

X = data[features]
y = data["delayed"]


# Divide data into training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# Create Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)


# Train the AI model
model.fit(X_train, y_train)


# Test the model
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("Model trained successfully!")
print("Accuracy:", round(accuracy * 100, 2), "%")


# Save the trained model
joblib.dump(model, "land_delay_model.pkl")

print("Model saved successfully!")
