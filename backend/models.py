"""Database models for pothole detection app."""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Prediction(db.Model):
    """Top-level video upload + overall prediction summary."""
    __tablename__ = "predictions"

    id = db.Column(db.Integer, primary_key=True)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False, unique=True)
    output_filename = db.Column(db.String(255), nullable=True)  # annotated video

    # Metadata
    file_size_bytes = db.Column(db.BigInteger, nullable=True)
    duration_seconds = db.Column(db.Float, nullable=True)
    total_frames = db.Column(db.Integer, nullable=True)
    fps = db.Column(db.Float, nullable=True)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)

    # Prediction summary
    pothole_frame_count = db.Column(db.Integer, default=0)
    plain_frame_count = db.Column(db.Integer, default=0)
    avg_confidence = db.Column(db.Float, nullable=True)
    max_confidence = db.Column(db.Float, nullable=True)

    # Processing parameters used
    threshold_used = db.Column(db.Float, nullable=True)
    scales_used = db.Column(db.String(100), nullable=True)

    # Status: pending, processing, completed, failed
    status = db.Column(db.String(20), default="pending")
    error_message = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationship: per-frame predictions
    frames = db.relationship(
        "FramePrediction",
        backref="prediction",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_frames=False):
        data = {
            "id": self.id,
            "originalFilename": self.original_filename,
            "storedFilename": self.stored_filename,
            "outputFilename": self.output_filename,
            "fileSizeBytes": self.file_size_bytes,
            "durationSeconds": self.duration_seconds,
            "totalFrames": self.total_frames,
            "fps": self.fps,
            "width": self.width,
            "height": self.height,
            "potholeFrameCount": self.pothole_frame_count,
            "plainFrameCount": self.plain_frame_count,
            "avgConfidence": self.avg_confidence,
            "maxConfidence": self.max_confidence,
            "thresholdUsed": self.threshold_used,
            "scalesUsed": self.scales_used,
            "status": self.status,
            "errorMessage": self.error_message,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
        }
        if include_frames:
            data["frames"] = [f.to_dict() for f in self.frames.order_by(FramePrediction.frame_index)]
        return data


class FramePrediction(db.Model):
    """Per-frame prediction inside a video. Used for timeline visualization."""
    __tablename__ = "frame_predictions"

    id = db.Column(db.Integer, primary_key=True)
    prediction_id = db.Column(
        db.Integer, db.ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False
    )
    frame_index = db.Column(db.Integer, nullable=False)
    timestamp_seconds = db.Column(db.Float, nullable=True)
    confidence = db.Column(db.Float, nullable=False)
    is_pothole = db.Column(db.Boolean, nullable=False)

    __table_args__ = (
        db.Index("ix_frame_prediction_id", "prediction_id", "frame_index"),
    )

    def to_dict(self):
        return {
            "frameIndex": self.frame_index,
            "timestampSeconds": self.timestamp_seconds,
            "confidence": self.confidence,
            "isPothole": self.is_pothole,
        }
