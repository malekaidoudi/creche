-- Migration: add enrollment status/options and enrollment_documents table

-- Add columns to enrollments if not exist
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS lunch_assistance TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS regulation_accepted TINYINT(1) NOT NULL DEFAULT 0;

-- Create enrollment_documents table
CREATE TABLE IF NOT EXISTS enrollment_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  enrollment_id BIGINT UNSIGNED NOT NULL,
  document_type ENUM('CARNET_MEDICAL','ACTE_NAISSANCE','CERTIFICAT_MEDICAL') NOT NULL,
  upload_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_enrollment (enrollment_id),
  CONSTRAINT fk_enrollment_documents_enrollment
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_documents_upload
    FOREIGN KEY (upload_id) REFERENCES uploads(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
