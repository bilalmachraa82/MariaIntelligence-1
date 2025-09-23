# MariaIntelligence ML Models

This directory contains machine learning model configurations, trained models, and related artifacts for the MariaIntelligence property management system.

## Model Types

### 1. Revenue Forecasting (LSTM)
- **Purpose**: Predict future revenue based on historical data and market conditions
- **Target Accuracy**: 85%+
- **Features**: Historical revenue, occupancy rate, seasonal index, local events, competitor pricing, property rating
- **Use Cases**: Financial planning, pricing optimization, investment decisions

### 2. Occupancy Optimization (Gradient Boosting)
- **Purpose**: Optimize pricing for maximum occupancy and revenue
- **Target Accuracy**: 80%+
- **Features**: Price per night, location score, reviews count, rating, competitor availability, seasonal demand
- **Use Cases**: Dynamic pricing, revenue management, market positioning

### 3. Maintenance Prediction (Random Forest)
- **Purpose**: Predict equipment failures and maintenance needs
- **Target Accuracy**: 90%+
- **Features**: Equipment age, usage hours, maintenance history, environmental conditions, performance metrics
- **Use Cases**: Preventive maintenance, cost reduction, asset management

### 4. Guest Behavior Analysis (Clustering)
- **Purpose**: Segment guests for personalized experiences
- **Target Accuracy**: 75%+
- **Features**: Booking patterns, stay duration, price sensitivity, amenity preferences, review behavior
- **Use Cases**: Marketing personalization, service customization, guest retention

### 5. Demand Pattern Recognition (Time Series)
- **Purpose**: Forecast booking demand and market trends
- **Target Accuracy**: 82%+
- **Features**: Historical bookings, search volume, price trends, event calendar, weather data
- **Use Cases**: Inventory management, staffing decisions, marketing campaigns

## Directory Structure

```
src/ml-models/
├── README.md                 # This file
├── configs/                  # Model configuration files
│   ├── revenue_forecast.json
│   ├── occupancy_optimization.json
│   ├── maintenance_prediction.json
│   ├── guest_behavior.json
│   └── demand_patterns.json
├── trained/                  # Serialized trained models (not in git)
│   ├── revenue_forecast_v1.pkl
│   ├── occupancy_optimization_v1.pkl
│   ├── maintenance_prediction_v1.pkl
│   ├── guest_behavior_v1.pkl
│   └── demand_patterns_v1.pkl
├── experiments/              # Model training experiments and logs
│   └── experiment_logs/
└── validation/              # Model validation reports and test data
    ├── validation_reports/
    └── test_datasets/
```

## Model Development Workflow

1. **Data Collection**: Gather historical data from the property management system
2. **Feature Engineering**: Process and transform raw data into model features
3. **Model Training**: Use the training script to train models with hyperparameter tuning
4. **Validation**: Run comprehensive validation tests for accuracy, performance, and stability
5. **Deployment**: Deploy trained models to the prediction API
6. **Monitoring**: Continuously monitor model performance and drift

## Training Models

Use the training script to train all models or specific models:

```bash
# Train all models
node server/scripts/train-ml-models.js

# Train specific model
node server/scripts/train-ml-models.js --model=revenue_forecast

# Train with validation
node server/scripts/train-ml-models.js --validate

# Export trained models
node server/scripts/train-ml-models.js --export
```

## API Usage

The ML models are accessible through REST API endpoints:

### Make Predictions
```bash
POST /api/predictions/predict
{
  "model": "revenue_forecast",
  "features": [0.75, 1.2, 1.0, 120, 4.5, 5, 6],
  "options": {
    "return_confidence": true,
    "explain_prediction": true
  }
}
```

### Analyze Patterns
```bash
POST /api/predictions/analyze-patterns
{
  "data": [
    {"timestamp": "2024-01-01T00:00:00Z", "value": 100},
    {"timestamp": "2024-01-02T00:00:00Z", "value": 150}
  ],
  "options": {
    "detect_anomalies": true,
    "seasonal_analysis": true,
    "trend_analysis": true
  }
}
```

### Train Models
```bash
POST /api/predictions/train
{
  "model": "revenue_forecast",
  "features": [[0.7, 1.1, 1.0, 100, 4.0, 1, 1], ...],
  "labels": [120.5, 135.2, ...],
  "validation_split": 0.2
}
```

### Check Model Health
```bash
GET /api/predictions/models/revenue_forecast
GET /api/predictions/drift/revenue_forecast
GET /api/predictions/health
```

## Model Performance Targets

| Model | Accuracy Target | Max Processing Time | Notes |
|-------|----------------|-------------------|-------|
| Revenue Forecast | 85% | 2s | LSTM for time series |
| Occupancy Optimization | 80% | 2s | Gradient boosting |
| Maintenance Prediction | 90% | 2s | Random forest |
| Guest Behavior | 75% | 2s | K-means clustering |
| Demand Patterns | 82% | 2s | Time series analysis |

## Data Requirements

### Minimum Data Requirements
- **Revenue Forecast**: 365+ days of historical data
- **Occupancy Optimization**: 500+ booking records
- **Maintenance Prediction**: 100+ maintenance events
- **Guest Behavior**: 1000+ guest records
- **Demand Patterns**: 730+ days of booking data

### Data Quality Standards
- Missing values: <5% per feature
- Data freshness: Updated daily
- Outlier detection: Automated anomaly detection
- Data validation: Schema validation on ingestion

## Monitoring and Maintenance

### Model Drift Detection
- Automatic drift detection runs daily
- Alert when drift score > 0.1
- Retrain recommendations based on drift severity

### Performance Monitoring
- Track prediction latency and accuracy
- Monitor resource usage and scaling needs
- Generate weekly performance reports

### Model Updates
- Scheduled retraining: Monthly for high-frequency models
- Event-driven retraining: After significant data changes
- A/B testing for model updates

## Troubleshooting

### Common Issues

1. **Low Accuracy**
   - Check data quality and feature engineering
   - Increase training data size
   - Tune hyperparameters
   - Consider feature selection

2. **Slow Predictions**
   - Check model complexity
   - Consider model optimization
   - Scale infrastructure if needed

3. **High Drift Score**
   - Investigate data distribution changes
   - Consider retraining with recent data
   - Update feature engineering

4. **Training Failures**
   - Check data format and completeness
   - Validate hyperparameters
   - Review error logs for specific issues

### Support

For issues with ML models:
1. Check the validation reports in `validation/validation_reports/`
2. Review training logs in `experiments/experiment_logs/`
3. Monitor API endpoints for error patterns
4. Contact the ML team for complex issues

## Security Considerations

- Model artifacts are not stored in version control
- API endpoints have rate limiting
- Input validation prevents injection attacks
- Model predictions are logged for audit purposes
- Sensitive data is masked in logs and reports