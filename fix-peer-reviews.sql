-- Fix existing peer reviews by setting correct reviewer_id values
-- This script updates the peer_reviewers table to set reviewer_id based on review_order

-- Update the first peer review (review_order = 1) to have reviewer_id = 2 (HR)
UPDATE peer_reviewers 
SET reviewer_id = 2 
WHERE id = 31 AND review_order = 1;

-- Update the second peer review (review_order = 2) to have reviewer_id = 3 (Manager)
UPDATE peer_reviewers 
SET reviewer_id = 3 
WHERE id = 32 AND review_order = 2;

-- Verify the changes
SELECT id, self_assessment_id, reviewer_id, review_order, status 
FROM peer_reviewers 
WHERE self_assessment_id = 21 
ORDER BY review_order;
