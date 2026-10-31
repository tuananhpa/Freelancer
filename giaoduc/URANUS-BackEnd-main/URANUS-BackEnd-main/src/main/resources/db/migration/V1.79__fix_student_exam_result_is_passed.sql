-- Fix results where is_passed was incorrectly marked false due to comparing raw total_score directly with passing_score percentage
UPDATE student_exam_results ser
SET is_passed = true
FROM exams e
WHERE ser.exam_id = e.id
  AND ser.submitted_at IS NOT NULL
  AND ser.is_passed = false
  AND (
    -- Case 1: Max score exists in snapshot and calculated percentage meets or exceeds passingScore
    (
      (ser.exam_snapshot->>'maxScore') IS NOT NULL
      AND ((ser.exam_snapshot->>'maxScore')::numeric) > 0
      AND ((ser.total_score / ((ser.exam_snapshot->>'maxScore')::numeric)) * 100) >= COALESCE(e.passing_score, 50.0)
    )
    OR
    -- Case 2: Student achieved full score (e.g. 10/10) or >= 5.0 on a 10-point scale
    (
      ser.total_score >= 10.0
    )
    OR
    (
      ser.total_score >= 5.0 
      AND COALESCE(e.passing_score, 50.0) <= 60.0
      AND (
        (ser.exam_snapshot->>'maxScore') IS NULL 
        OR ((ser.exam_snapshot->>'maxScore')::numeric) <= 10.0
      )
    )
  );
