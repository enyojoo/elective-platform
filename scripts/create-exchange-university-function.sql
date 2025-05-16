-- Create a function to insert exchange universities
CREATE OR REPLACE FUNCTION insert_exchange_university(
  p_institution_id UUID,
  p_elective_pack_id UUID,
  p_name TEXT,
  p_name_ru TEXT,
  p_country TEXT,
  p_city TEXT,
  p_max_students INTEGER,
  p_status TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO exchange_universities (
    institution_id,
    elective_pack_id,
    name,
    name_ru,
    country,
    city,
    max_students,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_institution_id,
    p_elective_pack_id,
    p_name,
    p_name_ru,
    p_country,
    p_city,
    p_max_students,
    p_status,
    NOW(),
    NOW()
  );
END;
$$ LANGUAGE plpgsql;
