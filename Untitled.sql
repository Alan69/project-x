-- Connect to performance_review database first
-- 1. Employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    position VARCHAR(200) NOT NULL,
    department VARCHAR(200) NOT NULL,
    hire_date DATE NOT NULL,
    current_grade VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Grade expectations matrix
CREATE TABLE grade_expectations (
    id SERIAL PRIMARY KEY,
    grade_level VARCHAR(50) NOT NULL,
    grade_name VARCHAR(100) NOT NULL,
    description TEXT,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Performance review cycles
CREATE TABLE review_cycles (
    id SERIAL PRIMARY KEY,
    cycle_name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Self-assessment forms
CREATE TABLE self_assessments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    review_cycle_id INTEGER REFERENCES review_cycles(id),
    achievements TEXT NOT NULL,
    self_evaluation TEXT,
    current_grade VARCHAR(50),
    target_grade VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Peer reviewers (confirmation process)
CREATE TABLE peer_reviewers (
    id SERIAL PRIMARY KEY,
    self_assessment_id INTEGER REFERENCES self_assessments(id),
    reviewer_id INTEGER REFERENCES employees(id),
    review_order INTEGER NOT NULL, -- 1st or 2nd reviewer
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, rejected
    confirmed_grade VARCHAR(50),
    feedback TEXT,
    review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Manager reviews
CREATE TABLE manager_reviews (
    id SERIAL PRIMARY KEY,
    self_assessment_id INTEGER REFERENCES self_assessments(id),
    manager_id INTEGER REFERENCES employees(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approved_grade VARCHAR(50),
    feedback TEXT,
    review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Review committees
CREATE TABLE review_committees (
    id SERIAL PRIMARY KEY,
    review_cycle_id INTEGER REFERENCES review_cycles(id),
    committee_name VARCHAR(200) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Committee members
CREATE TABLE committee_members (
    id SERIAL PRIMARY KEY,
    committee_id INTEGER REFERENCES review_committees(id),
    employee_id INTEGER REFERENCES employees(id),
    role VARCHAR(100), -- chair, member, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Committee decisions
CREATE TABLE committee_decisions (
    id SERIAL PRIMARY KEY,
    self_assessment_id INTEGER REFERENCES self_assessments(id),
    committee_id INTEGER REFERENCES review_committees(id),
    final_grade VARCHAR(50) NOT NULL,
    decision TEXT,
    decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Final review notifications
CREATE TABLE review_notifications (
    id SERIAL PRIMARY KEY,
    self_assessment_id INTEGER REFERENCES self_assessments(id),
    employee_id INTEGER REFERENCES employees(id),
    notification_type VARCHAR(50), -- committee_decision, peer_review, manager_review
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create indexes for better performance
CREATE INDEX idx_self_assessments_employee_id ON self_assessments(employee_id);
CREATE INDEX idx_self_assessments_review_cycle_id ON self_assessments(review_cycle_id);
CREATE INDEX idx_peer_reviewers_assessment_id ON peer_reviewers(self_assessment_id);
CREATE INDEX idx_manager_reviews_assessment_id ON manager_reviews(self_assessment_id);
CREATE INDEX idx_committee_decisions_assessment_id ON committee_decisions(self_assessment_id);

-- 12. Insert sample grade expectations
INSERT INTO grade_expectations (grade_level, grade_name, description, requirements) VALUES
('L1', 'Junior Developer', 'Entry level developer position', 'Basic programming skills, willingness to learn'),
('L2', 'Developer', 'Mid-level developer position', 'Solid programming skills, 2-3 years experience'),
('L3', 'Senior Developer', 'Senior level developer position', 'Advanced programming skills, 5+ years experience, mentoring abilities'),
('L4', 'Lead Developer', 'Team lead position', 'Technical leadership, project management, 7+ years experience'),
('L5', 'Principal Developer', 'Principal level position', 'Architecture design, strategic thinking, 10+ years experience');

-- 13. Insert sample review cycle
INSERT INTO review_cycles (cycle_name, start_date, end_date, status) VALUES
('Q4 2024 Performance Review', '2024-10-01', '2024-12-31', 'active');