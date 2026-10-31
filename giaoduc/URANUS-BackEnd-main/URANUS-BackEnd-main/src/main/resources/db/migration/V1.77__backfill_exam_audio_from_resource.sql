UPDATE exams e
SET audio_url = cr.file_url
FROM content_resources cr
WHERE cr.attached_exam_id = e.id
  AND (e.audio_url IS NULL OR e.audio_url = '')
  AND UPPER(cr.resource_type) = 'AUDIO'
  AND cr.file_url IS NOT NULL
  AND cr.file_url <> '';
